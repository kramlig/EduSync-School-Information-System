/**
 * Diagnostic Script Part 2: Deep Dive into Proficiency Data Issue
 * 
 * Key findings from Part 1:
 * - 1000 students total (554 in Mati City Science HS, 420 in Don Martin Marundan ES)
 * - Only 384 grades, ALL in "Demo School" 
 * - Learning areas only exist in "Demo School"
 * - The grades are linked to students but schools don't match!
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function deepDive() {
  console.log('='.repeat(80));
  console.log('DEEP DIVE: Proficiency Data School Mismatch Analysis');
  console.log('='.repeat(80));
  console.log('');

  try {
    // 1. Get all schools and their IDs
    console.log('1. ALL SCHOOLS WITH IDs');
    console.log('-'.repeat(60));
    
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select('id, name')
      .is('deleted_at', null);
    
    if (schoolError) {
      console.error('Error:', schoolError.message);
    } else {
      schools.forEach(s => {
        console.log(`  ${s.name}: ${s.id}`);
      });
    }

    // 2. Check which school_id the grades belong to
    console.log('\n2. GRADES DISTRIBUTION BY SCHOOL_ID');
    console.log('-'.repeat(60));
    
    const { data: gradeSchools, error: gsError } = await supabase
      .from('grades')
      .select('school_id');
    
    if (gsError) {
      console.error('Error:', gsError.message);
    } else {
      const schoolIdCounts = {};
      gradeSchools.forEach(g => {
        schoolIdCounts[g.school_id] = (schoolIdCounts[g.school_id] || 0) + 1;
      });
      
      console.log('Grades by school_id:');
      for (const [schoolId, count] of Object.entries(schoolIdCounts)) {
        const schoolName = schools?.find(s => s.id === schoolId)?.name || 'UNKNOWN/NOT FOUND';
        console.log(`  ${schoolId}: ${count} grades (${schoolName})`);
      }
    }

    // 3. Check students' school_ids
    console.log('\n3. STUDENTS DISTRIBUTION BY SCHOOL_ID');
    console.log('-'.repeat(60));
    
    const { data: studentSchools, error: ssError } = await supabase
      .from('students')
      .select('school_id')
      .is('deleted_at', null);
    
    if (ssError) {
      console.error('Error:', ssError.message);
    } else {
      const studentSchoolCounts = {};
      studentSchools.forEach(s => {
        studentSchoolCounts[s.school_id] = (studentSchoolCounts[s.school_id] || 0) + 1;
      });
      
      console.log('Students by school_id:');
      for (const [schoolId, count] of Object.entries(studentSchoolCounts)) {
        const schoolName = schools?.find(s => s.id === schoolId)?.name || 'UNKNOWN/NOT FOUND';
        console.log(`  ${schoolId}: ${count} students (${schoolName})`);
      }
    }

    // 4. Check learning_areas school_ids
    console.log('\n4. LEARNING AREAS DISTRIBUTION BY SCHOOL_ID');
    console.log('-'.repeat(60));
    
    const { data: laSchools, error: laError } = await supabase
      .from('learning_areas')
      .select('school_id, name')
      .is('deleted_at', null);
    
    if (laError) {
      console.error('Error:', laError.message);
    } else {
      const laSchoolCounts = {};
      laSchools.forEach(la => {
        if (!laSchoolCounts[la.school_id]) {
          laSchoolCounts[la.school_id] = { count: 0, subjects: [] };
        }
        laSchoolCounts[la.school_id].count++;
        laSchoolCounts[la.school_id].subjects.push(la.name);
      });
      
      console.log('Learning areas by school_id:');
      for (const [schoolId, data] of Object.entries(laSchoolCounts)) {
        const schoolName = schools?.find(s => s.id === schoolId)?.name || 'UNKNOWN/NOT FOUND';
        console.log(`  ${schoolId}: ${data.count} subjects (${schoolName})`);
        console.log(`    Subjects: ${data.subjects.join(', ')}`);
      }
    }

    // 5. Check if students with grades exist in the same school as the grades
    console.log('\n5. CROSS-CHECK: Do grades link to students in same school?');
    console.log('-'.repeat(60));
    
    const { data: crossCheck, error: ccError } = await supabase
      .from('grades')
      .select(`
        id,
        school_id,
        student_id,
        students(id, school_id, first_name, last_name)
      `)
      .limit(20);
    
    if (ccError) {
      console.error('Error:', ccError.message);
    } else {
      let mismatches = 0;
      let matches = 0;
      
      crossCheck.forEach(g => {
        if (g.students && g.school_id !== g.students.school_id) {
          mismatches++;
          if (mismatches <= 5) {
            console.log(`  ⚠️ Mismatch: Grade in ${g.school_id}, Student in ${g.students.school_id}`);
          }
        } else {
          matches++;
        }
      });
      
      console.log(`\n  Matches: ${matches}, Mismatches: ${mismatches}`);
    }

    // 6. Check the proficiency SQL function
    console.log('\n6. CHECK IF PROFICIENCY FUNCTION EXISTS');
    console.log('-'.repeat(60));
    
    const { data: fnCheck, error: fnError } = await supabase.rpc('get_division_proficiency_summary', {
      p_division_id: schools?.[0]?.id || 'test'
    });
    
    if (fnError) {
      console.log('RPC Error:', fnError.message);
      console.log('The function may not exist or has wrong parameters');
    } else {
      console.log('Function exists, returned:', fnCheck?.length, 'rows');
    }

    // 7. Check for Demo School specifically  
    console.log('\n7. DEMO SCHOOL ANALYSIS');
    console.log('-'.repeat(60));
    
    const demoSchool = schools?.find(s => s.name === 'Demo School');
    if (demoSchool) {
      console.log(`Demo School ID: ${demoSchool.id}`);
      
      // Students in Demo School
      const { count: demoStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', demoSchool.id)
        .is('deleted_at', null);
      
      console.log(`Students in Demo School: ${demoStudents}`);
      
      // Grades in Demo School
      const { count: demoGrades } = await supabase
        .from('grades')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', demoSchool.id);
      
      console.log(`Grades in Demo School: ${demoGrades}`);
    } else {
      console.log('Demo School not found in schools table!');
    }

    // 8. Check if there's a Division setup
    console.log('\n8. DIVISION SETUP CHECK');
    console.log('-'.repeat(60));
    
    // Check if there's a divisions table or if schools have division_id
    const { data: schoolWithDiv, error: divError } = await supabase
      .from('schools')
      .select('id, name, division_id')
      .is('deleted_at', null)
      .limit(10);
    
    if (divError) {
      console.log('Error checking divisions:', divError.message);
    } else {
      console.log('Schools with division_id:');
      schoolWithDiv.forEach(s => {
        console.log(`  ${s.name}: division_id = ${s.division_id || 'NULL'}`);
      });
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('ROOT CAUSE ANALYSIS');
    console.log('='.repeat(80));
    console.log(`
FINDINGS:
1. Grades exist (384 records) but ALL belong to "Demo School"
2. Students are in different schools (Mati City Science HS, Don Martin Marundan ES)
3. Learning areas only exist for "Demo School"
4. The schools with actual students have NO grades and NO learning areas!

THE PROBLEM:
- SF6 counts students from the students table (1000 students in actual schools)
- Proficiency Report queries grades joined with learning areas
- Since grades/learning areas only exist in Demo School (which has 0 students),
  the proficiency report shows 0!

SOLUTION NEEDED:
1. Create learning areas for the actual schools (Mati City Science HS, etc.)
2. Create grade records linked to those schools' students
3. OR migrate existing grades to use the correct school_id
    `);

  } catch (error) {
    console.error('Error:', error);
  }
}

deepDive().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
