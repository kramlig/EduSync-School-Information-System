-- =====================================================
-- Login Audit Table for Security & Compliance
-- Created: December 6, 2025
-- Purpose: Track all login attempts for security auditing
-- =====================================================

-- Create enum for login status
DO $$ BEGIN
    CREATE TYPE login_status AS ENUM ('success', 'failed', 'blocked', 'expired');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create enum for login method
DO $$ BEGIN
    CREATE TYPE login_method AS ENUM ('email_password', 'google_oauth', 'microsoft_oauth', 'magic_link', 'api_key');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- Login Audit Table
-- =====================================================

CREATE TABLE IF NOT EXISTS login_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User identification (nullable for failed attempts with invalid email)
    firebase_uid VARCHAR(128),
    email VARCHAR(255) NOT NULL,
    user_type VARCHAR(20), -- 'teacher', 'student', 'parent', 'admin'
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    
    -- Login details
    login_method login_method DEFAULT 'email_password',
    login_status login_status NOT NULL,
    login_type VARCHAR(20) NOT NULL, -- 'staff', 'student', 'parent' (which tab they used)
    
    -- Security metadata
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(64), -- Optional browser fingerprint
    
    -- Geolocation (optional, for suspicious activity detection)
    geo_country VARCHAR(2),
    geo_city VARCHAR(100),
    
    -- Error details (for failed attempts)
    error_code VARCHAR(50),
    error_message TEXT,
    
    -- Rate limiting
    attempt_count INTEGER DEFAULT 1, -- Number of attempts in current window
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Partition key for efficient querying
    login_date DATE DEFAULT CURRENT_DATE
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_login_audit_firebase_uid ON login_audit(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_login_audit_email ON login_audit(email);

-- Index for security analysis
CREATE INDEX IF NOT EXISTS idx_login_audit_status ON login_audit(login_status);
CREATE INDEX IF NOT EXISTS idx_login_audit_ip ON login_audit(ip_address);

-- Index for date-range queries (compliance reports)
CREATE INDEX IF NOT EXISTS idx_login_audit_date ON login_audit(login_date DESC);
CREATE INDEX IF NOT EXISTS idx_login_audit_created_at ON login_audit(created_at DESC);

-- Composite index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_login_audit_rate_limit 
    ON login_audit(email, ip_address, created_at DESC);

-- Index for school-level reporting
CREATE INDEX IF NOT EXISTS idx_login_audit_school ON login_audit(school_id, login_date DESC);

-- =====================================================
-- Rate Limiting Table (for blocking brute force)
-- =====================================================

CREATE TABLE IF NOT EXISTS rate_limit_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Block target (either IP or email)
    block_type VARCHAR(10) NOT NULL CHECK (block_type IN ('ip', 'email')),
    block_value VARCHAR(255) NOT NULL, -- IP address or email
    
    -- Block details
    reason VARCHAR(100) NOT NULL,
    attempt_count INTEGER DEFAULT 0,
    
    -- Block duration
    blocked_at TIMESTAMPTZ DEFAULT NOW(),
    blocked_until TIMESTAMPTZ NOT NULL,
    
    -- Auto-cleanup
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(block_type, block_value)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_blocks_lookup 
    ON rate_limit_blocks(block_type, block_value, blocked_until);

-- =====================================================
-- Function: Log Login Attempt
-- =====================================================

CREATE OR REPLACE FUNCTION log_login_attempt(
    p_email VARCHAR(255),
    p_firebase_uid VARCHAR(128) DEFAULT NULL,
    p_user_type VARCHAR(20) DEFAULT NULL,
    p_school_id UUID DEFAULT NULL,
    p_login_status login_status DEFAULT 'success',
    p_login_type VARCHAR(20) DEFAULT 'staff',
    p_login_method login_method DEFAULT 'email_password',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_error_code VARCHAR(50) DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO login_audit (
        email,
        firebase_uid,
        user_type,
        school_id,
        login_status,
        login_type,
        login_method,
        ip_address,
        user_agent,
        error_code,
        error_message
    ) VALUES (
        LOWER(p_email),
        p_firebase_uid,
        p_user_type,
        p_school_id,
        p_login_status,
        p_login_type,
        p_login_method,
        p_ip_address,
        p_user_agent,
        p_error_code,
        p_error_message
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: Check Rate Limit
-- =====================================================

CREATE OR REPLACE FUNCTION check_rate_limit(
    p_email VARCHAR(255),
    p_ip_address INET DEFAULT NULL,
    p_max_attempts INTEGER DEFAULT 5,
    p_window_minutes INTEGER DEFAULT 15,
    p_block_minutes INTEGER DEFAULT 30
) RETURNS TABLE (
    is_blocked BOOLEAN,
    block_reason VARCHAR(100),
    blocked_until TIMESTAMPTZ,
    recent_attempts INTEGER
) AS $$
DECLARE
    v_recent_attempts INTEGER;
    v_blocked_until TIMESTAMPTZ;
    v_block_reason VARCHAR(100);
BEGIN
    -- Check if currently blocked
    SELECT rlb.blocked_until, rlb.reason
    INTO v_blocked_until, v_block_reason
    FROM rate_limit_blocks rlb
    WHERE (
        (rlb.block_type = 'email' AND rlb.block_value = LOWER(p_email))
        OR (rlb.block_type = 'ip' AND rlb.block_value = p_ip_address::TEXT)
    )
    AND rlb.blocked_until > NOW()
    LIMIT 1;
    
    IF v_blocked_until IS NOT NULL THEN
        RETURN QUERY SELECT TRUE, v_block_reason, v_blocked_until, 0;
        RETURN;
    END IF;
    
    -- Count recent failed attempts
    SELECT COUNT(*)
    INTO v_recent_attempts
    FROM login_audit la
    WHERE la.email = LOWER(p_email)
    AND la.login_status = 'failed'
    AND la.created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    
    -- If too many attempts, create a block
    IF v_recent_attempts >= p_max_attempts THEN
        INSERT INTO rate_limit_blocks (block_type, block_value, reason, attempt_count, blocked_until)
        VALUES ('email', LOWER(p_email), 'Too many failed login attempts', v_recent_attempts, NOW() + (p_block_minutes || ' minutes')::INTERVAL)
        ON CONFLICT (block_type, block_value) 
        DO UPDATE SET 
            attempt_count = EXCLUDED.attempt_count,
            blocked_until = EXCLUDED.blocked_until,
            blocked_at = NOW();
        
        RETURN QUERY SELECT TRUE, 'Too many failed login attempts'::VARCHAR(100), NOW() + (p_block_minutes || ' minutes')::INTERVAL, v_recent_attempts;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT FALSE, NULL::VARCHAR(100), NULL::TIMESTAMPTZ, v_recent_attempts;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: Get User By Firebase UID (Optimized Single Query)
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_by_firebase_uid(p_firebase_uid VARCHAR(128))
RETURNS TABLE (
    user_id UUID,
    user_type VARCHAR(20),
    email VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(50),
    school_id UUID,
    school_name VARCHAR(255),
    grade_level INTEGER,
    section_id UUID,
    contact_number VARCHAR(20),
    employee_number VARCHAR(50),
    user_position VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100)
) AS $$
BEGIN
    -- Try teachers first (most common for staff login)
    RETURN QUERY
    SELECT 
        t.id AS user_id,
        'teacher'::VARCHAR(20) AS user_type,
        t.email,
        t.name,
        COALESCE(t.role, 'teacher')::VARCHAR(50) AS role,
        t.school_id,
        s.name AS school_name,
        NULL::INTEGER AS grade_level,
        NULL::UUID AS section_id,
        t.phone AS contact_number,
        t.employee_number,
        t.position AS user_position,
        t.first_name,
        t.last_name
    FROM teachers t
    JOIN schools s ON s.id = t.school_id
    WHERE t.firebase_uid = p_firebase_uid
    AND t.deleted_at IS NULL
    LIMIT 1;
    
    IF FOUND THEN RETURN; END IF;
    
    -- Try students
    RETURN QUERY
    SELECT 
        st.id AS user_id,
        'student'::VARCHAR(20) AS user_type,
        st.email,
        CONCAT(st.first_name, ' ', st.last_name)::VARCHAR(255) AS name,
        'student'::VARCHAR(50) AS role,
        st.school_id,
        s.name AS school_name,
        st.grade_level,
        st.section_id,
        st.contact_number,
        NULL::VARCHAR(50) AS employee_number,
        NULL::VARCHAR(50) AS user_position,
        st.first_name::VARCHAR(100),
        st.last_name::VARCHAR(100)
    FROM students st
    JOIN schools s ON s.id = st.school_id
    WHERE st.firebase_uid = p_firebase_uid
    AND st.deleted_at IS NULL
    LIMIT 1;
    
    IF FOUND THEN RETURN; END IF;
    
    -- Try parents
    RETURN QUERY
    SELECT 
        p.id AS user_id,
        'parent'::VARCHAR(20) AS user_type,
        p.email,
        p.name,
        'parent'::VARCHAR(50) AS role,
        p.school_id,
        s.name AS school_name,
        NULL::INTEGER AS grade_level,
        NULL::UUID AS section_id,
        p.contact_number,
        NULL::VARCHAR(50) AS employee_number,
        NULL::VARCHAR(50) AS user_position,
        NULL::VARCHAR(100) AS first_name,
        NULL::VARCHAR(100) AS last_name
    FROM parents p
    JOIN schools s ON s.id = p.school_id
    WHERE p.firebase_uid = p_firebase_uid
    AND p.deleted_at IS NULL
    LIMIT 1;
    
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Cleanup: Auto-delete old audit logs (GDPR compliance)
-- Run this as a cron job or scheduled function
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_login_audit(p_retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM login_audit
    WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Also cleanup expired blocks
    DELETE FROM rate_limit_blocks
    WHERE blocked_until < NOW() - INTERVAL '1 day';
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS Policies
-- =====================================================

-- Login audit should only be readable by admins
-- Note: We use service role key for writes, so no write policy needed
ALTER TABLE login_audit ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for logging from client)
CREATE POLICY login_audit_service_all ON login_audit
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Rate limit blocks - allow service role full access
ALTER TABLE rate_limit_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY rate_limit_blocks_service_all ON rate_limit_blocks
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE login_audit IS 'Tracks all login attempts for security auditing and compliance (90-day retention)';
COMMENT ON TABLE rate_limit_blocks IS 'Temporary blocks for rate limiting brute force attacks';
COMMENT ON FUNCTION get_user_by_firebase_uid IS 'Optimized single-call function to find user across all role tables';
COMMENT ON FUNCTION check_rate_limit IS 'Checks if email/IP is rate limited and blocks if too many failed attempts';
COMMENT ON FUNCTION log_login_attempt IS 'Logs a login attempt for security auditing';
