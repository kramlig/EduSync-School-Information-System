/**
 * Sync ALL ECR component grades to the main grades table
 * This is a one-time migration script to bring grades table up to date with ECR
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAllECRToGrades() {
  console.log('🔄 Syncing ALL ECR grades to main grades table\n');
  console.log('='.repeat(60));
  
  // Get all ECR component grades
  const { data: ecrGrades, error: fetchError } = await supabase
    .from('ecr_component_grades')
    .select('student_id, learning_area_id, school_year, quarter, quarterly_grade')
    .not('quarterly_grade', 'is', null)
    .gt('quarterly_grade', 0);
  
  if (fetchError) {
    console.error('❌ Error fetching ECR grades:', fetchError.message);
    return;
  }
  
  console.log(`\n📊 Found ${ecrGrades?.length || 0} ECR component grade records\n`);
  
  if (!ecrGrades || ecrGrades.length === 0) {
    console.log('ℹ️  No ECR grades to sync');
    return;
  }
  
  let successCount = 0;
  let failCount = 0;
  
  for (const ecr of ecrGrades) {
    const { error: syncError } = await supabase.rpc('sync_ecr_to_grades', {
      p_student_id: ecr.student_id,
      p_learning_area_id: ecr.learning_area_id,
      p_school_year: ecr.school_year,
      p_quarter: ecr.quarter
    });
    
    if (syncError) {
      console.log(`   ❌ Failed: ${ecr.student_id.substring(0,8)}... ${ecr.quarter}`);
      failCount++;
    } else {
      console.log(`   ✅ Synced: ${ecr.student_id.substring(0,8)}... ${ecr.quarter} = ${ecr.quarterly_grade}`);
      successCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Sync complete: ${successCount} succeeded, ${failCount} failed\n`);
}

syncAllECRToGrades().catch(console.error);
