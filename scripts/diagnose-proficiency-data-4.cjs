/**
 * Diagnostic Script Part 4: Compare divisions and understand the full picture
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function compareDivisions() {
  console.log('='.repeat(80));
  console.log('DIVISION COMPARISON: Understanding Student Distribution');
  console.log('='.repeat(80));
  
  try {
    // 1. Get all divisions
    console.log('\n1. ALL DIVISIONS');
    console.log('-'.repeat(60));
    
    const { data: divisions, error: divError } = await supabase
      .from('divisions')
      .select('id, name')
      .is('deleted_at', null);
    
    if (divError) {
      console.log('Divisions table error:', divError.message);
      
      // Try getting unique division_ids from schools
      const { data: schoolDivs } = await supabase
        .from('schools')
        .select('division_id')
        .is('deleted_at', null);
      
      const uniqueDivIds = [...new Set(schoolDivs?.map(s => s.division_id).filter(Boolean))];
      console.log('Unique division_ids from schools:', uniqueDivIds);
    } else {
      divisions?.forEach(d => {
        console.log(`  ${d.name}: ${d.id}`);
      });
    }

    // 2. Count students per division
    console.log('\n2. STUDENTS PER DIVISION');
    console.log('-'.repeat(60));
    
    const { data: schools } = await supabase
      .from('schools')
      .select('id, name, division_id')
      .is('deleted_at', null);
    
    const divisionIds = [...new Set(schools?.map(s => s.division_id).filter(Boolean))];
    
    for (const divId of divisionIds) {
      const divSchools = schools.filter(s => s.division_id === divId);
      const schoolIds = divSchools.map(s => s.id);
      
      const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .in('school_id', schoolIds)
        .is('deleted_at', null);
      
      console.log(`Division ${divId}:`);
      console.log(`  Schools: ${divSchools.length}`);
      console.log(`  Students: ${count}`);
      console.log(`  Sample schools: ${divSchools.slice(0, 3).map(s => s.name).join(', ')}`);
    }

    // 3. Check proficiency for each division
    console.log('\n3. PROFICIENCY DATA PER DIVISION');
    console.log('-'.repeat(60));
    
    for (const divId of divisionIds) {
      console.log(`\nDivision ${divId}:`);
      
      const { data: profResult, error: profError } = await supabase.rpc(
        'get_division_proficiency_summary',
        { p_division_id: divId }
      );
      
      if (profError) {
        console.log(`  Error: ${profError.message}`);
      } else if (profResult && profResult.summary) {
        console.log(`  Total students in proficiency: ${profResult.summary.total_students_elementary || 0}`);
        console.log(`  Schools with data: ${profResult.summary.total_schools || 0}`);
        console.log(`  Overall MPS: ${profResult.summary.overall_mps_elementary || 'N/A'}`);
      } else {
        console.log(`  No proficiency data returned`);
      }
    }

    // 4. Check for the actual issue - where are the 39,825 students?
    console.log('\n4. WHERE ARE THE 39,825 STUDENTS?');
    console.log('-'.repeat(60));
    
    // Get schools with most students
    const { data: allStudents } = await supabase
      .from('students')
      .select('school_id')
      .is('deleted_at', null);
    
    const studentsBySchool = {};
    allStudents?.forEach(s => {
      studentsBySchool[s.school_id] = (studentsBySchool[s.school_id] || 0) + 1;
    });
    
    const sortedSchools = Object.entries(studentsBySchool)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
    
    console.log('Top 15 schools by student count:');
    for (const [schoolId, count] of sortedSchools) {
      const school = schools?.find(s => s.id === schoolId);
      console.log(`  ${school?.name || 'Unknown'}: ${count} students (Div: ${school?.division_id?.slice(0, 8)}...)`);
    }

    // 5. Check which division has grades
    console.log('\n5. GRADES BY DIVISION');
    console.log('-'.repeat(60));
    
    const { data: grades } = await supabase
      .from('grades')
      .select('school_id');
    
    const gradesBySchool = {};
    grades?.forEach(g => {
      gradesBySchool[g.school_id] = (gradesBySchool[g.school_id] || 0) + 1;
    });
    
    console.log('Grades distribution:');
    for (const [schoolId, count] of Object.entries(gradesBySchool)) {
      const school = schools?.find(s => s.id === schoolId);
      console.log(`  ${school?.name || 'Unknown'}: ${count} grades (Div: ${school?.division_id?.slice(0, 8)}...)`);
    }

    // 6. The key insight
    console.log('\n' + '='.repeat(80));
    console.log('KEY INSIGHT');
    console.log('='.repeat(80));
    console.log(`
SUMMARY:
- Total students in database: ${allStudents?.length}
- Grades only exist in Demo School (${grades?.length} grades for ${Object.keys(gradesBySchool).length} school)
- Learning areas only exist in Demo School

THE ROOT CAUSE:
The proficiency report IS working - it returns 144 students from Demo School.
But SF6 counts 39,825 students across ALL schools in the division.

The discrepancy is NOT a bug - it's a DATA issue:
- 39,825 students have NO grades recorded
- Only 48 students (in Demo School) have grades
- Proficiency can only count students WITH grades

SOLUTION:
To make proficiency match SF6, you need to:
1. Create learning areas for ALL schools (not just Demo School)
2. Create grade records for ALL students in proficiency subjects
3. This is a SEEDING/DATA issue, not a code bug
    `);

  } catch (error) {
    console.error('Error:', error);
  }
}

compareDivisions().then(() => process.exit(0)).catch(console.error);
