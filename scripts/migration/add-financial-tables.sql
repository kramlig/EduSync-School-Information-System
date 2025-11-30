-- ==========================================
-- Financial Management Tables
-- Date: November 25, 2025
-- ==========================================
-- Adds billing, payments, and financial tracking
-- to the EduSync PostgreSQL schema
-- ==========================================

-- ==========================================
-- FEE STRUCTURES
-- ==========================================

CREATE TABLE fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 0 AND 12),
    school_year VARCHAR(10) NOT NULL, -- e.g., "2024-2025"
    track VARCHAR(50), -- For SHS: Academic, TVL, Sports, Arts
    strand VARCHAR(50), -- For SHS: STEM, ABM, HUMSS, GAS, etc.
    
    -- Tuition
    tuition_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Fixed Fees
    registration_fee DECIMAL(10,2) DEFAULT 0,
    id_fee DECIMAL(10,2) DEFAULT 0,
    insurance_fee DECIMAL(10,2) DEFAULT 0,
    
    -- Miscellaneous Fees (stored as JSONB array)
    -- Format: [{"id": "uuid", "name": "Books", "amount": 500.00, "required": true}]
    misc_fees JSONB DEFAULT '[]',
    
    -- Laboratory Fees (stored as JSONB array)
    -- Format: [{"subject": "Science", "amount": 200.00}]
    lab_fees JSONB DEFAULT '[]',
    
    -- Discounts (as percentages: 0.05 = 5%)
    full_payment_discount DECIMAL(5,4) DEFAULT 0,
    quarterly_discount DECIMAL(5,4) DEFAULT 0,
    monthly_discount DECIMAL(5,4) DEFAULT 0,
    
    -- Payment Terms
    allow_installments BOOLEAN DEFAULT true,
    installment_plans JSONB DEFAULT '[]', -- [{"name": "Quarterly", "payments": 4}, ...]
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    
    -- Ensure unique fee structure per grade/year/track/strand
    UNIQUE(school_id, grade_level, school_year, track, strand)
);

CREATE INDEX idx_fee_structures_school_id ON fee_structures(school_id);
CREATE INDEX idx_fee_structures_grade_level ON fee_structures(grade_level);
CREATE INDEX idx_fee_structures_school_year ON fee_structures(school_year);
CREATE INDEX idx_fee_structures_deleted_at ON fee_structures(deleted_at);

-- ==========================================
-- STUDENT LEDGERS (Account Balances)
-- ==========================================

CREATE TABLE student_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    school_year VARCHAR(10) NOT NULL,
    
    -- Financial Summary
    total_charges DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_payments DECIMAL(10,2) NOT NULL DEFAULT 0,
    balance DECIMAL(10,2) NOT NULL DEFAULT 0, -- total_charges - total_payments
    
    -- Fee Structure Reference
    fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE SET NULL,
    
    -- Charges Breakdown (stored as JSONB array for audit trail)
    -- Format: [{"id": "uuid", "type": "tuition", "amount": 5000.00, "description": "...", "date": "2025-01-15"}]
    charges JSONB DEFAULT '[]',
    
    -- Payments History (stored as JSONB array, links to receipts)
    -- Format: [{"receipt_id": "uuid", "amount": 2500.00, "date": "2025-02-01", "method": "cash"}]
    payments JSONB DEFAULT '[]',
    
    -- Status
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('paid', 'partial', 'pending', 'overdue')),
    last_payment_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- One ledger per student per school year
    UNIQUE(school_id, student_id, school_year)
);

CREATE INDEX idx_student_ledgers_school_id ON student_ledgers(school_id);
CREATE INDEX idx_student_ledgers_student_id ON student_ledgers(student_id);
CREATE INDEX idx_student_ledgers_school_year ON student_ledgers(school_year);
CREATE INDEX idx_student_ledgers_payment_status ON student_ledgers(payment_status);
CREATE INDEX idx_student_ledgers_deleted_at ON student_ledgers(deleted_at);

-- ==========================================
-- RECEIPTS (Official Receipts)
-- ==========================================

CREATE TYPE payment_method AS ENUM (
    'cash',
    'check',
    'bank_transfer',
    'gcash',
    'maya',
    'card',
    'online'
);

CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    ledger_id UUID REFERENCES student_ledgers(id) ON DELETE SET NULL,
    
    -- Receipt Details
    receipt_number VARCHAR(20) UNIQUE NOT NULL, -- Format: OR-2025-00001
    receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Payment Information
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_method payment_method NOT NULL,
    
    -- Payment Method Details
    check_number VARCHAR(50),
    bank_name VARCHAR(100),
    reference_number VARCHAR(100),
    
    -- Transaction Details
    description TEXT,
    notes TEXT,
    
    -- Applied To (which charges this payment covers)
    -- Format: [{"charge_id": "uuid", "amount": 500.00, "description": "Tuition - Q1"}]
    applied_to JSONB DEFAULT '[]',
    
    -- Who recorded the payment
    recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'valid' CHECK (status IN ('valid', 'voided', 'cancelled')),
    voided_at TIMESTAMPTZ,
    voided_by UUID REFERENCES users(id) ON DELETE SET NULL,
    void_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_receipts_school_id ON receipts(school_id);
CREATE INDEX idx_receipts_student_id ON receipts(student_id);
CREATE INDEX idx_receipts_ledger_id ON receipts(ledger_id);
CREATE INDEX idx_receipts_receipt_number ON receipts(receipt_number);
CREATE INDEX idx_receipts_receipt_date ON receipts(receipt_date);
CREATE INDEX idx_receipts_status ON receipts(status);
CREATE INDEX idx_receipts_deleted_at ON receipts(deleted_at);

-- Sequence for receipt numbers (per school, per year)
CREATE SEQUENCE receipt_number_seq START 1;

-- ==========================================
-- PAYMENT PROOFS (Uploaded Payment Evidence)
-- ==========================================

CREATE TABLE payment_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    ledger_id UUID REFERENCES student_ledgers(id) ON DELETE SET NULL,
    
    -- Proof Details
    file_url TEXT NOT NULL, -- Firebase Storage URL or Supabase Storage URL
    file_name VARCHAR(255),
    file_type VARCHAR(50), -- e.g., "image/jpeg", "application/pdf"
    file_size INTEGER, -- in bytes
    
    -- Payment Information
    amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method,
    payment_date DATE,
    reference_number VARCHAR(100),
    
    -- Verification Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    
    -- Link to Receipt (if verified and processed)
    receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
    
    -- Metadata
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_payment_proofs_school_id ON payment_proofs(school_id);
CREATE INDEX idx_payment_proofs_student_id ON payment_proofs(student_id);
CREATE INDEX idx_payment_proofs_ledger_id ON payment_proofs(ledger_id);
CREATE INDEX idx_payment_proofs_status ON payment_proofs(status);
CREATE INDEX idx_payment_proofs_receipt_id ON payment_proofs(receipt_id);
CREATE INDEX idx_payment_proofs_deleted_at ON payment_proofs(deleted_at);

-- ==========================================
-- BILLING STATEMENTS (Monthly Statements)
-- ==========================================

CREATE TABLE billing_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    ledger_id UUID REFERENCES student_ledgers(id) ON DELETE SET NULL,
    
    -- Statement Period
    statement_date DATE NOT NULL,
    school_year VARCHAR(10) NOT NULL,
    
    -- Balance Summary
    previous_balance DECIMAL(10,2) DEFAULT 0,
    new_charges DECIMAL(10,2) DEFAULT 0,
    payments_received DECIMAL(10,2) DEFAULT 0,
    current_balance DECIMAL(10,2) DEFAULT 0,
    
    -- Line Items (charges and payments during period)
    line_items JSONB DEFAULT '[]',
    
    -- Due Information
    due_date DATE,
    minimum_payment DECIMAL(10,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'viewed', 'paid')),
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    
    -- PDF Generation
    pdf_url TEXT, -- Link to generated PDF statement
    pdf_generated_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_billing_statements_school_id ON billing_statements(school_id);
CREATE INDEX idx_billing_statements_student_id ON billing_statements(student_id);
CREATE INDEX idx_billing_statements_ledger_id ON billing_statements(ledger_id);
CREATE INDEX idx_billing_statements_statement_date ON billing_statements(statement_date);
CREATE INDEX idx_billing_statements_school_year ON billing_statements(school_year);
CREATE INDEX idx_billing_statements_status ON billing_statements(status);
CREATE INDEX idx_billing_statements_deleted_at ON billing_statements(deleted_at);

-- ==========================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fee_structures_updated_at BEFORE UPDATE ON fee_structures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_ledgers_updated_at BEFORE UPDATE ON student_ledgers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON receipts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_proofs_updated_at BEFORE UPDATE ON payment_proofs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_statements_updated_at BEFORE UPDATE ON billing_statements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- COMMENTS FOR DOCUMENTATION
-- ==========================================

COMMENT ON TABLE fee_structures IS 'Stores fee structures/plans for different grade levels and tracks';
COMMENT ON TABLE student_ledgers IS 'Individual student account balances and transaction history';
COMMENT ON TABLE receipts IS 'Official payment receipts with unique OR numbers (BIR compliant)';
COMMENT ON TABLE payment_proofs IS 'Uploaded payment evidence (bank deposits, GCash screenshots, etc.)';
COMMENT ON TABLE billing_statements IS 'Monthly billing statements sent to students/parents';

COMMENT ON COLUMN receipts.receipt_number IS 'Unique receipt number format: OR-YYYY-NNNNN (e.g., OR-2025-00001)';
COMMENT ON COLUMN student_ledgers.balance IS 'Current balance = total_charges - total_payments (auto-calculated)';
COMMENT ON COLUMN fee_structures.misc_fees IS 'Array of misc fees: [{"id": "uuid", "name": "Books", "amount": 500, "required": true}]';

-- ==========================================
-- SAMPLE DATA (Optional - for development)
-- ==========================================

-- Example: Fee Structure for Grade 1 (2024-2025)
-- INSERT INTO fee_structures (school_id, grade_level, school_year, tuition_amount, registration_fee, id_fee, insurance_fee, misc_fees)
-- VALUES (
--     (SELECT id FROM schools LIMIT 1),
--     1,
--     '2024-2025',
--     5000.00,
--     500.00,
--     150.00,
--     300.00,
--     '[
--         {"id": "1", "name": "Books", "amount": 800.00, "required": true, "description": "Required textbooks"},
--         {"id": "2", "name": "Uniform", "amount": 600.00, "required": true, "description": "School uniform set"},
--         {"id": "3", "name": "Activity Fee", "amount": 400.00, "required": true, "description": "Field trips and activities"}
--     ]'::jsonb
-- );
