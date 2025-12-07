/**
 * Generate Division Office Demo PowerPoint Presentation
 * Run: node scripts/generate-division-demo-pptx.cjs
 */

const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

// Create presentation
const pptx = new pptxgen();

// Set presentation properties
pptx.author = 'EduSync Development Team';
pptx.title = 'EduSync School Information System - Division Office Demo';
pptx.subject = 'School Information System Presentation';
pptx.company = 'EduSync';

// Define theme colors
const COLORS = {
  primary: '2563EB',      // Blue
  secondary: '7C3AED',    // Purple
  accent: '10B981',       // Green
  dark: '1E293B',         // Slate
  light: 'F8FAFC',        // Light
  white: 'FFFFFF',
  orange: 'F59E0B',
  red: 'EF4444',
  teal: '14B8A6'
};

// Define master slide layouts
pptx.defineSlideMaster({
  title: 'TITLE_SLIDE',
  background: { color: COLORS.primary },
  objects: [
    { rect: { x: 0, y: 4.5, w: '100%', h: 1.0, fill: { color: COLORS.secondary } } }
  ]
});

pptx.defineSlideMaster({
  title: 'CONTENT_SLIDE',
  background: { color: COLORS.white },
  objects: [
    { rect: { x: 0, y: 0, w: '100%', h: 0.8, fill: { color: COLORS.primary } } },
    { rect: { x: 0, y: 5.2, w: '100%', h: 0.3, fill: { color: COLORS.secondary } } }
  ]
});

// ============================================
// SLIDE 1: Title Slide
// ============================================
let slide = pptx.addSlide({ masterName: 'TITLE_SLIDE' });
slide.addText('🎓 EduSync', {
  x: 0.5, y: 1.0, w: '90%', h: 1.0,
  fontSize: 54, bold: true, color: COLORS.white,
  fontFace: 'Arial'
});
slide.addText('School Information System', {
  x: 0.5, y: 2.0, w: '90%', h: 0.6,
  fontSize: 32, color: COLORS.white,
  fontFace: 'Arial'
});
slide.addText('Division Office Demo Presentation', {
  x: 0.5, y: 2.8, w: '90%', h: 0.5,
  fontSize: 24, color: COLORS.light,
  fontFace: 'Arial'
});
slide.addText('December 2025', {
  x: 0.5, y: 4.7, w: '90%', h: 0.4,
  fontSize: 18, color: COLORS.white,
  fontFace: 'Arial'
});

// ============================================
// SLIDE 2: Agenda
// ============================================
slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
slide.addText('📋 Agenda', {
  x: 0.5, y: 0.15, w: '90%', h: 0.5,
  fontSize: 28, bold: true, color: COLORS.white
});

const agendaItems = [
  { num: '1', text: 'Introduction - What is EduSync?' },
  { num: '2', text: 'The Problem - Current Challenges in Schools' },
  { num: '3', text: 'The Solution - Key Features & Capabilities' },
  { num: '4', text: 'Live Demo - System Walkthrough' },
  { num: '5', text: 'DepEd Compliance - Official Forms Automation' },
  { num: '6', text: 'Benefits - Time & Cost Savings' },
  { num: '7', text: 'Q&A - Questions & Discussion' }
];

agendaItems.forEach((item, idx) => {
  slide.addText(item.num, {
    x: 0.5, y: 1.1 + (idx * 0.55), w: 0.5, h: 0.45,
    fontSize: 18, bold: true, color: COLORS.white,
    fill: { color: COLORS.primary },
    align: 'center', valign: 'middle'
  });
  slide.addText(item.text, {
    x: 1.1, y: 1.1 + (idx * 0.55), w: 8, h: 0.45,
    fontSize: 18, color: COLORS.dark
  });
});

// ============================================
// SLIDE 3: What is EduSync?
// ============================================
slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
slide.addText('🏫 What is EduSync?', {
  x: 0.5, y: 0.15, w: '90%', h: 0.5,
  fontSize: 28, bold: true, color: COLORS.white
});

slide.addText('A Complete School Management Ecosystem', {
  x: 0.5, y: 1.0, w: '90%', h: 0.4,
  fontSize: 22, bold: true, color: COLORS.primary
});

slide.addText('EduSync is a cloud-based, DepEd-compliant School Information System designed specifically for Philippine schools.', {
  x: 0.5, y: 1.5, w: '90%', h: 0.6,
  fontSize: 16, color: COLORS.dark
});

const highlights = [
  { icon: '✅', text: '100% DepEd-Compliant - All forms and calculations follow official guidelines' },
  { icon: '✅', text: 'Cloud-Based - Accessible anywhere, anytime, on any device' },
  { icon: '✅', text: 'Offline-Ready - Works without internet, syncs when connected' },
  { icon: '✅', text: 'Modern & User-Friendly - Intuitive interface requiring minimal training' }
];

highlights.forEach((item, idx) => {
  slide.addText(item.icon + ' ' + item.text, {
    x: 0.5, y: 2.3 + (idx * 0.6), w: '90%', h: 0.5,
    fontSize: 16, color: COLORS.dark
  });
});

// ============================================
// SLIDE 4: The Problem We Solve
// ============================================
slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
slide.addText('🎯 The Problem We Solve', {
  x: 0.5, y: 0.15, w: '90%', h: 0.5,
  fontSize: 28, bold: true, color: COLORS.white
});

slide.addText('Current Pain Points in Schools:', {
  x: 0.5, y: 1.0, w: '90%', h: 0.4,
  fontSize: 20, bold: true, color: COLORS.dark
});

const problems = [
  { icon: '📄', title: 'Manual Paperwork', desc: 'Teachers spend 40%+ of time on forms' },
  { icon: '📊', title: 'No Real-Time Data', desc: 'Delayed grade compilation and reporting' },
  { icon: '🔄', title: 'Duplicate Entry', desc: 'Same data entered multiple times' },
  { icon: '📑', title: 'Compliance Burden', desc: 'DepEd forms require exact formatting' },
  { icon: '⚠️', title: 'Human Error', desc: 'Calculation mistakes in grades/reports' },
  { icon: '👥', title: 'Poor Communication', desc: 'Limited parent-school engagement' }
];

problems.forEach((item, idx) => {
  const col = idx % 2;
  const row = Math.floor(idx / 2);
  slide.addText(item.icon + ' ' + item.title, {
    x: 0.5 + (col * 4.5), y: 1.5 + (row * 1.1), w: 4.2, h: 0.4,
    fontSize: 16, bold: true, color: COLORS.primary
  });
  slide.addText(item.desc, {
    x: 0.5 + (col * 4.5), y: 1.9 + (row * 1.1), w: 4.2, h: 0.4,
    fontSize: 14, color: COLORS.dark
  });
});

// ============================================
// SLIDE 5: Solution Overview - 9 Modules
// ============================================
slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
slide.addText('✨ EduSync Solution Overview', {
  x: 0.5, y: 0.15, w: '90%', h: 0.5,
  fontSize: 28, bold: true, color: COLORS.white
});

slide.addText('9 Powerful Integrated Modules', {
  x: 0.5, y: 0.9, w: '90%', h: 0.4,
  fontSize: 20, bold: true, color: COLORS.dark
});

const modules = [
  { icon: '📚', name: 'Academic', features: 'Gradebook, Core Values, Attendance' },
  { icon: '📋', name: 'DepEd Forms', features: 'SF1-SF10, Form 137/138, ELLN' },
  { icon: '📝', name: 'Enrollment', features: 'Online Applications, Documents' },
  { icon: '👨‍🏫', name: 'Personnel', features: 'Teacher Mgmt, Assignments' },
  { icon: '📊', name: 'Analytics', features: 'Real-time Stats, Alerts' },
  { icon: '👥', name: 'Parent Portal', features: 'Grades, Attendance, Bills' },
  { icon: '💰', name: 'Financial', features: 'Fees, Payments, Receipts' },
  { icon: '📱', name: 'Mobile', features: 'PWA, Offline Mode' },
  { icon: '🔔', name: 'Notifications', features: 'SMS, Email, Alerts' }
];

modules.forEach((mod, idx) => {
  const col = idx % 3;
  const row = Math.floor(idx / 3);
  
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.4 + (col * 3.1), y: 1.4 + (row * 1.2), w: 2.9, h: 1.0,
    fill: { color: COLORS.light },
    line: { color: COLORS.primary, width: 1 }
  });
  
  slide.addText(mod.icon + ' ' + mod.name, {
    x: 0.5 + (col * 3.1), y: 1.5 + (row * 1.2), w: 2.7, h: 0.4,
    fontSize: 14, bold: true, color: COLORS.primary, align: 'center'
  });
  
  slide.addText(mod.features, {
    x: 0.5 + (col * 3.1), y: 1.9 + (row * 1.2), w: 2.7, h: 0.4,
    fontSize: 10, color: COLORS.dark, align: 'center'
  });
});

// ============================================
// SLIDE 6: Academic Management
// ============================================
slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
slide.addText('📚 Academic Management', {
  x: 0.5, y: 0.15, w: '90%', h: 0.5,
  fontSize: 28, bold: true, color: COLORS.white
});

slide.addText('Complete Gradebook System', {
  x: 0.5, y: 1.0, w: '90%', h: 0.4,
  fontSize: 20, bold: true, color: COLORS.primary
});

const academicFeatures = [
  '• Quarterly Grading - Q1, Q2, Q3, Q4 with automatic final grade calculation',
  '• DepEd Components - Written Works, Performance Tasks, Quarterly Assessments',
  '• Automatic Transmutation - Uses official DepEd transmutation table',
  '• Core Values Assessment - Maka-Diyos, Maka-tao, Makakalikasan, Makabansa',
  '• Behavioral Grading - AO, SO, RO, NO ratings'
];

academicFeatures.forEach((feat, idx) => {
  slide.addText(feat, {
    x: 0.5, y: 1.5 + (idx * 0.45), w: '90%', h: 0.4,
    fontSize: 14, color: COLORS.dark
  });
});

slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.5, y: 3.8, w: 8.5, h: 1.0,
  fill: { color: COLORS.accent + '20' },
  line: { color: COLORS.accent, width: 1 }
});

slide.addText('Benefits:', {
  x: 0.7, y: 3.9, w: 8, h: 0.3,
  fontSize: 14, bold: true, color: COLORS.accent
});
slide.addText('⏱️ 90% faster grade computation  •  ✅ Zero calculation errors  •  📊 Instant reports', {
  x: 0.7, y: 4.25, w: 8, h: 0.4,
  fontSize: 13, color: COLORS.dark
});

// ============================================
// SLIDE 7: DepEd Forms Automation
// ============================================
slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
slide.addText('📋 DepEd Forms Automation', {
  x: 0.5, y: 0.15, w: '90%', h: 0.5,
  fontSize: 28, bold: true, color: COLORS.white
});

slide.addText('Official Forms Generated in 3 Clicks', {
  x: 0.5, y: 0.9, w: '90%', h: 0.4,
  fontSize: 20, bold: true, color: COLORS.primary
});

// Create table for forms
const tableData = [
  [{ text: 'Form', options: { bold: true, fill: { color: COLORS.primary }, color: COLORS.white } },
   { text: 'Description', options: { bold: true, fill: { color: COLORS.primary }, color: COLORS.white } },
   { text: 'Status', options: { bold: true, fill: { color: COLORS.primary }, color: COLORS.white } }],
  ['SF1', 'School Register', '✅ Ready'],
  ['SF2', 'Daily Attendance Record', '✅ Ready'],
  ['SF5', 'Report on Promotion', '✅ Ready'],
  ['SF7', 'Personnel Assignment List', '✅ Ready'],
  ['SF9', 'Learner\'s Progress Report Card', '✅ Ready'],
  ['SF10', 'Learner\'s Permanent Record', '✅ Ready'],
  ['Form 137', 'Permanent Record', '✅ Ready'],
  ['Form 138', 'Report Card', '✅ Ready'],
  ['ELLN', 'Early Language Literacy & Numeracy', '✅ Ready']
];

slide.addTable(tableData, {
  x: 0.5, y: 1.35, w: 8.5,
  fontSize: 11,
  color: COLORS.dark,
  border: { type: 'solid', color: COLORS.primary, pt: 0.5 },
  rowH: 0.35,
  colW: [1.0, 5.5, 2.0],
  valign: 'middle'
});

slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.5, y: 4.7, w: 8.5, h: 0.5,
  fill: { color: COLORS.primary },
  line: { color: COLORS.primary }
});
slide.addText('"3-Click Generation" - Select students → Choose form → Download PDF', {
  x: 0.5, y: 4.75, w: 8.5, h: 0.4,
  fontSize: 14, bold: true, color: COLORS.white, align: 'center'
});

// ============================================
// SLIDE 8: Student Management
// ============================================
slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
slide.addText('👨‍🎓 Student Management', {
  x: 0.5, y: 0.15, w: '90%', h: 0.5,
  fontSize: 28, bold: true, color: COLORS.white
});

slide.addText('Complete Learner Information System', {
  x: 0.5, y: 1.0, w: '90%', h: 0.4,
  fontSize: 20, bold: true, color: COLORS.primary
});

const studentFeatures = [
  { title: 'Student Profiles', desc: 'Complete learner information with photo' },
  { title: 'LRN Tracking', desc: 'Learner Reference Number management' },
  { title: 'Enrollment History', desc: 'Track complete academic journey' },
  { title: 'Section Management', desc: 'Organize by grade level and section' },
  { title: 'Search & Filter', desc: 'Find any student instantly' }
];

studentFeatures.forEach((feat, idx) => {
  slide.addText('✓ ' + feat.title, {
    x: 0.5, y: 1.5 + (idx * 0.55), w: 3, h: 0.35,
    fontSize: 14, bold: true, color: COLORS.primary
  });
  slide.addText(feat.desc, {
    x: 3.5, y: 1.5 + (idx * 0.55), w: 5.5, h: 0.35,
    fontSize: 14, color: COLORS.dark
  });
});

slide.addText('Data Captured:', {
  x: 0.5, y: 4.2, w: 3, h: 0.3,
  fontSize: 14, bold: true, color: COLORS.dark
});
slide.addText('Personal Info • Contact Details • Parent/Guardian • Previous Records • Medical Info • Documents', {
  x: 0.5, y: 4.5, w: 8.5, h: 0.4,
  fontSize: 12, color: COLORS.dark
});

// ============================================
// SLIDE 9: Time & Cost Savings
// ============================================
slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
slide.addText('⏱️ Time & Cost Savings', {
  x: 0.5, y: 0.15, w: '90%', h: 0.5,
  fontSize: 28, bold: true, color: COLORS.white
});

slide.addText('Impact on School Operations', {
  x: 0.5, y: 0.9, w: '90%', h: 0.4,
  fontSize: 20, bold: true, color: COLORS.primary
});

const savingsTable = [
  [{ text: 'Task', options: { bold: true, fill: { color: COLORS.primary }, color: COLORS.white } },
   { text: 'Before', options: { bold: true, fill: { color: COLORS.primary }, color: COLORS.white } },
   { text: 'With EduSync', options: { bold: true, fill: { color: COLORS.primary }, color: COLORS.white } },
   { text: 'Savings', options: { bold: true, fill: { color: COLORS.primary }, color: COLORS.white } }],
  ['Grade Computation', '4-6 hours/teacher', '30 minutes', { text: '90%', options: { bold: true, color: COLORS.accent } }],
  ['Form 137 Generation', '15-20 min/student', '1 minute', { text: '95%', options: { bold: true, color: COLORS.accent } }],
  ['Attendance Recording', '10 min/class/day', '2 minutes', { text: '80%', options: { bold: true, color: COLORS.accent } }],
  ['Report Compilation', '2-3 days', '5 minutes', { text: '99%', options: { bold: true, color: COLORS.accent } }],
  ['Parent Inquiries', '50+ calls/week', '10 calls/week', { text: '80%', options: { bold: true, color: COLORS.accent } }]
];

slide.addTable(savingsTable, {
  x: 0.5, y: 1.3, w: 8.5,
  fontSize: 12,
  color: COLORS.dark,
  border: { type: 'solid', color: COLORS.primary, pt: 0.5 },
  rowH: 0.45,
  colW: [2.5, 2.0, 2.0, 2.0],
  valign: 'middle',
  align: 'center'
});

slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.5, y: 4.0, w: 8.5, h: 1.0,
  fill: { color: COLORS.accent + '20' },
  line: { color: COLORS.accent, width: 2 }
});

slide.addText('Annual Savings Per School:', {
  x: 0.7, y: 4.1, w: 8, h: 0.3,
  fontSize: 14, bold: true, color: COLORS.accent
});
slide.addText('💡 500+ hours of teacher time saved  •  💰 ₱50,000+ in paper/printing costs  •  ⚡ Faster DepEd compliance', {
  x: 0.7, y: 4.45, w: 8, h: 0.4,
  fontSize: 12, color: COLORS.dark
});

// ============================================
// SLIDE 10: Live Demo Agenda
// ============================================
slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
slide.addText('🎮 Live Demo', {
  x: 0.5, y: 0.15, w: '90%', h: 0.5,
  fontSize: 28, bold: true, color: COLORS.white
});

slide.addText('System Walkthrough (18 minutes)', {
  x: 0.5, y: 1.0, w: '90%', h: 0.4,
  fontSize: 20, bold: true, color: COLORS.primary
});

const demoSteps = [
  { time: '2 min', title: 'Login & Dashboard', desc: 'Role-based access, main dashboard overview' },
  { time: '3 min', title: 'Student Management', desc: 'View/add students, search capabilities' },
  { time: '5 min', title: 'Gradebook', desc: 'Enter grades, auto-calculations, generate forms' },
  { time: '5 min', title: 'DepEd Forms', desc: 'Generate SF1, SF2, download PDFs' },
  { time: '3 min', title: 'Reports & Analytics', desc: 'Enrollment stats, attendance, dashboards' }
];

demoSteps.forEach((step, idx) => {
  slide.addShape(pptx.shapes.OVAL, {
    x: 0.5, y: 1.5 + (idx * 0.7), w: 0.8, h: 0.5,
    fill: { color: COLORS.primary }
  });
  slide.addText(step.time, {
    x: 0.5, y: 1.55 + (idx * 0.7), w: 0.8, h: 0.4,
    fontSize: 10, bold: true, color: COLORS.white, align: 'center'
  });
  slide.addText(step.title, {
    x: 1.5, y: 1.5 + (idx * 0.7), w: 2.5, h: 0.4,
    fontSize: 14, bold: true, color: COLORS.dark
  });
  slide.addText(step.desc, {
    x: 4.0, y: 1.5 + (idx * 0.7), w: 5, h: 0.4,
    fontSize: 12, color: COLORS.dark
  });
});

// ============================================
// SLIDE 11: Why Choose EduSync
// ============================================
slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
slide.addText('🏆 Why Choose EduSync?', {
  x: 0.5, y: 0.15, w: '90%', h: 0.5,
  fontSize: 28, bold: true, color: COLORS.white
});

slide.addText('Competitive Advantages', {
  x: 0.5, y: 0.9, w: '90%', h: 0.4,
  fontSize: 20, bold: true, color: COLORS.primary
});

const comparisonTable = [
  [{ text: 'Feature', options: { bold: true, fill: { color: COLORS.primary }, color: COLORS.white } },
   { text: 'Traditional SIS', options: { bold: true, fill: { color: COLORS.dark }, color: COLORS.white } },
   { text: 'EduSync', options: { bold: true, fill: { color: COLORS.accent }, color: COLORS.white } }],
  ['DepEd Compliance', 'Partial', '✅ 100%'],
  ['Offline Support', '❌ No', '✅ Yes'],
  ['Mobile Access', '❌ Limited', '✅ Full'],
  ['Real-Time Updates', '❌ Batch', '✅ Live'],
  ['Parent Portal', '❌ None', '✅ Complete'],
  ['Setup Time', 'Weeks', '✅ Hours'],
  ['Auto-Calculations', '❌ Manual', '✅ Automatic']
];

slide.addTable(comparisonTable, {
  x: 0.5, y: 1.3, w: 8.5,
  fontSize: 12,
  color: COLORS.dark,
  border: { type: 'solid', color: COLORS.primary, pt: 0.5 },
  rowH: 0.45,
  colW: [3.0, 2.75, 2.75],
  valign: 'middle',
  align: 'center'
});

// ============================================
// SLIDE 12: Security & Reliability
// ============================================
slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
slide.addText('🔐 Security & Reliability', {
  x: 0.5, y: 0.15, w: '90%', h: 0.5,
  fontSize: 28, bold: true, color: COLORS.white
});

slide.addText('Enterprise-Grade Security', {
  x: 0.5, y: 1.0, w: 4, h: 0.4,
  fontSize: 18, bold: true, color: COLORS.primary
});

slide.addText('High Availability', {
  x: 5, y: 1.0, w: 4, h: 0.4,
  fontSize: 18, bold: true, color: COLORS.primary
});

const securityFeatures = [
  '🔒 Encrypted Data (at rest & transit)',
  '👤 Role-Based Access Control',
  '📝 Complete Audit Logs',
  '🔑 Secure Authentication'
];

const reliabilityFeatures = [
  '☁️ 99.9% Uptime Guarantee',
  '📱 Offline Mode (PWA)',
  '🔄 Auto-Sync When Connected',
  '💾 Daily Automated Backups'
];

securityFeatures.forEach((feat, idx) => {
  slide.addText(feat, {
    x: 0.5, y: 1.5 + (idx * 0.5), w: 4.2, h: 0.4,
    fontSize: 13, color: COLORS.dark
  });
});

reliabilityFeatures.forEach((feat, idx) => {
  slide.addText(feat, {
    x: 5, y: 1.5 + (idx * 0.5), w: 4.2, h: 0.4,
    fontSize: 13, color: COLORS.dark
  });
});

// ============================================
// SLIDE 13: Implementation
// ============================================
slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
slide.addText('📞 Implementation & Support', {
  x: 0.5, y: 0.15, w: '90%', h: 0.5,
  fontSize: 28, bold: true, color: COLORS.white
});

slide.addText('Getting Started is Easy', {
  x: 0.5, y: 1.0, w: '90%', h: 0.4,
  fontSize: 20, bold: true, color: COLORS.primary
});

const implSteps = [
  { day: 'Day 1-2', task: 'System setup and configuration' },
  { day: 'Day 3-4', task: 'Data migration (existing students/teachers)' },
  { day: 'Day 5', task: 'Staff training' },
  { day: 'Day 6-7', task: 'Go-live with support' }
];

implSteps.forEach((step, idx) => {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.5 + (idx * 2.2), y: 1.6, w: 2.0, h: 1.2,
    fill: { color: idx === 3 ? COLORS.accent : COLORS.primary }
  });
  slide.addText(step.day, {
    x: 0.5 + (idx * 2.2), y: 1.7, w: 2.0, h: 0.4,
    fontSize: 12, bold: true, color: COLORS.white, align: 'center'
  });
  slide.addText(step.task, {
    x: 0.5 + (idx * 2.2), y: 2.1, w: 2.0, h: 0.6,
    fontSize: 10, color: COLORS.white, align: 'center'
  });
});

slide.addText('Ongoing Support:', {
  x: 0.5, y: 3.2, w: '90%', h: 0.4,
  fontSize: 16, bold: true, color: COLORS.dark
});

slide.addText('📧 Priority email support  •  📞 Phone support (office hours)  •  📚 Help docs & video tutorials  •  🔄 Regular updates', {
  x: 0.5, y: 3.6, w: '90%', h: 0.4,
  fontSize: 13, color: COLORS.dark
});

// ============================================
// SLIDE 14: Pricing
// ============================================
slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
slide.addText('💰 Pricing Plans', {
  x: 0.5, y: 0.15, w: '90%', h: 0.5,
  fontSize: 28, bold: true, color: COLORS.white
});

slide.addText('Simple, Transparent Pricing - Less than ₱4 per student per month', {
  x: 0.5, y: 0.9, w: '90%', h: 0.4,
  fontSize: 16, bold: true, color: COLORS.primary
});

// Starter Plan
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.4, y: 1.35, w: 2.8, h: 3.0,
  fill: { color: COLORS.light },
  line: { color: COLORS.primary, width: 1 }
});
slide.addText('🌱 STARTER', {
  x: 0.4, y: 1.45, w: 2.8, h: 0.35,
  fontSize: 14, bold: true, color: COLORS.primary, align: 'center'
});
slide.addText('₱1,999/mo', {
  x: 0.4, y: 1.8, w: 2.8, h: 0.4,
  fontSize: 20, bold: true, color: COLORS.dark, align: 'center'
});
slide.addText('Perfect for small schools', {
  x: 0.4, y: 2.2, w: 2.8, h: 0.25,
  fontSize: 9, italic: true, color: COLORS.dark, align: 'center'
});
slide.addText('• Up to 500 students\n• Unlimited teachers ✨\n• Core features (grades, forms)\n• Parent portal access\n• Email support\n• 30-day free trial', {
  x: 0.5, y: 2.5, w: 2.6, h: 1.6,
  fontSize: 9, color: COLORS.dark
});

// Professional Plan (highlighted)
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 3.35, y: 1.2, w: 2.8, h: 3.3,
  fill: { color: COLORS.primary },
  line: { color: COLORS.primary, width: 2 }
});
slide.addText('🚀 PROFESSIONAL', {
  x: 3.35, y: 1.3, w: 2.8, h: 0.35,
  fontSize: 14, bold: true, color: COLORS.white, align: 'center'
});
slide.addText('₱4,999/mo', {
  x: 3.35, y: 1.65, w: 2.8, h: 0.4,
  fontSize: 20, bold: true, color: COLORS.white, align: 'center'
});
slide.addText('⭐ MOST POPULAR', {
  x: 3.35, y: 2.05, w: 2.8, h: 0.25,
  fontSize: 10, bold: true, color: COLORS.orange, align: 'center'
});
slide.addText('Most popular choice', {
  x: 3.35, y: 2.3, w: 2.8, h: 0.25,
  fontSize: 9, italic: true, color: COLORS.light, align: 'center'
});
slide.addText('• Up to 1,500 students\n• Unlimited teachers ✨\n• All features + AI analytics\n• Parent portal + billing\n• Email & SMS notifications\n• Payment proof verification\n• Priority support\n• 30-day free trial', {
  x: 3.45, y: 2.55, w: 2.6, h: 1.8,
  fontSize: 9, color: COLORS.white
});

// Enterprise Plan
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 6.3, y: 1.35, w: 2.8, h: 3.0,
  fill: { color: COLORS.light },
  line: { color: COLORS.secondary, width: 1 }
});
slide.addText('🏆 ENTERPRISE', {
  x: 6.3, y: 1.45, w: 2.8, h: 0.35,
  fontSize: 14, bold: true, color: COLORS.secondary, align: 'center'
});
slide.addText('Custom', {
  x: 6.3, y: 1.8, w: 2.8, h: 0.4,
  fontSize: 20, bold: true, color: COLORS.dark, align: 'center'
});
slide.addText('For large schools & divisions', {
  x: 6.3, y: 2.2, w: 2.8, h: 0.25,
  fontSize: 9, italic: true, color: COLORS.dark, align: 'center'
});
slide.addText('• Unlimited students\n• Unlimited teachers\n• All features + customization\n• Dedicated account manager\n• On-site training\n• SLA guarantee', {
  x: 6.4, y: 2.5, w: 2.6, h: 1.6,
  fontSize: 9, color: COLORS.dark
});

// Free trial note
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.4, y: 4.5, w: 8.7, h: 0.6,
  fill: { color: COLORS.accent },
  line: { color: COLORS.accent }
});
slide.addText('🎁 30-Day FREE Trial on all plans  •  No credit card required  •  Unlimited teachers included', {
  x: 0.4, y: 4.55, w: 8.7, h: 0.5,
  fontSize: 12, bold: true, color: COLORS.white, align: 'center'
});

// ============================================
// SLIDE 15: Development Roadmap
// ============================================
slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
slide.addText('🗺️ Development Roadmap', {
  x: 0.5, y: 0.15, w: '90%', h: 0.5,
  fontSize: 28, bold: true, color: COLORS.white
});

slide.addText('DepEd Forms - Current Status & Upcoming Features', {
  x: 0.5, y: 0.9, w: '90%', h: 0.35,
  fontSize: 16, bold: true, color: COLORS.primary
});

// Completed Forms Section
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.4, y: 1.3, w: 4.3, h: 2.6,
  fill: { color: COLORS.light },
  line: { color: COLORS.accent, width: 2 }
});
slide.addText('✅ COMPLETED FORMS (11)', {
  x: 0.5, y: 1.4, w: 4.1, h: 0.35,
  fontSize: 12, bold: true, color: COLORS.accent
});

const completedForms = [
  'SF1 - School Register',
  'SF2 - Daily Attendance Report',
  'SF3 - Books Issued & Returned',
  'SF4 - Monthly Learner Movement',
  'SF5 - Report on Promotion (ES/JHS)',
  'SF5-K - Promotion Report (Kinder)',
  'SF6 - Textbook Ledger',
  'SF7 - Personnel Assignment List',
  'SF9 - Progress Report Card',
  'Form 137 - Permanent Record',
  'Form 138 - Report Card'
];

completedForms.forEach((form, idx) => {
  slide.addText('✓ ' + form, {
    x: 0.5, y: 1.75 + (idx * 0.18), w: 4.1, h: 0.18,
    fontSize: 8, color: COLORS.dark
  });
});

// In Development Section
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 4.85, y: 1.3, w: 4.3, h: 2.6,
  fill: { color: COLORS.light },
  line: { color: COLORS.orange, width: 2 }
});
slide.addText('🚧 COMING SOON (6)', {
  x: 4.95, y: 1.4, w: 4.1, h: 0.35,
  fontSize: 12, bold: true, color: COLORS.orange
});

const upcomingForms = [
  { form: 'SF5B-SHS - Complete SHS Requirements', eta: 'Q1 2026' },
  { form: 'SF8 - Health & Nutrition (Kinder)', eta: 'Q1 2026' },
  { form: 'SF8-SHS - Health & Nutrition (SHS)', eta: 'Q1 2026' },
  { form: 'SF3-SHS - Books Issued (SHS)', eta: 'Q1 2026' },
  { form: 'SF4-SHS - Monthly Movement (SHS)', eta: 'Q1 2026' },
  { form: 'ELLN Reports - Enhanced Analytics', eta: 'Q1 2026' }
];

upcomingForms.forEach((item, idx) => {
  slide.addText('⏳ ' + item.form, {
    x: 4.95, y: 1.8 + (idx * 0.35), w: 3.2, h: 0.2,
    fontSize: 9, color: COLORS.dark
  });
  slide.addText(item.eta, {
    x: 8.1, y: 1.8 + (idx * 0.35), w: 1.0, h: 0.2,
    fontSize: 8, color: COLORS.orange, align: 'right'
  });
});

// Progress Bar
slide.addText('Overall DepEd Forms Completion:', {
  x: 0.5, y: 4.1, w: 4, h: 0.3,
  fontSize: 11, bold: true, color: COLORS.dark
});

// Background bar
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.4, y: 4.4, w: 8.7, h: 0.4,
  fill: { color: 'E2E8F0' },
  line: { color: 'E2E8F0' }
});

// Progress fill (65%)
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.4, y: 4.4, w: 5.7, h: 0.4,
  fill: { color: COLORS.accent },
  line: { color: COLORS.accent }
});

slide.addText('65% Complete (11 of 17 forms)', {
  x: 0.4, y: 4.42, w: 8.7, h: 0.35,
  fontSize: 11, bold: true, color: COLORS.white, align: 'center'
});

slide.addText('💡 All upcoming forms included FREE for existing subscribers!', {
  x: 0.5, y: 4.9, w: 8.5, h: 0.25,
  fontSize: 10, italic: true, color: COLORS.primary, align: 'center'
});

// ============================================
// SLIDE 16: Next Steps
// ============================================
slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
slide.addText('🤝 Next Steps', {
  x: 0.5, y: 0.15, w: '90%', h: 0.5,
  fontSize: 28, bold: true, color: COLORS.white
});

slide.addText('How to Move Forward', {
  x: 0.5, y: 1.0, w: '90%', h: 0.4,
  fontSize: 20, bold: true, color: COLORS.primary
});

// Option 1
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.5, y: 1.5, w: 4, h: 1.8,
  fill: { color: COLORS.light },
  line: { color: COLORS.primary, width: 2 }
});
slide.addText('Option 1: Pilot Program', {
  x: 0.6, y: 1.6, w: 3.8, h: 0.4,
  fontSize: 14, bold: true, color: COLORS.primary
});
slide.addText('• Free trial for one semester\n• Full access to all features\n• Dedicated support\n• No commitment required', {
  x: 0.6, y: 2.0, w: 3.8, h: 1.2,
  fontSize: 12, color: COLORS.dark
});

// Option 2
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 5, y: 1.5, w: 4, h: 1.8,
  fill: { color: COLORS.accent + '20' },
  line: { color: COLORS.accent, width: 2 }
});
slide.addText('Option 2: Full Adoption', {
  x: 5.1, y: 1.6, w: 3.8, h: 0.4,
  fontSize: 14, bold: true, color: COLORS.accent
});
slide.addText('• Complete setup & training\n• Data migration assistance\n• Priority support\n• Customization options', {
  x: 5.1, y: 2.0, w: 3.8, h: 1.2,
  fontSize: 12, color: COLORS.dark
});

slide.addText('Contact Us:', {
  x: 0.5, y: 3.6, w: '90%', h: 0.3,
  fontSize: 14, bold: true, color: COLORS.dark
});
slide.addText('📧 support@edusync.ph   •   🌐 www.edusync.ph   •   📱 Request a personalized demo', {
  x: 0.5, y: 3.9, w: '90%', h: 0.4,
  fontSize: 13, color: COLORS.primary
});

// ============================================
// SLIDE 15: Thank You
// ============================================
slide = pptx.addSlide({ masterName: 'TITLE_SLIDE' });
slide.addText('🙏 Thank You!', {
  x: 0.5, y: 1.2, w: '90%', h: 0.8,
  fontSize: 48, bold: true, color: COLORS.white, align: 'center'
});
slide.addText('EduSync School Information System', {
  x: 0.5, y: 2.2, w: '90%', h: 0.5,
  fontSize: 24, color: COLORS.white, align: 'center'
});
slide.addText('"Transforming Philippine Education, One School at a Time"', {
  x: 0.5, y: 2.9, w: '90%', h: 0.5,
  fontSize: 18, italic: true, color: COLORS.light, align: 'center'
});
slide.addText('Questions & Discussion', {
  x: 0.5, y: 4.7, w: '90%', h: 0.4,
  fontSize: 20, bold: true, color: COLORS.white, align: 'center'
});

// ============================================
// SLIDE 16: Appendix - Demo Credentials
// ============================================
slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
slide.addText('📎 Appendix: Demo Credentials', {
  x: 0.5, y: 0.15, w: '90%', h: 0.5,
  fontSize: 28, bold: true, color: COLORS.white
});

slide.addText('For Division Office Demo', {
  x: 0.5, y: 1.0, w: '90%', h: 0.4,
  fontSize: 18, bold: true, color: COLORS.primary
});

const credentialsTable = [
  [{ text: 'Role', options: { bold: true, fill: { color: COLORS.primary }, color: COLORS.white } },
   { text: 'Email', options: { bold: true, fill: { color: COLORS.primary }, color: COLORS.white } },
   { text: 'Password', options: { bold: true, fill: { color: COLORS.primary }, color: COLORS.white } }],
  ['Admin', 'admin@edusync.local', 'admin123'],
  ['Teacher', 'teacher@edusync.local', 'teacher123'],
  ['Parent', 'parent@edusync.local', 'parent123'],
  ['Student', 'student@edusync.local', 'student123']
];

slide.addTable(credentialsTable, {
  x: 0.5, y: 1.5, w: 8.5,
  fontSize: 14,
  color: COLORS.dark,
  border: { type: 'solid', color: COLORS.primary, pt: 0.5 },
  rowH: 0.5,
  colW: [2.0, 4.0, 2.5],
  valign: 'middle',
  align: 'center'
});

slide.addText('Demo URL:', {
  x: 0.5, y: 3.8, w: 2, h: 0.4,
  fontSize: 14, bold: true, color: COLORS.dark
});
slide.addText('🔗 https://edusync-sis.web.app', {
  x: 2.5, y: 3.8, w: 6, h: 0.4,
  fontSize: 14, color: COLORS.primary
});

slide.addText('Note: Demo credentials are for testing purposes only', {
  x: 0.5, y: 4.4, w: '90%', h: 0.4,
  fontSize: 12, italic: true, color: COLORS.dark
});

// Save the presentation
const outputPath = path.join(__dirname, '..', 'docs', 'presentations', 'EduSync_Division_Office_Demo.pptx');
pptx.writeFile({ fileName: outputPath })
  .then(() => {
    console.log('✅ PowerPoint presentation created successfully!');
    console.log(`📁 Location: ${outputPath}`);
  })
  .catch(err => {
    console.error('❌ Error creating presentation:', err);
  });
