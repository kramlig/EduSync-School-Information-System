/**
 * SF10 Data Template Generator
 * 
 * Generates an Excel template for clients to fill in student grades data.
 * Run: node generate-sf10-template.cjs
 */
const XLSX = require('xlsx');

const headers = [
  'LRN',
  'Student Name',
  'Grade Level',
  'Section',
  'Adviser',
  'School Year',
  'Subject',
  'Q1',
  'Q2',
  'Q3',
  'Q4'
];

const sampleData = [
  ['123456789012', 'Dela Cruz, Juan M.', 7, 'Rizal', 'Mrs. Santos', '2025-2026', 'Filipino', 85, 88, 90, 87],
  ['123456789012', 'Dela Cruz, Juan M.', 7, 'Rizal', 'Mrs. Santos', '2025-2026', 'English', 80, 82, 85, 83],
  ['123456789012', 'Dela Cruz, Juan M.', 7, 'Rizal', 'Mrs. Santos', '2025-2026', 'Mathematics', 78, 80, 82, 85],
  ['123456789012', 'Dela Cruz, Juan M.', 7, 'Rizal', 'Mrs. Santos', '2025-2026', 'Science', 82, 85, 88, 86],
  ['123456789012', 'Dela Cruz, Juan M.', 7, 'Rizal', 'Mrs. Santos', '2025-2026', 'Araling Panlipunan', 88, 90, 87, 89],
  ['123456789012', 'Dela Cruz, Juan M.', 7, 'Rizal', 'Mrs. Santos', '2025-2026', 'EPP/TLE', 90, 92, 88, 91],
  ['123456789012', 'Dela Cruz, Juan M.', 7, 'Rizal', 'Mrs. Santos', '2025-2026', 'MAPEH', 92, 90, 93, 91],
  ['123456789012', 'Dela Cruz, Juan M.', 7, 'Rizal', 'Mrs. Santos', '2025-2026', 'ESP', 88, 90, 85, 87],
  ['', '', '', '', '', '', '', '', '', '', ''],
  ['987654321098', 'Santos, Maria L.', 7, 'Rizal', 'Mrs. Santos', '2025-2026', 'Filipino', 90, 92, 88, 91],
  ['987654321098', 'Santos, Maria L.', 7, 'Rizal', 'Mrs. Santos', '2025-2026', 'English', 88, 85, 90, 87],
  ['987654321098', 'Santos, Maria L.', 7, 'Rizal', 'Mrs. Santos', '2025-2026', 'Mathematics', 92, 90, 95, 93],
];

const instructions = [
  ['SF10 DATA TEMPLATE — Instructions'],
  [''],
  ['1. Fill one row per student per subject (e.g., Juan has 8 subjects = 8 rows)'],
  ['2. LRN must be exactly 12 digits'],
  ['3. Grades (Q1–Q4) must be whole numbers from 0 to 100'],
  ['4. Grade Level: 1–6 (Elementary), 7–10 (JHS), 11–12 (SHS)'],
  ['5. School Year format: YYYY-YYYY (e.g., 2025-2026)'],
  ['6. Keep Student Name consistent across all rows for the same student'],
  ['7. Leave a blank row between students for readability (optional)'],
  [''],
  ['Common Subjects (JHS): Filipino, English, Mathematics, Science, Araling Panlipunan, EPP/TLE, MAPEH, ESP'],
  ['Common Subjects (Elem): Filipino, English, Mathematics, Science, Araling Panlipunan, EPP, MAPEH, ESP, MTB-MLE (Grades 1-3)'],
];

// Build Grades sheet
const wsGrades = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
wsGrades['!cols'] = [
  { wch: 14 },  // LRN
  { wch: 25 },  // Student Name
  { wch: 12 },  // Grade Level
  { wch: 12 },  // Section
  { wch: 18 },  // Adviser
  { wch: 12 },  // School Year
  { wch: 22 },  // Subject
  { wch: 5 },   // Q1
  { wch: 5 },   // Q2
  { wch: 5 },   // Q3
  { wch: 5 },   // Q4
];

// Build Instructions sheet
const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
wsInstructions['!cols'] = [{ wch: 90 }];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, wsGrades, 'SF10 Grades');
XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

XLSX.writeFile(wb, 'SF10_Data_Template.xlsx');
console.log('✅ Created SF10_Data_Template.xlsx');
