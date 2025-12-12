/**
 * Check Teaching Assignments Table Status
 * Quick diagnostic to see what data exists
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zjuxulhxxeeupcskkcok.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdXh1bGh4eGVldXBjc2trY29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzExNDAsImV4cCI6MjA3OTAwNzE0MH0.rwRzqcxVIjPZ0-qmOvEzFkpeEoIRfnyYCWVRP9m1hX0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTeachingAssignments() {
  console.log('🔍 Checking teaching_assignments table...\n');

  // Check total count
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

  console.log('📊 Current Data:');
  console.log(`   Total: ${totalCount}`);
  console.log(`   Advisers (is_advisory=true): ${adviserCount}`);
  console.log(`   Subject teachers (is_advisory=false): ${subjectCount}\n`);

  // Sample records
  const { data: sample } = await supabase
    .from('teaching_assignments')
    .select('id, teacher_id, section_id, grade_level, subject, is_advisory, hours_per_week, learning_area_id')
    .limit(10);

  console.log('📋 Sample Records:');
  console.table(sample);

  // Check sections with advisers
  const { count: sectionsWithAdvisers } = await supabase
    .from('sections')
    .select('*', { count: 'exact', head: true })
    .not('adviser_id', 'is', null);

  console.log(`\n📚 Sections with adviser_id: ${sectionsWithAdvisers}`);

  // Check teachers with JSONB assignments
  const { data: teachersWithAssignments } = await supabase
    .from('teachers')
    .select('id, name, assignments')
    .not('assignments', 'is', null);

  console.log(`👥 Teachers with JSONB assignments: ${teachersWithAssignments?.length || 0}`);
  
  if (teachersWithAssignments && teachersWithAssignments.length > 0) {
    console.log('\n📋 Sample teacher JSONB assignments:');
    console.log(JSON.stringify(teachersWithAssignments[0], null, 2));
  }
}

checkTeachingAssignments().catch(console.error);
