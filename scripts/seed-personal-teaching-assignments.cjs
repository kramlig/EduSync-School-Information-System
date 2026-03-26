#!/usr/bin/env node
/**
 * Seed teaching_assignments for existing personal workspaces.
 *
 * For each personal workspace school, finds all sections and calls
 * auto_assign_personal_section RPC to create teaching_assignments
 * rows linking the owner teacher to all learning areas.
 *
 * Prerequisites:
 *   - SUPABASE_SERVICE_ROLE_KEY env var
 *   - Migration 006_personal_ecr_support.sql already applied
 *
 * Usage:
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
 *   node scripts/seed-personal-teaching-assignments.cjs
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zjuxulhxxeeupcskkcok.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

async function main() {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY env var.');
    console.log('Set it with:');
    console.log('  $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  console.log('\n📋 SEED TEACHING ASSIGNMENTS FOR PERSONAL WORKSPACES');
  console.log('═'.repeat(60));

  // 1. Find all personal workspace schools
  const { data: personalSchools, error: schoolErr } = await supabase
    .from('schools')
    .select('id, name, owner_uid, tier, current_school_year')
    .eq('type', 'personal');

  if (schoolErr) {
    console.error('❌ Failed to fetch personal schools:', schoolErr.message);
    process.exit(1);
  }

  if (!personalSchools || personalSchools.length === 0) {
    console.log('ℹ️  No personal workspaces found. Nothing to seed.');
    return;
  }

  console.log(`Found ${personalSchools.length} personal workspace(s)\n`);

  let totalAssignments = 0;

  for (const school of personalSchools) {
    console.log(`\n🏫 ${school.name} (${school.id})`);
    console.log(`   Tier: ${school.tier} | School Year: ${school.current_school_year || '2025-2026'}`);

    // 2. Find the owner teacher
    const { data: teachers, error: teachErr } = await supabase
      .from('teachers')
      .select('id, name, firebase_uid')
      .eq('school_id', school.id)
      .eq('workspace_type', 'personal')
      .limit(1);

    if (teachErr || !teachers || teachers.length === 0) {
      console.log('   ⚠️  No teacher found, skipping');
      continue;
    }

    const teacher = teachers[0];
    console.log(`   👤 Teacher: ${teacher.name} (${teacher.id})`);

    // 3. Find all sections for this school
    const { data: sections, error: secErr } = await supabase
      .from('sections')
      .select('id, name, grade_level, school_year')
      .eq('school_id', school.id)
      .is('deleted_at', null);

    if (secErr || !sections || sections.length === 0) {
      console.log('   ⚠️  No sections found, skipping');
      continue;
    }

    console.log(`   📚 Sections: ${sections.length}`);

    // 4. Check existing assignments
    const { count: existingCount } = await supabase
      .from('teaching_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', school.id)
      .eq('teacher_id', teacher.id)
      .is('deleted_at', null);

    if (existingCount && existingCount > 0) {
      console.log(`   ✅ Already has ${existingCount} assignment(s), skipping`);
      continue;
    }

    // 5. Call auto_assign_personal_section for each section
    for (const section of sections) {
      const schoolYear = section.school_year || school.current_school_year || '2025-2026';
      
      console.log(`   → Assigning section: ${section.name} (Grade ${section.grade_level})`);

      const { data: count, error: assignErr } = await supabase.rpc('auto_assign_personal_section', {
        p_school_id: school.id,
        p_teacher_id: teacher.id,
        p_section_id: section.id,
        p_grade_level: section.grade_level || 6,
        p_school_year: schoolYear,
      });

      if (assignErr) {
        console.log(`     ❌ Error: ${assignErr.message}`);
      } else {
        const created = count || 0;
        console.log(`     ✅ Created ${created} subject assignment(s) + advisory`);
        totalAssignments += created + 1; // +1 for advisory
      }
    }
  }

  // 6. Summary
  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Done! Created ${totalAssignments} teaching assignment(s) total.`);

  // 7. Verify
  const { data: verify } = await supabase
    .from('teaching_assignments')
    .select('school_id, section_id, subject, is_advisory')
    .in('school_id', personalSchools.map(s => s.id))
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('school_id')
    .order('is_advisory', { ascending: false });

  if (verify && verify.length > 0) {
    console.log(`\n📊 Verification — ${verify.length} active assignment(s):`);
    verify.forEach(a => {
      const icon = a.is_advisory ? '👑' : '📖';
      console.log(`   ${icon} ${a.subject}${a.is_advisory ? ' (Advisory)' : ''}`);
    });
  }
}

main().catch(err => {
  console.error('💥 Unhandled error:', err);
  process.exit(1);
});
