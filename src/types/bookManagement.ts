/**
 * SF3 - School Register of Books and Other Instructional Materials
 * TypeScript type definitions for book inventory and issuance tracking
 */

/**
 * Book categories for classification
 */
export type BookCategory = 
  | 'Textbook'
  | 'Workbook'
  | 'Reference Book'
  | 'Manual'
  | 'Dictionary'
  | 'Atlas'
  | 'Other';

/**
 * Book condition assessment
 */
export type BookCondition = 
  | 'Excellent'
  | 'Good'
  | 'Fair'
  | 'Poor'
  | 'Damaged';

/**
 * Book issuance status
 */
export type IssuanceStatus = 
  | 'issued'      // Currently with student
  | 'returned'    // Returned to library
  | 'lost'        // Reported as lost
  | 'damaged';    // Returned damaged

/**
 * Book inventory record
 */
export interface Book {
  id: string;
  school_id: string;
  
  // Book Information
  title: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  book_number?: string;
  
  // Classification
  category: BookCategory;
  subject?: string;
  grade_level?: number;
  
  // Inventory
  total_copies: number;
  available_copies: number;
  condition: BookCondition;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  created_by_name?: string;
  deleted_at?: string;
}

/**
 * Book issuance record
 */
export interface BookIssuance {
  id: string;
  school_id: string;
  book_id: string;
  student_id: string;
  
  // Issuance Details
  school_year: string;
  issue_date: string;
  due_date?: string;
  return_date?: string;
  
  // Status
  status: IssuanceStatus;
  condition_on_issue: BookCondition;
  condition_on_return?: BookCondition;
  remarks?: string;
  
  // Metadata
  issued_by?: string;
  issued_by_name?: string;
  returned_to?: string;
  returned_to_name?: string;
  created_at: string;
  updated_at: string;
  
  // Related data (joined)
  book?: Book;
  student?: {
    id: string;
    student_id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    grade_level: number | string;
    section?: string;
  };
}

/**
 * Book with issuance statistics
 */
export interface BookWithStats extends Book {
  issued_count: number;
  overdue_count: number;
  lost_count: number;
  damaged_count: number;
}

/**
 * Summary statistics for SF3
 */
export interface SF3Summary {
  school_year: string;
  total_books: number;
  total_copies: number;
  available_copies: number;
  issued_copies: number;
  
  by_category: {
    category: BookCategory;
    total_books: number;
    total_copies: number;
    available: number;
    issued: number;
  }[];
  
  by_grade: {
    grade_level: number;
    total_books: number;
    total_copies: number;
    available: number;
    issued: number;
  }[];
  
  by_condition: {
    condition: BookCondition;
    count: number;
  }[];
  
  issuances: {
    total: number;
    active: number;
    returned: number;
    lost: number;
    damaged: number;
    overdue: number;
  };
}

/**
 * Filters for SF3 queries
 */
export interface SF3Filter {
  schoolYear?: string;
  gradeLevel?: number;
  subject?: string;
  category?: BookCategory;
  status?: IssuanceStatus;
  studentId?: string;
}

/**
 * Options for SF3 PDF generation
 */
export interface SF3PDFOptions {
  schoolYear: string;
  gradeLevel?: number;
  subject?: string;
  category?: BookCategory;
  schoolInfo: {
    name: string;
    address: string;
    schoolId: string;
    division: string;
    district: string;
  };
}

/**
 * Input for creating a new book
 */
export interface CreateBookInput {
  title: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  book_number?: string;
  category: BookCategory;
  subject?: string;
  grade_level?: number;
  total_copies: number;
  condition?: BookCondition;
}

/**
 * Input for issuing a book to a student
 */
export interface IssueBookInput {
  book_id: string;
  student_id: string;
  school_year: string;
  due_date?: string;
  condition_on_issue?: BookCondition;
  remarks?: string;
}

/**
 * Input for returning a book
 */
export interface ReturnBookInput {
  issuance_id: string;
  return_date?: string;
  condition_on_return: BookCondition;
  remarks?: string;
}
