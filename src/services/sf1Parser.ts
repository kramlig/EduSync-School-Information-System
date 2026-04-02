/**
 * SF1 (School Form 1) Parser
 * 
 * Parses DepEd SF1 files (Excel .xls/.xlsx or CSV) into structured data.
 * SF1 is the School Register containing student enrollment data.
 * 
 * Supports the official DepEd format (Excel 97-2003 .xls and modern .xlsx)
 * as well as CSV exports from DepEd LIS.
 * 
 * SF1 Layout (typical):
 * - Row 1: Title "School Form 1 (SF 1) School Register"
 * - Row 3: School ID | Region | Division | District (label + value pairs)
 * - Row 4: School Name | School Year | Grade Level | Section
 * - Rows 5-6: Column headers (may be merged)
 * - Row 7+: Student data
 * - Summary rows: TOTAL MALE / TOTAL FEMALE / COMBINED
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';

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
 * Handles SF1 quirks: dash (-) as "no middle name", embedded quotes, extra commas.
 */
function parseName(nameStr: string): { lastName: string; firstName: string; middleName: string } {
  if (!nameStr) return { lastName: '', firstName: '', middleName: '' };
  
  // Remove ALL double/single quotes and trim
  const cleaned = nameStr.replace(/["'\u201C\u201D\u2018\u2019]/g, '').trim();
  
  // Split by comma
  const parts = cleaned.split(',').map(p => p.trim()).filter(Boolean);
  
  // Middle name: remove "-" placeholder, whitespace-only, etc.
  let middleName = (parts[2] || '').replace(/^-+$/, '').trim();
  // If middle name is just punctuation or empty after cleanup, drop it
  if (/^[-_.]+$/.test(middleName)) middleName = '';
  
  return {
    lastName: parts[0] || '',
    firstName: parts[1] || '',
    middleName
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

// ============================================================================
// EXCEL (.xls / .xlsx) PARSER — handles official DepEd SF1 format
// ============================================================================

/**
 * Search rows 0-5 (metadata area only) for a cell whose text matches `label`,
 * then return the next non-empty cell to its right.
 * For merged-cell Excel files, values may be several columns away.
 */
function findHeaderValue(rows: (string | number | null)[][], label: RegExp, maxRow = 6): string {
  for (let r = 0; r < Math.min(maxRow, rows.length); r++) {
    const rowLen = rows[r]?.length ?? 0;
    for (let c = 0; c < rowLen; c++) {
      const cell = String(rows[r][c] ?? '').trim();
      if (label.test(cell)) {
        // Look right — skip empty cells from merged regions (up to 20 cols)
        for (let k = c + 1; k < Math.min(c + 20, rowLen); k++) {
          const val = String(rows[r][k] ?? '').trim();
          if (val && !label.test(val)) return val;
        }
        // Value might be embedded in the same cell: "School ID  129386"
        const inline = cell.replace(label, '').replace(/[:]/g, '').trim();
        if (inline) return inline;
      }
    }
  }
  return '';
}

/**
 * Locate the column header row by looking for "LRN" in column A-C.
 * Returns the 0-based row index, or -1 if not found.
 */
function findHeaderRow(rows: (string | number | null)[][]): number {
  for (let r = 0; r < Math.min(12, rows.length); r++) {
    for (let c = 0; c < Math.min(4, rows[r]?.length ?? 0); c++) {
      if (/^lrn$/i.test(String(rows[r][c] ?? '').trim())) {
        return r;
      }
    }
  }
  return -1;
}

/**
 * Build a column-index map from the header row(s).
 * Because DepEd SF1 uses merged cells spanning 2 header rows, we combine
 * the text from headerRow and headerRow+1 to match known column labels.
 */
function buildColumnMap(rows: (string | number | null)[][], headerRow: number): Record<string, number> {
  const map: Record<string, number> = {};
  const row1 = rows[headerRow] ?? [];
  const row2 = rows[headerRow + 1] ?? [];

  // Combine text from both header rows for each column
  const combined: string[] = [];
  const maxCols = Math.max(row1.length, row2.length);
  for (let c = 0; c < maxCols; c++) {
    const a = String(row1[c] ?? '').trim();
    const b = String(row2[c] ?? '').trim();
    combined[c] = (a + ' ' + b).trim().toLowerCase();
  }

  // Map to known field names by scanning combined headers
  for (let c = 0; c < combined.length; c++) {
    const h = combined[c];
    if (/^lrn/.test(h) && !map.lrn) { map.lrn = c; continue; }
    // NAME column: "NAME (Last Name, First Name, Middle Name)" or just "NAME"
    // Must come after LRN (col index > lrn) to avoid false matches
    if (!map.name && map.lrn !== undefined && c > map.lrn && /^name\b/.test(h)) { map.name = c; continue; }
    if (/\bsex\b/.test(h) && !map.sex) { map.sex = c; continue; }
    if (/birth\s*date/.test(h) && !map.birthDate) { map.birthDate = c; continue; }
    if (/^age/.test(h) && !map.age) { map.age = c; continue; }
    if (/mother\s*tongue/.test(h) && !map.motherTongue) { map.motherTongue = c; continue; }
    if (/ip.*ethnic|ethnic.*group/.test(h) && !map.ip) { map.ip = c; continue; }
    if (/religio/i.test(h) && !map.religion) { map.religion = c; continue; }
    if (/house|street|sitio|purok/.test(h) && !map.houseStreet) { map.houseStreet = c; continue; }
    if (/barangay/.test(h) && !map.barangay) { map.barangay = c; continue; }
    if (/municipality|city/.test(h) && !map.municipality) { map.municipality = c; continue; }
    if (/province/.test(h) && !map.province) { map.province = c; continue; }
    if (/father/.test(h) && !map.father) { map.father = c; continue; }
    if (/mother.*maiden|mother.*name/.test(h) && !map.mother) { map.mother = c; continue; }
    // Guardian columns — "Name" under "GUARDIAN" header
    if (/guardian/.test(h) && !map.guardian) { map.guardian = c; continue; }
    if (/relationship/.test(h) && !map.guardianRelationship) { map.guardianRelationship = c; continue; }
    if (/contact.*number/.test(h) && !map.contact) { map.contact = c; continue; }
    if (/learning.*modality|modality/.test(h) && !map.modality) { map.modality = c; continue; }
    if (/remarks/.test(h) && !map.remarks) { map.remarks = c; continue; }
  }

  // Fallback: if guardian name not found, check if column after mother is guardian
  if (!map.guardian && map.mother) {
    // Scan forward from mother for guardian-like columns
    for (let c = (map.mother ?? 0) + 1; c < combined.length; c++) {
      const h = combined[c];
      if (/guardian|^name$/.test(h) && !map.guardian) { map.guardian = c; break; }
    }
  }

  console.log('[SF1Parser] Column map:', map);
  return map;
}

/** Read a cell as string */
function cellStr(rows: (string | number | null)[][], r: number, c: number | undefined): string {
  if (c === undefined) return '';
  return String(rows[r]?.[c] ?? '').trim();
}

/**
 * Parse a DepEd SF1 Excel file (ArrayBuffer) into SF1ParseResult.
 */
export function parseSF1Excel(buffer: ArrayBuffer): SF1ParseResult {
  const result: SF1ParseResult = {
    success: false,
    metadata: null,
    students: [],
    maleCount: 0,
    femaleCount: 0,
    totalCount: 0,
    errors: [],
    warnings: [],
  };

  try {
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) {
      result.errors.push('Excel file has no sheets');
      return result;
    }
    const sheet = wb.Sheets[sheetName];
    // Convert to 2-D array; defval keeps empty cells as ''
    const rows: (string | number | null)[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      raw: false,       // get formatted strings for dates
      blankrows: true,
    }) as any;

    if (rows.length < 7) {
      result.errors.push('File too short — expected at least 7 rows');
      return result;
    }

    // ── Extract metadata from header area (rows 0-5) ────────────────────
    // Debug: log first 6 rows to help diagnose column layout
    for (let r = 0; r < Math.min(6, rows.length); r++) {
      const cells = (rows[r] || []).map((c, i) => `[${i}]="${String(c ?? '')}"`)
        .filter(c => !c.endsWith('""'));
      if (cells.length > 0) console.log(`[SF1Parser] Row ${r}:`, cells.join(', '));
    }

    const schoolIdVal = findHeaderValue(rows, /school\s*id/i);
    const regionVal   = findHeaderValue(rows, /region/i);
    const divisionVal = findHeaderValue(rows, /division/i);
    const districtVal = findHeaderValue(rows, /district/i);
    const schoolNameVal = findHeaderValue(rows, /school\s*name/i);
    const schoolYearRaw = findHeaderValue(rows, /school\s*year/i);
    const gradeLevelRaw = findHeaderValue(rows, /grade\s*level/i);
    const sectionName   = findHeaderValue(rows, /\bsection\b/i);

    console.log('[SF1Parser] Metadata extracted:', {
      schoolIdVal, regionVal, divisionVal, districtVal,
      schoolNameVal, schoolYearRaw, gradeLevelRaw, sectionName,
      sheetName,
    });

    const schoolYear = normalizeSchoolYear(schoolYearRaw);
    let gradeLevel = parseGradeLevel(gradeLevelRaw);

    // Fallback: extract grade level from sheet name (e.g. "SF1_2025_Grade-1-HOPE")
    if (gradeLevel === 0 && sheetName) {
      const sheetGrade = sheetName.match(/grade[\s-_]*(\d+)/i)
        || sheetName.match(/kinder/i);
      if (sheetGrade) {
        gradeLevel = sheetGrade[1] ? parseInt(sheetGrade[1], 10) : 0; // 0 = Kinder
      }
    }

    // Try to derive section from sheet name if not found in header
    // e.g. "SF1_2025_Grade-1-HOPE" → section "HOPE"
    let resolvedSection = sectionName;
    if (!resolvedSection && sheetName) {
      // Match last segment after grade: "Grade-1-HOPE" → "HOPE", "Kinder-CHARITY" → "CHARITY"
      const sheetMatch = sheetName.match(/(?:grade[\s-_]*\d+|kinder|non[\s-_]*graded)[\s-_]+(.+)$/i);
      if (sheetMatch) resolvedSection = sheetMatch[1].replace(/[-_]/g, ' ').trim();
    }

    if (!resolvedSection) {
      result.errors.push('Could not determine section name from file');
      return result;
    }

    result.metadata = {
      schoolId: schoolIdVal,
      schoolName: schoolNameVal,
      region: regionVal,
      division: divisionVal,
      district: districtVal,
      schoolYear,
      gradeLevel,
      gradeLevelRaw,
      sectionName: resolvedSection,
    };

    // ── Locate column headers ────────────────────────────────────────────
    const headerRow = findHeaderRow(rows);
    if (headerRow < 0) {
      result.errors.push('Could not find column header row (looking for "LRN")');
      return result;
    }
    const colMap = buildColumnMap(rows, headerRow);

    if (colMap.lrn === undefined) {
      result.errors.push('Could not identify LRN column');
      return result;
    }

    // ── Parse student data rows ──────────────────────────────────────────
    const dataStart = headerRow + 2; // skip 2 header rows
    for (let r = dataStart; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.every(c => !String(c ?? '').trim())) continue;

      // Skip summary rows
      const rowText = row.slice(0, 5).map(c => String(c ?? '')).join(' ').toLowerCase();
      if (/total\s*male|total\s*female|combined|<=== total|prepared by|generated|signature|list and code|indicator/.test(rowText)) continue;

      const lrn = cellStr(rows, r, colMap.lrn);
      // Only process rows that look like student data (LRN = 9-12 digits)
      if (!/^\d{9,12}$/.test(lrn)) continue;

      const validationErrors: string[] = [];
      if (!/^\d{12}$/.test(lrn)) {
        validationErrors.push(`LRN should be 12 digits, got ${lrn.length}`);
      }

      // Name parsing — column may contain "LASTNAME,FIRSTNAME, MIDDLENAME"
      const nameRaw = cellStr(rows, r, colMap.name);
      const { lastName, firstName, middleName } = parseName(nameRaw);
      if (!lastName && !firstName) validationErrors.push('Missing name');

      // Sex
      const sexRaw = cellStr(rows, r, colMap.sex).toUpperCase();
      const sex: 'M' | 'F' = (sexRaw === 'F') ? 'F' : 'M';
      if (sexRaw !== 'M' && sexRaw !== 'F') validationErrors.push(`Invalid sex: ${sexRaw}`);

      // Birth date
      const birthDateRaw = cellStr(rows, r, colMap.birthDate);
      const birthDate = parseDate(birthDateRaw);

      // Age
      const age = parseInt(cellStr(rows, r, colMap.age), 10) || null;

      // Other fields
      const motherTongue = cellStr(rows, r, colMap.motherTongue);
      const indigenousGroup = cellStr(rows, r, colMap.ip);
      const religion = cellStr(rows, r, colMap.religion);

      const houseStreet = cellStr(rows, r, colMap.houseStreet);
      const barangay = cellStr(rows, r, colMap.barangay);
      const municipality = cellStr(rows, r, colMap.municipality);
      const province = cellStr(rows, r, colMap.province);

      const fatherName = cellStr(rows, r, colMap.father);
      const motherName = cellStr(rows, r, colMap.mother);
      const guardianName = cellStr(rows, r, colMap.guardian);
      const guardianRelationship = cellStr(rows, r, colMap.guardianRelationship);
      const contactNumber = cellStr(rows, r, colMap.contact);
      const learningModality = cellStr(rows, r, colMap.modality);
      const remarks = cellStr(rows, r, colMap.remarks);

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
          full: [houseStreet, barangay, municipality, province].filter(Boolean).join(', '),
        },
        fatherName,
        motherName,
        guardianName,
        guardianRelationship,
        contactNumber,
        learningModality,
        remarks,
        isValid: validationErrors.length === 0,
        validationErrors,
      };

      result.students.push(student);
      if (sex === 'M') result.maleCount++;
      else if (sex === 'F') result.femaleCount++;
    }

    result.totalCount = result.students.length;
    result.success = result.students.length > 0 && result.errors.length === 0;

    if (result.students.length === 0) {
      result.warnings.push('No valid student records found in file');
    }
    const invalidCount = result.students.filter(s => !s.isValid).length;
    if (invalidCount > 0) {
      result.warnings.push(`${invalidCount} student(s) have validation issues`);
    }
  } catch (error: any) {
    result.errors.push(`Excel parse error: ${error.message}`);
  }

  return result;
}

/**
 * Parse an SF1 file — auto-detects Excel vs CSV by extension or content.
 * For Excel files pass the ArrayBuffer; for CSV pass the text content.
 */
export function parseSF1File(
  file: { name: string; buffer?: ArrayBuffer; text?: string }
): SF1ParseResult {
  const ext = file.name.toLowerCase();
  if (ext.endsWith('.xls') || ext.endsWith('.xlsx')) {
    if (!file.buffer) {
      return { success: false, metadata: null, students: [], maleCount: 0, femaleCount: 0, totalCount: 0, errors: ['Excel file buffer not provided'], warnings: [] };
    }
    return parseSF1Excel(file.buffer);
  }
  // Fallback to CSV parser
  if (!file.text) {
    return { success: false, metadata: null, students: [], maleCount: 0, femaleCount: 0, totalCount: 0, errors: ['File text not provided'], warnings: [] };
  }
  return parseSF1(file.text);
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
