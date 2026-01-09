/**
 * SF1 (School Form 1) Parser
 * 
 * Parses DepEd LIS SF1 CSV exports into structured data.
 * SF1 is the School Register containing student enrollment data.
 * 
 * SF1 CSV Structure:
 * - Rows 1-2: Title headers
 * - Row 3: School ID, Region, Division, District
 * - Row 4: School Name, School Year, Grade Level, Section
 * - Rows 5-6: Column headers
 * - Row 7+: Student data
 * - Summary rows: "<=== TOTAL MALE", "<=== TOTAL FEMALE", "<=== COMBINED"
 */

import Papa from 'papaparse';

// ============================================================================
// TYPES
// ============================================================================

export interface SF1Metadata {
  schoolId: string;
  schoolName: string;
  region: string;
  division: string;
  district: string;
  schoolYear: string;
  gradeLevel: number;
  gradeLevelRaw: string;
  sectionName: string;
  adviserName?: string;
  schoolHeadName?: string;
}

export interface SF1Student {
  lrn: string;
  lastName: string;
  firstName: string;
  middleName: string;
  fullName: string;
  sex: 'M' | 'F';
  birthDate: string | null; // ISO format YYYY-MM-DD
  birthDateRaw: string;
  age: number | null;
  motherTongue: string;
  indigenousGroup: string;
  religion: string;
  address: {
    houseStreet: string;
    barangay: string;
    municipality: string;
    province: string;
    full: string;
  };
  fatherName: string;
  motherName: string;
  guardianName: string;
  guardianRelationship: string;
  contactNumber: string;
  learningModality: string;
  remarks: string;
  // Validation
  isValid: boolean;
  validationErrors: string[];
}

export interface SF1ParseResult {
  success: boolean;
  metadata: SF1Metadata | null;
  students: SF1Student[];
  maleCount: number;
  femaleCount: number;
  totalCount: number;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse name string in format "LASTNAME,FIRSTNAME, MIDDLENAME" or "LASTNAME,FIRSTNAME,MIDDLENAME,"
 */
function parseName(nameStr: string): { lastName: string; firstName: string; middleName: string } {
  if (!nameStr) return { lastName: '', firstName: '', middleName: '' };
  
  // Remove extra quotes and trim
  const cleaned = nameStr.replace(/^["']|["']$/g, '').trim();
  
  // Split by comma
  const parts = cleaned.split(',').map(p => p.trim());
  
  return {
    lastName: parts[0] || '',
    firstName: parts[1] || '',
    middleName: (parts[2] || '').replace(/-/g, '').trim() // Remove "-" placeholder
  };
}

/**
 * Parse date from MM-DD-YYYY or MM/DD/YYYY format to ISO YYYY-MM-DD
 */
function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  // Handle MM-DD-YYYY or MM/DD/YYYY
  const match = dateStr.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (match) {
    const [, month, day, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return null;
}

/**
 * Normalize school year to format "YYYY-YYYY" (max 10 chars for database)
 * Handles: "2025-2026", "SY 2025-2026", "School Year 2025-2026", "S.Y. 2025-2026"
 */
function normalizeSchoolYear(schoolYearStr: string): string {
  if (!schoolYearStr) return '';
  
  // Try to extract year pattern like "2025-2026" or "2025 - 2026"
  const match = schoolYearStr.match(/(\d{4})\s*[-–]\s*(\d{4})/);
  if (match) {
    return `${match[1]}-${match[2]}`; // Returns "2025-2026" (9 chars)
  }
  
  // If just a single year, assume it's the start year
  const singleYear = schoolYearStr.match(/(\d{4})/);
  if (singleYear) {
    const startYear = parseInt(singleYear[1], 10);
    return `${startYear}-${startYear + 1}`;
  }
  
  // Fallback: truncate to 10 chars
  return schoolYearStr.substring(0, 10);
}

/**
 * Extract grade level number from string like "Grade 1", "Grade 7", "Kinder", etc.
 */
function parseGradeLevel(gradeLevelStr: string): number {
  if (!gradeLevelStr) return 0;
  
  const cleaned = gradeLevelStr.toLowerCase().trim();
  
  // Handle Kinder/Kindergarten
  if (cleaned.includes('kinder')) return 0;
  
  // Extract number from "Grade X" or "Gr. X"
  const match = cleaned.match(/grade\s*(\d+)|gr\.?\s*(\d+)|^(\d+)$/i);
  if (match) {
    return parseInt(match[1] || match[2] || match[3], 10);
  }
  
  return 0;
}

/**
 * Check if a row is a summary/total row that should be skipped
 */
function isSummaryRow(row: string[]): boolean {
  const firstCells = row.slice(0, 5).join(' ').toLowerCase();
  return firstCells.includes('total male') || 
         firstCells.includes('total female') || 
         firstCells.includes('combined') ||
         firstCells.includes('<=== total') ||
         firstCells.includes('list and code') ||
         firstCells.includes('indicator') ||
         firstCells.includes('prepared by') ||
         firstCells.includes('generated on') ||
         firstCells.includes('generated thru') ||
         firstCells.includes('signature');
}

/**
 * Check if a row is a valid student data row
 */
function isStudentRow(row: string[]): boolean {
  // Must have LRN (12 digits) in first column
  const lrn = row[0]?.trim();
  return /^\d{9,12}$/.test(lrn);
}

// ============================================================================
// MAIN PARSER
// ============================================================================

/**
 * Parse SF1 CSV file content
 */
export function parseSF1(csvContent: string): SF1ParseResult {
  const result: SF1ParseResult = {
    success: false,
    metadata: null,
    students: [],
    maleCount: 0,
    femaleCount: 0,
    totalCount: 0,
    errors: [],
    warnings: []
  };

  try {
    // Parse CSV
    const parsed = Papa.parse<string[]>(csvContent, {
      header: false,
      skipEmptyLines: false
    });

    if (parsed.errors.length > 0) {
      result.errors.push(...parsed.errors.map(e => `CSV Parse Error: ${e.message}`));
    }

    const rows = parsed.data;
    
    if (rows.length < 7) {
      result.errors.push('Invalid SF1 file: Not enough rows');
      return result;
    }

    // ========================================================================
    // EXTRACT METADATA FROM HEADER ROWS
    // ========================================================================
    
    // Row 3 (index 2): School ID, Region, Division, District
    const row3 = rows[2] || [];
    const schoolId = row3[5]?.trim() || '';
    const region = row3[11]?.trim() || '';
    const division = row3[19]?.trim() || '';
    const district = row3[36]?.trim() || '';

    // Row 4 (index 3): School Name, School Year, Grade Level, Section
    const row4 = rows[3] || [];
    const schoolName = row4[5]?.trim() || '';
    const schoolYearRaw = row4[19]?.trim() || '';
    const schoolYear = normalizeSchoolYear(schoolYearRaw);
    const gradeLevelRaw = row4[30]?.trim() || '';
    
    // Section name can be at different positions - try multiple locations
    let sectionName = row4[39]?.trim() || '';
    
    // If not found at index 39, search for it in the header rows
    if (!sectionName) {
      // Search rows 3-5 for "Section:" label and get value after it
      for (let rowIdx = 2; rowIdx <= 5 && rowIdx < rows.length; rowIdx++) {
        const row = rows[rowIdx] || [];
        for (let colIdx = 0; colIdx < row.length; colIdx++) {
          const cell = row[colIdx]?.trim().toLowerCase() || '';
          if (cell === 'section:' || cell === 'section') {
            // Check next cell for section name
            sectionName = row[colIdx + 1]?.trim() || '';
            if (sectionName) break;
          }
          // Also check if cell contains "Section:" followed by value
          if (cell.startsWith('section:')) {
            sectionName = cell.replace('section:', '').trim();
            if (sectionName) break;
          }
        }
        if (sectionName) break;
      }
    }
    
    // Last resort: try common column positions in row 4
    if (!sectionName) {
      const tryPositions = [39, 40, 41, 42, 38, 37, 35, 43, 44, 45];
      for (const pos of tryPositions) {
        const val = row4[pos]?.trim();
        if (val && val.length > 0 && val.length < 50 && !/^\d+$/.test(val) && !val.includes(':')) {
          sectionName = val;
          console.log(`[SF1Parser] Found section at column ${pos}: "${sectionName}"`);
          break;
        }
      }
    }
    
    // Debug: Log row 4 to help diagnose
    console.log('[SF1Parser] Row 4 contents:', row4.map((c, i) => `[${i}]="${c}"`).filter(c => !c.includes('""')).join(', '));

    // Try to find adviser and school head names from footer
    let adviserName = '';
    let schoolHeadName = '';
    
    for (let i = rows.length - 20; i < rows.length; i++) {
      const row = rows[i] || [];
      const rowText = row.join(' ').toLowerCase();
      
      if (rowText.includes('signature of adviser')) {
        // Adviser name is usually in the row above
        const prevRow = rows[i - 1] || [];
        adviserName = prevRow.find(cell => cell && cell.trim().length > 3 && !cell.includes('==='))?.trim() || '';
      }
      if (rowText.includes('signature of school head')) {
        const prevRow = rows[i - 1] || [];
        schoolHeadName = prevRow.find(cell => cell && cell.trim().length > 3 && !cell.includes('==='))?.trim() || '';
      }
    }

    // Validate metadata
    if (!schoolId) {
      result.warnings.push('School ID not found in header');
    }
    if (!sectionName) {
      result.errors.push('Section name not found - cannot import without section');
      return result;
    }

    result.metadata = {
      schoolId,
      schoolName,
      region,
      division,
      district,
      schoolYear,
      gradeLevel: parseGradeLevel(gradeLevelRaw),
      gradeLevelRaw,
      sectionName,
      adviserName,
      schoolHeadName
    };

    // ========================================================================
    // PARSE STUDENT ROWS
    // ========================================================================
    
    // Student data starts at row 7 (index 6)
    for (let i = 6; i < rows.length; i++) {
      const row = rows[i];
      
      // Skip empty rows
      if (!row || row.length === 0 || row.every(cell => !cell?.trim())) {
        continue;
      }

      // Skip summary/footer rows
      if (isSummaryRow(row)) {
        continue;
      }

      // Only process valid student rows
      if (!isStudentRow(row)) {
        continue;
      }

      const validationErrors: string[] = [];

      // Parse LRN
      const lrn = row[0]?.trim() || '';
      if (!lrn) {
        validationErrors.push('Missing LRN');
      } else if (!/^\d{12}$/.test(lrn)) {
        validationErrors.push(`Invalid LRN format: ${lrn}`);
      }

      // Parse Name (column C, index 2)
      const nameRaw = row[2]?.trim() || '';
      const { lastName, firstName, middleName } = parseName(nameRaw);
      
      if (!lastName && !firstName) {
        validationErrors.push('Missing name');
      }

      // Parse Sex (column G, index 6)
      const sexRaw = row[6]?.trim().toUpperCase();
      const sex = (sexRaw === 'M' || sexRaw === 'F') ? sexRaw : 'M';
      if (sexRaw !== 'M' && sexRaw !== 'F') {
        validationErrors.push(`Invalid sex value: ${sexRaw}`);
      }

      // Parse Birth Date (column H, index 7)
      const birthDateRaw = row[7]?.trim() || '';
      const birthDate = parseDate(birthDateRaw);
      if (birthDateRaw && !birthDate) {
        validationErrors.push(`Invalid birth date format: ${birthDateRaw}`);
      }

      // Parse Age (column H, index 9 in CSV due to merged cells)
      const ageRaw = row[9]?.trim() || '';
      const age = parseInt(ageRaw, 10) || null;

      // Parse Mother Tongue (column I-K, index 11 in CSV)
      const motherTongue = row[11]?.trim() || '';

      // Parse IP/Ethnic Group (column L-M, index 13 in CSV)
      const indigenousGroup = row[13]?.trim() || '';

      // Parse Religion (column N, index 14 in CSV)
      const religion = row[14]?.trim() || '';

      // Parse Address - CORRECTED for DepEd LIS SF1 CSV structure
      // Address columns span O-V with merged cells creating gaps
      const houseStreet = row[15]?.trim() || ''; // Column O (index 15) - House #/Street/Sitio/Purok
      const barangay = row[17]?.trim() || '';    // Column R (index 17) - Barangay
      const municipality = row[20]?.trim() || ''; // Column T (index 20) - Municipality/City
      const province = row[22]?.trim() || '';    // Column V (index 22) - Province

      // Parse Parents - CORRECTED indices for DepEd LIS SF1 CSV
      // Father spans columns AA-AD (index 27 in CSV after merged cells)
      // Mother spans columns AE-AH (index 31 in CSV after merged cells)
      const fatherName = row[27]?.trim() || '';
      const motherName = row[31]?.trim() || '';

      // Parse Guardian - columns AI-AL (index 34-37), Relationship AM-AN (index 38-39)
      const guardianName = row[34]?.trim() || '';
      const guardianRelationship = row[38]?.trim() || '';

      // Parse Contact Number (columns AO-AQ, index 40 in CSV)
      const contactNumber = row[40]?.trim() || '';

      // Parse Learning Modality (column AR, index 43 in CSV)
      const learningModality = row[43]?.trim() || '';

      // Parse Remarks (columns AS-AT, index 44-45 in CSV)
      const remarks = row[44]?.trim() || '';

      const student: SF1Student = {
        lrn,
        lastName,
        firstName,
        middleName,
        fullName: [lastName, firstName, middleName].filter(Boolean).join(', '),
        sex,
        birthDate,
        birthDateRaw,
        age,
        motherTongue,
        indigenousGroup,
        religion,
        address: {
          houseStreet,
          barangay,
          municipality,
          province,
          full: [houseStreet, barangay, municipality, province].filter(Boolean).join(', ')
        },
        fatherName,
        motherName,
        guardianName,
        guardianRelationship,
        contactNumber,
        learningModality,
        remarks,
        isValid: validationErrors.length === 0,
        validationErrors
      };

      result.students.push(student);

      if (sex === 'M') result.maleCount++;
      else if (sex === 'F') result.femaleCount++;
    }

    result.totalCount = result.students.length;
    result.success = result.students.length > 0 && result.errors.length === 0;

    // Add warning if no students found
    if (result.students.length === 0) {
      result.warnings.push('No valid student records found in file');
    }

    // Add warning for invalid students
    const invalidCount = result.students.filter(s => !s.isValid).length;
    if (invalidCount > 0) {
      result.warnings.push(`${invalidCount} student(s) have validation issues`);
    }

  } catch (error: any) {
    result.errors.push(`Parse error: ${error.message}`);
  }

  return result;
}

/**
 * Validate parsed SF1 data against existing database records
 */
export async function validateSF1Import(
  parseResult: SF1ParseResult,
  existingLRNs: Set<string>
): Promise<{
  newStudents: SF1Student[];
  duplicateLRNs: SF1Student[];
  invalidStudents: SF1Student[];
}> {
  const newStudents: SF1Student[] = [];
  const duplicateLRNs: SF1Student[] = [];
  const invalidStudents: SF1Student[] = [];

  for (const student of parseResult.students) {
    if (!student.isValid) {
      invalidStudents.push(student);
    } else if (existingLRNs.has(student.lrn)) {
      duplicateLRNs.push(student);
    } else {
      newStudents.push(student);
    }
  }

  return { newStudents, duplicateLRNs, invalidStudents };
}
