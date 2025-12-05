/**
 * SF6 (Textbook Ledger) Service Layer
 * Manages textbook distribution and accountability operations
 */

import { supabase } from '../lib/supabase';
import type {
  TextbookDistribution,
  TextbookDistributionWithDetails,
  DistributeTextbookInput,
  ReturnTextbookInput,
  MarkTextbookLostInput,
  RecordPaymentInput,
  SF6Filter,
  SF6Summary,
  StudentTextbookRecord,
  AccountabilityRecord,
} from '../types/textbookDistributions';

// =====================================================
// Query Operations
// =====================================================

/**
 * Get textbook distributions with filters
 */
export async function getTextbookDistributions(
  filter: SF6Filter
): Promise<TextbookDistributionWithDetails[]> {
  try {
    let query = supabase
      .from('textbook_distributions')
      .select(`
        *,
        student:student_id (
          id, lrn, first_name, middle_name, last_name, grade_level
        ),
        book:book_id (
          id, book_number, title, author, publisher, subject, isbn
        ),
        section:section_id (
          id, name, grade_level
        )
      `)
      .eq('school_id', filter.schoolId)
      .eq('school_year', filter.schoolYear)
      .order('distributed_date', { ascending: false });

    if (filter.gradeLevel !== undefined) {
      // Filter will be applied client-side since we can't easily filter on joined tables
    }
  }

  if (filter.sectionId) {
    query = query.eq('section_id', filter.sectionId);
  }

  if (filter.studentId) {
    query = query.eq('student_id', filter.studentId);
  }

  if (filter.bookId) {
    query = query.eq('book_id', filter.bookId);
  }

  if (filter.status) {
    query = query.eq('distribution_status', filter.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching textbook distributions:', error);
    throw error;
  }

  // Client-side search filtering
  let results = data as TextbookDistributionWithDetails[];
  
  if (filter.search && filter.search.trim()) {
    const searchLower = filter.search.toLowerCase();
    results = results.filter(d => 
      d.student.lrn.toLowerCase().includes(searchLower) ||
      d.student.first_name.toLowerCase().includes(searchLower) ||
      d.student.last_name.toLowerCase().includes(searchLower) ||
      d.book.title.toLowerCase().includes(searchLower) ||
      d.book.book_number.toLowerCase().includes(searchLower)
    );
  }

  return results;
  } catch (error) {
    console.error('Error in getTextbookDistributions:', error);
    return [];
  }
}

// =====================================================
// Distribution Operations
// =====================================================

/**
 * Distribute a textbook to a student
 */
export async function distributeTextbook(
  input: DistributeTextbookInput
): Promise<{ success: boolean; distribution?: TextbookDistribution; error?: string }> {
  try {
    // Check if book is available (has available copies)
    const { data: book } = await supabase
      .from('books')
      .select('available_copies')
      .eq('id', input.book_id)
      .single();

    if (!book || book.available_copies <= 0) {
      return {
        success: false,
        error: 'Book is not available for distribution'
      };
    }

    // Check if student already has this book issued
    const { data: existing } = await supabase
      .from('textbook_distributions')
      .select('id')
      .eq('book_id', input.book_id)
      .eq('student_id', input.student_id)
      .eq('school_year', input.school_year)
      .eq('distribution_status', 'issued')
      .single();

    if (existing) {
      return {
        success: false,
        error: 'Student already has this book issued for this school year'
      };
    }

    // Create distribution record
    const { data: distribution, error } = await supabase
      .from('textbook_distributions')
      .insert({
        school_id: input.school_id,
        book_id: input.book_id,
        student_id: input.student_id,
        section_id: input.section_id || null,
        school_year: input.school_year,
        distributed_date: input.distributed_date || new Date().toISOString().split('T')[0],
        expected_return_date: input.expected_return_date || null,
        condition_issued: input.condition_issued,
        distribution_status: 'issued',
        distributed_by: input.distributed_by || null,
        remarks: input.remarks || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Decrement available copies in books table
    await supabase
      .from('books')
      .update({ available_copies: book.available_copies - 1 })
      .eq('id', input.book_id);

    return { success: true, distribution };
  } catch (error) {
    console.error('Error distributing textbook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to distribute textbook'
    };
  }
}

/**
 * Return a textbook from a student
 */
export async function returnTextbook(
  input: ReturnTextbookInput
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current distribution
    const { data: distribution } = await supabase
      .from('textbook_distributions')
      .select('book_id, distribution_status')
      .eq('id', input.distribution_id)
      .single();

    if (!distribution) {
      return { success: false, error: 'Distribution record not found' };
    }

    if (distribution.distribution_status !== 'issued') {
      return { success: false, error: 'Book is not currently issued' };
    }

    // Update distribution record
    const { error: updateError } = await supabase
      .from('textbook_distributions')
      .update({
        actual_return_date: input.actual_return_date,
        condition_returned: input.condition_returned,
        distribution_status: 'returned',
        received_by: input.received_by || null,
        remarks: input.remarks || null,
      })
      .eq('id', input.distribution_id);

    if (updateError) throw updateError;

    // Increment available copies in books table
    const { data: book } = await supabase
      .from('books')
      .select('available_copies')
      .eq('id', distribution.book_id)
      .single();

    if (book) {
      await supabase
        .from('books')
        .update({ available_copies: book.available_copies + 1 })
        .eq('id', distribution.book_id);
    }

    return { success: true };
  } catch (error) {
    console.error('Error returning textbook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to return textbook'
    };
  }
}

/**
 * Mark a textbook as lost
 */
export async function markTextbookLost(
  input: MarkTextbookLostInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('textbook_distributions')
      .update({
        distribution_status: 'lost',
        condition_returned: 'lost',
        amount_charged: input.amount_charged,
        payment_status: input.amount_charged > 0 ? 'pending' : 'none',
        remarks: input.remarks || null,
      })
      .eq('id', input.distribution_id)
      .eq('distribution_status', 'issued'); // Only update if currently issued

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error marking textbook as lost:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark textbook as lost'
    };
  }
}

/**
 * Mark a textbook as damaged
 */
export async function markTextbookDamaged(
  distributionId: string,
  amountCharged: number,
  remarks?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('textbook_distributions')
      .update({
        distribution_status: 'damaged',
        condition_returned: 'damaged',
        amount_charged: amountCharged,
        payment_status: amountCharged > 0 ? 'pending' : 'none',
        remarks: remarks || null,
      })
      .eq('id', distributionId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error marking textbook as damaged:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark textbook as damaged'
    };
  }
}

/**
 * Record payment for lost/damaged textbook
 */
export async function recordPayment(
  input: RecordPaymentInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('textbook_distributions')
      .update({
        payment_status: input.payment_status,
        remarks: input.remarks || null,
      })
      .eq('id', input.distribution_id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error recording payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record payment'
    };
  }
}

// =====================================================
// Summary and Statistics
// =====================================================

/**
 * Get SF6 summary statistics
 */
export async function getSF6Summary(
  filter: { schoolId: string; schoolYear: string; gradeLevel?: number }
): Promise<SF6Summary> {
  try {
    let query = supabase
      .from('textbook_distributions')
      .select(`
        *,
        student:student_id (grade_level),
        book:book_id (subject)
      `)
      .eq('school_id', filter.schoolId)
      .eq('school_year', filter.schoolYear);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching SF6 summary:', error);
      throw error;
    }

    const distributions = data || [];

  // Calculate totals
  const total_distributions = distributions.length;
  const total_books_issued = distributions.filter(d => d.distribution_status === 'issued').length;
  const total_books_returned = distributions.filter(d => d.distribution_status === 'returned').length;
  const total_books_lost = distributions.filter(d => d.distribution_status === 'lost').length;
  const total_books_damaged = distributions.filter(d => d.distribution_status === 'damaged').length;
  const total_outstanding = total_books_issued;

  const total_amount_charged = distributions.reduce((sum, d) => sum + (d.amount_charged || 0), 0);
  const paid_distributions = distributions.filter(d => d.payment_status === 'paid');
  const total_amount_paid = paid_distributions.reduce((sum, d) => sum + (d.amount_charged || 0), 0);
  const total_amount_pending = total_amount_charged - total_amount_paid;

  // Group by grade level
  const gradeMap = new Map<number, any>();
  distributions.forEach(d => {
    if (!d.student) return;
    const grade = d.student.grade_level;
    if (!gradeMap.has(grade)) {
      gradeMap.set(grade, {
        grade_level: grade,
        total_issued: 0,
        total_returned: 0,
        total_lost: 0,
        outstanding: 0,
      });
    }
    const stats = gradeMap.get(grade)!;
    if (d.distribution_status === 'issued') stats.total_issued++;
    if (d.distribution_status === 'returned') stats.total_returned++;
    if (d.distribution_status === 'lost') stats.total_lost++;
    if (d.distribution_status === 'issued') stats.outstanding++;
  });

  // Group by subject
  const subjectMap = new Map<string, any>();
  distributions.forEach(d => {
    if (!d.book) return;
    const subject = d.book.subject;
    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, {
        subject,
        total_issued: 0,
        total_returned: 0,
        total_lost: 0,
        outstanding: 0,
      });
    }
    const stats = subjectMap.get(subject)!;
    if (d.distribution_status === 'issued') stats.total_issued++;
    if (d.distribution_status === 'returned') stats.total_returned++;
    if (d.distribution_status === 'lost') stats.total_lost++;
    if (d.distribution_status === 'issued') stats.outstanding++;
  });

  // Condition summary
  const condition_summary = {
    excellent: distributions.filter(d => d.condition_issued === 'excellent').length,
    good: distributions.filter(d => d.condition_issued === 'good').length,
    fair: distributions.filter(d => d.condition_issued === 'fair').length,
    poor: distributions.filter(d => d.condition_issued === 'poor').length,
    damaged: distributions.filter(d => d.condition_returned === 'damaged').length,
  };

  return {
    total_distributions,
    total_books_issued,
    total_books_returned,
    total_books_lost,
    total_books_damaged,
    total_outstanding,
    total_amount_charged,
    total_amount_paid,
    total_amount_pending,
    by_grade: Array.from(gradeMap.values()).sort((a, b) => a.grade_level - b.grade_level),
    by_subject: Array.from(subjectMap.values()).sort((a, b) => a.subject.localeCompare(b.subject)),
    condition_summary,
  };
  } catch (error) {
    console.error('Error in getSF6Summary:', error);
    // Return empty summary on error
    return {
      total_distributions: 0,
      total_books_issued: 0,
      total_books_returned: 0,
      total_books_lost: 0,
      total_books_damaged: 0,
      total_outstanding: 0,
      total_amount_charged: 0,
      total_amount_paid: 0,
      total_amount_pending: 0,
      by_grade: [],
      by_subject: [],
      condition_summary: {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
        damaged: 0,
      },
    };
  }
}

/**
 * Get student textbook records for accountability report
 */
export async function getStudentTextbookRecords(
  schoolId: string,
  schoolYear: string,
  gradeLevel?: number,
  sectionId?: string
): Promise<StudentTextbookRecord[]> {
  let query = supabase
    .from('students')
    .select(`
      id, lrn, first_name, middle_name, last_name, grade_level,
      section:sections!students_section_id_fkey (name),
      distributions:textbook_distributions!textbook_distributions_student_id_fkey (
        distribution_status, amount_charged, payment_status
      )
    `)
    .eq('school_id', schoolId);

  if (gradeLevel !== undefined) {
    query = query.eq('grade_level', gradeLevel);
  }

  if (sectionId) {
    query = query.eq('section_id', sectionId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching student textbook records:', error);
    throw error;
  }

  const students = data || [];

  return students.map(student => {
    const distributions = student.distributions || [];
    const total_issued = distributions.filter((d: any) => d.distribution_status === 'issued').length;
    const total_returned = distributions.filter((d: any) => d.distribution_status === 'returned').length;
    const total_lost = distributions.filter((d: any) => d.distribution_status === 'lost').length;
    const currently_holding = total_issued;
    
    const total_amount_charged = distributions.reduce((sum: number, d: any) => sum + (d.amount_charged || 0), 0);
    const paid_amount = distributions
      .filter((d: any) => d.payment_status === 'paid')
      .reduce((sum: number, d: any) => sum + (d.amount_charged || 0), 0);
    const balance = total_amount_charged - paid_amount;

    return {
      student_id: student.id,
      student_name: `${student.first_name} ${student.middle_name || ''} ${student.last_name}`.trim(),
      lrn: student.lrn,
      grade_level: student.grade_level,
      section_name: student.section?.name || null,
      total_issued,
      total_returned,
      total_lost,
      currently_holding,
      total_amount_charged,
      total_amount_paid: paid_amount,
      balance,
    };
  });
}
