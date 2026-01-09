/**
 * SF7 (School Form 7) Parser
 * 
 * Parses DepEd LIS SF7 CSV exports into structured data.
 * SF7 is the School Personnel Report containing teacher/staff information.
 * 
 * SF7 CSV Structure:
 * - Rows 1-2: Title headers
 * - Row 3: School ID, Region, Division, District
 * - Row 4: School Name, School Year
 * - Rows 5-6: Column headers
 * - Row 7+: Personnel data
 * - Summary rows at bottom
 */

import Papa from 'papaparse';

// ============================================================================
// TYPES
// ============================================================================

export interface SF7Metadata {
  schoolId: string;
  schoolName: string;
  region: string;
  division: string;
  district: string;
  schoolYear: string;
  reportDate?: string;
}

export type EmploymentStatus = 'permanent' | 'temporary' | 'contract' | 'substitute' | 'volunteer';
export type TeacherPosition = 
  | 'teacher_i' | 'teacher_ii' | 'teacher_iii'
  | 'master_teacher_i' | 'master_teacher_ii'
  | 'head_teacher_i' | 'head_teacher_ii' | 'head_teacher_iii'
  | 'principal_i' | 'principal_ii' | 'principal_iii' | 'principal_iv'
  | 'other';

export interface SF7Teacher {
  employeeNumber: string;
  lastName: string;
  firstName: string;
  middleName: string;
  fullName: string;
  suffix?: string;
  sex: 'M' | 'F';
  birthDate: string | null;
  position: TeacherPosition;
  positionRaw: string;
  employmentStatus: EmploymentStatus;
  employmentStatusRaw: string;
  dateHired: string | null;
  salary: number | null;
  highestEducation: string;
  majorSpecialization: string;
  prcLicenseNumber: string;
  prcLicenseExpiry: string | null;
  email: string;
  contactNumber: string;
  address: string;
  // Validation
  isValid: boolean;
  validationErrors: string[];
}

export interface SF7ParseResult {
  success: boolean;
  metadata: SF7Metadata | null;
  teachers: SF7Teacher[];
  maleCount: number;
  femaleCount: number;
  totalCount: number;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// CONSTANTS - Display Labels
// ============================================================================

export const POSITION_LABELS: Record<TeacherPosition, string> = {
  teacher_i: 'Teacher I',
  teacher_ii: 'Teacher II',
  teacher_iii: 'Teacher III',
  master_teacher_i: 'Master Teacher I',
  master_teacher_ii: 'Master Teacher II',
  head_teacher_i: 'Head Teacher I',
  head_teacher_ii: 'Head Teacher II',
  head_teacher_iii: 'Head Teacher III',
  principal_i: 'Principal I',
  principal_ii: 'Principal II',
  principal_iii: 'Principal III',
  principal_iv: 'Principal IV',
  other: 'Other'
};

export const STATUS_LABELS: Record<EmploymentStatus, string> = {
  permanent: 'Permanent',
  temporary: 'Temporary',
  contract: 'Contract/JO',
  substitute: 'Substitute',
  volunteer: 'Volunteer'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse name string in format "LASTNAME,FIRSTNAME, MIDDLENAME" or "LASTNAME, FIRSTNAME MIDDLENAME"
 */
function parseName(nameStr: string): { lastName: string; firstName: string; middleName: string; suffix?: string } {
  if (!nameStr) return { lastName: '', firstName: '', middleName: '' };
  
  // Remove extra quotes and trim
  const cleaned = nameStr.replace(/^["']|["']$/g, '').trim();
  
  // Check for suffix (Jr., Sr., III, IV, etc.)
  let suffix: string | undefined;
  const suffixMatch = cleaned.match(/\s+(Jr\.?|Sr\.?|III|IV|II)$/i);
  let nameWithoutSuffix = cleaned;
  if (suffixMatch) {
    suffix = suffixMatch[1];
    nameWithoutSuffix = cleaned.substring(0, cleaned.length - suffixMatch[0].length);
  }
  
  // Split by comma
  const parts = nameWithoutSuffix.split(',').map(p => p.trim());
  
  let lastName = parts[0] || '';
  let firstName = '';
  let middleName = '';
  
  if (parts.length >= 2) {
    // Format: "LASTNAME, FIRSTNAME MIDDLENAME" or "LASTNAME,FIRSTNAME,MIDDLENAME"
    const rest = parts.slice(1).join(' ').trim();
    const nameParts = rest.split(/\s+/);
    firstName = nameParts[0] || '';
    middleName = nameParts.slice(1).join(' ').replace(/-/g, '').trim();
  }
  
  return { lastName, firstName, middleName, suffix };
}

/**
 * Parse date from various formats to ISO YYYY-MM-DD
 */
function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  // Handle MM-DD-YYYY or MM/DD/YYYY
  const mdyMatch = dateStr.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (mdyMatch) {
    const [, month, day, year] = mdyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Handle YYYY-MM-DD
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
 * Map position string to standardized position enum
 */
function parsePosition(positionStr: string): TeacherPosition {
  if (!positionStr) return 'other';
  
  const cleaned = positionStr.toLowerCase().trim();
  
  // Teacher levels
  if (cleaned.includes('teacher iii') || cleaned.includes('teacher-iii') || cleaned === 't-iii') return 'teacher_iii';
  if (cleaned.includes('teacher ii') || cleaned.includes('teacher-ii') || cleaned === 't-ii') return 'teacher_ii';
  if (cleaned.includes('teacher i') || cleaned.includes('teacher-i') || cleaned === 't-i') return 'teacher_i';
  
  // Master teachers
  if (cleaned.includes('master teacher ii') || cleaned.includes('mt-ii')) return 'master_teacher_ii';
  if (cleaned.includes('master teacher i') || cleaned.includes('mt-i') || cleaned.includes('master teacher')) return 'master_teacher_i';
  
  // Head teachers
  if (cleaned.includes('head teacher iii') || cleaned.includes('ht-iii')) return 'head_teacher_iii';
  if (cleaned.includes('head teacher ii') || cleaned.includes('ht-ii')) return 'head_teacher_ii';
  if (cleaned.includes('head teacher i') || cleaned.includes('ht-i') || cleaned.includes('head teacher')) return 'head_teacher_i';
  
  // Principals
  if (cleaned.includes('principal iv')) return 'principal_iv';
  if (cleaned.includes('principal iii')) return 'principal_iii';
  if (cleaned.includes('principal ii')) return 'principal_ii';
  if (cleaned.includes('principal i') || cleaned.includes('principal')) return 'principal_i';
  
  return 'other';
}

/**
 * Map employment status string to standardized enum
 */
function parseEmploymentStatus(statusStr: string): EmploymentStatus {
  if (!statusStr) return 'permanent';
  
  const cleaned = statusStr.toLowerCase().trim();
  
  if (cleaned.includes('permanent') || cleaned.includes('regular')) return 'permanent';
  if (cleaned.includes('temporary') || cleaned.includes('temp')) return 'temporary';
  if (cleaned.includes('contract') || cleaned.includes('cos') || cleaned.includes('jo')) return 'contract';
  if (cleaned.includes('substitute') || cleaned.includes('sub')) return 'substitute';
  if (cleaned.includes('volunteer') || cleaned.includes('vol')) return 'volunteer';
  
  return 'permanent';
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
         firstCells.includes('generated');
}

/**
 * Check if a row is a valid teacher data row
 */
function isTeacherRow(row: string[]): boolean {
  // Must have employee number or name in expected columns
  const hasEmployeeNumber = row[0]?.trim().length > 0 && /^[A-Z0-9-]+$/i.test(row[0].trim());
  const hasName = row[1]?.trim().length > 3 || row[2]?.trim().length > 3;
  return hasEmployeeNumber || hasName;
}

// ============================================================================
// MAIN PARSER
// ============================================================================

/**
 * Parse SF7 CSV file content
 */
export function parseSF7(csvContent: string): SF7ParseResult {
  const result: SF7ParseResult = {
    success: false,
    metadata: null,
    teachers: [],
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
      result.errors.push('Invalid SF7 file: Not enough rows');
      return result;
    }

    // ========================================================================
    // EXTRACT METADATA FROM HEADER ROWS
    // ========================================================================
    
    // Debug: Log first few rows to understand structure
    console.log('[SF7Parser] Row 3:', rows[2]?.slice(0, 20).map((c, i) => `[${i}]="${c}"`).join(', '));
    console.log('[SF7Parser] Row 4:', rows[3]?.slice(0, 20).map((c, i) => `[${i}]="${c}"`).join(', '));
    
    // Row 3 (index 2): School ID, Region, Division, District
    const row3 = rows[2] || [];
    let schoolId = '';
    let region = '';
    let division = '';
    let district = '';
    
    // Search for values in row 3
    for (let i = 0; i < row3.length; i++) {
      const cell = row3[i]?.trim() || '';
      const nextCell = row3[i + 1]?.trim() || '';
      
      if (cell.toLowerCase().includes('school id') || cell.toLowerCase() === 'id') {
        schoolId = nextCell || row3[i + 2]?.trim() || '';
      }
      if (cell.toLowerCase().includes('region')) {
        region = nextCell || row3[i + 2]?.trim() || '';
      }
      if (cell.toLowerCase().includes('division')) {
        division = nextCell || row3[i + 2]?.trim() || '';
      }
      if (cell.toLowerCase().includes('district')) {
        district = nextCell || row3[i + 2]?.trim() || '';
      }
    }
    
    // Fallback to fixed positions if not found
    if (!schoolId) schoolId = row3[5]?.trim() || row3[1]?.trim() || '';
    if (!region) region = row3[11]?.trim() || '';
    if (!division) division = row3[19]?.trim() || '';
    
    // Row 4 (index 3): School Name, School Year
    const row4 = rows[3] || [];
    let schoolName = '';
    let schoolYearRaw = '';
    
    // Search for values in row 4
    for (let i = 0; i < row4.length; i++) {
      const cell = row4[i]?.trim() || '';
      const nextCell = row4[i + 1]?.trim() || '';
      
      if (cell.toLowerCase().includes('school name') || cell.toLowerCase() === 'name') {
        schoolName = nextCell || row4[i + 2]?.trim() || '';
      }
      if (cell.toLowerCase().includes('school year') || cell.toLowerCase() === 'sy') {
        schoolYearRaw = nextCell || row4[i + 2]?.trim() || '';
      }
    }
    
    // Fallback to fixed positions
    if (!schoolName) schoolName = row4[5]?.trim() || row4[1]?.trim() || '';
    if (!schoolYearRaw) schoolYearRaw = row4[19]?.trim() || '';
    
    const schoolYear = normalizeSchoolYear(schoolYearRaw);

    result.metadata = {
      schoolId,
      schoolName,
      region,
      division,
      district,
      schoolYear
    };

    // ========================================================================
    // DETECT COLUMN POSITIONS FROM HEADER ROW
    // ========================================================================
    
    // Find header row (usually row 5 or 6, index 4 or 5)
    let headerRowIdx = 4;
    let columnMap: Record<string, number> = {};
    
    for (let i = 4; i <= 6 && i < rows.length; i++) {
      const row = rows[i] || [];
      const rowText = row.join(' ').toLowerCase();
      
      if (rowText.includes('employee') || rowText.includes('name') || rowText.includes('position')) {
        headerRowIdx = i;
        
        // Map column positions
        for (let j = 0; j < row.length; j++) {
          const header = row[j]?.toLowerCase().trim() || '';
          
          if (header.includes('employee') && header.includes('no')) columnMap.employeeNumber = j;
          else if (header === 'name' || header.includes('full name')) columnMap.name = j;
          else if (header.includes('last') && header.includes('name')) columnMap.lastName = j;
          else if (header.includes('first') && header.includes('name')) columnMap.firstName = j;
          else if (header.includes('middle')) columnMap.middleName = j;
          else if (header === 'sex' || header === 'gender') columnMap.sex = j;
          else if (header.includes('birth') && header.includes('date')) columnMap.birthDate = j;
          else if (header === 'position' || header.includes('designation')) columnMap.position = j;
          else if (header.includes('status') || header.includes('employment')) columnMap.employmentStatus = j;
          else if (header.includes('date') && header.includes('hired')) columnMap.dateHired = j;
          else if (header.includes('salary')) columnMap.salary = j;
          else if (header.includes('education') || header.includes('degree')) columnMap.education = j;
          else if (header.includes('major') || header.includes('specialization')) columnMap.major = j;
          else if (header.includes('prc') && header.includes('license')) columnMap.prcLicense = j;
          else if (header.includes('email')) columnMap.email = j;
          else if (header.includes('contact') || header.includes('phone') || header.includes('mobile')) columnMap.contact = j;
          else if (header.includes('address')) columnMap.address = j;
        }
        
        break;
      }
    }
    
    console.log('[SF7Parser] Column map:', columnMap);
    
    // Default column positions if not detected
    if (Object.keys(columnMap).length === 0) {
      columnMap = {
        employeeNumber: 0,
        name: 1,
        sex: 2,
        position: 3,
        employmentStatus: 4,
        dateHired: 5,
        education: 6,
        major: 7,
        prcLicense: 8,
        email: 9,
        contact: 10,
        address: 11
      };
    }

    // ========================================================================
    // PARSE TEACHER ROWS
    // ========================================================================
    
    // Teacher data starts after header row
    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Skip empty rows
      if (!row || row.length === 0 || row.every(cell => !cell?.trim())) {
        continue;
      }

      // Skip summary/footer rows
      if (isSummaryRow(row)) {
        continue;
      }

      // Only process valid teacher rows
      if (!isTeacherRow(row)) {
        continue;
      }

      const validationErrors: string[] = [];

      // Parse Employee Number
      const employeeNumber = row[columnMap.employeeNumber]?.trim() || '';

      // Parse Name (either combined or separate columns)
      let lastName = '';
      let firstName = '';
      let middleName = '';
      let suffix: string | undefined;
      
      if (columnMap.lastName !== undefined) {
        lastName = row[columnMap.lastName]?.trim() || '';
        firstName = row[columnMap.firstName]?.trim() || '';
        middleName = row[columnMap.middleName]?.trim() || '';
      } else if (columnMap.name !== undefined) {
        const parsed = parseName(row[columnMap.name]?.trim() || '');
        lastName = parsed.lastName;
        firstName = parsed.firstName;
        middleName = parsed.middleName;
        suffix = parsed.suffix;
      }
      
      if (!lastName && !firstName) {
        // Try second column as fallback
        const parsed = parseName(row[1]?.trim() || '');
        lastName = parsed.lastName;
        firstName = parsed.firstName;
        middleName = parsed.middleName;
        suffix = parsed.suffix;
      }
      
      if (!lastName && !firstName) {
        validationErrors.push('Missing name');
      }

      // Parse Sex
      const sexRaw = row[columnMap.sex]?.trim().toUpperCase() || '';
      const sex = (sexRaw === 'M' || sexRaw === 'MALE') ? 'M' : (sexRaw === 'F' || sexRaw === 'FEMALE') ? 'F' : 'M';

      // Parse Birth Date
      const birthDateRaw = row[columnMap.birthDate]?.trim() || '';
      const birthDate = parseDate(birthDateRaw);

      // Parse Position
      const positionRaw = row[columnMap.position]?.trim() || '';
      const position = parsePosition(positionRaw);

      // Parse Employment Status
      const employmentStatusRaw = row[columnMap.employmentStatus]?.trim() || '';
      const employmentStatus = parseEmploymentStatus(employmentStatusRaw);

      // Parse Date Hired
      const dateHiredRaw = row[columnMap.dateHired]?.trim() || '';
      const dateHired = parseDate(dateHiredRaw);

      // Parse Salary (if present)
      const salaryRaw = row[columnMap.salary]?.trim().replace(/[₱,]/g, '') || '';
      const salary = parseFloat(salaryRaw) || null;

      // Parse Education
      const highestEducation = row[columnMap.education]?.trim() || '';
      const majorSpecialization = row[columnMap.major]?.trim() || '';

      // Parse PRC License
      const prcLicenseNumber = row[columnMap.prcLicense]?.trim() || '';
      const prcLicenseExpiry = null; // Usually not in SF7

      // Parse Contact Info
      const email = row[columnMap.email]?.trim() || '';
      const contactNumber = row[columnMap.contact]?.trim() || '';
      const address = row[columnMap.address]?.trim() || '';

      const teacher: SF7Teacher = {
        employeeNumber,
        lastName,
        firstName,
        middleName,
        fullName: [lastName, firstName, middleName].filter(Boolean).join(', '),
        suffix,
        sex,
        birthDate,
        position,
        positionRaw,
        employmentStatus,
        employmentStatusRaw,
        dateHired,
        salary,
        highestEducation,
        majorSpecialization,
        prcLicenseNumber,
        prcLicenseExpiry,
        email,
        contactNumber,
        address,
        isValid: validationErrors.length === 0,
        validationErrors
      };

      result.teachers.push(teacher);

      if (sex === 'M') result.maleCount++;
      else if (sex === 'F') result.femaleCount++;
    }

    result.totalCount = result.teachers.length;
    result.success = result.teachers.length > 0 && result.errors.length === 0;

    // Add warning if no teachers found
    if (result.teachers.length === 0) {
      result.warnings.push('No valid teacher records found in file');
    }

    // Add warning for invalid teachers
    const invalidCount = result.teachers.filter(t => !t.isValid).length;
    if (invalidCount > 0) {
      result.warnings.push(`${invalidCount} teacher(s) have validation issues`);
    }

  } catch (error: any) {
    result.errors.push(`Parse error: ${error.message}`);
  }

  return result;
}

/**
 * Validate parsed SF7 data against existing database records
 */
export async function validateSF7Import(
  parseResult: SF7ParseResult,
  existingEmployeeNumbers: Set<string>,
  existingEmails: Set<string>
): Promise<{
  newTeachers: SF7Teacher[];
  duplicateEmployeeNumbers: SF7Teacher[];
  duplicateEmails: SF7Teacher[];
  invalidTeachers: SF7Teacher[];
}> {
  const newTeachers: SF7Teacher[] = [];
  const duplicateEmployeeNumbers: SF7Teacher[] = [];
  const duplicateEmails: SF7Teacher[] = [];
  const invalidTeachers: SF7Teacher[] = [];

  for (const teacher of parseResult.teachers) {
    if (!teacher.isValid) {
      invalidTeachers.push(teacher);
    } else if (teacher.employeeNumber && existingEmployeeNumbers.has(teacher.employeeNumber)) {
      duplicateEmployeeNumbers.push(teacher);
    } else if (teacher.email && existingEmails.has(teacher.email.toLowerCase())) {
      duplicateEmails.push(teacher);
    } else {
      newTeachers.push(teacher);
    }
  }

  return { newTeachers, duplicateEmployeeNumbers, duplicateEmails, invalidTeachers };
}
