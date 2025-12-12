-- Fix RLS: Allow anon role (since we use Firebase Auth, not Supabase Auth)
-- The authenticated role doesn't apply when using Firebase Auth

DROP POLICY IF EXISTS "Authenticated users can view teaching assignments" ON teaching_assignments;
DROP POLICY IF EXISTS "Authenticated users can manage teaching assignments" ON teaching_assignments;

-- Allow anon role to SELECT (everyone can view - app handles auth)
CREATE POLICY "Allow public read access"
  ON teaching_assignments FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL);

-- Allow anon role to manage (app handles authorization via Firebase)
CREATE POLICY "Allow public write access"
  ON teaching_assignments FOR ALL
  TO anon, authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (deleted_at IS NULL);

-- Verify
SELECT COUNT(*) as should_work_now FROM teaching_assignments;
