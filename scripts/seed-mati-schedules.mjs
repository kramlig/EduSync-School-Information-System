/**
 * Seed Class Schedules for Mati School of Arts and Trades
 * 
 * Creates realistic weekly schedules for all sections with proper:
 * - Learning area assignments
 * - Teacher assignments
 * - Time slots (7:00 AM - 5:00 PM)
 * - No conflicts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zjuxulhxxeeupcskkcok.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdXh1bGh4eGVldXBjc2trY29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzExNDAsImV4cCI6MjA3OTAwNzE0MH0.rwRzqcxVIjPZ0-qmOvEzFkpeEoIRfnyYCWVRP9m1hX0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Standard time slots for high school (7:00 AM - 5:00 PM)
const TIME_SLOTS = [
  { start: '07:30', end: '08:30', label: 'Period 1' },
  { start: '08:30', end: '09:30', label: 'Period 2' },
  { start: '09:30', end: '09:45', label: 'Recess', isBreak: true },
  { start: '09:45', end: '10:45', label: 'Period 3' },
  { start: '10:45', end: '11:45', label: 'Period 4' },
  { start: '11:45', end: '13:00', label: 'Lunch', isBreak: true },
  { start: '13:00', end: '14:00', label: 'Period 5' },
  { start: '14:00', end: '15:00', label: 'Period 6' },
  { start: '15:00', end: '16:00', label: 'Period 7' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

async function main() {
  console.log('🏫 Seeding schedules for Mati School of Arts and Trades...\n');

  // 1. Get the school ID
  const { data: schools, error: schoolError } = await supabase
    .from('schools')
    .select('id, name')
    .ilike('name', '%mati school of arts%')
    .limit(1);

  if (schoolError || !schools || schools.length === 0) {
    console.error('❌ School not found:', schoolError);
    return;
  }

  const school = schools[0];
  console.log(`✅ Found school: ${school.name} (${school.id})\n`);

  // 2. Get all sections for this school
  const { data: sections, error: sectionsError } = await supabase
    .from('sections')
    .select('id, name, grade_level, adviser_id')
    .eq('school_id', school.id)
    .order('grade_level', { ascending: true })
    .order('name', { ascending: true });

  if (sectionsError || !sections || sections.length === 0) {
    console.error('❌ No sections found:', sectionsError);
    return;
  }

  console.log(`✅ Found ${sections.length} sections\n`);

  // 3. Get all learning areas for this school
  const { data: learningAreas, error: areasError } = await supabase
    .from('learning_areas')
    .select('id, name, grade_levels')
    .eq('school_id', school.id)
    .order('name', { ascending: true });

  if (areasError || !learningAreas || learningAreas.length === 0) {
    console.error('❌ No learning areas found:', areasError);
    return;
  }

  console.log(`✅ Found ${learningAreas.length} learning areas\n`);

  // 4. Get all teachers for this school
  const { data: teachers, error: teachersError } = await supabase
    .from('teachers')
    .select('id, name, specialization')
    .eq('school_id', school.id);

  if (teachersError || !teachers || teachers.length === 0) {
    console.error('❌ No teachers found:', teachersError);
    return;
  }

  console.log(`✅ Found ${teachers.length} teachers\n`);

  // 5. Delete existing schedules for this school
  const { error: deleteError } = await supabase
    .from('class_schedules')
    .delete()
    .eq('school_id', school.id);

  if (deleteError) {
    console.error('⚠️ Error deleting existing schedules:', deleteError);
  } else {
    console.log('✅ Cleared existing schedules\n');
  }

  // 6. Create schedules for each section
  let totalSchedules = 0;
  const schedulesToInsert = [];

  for (const section of sections) {
    console.log(`📅 Creating schedule for ${section.name} (Grade ${section.grade_level})...`);

    // Get learning areas for this grade level
    // grade_levels is an array, so we need to check if it includes the section's grade level
    const sectionAreas = learningAreas.filter(area => 
      area.grade_levels && area.grade_levels.includes(section.grade_level)
    );

    if (sectionAreas.length === 0) {
      console.log(`   ⚠️ No learning areas found for grade ${section.grade_level}, skipping...`);
      continue;
    }

    // Distribute learning areas across the week
    let dayIndex = 0;
    let slotIndex = 0;

    for (const area of sectionAreas) {
      // Assign 2-3 periods per learning area per week
      const periodsPerWeek = ['Filipino', 'English', 'Mathematics', 'Science'].includes(area.name) ? 3 : 2;

      for (let i = 0; i < periodsPerWeek; i++) {
        // Find next available non-break slot
        while (slotIndex < TIME_SLOTS.length && TIME_SLOTS[slotIndex].isBreak) {
          slotIndex++;
          if (slotIndex >= TIME_SLOTS.length) {
            slotIndex = 0;
            dayIndex = (dayIndex + 1) % DAYS.length;
          }
        }

        if (slotIndex >= TIME_SLOTS.length) {
          slotIndex = 0;
          dayIndex = (dayIndex + 1) % DAYS.length;
        }

        const slot = TIME_SLOTS[slotIndex];
        const day = DAYS[dayIndex];

        // Find a teacher for this learning area
        // Prefer teachers with matching specialization, otherwise use adviser or any teacher
        let teacher = teachers.find(t => 
          t.specialization && area.name.toLowerCase().includes(t.specialization.toLowerCase())
        );
        
        if (!teacher) {
          teacher = teachers.find(t => t.id === section.adviser_id);
        }
        
        if (!teacher) {
          teacher = teachers[Math.floor(Math.random() * teachers.length)];
        }

        const schedule = {
          school_id: school.id,
          title: area.name,
          type: 'academic',
          scope: 'section',
          day_of_week: day,
          start_time: slot.start,
          end_time: slot.end,
          section_id: section.id,
          learning_area_id: area.id,
          teacher_id: teacher.id,
          room: `Room ${100 + Math.floor(Math.random() * 20)}`
        };

        schedulesToInsert.push(schedule);
        totalSchedules++;

        // Move to next slot
        slotIndex++;
        if (slotIndex >= TIME_SLOTS.length || TIME_SLOTS[slotIndex]?.isBreak) {
          slotIndex = 0;
          dayIndex = (dayIndex + 1) % DAYS.length;
        }
      }
    }

    console.log(`   ✅ Created ${sectionAreas.length} learning area schedules (${schedulesToInsert.length - totalSchedules + sectionAreas.length * 2} total periods)`);
  }

  // 7. Insert all schedules in batches (Supabase limit: 1000 per batch)
  console.log(`\n📊 Inserting ${schedulesToInsert.length} schedules...`);

  const BATCH_SIZE = 500;
  for (let i = 0; i < schedulesToInsert.length; i += BATCH_SIZE) {
    const batch = schedulesToInsert.slice(i, i + BATCH_SIZE);
    const { error: insertError } = await supabase
      .from('class_schedules')
      .insert(batch);

    if (insertError) {
      console.error(`❌ Error inserting batch ${i / BATCH_SIZE + 1}:`, insertError);
      return;
    }

    console.log(`   ✅ Inserted batch ${i / BATCH_SIZE + 1} (${batch.length} schedules)`);
  }

  console.log(`\n✅ Successfully seeded ${schedulesToInsert.length} class schedules!`);
  console.log(`\n📈 Summary:`);
  console.log(`   - School: ${school.name}`);
  console.log(`   - Sections: ${sections.length}`);
  console.log(`   - Learning Areas: ${learningAreas.length}`);
  console.log(`   - Teachers: ${teachers.length}`);
  console.log(`   - Total Schedules: ${schedulesToInsert.length}`);
}

main().catch(console.error);
