#!/usr/bin/env node
/**
 * Create Admin Account for Demo School (Production)
 * 
 * This script creates:
 * 1. Firebase Auth account: admin@demo.edu.ph / admin123
 * 2. PostgreSQL teacher record with admin role linked to Demo School
 * 3. Links both via firebase_uid
 */

const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

// Initialize Firebase Admin (Production)
admin.initializeApp({
  projectId: 'edusync-sis'
});

// Initialize Supabase
const supabase = createClient(
  'https://zjuxulhxxeeupcskkcok.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdXh1bGh4eGVldXBjc2trY29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzExNDAsImV4cCI6MjA3OTAwNzE0MH0.rwRzqcxVIjPZ0-qmOvEzFkpeEoIRfnyYCWVRP9m1hX0'
);

const DEMO_SCHOOL_ID = '4d3758e8-cd6b-434b-8663-30a3f675ab80';
const ADMIN_EMAIL = 'admin@demo.edu.ph';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME = 'Demo School Admin';

async function createDemoAdmin() {
  try {
    console.log('🔐 Creating Demo School Admin Account...\n');

    // Step 1: Check if Firebase Auth account already exists
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(ADMIN_EMAIL);
      console.log(`✅ Firebase Auth account already exists: ${firebaseUser.uid}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new Firebase Auth account
        firebaseUser = await admin.auth().createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          displayName: ADMIN_NAME,
          emailVerified: true
        });
        console.log(`✅ Created Firebase Auth account: ${firebaseUser.uid}`);
      } else {
        throw error;
      }
    }

    // Step 2: Check if PostgreSQL teacher record already exists
    const { data: existingTeachers, error: checkError } = await supabase
      .from('teachers')
      .select('*')
      .eq('email', ADMIN_EMAIL)
      .eq('school_id', DEMO_SCHOOL_ID);

    if (checkError) throw checkError;

    let teacherId;
    if (existingTeachers && existingTeachers.length > 0) {
      // Update existing teacher with firebase_uid
      teacherId = existingTeachers[0].id;
      const { error: updateError } = await supabase
        .from('teachers')
        .update({ 
          firebase_uid: firebaseUser.uid,
          role: 'admin',
          name: ADMIN_NAME
        })
        .eq('id', teacherId);

      if (updateError) throw updateError;
      console.log(`✅ Updated existing teacher record: ${teacherId}`);
    } else {
      // Create new teacher record
      const { data: newTeacher, error: insertError } = await supabase
        .from('teachers')
        .insert([{
          school_id: DEMO_SCHOOL_ID,
          name: ADMIN_NAME,
          email: ADMIN_EMAIL,
          role: 'admin',
          firebase_uid: firebaseUser.uid,
          employee_number: 'ADMIN-001',
          specialization: 'Administration',
          department: 'Administration'
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      teacherId = newTeacher.id;
      console.log(`✅ Created PostgreSQL teacher record: ${teacherId}`);
    }

    // Step 3: Set custom claims for Firebase Auth
    await admin.auth().setCustomUserClaims(firebaseUser.uid, {
      role: 'admin',
      schoolId: DEMO_SCHOOL_ID
    });
    console.log(`✅ Set Firebase custom claims`);

    console.log('\n🎉 SUCCESS! Demo School Admin Account Created\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    admin@demo.edu.ph');
    console.log('🔑 Password: admin123');
    console.log('👤 Role:     admin');
    console.log('🏫 School:   Demo School');
    console.log('🆔 Firebase: ' + firebaseUser.uid);
    console.log('🆔 PostgreSQL: ' + teacherId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✨ You can now login to production with these credentials!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    process.exit(1);
  }
}

createDemoAdmin();
