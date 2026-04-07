/**
 * Data Validator for Free Form Generator Tool
 * Validates parsed CSV data before PDF generation.
 * Follows DepEd standards (grade ranges, LRN format, etc.)
 */

import type { SF5ParsedRow, SF9ParsedRow, SF2ParsedRow, CoreValuesParsedRow, HomeroomGuidanceParsedRow, ParseError } from './csvParser';

export interface ValidationResult {
  valid: boolean;
  errors: ParseError[];
  warnings: ParseError[];
}

// DepEd Order No. 8, s. 2015 — grade range
const MIN_GRADE = 60;
const MAX_GRADE = 100;
function isValidLRN(lrn: string): boolean {
  return /^\d{12}$/.test(lrn.trim());
}

function isValidGrade(grade: number): boolean {
  return grade >= MIN_GRADE && grade <= MAX_GRADE;
}

function isValidGender(gender: string): boolean {
  const normalized = gender.trim().toLowerCase();
  return ['male', 'female', 'm', 'f'].includes(normalized);
}

function normalizeGender(gender: string): string {
  const g = gender.trim().toLowerCase();
  if (g === 'm' || g === 'male') return 'Male';
  if (g === 'f' || g === 'female') return 'Female';
  return gender;
}

/**
 * Validate SF5 data rows.
 */
export function validateSF5Data(data: SF5ParsedRow[]): ValidationResult {
  const errors: ParseError[] = [];
  const warnings: ParseError[] = [];

  if (data.length === 0) {
    errors.push({ row: 0, field: '', message: 'No student data found. Please check your file.' });
    return { valid: false, errors, warnings };
  }

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2; // +2 because row 1 is header, data starts at row 2

    // Required fields
    if (!row.lastName) errors.push({ row: rowNum, field: 'Last Name', message: `Row ${rowNum}: Last name is required.` });
    if (!row.firstName) errors.push({ row: rowNum, field: 'First Name', message: `Row ${rowNum}: First name is required.` });

    // LRN validation
    if (!row.lrn) {
      warnings.push({ row: rowNum, field: 'LRN', message: `Row ${rowNum}: LRN is empty.` });
    } else if (!isValidLRN(row.lrn)) {
      errors.push({ row: rowNum, field: 'LRN', message: `Row ${rowNum}: LRN must be exactly 12 digits. Got "${row.lrn}".` });
    }

    // Gender
    if (row.gender && !isValidGender(row.gender)) {
      warnings.push({ row: rowNum, field: 'Gender', message: `Row ${rowNum}: Gender should be "Male" or "Female". Got "${row.gender}".` });
    } else {
      row.gender = normalizeGender(row.gender);
    }

    // Grade range validation
    for (const [subject, grade] of Object.entries(row.subjects)) {
      if (!isValidGrade(grade)) {
        errors.push({ row: rowNum, field: subject, message: `Row ${rowNum}: ${subject} grade ${grade} is outside valid range (${MIN_GRADE}-${MAX_GRADE}).` });
      }
    }

    // General average
    if (row.generalAverage && !isValidGrade(row.generalAverage)) {
      errors.push({ row: rowNum, field: 'General Average', message: `Row ${rowNum}: General average ${row.generalAverage} is outside valid range (${MIN_GRADE}-${MAX_GRADE}).` });
    }

    // No subjects
    if (Object.keys(row.subjects).length === 0) {
      warnings.push({ row: rowNum, field: 'Subjects', message: `Row ${rowNum}: No subject grades found.` });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate SF9 data rows.
 */
export function validateSF9Data(data: SF9ParsedRow[]): ValidationResult {
  const errors: ParseError[] = [];
  const warnings: ParseError[] = [];

  if (data.length === 0) {
    errors.push({ row: 0, field: '', message: 'No student data found. Please check your file.' });
    return { valid: false, errors, warnings };
  }

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;

    // Required fields
    if (!row.lastName) errors.push({ row: rowNum, field: 'Last Name', message: `Row ${rowNum}: Last name is required.` });
    if (!row.firstName) errors.push({ row: rowNum, field: 'First Name', message: `Row ${rowNum}: First name is required.` });
    if (!row.subject) errors.push({ row: rowNum, field: 'Subject', message: `Row ${rowNum}: Subject/learning area is required.` });

    // LRN
    if (!row.lrn) {
      warnings.push({ row: rowNum, field: 'LRN', message: `Row ${rowNum}: LRN is empty.` });
    } else if (!isValidLRN(row.lrn)) {
      errors.push({ row: rowNum, field: 'LRN', message: `Row ${rowNum}: LRN must be exactly 12 digits. Got "${row.lrn}".` });
    }

    // Gender
    if (row.gender && !isValidGender(row.gender)) {
      warnings.push({ row: rowNum, field: 'Gender', message: `Row ${rowNum}: Gender should be "Male" or "Female". Got "${row.gender}".` });
    } else if (row.gender) {
      row.gender = normalizeGender(row.gender);
    }

    // Quarter grades
    const quarters = { Q1: row.q1, Q2: row.q2, Q3: row.q3, Q4: row.q4 };
    for (const [qName, qVal] of Object.entries(quarters)) {
      if (qVal !== null && !isValidGrade(qVal)) {
        errors.push({ row: rowNum, field: qName, message: `Row ${rowNum}: ${qName} grade ${qVal} is outside valid range (${MIN_GRADE}-${MAX_GRADE}).` });
      }
    }

    // At least one quarter should have a grade
    if (row.q1 === null && row.q2 === null && row.q3 === null && row.q4 === null) {
      warnings.push({ row: rowNum, field: 'Grades', message: `Row ${rowNum}: No quarterly grades found for ${row.subject}.` });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate SF2 data rows.
 */
export function validateSF2Data(data: SF2ParsedRow[]): ValidationResult {
  const errors: ParseError[] = [];
  const warnings: ParseError[] = [];

  if (data.length === 0) {
    errors.push({ row: 0, field: '', message: 'No student data found. Please check your file.' });
    return { valid: false, errors, warnings };
  }

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;

    if (!row.lastName) errors.push({ row: rowNum, field: 'Last Name', message: `Row ${rowNum}: Last name is required.` });
    if (!row.firstName) errors.push({ row: rowNum, field: 'First Name', message: `Row ${rowNum}: First name is required.` });

    if (!row.lrn) {
      warnings.push({ row: rowNum, field: 'LRN', message: `Row ${rowNum}: LRN is empty.` });
    } else if (!isValidLRN(row.lrn)) {
      errors.push({ row: rowNum, field: 'LRN', message: `Row ${rowNum}: LRN must be exactly 12 digits. Got "${row.lrn}".` });
    }

    if (row.gender && !isValidGender(row.gender)) {
      warnings.push({ row: rowNum, field: 'Gender', message: `Row ${rowNum}: Gender should be "Male" or "Female". Got "${row.gender}".` });
    } else if (row.gender) {
      row.gender = normalizeGender(row.gender);
    }

    // Check attendance values
    const invalidStatuses = Object.entries(row.attendance).filter(
      ([, v]) => !['P', 'A', 'L', 'E'].includes(v)
    );
    if (invalidStatuses.length > 0) {
      errors.push({ row: rowNum, field: 'Attendance', message: `Row ${rowNum}: Invalid attendance values. Use P, A, L, or E.` });
    }

    if (Object.keys(row.attendance).length === 0) {
      warnings.push({ row: rowNum, field: 'Attendance', message: `Row ${rowNum}: No attendance data found.` });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export { normalizeGender };

/**
 * Validate Core Values data rows.
 */
export function validateCoreValuesData(data: CoreValuesParsedRow[]): ValidationResult {
  const errors: ParseError[] = [];
  const warnings: ParseError[] = [];

  if (data.length === 0) {
    errors.push({ row: 0, field: '', message: 'No data found. Please check your file.' });
    return { valid: false, errors, warnings };
  }

  const VALID_CORE_VALUES = ['maka-diyos', 'makatao', 'makakalikasan', 'makabansa'];
  const VALID_RATINGS = ['AO', 'SO', 'RO', 'NO', ''];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;

    if (!row.lastName) errors.push({ row: rowNum, field: 'Last Name', message: `Row ${rowNum}: Last name is required.` });
    if (!row.firstName) errors.push({ row: rowNum, field: 'First Name', message: `Row ${rowNum}: First name is required.` });

    if (!row.lrn) {
      warnings.push({ row: rowNum, field: 'LRN', message: `Row ${rowNum}: LRN is empty.` });
    } else if (!isValidLRN(row.lrn)) {
      errors.push({ row: rowNum, field: 'LRN', message: `Row ${rowNum}: LRN must be exactly 12 digits. Got "${row.lrn}".` });
    }

    if (row.gender && !isValidGender(row.gender)) {
      warnings.push({ row: rowNum, field: 'Gender', message: `Row ${rowNum}: Gender should be "Male" or "Female". Got "${row.gender}".` });
    } else if (row.gender) {
      row.gender = normalizeGender(row.gender);
    }

    if (!row.coreValue) {
      errors.push({ row: rowNum, field: 'Core Value', message: `Row ${rowNum}: Core value is required.` });
    } else if (!VALID_CORE_VALUES.includes(row.coreValue.toLowerCase())) {
      warnings.push({ row: rowNum, field: 'Core Value', message: `Row ${rowNum}: Unrecognized core value "${row.coreValue}". Expected: Maka-Diyos, Makatao, Makakalikasan, Makabansa.` });
    }

    if (!row.behavior) {
      errors.push({ row: rowNum, field: 'Behavior', message: `Row ${rowNum}: Behavior statement is required.` });
    }

    for (const [qName, qVal] of Object.entries({ Q1: row.q1, Q2: row.q2, Q3: row.q3, Q4: row.q4 })) {
      if (qVal && !VALID_RATINGS.includes(qVal)) {
        errors.push({ row: rowNum, field: qName, message: `Row ${rowNum}: ${qName} must be AO, SO, RO, or NO. Got "${qVal}".` });
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate Homeroom Guidance data rows.
 */
export function validateHomeroomGuidanceData(data: HomeroomGuidanceParsedRow[]): ValidationResult {
  const errors: ParseError[] = [];
  const warnings: ParseError[] = [];

  if (data.length === 0) {
    errors.push({ row: 0, field: '', message: 'No data found. Please check your file.' });
    return { valid: false, errors, warnings };
  }

  const VALID_QUARTERS = ['FIRST QUARTER', 'SECOND QUARTER', 'THIRD QUARTER', 'FOURTH QUARTER'];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;

    if (!row.lastName) errors.push({ row: rowNum, field: 'Last Name', message: `Row ${rowNum}: Last name is required.` });
    if (!row.firstName) errors.push({ row: rowNum, field: 'First Name', message: `Row ${rowNum}: First name is required.` });

    if (!row.lrn) {
      warnings.push({ row: rowNum, field: 'LRN', message: `Row ${rowNum}: LRN is empty.` });
    } else if (!isValidLRN(row.lrn)) {
      errors.push({ row: rowNum, field: 'LRN', message: `Row ${rowNum}: LRN must be exactly 12 digits. Got "${row.lrn}".` });
    }

    if (row.gender && !isValidGender(row.gender)) {
      warnings.push({ row: rowNum, field: 'Gender', message: `Row ${rowNum}: Gender should be "Male" or "Female". Got "${row.gender}".` });
    } else if (row.gender) {
      row.gender = normalizeGender(row.gender);
    }

    if (!row.quarter) {
      errors.push({ row: rowNum, field: 'Quarter', message: `Row ${rowNum}: Quarter is required.` });
    } else if (!VALID_QUARTERS.includes(row.quarter.toUpperCase())) {
      warnings.push({ row: rowNum, field: 'Quarter', message: `Row ${rowNum}: Unrecognized quarter "${row.quarter}".` });
    }

    if (!row.competency) {
      errors.push({ row: rowNum, field: 'Competency', message: `Row ${rowNum}: Competency is required.` });
    }

    if (row.rating !== null && (row.rating < 0 || row.rating > 4)) {
      errors.push({ row: rowNum, field: 'Rating', message: `Row ${rowNum}: Rating must be 0–4. Got ${row.rating}.` });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
