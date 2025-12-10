/**
 * Debug script to check sync for a specific student
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSync() {
  const studentId = 'cb873b66-588d-46c4-bf10-d24ead5a8994';
  
  console.log(`🔍 Debugging sync for student: ${studentId}\n`);
  
  // Get all ECR grades for this student
  const { data: ecrGrades, error: ecrError } = await supabase
    .from('ecr_component_grades')
    .select(`
      id,
      learning_area_id,
      school_year,
      quarter,
      quarterly_grade
    `)
    .eq('student_id', studentId);
  
  console.log('📊 ECR Component Grades:');
  if (ecrGrades && ecrGrades.length > 0) {
    for (const g of ecrGrades) {
      console.log(`   Learning Area: ${g.learning_area_id.substring(0,8)}... ${g.quarter} = ${g.quarterly_grade}`);
    }
  } else {
    console.log('   None found');
  }
  
  // Get all main grades for this student
  const { data: mainGrades, error: mainError } = await supabase
    .from('grades')
    .select(`
      id,
      learning_area_id,
      school_year,
      q1, q2, q3, q4
    `)
    .eq('student_id', studentId);
  
  console.log('\n📋 Main Grades Table:');
  if (mainGrades && mainGrades.length > 0) {
    for (const g of mainGrades) {
      console.log(`   Learning Area: ${g.learning_area_id.substring(0,8)}... Q1=${g.q1}, Q2=${g.q2}, Q3=${g.q3}, Q4=${g.q4}`);
    }
  } else {
    console.log('   None found');
  }
  
  // Check if learning areas match
  if (ecrGrades && mainGrades) {
    console.log('\n🔗 Comparison:');
    for (const ecr of ecrGrades) {
      const matching = mainGrades.find(g => g.learning_area_id === ecr.learning_area_id);
      if (matching) {
        const quarter = ecr.quarter.toLowerCase();
        const gradeValue = matching[quarter];
        if (Number(gradeValue) === Number(ecr.quarterly_grade)) {
          console.log(`   ✅ ${ecr.learning_area_id.substring(0,8)}... ${ecr.quarter}: ECR=${ecr.quarterly_grade}, grades=${gradeValue} (MATCH)`);
        } else {
          console.log(`   ❌ ${ecr.learning_area_id.substring(0,8)}... ${ecr.quarter}: ECR=${ecr.quarterly_grade}, grades=${gradeValue} (MISMATCH)`);
        }
      } else {
        console.log(`   ⚠️  ${ecr.learning_area_id.substring(0,8)}... No matching grade record`);
      }
    }
  }
}

debugSync().catch(console.error);
