/**
 * Migrate Teacher Assignment Data to teaching_assignments Table
 * 
 * This script populates the teaching_assignments table (source of truth) from:
 * 1. sections.adviser_id → teaching_assignments (is_advisory=true)
 * 2. teachers.assignments JSONB → teaching_assignments (subject teachers)
 * 
 * After this migration:
 * - Teacher Management UI reads from teaching_assignments
 * - SF7 Forms report from teaching_assignments
 * - Single source of truth, no more sync issues!
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zjuxulhxxeeupcskkcok.supabase.co';
// Use service_role key for migration (bypasses RLS)
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdXh1bGh4eGVldXBjc2trY29rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzQzMTE0MCwiZXhwIjoyMDQ5MDA3MTQwfQ.V9W8VTxHLxFMu-tQ19hqJ-gHvj4e6V-WLBj3cj8ydYY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function migrateTeachingAssignments() {
  console.log('🚀 Starting migration to teaching_assignments table...\n');

  try {
    // Step 1: Check if data already exists
    console.log('🔍 Checking existing data...');
    const { count: existingCount } = await supabase
      .from('teaching_assignments')
      .select('*', { count: 'exact', head: true });

    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing records.`);
      console.log('   Clearing table for fresh migration...\n');
      
      const { error: clearError } = await supabase
        .from('teaching_assignments')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (clearError) {
        console.error('❌ Error clearing table:', clearError);
        return;
      }
    }
    console.log('✅ Ready for migration\n');

    // Step 2: Migrate Section Advisers
    console.log('📚 Migrating section advisers from sections.adviser_id...');
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('id, school_id, name, grade_level, school_year, adviser_id')
      .not('adviser_id', 'is', null);

    if (sectionsError) {
      console.error('❌ Error fetching sections:', sectionsError);
      return;
    }

    console.log(`   Found ${sections.length} sections with advisers`);

    // Create teaching_assignments for advisers
    const adviserAssignments = sections.map(section => ({
      school_id: section.school_id,
      teacher_id: section.adviser_id,
      section_id: section.id,
      grade_level: section.grade_level,
      school_year: section.school_year || '2024-2025',
      subject: 'Section Adviser', // Legacy field
      is_advisory: true,
      hours_per_week: 0, // Advisers don't have teaching hours
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Insert in batches of 500
    let adviserInserted = 0;
    for (let i = 0; i < adviserAssignments.length; i += 500) {
      const batch = adviserAssignments.slice(i, i + 500);
      const { error: insertError } = await supabase
        .from('teaching_assignments')
        .insert(batch);

      if (insertError) {
        console.error(`❌ Error inserting adviser batch ${i / 500 + 1}:`, insertError);
      } else {
        adviserInserted += batch.length;
        console.log(`   Inserted batch ${i / 500 + 1}: ${batch.length} assignments`);
      }
    }

    console.log(`✅ Migrated ${adviserInserted} section adviser assignments\n`);

    // Step 3: Migrate Subject Teachers from teachers.assignments JSONB
    console.log('📖 Migrating subject teachers from teachers.assignments JSONB...');
    const { data: teachers, error: teachersError } = await supabase
      .from('teachers')
      .select('id, school_id, assignments')
      .not('assignments', 'is', null);

    if (teachersError) {
      console.error('❌ Error fetching teachers:', teachersError);
      return;
    }

    console.log(`   Found ${teachers.length} teachers with JSONB assignments`);

    // Build subject teacher assignments from JSONB
    const subjectAssignments = [];
    for (const teacher of teachers) {
      const assignments = teacher.assignments || [];
      
      for (const assignment of assignments) {
        // Skip if this is an adviser assignment (already migrated from sections)
        if (assignment.role === 'adviser' || !assignment.learningAreaId) {
          continue;
        }

        subjectAssignments.push({
          school_id: teacher.school_id,
          teacher_id: teacher.id,
          grade_level: assignment.gradeLevel,
          section_id: assignment.sectionId || null,
          learning_area_id: assignment.learningAreaId,
          school_year: assignment.schoolYear || '2024-2025',
          subject: assignment.learningAreaName || 'Unknown Subject', // Legacy field
          hours_per_week: assignment.hoursPerWeek || 0,
          is_advisory: false,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    console.log(`   Prepared ${subjectAssignments.length} subject teacher assignments`);

    // Insert subject assignments in batches
    let subjectInserted = 0;
    for (let i = 0; i < subjectAssignments.length; i += 500) {
      const batch = subjectAssignments.slice(i, i + 500);
      const { error: insertError } = await supabase
        .from('teaching_assignments')
        .insert(batch);

      if (insertError) {
        console.error(`❌ Error inserting subject batch ${i / 500 + 1}:`, insertError);
      } else {
        subjectInserted += batch.length;
        console.log(`   Inserted batch ${i / 500 + 1}: ${batch.length} assignments`);
      }
    }

    console.log(`✅ Migrated ${subjectInserted} subject teacher assignments\n`);

    // Step 4: Verify Migration
    console.log('🔍 Verifying migration...');
    const { count: totalCount } = await supabase
      .from('teaching_assignments')
      .select('*', { count: 'exact', head: true });

    const { count: adviserCount } = await supabase
      .from('teaching_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('is_advisory', true);

    const { count: subjectCount } = await supabase
      .from('teaching_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('is_advisory', false);

    console.log(`\n📊 Migration Summary:`);
    console.log(`   Total assignments: ${totalCount}`);
    console.log(`   Section advisers: ${adviserCount}`);
    console.log(`   Subject teachers: ${subjectCount}`);

    // Sample query
    const { data: sample } = await supabase
      .from('teaching_assignments')
      .select(`
        id,
        teacher_id,
        section_id,
        grade_level,
        subject,
        is_advisory,
        hours_per_week
      `)
      .limit(5);

    console.log(`\n📋 Sample Records:`);
    console.table(sample);

    console.log(`\n✨ Migration completed successfully!`);
    console.log(`\n📝 Next Steps:`);
    console.log(`   1. Update UI components to read from teaching_assignments`);
    console.log(`   2. Verify Teacher Management page shows correct data`);
    console.log(`   3. Verify SF7 forms still work (they should!)`);
    console.log(`   4. After verification, consider dropping teachers.assignments JSONB column`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

migrateTeachingAssignments().catch(console.error);
