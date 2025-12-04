/**
 * SF3 - School Register of Books and Other Instructional Materials
 * Service functions for managing book inventory and issuances
 */

import { supabase } from '../lib/supabase';
import type {
  Book,
  BookIssuance,
  BookWithStats,
  SF3Summary,
  SF3Filter,
  CreateBookInput,
  IssueBookInput,
  ReturnBookInput,
  BookCondition,
} from '../types/bookManagement';

/**
 * Get books with optional filters
 */
export async function getBooks(
  schoolId: string,
  filters?: {
    category?: string;
    subject?: string;
    gradeLevel?: number;
    searchTerm?: string;
  }
): Promise<Book[]> {
  let query = supabase
    .from('books')
    .select('*')
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('title');

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.subject) {
    query = query.eq('subject', filters.subject);
  }

  if (filters?.gradeLevel) {
    query = query.eq('grade_level', filters.gradeLevel);
  }

  if (filters?.searchTerm) {
    query = query.or(
      `title.ilike.%${filters.searchTerm}%,author.ilike.%${filters.searchTerm}%,isbn.ilike.%${filters.searchTerm}%`
    );
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get books with issuance statistics
 */
export async function getBooksWithStats(
  schoolId: string,
  schoolYear: string,
  filters?: {
    category?: string;
    subject?: string;
    gradeLevel?: number;
  }
): Promise<BookWithStats[]> {
  const books = await getBooks(schoolId, filters);

  const booksWithStats: BookWithStats[] = await Promise.all(
    books.map(async (book) => {
      const { data: issuances } = await supabase
        .from('book_issuances')
        .select('status, due_date')
        .eq('book_id', book.id)
        .eq('school_year', schoolYear);

      const issued_count = issuances?.filter((i) => i.status === 'issued').length || 0;
      const lost_count = issuances?.filter((i) => i.status === 'lost').length || 0;
      const damaged_count = issuances?.filter((i) => i.status === 'damaged').length || 0;

      const overdue_count =
        issuances?.filter((i) => {
          if (i.status !== 'issued' || !i.due_date) return false;
          return new Date(i.due_date) < new Date();
        }).length || 0;

      return {
        ...book,
        issued_count,
        overdue_count,
        lost_count,
        damaged_count,
      };
    })
  );

  return booksWithStats;
}

/**
 * Create a new book
 */
export async function createBook(
  schoolId: string,
  input: CreateBookInput,
  userId?: string,
  userName?: string
): Promise<Book> {
  const { data, error } = await supabase
    .from('books')
    .insert({
      school_id: schoolId,
      ...input,
      available_copies: input.total_copies,
      created_by: userId,
      created_by_name: userName,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a book
 */
export async function updateBook(bookId: string, updates: Partial<CreateBookInput>): Promise<Book> {
  const { data, error } = await supabase
    .from('books')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Soft delete a book
 */
export async function deleteBook(bookId: string): Promise<void> {
  const { error } = await supabase
    .from('books')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', bookId);

  if (error) throw error;
}

/**
 * Get book issuances with optional filters
 */
export async function getBookIssuances(
  schoolId: string,
  filters?: SF3Filter
): Promise<BookIssuance[]> {
  let query = supabase
    .from('book_issuances')
    .select(
      `
      *,
      book:books(*),
      student:students(id, student_id, first_name, middle_name, last_name, grade_level, section:sections(name))
    `
    )
    .eq('school_id', schoolId)
    .order('issue_date', { ascending: false });

  if (filters?.schoolYear) {
    query = query.eq('school_year', filters.schoolYear);
  }

  if (filters?.gradeLevel) {
    query = query.eq('student.grade_level', filters.gradeLevel);
  }

  if (filters?.category) {
    query = query.eq('book.category', filters.category);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.studentId) {
    query = query.eq('student_id', filters.studentId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((item: any) => ({
    ...item,
    student: item.student
      ? {
          ...item.student,
          section: item.student.section?.name,
        }
      : undefined,
  }));
}

/**
 * Issue a book to a student
 */
export async function issueBook(
  schoolId: string,
  input: IssueBookInput,
  userId?: string,
  userName?: string
): Promise<BookIssuance> {
  // Check if book is available
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('available_copies')
    .eq('id', input.book_id)
    .single();

  if (bookError) throw bookError;
  if (!book || book.available_copies <= 0) {
    throw new Error('Book is not available for issuance');
  }

  // Create issuance record
  const { data: issuance, error: issuanceError } = await supabase
    .from('book_issuances')
    .insert({
      school_id: schoolId,
      ...input,
      status: 'issued',
      condition_on_issue: input.condition_on_issue || 'Good',
      issued_by: userId,
      issued_by_name: userName,
    })
    .select()
    .single();

  if (issuanceError) throw issuanceError;

  // Update available copies
  const { error: updateError } = await supabase
    .from('books')
    .update({
      available_copies: book.available_copies - 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.book_id);

  if (updateError) throw updateError;

  return issuance;
}

/**
 * Return a book
 */
export async function returnBook(
  input: ReturnBookInput,
  userId?: string,
  userName?: string
): Promise<BookIssuance> {
  // Get current issuance
  const { data: issuance, error: fetchError } = await supabase
    .from('book_issuances')
    .select('*, book:books(available_copies, total_copies)')
    .eq('id', input.issuance_id)
    .single();

  if (fetchError) throw fetchError;
  if (!issuance) throw new Error('Issuance not found');

  // Update issuance record
  const { data: updated, error: updateError } = await supabase
    .from('book_issuances')
    .update({
      status: 'returned',
      return_date: input.return_date || new Date().toISOString().split('T')[0],
      condition_on_return: input.condition_on_return,
      remarks: input.remarks,
      returned_to: userId,
      returned_to_name: userName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.issuance_id)
    .select()
    .single();

  if (updateError) throw updateError;

  // Update available copies
  const book = (issuance as any).book;
  const { error: bookUpdateError } = await supabase
    .from('books')
    .update({
      available_copies: Math.min(book.available_copies + 1, book.total_copies),
      updated_at: new Date().toISOString(),
    })
    .eq('id', (issuance as any).book_id);

  if (bookUpdateError) throw bookUpdateError;

  return updated;
}

/**
 * Mark a book as lost
 */
export async function markBookLost(issuanceId: string, remarks?: string): Promise<BookIssuance> {
  const { data, error } = await supabase
    .from('book_issuances')
    .update({
      status: 'lost',
      remarks: remarks || 'Marked as lost',
      updated_at: new Date().toISOString(),
    })
    .eq('id', issuanceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark a book as damaged
 */
export async function markBookDamaged(issuanceId: string, remarks?: string): Promise<BookIssuance> {
  const { data, error } = await supabase
    .from('book_issuances')
    .update({
      status: 'damaged',
      remarks: remarks || 'Marked as damaged',
      updated_at: new Date().toISOString(),
    })
    .eq('id', issuanceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get SF3 summary statistics
 */
export async function getSF3Summary(
  schoolId: string,
  schoolYear: string,
  filters?: { gradeLevel?: number; subject?: string }
): Promise<SF3Summary> {
  // Get all books
  const books = await getBooks(schoolId, filters);

  // Get all issuances for the school year
  const { data: issuances } = await supabase
    .from('book_issuances')
    .select('*')
    .eq('school_id', schoolId)
    .eq('school_year', schoolYear);

  const allIssuances = issuances || [];

  // Calculate totals
  const total_books = books.length;
  const total_copies = books.reduce((sum, b) => sum + b.total_copies, 0);
  const available_copies = books.reduce((sum, b) => sum + b.available_copies, 0);
  const issued_copies = total_copies - available_copies;

  // By category
  const categoryMap = new Map<string, any>();
  books.forEach((book) => {
    if (!categoryMap.has(book.category)) {
      categoryMap.set(book.category, {
        category: book.category,
        total_books: 0,
        total_copies: 0,
        available: 0,
        issued: 0,
      });
    }
    const cat = categoryMap.get(book.category)!;
    cat.total_books++;
    cat.total_copies += book.total_copies;
    cat.available += book.available_copies;
    cat.issued += book.total_copies - book.available_copies;
  });

  // By grade level
  const gradeMap = new Map<number, any>();
  books
    .filter((b) => b.grade_level)
    .forEach((book) => {
      if (!gradeMap.has(book.grade_level!)) {
        gradeMap.set(book.grade_level!, {
          grade_level: book.grade_level!,
          total_books: 0,
          total_copies: 0,
          available: 0,
          issued: 0,
        });
      }
      const grade = gradeMap.get(book.grade_level!)!;
      grade.total_books++;
      grade.total_copies += book.total_copies;
      grade.available += book.available_copies;
      grade.issued += book.total_copies - book.available_copies;
    });

  // By condition
  const conditionMap = new Map<string, number>();
  books.forEach((book) => {
    conditionMap.set(book.condition, (conditionMap.get(book.condition) || 0) + book.total_copies);
  });

  // Issuance statistics
  const activeIssuances = allIssuances.filter((i) => i.status === 'issued');
  const overdueIssuances = activeIssuances.filter((i) => {
    if (!i.due_date) return false;
    return new Date(i.due_date) < new Date();
  });

  return {
    school_year: schoolYear,
    total_books,
    total_copies,
    available_copies,
    issued_copies,
    by_category: Array.from(categoryMap.values()),
    by_grade: Array.from(gradeMap.values()).sort((a, b) => a.grade_level - b.grade_level),
    by_condition: Array.from(conditionMap.entries()).map(([condition, count]) => ({
      condition: condition as BookCondition,
      count,
    })),
    issuances: {
      total: allIssuances.length,
      active: activeIssuances.length,
      returned: allIssuances.filter((i) => i.status === 'returned').length,
      lost: allIssuances.filter((i) => i.status === 'lost').length,
      damaged: allIssuances.filter((i) => i.status === 'damaged').length,
      overdue: overdueIssuances.length,
    },
  };
}
