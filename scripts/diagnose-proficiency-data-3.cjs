/**
 * Diagnostic Script Part 3: Final verification of the issue
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function finalCheck() {
  console.log('='.repeat(80));
  console.log('FINAL VERIFICATION: Why Proficiency = 0?');
  console.log('='.repeat(80));
  
  try {
    // Check the actual count of students from students table
    console.log('\n1. TOTAL STUDENT COUNT (ALL SCHOOLS)');
    console.log('-'.repeat(60));
    
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);
    
    console.log(`Total students in database: ${totalStudents}`);

    // Now check the Demo School specifically
    const demoSchoolId = '4d3758e8-cd6b-434b-8663-30a3f675ab80';
    
    console.log('\n2. DEMO SCHOOL DETAILED ANALYSIS');
    console.log('-'.repeat(60));
    
    const { count: demoStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', demoSchoolId)
      .is('deleted_at', null);
    
    console.log(`Students in Demo School: ${demoStudents}`);
    
    // Check unique students with grades in Demo School
    const { data: gradesWithStudents, error: gwsError } = await supabase
      .from('grades')
      .select('student_id, students(id, school_id)')
      .eq('school_id', demoSchoolId);
    
    if (gwsError) {
      console.log('Error:', gwsError.message);
    } else {
      const uniqueStudentIds = [...new Set(gradesWithStudents.map(g => g.student_id))];
      console.log(`Unique students with grades in Demo School: ${uniqueStudentIds.length}`);
      
      // Check if these students actually belong to Demo School
      const studentsInDemoSchool = gradesWithStudents.filter(g => 
        g.students && g.students.school_id === demoSchoolId
      );
      const studentsNotInDemoSchool = gradesWithStudents.filter(g => 
        g.students && g.students.school_id !== demoSchoolId
      );
      
      console.log(`Grades where student is IN Demo School: ${studentsInDemoSchool.length}`);
      console.log(`Grades where student is NOT in Demo School: ${studentsNotInDemoSchool.length}`);
    }

    // 3. Check proficiency-related learning areas
    console.log('\n3. PROFICIENCY SUBJECT ANALYSIS');
    console.log('-'.repeat(60));
    
    const { data: proficiencyLAs, error: plaError } = await supabase
      .from('learning_areas')
      .select('id, name, code, school_id')
      .is('deleted_at', null)
      .or('code.ilike.%FIL%,code.ilike.%ENG%,code.ilike.%MTB%,name.ilike.%filipino%,name.ilike.%english%,name.ilike.%mother tongue%');
    
    if (plaError) {
      console.log('Error:', plaError.message);
    } else {
      console.log('Proficiency-related learning areas:');
      proficiencyLAs.forEach(la => {
        const isDemo = la.school_id === demoSchoolId ? '(Demo School)' : '(Other School)';
        console.log(`  - ${la.name} [${la.code}] ${isDemo}`);
      });
      
      // Check if these learning areas have grades
      for (const la of proficiencyLAs) {
        const { count } = await supabase
          .from('grades')
          .select('*', { count: 'exact', head: true })
          .eq('learning_area_id', la.id);
        
        console.log(`    Grades for ${la.name}: ${count}`);
      }
    }

    // 4. Check the actual proficiency function logic
    console.log('\n4. TEST PROFICIENCY FUNCTION CALL');
    console.log('-'.repeat(60));
    
    // Get a division ID
    const { data: divisionData } = await supabase
      .from('schools')
      .select('division_id')
      .eq('id', demoSchoolId)
      .single();
    
    const divisionId = divisionData?.division_id;
    console.log(`Testing with Division ID: ${divisionId}`);
    
    if (divisionId) {
      const { data: profResult, error: profError } = await supabase.rpc(
        'get_division_proficiency_summary',
        { p_division_id: divisionId }
      );
      
      if (profError) {
        console.log('Proficiency RPC Error:', profError.message);
        console.log('Error details:', JSON.stringify(profError, null, 2));
      } else {
        console.log('Proficiency Result:', JSON.stringify(profResult, null, 2));
        if (profResult && profResult.length > 0) {
          console.log('\nProficiency data found!');
          profResult.forEach(r => {
            console.log(`  ${r.grade_level}: ${r.total_students} students`);
          });
        } else {
          console.log('No proficiency data returned - function returned empty!');
        }
      }
    }

    // 5. Check what the proficiency function SHOULD be looking for
    console.log('\n5. DATA REQUIREMENTS FOR PROFICIENCY');
    console.log('-'.repeat(60));
    console.log(`
The Proficiency Report requires:
1. Students enrolled in schools within the division
2. Grades for those students in reading-related subjects
3. Learning areas matching: Filipino, English, Mother Tongue, Reading

Current state:
- Demo School has grades but only 70 students (maybe not enrolled properly?)
- Other schools have 930+ students but NO grades/learning areas
- Proficiency function may be filtering by enrollment status
    `);

    // 6. Check student enrollments for Demo School
    console.log('\n6. ENROLLMENT STATUS CHECK');
    console.log('-'.repeat(60));
    
    const { data: enrollments, error: enrollError } = await supabase
      .from('student_enrollments')
      .select('id, student_id, school_id, status')
      .eq('school_id', demoSchoolId)
      .limit(10);
    
    if (enrollError) {
      console.log('Enrollment Error:', enrollError.message);
    } else {
      console.log(`Enrollments in Demo School: ${enrollments?.length || 0}`);
      if (enrollments && enrollments.length > 0) {
        console.log('Sample enrollments:');
        enrollments.forEach(e => {
          console.log(`  Student ${e.student_id}: ${e.status}`);
        });
      }
    }

    // 7. Final summary
    console.log('\n' + '='.repeat(80));
    console.log('DIAGNOSIS SUMMARY');
    console.log('='.repeat(80));
    console.log(`
KEY METRICS:
- Total Students: ${totalStudents}
- Students in Demo School: ${demoStudents}
- Students in other schools: ${totalStudents - demoStudents}

WHY SF6 SHOWS 39,825:
- SF6 likely counts ALL students from schools in the division
- Query: SELECT COUNT(*) FROM students WHERE school_id IN (division schools)

WHY PROFICIENCY SHOWS 0:
- Proficiency requires grades with q1-q4 values
- Proficiency requires learning_areas matching proficiency subjects
- Only Demo School has grades (384) and learning areas (8)
- The grades may not be linked to properly enrolled students
- OR the proficiency function has additional filters we need to check

NEXT STEPS:
1. Check the get_division_proficiency_summary function SQL
2. Verify the function joins grades -> students -> schools correctly
3. Check if there's an enrollment status filter
4. Seed grades for the actual schools with students
    `);

  } catch (error) {
    console.error('Error:', error);
  }
}

finalCheck().then(() => process.exit(0)).catch(console.error);
