/**
 * SF5 (School Form 5) Parser
 * 
 * Parses DepEd LIS SF5 CSV exports into structured data.
 * SF5 is the Report on Promotion and Level of Proficiency.
 * 
 * SF5 CSV Structure:
 * - Rows 1-2: Title headers
 * - Row 3: School ID, Region, Division, District
 * - Row 4: School Name, School Year, Grade Level, Section
 * - Rows 5-6: Column headers
 * - Row 7+: Student promotion data
 * - Summary rows at bottom
 */

import Papa from 'papaparse';
import type { PromotionStatus, GradingPeriod } from '../types/promotionRecords';

// ============================================================================
// TYPES
// ============================================================================

export interface SF5Metadata {
  schoolId: string;
  schoolName: string;
  region: string;
  division: string;
  district: string;
  schoolYear: string;
  gradeLevel: number;
  gradeLevelRaw: string;
  sectionName: string;
  reportDate?: string;
  adviserName?: string;
}

export interface SF5Student {
  lrn: string;
  lastName: string;
  firstName: string;
  middleName: string;
  fullName: string;
  sex: 'M' | 'F';
  birthDate: string | null;
  // Quarterly grades
  q1Average: number | null;
  q2Average: number | null;
  q3Average: number | null;
  q4Average: number | null;
  // Final grades
  generalAverage: number | null;
  // Promotion
  promotionStatus: PromotionStatus;
  promotionStatusRaw: string;
  remarks: string;
  // Kindergarten proficiency (if applicable)
  socioEmotionalDev: string | null;
  physicalMotorDev: string | null;
  cognitiveDev: string | null;
  languageLiteracyDev: string | null;
  // Validation
  isValid: boolean;
  validationErrors: string[];
}

export interface SF5ParseResult {
  success: boolean;
  metadata: SF5Metadata | null;
  students: SF5Student[];
  totalCount: number;
  promotedCount: number;
  retainedCount: number;
  conditionalCount: number;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const PROMOTION_STATUS_LABELS: Record<PromotionStatus, string> = {
  promoted: 'Promoted',
  retained: 'Retained',
  pending: 'Pending',
  graduated: 'Graduated',
  transferred: 'Transferred'
};

export const GRADING_PERIOD_LABELS: Record<GradingPeriod, string> = {
  '1st_quarter': '1st Quarter',
  '2nd_quarter': '2nd Quarter',
  '3rd_quarter': '3rd Quarter',
  '4th_quarter': '4th Quarter',
  'final': 'Final'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse name string in format "LASTNAME, FIRSTNAME MIDDLENAME"
 */
function parseName(nameStr: string): { lastName: string; firstName: string; middleName: string } {
  if (!nameStr) return { lastName: '', firstName: '', middleName: '' };
  
  const cleaned = nameStr.replace(/^["']|["']$/g, '').trim();
  const parts = cleaned.split(',').map(p => p.trim());
  
  let lastName = parts[0] || '';
  let firstName = '';
  let middleName = '';
  
  if (parts.length >= 2) {
    const rest = parts.slice(1).join(' ').trim();
    const nameParts = rest.split(/\s+/);
    firstName = nameParts[0] || '';
    middleName = nameParts.slice(1).join(' ').replace(/-/g, '').trim();
  }
  
  return { lastName, firstName, middleName };
}

/**
 * Parse date from various formats to ISO YYYY-MM-DD
 */
function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  const mdyMatch = dateStr.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (mdyMatch) {
    const [, month, day, year] = mdyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  const ymdMatch = dateStr.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return null;
}

/**
 * Normalize school year to format "YYYY-YYYY" (max 10 chars)
 */
function normalizeSchoolYear(schoolYearStr: string): string {
  if (!schoolYearStr) return '';
  
  const match = schoolYearStr.match(/(\d{4})\s*[-–]\s*(\d{4})/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  
  const singleYear = schoolYearStr.match(/(\d{4})/);
  if (singleYear) {
    const startYear = parseInt(singleYear[1], 10);
    return `${startYear}-${startYear + 1}`;
  }
  
  return schoolYearStr.substring(0, 10);
}

/**
 * Parse grade level from string
 */
function parseGradeLevel(gradeLevelStr: string): number {
  if (!gradeLevelStr) return 0;
  
  const cleaned = gradeLevelStr.toLowerCase().trim();
  
  // Kindergarten
  if (cleaned.includes('kinder') || cleaned === 'k' || cleaned === 'kg') return 0;
  
  // Direct number
  const numMatch = cleaned.match(/^(\d+)$/);
  if (numMatch) return parseInt(numMatch[1], 10);
  
  // Grade X format
  const gradeMatch = cleaned.match(/grade\s*(\d+)/i);
  if (gradeMatch) return parseInt(gradeMatch[1], 10);
  
  // Roman numerals for senior high
  if (cleaned.includes('xi') || cleaned.includes('11')) return 11;
  if (cleaned.includes('xii') || cleaned.includes('12')) return 12;
  
  return 0;
}

/**
 * Parse promotion status from various formats
 */
function parsePromotionStatus(statusStr: string): PromotionStatus {
  if (!statusStr) return 'pending';
  
  const cleaned = statusStr.toLowerCase().trim();
  
  if (cleaned.includes('promoted') || cleaned === 'p' || cleaned === 'yes') return 'promoted';
  if (cleaned.includes('retained') || cleaned === 'r' || cleaned === 'no' || cleaned.includes('repeat')) return 'retained';
  if (cleaned.includes('graduated') || cleaned === 'g' || cleaned.includes('completer')) return 'graduated';
  if (cleaned.includes('transfer') || cleaned === 't') return 'transferred';
  if (cleaned.includes('conditional')) return 'promoted'; // Conditional is technically promoted
  
  return 'pending';
}

/**
 * Parse numeric grade value
 */
function parseGrade(value: string): number | null {
  if (!value) return null;
  
  const cleaned = value.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  
  if (isNaN(num)) return null;
  if (num < 0 || num > 100) return null;
  
  return Math.round(num * 100) / 100;
}

/**
 * Check if a row is a summary/total row that should be skipped
 */
function isSummaryRow(row: string[]): boolean {
  const firstCells = row.slice(0, 5).join(' ').toLowerCase();
  return firstCells.includes('total') || 
         firstCells.includes('grand total') ||
         firstCells.includes('summary') ||
         firstCells.includes('prepared by') ||
         firstCells.includes('certified') ||
         firstCells.includes('signature') ||
         firstCells.includes('generated') ||
         firstCells.includes('promoted:') ||
         firstCells.includes('retained:');
}

/**
 * Check if a row is a valid student data row
 */
function isStudentRow(row: string[]): boolean {
  // Must have LRN or name in expected columns
  const hasLRN = row[0]?.trim().length >= 10 && /^\d+$/.test(row[0].trim());
  const hasName = row[1]?.trim().length > 3 || row[2]?.trim().length > 3;
  return hasLRN || hasName;
}

// ============================================================================
// COLUMN DETECTION
// ============================================================================

interface ColumnMap {
  lrn: number;
  name: number;
  lastName: number;
  firstName: number;
  middleName: number;
  sex: number;
  birthDate: number;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  average: number;
  status: number;
  remarks: number;
}

function detectColumns(headerRow: string[]): ColumnMap {
  const map: ColumnMap = {
    lrn: -1,
    name: -1,
    lastName: -1,
    firstName: -1,
    middleName: -1,
    sex: -1,
    birthDate: -1,
    q1: -1,
    q2: -1,
    q3: -1,
    q4: -1,
    average: -1,
    status: -1,
    remarks: -1
  };
  
  headerRow.forEach((header, index) => {
    const h = header.toLowerCase().trim();
    
    if (h.includes('lrn') || h.includes('learner') && h.includes('reference')) {
      map.lrn = index;
    } else if (h === 'name' || h.includes('learner name') || h.includes('student name')) {
      map.name = index;
    } else if (h.includes('last') && h.includes('name') || h === 'surname') {
      map.lastName = index;
    } else if (h.includes('first') && h.includes('name') || h === 'given name') {
      map.firstName = index;
    } else if (h.includes('middle') || h === 'm.n.' || h === 'mi') {
      map.middleName = index;
    } else if (h === 'sex' || h === 'gender' || h === 'm/f') {
      map.sex = index;
    } else if (h.includes('birth') || h === 'dob' || h === 'birthdate') {
      map.birthDate = index;
    } else if (h.includes('1st') || h.includes('q1') || h.includes('first quarter')) {
      map.q1 = index;
    } else if (h.includes('2nd') || h.includes('q2') || h.includes('second quarter')) {
      map.q2 = index;
    } else if (h.includes('3rd') || h.includes('q3') || h.includes('third quarter')) {
      map.q3 = index;
    } else if (h.includes('4th') || h.includes('q4') || h.includes('fourth quarter')) {
      map.q4 = index;
    } else if (h.includes('average') || h.includes('gen. ave') || h.includes('final')) {
      map.average = index;
    } else if (h.includes('status') || h.includes('promoted') || h.includes('decision')) {
      map.status = index;
    } else if (h.includes('remark')) {
      map.remarks = index;
    }
  });
  
  return map;
}

// ============================================================================
// MAIN PARSER
// ============================================================================

/**
 * Parse SF5 CSV file content
 */
export function parseSF5(csvContent: string): SF5ParseResult {
  const result: SF5ParseResult = {
    success: false,
    metadata: null,
    students: [],
    totalCount: 0,
    promotedCount: 0,
    retainedCount: 0,
    conditionalCount: 0,
    errors: [],
    warnings: []
  };

  try {
    // Parse CSV
    const parsed = Papa.parse<string[]>(csvContent, {
      header: false,
      skipEmptyLines: true,
      transformHeader: undefined,
    });

    if (parsed.errors.length > 0) {
      result.errors.push(`CSV parsing errors: ${parsed.errors.map(e => e.message).join(', ')}`);
      return result;
    }

    const rows = parsed.data;
    if (rows.length < 7) {
      result.errors.push('File appears to be empty or incorrectly formatted');
      return result;
    }

    // =========================================================================
    // PARSE METADATA (Rows 1-6)
    // =========================================================================
    
    let schoolId = '';
    let schoolName = '';
    let region = '';
    let division = '';
    let district = '';
    let schoolYear = '';
    let gradeLevel = 0;
    let gradeLevelRaw = '';
    let sectionName = '';
    let adviserName = '';

    // Search metadata in first 10 rows
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const row = rows[i];
      const rowText = row.join(' ').toLowerCase();
      
      for (let j = 0; j < row.length; j++) {
        const cell = row[j]?.trim() || '';
        const cellLower = cell.toLowerCase();
        const nextCell = row[j + 1]?.trim() || '';
        
        // School ID
        if (cellLower.includes('school id') && nextCell) {
          schoolId = nextCell.replace(/[^0-9]/g, '');
        } else if (cellLower.match(/^\d{6,}$/) && !schoolId) {
          schoolId = cell;
        }
        
        // Region
        if (cellLower.includes('region') && nextCell) {
          region = nextCell;
        }
        
        // Division
        if (cellLower.includes('division') && nextCell && !nextCell.toLowerCase().includes('region')) {
          division = nextCell;
        }
        
        // District
        if (cellLower.includes('district') && nextCell) {
          district = nextCell;
        }
        
        // School Name
        if (cellLower.includes('school name') && nextCell) {
          schoolName = nextCell;
        } else if (cellLower.includes('school:') && nextCell) {
          schoolName = nextCell;
        }
        
        // School Year
        if (cellLower.includes('school year') || cellLower.includes('s.y.') || cellLower.includes('sy:')) {
          const syMatch = cell.match(/(\d{4})\s*[-–]\s*(\d{4})/) || nextCell.match(/(\d{4})\s*[-–]\s*(\d{4})/);
          if (syMatch) {
            schoolYear = normalizeSchoolYear(syMatch[0]);
          } else if (nextCell.match(/\d{4}/)) {
            schoolYear = normalizeSchoolYear(nextCell);
          }
        }
        
        // Grade Level
        if (cellLower.includes('grade level') || cellLower.includes('grade:')) {
          gradeLevelRaw = nextCell || '';
          gradeLevel = parseGradeLevel(gradeLevelRaw);
        } else if (cellLower.match(/^grade\s*\d+$/i)) {
          gradeLevelRaw = cell;
          gradeLevel = parseGradeLevel(cell);
        }
        
        // Section
        if (cellLower.includes('section') && nextCell && !nextCell.toLowerCase().includes('grade')) {
          sectionName = nextCell;
        }
        
        // Adviser
        if (cellLower.includes('adviser') || cellLower.includes('advisor')) {
          adviserName = nextCell || '';
        }
      }
    }

    // Validate required metadata
    if (!schoolName && !schoolId) {
      result.errors.push('Could not find school name or ID in file');
      return result;
    }
    
    if (!gradeLevel && gradeLevel !== 0) {
      result.warnings.push('Grade level not detected, defaulting to 0');
    }

    result.metadata = {
      schoolId,
      schoolName,
      region,
      division,
      district,
      schoolYear,
      gradeLevel,
      gradeLevelRaw,
      sectionName,
      adviserName
    };

    // =========================================================================
    // DETECT COLUMN HEADERS
    // =========================================================================
    
    let headerRowIndex = -1;
    let columnMap: ColumnMap | null = null;
    
    // Find header row (look for LRN or Name column)
    for (let i = 0; i < Math.min(15, rows.length); i++) {
      const row = rows[i];
      const rowText = row.join(' ').toLowerCase();
      
      if (rowText.includes('lrn') || rowText.includes('learner') || 
          (rowText.includes('name') && (rowText.includes('last') || rowText.includes('first')))) {
        headerRowIndex = i;
        columnMap = detectColumns(row);
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      result.errors.push('Could not find column headers (LRN/Name)');
      return result;
    }

    // =========================================================================
    // PARSE STUDENT DATA
    // =========================================================================
    
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Skip empty rows
      if (!row || row.length === 0 || row.every(c => !c || !c.trim())) {
        continue;
      }
      
      // Skip summary rows
      if (isSummaryRow(row)) {
        continue;
      }
      
      // Skip non-student rows
      if (!isStudentRow(row)) {
        continue;
      }
      
      const student: SF5Student = {
        lrn: '',
        lastName: '',
        firstName: '',
        middleName: '',
        fullName: '',
        sex: 'M',
        birthDate: null,
        q1Average: null,
        q2Average: null,
        q3Average: null,
        q4Average: null,
        generalAverage: null,
        promotionStatus: 'pending',
        promotionStatusRaw: '',
        remarks: '',
        socioEmotionalDev: null,
        physicalMotorDev: null,
        cognitiveDev: null,
        languageLiteracyDev: null,
        isValid: true,
        validationErrors: []
      };
      
      // Extract values using column map
      if (columnMap) {
        // LRN
        if (columnMap.lrn >= 0) {
          student.lrn = row[columnMap.lrn]?.trim().replace(/[^0-9]/g, '') || '';
        }
        
        // Name - either combined or separate
        if (columnMap.name >= 0) {
          const nameStr = row[columnMap.name]?.trim() || '';
          const parsed = parseName(nameStr);
          student.lastName = parsed.lastName;
          student.firstName = parsed.firstName;
          student.middleName = parsed.middleName;
        } else {
          if (columnMap.lastName >= 0) student.lastName = row[columnMap.lastName]?.trim() || '';
          if (columnMap.firstName >= 0) student.firstName = row[columnMap.firstName]?.trim() || '';
          if (columnMap.middleName >= 0) student.middleName = row[columnMap.middleName]?.trim() || '';
        }
        
        // Full name
        student.fullName = [student.lastName, student.firstName, student.middleName]
          .filter(Boolean)
          .join(', ')
          .replace(/,\s*$/, '');
        
        // Sex
        if (columnMap.sex >= 0) {
          const sexVal = row[columnMap.sex]?.trim().toUpperCase() || '';
          student.sex = sexVal.startsWith('F') ? 'F' : 'M';
        }
        
        // Birth date
        if (columnMap.birthDate >= 0) {
          student.birthDate = parseDate(row[columnMap.birthDate]?.trim() || '');
        }
        
        // Quarterly grades
        if (columnMap.q1 >= 0) student.q1Average = parseGrade(row[columnMap.q1] || '');
        if (columnMap.q2 >= 0) student.q2Average = parseGrade(row[columnMap.q2] || '');
        if (columnMap.q3 >= 0) student.q3Average = parseGrade(row[columnMap.q3] || '');
        if (columnMap.q4 >= 0) student.q4Average = parseGrade(row[columnMap.q4] || '');
        
        // General average
        if (columnMap.average >= 0) {
          student.generalAverage = parseGrade(row[columnMap.average] || '');
        } else if (student.q1Average && student.q4Average) {
          // Calculate if not provided
          const grades = [student.q1Average, student.q2Average, student.q3Average, student.q4Average]
            .filter((g): g is number => g !== null);
          if (grades.length > 0) {
            student.generalAverage = Math.round(grades.reduce((a, b) => a + b, 0) / grades.length * 100) / 100;
          }
        }
        
        // Promotion status
        if (columnMap.status >= 0) {
          student.promotionStatusRaw = row[columnMap.status]?.trim() || '';
          student.promotionStatus = parsePromotionStatus(student.promotionStatusRaw);
        } else if (student.generalAverage !== null) {
          // Derive status from average if not provided
          if (student.generalAverage >= 75) {
            student.promotionStatus = 'promoted';
          } else {
            student.promotionStatus = 'retained';
          }
        }
        
        // Remarks
        if (columnMap.remarks >= 0) {
          student.remarks = row[columnMap.remarks]?.trim() || '';
        }
      }
      
      // Validation
      if (!student.lrn && !student.fullName) {
        student.isValid = false;
        student.validationErrors.push('Missing LRN and name');
      }
      
      if (!student.fullName) {
        student.isValid = false;
        student.validationErrors.push('Missing student name');
      }
      
      result.students.push(student);
      
      // Count by status
      if (student.promotionStatus === 'promoted') {
        result.promotedCount++;
      } else if (student.promotionStatus === 'retained') {
        result.retainedCount++;
      }
    }

    result.totalCount = result.students.length;

    if (result.students.length === 0) {
      result.errors.push('No student data found in file');
      return result;
    }

    result.success = true;

  } catch (error: any) {
    result.errors.push(`Parse error: ${error.message}`);
  }

  return result;
}

/**
 * Validate SF5 import result before importing
 */
export function validateSF5Import(parseResult: SF5ParseResult): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!parseResult.success) {
    errors.push('Parse was not successful');
    return { isValid: false, errors, warnings };
  }

  if (!parseResult.metadata) {
    errors.push('Missing metadata');
    return { isValid: false, errors, warnings };
  }

  if (!parseResult.metadata.schoolId && !parseResult.metadata.schoolName) {
    errors.push('Missing school identifier');
  }

  if (!parseResult.metadata.schoolYear) {
    warnings.push('School year not detected - will need to specify manually');
  }

  if (parseResult.students.length === 0) {
    errors.push('No students to import');
  }

  const invalidStudents = parseResult.students.filter(s => !s.isValid);
  if (invalidStudents.length > 0) {
    warnings.push(`${invalidStudents.length} student(s) have validation issues`);
  }

  const studentsWithoutLRN = parseResult.students.filter(s => !s.lrn);
  if (studentsWithoutLRN.length > 0) {
    warnings.push(`${studentsWithoutLRN.length} student(s) missing LRN - will require matching by name`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
