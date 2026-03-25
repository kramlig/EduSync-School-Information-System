-- =====================================================
-- Migration 004: School Invitation System
-- 
-- Allows school admins to invite personal workspace teachers
-- to join an institutional school. Invited teachers can
-- import or archive their personal data.
-- =====================================================

-- 1. School Invitations Table
CREATE TABLE IF NOT EXISTS school_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  invite_code TEXT NOT NULL,
  invited_email TEXT,              -- Optional: restrict to specific email
  invited_by TEXT NOT NULL,        -- Firebase UID of admin who created it
  role TEXT NOT NULL DEFAULT 'teacher',  -- 'teacher' | 'admin'
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  accepted_by TEXT,               -- Firebase UID of teacher who accepted
  accepted_at TIMESTAMPTZ,
  data_action TEXT CHECK (data_action IN ('import', 'archive', 'delete')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  max_uses INTEGER NOT NULL DEFAULT 1,
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique invite codes
CREATE UNIQUE INDEX IF NOT EXISTS idx_invite_code ON school_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_invite_school ON school_invitations(school_id);
CREATE INDEX IF NOT EXISTS idx_invite_email ON school_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_invite_status ON school_invitations(status);

-- 2. Migration tracking table (records personal→school data migrations)
CREATE TABLE IF NOT EXISTS workspace_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID REFERENCES school_invitations(id),
  teacher_uid TEXT NOT NULL,       -- Firebase UID
  source_school_id UUID NOT NULL,  -- Personal workspace school ID
  target_school_id UUID NOT NULL,  -- Institutional school ID
  action TEXT NOT NULL CHECK (action IN ('import', 'archive', 'delete')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  students_migrated INTEGER DEFAULT 0,
  grades_migrated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_migration_teacher ON workspace_migrations(teacher_uid);
CREATE INDEX IF NOT EXISTS idx_migration_source ON workspace_migrations(source_school_id);

-- 3. RPC: Validate and accept an invitation
CREATE OR REPLACE FUNCTION accept_school_invitation(
  p_invite_code TEXT,
  p_firebase_uid TEXT,
  p_teacher_name TEXT,
  p_teacher_email TEXT,
  p_data_action TEXT DEFAULT 'archive'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_invitation RECORD;
  v_school RECORD;
  v_teacher_id UUID;
  v_personal_school_id UUID;
BEGIN
  -- 1. Find and validate the invitation
  SELECT * INTO v_invitation
  FROM school_invitations
  WHERE invite_code = UPPER(p_invite_code)
    AND status = 'pending'
    AND expires_at > NOW()
    AND use_count < max_uses;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation code');
  END IF;

  -- 2. Check email restriction if set
  IF v_invitation.invited_email IS NOT NULL 
     AND LOWER(v_invitation.invited_email) != LOWER(p_teacher_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation was sent to a different email address');
  END IF;

  -- 3. Get the target school
  SELECT * INTO v_school FROM schools WHERE id = v_invitation.school_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'School not found');
  END IF;

  -- 4. Check if teacher already exists in this school
  IF EXISTS (
    SELECT 1 FROM teachers 
    WHERE school_id = v_invitation.school_id 
      AND (firebase_uid = p_firebase_uid OR email = p_teacher_email)
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are already a member of this school');
  END IF;

  -- 5. Create teacher record in the institutional school
  INSERT INTO teachers (school_id, name, email, firebase_uid, role, workspace_type, status)
  VALUES (
    v_invitation.school_id,
    p_teacher_name,
    p_teacher_email,
    p_firebase_uid,
    v_invitation.role,
    'institutional',
    'active'
  )
  RETURNING id INTO v_teacher_id;

  -- 6. Get personal workspace school ID (if exists)
  SELECT id INTO v_personal_school_id
  FROM schools
  WHERE owner_uid = p_firebase_uid AND type = 'personal';

  -- 7. Record the migration intent
  IF v_personal_school_id IS NOT NULL THEN
    INSERT INTO workspace_migrations (
      invitation_id, teacher_uid, source_school_id, target_school_id, action
    ) VALUES (
      v_invitation.id, p_firebase_uid, v_personal_school_id, v_invitation.school_id, p_data_action
    );
  END IF;

  -- 8. Mark invitation as accepted
  UPDATE school_invitations
  SET status = 'accepted',
      accepted_by = p_firebase_uid,
      accepted_at = NOW(),
      data_action = p_data_action,
      use_count = use_count + 1,
      updated_at = NOW()
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object(
    'success', true,
    'teacher_id', v_teacher_id,
    'school_id', v_invitation.school_id,
    'school_name', v_school.name,
    'role', v_invitation.role,
    'has_personal_data', v_personal_school_id IS NOT NULL
  );
END;
$$;

-- 4. RPC: Create an invitation (for school admins)
CREATE OR REPLACE FUNCTION create_school_invitation(
  p_school_id UUID,
  p_invited_by TEXT,
  p_email TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'teacher',
  p_max_uses INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_school RECORD;
  v_attempts INTEGER := 0;
BEGIN
  -- Verify school exists and caller is admin
  SELECT * INTO v_school FROM schools WHERE id = p_school_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'School not found');
  END IF;

  -- Generate unique 8-character invite code
  LOOP
    v_code := UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM school_invitations WHERE invite_code = v_code);
    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Could not generate unique code');
    END IF;
  END LOOP;

  INSERT INTO school_invitations (school_id, invite_code, invited_email, invited_by, role, max_uses)
  VALUES (p_school_id, v_code, p_email, p_invited_by, p_role, p_max_uses);

  RETURN jsonb_build_object(
    'success', true,
    'invite_code', v_code,
    'school_name', v_school.name,
    'expires_at', (NOW() + INTERVAL '30 days')::TEXT
  );
END;
$$;
