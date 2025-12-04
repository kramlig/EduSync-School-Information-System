-- ==========================================
-- SF3: School Register of Books and Other Instructional Materials
-- Tables for tracking textbooks and learning materials
-- ==========================================

-- Books/Materials Inventory
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL,
  
  -- Book Information
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  publisher VARCHAR(255),
  isbn VARCHAR(20),
  book_number VARCHAR(50) UNIQUE, -- Internal tracking number
  
  -- Classification
  category VARCHAR(100) NOT NULL, -- Textbook, Workbook, Reference, etc.
  subject VARCHAR(100), -- Math, Science, English, etc.
  grade_level INTEGER CHECK (grade_level BETWEEN 1 AND 12),
  
  -- Inventory
  total_copies INTEGER NOT NULL DEFAULT 1,
  available_copies INTEGER NOT NULL DEFAULT 1,
  condition VARCHAR(50) DEFAULT 'Good', -- Good, Fair, Poor, Damaged
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  created_by_name VARCHAR(255),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT fk_books_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  CONSTRAINT chk_available_copies CHECK (available_copies >= 0 AND available_copies <= total_copies)
);

-- Book Issuances (track who has which books)
CREATE TABLE IF NOT EXISTS book_issuances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL,
  book_id UUID NOT NULL,
  student_id UUID NOT NULL,
  
  -- Issuance Details
  school_year VARCHAR(20) NOT NULL, -- e.g., "2024-2025"
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  return_date DATE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'issued', -- issued, returned, lost, damaged
  condition_on_issue VARCHAR(50) DEFAULT 'Good',
  condition_on_return VARCHAR(50),
  remarks TEXT,
  
  -- Metadata
  issued_by UUID,
  issued_by_name VARCHAR(255),
  returned_to UUID,
  returned_to_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_issuances_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  CONSTRAINT fk_issuances_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  CONSTRAINT fk_issuances_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT chk_return_after_issue CHECK (return_date IS NULL OR return_date >= issue_date)
);

-- Indexes for books
CREATE INDEX IF NOT EXISTS idx_books_school ON books(school_id);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_subject ON books(subject);
CREATE INDEX IF NOT EXISTS idx_books_grade ON books(grade_level);
CREATE INDEX IF NOT EXISTS idx_books_deleted ON books(deleted_at);

-- Indexes for book_issuances
CREATE INDEX IF NOT EXISTS idx_issuances_school ON book_issuances(school_id);
CREATE INDEX IF NOT EXISTS idx_issuances_book ON book_issuances(book_id);
CREATE INDEX IF NOT EXISTS idx_issuances_student ON book_issuances(student_id);
CREATE INDEX IF NOT EXISTS idx_issuances_school_year ON book_issuances(school_year);
CREATE INDEX IF NOT EXISTS idx_issuances_status ON book_issuances(status);
CREATE INDEX IF NOT EXISTS idx_issuances_issue_date ON book_issuances(issue_date);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_issuances_school_year_status 
  ON book_issuances(school_id, school_year, status);

CREATE INDEX IF NOT EXISTS idx_books_school_subject_grade 
  ON books(school_id, subject, grade_level) WHERE deleted_at IS NULL;

-- Comments
COMMENT ON TABLE books IS 'Inventory of textbooks and instructional materials for SF3 reporting';
COMMENT ON TABLE book_issuances IS 'Tracks book issuance and returns to students for SF3 reporting';
COMMENT ON COLUMN books.book_number IS 'Internal tracking number for physical book identification';
COMMENT ON COLUMN book_issuances.status IS 'Current status: issued, returned, lost, damaged';
COMMENT ON COLUMN book_issuances.condition_on_issue IS 'Book condition when issued to student';
COMMENT ON COLUMN book_issuances.condition_on_return IS 'Book condition when returned by student';
