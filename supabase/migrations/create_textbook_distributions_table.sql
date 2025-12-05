-- =====================================================
-- SF6 (Textbook Ledger) Database Schema
-- =====================================================
-- Tracks textbook distribution to students and accountability
-- Extends the existing books table from SF3
-- =====================================================

-- Create textbook_distributions table
CREATE TABLE IF NOT EXISTS textbook_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    
    -- Distribution details
    school_year VARCHAR(20) NOT NULL, -- e.g., "2024-2025"
    distributed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_return_date DATE,
    actual_return_date DATE,
    
    -- Book condition tracking
    condition_issued VARCHAR(20) NOT NULL DEFAULT 'good',
    condition_returned VARCHAR(20),
    
    -- Accountability status
    distribution_status VARCHAR(20) NOT NULL DEFAULT 'issued',
    -- Possible values: 'issued', 'returned', 'lost', 'damaged', 'replaced'
    
    -- Financial accountability (if book is lost/damaged)
    amount_charged DECIMAL(10, 2) DEFAULT 0.00,
    payment_status VARCHAR(20) DEFAULT 'none',
    -- Possible values: 'none', 'pending', 'partial', 'paid'
    
    -- Additional tracking
    remarks TEXT,
    distributed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    received_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_condition_issued CHECK (condition_issued IN ('excellent', 'good', 'fair', 'poor')),
    CONSTRAINT valid_condition_returned CHECK (condition_returned IN ('excellent', 'good', 'fair', 'poor', 'damaged', 'lost')),
    CONSTRAINT valid_distribution_status CHECK (distribution_status IN ('issued', 'returned', 'lost', 'damaged', 'replaced')),
    CONSTRAINT valid_payment_status CHECK (payment_status IN ('none', 'pending', 'partial', 'paid')),
    CONSTRAINT valid_dates CHECK (expected_return_date >= distributed_date),
    CONSTRAINT valid_return_date CHECK (actual_return_date IS NULL OR actual_return_date >= distributed_date)
);

-- Create indexes for performance
CREATE INDEX idx_textbook_distributions_school ON textbook_distributions(school_id);
CREATE INDEX idx_textbook_distributions_book ON textbook_distributions(book_id);
CREATE INDEX idx_textbook_distributions_student ON textbook_distributions(student_id);
CREATE INDEX idx_textbook_distributions_section ON textbook_distributions(section_id);
CREATE INDEX idx_textbook_distributions_school_year ON textbook_distributions(school_year);
CREATE INDEX idx_textbook_distributions_status ON textbook_distributions(distribution_status);
CREATE INDEX idx_textbook_distributions_distributed_date ON textbook_distributions(distributed_date);
CREATE INDEX idx_textbook_distributions_payment_status ON textbook_distributions(payment_status);

-- Composite indexes for common queries
CREATE INDEX idx_textbook_distributions_school_year_status 
    ON textbook_distributions(school_id, school_year, distribution_status);
CREATE INDEX idx_textbook_distributions_student_year 
    ON textbook_distributions(student_id, school_year);
CREATE INDEX idx_textbook_distributions_book_year 
    ON textbook_distributions(book_id, school_year);

-- Unique constraint: One active distribution per student per book per year
CREATE UNIQUE INDEX idx_unique_active_distribution 
    ON textbook_distributions(school_id, book_id, student_id, school_year)
    WHERE distribution_status = 'issued';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_textbook_distributions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_textbook_distributions_updated_at
    BEFORE UPDATE ON textbook_distributions
    FOR EACH ROW
    EXECUTE FUNCTION update_textbook_distributions_updated_at();

-- Add RLS policies (for future use)
ALTER TABLE textbook_distributions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see distributions from their school
-- CREATE POLICY textbook_distributions_school_isolation ON textbook_distributions
--     USING (school_id = public.get_user_school_id());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON textbook_distributions TO authenticated;
GRANT SELECT ON textbook_distributions TO anon;

-- Add comments for documentation
COMMENT ON TABLE textbook_distributions IS 'DepEd SF6 - Textbook Ledger: Tracks textbook distribution and accountability';
COMMENT ON COLUMN textbook_distributions.distribution_status IS 'Current status: issued, returned, lost, damaged, replaced';
COMMENT ON COLUMN textbook_distributions.condition_issued IS 'Condition when book was issued to student';
COMMENT ON COLUMN textbook_distributions.condition_returned IS 'Condition when book was returned by student';
COMMENT ON COLUMN textbook_distributions.amount_charged IS 'Amount charged if book is lost or damaged';
COMMENT ON COLUMN textbook_distributions.payment_status IS 'Payment status for charged amount';
