/**
 * Add MAPEH Elementary to PRODUCTION Firebase
 * Using Firebase Web SDK (NOT Admin SDK - no emulator!)
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Production Firebase config (from .env.local.prod)
const firebaseConfig = {
  apiKey: "AIzaSyAfa4UuSE22wcuJ_vtQG0ZcvVv8yM0acdc",
  authDomain: "edusync-sis.firebaseapp.com",
  projectId: "edusync-sis",
  storageBucket: "edusync-sis.firebasestorage.app",
  messagingSenderId: "667887536401",
  appId: "1:667887536401:web:eb6e54d83ec4178a0b64b0"
};

console.log('🚀 Connecting to PRODUCTION Firebase...');
console.log('Project ID:', firebaseConfig.projectId);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addMAPEHElementary() {
  console.log('\n📚 Adding MAPEH Elementary to Production Firestore...\n');
  
  const mapehElem = {
    id: 'la_mapeh_elem',
    name: 'MAPEH',
    credits: 4,
    isComposite: true,
    subSubjects: ['Music', 'Arts', 'PE', 'Health'],
    category: 'specialized',
    gradeLevel: [1, 2, 3, 4, 5, 6],
    department: 'Arts & Sports',
    kToTwelveCode: 'MAPEH-ELEM',
    isActive: true,
    order: 7,
    description: 'Music, Arts, Physical Education, Health for Elementary',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  try {
    const docRef = doc(db, 'learningAreas', 'la_mapeh_elem');
    await setDoc(docRef, mapehElem);
    
    console.log('✅ MAPEH Elementary added successfully to PRODUCTION!');
    console.log('\nSubject Details:');
    console.log('  Name: MAPEH');
    console.log('  Grades: 1-6');
    console.log('  Category: specialized');
    console.log('  Composite: Music, Arts, PE, Health');
    console.log('  Code: MAPEH-ELEM');
    console.log('\n🎉 Done! Refresh your Learning Areas page.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding MAPEH Elementary:', error);
    process.exit(1);
  }
}

addMAPEHElementary();
