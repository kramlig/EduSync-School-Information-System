/**
 * Sync PostgreSQL Users to Firebase Auth
 * Run this script to create Firebase Auth accounts for all PostgreSQL users
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pzuvobarvzecrbbdwyqm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6dXZvYmFydnplY3JiYmR3eXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5OTU2NzAsImV4cCI6MjA0NzU3MTY3MH0.qEqIqZce5vDSlJWK_b_KY-Xy_2uS0dFDIUGkuqbVPHk';

async function syncUsersToAuth() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log('🔍 Fetching users from PostgreSQL...\n');

  // Fetch all teachers
  const { data: teachers, error: teachersError } = await supabase
    .from('teachers')
    .select('id, name, email, firebase_uid')
    .eq('school_id', '01JBPXVB9GQAA4XPNYJYHW5ZDB'); // Demo School

  if (teachersError) {
    console.error('Error fetching teachers:', teachersError);
    return;
  }

  // Fetch all students
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, first_name, last_name, email, firebase_uid')
    .eq('school_id', '01JBPXVB9GQAA4XPNYJYHW5ZDB');

  if (studentsError) {
    console.error('Error fetching students:', studentsError);
    return;
  }

  // Fetch all parents
  const { data: parents, error: parentsError } = await supabase
    .from('parents')
    .select('id, name, email, firebase_uid')
    .eq('school_id', '01JBPXVB9GQAA4XPNYJYHW5ZDB');

  if (parentsError) {
    console.error('Error fetching parents:', parentsError);
    return;
  }

  const usersToSync = [];

  // Process teachers
  teachers.forEach(t => {
    if (t.email && !t.firebase_uid) {
      usersToSync.push({
        email: t.email,
        name: t.name,
        role: 'teacher',
        postgresqlId: t.id
      });
    }
  });

  // Process students
  students.forEach(s => {
    if (s.email && !s.firebase_uid) {
      usersToSync.push({
        email: s.email,
        name: `${s.first_name} ${s.last_name}`.trim(),
        role: 'student',
        postgresqlId: s.id
      });
    }
  });

  // Process parents
  parents.forEach(p => {
    if (p.email && !p.firebase_uid) {
      usersToSync.push({
        email: p.email,
        name: p.name,
        role: 'parent',
        postgresqlId: p.id
      });
    }
  });

  console.log(`📊 Found ${usersToSync.length} users to sync:`);
  console.log(`   - Teachers: ${usersToSync.filter(u => u.role === 'teacher').length}`);
  console.log(`   - Students: ${usersToSync.filter(u => u.role === 'student').length}`);
  console.log(`   - Parents: ${usersToSync.filter(u => u.role === 'parent').length}`);
  console.log('\n🔧 Users to create in Firebase Auth:\n');
  
  usersToSync.forEach((u, i) => {
    console.log(`${i + 1}. ${u.email} (${u.role}) - ${u.name}`);
  });

  console.log('\n\n📋 NEXT STEPS:');
  console.log('1. Copy the users array above');
  console.log('2. Go to Firebase Console: https://console.firebase.google.com/project/edusync-sis/functions');
  console.log('3. Find and run the "syncPostgresToAuth" function');
  console.log('4. Pass the users array as data');
  console.log('\nOR use this JSON:\n');
  console.log(JSON.stringify({ users: usersToSync }, null, 2));
}

syncUsersToAuth().catch(console.error);
