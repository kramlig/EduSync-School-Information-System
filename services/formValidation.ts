/**
 * Form Validation Utilities
 * 
 * Validates data for DepEd forms to ensure compliance with:
 * - Data type constraints
 * - Required field rules
 * - DepEd policy requirements
 * - Data integrity checks
 */

import type {
  AcademicHistory,
  ReportCard,
  SchoolForm,
  ELLNAssessment,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from '../components/forms/shared/FormTypes';

/**
 * Validation result helper
 */
function createValidationResult(
  errors: ValidationError[] = [],
  warnings: ValidationWarning[] = []
): ValidationResult {
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Grade value validation
 */
export function validateGrade(
  grade: number | undefined,
  fieldName: string
): ValidationError | null {
  if (grade === undefined || grade === null) {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
      code: 'REQUIRED_FIELD'
    };
  }
  
  if (typeof grade !== 'number' || isNaN(grade)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid number`,
      code: 'INVALID_TYPE'
    };
  }
  
  if (grade < 60 || grade > 100) {
    return {
      field: fieldName,
      message: `${fieldName} must be between 60 and 100`,
      code: 'OUT_OF_RANGE'
    };
  }
  
  return null;
}

/**
 * Date validation
 */
export function validateDate(
  date: string | Date | undefined,
  fieldName: string,
  required: boolean = true
): ValidationError | null {
  if (!date) {
    if (required) {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
        code: 'REQUIRED_FIELD'
      };
    }
    return null;
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return {
      field: fieldName,
      message: `${fieldName} is not a valid date`,
      code: 'INVALID_DATE'
    };
  }
  
  return null;
}

/**
 * School year format validation (e.g., "2024-2025")
 */
export function validateSchoolYear(schoolYear: string): ValidationError | null {
  const pattern = /^\d{4}-\d{4}$/;
  
  if (!pattern.test(schoolYear)) {
    return {
      field: 'schoolYear',
      message: 'School year must be in format YYYY-YYYY (e.g., 2024-2025)',
      code: 'INVALID_FORMAT'
    };
  }
  
  const [startYear, endYear] = schoolYear.split('-').map(Number);
  
  if (endYear !== startYear + 1) {
    return {
      field: 'schoolYear',
      message: 'School year end must be start year + 1',
      code: 'INVALID_RANGE'
    };
  }
  
  return null;
}

/**
 * Grade level validation (0 = Kinder, 1-12 = Grades)
 */
export function validateGradeLevel(gradeLevel: number): ValidationError | null {
  if (gradeLevel < 0 || gradeLevel > 12) {
    return {
      field: 'gradeLevel',
      message: 'Grade level must be between 0 (Kinder) and 12',
      code: 'OUT_OF_RANGE'
    };
  }
  
  return null;
}

/**
 * Validate Form 137 (Academic History)
 */
export function validateForm137(data: Partial<AcademicHistory>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Required fields
  if (!data.studentId) {
    errors.push({
      field: 'studentId',
      message: 'Student ID is required',
      code: 'REQUIRED_FIELD'
    });
  }
  
  if (!data.schoolYear) {
    errors.push({
      field: 'schoolYear',
      message: 'School year is required',
      code: 'REQUIRED_FIELD'
    });
  } else {
    const syError = validateSchoolYear(data.schoolYear);
    if (syError) errors.push(syError);
  }
  
  if (data.gradeLevel === undefined) {
    errors.push({
      field: 'gradeLevel',
      message: 'Grade level is required',
      code: 'REQUIRED_FIELD'
    });
  } else {
    const glError = validateGradeLevel(data.gradeLevel);
    if (glError) errors.push(glError);
  }
  
  // Validate subjects
  if (!data.subjects || data.subjects.length === 0) {
    errors.push({
      field: 'subjects',
      message: 'At least one subject is required',
      code: 'REQUIRED_FIELD'
    });
  } else {
    data.subjects.forEach((subject, index) => {
      if (!subject.learningAreaId) {
        errors.push({
          field: `subjects[${index}].learningAreaId`,
          message: 'Learning area ID is required',
          code: 'REQUIRED_FIELD'
        });
      }
      
      if (!subject.learningAreaName) {
        errors.push({
          field: `subjects[${index}].learningAreaName`,
          message: 'Learning area name is required',
          code: 'REQUIRED_FIELD'
        });
      }
      
      // Validate quarterly grades
      ['q1', 'q2', 'q3', 'q4'].forEach(quarter => {
        const grade = subject[quarter as 'q1' | 'q2' | 'q3' | 'q4'];
        if (grade !== undefined) {
          const gradeError = validateGrade(grade, `subjects[${index}].${quarter}`);
          if (gradeError) errors.push(gradeError);
        }
      });
      
      // Validate final grade
      if (subject.finalGrade !== undefined) {
        const finalError = validateGrade(subject.finalGrade, `subjects[${index}].finalGrade`);
        if (finalError) errors.push(finalError);
      }
    });
  }
  
  // Validate general average
  if (data.generalAverage !== undefined) {
    const gaError = validateGrade(data.generalAverage, 'generalAverage');
    if (gaError) errors.push(gaError);
  }
  
  // Validate attendance
  if (data.daysOfSchool !== undefined && data.daysOfSchool < 0) {
    errors.push({
      field: 'daysOfSchool',
      message: 'Days of school cannot be negative',
      code: 'INVALID_VALUE'
    });
  }
  
  if (data.daysPresent !== undefined) {
    if (data.daysPresent < 0) {
      errors.push({
        field: 'daysPresent',
        message: 'Days present cannot be negative',
        code: 'INVALID_VALUE'
      });
    }
    
    if (data.daysOfSchool && data.daysPresent > data.daysOfSchool) {
      errors.push({
        field: 'daysPresent',
        message: 'Days present cannot exceed days of school',
        code: 'INVALID_VALUE'
      });
    }
  }
  
  // Warnings
  if (data.generalAverage && data.generalAverage < 75) {
    warnings.push({
      field: 'generalAverage',
      message: 'General average is below passing (75)',
      code: 'WARNING_LOW_GRADE'
    });
  }
  
  return createValidationResult(errors, warnings);
}

/**
 * Validate Form 138 (Report Card)
 */
export function validateForm138(data: Partial<ReportCard>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Required fields
  if (!data.studentId) {
    errors.push({
      field: 'studentId',
      message: 'Student ID is required',
      code: 'REQUIRED_FIELD'
    });
  }
  
  if (!data.schoolYear) {
    errors.push({
      field: 'schoolYear',
      message: 'School year is required',
      code: 'REQUIRED_FIELD'
    });
  } else {
    const syError = validateSchoolYear(data.schoolYear);
    if (syError) errors.push(syError);
  }
  
  if (data.gradeLevel === undefined) {
    errors.push({
      field: 'gradeLevel',
      message: 'Grade level is required',
      code: 'REQUIRED_FIELD'
    });
  } else {
    const glError = validateGradeLevel(data.gradeLevel);
    if (glError) errors.push(glError);
  }
  
  // Validate subjects
  if (!data.subjects || data.subjects.length === 0) {
    warnings.push({
      field: 'subjects',
      message: 'No subjects found',
      code: 'WARNING_EMPTY_SUBJECTS'
    });
  } else {
    data.subjects.forEach((subject, index) => {
      ['q1', 'q2', 'q3', 'q4'].forEach(quarter => {
        const grade = subject[quarter as 'q1' | 'q2' | 'q3' | 'q4'];
        if (grade !== undefined) {
          const gradeError = validateGrade(grade, `subjects[${index}].${quarter}`);
          if (gradeError) errors.push(gradeError);
        }
      });
      
      if (subject.finalGrade !== undefined) {
        const finalError = validateGrade(subject.finalGrade, `subjects[${index}].finalGrade`);
        if (finalError) errors.push(finalError);
      }
    });
  }
  
  return createValidationResult(errors, warnings);
}

/**
 * Validate School Form (SF1, SF2, SF9)
 */
export function validateSchoolForm(data: Partial<SchoolForm>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Required fields
  if (!data.formType) {
    errors.push({
      field: 'formType',
      message: 'Form type is required',
      code: 'REQUIRED_FIELD'
    });
  } else if (!['SF1', 'SF2', 'SF9'].includes(data.formType)) {
    errors.push({
      field: 'formType',
      message: 'Form type must be SF1, SF2, or SF9',
      code: 'INVALID_VALUE'
    });
  }
  
  if (!data.schoolYear) {
    errors.push({
      field: 'schoolYear',
      message: 'School year is required',
      code: 'REQUIRED_FIELD'
    });
  } else {
    const syError = validateSchoolYear(data.schoolYear);
    if (syError) errors.push(syError);
  }
  
  // Validate data based on form type
  if (data.formType === 'SF1' && !data.enrollmentData) {
    errors.push({
      field: 'enrollmentData',
      message: 'Enrollment data is required for SF1',
      code: 'REQUIRED_FIELD'
    });
  }
  
  if (data.formType === 'SF2' && !data.attendanceData) {
    errors.push({
      field: 'attendanceData',
      message: 'Attendance data is required for SF2',
      code: 'REQUIRED_FIELD'
    });
  }
  
  if (data.formType === 'SF9' && !data.promotionData) {
    errors.push({
      field: 'promotionData',
      message: 'Promotion data is required for SF9',
      code: 'REQUIRED_FIELD'
    });
  }
  
  return createValidationResult(errors, warnings);
}

/**
 * Validate ELLN Assessment
 */
export function validateELLNAssessment(data: Partial<ELLNAssessment>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Required fields
  if (!data.studentId) {
    errors.push({
      field: 'studentId',
      message: 'Student ID is required',
      code: 'REQUIRED_FIELD'
    });
  }
  
  if (!data.schoolYear) {
    errors.push({
      field: 'schoolYear',
      message: 'School year is required',
      code: 'REQUIRED_FIELD'
    });
  } else {
    const syError = validateSchoolYear(data.schoolYear);
    if (syError) errors.push(syError);
  }
  
  if (data.gradeLevel === undefined) {
    errors.push({
      field: 'gradeLevel',
      message: 'Grade level is required',
      code: 'REQUIRED_FIELD'
    });
  } else {
    // ELLN is only for K-3
    if (data.gradeLevel < 0 || data.gradeLevel > 3) {
      errors.push({
        field: 'gradeLevel',
        message: 'ELLN assessment is only for Kindergarten to Grade 3',
        code: 'INVALID_VALUE'
      });
    }
  }
  
  const dateError = validateDate(data.assessmentDate, 'assessmentDate', true);
  if (dateError) errors.push(dateError);
  
  // Validate proficiency levels
  const validLevels = ['Beginning', 'Developing', 'Approaching Proficiency', 'Proficient', 'Advanced'];
  
  if (data.proficiencyLevel && !validLevels.includes(data.proficiencyLevel)) {
    errors.push({
      field: 'proficiencyLevel',
      message: `Invalid proficiency level. Must be one of: ${validLevels.join(', ')}`,
      code: 'INVALID_VALUE'
    });
  }
  
  return createValidationResult(errors, warnings);
}

/**
 * Check if form is complete (all required fields filled)
 */
export function isFormComplete(validationResult: ValidationResult): boolean {
  return validationResult.isValid && validationResult.errors.length === 0;
}

/**
 * Get summary of validation issues
 */
export function getValidationSummary(validationResult: ValidationResult): string {
  const { errors, warnings } = validationResult;
  
  if (errors.length === 0 && warnings.length === 0) {
    return 'Form is valid';
  }
  
  const parts: string[] = [];
  
  if (errors.length > 0) {
    parts.push(`${errors.length} error${errors.length > 1 ? 's' : ''}`);
  }
  
  if (warnings.length > 0) {
    parts.push(`${warnings.length} warning${warnings.length > 1 ? 's' : ''}`);
  }
  
  return parts.join(', ');
}
