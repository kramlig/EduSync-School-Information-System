/**
 * Add Admin User to Production Firestore
 * 
 * This script adds an admin user (admin@school.edu) to the teachers collection
 * in your production Firestore database.
 * 
 * Usage: node scripts/add-admin-user.cjs
 */

const admin = require('firebase-admin');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.argv[2];

if (!serviceAccountPath) {
  console.error('❌ Error: Service account key path required.');
  console.error('\nUsage:');
  console.error('  node scripts/add-admin-user.cjs <path-to-service-account-key.json>');
  console.error('\nOr set GOOGLE_APPLICATION_CREDENTIALS environment variable.');
  process.exit(1);
}

try {
  const serviceAccount = require(path.resolve(serviceAccountPath));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'edusync-sis'
  });
  
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();

async function addAdminUser() {
  console.log('\n📝 Adding admin user to production database...\n');
  
  const adminUser = {
    id: 'admin-001',
    email: 'admin@school.edu',
    name: 'System Administrator',
    role: 'admin',
    department: 'Administration',
    subjects: ['All'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  try {
    // Check if user already exists
    const existingUser = await db.collection('teachers').doc(adminUser.id).get();
    
    if (existingUser.exists) {
      console.log('ℹ️  Admin user already exists:');
      console.log('   Email:', existingUser.data().email);
      console.log('   Name:', existingUser.data().name);
      console.log('\n✅ No changes needed.');
      process.exit(0);
    }
    
    // Add admin user
    await db.collection('teachers').doc(adminUser.id).set(adminUser);
    
    console.log('✅ Admin user added successfully!');
    console.log('\n📧 Login credentials:');
    console.log('   Email: admin@school.edu');
    console.log('   Password: password (or any password - debug mode)');
    console.log('\n📌 Login type: Staff');
    console.log('\n🌐 Access the app at: http://127.0.0.1:5173/');
    
  } catch (error) {
    console.error('❌ Error adding admin user:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

addAdminUser();
