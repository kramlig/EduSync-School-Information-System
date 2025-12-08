-- ==========================================
-- DIVISION AUDIT LOG TABLE
-- ==========================================
-- Tracks all division-level user actions for compliance and security
-- Created: December 8, 2025
-- @see docs/features/DIVISION_LEVEL_ACCESS.md

-- Drop if exists for clean migration
DROP TABLE IF EXISTS division_audit_logs;

-- Create the division audit logs table
CREATE TABLE division_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
    
    -- Actor information
    user_id UUID NOT NULL REFERENCES division_users(id) ON DELETE SET NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    user_role VARCHAR(100),
    
    -- Action details
    action_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'view', 'create', 'update', 'delete', 'export', 'generate'
    action_category VARCHAR(100) NOT NULL, -- 'auth', 'user_management', 'settings', 'reports', 'schools', 'enrollment', 'personnel'
    action_description TEXT NOT NULL,
    
    -- Target resource
    resource_type VARCHAR(100), -- 'division_user', 'division_settings', 'school', 'report', 'sf5', 'sf6', 'sf7'
    resource_id UUID,
    resource_name VARCHAR(255),
    
    -- Context
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL, -- If action was scoped to a specific school
    school_name VARCHAR(255),
    
    -- Data changes (for create/update/delete)
    old_data JSONB,
    new_data JSONB,
    
    -- Request metadata
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    
    -- Status
    status VARCHAR(20) DEFAULT 'success', -- 'success', 'failed', 'partial'
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_division_audit_logs_division_id ON division_audit_logs(division_id);
CREATE INDEX idx_division_audit_logs_user_id ON division_audit_logs(user_id);
CREATE INDEX idx_division_audit_logs_action_type ON division_audit_logs(action_type);
CREATE INDEX idx_division_audit_logs_action_category ON division_audit_logs(action_category);
CREATE INDEX idx_division_audit_logs_resource_type ON division_audit_logs(resource_type);
CREATE INDEX idx_division_audit_logs_created_at ON division_audit_logs(created_at DESC);
CREATE INDEX idx_division_audit_logs_school_id ON division_audit_logs(school_id);

-- Composite index for common queries
CREATE INDEX idx_division_audit_logs_division_date ON division_audit_logs(division_id, created_at DESC);
CREATE INDEX idx_division_audit_logs_user_date ON division_audit_logs(user_id, created_at DESC);

-- Comment on table
COMMENT ON TABLE division_audit_logs IS 'Audit trail for all division-level user actions. Required for DepEd compliance and security monitoring.';

-- Comments on columns
COMMENT ON COLUMN division_audit_logs.action_type IS 'Type of action: login, logout, view, create, update, delete, export, generate';
COMMENT ON COLUMN division_audit_logs.action_category IS 'Category: auth, user_management, settings, reports, schools, enrollment, personnel';
COMMENT ON COLUMN division_audit_logs.resource_type IS 'Type of resource affected: division_user, division_settings, school, report, sf5, sf6, sf7';
COMMENT ON COLUMN division_audit_logs.status IS 'Action status: success, failed, partial';
