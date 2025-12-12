/**
 * Create PostgreSQL records for ml.mutia@deped.gov.ph
 * Links the Firebase Auth account to PostgreSQL database
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zjuxulhxxeeupcskkcok.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdXh1bGh4eGVldXBjc2trY29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzExNDAsImV4cCI6MjA3OTAwNzE0MH0.rwRzqcxVIjPZ0-qmOvEzFkpeEoIRfnyYCWVRP9m1hX0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function linkFirebaseToTeacher() {
  // Teacher details
  const firebaseUid = 'l2qWOHpa9TfuEH46nd8FczT9Cnz1';
  const email = 'ml.mutia@deped.gov.ph';

  try {
    console.log('Finding existing teacher record...\n');

    // Find existing teacher by email
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('*')
      .ilike('email', email)
      .single();

    if (teacherError || !teacher) {
      console.error('❌ Teacher not found in database');
      throw teacherError || new Error('Teacher not found');
    }

    console.log('✅ Found teacher:', teacher.name, '(ID:', teacher.id + ')');

    // Update teacher record with Firebase UID
    console.log('Adding Firebase UID to teacher record...');
    const { data: updatedTeacher, error: updateError } = await supabase
      .from('teachers')
      .update({
        firebase_uid: firebaseUid,
        updated_at: new Date().toISOString()
      })
      .eq('id', teacher.id)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log('✅ Teacher record updated with Firebase UID');
    console.log('\n🎉 Successfully linked Firebase Auth to teacher:');
    console.log(`   Name: ${updatedTeacher.name}`);
    console.log(`   Email: ${updatedTeacher.email}`);
    console.log(`   Teacher ID: ${updatedTeacher.id}`);
    console.log(`   Firebase UID: ${firebaseUid}`);
    console.log('\n✅ The teacher can now log in successfully!');

  } catch (error) {
    console.error('\n❌ Failed to link Firebase UID:', error);
    process.exit(1);
  }
}

linkFirebaseToTeacher();
