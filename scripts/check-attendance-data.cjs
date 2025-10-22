/**
 * Script to check attendance data in Firestore
 * Run with: node scripts/check-attendance-data.cjs
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, limit } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDaf1Uswbm4NWffPToe6HQhfJRxpuv8HDs",
  authDomain: "edusync-sis.firebaseapp.com",
  projectId: "edusync-sis",
  storageBucket: "edusync-sis.firebasestorage.app",
  messagingSenderId: "667887536401",
  appId: "1:667887536401:web:eb6e54d83ec4178a0b64b0"
};

async function checkAttendanceData() {
  console.log('🔍 Checking Attendance Data in Firestore...\n');
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  try {
    // Fetch attendance records
    const attendanceRef = collection(db, 'attendanceRecords');
    const q = query(attendanceRef, limit(5)); // Get first 5 records
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('❌ No attendance records found in Firestore!');
      console.log('\nPossible reasons:');
      console.log('  1. Collection name might be different');
      console.log('  2. No data has been created yet');
      console.log('  3. Firestore rules might be blocking access');
      return;
    }
    
    console.log(`✅ Found ${snapshot.size} attendance record(s)\n`);
    
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Record ${index + 1}:`);
      console.log(`  Document ID: ${doc.id}`);
      console.log(`  Student ID: ${data.studentId || 'N/A'}`);
      
      if (data.dailyStatus) {
        const dates = Object.keys(data.dailyStatus);
        console.log(`  Total attendance entries: ${dates.length}`);
        
        // Show first 3 entries
        const sample = dates.slice(0, 3);
        console.log('  Sample entries:');
        sample.forEach(date => {
          console.log(`    ${date}: ${data.dailyStatus[date]}`);
        });
        
        if (dates.length > 3) {
          console.log(`    ... and ${dates.length - 3} more`);
        }
      } else {
        console.log('  ⚠️  No dailyStatus field found!');
      }
      console.log('');
    });
    
    // Count total records
    const allSnapshot = await getDocs(attendanceRef);
    console.log(`📊 Total attendance records in database: ${allSnapshot.size}`);
    
  } catch (error) {
    console.error('❌ Error checking attendance data:', error.message);
    console.error('\nFull error:', error);
  }
}

checkAttendanceData();
