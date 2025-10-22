#!/usr/bin/env node

/**
 * Seed Attendance Data Script
 * 
 * This script generates realistic attendance records for all students
 * covering the current school year with various attendance patterns.
 * 
 * Usage:
 *   node scripts/seed-attendance.cjs
 * 
 * Features:
 * - Generates attendance for the entire school year (June - March)
 * - Realistic patterns: mostly present, occasional absences, some late arrivals
 * - Different attendance profiles for different students
 * - Excludes weekends automatically
 * - Suitable for report card printing
 */

const admin = require('firebase-admin');

// Ensure we're using production Firestore, not emulator
if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log('⚠️  FIRESTORE_EMULATOR_HOST detected. Unsetting to use production...\n');
  delete process.env.FIRESTORE_EMULATOR_HOST;
}

// Initialize Firebase Admin for PRODUCTION
admin.initializeApp({
    projectId: 'edusync-sis'
});

const db = admin.firestore();

/**
 * Get all school days for the current school year (excluding weekends)
 * Philippine school year: June - March
 */
function getSchoolDays() {
  const schoolDays = [];
  const currentYear = new Date().getFullYear();
  
  // School year: June 2024 - March 2025 (or adjust based on current date)
  const startMonth = 5; // June (0-indexed)
  const endMonth = 2;   // March (0-indexed)
  
  // Determine the year range
  const startYear = currentYear;
  const endYear = currentYear + 1;
  
  // Generate dates from June to December of current year
  for (let month = startMonth; month <= 11; month++) {
    const daysInMonth = new Date(startYear, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(startYear, month, day);
      const dayOfWeek = date.getDay();
      
      // Exclude weekends (Saturday = 6, Sunday = 0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        schoolDays.push(formatDate(date));
      }
    }
  }
  
  // Generate dates from January to March of next year
  for (let month = 0; month <= endMonth; month++) {
    const daysInMonth = new Date(endYear, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(endYear, month, day);
      const dayOfWeek = date.getDay();
      
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        schoolDays.push(formatDate(date));
      }
    }
  }
  
  return schoolDays;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate attendance status based on student profile
 */
function generateAttendanceStatus(studentProfile, dayIndex, totalDays) {
  const rand = Math.random();
  
  switch (studentProfile) {
    case 'excellent': // 98% present
      if (rand < 0.98) return 'P';
      if (rand < 0.99) return 'L';
      return 'A';
      
    case 'good': // 92% present, some late arrivals
      if (rand < 0.92) return 'P';
      if (rand < 0.96) return 'L';
      if (rand < 0.98) return 'E';
      return 'A';
      
    case 'average': // 85% present
      if (rand < 0.85) return 'P';
      if (rand < 0.90) return 'L';
      if (rand < 0.93) return 'E';
      return 'A';
      
    case 'concerning': // 75% present, frequent absences
      if (rand < 0.75) return 'P';
      if (rand < 0.80) return 'L';
      if (rand < 0.85) return 'E';
      return 'A';
      
    default: // good by default
      if (rand < 0.92) return 'P';
      if (rand < 0.96) return 'L';
      return 'A';
  }
}

/**
 * Assign attendance profile based on student index
 */
function getStudentProfile(index, totalStudents) {
  const percentage = index / totalStudents;
  
  if (percentage < 0.4) return 'excellent'; // 40% excellent
  if (percentage < 0.75) return 'good';     // 35% good
  if (percentage < 0.92) return 'average';  // 17% average
  return 'concerning';                       // 8% concerning
}

/**
 * Main function to seed attendance data
 */
async function seedAttendance() {
  console.log('📅 Starting Attendance Seeding Process...\n');
  
  // Fetch all students
  console.log('🔍 Fetching students from Firestore...');
  const studentsSnapshot = await db.collection('students').get();
  const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  console.log(`✅ Found ${students.length} students\n`);
  
  if (students.length === 0) {
    console.log('⚠️  No students found. Please seed students first.');
    process.exit(1);
  }
  
  // Generate school days
  console.log('📆 Generating school days (excluding weekends)...');
  const schoolDays = getSchoolDays();
  console.log(`✅ Generated ${schoolDays.length} school days\n`);
  
  // Check if attendance records already exist
  console.log('🔍 Checking existing attendance records...');
  const existingSnapshot = await db.collection('attendanceRecords').get();
  
  if (existingSnapshot.size > 0) {
    console.log(`⚠️  Found ${existingSnapshot.size} existing attendance records.`);
    console.log('   This script will OVERWRITE existing records.\n');
    
    console.log('🗑️  Deleting existing records...');
    const batch = db.batch();
    existingSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log('✅ Existing records deleted\n');
  }
  
  // Generate attendance for each student
  console.log('🎲 Generating attendance records...\n');
  
  const attendanceRecords = [];
  let profileCounts = {
    excellent: 0,
    good: 0,
    average: 0,
    concerning: 0
  };
  
  students.forEach((student, index) => {
    const profile = getStudentProfile(index, students.length);
    profileCounts[profile]++;
    
    const dailyStatus = {};
    schoolDays.forEach((date, dayIndex) => {
      dailyStatus[date] = generateAttendanceStatus(profile, dayIndex, schoolDays.length);
    });
    
    // Calculate stats
    const statuses = Object.values(dailyStatus);
    const present = statuses.filter(s => s === 'P').length;
    const absent = statuses.filter(s => s === 'A').length;
    const late = statuses.filter(s => s === 'L').length;
    const excused = statuses.filter(s => s === 'E').length;
    const rate = Math.round((present / schoolDays.length) * 100);
    
    attendanceRecords.push({
      studentId: student.id,
      studentName: student.name,
      profile,
      dailyStatus,
      stats: { present, absent, late, excused, total: schoolDays.length, rate }
    });
    
    if ((index + 1) % 10 === 0) {
      console.log(`   ✓ Generated ${index + 1}/${students.length} records...`);
    }
  });
  
  console.log(`\n✅ Generated ${attendanceRecords.length} attendance records\n`);
  
  // Display profile distribution
  console.log('📊 Attendance Profile Distribution:');
  console.log(`   🌟 Excellent (98% present): ${profileCounts.excellent} students`);
  console.log(`   ⭐ Good (92% present): ${profileCounts.good} students`);
  console.log(`   ✓  Average (85% present): ${profileCounts.average} students`);
  console.log(`   ⚠️  Concerning (75% present): ${profileCounts.concerning} students\n`);
  
  // Write to Firestore in batches
  console.log('💾 Writing to Firestore...\n');
  
  const batchSize = 500;
  let written = 0;
  
  for (let i = 0; i < attendanceRecords.length; i += batchSize) {
    const batch = db.batch();
    const batchRecords = attendanceRecords.slice(i, i + batchSize);
    
    batchRecords.forEach(record => {
      const { studentName, profile, stats, ...firestoreData } = record;
      const docRef = db.collection('attendanceRecords').doc(record.studentId);
      batch.set(docRef, firestoreData);
    });
    
    await batch.commit();
    written += batchRecords.length;
    console.log(`   ✅ Written batch ${Math.floor(i / batchSize) + 1}: ${batchRecords.length} records (Total: ${written}/${attendanceRecords.length})`);
  }
  
  console.log('\n═══════════════════════════════════════');
  console.log('📊 Seeding Summary:');
  console.log(`   ✅ Total Students: ${students.length}`);
  console.log(`   ✅ School Days: ${schoolDays.length}`);
  console.log(`   ✅ Records Created: ${written}`);
  console.log('═══════════════════════════════════════\n');
  
  // Show sample records
  console.log('📝 Sample Attendance Records (first 5 students):\n');
  attendanceRecords.slice(0, 5).forEach((record, index) => {
    const { stats, profile } = record;
    console.log(`   ${index + 1}. ${record.studentName}`);
    console.log(`      Profile: ${profile} | Rate: ${stats.rate}%`);
    console.log(`      Present: ${stats.present} | Absent: ${stats.absent} | Late: ${stats.late} | Excused: ${stats.excused}\n`);
  });
  
  console.log('✅ Attendance seeding complete!');
  console.log('📅 Data covers the full school year (June - March)');
  console.log('🎯 Ready for report card printing\n');
  
  process.exit(0);
}

// Run the script
seedAttendance().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
