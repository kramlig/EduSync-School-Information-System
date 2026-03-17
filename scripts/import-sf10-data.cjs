/**
 * SF10 Data Import Script
 * 
 * Imports client-provided Excel data (grades) into PostgreSQL for SF10/Form137 generation.
 * 
 * Usage:
 *   node scripts/import-sf10-data.cjs --file=SF10_Data_Filled.xlsx --school-id=<UUID>
 *   node scripts/import-sf10-data.cjs --file=SF10_Data_Filled.xlsx --school-id=<UUID> --dry-run=false
 * 
 * Environment Variables:
 *   - VITE_SUPABASE_URL or SUPABASE_URL: Supabase project URL
 *   - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 * 
 * Requires: npm install xlsx @supabase/supabase-js
 */

const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');

// =====================================================
// CLI ARGUMENTS
// =====================================================

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, val] = arg.split('=');
  acc[key.replace(/^--/, '')] = val ?? 'true';
  return acc;
}, {});

const EXCEL_FILE = args.file;
const SCHOOL_ID = args['school-id'];
const DRY_RUN = args['dry-run'] !== 'false'; // default true

if (!EXCEL_FILE || !SCHOOL_ID) {
  console.error('❌ Usage: node scripts/import-sf10-data.cjs --file=<path.xlsx> --school-id=<UUID>');
  console.error('   Options:');
  console.error('     --dry-run=false    Actually write to database (default: true = preview only)');
  process.exit(1);
}

// =====================================================
// SUPABASE CLIENT
// =====================================================

function createSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables.');
    console.error('   Set them with:');
    console.error('     $env:VITE_SUPABASE_URL="https://your-project.supabase.co"');
    console.error('     $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
    process.exit(1);
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

// =====================================================
// EXCEL PARSER
// =====================================================

function parseExcel(filePath) {
  const fullPath = path.resolve(filePath);
  console.log(`📖 Reading: ${fullPath}`);

  const workbook = XLSX.readFile(fullPath);
  const sheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('grade')) || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  console.log(`   Found ${rows.length} rows in sheet "${sheetName}"`);
  return rows;
}

// =====================================================
// VALIDATION
// =====================================================

function validateRows(rows) {
  const errors = [];
  const valid = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // Excel row (1-indexed + header)

    // Skip blank rows
    const lrn = String(row['LRN'] || '').trim();
    if (!lrn) continue;

    const name = String(row['Student Name'] || '').trim();
    const gradeLevel = Number(row['Grade Level']);
    const section = String(row['Section'] || '').trim();
    const adviser = String(row['Adviser'] || '').trim();
    const schoolYear = String(row['School Year'] || '').trim();
    const subject = String(row['Subject'] || '').trim();
    const q1 = row['Q1'] !== '' ? Number(row['Q1']) : null;
    const q2 = row['Q2'] !== '' ? Number(row['Q2']) : null;
    const q3 = row['Q3'] !== '' ? Number(row['Q3']) : null;
    const q4 = row['Q4'] !== '' ? Number(row['Q4']) : null;

    const rowErrors = [];

    if (!/^\d{12}$/.test(lrn)) rowErrors.push(`LRN must be 12 digits (got "${lrn}")`);
    if (!name) rowErrors.push('Student Name is empty');
    if (!gradeLevel || gradeLevel < 1 || gradeLevel > 12) rowErrors.push(`Grade Level must be 1-12 (got ${gradeLevel})`);
    if (!section) rowErrors.push('Section is empty');
    if (!schoolYear || !/^\d{4}-\d{4}$/.test(schoolYear)) rowErrors.push(`School Year must be YYYY-YYYY (got "${schoolYear}")`);
    if (!subject) rowErrors.push('Subject is empty');

    for (const [label, val] of [['Q1', q1], ['Q2', q2], ['Q3', q3], ['Q4', q4]]) {
      if (val !== null && (val < 0 || val > 100 || isNaN(val))) {
        rowErrors.push(`${label} must be 0-100 (got ${row[label]})`);
      }
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNum, errors: rowErrors });
    } else {
      valid.push({ lrn, name, gradeLevel, section, adviser, schoolYear, subject, q1, q2, q3, q4 });
    }
  }

  return { valid, errors };
}

// =====================================================
// GROUP DATA BY STUDENT
// =====================================================

function groupByStudent(rows) {
  const students = new Map();

  for (const row of rows) {
    if (!students.has(row.lrn)) {
      students.set(row.lrn, {
        lrn: row.lrn,
        name: row.name,
        gradeLevel: row.gradeLevel,
        section: row.section,
        adviser: row.adviser,
        schoolYear: row.schoolYear,
        subjects: []
      });
    }
    students.get(row.lrn).subjects.push({
      name: row.subject,
      q1: row.q1,
      q2: row.q2,
      q3: row.q3,
      q4: row.q4
    });
  }

  return Array.from(students.values());
}

// =====================================================
// SUBJECT → LEARNING AREA CODE MAPPING
// =====================================================

function subjectToCode(name) {
  const map = {
    'filipino': 'FIL',
    'english': 'ENG',
    'mathematics': 'MATH',
    'math': 'MATH',
    'science': 'SCI',
    'araling panlipunan': 'AP',
    'ap': 'AP',
    'epp/tle': 'TLE',
    'epp': 'EPP',
    'tle': 'TLE',
    'mapeh': 'MAPEH',
    'music': 'MUSIC',
    'arts': 'ARTS',
    'pe': 'PE',
    'physical education': 'PE',
    'health': 'HEALTH',
    'esp': 'ESP',
    'edukasyon sa pagpapakatao': 'ESP',
    'mother tongue': 'MTB',
    'mtb-mle': 'MTB',
    'mtb': 'MTB',
  };
  return map[name.toLowerCase().trim()] || name.toUpperCase().replace(/\s+/g, '_').substring(0, 20);
}

// =====================================================
// PARSE STUDENT NAME
// =====================================================

function parseName(fullName) {
  // Expected: "Last, First M." or "Last, First Middle"
  const commaIdx = fullName.indexOf(',');
  if (commaIdx === -1) {
    // No comma — try space splitting
    const parts = fullName.trim().split(/\s+/);
    return {
      last_name: parts[parts.length - 1] || fullName,
      first_name: parts[0] || fullName,
      middle_name: parts.length > 2 ? parts.slice(1, -1).join(' ') : null
    };
  }

  const lastName = fullName.substring(0, commaIdx).trim();
  const rest = fullName.substring(commaIdx + 1).trim().split(/\s+/);
  const firstName = rest[0] || '';
  const middleName = rest.length > 1 ? rest.slice(1).join(' ').replace(/\.$/, '') : null;

  return { last_name: lastName, first_name: firstName, middle_name: middleName };
}

// =====================================================
// DATABASE OPERATIONS
// =====================================================

async function importData(supabase, students, schoolId) {
  const stats = { sections: 0, learningAreas: 0, students: 0, grades: 0, skippedGrades: 0 };

  // Cache lookups to avoid redundant queries
  const sectionCache = new Map();  // "gradeLevel|sectionName|schoolYear" → UUID
  const learningAreaCache = new Map();  // "code" → UUID
  const studentCache = new Map();  // "lrn" → UUID

  // --- Step 1: Ensure learning areas exist ---
  console.log('\n📚 Processing learning areas...');
  const allSubjects = new Set();
  for (const stu of students) {
    for (const subj of stu.subjects) {
      allSubjects.add(subj.name);
    }
  }

  for (const subjName of allSubjects) {
    const code = subjectToCode(subjName);
    const cacheKey = code;

    // Check if exists
    const { data: existing } = await supabase
      .from('learning_areas')
      .select('id')
      .eq('school_id', schoolId)
      .eq('code', code)
      .maybeSingle();

    if (existing) {
      learningAreaCache.set(cacheKey, existing.id);
      console.log(`   ✓ "${subjName}" (${code}) — already exists`);
    } else {
      const { data: created, error } = await supabase
        .from('learning_areas')
        .insert({ school_id: schoolId, code, name: subjName, is_active: true })
        .select('id')
        .single();

      if (error) {
        console.error(`   ✗ Failed to create learning area "${subjName}": ${error.message}`);
        continue;
      }
      learningAreaCache.set(cacheKey, created.id);
      stats.learningAreas++;
      console.log(`   + "${subjName}" (${code}) — created`);
    }
  }

  // --- Step 2: Ensure sections exist ---
  console.log('\n🏫 Processing sections...');
  const uniqueSections = new Map();
  for (const stu of students) {
    const key = `${stu.gradeLevel}|${stu.section}|${stu.schoolYear}`;
    if (!uniqueSections.has(key)) {
      uniqueSections.set(key, { gradeLevel: stu.gradeLevel, name: stu.section, schoolYear: stu.schoolYear, adviser: stu.adviser });
    }
  }

  for (const [key, sec] of uniqueSections) {
    const { data: existing } = await supabase
      .from('sections')
      .select('id')
      .eq('school_id', schoolId)
      .eq('grade_level', sec.gradeLevel)
      .eq('name', sec.name)
      .eq('school_year', sec.schoolYear)
      .maybeSingle();

    if (existing) {
      sectionCache.set(key, existing.id);
      console.log(`   ✓ Grade ${sec.gradeLevel} - ${sec.name} (${sec.schoolYear}) — already exists`);
    } else {
      const { data: created, error } = await supabase
        .from('sections')
        .insert({
          school_id: schoolId,
          name: sec.name,
          grade_level: sec.gradeLevel,
          school_year: sec.schoolYear
        })
        .select('id')
        .single();

      if (error) {
        console.error(`   ✗ Failed to create section "${sec.name}": ${error.message}`);
        continue;
      }
      sectionCache.set(key, created.id);
      stats.sections++;
      console.log(`   + Grade ${sec.gradeLevel} - ${sec.name} (${sec.schoolYear}) — created`);
    }
  }

  // --- Step 3: Upsert students ---
  console.log('\n👨‍🎓 Processing students...');
  for (const stu of students) {
    const sectionKey = `${stu.gradeLevel}|${stu.section}|${stu.schoolYear}`;
    const sectionId = sectionCache.get(sectionKey);
    const { first_name, last_name, middle_name } = parseName(stu.name);

    // Check if student already exists by LRN
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('school_id', schoolId)
      .eq('lrn', stu.lrn)
      .maybeSingle();

    if (existing) {
      studentCache.set(stu.lrn, existing.id);
      // Update section and grade level
      await supabase
        .from('students')
        .update({ section_id: sectionId, grade_level: stu.gradeLevel })
        .eq('id', existing.id);
      console.log(`   ✓ ${stu.name} (${stu.lrn}) — already exists, updated section`);
    } else {
      const { data: created, error } = await supabase
        .from('students')
        .insert({
          school_id: schoolId,
          lrn: stu.lrn,
          name: stu.name,
          first_name,
          last_name,
          middle_name,
          grade_level: stu.gradeLevel,
          section_id: sectionId,
          enrollment_status: 'enrolled',
          gender: 'Male', // placeholder — client can update later
          date_of_birth: '2010-01-01' // placeholder
        })
        .select('id')
        .single();

      if (error) {
        console.error(`   ✗ Failed to insert ${stu.name} (${stu.lrn}): ${error.message}`);
        continue;
      }
      studentCache.set(stu.lrn, created.id);
      stats.students++;
      console.log(`   + ${stu.name} (${stu.lrn}) — created`);
    }
  }

  // --- Step 4: Insert grades ---
  console.log('\n📝 Processing grades...');
  for (const stu of students) {
    const studentId = studentCache.get(stu.lrn);
    if (!studentId) {
      console.error(`   ✗ Skipping grades for ${stu.name} — student not found`);
      continue;
    }

    for (const subj of stu.subjects) {
      const code = subjectToCode(subj.name);
      const learningAreaId = learningAreaCache.get(code);
      if (!learningAreaId) {
        console.error(`   ✗ Skipping ${subj.name} for ${stu.name} — learning area not found`);
        continue;
      }

      // Check if grade already exists
      const { data: existingGrade } = await supabase
        .from('grades')
        .select('id')
        .eq('student_id', studentId)
        .eq('learning_area_id', learningAreaId)
        .eq('school_year', stu.schoolYear)
        .maybeSingle();

      if (existingGrade) {
        // Update existing grade
        const { error } = await supabase
          .from('grades')
          .update({ q1: subj.q1, q2: subj.q2, q3: subj.q3, q4: subj.q4 })
          .eq('id', existingGrade.id);

        if (error) {
          console.error(`   ✗ Failed to update ${subj.name} for ${stu.name}: ${error.message}`);
        } else {
          stats.skippedGrades++;
          console.log(`   ~ ${stu.name} → ${subj.name} — updated`);
        }
      } else {
        const { error } = await supabase
          .from('grades')
          .insert({
            school_id: schoolId,
            student_id: studentId,
            learning_area_id: learningAreaId,
            school_year: stu.schoolYear,
            q1: subj.q1,
            q2: subj.q2,
            q3: subj.q3,
            q4: subj.q4
          });

        if (error) {
          console.error(`   ✗ Failed to insert ${subj.name} for ${stu.name}: ${error.message}`);
        } else {
          stats.grades++;
          console.log(`   + ${stu.name} → ${subj.name} (${subj.q1}/${subj.q2}/${subj.q3}/${subj.q4})`);
        }
      }
    }
  }

  return stats;
}

// =====================================================
// MAIN
// =====================================================

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║       SF10 Data Import Tool                 ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`  File:      ${EXCEL_FILE}`);
  console.log(`  School ID: ${SCHOOL_ID}`);
  console.log(`  Mode:      ${DRY_RUN ? '🔍 DRY RUN (preview only)' : '⚡ LIVE (writing to database)'}`);
  console.log('');

  // 1. Parse Excel
  const rows = parseExcel(EXCEL_FILE);
  if (rows.length === 0) {
    console.error('❌ No data rows found in Excel file.');
    process.exit(1);
  }

  // 2. Validate
  const { valid, errors } = validateRows(rows);

  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} validation error(s):`);
    for (const e of errors.slice(0, 20)) {
      console.log(`   Row ${e.row}: ${e.errors.join('; ')}`);
    }
    if (errors.length > 20) console.log(`   ... and ${errors.length - 20} more`);
  }

  if (valid.length === 0) {
    console.error('\n❌ No valid rows to import.');
    process.exit(1);
  }

  // 3. Group by student
  const students = groupByStudent(valid);
  console.log(`\n📊 Summary:`);
  console.log(`   Valid rows:   ${valid.length}`);
  console.log(`   Students:     ${students.length}`);
  console.log(`   Subjects:     ${new Set(valid.map(r => r.subject)).size}`);
  console.log(`   School years: ${[...new Set(valid.map(r => r.schoolYear))].join(', ')}`);

  for (const stu of students) {
    console.log(`   • ${stu.name} (LRN: ${stu.lrn}) — Grade ${stu.gradeLevel}, ${stu.subjects.length} subjects`);
  }

  // 4. Import to database
  if (DRY_RUN) {
    console.log('\n🔍 DRY RUN complete. No changes written.');
    console.log('   Run with --dry-run=false to import.');
    return;
  }

  const supabase = createSupabaseClient();

  // Verify school exists
  const { data: school, error: schoolErr } = await supabase
    .from('schools')
    .select('id, name')
    .eq('id', SCHOOL_ID)
    .single();

  if (schoolErr || !school) {
    console.error(`❌ School not found with ID: ${SCHOOL_ID}`);
    process.exit(1);
  }
  console.log(`\n🏫 School: ${school.name}`);

  const stats = await importData(supabase, students, SCHOOL_ID);

  console.log('\n✅ Import complete!');
  console.log(`   Learning areas created: ${stats.learningAreas}`);
  console.log(`   Sections created:       ${stats.sections}`);
  console.log(`   Students created:       ${stats.students}`);
  console.log(`   Grades inserted:        ${stats.grades}`);
  console.log(`   Grades updated:         ${stats.skippedGrades}`);
  console.log('\n🎯 Next: Go to School Forms → SF10 to generate Form 137 for these students.');
}

main().catch(err => {
  console.error('💥 Fatal error:', err.message);
  process.exit(1);
});
