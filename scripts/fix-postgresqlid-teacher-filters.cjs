#!/usr/bin/env node
/**
 * Fix all components to use postgresqlId instead of Firebase UID for teacher filtering
 * 
 * This script updates all grade-related views to properly filter students/sections
 * by PostgreSQL teacher ID instead of Firebase Auth UID.
 */

const fs = require('fs');
const path = require('path');

const componentsToFix = [
  'components/AttendanceView.tsx',
  'components/GradebookView.tsx',
  'components/GradesView.tsx',
  'components/CoreValuesView.tsx',
  'components/CoreValuesGradebookView.tsx',
  'components/GradesDashboard.tsx',
  'components/GradesReportsDashboard.tsx'
];

const fixes = [
  {
    search: /const sectionIds = new Set<string>\(\);\s+\/\/ 1\. Sections where the user is the adviser\s+const teacherAdviserSection = sections\.find\(s => s\.adviserId === authUser\.id\);/g,
    replace: `const sectionIds = new Set<string>();
    
    // CRITICAL: Use postgresqlId for PostgreSQL queries, not Firebase UID
    const teacherId = (authUser as any).postgresqlId || authUser.id;
    
    // 1. Sections where the user is the adviser
    const teacherAdviserSection = sections.find(s => s.adviserId === teacherId);`
  },
  {
    search: /const teacherAdviserSection = activeSections\.find\(s => s\.adviserId === authUser\.id\);/g,
    replace: `const teacherId = (authUser as any).postgresqlId || authUser.id;
    
    // 1. Sections where the user is the adviser
    const teacherAdviserSection = activeSections.find(s => s.adviserId === teacherId);`
  },
  {
    search: /sub\.teacherId === authUser\.id &&/g,
    replace: 'sub.teacherId === teacherId &&'
  },
  {
    search: /schedule\.teacherId === authUser\.id &&/g,
    replace: 'schedule.teacherId === teacherId &&'
  },
  {
    search: /section\.adviserId === authUser\.id\)/g,
    replace: 'section.adviserId === teacherId)'
  },
  {
    search: /const ids = new Set<string>\(\);\s+classSchedules\.forEach\(schedule => \{\s+if \(schedule\.teacherId === authUser\.id/g,
    replace: `const ids = new Set<string>();
    
    // CRITICAL: Use postgresqlId for PostgreSQL queries
    const teacherId = (authUser as any).postgresqlId || authUser.id;
    
    classSchedules.forEach(schedule => {
      if (schedule.teacherId === teacherId`
  }
];

console.log('🔧 Fixing PostgreSQL ID usage in teacher filter components...\n');

let filesFixed = 0;
let totalReplacements = 0;

componentsToFix.forEach(componentPath => {
  const fullPath = path.join(__dirname, '..', componentPath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping ${componentPath} (file not found)`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let replacements = 0;
  
  fixes.forEach(fix => {
    const matches = content.match(fix.search);
    if (matches) {
      content = content.replace(fix.search, fix.replace);
      replacements += matches.length;
    }
  });
  
  if (replacements > 0) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${componentPath}: ${replacements} replacement(s)`);
    filesFixed++;
    totalReplacements += replacements;
  } else {
    console.log(`✓  ${componentPath}: Already fixed`);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`✅ Fix Complete!`);
console.log(`   Files fixed: ${filesFixed}`);
console.log(`   Total replacements: ${totalReplacements}`);
console.log('='.repeat(60));
console.log('\n📝 Summary:');
console.log('   All grade-related views now use postgresqlId for teacher filtering.');
console.log('   Teachers will only see students from their assigned sections.');
console.log('\n🔄 Next step: Refresh your browser to test the changes!');
