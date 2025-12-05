/**
 * SF6 (Textbook Ledger) TypeScript Types
 * Tracks textbook distribution and accountability
 */

// =====================================================
// Enums
// =====================================================

export type DistributionStatus = 'issued' | 'returned' | 'lost' | 'damaged' | 'replaced';
export type PaymentStatus = 'none' | 'pending' | 'partial' | 'paid';
export type BookCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'damaged' | 'lost';

// =====================================================
// Core Interfaces
// =====================================================

export interface TextbookDistribution {
  id: string;
  school_id: string;
  book_id: string;
  student_id: string;
  section_id: string | null;
  
  // Distribution details
  school_year: string;
  distributed_date: string; // ISO date string
  expected_return_date: string | null;
  actual_return_date: string | null;
  
  // Condition tracking
  condition_issued: BookCondition;
  condition_returned: BookCondition | null;
  
  // Status
  distribution_status: DistributionStatus;
  
  // Financial accountability
  amount_charged: number;
  payment_status: PaymentStatus;
  
  // Additional info
  remarks: string | null;
  distributed_by: string | null;
  received_by: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Distribution with joined student and book information
export interface TextbookDistributionWithDetails extends TextbookDistribution {
  student: {
    id: string;
    lrn: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    grade_level: number;
  };
  book: {
    id: string;
    book_number: string;
    title: string;
    author: string;
    publisher: string;
    subject: string;
    isbn: string | null;
  };
  section: {
    id: string;
    name: string;
    grade_level: number;
  } | null;
}

// =====================================================
// Request/Input Types
// =====================================================

export interface DistributeTextbookInput {
  school_id: string;
  book_id: string;
  student_id: string;
  section_id?: string;
  school_year: string;
  distributed_date?: string;
  expected_return_date?: string;
  condition_issued: BookCondition;
  distributed_by?: string;
  remarks?: string;
}

export interface ReturnTextbookInput {
  distribution_id: string;
  actual_return_date: string;
  condition_returned: BookCondition;
  received_by?: string;
  remarks?: string;
}

export interface MarkTextbookLostInput {
  distribution_id: string;
  amount_charged: number;
  remarks?: string;
}

export interface RecordPaymentInput {
  distribution_id: string;
  amount_paid: number;
  payment_status: PaymentStatus;
  remarks?: string;
}

// =====================================================
// Filter and Query Types
// =====================================================

export interface SF6Filter {
  school_id: string;
  school_year: string;
  grade_level?: number;
  section_id?: string;
  student_id?: string;
  book_id?: string;
  distribution_status?: DistributionStatus;
  payment_status?: PaymentStatus;
  search?: string; // Search by student name, LRN, or book title
}

// =====================================================
// Summary and Statistics
// =====================================================

export interface SF6Summary {
  total_distributions: number;
  total_books_issued: number;
  total_books_returned: number;
  total_books_lost: number;
  total_books_damaged: number;
  total_outstanding: number; // Currently issued, not returned
  total_amount_charged: number;
  total_amount_paid: number;
  total_amount_pending: number;
  
  // By grade level
  by_grade: {
    grade_level: number;
    total_issued: number;
    total_returned: number;
    total_lost: number;
    outstanding: number;
  }[];
  
  // By subject
  by_subject: {
    subject: string;
    total_issued: number;
    total_returned: number;
    total_lost: number;
    outstanding: number;
  }[];
  
  // By condition
  condition_summary: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    damaged: number;
  };
}

export interface StudentTextbookRecord {
  student_id: string;
  student_name: string;
  lrn: string;
  grade_level: number;
  section_name: string | null;
  total_issued: number;
  total_returned: number;
  total_lost: number;
  currently_holding: number;
  total_amount_charged: number;
  total_amount_paid: number;
  balance: number;
}

// =====================================================
// PDF Export Types
// =====================================================

export interface SF6PDFOptions {
  schoolInfo: {
    name: string;
    schoolId: string;
    division: string;
    region: string;
    district: string;
  };
  schoolYear: string;
  gradeLevel?: number;
  section?: {
    name: string;
    grade_level: number;
  };
  distributions: TextbookDistributionWithDetails[];
  summary: SF6Summary;
  preparedBy: string;
}

// =====================================================
// Accountability Report Types
// =====================================================

export interface AccountabilityRecord {
  student_id: string;
  student_name: string;
  lrn: string;
  grade_level: number;
  books_issued: {
    book_number: string;
    title: string;
    condition_issued: BookCondition;
    distributed_date: string;
  }[];
  books_returned: number;
  books_outstanding: number;
  amount_charged: number;
  amount_paid: number;
  balance: number;
  status: 'clear' | 'pending' | 'with_balance';
}
