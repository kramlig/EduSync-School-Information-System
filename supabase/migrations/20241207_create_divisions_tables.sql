-- =====================================================
-- Division-Level Access: Database Foundation
-- Migration: Create divisions, division_users, and districts tables
-- Created: December 7, 2025
-- Phase: 1 - Foundation (Database Schema)
-- =====================================================

-- =====================================================
-- TABLE: divisions
-- DepEd Division Office entities with hierarchical structure
-- Hierarchy: Region → Division → District → School
-- =====================================================
CREATE TABLE IF NOT EXISTS divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Division Identification
  code VARCHAR(20) NOT NULL UNIQUE,  -- e.g., "DIV-ZAMBOANGA-CITY"
  name VARCHAR(255) NOT NULL,         -- e.g., "Division of Zamboanga City"
  
  -- Hierarchy (Region can have multiple Divisions)
  region VARCHAR(100) NOT NULL,       -- e.g., "Region IX - Zamboanga Peninsula"
  region_code VARCHAR(20),            -- e.g., "REG-IX"
  
  -- Contact Information
  address TEXT,
  city VARCHAR(100),
  province VARCHAR(100),
  
  -- Division Office Contact
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  
  -- Leadership
  superintendent_name VARCHAR(255),   -- Schools Division Superintendent (SDS)
  asst_superintendent_name VARCHAR(255),
  
  -- Settings & Configuration
  settings JSONB DEFAULT '{}'::jsonb,
  /*
    Settings structure:
    {
      "schoolYearStart": "June",
      "reportingDeadlines": {...},
      "enabledModules": ["sf7", "sf1", "sf2", ...],
      "customBranding": {...}
    }
  */
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for divisions
CREATE INDEX IF NOT EXISTS idx_divisions_code ON divisions(code);
CREATE INDEX IF NOT EXISTS idx_divisions_region ON divisions(region);
CREATE INDEX IF NOT EXISTS idx_divisions_region_code ON divisions(region_code);
CREATE INDEX IF NOT EXISTS idx_divisions_is_active ON divisions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_divisions_deleted_at ON divisions(deleted_at);

-- =====================================================
-- ENUM: division_user_role
-- Roles for division-level users
-- =====================================================
DO $$ BEGIN
  CREATE TYPE division_user_role AS ENUM (
    'division_admin',        -- Full access to all division features
    'division_supervisor',   -- Read access + can view reports
    'division_data_manager', -- Can manage data consolidation
    'psds',                  -- Public Schools District Supervisor
    'eps'                    -- Education Program Supervisor
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- TABLE: division_users
-- Users who have division-level access (DepEd personnel)
-- =====================================================
CREATE TABLE IF NOT EXISTS division_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links
  division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- Optional: linked to main users table
  
  -- User Info (for users not in main users table)
  firebase_uid VARCHAR(128),          -- Firebase Auth UID
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  
  -- Role & Permissions
  role division_user_role NOT NULL DEFAULT 'division_supervisor',
  
  -- Granular Permissions (JSONB for flexibility)
  permissions JSONB DEFAULT '{}'::jsonb,
  /*
    Permissions structure:
    {
      "schools": ["read", "write"],       -- Access to school management
      "personnel": ["read"],              -- Access to SF7 personnel data
      "enrollment": ["read", "export"],   -- Access to SF1/SF2 enrollment
      "reports": ["read", "generate"],    -- Access to reports
      "settings": []                      -- No access to settings
    }
  */
  
  -- District Assignment (for PSDS)
  assigned_district_id UUID,            -- FK to districts table (below)
  assigned_district_ids UUID[],         -- Multiple districts if needed
  
  -- School-Level Access (optional: limit to specific schools)
  accessible_school_ids UUID[],         -- Empty = all schools in division
  
  -- Contact
  contact_phone VARCHAR(20),
  position_title VARCHAR(255),          -- e.g., "Education Program Supervisor for Mathematics"
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  UNIQUE(division_id, email)
);

-- Indexes for division_users
CREATE INDEX IF NOT EXISTS idx_division_users_division_id ON division_users(division_id);
CREATE INDEX IF NOT EXISTS idx_division_users_user_id ON division_users(user_id);
CREATE INDEX IF NOT EXISTS idx_division_users_firebase_uid ON division_users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_division_users_email ON division_users(email);
CREATE INDEX IF NOT EXISTS idx_division_users_role ON division_users(role);
CREATE INDEX IF NOT EXISTS idx_division_users_is_active ON division_users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_division_users_deleted_at ON division_users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_division_users_assigned_district ON division_users(assigned_district_id);

-- =====================================================
-- TABLE: districts
-- DepEd Districts within a Division
-- Hierarchy: Region → Division → District → School
-- =====================================================
CREATE TABLE IF NOT EXISTS districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links
  division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  
  -- District Identification
  code VARCHAR(50) NOT NULL,          -- e.g., "DIST-ZC-WEST"
  name VARCHAR(255) NOT NULL,         -- e.g., "West District"
  
  -- PSDS (Public Schools District Supervisor) Info
  psds_name VARCHAR(255),
  psds_contact VARCHAR(255),
  
  -- Geographic Info
  barangays TEXT[],                   -- List of barangays covered
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  UNIQUE(division_id, code)
);

-- Indexes for districts
CREATE INDEX IF NOT EXISTS idx_districts_division_id ON districts(division_id);
CREATE INDEX IF NOT EXISTS idx_districts_code ON districts(code);
CREATE INDEX IF NOT EXISTS idx_districts_is_active ON districts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_districts_deleted_at ON districts(deleted_at);

-- =====================================================
-- ALTER TABLE: schools
-- Add division_id and district_id foreign keys
-- =====================================================
DO $$ BEGIN
  -- Add division_id column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'schools' AND column_name = 'division_id'
  ) THEN
    ALTER TABLE schools ADD COLUMN division_id UUID REFERENCES divisions(id) ON DELETE SET NULL;
    CREATE INDEX idx_schools_division_id ON schools(division_id);
    COMMENT ON COLUMN schools.division_id IS 'Reference to DepEd Division this school belongs to';
  END IF;
  
  -- Add district_id column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'schools' AND column_name = 'district_id'
  ) THEN
    ALTER TABLE schools ADD COLUMN district_id UUID REFERENCES districts(id) ON DELETE SET NULL;
    CREATE INDEX idx_schools_district_id ON schools(district_id);
    COMMENT ON COLUMN schools.district_id IS 'Reference to DepEd District this school belongs to';
  END IF;
END $$;

-- =====================================================
-- Add FK constraint for district assignment in division_users
-- (Must be after districts table is created)
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_division_users_assigned_district'
  ) THEN
    ALTER TABLE division_users
    ADD CONSTRAINT fk_division_users_assigned_district
    FOREIGN KEY (assigned_district_id) REFERENCES districts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on divisions
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS division_users_read_own_division ON divisions;

-- Policy: Division users can read their own division
CREATE POLICY division_users_read_own_division ON divisions
  FOR SELECT
  USING (
    id IN (
      SELECT division_id FROM division_users 
      WHERE firebase_uid = current_setting('app.firebase_uid', true)
      AND is_active = true
      AND deleted_at IS NULL
    )
    OR 
    -- Super admins can read all
    current_setting('app.is_super_admin', true)::boolean = true
  );

-- Enable RLS on division_users
ALTER TABLE division_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS division_users_manage_own ON division_users;

-- Policy: Division admins can manage their division's users
CREATE POLICY division_users_manage_own ON division_users
  FOR ALL
  USING (
    division_id IN (
      SELECT division_id FROM division_users 
      WHERE firebase_uid = current_setting('app.firebase_uid', true)
      AND role = 'division_admin'
      AND is_active = true
      AND deleted_at IS NULL
    )
    OR
    current_setting('app.is_super_admin', true)::boolean = true
  );

-- Enable RLS on districts
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS division_users_read_districts ON districts;

-- Policy: Division users can read districts in their division
CREATE POLICY division_users_read_districts ON districts
  FOR SELECT
  USING (
    division_id IN (
      SELECT division_id FROM division_users 
      WHERE firebase_uid = current_setting('app.firebase_uid', true)
      AND is_active = true
      AND deleted_at IS NULL
    )
    OR
    current_setting('app.is_super_admin', true)::boolean = true
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Get schools accessible by a division user
CREATE OR REPLACE FUNCTION get_accessible_schools_for_division_user(p_firebase_uid VARCHAR)
RETURNS SETOF UUID AS $$
DECLARE
  v_division_user RECORD;
BEGIN
  -- Get division user record
  SELECT * INTO v_division_user 
  FROM division_users 
  WHERE firebase_uid = p_firebase_uid 
    AND is_active = true 
    AND deleted_at IS NULL
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- If specific schools are assigned, return those
  IF v_division_user.accessible_school_ids IS NOT NULL 
     AND array_length(v_division_user.accessible_school_ids, 1) > 0 THEN
    RETURN QUERY SELECT unnest(v_division_user.accessible_school_ids);
    RETURN;
  END IF;
  
  -- If PSDS with assigned district(s), return schools in those districts
  IF v_division_user.role = 'psds' THEN
    IF v_division_user.assigned_district_ids IS NOT NULL 
       AND array_length(v_division_user.assigned_district_ids, 1) > 0 THEN
      RETURN QUERY 
        SELECT s.id FROM schools s 
        WHERE s.district_id = ANY(v_division_user.assigned_district_ids)
          AND s.deleted_at IS NULL;
      RETURN;
    ELSIF v_division_user.assigned_district_id IS NOT NULL THEN
      RETURN QUERY 
        SELECT s.id FROM schools s 
        WHERE s.district_id = v_division_user.assigned_district_id
          AND s.deleted_at IS NULL;
      RETURN;
    END IF;
  END IF;
  
  -- Default: Return all schools in the division
  RETURN QUERY 
    SELECT s.id FROM schools s 
    WHERE s.division_id = v_division_user.division_id
      AND s.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user has permission for a specific action
CREATE OR REPLACE FUNCTION check_division_user_permission(
  p_firebase_uid VARCHAR,
  p_module VARCHAR,
  p_action VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  v_permissions JSONB;
  v_module_permissions JSONB;
BEGIN
  -- Get user's permissions
  SELECT permissions INTO v_permissions
  FROM division_users
  WHERE firebase_uid = p_firebase_uid
    AND is_active = true
    AND deleted_at IS NULL
  LIMIT 1;
  
  IF v_permissions IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if module exists in permissions
  v_module_permissions := v_permissions -> p_module;
  IF v_module_permissions IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if action is allowed
  RETURN v_module_permissions ? p_action;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE divisions IS 'DepEd Division Offices - manages multiple schools in a geographic area';
COMMENT ON TABLE division_users IS 'Users with division-level access (SDS, PSDS, EPS, etc.)';
COMMENT ON TABLE districts IS 'DepEd Districts - subdivision of a Division, managed by PSDS';

COMMENT ON COLUMN divisions.code IS 'Unique identifier code for the division, e.g., DIV-ZAMBOANGA-CITY';
COMMENT ON COLUMN divisions.superintendent_name IS 'Schools Division Superintendent (SDS) name';

COMMENT ON COLUMN division_users.permissions IS 'JSONB object with module-level permissions: { "module": ["action1", "action2"] }';
COMMENT ON COLUMN division_users.accessible_school_ids IS 'If set, limits access to specific schools. Empty/null = all schools in division';

COMMENT ON COLUMN districts.psds_name IS 'Public Schools District Supervisor name';
