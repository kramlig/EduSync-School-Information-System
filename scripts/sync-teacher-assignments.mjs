/**
 * Sync Teacher Assignments from Sections
 * 
 * This script synchronizes teacher assignment data by:
 * 1. Finding all sections where teachers are assigned as advisers
 * 2. Updating the teachers.assignments field with this information
 * 3. Ensuring Teachers Management page shows correct assignments
 * 
 * Run this to fix the issue where teachers show "No assignments" 
 * even though they're assigned to sections as advisers.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zjuxulhxxeeupcskkcok.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdXh1bGh4eGVldXBjc2trY29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzExNDAsImV4cCI6MjA3OTAwNzE0MH0.rwRzqcxVIjPZ0-qmOvEzFkpeEoIRfnyYCWVRP9m1hX0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncTeacherAssignments() {
  console.log('🔄 Syncing teacher assignments from sections...\n');

  try {
    // 1. Get all sections with advisers
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('id, school_id, name, grade_level, school_year, adviser_id')
      .not('adviser_id', 'is', null)
      .order('adviser_id', { ascending: true });

    if (sectionsError) {
      console.error('❌ Error fetching sections:', sectionsError);
      return;
    }

    console.log(`✅ Found ${sections.length} sections with advisers\n`);

    // 2. Group sections by adviser_id
    const adviserSections = new Map();
    for (const section of sections) {
      if (!adviserSections.has(section.adviser_id)) {
        adviserSections.set(section.adviser_id, []);
      }
      adviserSections.get(section.adviser_id).push(section);
    }

    console.log(`📊 Found ${adviserSections.size} teachers with adviser assignments\n`);

    // 3. Update each teacher's assignments field
    let updatedCount = 0;
    let errorCount = 0;

    for (const [teacherId, teacherSections] of adviserSections.entries()) {
      // Get teacher info
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('id, name, assignments')
        .eq('id', teacherId)
        .single();

      if (teacherError || !teacher) {
        console.error(`❌ Teacher ${teacherId} not found, skipping...`);
        errorCount++;
        continue;
      }

      // Build assignments array from sections
      // Each section assignment = adviser role for that section
      const assignments = teacherSections.map(section => ({
        gradeLevel: section.grade_level,
        sectionId: section.id,
        sectionName: section.name,
        schoolYear: section.school_year || 'SY 2024-2025',
        role: 'adviser' // Marking this as an adviser assignment
      }));

      // Merge with existing assignments (if they have learning area assignments too)
      const existingAssignments = teacher.assignments || [];
      const learningAreaAssignments = existingAssignments.filter(a => a.learningAreaId);
      
      // Combine both types of assignments
      const combinedAssignments = [...learningAreaAssignments, ...assignments];

      // Update teacher record
      const { error: updateError } = await supabase
        .from('teachers')
        .update({
          assignments: combinedAssignments,
          updated_at: new Date().toISOString()
        })
        .eq('id', teacherId);

      if (updateError) {
        console.error(`❌ Error updating teacher ${teacher.name}:`, updateError);
        errorCount++;
      } else {
        console.log(`✅ ${teacher.name}: ${assignments.length} section(s) - ${assignments.map(a => `Grade ${a.gradeLevel} ${a.sectionName}`).join(', ')}`);
        updatedCount++;
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   - Teachers updated: ${updatedCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log(`\n✨ Teacher assignments synced successfully!`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

syncTeacherAssignments().catch(console.error);
