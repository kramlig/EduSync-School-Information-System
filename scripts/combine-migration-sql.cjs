/**
 * Combines schema_ddl.sql + combined_migration_objects.sql + RLS + Realtime
 * into a single migration SQL file for the new Supabase project
 */
const fs = require('fs');
const path = require('path');

const basePath = path.resolve(__dirname, '..');

// Read input files
const ddl = fs.readFileSync(path.join(basePath, 'schema_ddl.sql'), 'utf8');
const objects = fs.readFileSync(path.join(basePath, 'supabase', 'combined_migration_objects.sql'), 'utf8');
const rls = fs.readFileSync(path.join(basePath, 'supabase', 'migrations', '20260318_enable_rls_all_tables.sql'), 'utf8');

// Realtime publication for tables used with realtime subscriptions
const realtimeTables = [
  'grades', 'sections', 'ecr_activities', 'announcements',
  'attendance_records', 'schools', 'enrollment_applications',
  'student_health_records', 'parents', 'students', 'teachers',
  'teaching_assignments', 'learning_areas', 'core_values',
  'core_value_grades', 'ecr_scores', 'ecr_weights',
  'ecr_component_grades', 'lesson_plans', 'class_schedules',
  'subscriptions', 'fee_structures', 'student_ledgers',
  'superadmins', 'users', 'division_users', 'divisions',
  'districts'
];

const realtimeSQL = `
-- ############################################################################
-- SECTION: ENABLE REALTIME
-- ############################################################################

-- Add tables to supabase_realtime publication
-- (Supabase uses this publication for realtime subscriptions)

DO $$
DECLARE
  _table TEXT;
  _tables TEXT[] := ARRAY[${realtimeTables.map(t => `'${t}'`).join(', ')}];
BEGIN
  FOREACH _table IN ARRAY _tables LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', _table);
      RAISE NOTICE 'Added % to supabase_realtime', _table;
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE '% already in publication', _table;
      WHEN undefined_table THEN
        RAISE NOTICE '% does not exist, skipping', _table;
    END;
  END LOOP;
END $$;
`;

// Combine everything
let fullSQL = '';
fullSQL += '-- ============================================================================\n';
fullSQL += '-- COMPLETE MIGRATION SQL FOR NEW SUPABASE PROJECT\n';
fullSQL += '-- Project: ojahhzdibhfrjazgwvfw (EduSync SIS)\n';
fullSQL += '-- Generated: ' + new Date().toISOString() + '\n';
fullSQL += '-- ============================================================================\n';
fullSQL += '-- RUN ORDER:\n';
fullSQL += '--   Part 1: Table DDL (CREATE TABLE)\n';
fullSQL += '--   Part 2: Types, Indexes, Functions, Triggers\n';
fullSQL += '--   Part 3: RLS Policies\n';
fullSQL += '--   Part 4: Realtime Publication\n';
fullSQL += '-- ============================================================================\n\n';

fullSQL += '-- ============================================================================\n';
fullSQL += '-- PART 1: TABLE DDL\n';
fullSQL += '-- ============================================================================\n\n';
fullSQL += ddl + '\n\n';

fullSQL += '-- ============================================================================\n';
fullSQL += '-- PART 2: TYPES, INDEXES, FUNCTIONS, TRIGGERS\n';
fullSQL += '-- ============================================================================\n\n';
fullSQL += objects + '\n\n';

fullSQL += '-- ============================================================================\n';
fullSQL += '-- PART 3: RLS POLICIES\n';
fullSQL += '-- ============================================================================\n\n';
fullSQL += rls + '\n\n';

fullSQL += '-- ============================================================================\n';
fullSQL += '-- PART 4: REALTIME PUBLICATION\n';
fullSQL += '-- ============================================================================\n\n';
fullSQL += realtimeSQL + '\n';

fs.writeFileSync(path.join(basePath, 'complete_migration.sql'), fullSQL);
console.log('Generated: complete_migration.sql');
console.log('Size:', (fullSQL.length / 1024).toFixed(1), 'KB');
console.log('Lines:', fullSQL.split('\n').length);

// Also create individual parts for easier execution in SQL Editor
const parts = [
  { name: 'migration_part1_tables.sql', content: ddl },
  { name: 'migration_part2_objects.sql', content: objects },
  { name: 'migration_part3_rls.sql', content: rls },
  { name: 'migration_part4_realtime.sql', content: realtimeSQL }
];

for (const part of parts) {
  fs.writeFileSync(path.join(basePath, part.name), part.content);
  console.log(`  ${part.name}: ${(part.content.length / 1024).toFixed(1)} KB`);
}
