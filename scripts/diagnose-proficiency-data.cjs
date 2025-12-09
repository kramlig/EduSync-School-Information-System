/**
 * Diagnostic Script: Investigate Proficiency Report vs SF6 Student Count Discrepancy
 * 
 * This script checks database counts to understand why Proficiency Report shows 0 students
 * while SF6 shows 39,825 students.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runDiagnostics() {
  console.log('='.repeat(80));
  console.log('PROFICIENCY DATA DIAGNOSTIC REPORT');
  console.log('='.repeat(80));
  console.log('Date:', new Date().toISOString());
  console.log('');

  try {
    // 1. Count of students per school (top 10)
    console.log('\n1. STUDENTS PER SCHOOL (Top 10)');
    console.log('-'.repeat(60));
    
    const { data: studentCounts, error: studentError } = await supabase
      .from('students')
      .select('school_id, schools!inner(name)')
      .is('deleted_at', null);
    
    if (studentError) {
      console.error('Error fetching students:', studentError.message);
    } else {
      // Group by school
      const schoolStudentCounts = {};
      studentCounts.forEach(s => {
        const schoolName = s.schools?.name || 'Unknown';
        schoolStudentCounts[schoolName] = (schoolStudentCounts[schoolName] || 0) + 1;
      });
      
      const sortedSchools = Object.entries(schoolStudentCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      console.log(`Total students: ${studentCounts.length}`);
      console.log('\nTop 10 schools by student count:');
      sortedSchools.forEach(([name, count], i) => {
        console.log(`  ${i + 1}. ${name}: ${count} students`);
      });
    }

    // 2. Count of grades per school (top 10)
    console.log('\n2. GRADES PER SCHOOL (Top 10)');
    console.log('-'.repeat(60));
    
    const { data: gradeCounts, error: gradeError } = await supabase
      .from('grades')
      .select('school_id, schools!inner(name)');
    
    if (gradeError) {
      console.error('Error fetching grades:', gradeError.message);
    } else {
      // Group by school
      const schoolGradeCounts = {};
      gradeCounts.forEach(g => {
        const schoolName = g.schools?.name || 'Unknown';
        schoolGradeCounts[schoolName] = (schoolGradeCounts[schoolName] || 0) + 1;
      });
      
      const sortedGradeSchools = Object.entries(schoolGradeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      console.log(`Total grade records: ${gradeCounts.length}`);
      console.log('\nTop 10 schools by grade count:');
      sortedGradeSchools.forEach(([name, count], i) => {
        console.log(`  ${i + 1}. ${name}: ${count} grades`);
      });
    }

    // 3. Count of learning areas per school (top 10)
    console.log('\n3. LEARNING AREAS PER SCHOOL (Top 10)');
    console.log('-'.repeat(60));
    
    const { data: learningAreas, error: laError } = await supabase
      .from('learning_areas')
      .select('id, name, code, school_id, schools!inner(name)')
      .is('deleted_at', null);
    
    if (laError) {
      console.error('Error fetching learning areas:', laError.message);
    } else {
      // Group by school
      const schoolLACounts = {};
      learningAreas.forEach(la => {
        const schoolName = la.schools?.name || 'Unknown';
        schoolLACounts[schoolName] = (schoolLACounts[schoolName] || 0) + 1;
      });
      
      const sortedLASchools = Object.entries(schoolLACounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      console.log(`Total learning areas: ${learningAreas.length}`);
      console.log('\nTop 10 schools by learning area count:');
      sortedLASchools.forEach(([name, count], i) => {
        console.log(`  ${i + 1}. ${name}: ${count} learning areas`);
      });
    }

    // 4. Sample learning area names/codes
    console.log('\n4. LEARNING AREA NAMES/CODES (For Proficiency Mapping)');
    console.log('-'.repeat(60));
    
    const { data: laNames, error: laNameError } = await supabase
      .from('learning_areas')
      .select('name, code')
      .is('deleted_at', null)
      .limit(50);
    
    if (laNameError) {
      console.error('Error fetching learning area names:', laNameError.message);
    } else {
      // Get unique names and codes
      const uniqueNames = [...new Set(laNames.map(la => la.name))];
      const uniqueCodes = [...new Set(laNames.map(la => la.code).filter(Boolean))];
      
      console.log('Unique Learning Area Names:');
      uniqueNames.forEach(name => console.log(`  - ${name}`));
      
      console.log('\nUnique Learning Area Codes:');
      uniqueCodes.forEach(code => console.log(`  - ${code}`));
      
      // Check for proficiency-related subjects
      console.log('\nProficiency-related subjects check:');
      const proficiencyKeywords = ['filipino', 'mother tongue', 'mtb', 'english', 'reading'];
      const foundSubjects = laNames.filter(la => 
        proficiencyKeywords.some(kw => 
          (la.name?.toLowerCase() || '').includes(kw) || 
          (la.code?.toLowerCase() || '').includes(kw)
        )
      );
      
      if (foundSubjects.length > 0) {
        console.log('Found proficiency-related subjects:');
        foundSubjects.forEach(la => console.log(`  - ${la.name} (${la.code || 'no code'})`));
      } else {
        console.log('⚠️  No proficiency-related subjects found (filipino, mother tongue, english, reading)');
      }
    }

    // 5. Check if grades have q1, q2, q3, q4 columns populated
    console.log('\n5. QUARTERLY GRADES CHECK (q1, q2, q3, q4)');
    console.log('-'.repeat(60));
    
    const { data: gradesSample, error: gradeSampleError } = await supabase
      .from('grades')
      .select('id, student_id, learning_area_id, q1, q2, q3, q4, final_grade')
      .limit(100);
    
    if (gradeSampleError) {
      console.error('Error fetching grades sample:', gradeSampleError.message);
    } else {
      const withQ1 = gradesSample.filter(g => g.q1 !== null && g.q1 !== undefined).length;
      const withQ2 = gradesSample.filter(g => g.q2 !== null && g.q2 !== undefined).length;
      const withQ3 = gradesSample.filter(g => g.q3 !== null && g.q3 !== undefined).length;
      const withQ4 = gradesSample.filter(g => g.q4 !== null && g.q4 !== undefined).length;
      const withFinal = gradesSample.filter(g => g.final_grade !== null && g.final_grade !== undefined).length;
      
      console.log(`Sample size: ${gradesSample.length} grades`);
      console.log(`  - With Q1: ${withQ1} (${((withQ1/gradesSample.length)*100).toFixed(1)}%)`);
      console.log(`  - With Q2: ${withQ2} (${((withQ2/gradesSample.length)*100).toFixed(1)}%)`);
      console.log(`  - With Q3: ${withQ3} (${((withQ3/gradesSample.length)*100).toFixed(1)}%)`);
      console.log(`  - With Q4: ${withQ4} (${((withQ4/gradesSample.length)*100).toFixed(1)}%)`);
      console.log(`  - With Final Grade: ${withFinal} (${((withFinal/gradesSample.length)*100).toFixed(1)}%)`);
      
      // Show sample grades
      if (gradesSample.length > 0) {
        console.log('\nSample grade records:');
        gradesSample.slice(0, 5).forEach((g, i) => {
          console.log(`  ${i + 1}. Q1=${g.q1}, Q2=${g.q2}, Q3=${g.q3}, Q4=${g.q4}, Final=${g.final_grade}`);
        });
      }
    }

    // 6. Check grades table schema
    console.log('\n6. GRADES TABLE STRUCTURE CHECK');
    console.log('-'.repeat(60));
    
    const { data: oneGrade, error: schemaError } = await supabase
      .from('grades')
      .select('*')
      .limit(1)
      .single();
    
    if (schemaError && schemaError.code !== 'PGRST116') {
      console.error('Error checking schema:', schemaError.message);
    } else if (oneGrade) {
      console.log('Columns in grades table:');
      Object.keys(oneGrade).forEach(col => {
        console.log(`  - ${col}: ${typeof oneGrade[col]} (${oneGrade[col] === null ? 'null' : 'has value'})`);
      });
    } else {
      console.log('No grade records found to check schema');
    }

    // 7. Check student enrollments
    console.log('\n7. STUDENT ENROLLMENTS CHECK');
    console.log('-'.repeat(60));
    
    const { count: enrollmentCount, error: enrollError } = await supabase
      .from('student_enrollments')
      .select('*', { count: 'exact', head: true });
    
    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError.message);
    } else {
      console.log(`Total enrollments: ${enrollmentCount}`);
    }

    // 8. Check sections
    console.log('\n8. SECTIONS CHECK');
    console.log('-'.repeat(60));
    
    const { count: sectionCount, error: sectionError } = await supabase
      .from('sections')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);
    
    if (sectionError) {
      console.error('Error fetching sections:', sectionError.message);
    } else {
      console.log(`Total sections: ${sectionCount}`);
    }

    // 9. Check if grades are linked to students properly
    console.log('\n9. GRADES-STUDENTS LINKAGE CHECK');
    console.log('-'.repeat(60));
    
    const { data: linkedGrades, error: linkError } = await supabase
      .from('grades')
      .select(`
        id,
        student_id,
        students!inner(id, first_name, last_name)
      `)
      .limit(10);
    
    if (linkError) {
      console.error('Error checking grades-students linkage:', linkError.message);
    } else {
      console.log(`Successfully linked grades to students: ${linkedGrades.length}`);
      if (linkedGrades.length > 0) {
        console.log('Sample linked records:');
        linkedGrades.slice(0, 3).forEach((g, i) => {
          console.log(`  ${i + 1}. Grade ${g.id} -> Student ${g.students.first_name} ${g.students.last_name}`);
        });
      }
    }

    // 10. Summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`
If grades table is empty or has no q1-q4 values, this explains why Proficiency Report shows 0.
SF6 likely counts students from student_enrollments or students table directly.

Next Steps:
1. If grades table is empty: Need to seed/migrate grade data
2. If learning areas don't match proficiency mapping: Need to check proficiency query logic
3. If q1-q4 columns are empty: Grade data exists but quarterly scores weren't populated
    `);

  } catch (error) {
    console.error('Diagnostic error:', error);
  }
}

runDiagnostics().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
