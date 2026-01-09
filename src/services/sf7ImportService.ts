/**
 * SF7 Import Service
 * 
 * Handles database operations for importing SF7 (School Personnel Report) data
 * from DepEd LIS into PostgreSQL.
 * 
 * This service manages:
 * - School lookup
 * - Bulk teacher insertion
 * - Duplicate checking by employee number and email
 * 
 * @see docs/features/SF1_IMPORT_MODULE.md (similar architecture)
 */

import { supabase } from '../lib/supabase';
import type { SF7Metadata, SF7Teacher, SF7ParseResult } from './sf7Parser';

// ============================================================================
// TYPES
// ============================================================================

export interface SF7ImportOptions {
  divisionId?: string;
  schoolId?: string;  // If provided, use this school instead of looking up
  createSchoolIfMissing: boolean;
  skipDuplicateEmployeeNumbers: boolean;
  skipDuplicateEmails: boolean;
  generateTemporaryEmails: boolean; // Generate email if not provided
}

export interface SchoolLookupResult {
  exists: boolean;
  schoolId: string | null;
  schoolData: {
    id: string;
    name: string;
    school_id_number: string;
    division: string;
    region: string;
  } | null;
}

export interface SF7ImportResult {
  success: boolean;
  schoolId: string | null;
  schoolCreated: boolean;
  teachersImported: number;
  teachersSkipped: number;
  teachersFailed: number;
  errors: string[];
  warnings: string[];
  importedTeachers: Array<{ employeeNumber: string; name: string; id: string }>;
  skippedTeachers: Array<{ employeeNumber: string; name: string; reason: string }>;
  failedTeachers: Array<{ employeeNumber: string; name: string; error: string }>;
}

export interface DuplicateCheck {
  existingEmployeeNumbers: Set<string>;
  existingEmails: Set<string>;
  duplicates: Array<{ employeeNumber: string; email: string; existingName: string }>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a school exists by DepEd School ID
 */
export async function lookupSchoolByDepEdId(schoolIdNumber: string): Promise<SchoolLookupResult> {
  const { data, error } = await supabase
    .from('schools')
    .select('id, name, school_id_number, division, region')
    .eq('school_id_number', schoolIdNumber)
    .is('deleted_at', null)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[SF7Import] Error looking up school:', error);
  }

  return {
    exists: !!data,
    schoolId: data?.id || null,
    schoolData: data || null
  };
}

/**
 * Check for duplicate employee numbers and emails in the database
 */
export async function checkDuplicateTeachers(
  schoolId: string,
  employeeNumbers: string[],
  emails: string[]
): Promise<DuplicateCheck> {
  const existingEmployeeNumbers = new Set<string>();
  const existingEmails = new Set<string>();
  const duplicates: Array<{ employeeNumber: string; email: string; existingName: string }> = [];

  // Check employee numbers
  if (employeeNumbers.length > 0) {
    const validEmployeeNumbers = employeeNumbers.filter(e => e && e.trim().length > 0);
    if (validEmployeeNumbers.length > 0) {
      const { data: byEmpNum } = await supabase
        .from('teachers')
        .select('employee_number, email, name')
        .eq('school_id', schoolId)
        .in('employee_number', validEmployeeNumbers)
        .is('deleted_at', null);

      byEmpNum?.forEach(t => {
        if (t.employee_number) {
          existingEmployeeNumbers.add(t.employee_number);
          duplicates.push({
            employeeNumber: t.employee_number,
            email: t.email || '',
            existingName: t.name
          });
        }
      });
    }
  }

  // Check emails
  if (emails.length > 0) {
    const validEmails = emails.filter(e => e && e.trim().length > 0).map(e => e.toLowerCase());
    if (validEmails.length > 0) {
      const { data: byEmail } = await supabase
        .from('teachers')
        .select('employee_number, email, name')
        .eq('school_id', schoolId)
        .in('email', validEmails)
        .is('deleted_at', null);

      byEmail?.forEach(t => {
        if (t.email) {
          existingEmails.add(t.email.toLowerCase());
          // Only add to duplicates if not already added by employee number
          if (!existingEmployeeNumbers.has(t.employee_number || '')) {
            duplicates.push({
              employeeNumber: t.employee_number || '',
              email: t.email,
              existingName: t.name
            });
          }
        }
      });
    }
  }

  return { existingEmployeeNumbers, existingEmails, duplicates };
}

/**
 * Generate a temporary email for teachers without email
 */
function generateTemporaryEmail(teacher: SF7Teacher, schoolId: string): string {
  const namePart = `${teacher.firstName.toLowerCase()}.${teacher.lastName.toLowerCase()}`
    .replace(/[^a-z.]/g, '')
    .substring(0, 30);
  const random = Math.random().toString(36).substring(2, 6);
  return `${namePart}.${random}@temp.edusync.ph`;
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a new school from SF7 metadata
 */
export async function createSchoolFromSF7(metadata: SF7Metadata): Promise<string | null> {
  const { data, error } = await supabase
    .from('schools')
    .insert({
      name: metadata.schoolName,
      school_id_number: metadata.schoolId,
      division: metadata.division,
      region: metadata.region,
      district: metadata.district || null,
      current_school_year: metadata.schoolYear,
      settings: {
        imported_from_sf7: true,
        import_date: new Date().toISOString(),
        import_source: 'DepEd LIS'
      }
    })
    .select('id')
    .single();

  if (error) {
    console.error('[SF7Import] Error creating school:', error);
    return null;
  }

  console.log('[SF7Import] Created school:', data.id, metadata.schoolName);
  return data.id;
}

/**
 * Bulk insert teachers from SF7 data
 */
export async function importTeachers(
  schoolId: string,
  teachers: SF7Teacher[],
  options: SF7ImportOptions
): Promise<{
  imported: Array<{ employeeNumber: string; name: string; id: string }>;
  skipped: Array<{ employeeNumber: string; name: string; reason: string }>;
  failed: Array<{ employeeNumber: string; name: string; error: string }>;
}> {
  const imported: Array<{ employeeNumber: string; name: string; id: string }> = [];
  const skipped: Array<{ employeeNumber: string; name: string; reason: string }> = [];
  const failed: Array<{ employeeNumber: string; name: string; error: string }> = [];

  // Check for existing teachers
  const employeeNumbers = teachers.map(t => t.employeeNumber).filter(Boolean);
  const emails = teachers.map(t => t.email).filter(Boolean);
  const { existingEmployeeNumbers, existingEmails } = await checkDuplicateTeachers(
    schoolId,
    employeeNumbers,
    emails
  );

  // Filter teachers to import
  const teachersToImport: SF7Teacher[] = [];
  for (const teacher of teachers) {
    if (!teacher.isValid) {
      failed.push({
        employeeNumber: teacher.employeeNumber,
        name: teacher.fullName,
        error: teacher.validationErrors.join(', ')
      });
      continue;
    }

    if (teacher.employeeNumber && existingEmployeeNumbers.has(teacher.employeeNumber)) {
      if (options.skipDuplicateEmployeeNumbers) {
        skipped.push({
          employeeNumber: teacher.employeeNumber,
          name: teacher.fullName,
          reason: 'Employee number already exists'
        });
        continue;
      }
    }

    if (teacher.email && existingEmails.has(teacher.email.toLowerCase())) {
      if (options.skipDuplicateEmails) {
        skipped.push({
          employeeNumber: teacher.employeeNumber,
          name: teacher.fullName,
          reason: 'Email already exists'
        });
        continue;
      }
    }

    teachersToImport.push(teacher);
  }

  if (teachersToImport.length === 0) {
    return { imported, skipped, failed };
  }

  // Prepare teacher records for bulk insert
  const teacherRecords = teachersToImport.map(teacher => {
    // Generate email if needed
    let email = teacher.email;
    if (!email && options.generateTemporaryEmails) {
      email = generateTemporaryEmail(teacher, schoolId);
    }

    return {
      school_id: schoolId,
      name: teacher.fullName,
      first_name: teacher.firstName,
      middle_name: teacher.middleName || null,
      last_name: teacher.lastName,
      email: email || null,
      employee_number: teacher.employeeNumber || null,
      position: teacher.position,
      employment_status: teacher.employmentStatus,
      date_hired: teacher.dateHired || null,
      highest_education: teacher.highestEducation || null,
      major_specialization: teacher.majorSpecialization || null,
      prc_license_number: teacher.prcLicenseNumber || null,
      prc_license_expiry: teacher.prcLicenseExpiry || null,
      contact_number: teacher.contactNumber || null,
      phone: teacher.contactNumber || null,
      role: 'teacher',
      // These will be set later when account is created
      firebase_uid: null,
      user_id: null
    };
  });

  // Try bulk insert first
  const { data, error } = await supabase
    .from('teachers')
    .insert(teacherRecords)
    .select('id, employee_number, name');

  if (error) {
    console.error('[SF7Import] Bulk insert error:', error);
    
    // If bulk insert fails, try individual inserts
    for (let i = 0; i < teachersToImport.length; i++) {
      const teacher = teachersToImport[i];
      const record = teacherRecords[i];

      const { data: singleData, error: singleError } = await supabase
        .from('teachers')
        .insert(record)
        .select('id, employee_number, name')
        .single();

      if (singleError) {
        failed.push({
          employeeNumber: teacher.employeeNumber,
          name: teacher.fullName,
          error: singleError.message
        });
      } else if (singleData) {
        imported.push({
          employeeNumber: singleData.employee_number || '',
          name: singleData.name,
          id: singleData.id
        });
      }
    }
  } else if (data) {
    for (const teacher of data) {
      imported.push({
        employeeNumber: teacher.employee_number || '',
        name: teacher.name,
        id: teacher.id
      });
    }
  }

  return { imported, skipped, failed };
}

// ============================================================================
// MAIN IMPORT FUNCTION
// ============================================================================

/**
 * Main SF7 import function - orchestrates the entire import process
 */
export async function importSF7(
  parseResult: SF7ParseResult,
  options: SF7ImportOptions
): Promise<SF7ImportResult> {
  const result: SF7ImportResult = {
    success: false,
    schoolId: null,
    schoolCreated: false,
    teachersImported: 0,
    teachersSkipped: 0,
    teachersFailed: 0,
    errors: [],
    warnings: [],
    importedTeachers: [],
    skippedTeachers: [],
    failedTeachers: []
  };

  // Validate parse result
  if (!parseResult.success || !parseResult.metadata) {
    result.errors.push('Invalid SF7 parse result');
    return result;
  }

  const metadata = parseResult.metadata;

  try {
    // Step 1: Determine school
    console.log('[SF7Import] Step 1: Determining school');
    
    if (options.schoolId) {
      // Use provided school ID
      result.schoolId = options.schoolId;
    } else if (metadata.schoolId) {
      // Lookup by DepEd School ID
      const schoolLookup = await lookupSchoolByDepEdId(metadata.schoolId);

      if (!schoolLookup.exists) {
        if (!options.createSchoolIfMissing) {
          result.errors.push(`School not found: ${metadata.schoolName} (ID: ${metadata.schoolId}). Enable "Create school if missing" to create it.`);
          return result;
        }

        console.log('[SF7Import] Creating new school:', metadata.schoolName);
        const newSchoolId = await createSchoolFromSF7(metadata);
        
        if (!newSchoolId) {
          result.errors.push(`Failed to create school: ${metadata.schoolName}`);
          return result;
        }

        result.schoolCreated = true;
        result.schoolId = newSchoolId;
      } else {
        result.schoolId = schoolLookup.schoolId;
      }
    } else {
      result.errors.push('No school ID provided and none found in SF7 file');
      return result;
    }

    // Step 2: Import teachers
    console.log('[SF7Import] Step 2: Importing', parseResult.teachers.length, 'teachers');
    const { imported, skipped, failed } = await importTeachers(
      result.schoolId!,
      parseResult.teachers,
      options
    );

    result.importedTeachers = imported;
    result.skippedTeachers = skipped;
    result.failedTeachers = failed;
    result.teachersImported = imported.length;
    result.teachersSkipped = skipped.length;
    result.teachersFailed = failed.length;

    // Success!
    result.success = result.teachersImported > 0 || result.schoolCreated;

    // Add warnings
    if (result.teachersSkipped > 0) {
      result.warnings.push(`${result.teachersSkipped} teacher(s) skipped due to duplicates`);
    }
    if (result.teachersFailed > 0) {
      result.warnings.push(`${result.teachersFailed} teacher(s) failed due to validation errors`);
    }

    console.log('[SF7Import] Import complete:', {
      imported: result.teachersImported,
      skipped: result.teachersSkipped,
      failed: result.teachersFailed,
      schoolCreated: result.schoolCreated
    });

  } catch (error: any) {
    console.error('[SF7Import] Fatal error:', error);
    result.errors.push(`Import failed: ${error.message}`);
  }

  return result;
}

// ============================================================================
// VALIDATION PREVIEW
// ============================================================================

/**
 * Preview what will happen during import without making changes
 */
export async function previewSF7Import(
  parseResult: SF7ParseResult,
  schoolId?: string
): Promise<{
  schoolStatus: 'exists' | 'will_create' | 'provided' | 'error';
  schoolData: SchoolLookupResult['schoolData'];
  teachersToImport: number;
  duplicateEmployeeNumbers: number;
  duplicateEmails: number;
  invalidTeachers: SF7Teacher[];
}> {
  const metadata = parseResult.metadata;
  
  if (!metadata) {
    return {
      schoolStatus: 'error',
      schoolData: null,
      teachersToImport: 0,
      duplicateEmployeeNumbers: 0,
      duplicateEmails: 0,
      invalidTeachers: []
    };
  }

  // Check school
  let schoolStatus: 'exists' | 'will_create' | 'provided' | 'error' = 'error';
  let schoolData: SchoolLookupResult['schoolData'] = null;
  let effectiveSchoolId = schoolId;

  if (schoolId) {
    schoolStatus = 'provided';
    // Fetch school data
    const { data } = await supabase
      .from('schools')
      .select('id, name, school_id_number, division, region')
      .eq('id', schoolId)
      .single();
    schoolData = data;
    effectiveSchoolId = schoolId;
  } else if (metadata.schoolId) {
    const schoolLookup = await lookupSchoolByDepEdId(metadata.schoolId);
    schoolStatus = schoolLookup.exists ? 'exists' : 'will_create';
    schoolData = schoolLookup.schoolData;
    effectiveSchoolId = schoolLookup.schoolId || undefined;
  }

  // Check for duplicates (only if we have a school)
  let duplicateEmployeeNumbers = 0;
  let duplicateEmails = 0;
  
  if (effectiveSchoolId) {
    const validTeachers = parseResult.teachers.filter(t => t.isValid);
    const employeeNumbers = validTeachers.map(t => t.employeeNumber).filter(Boolean);
    const emails = validTeachers.map(t => t.email).filter(Boolean);
    
    const duplicates = await checkDuplicateTeachers(effectiveSchoolId, employeeNumbers, emails);
    duplicateEmployeeNumbers = duplicates.existingEmployeeNumbers.size;
    duplicateEmails = duplicates.existingEmails.size;
  }

  // Count valid teachers minus duplicates
  const validTeachers = parseResult.teachers.filter(t => t.isValid);
  const teachersToImport = validTeachers.length - duplicateEmployeeNumbers;

  // Get invalid teachers
  const invalidTeachers = parseResult.teachers.filter(t => !t.isValid);

  return {
    schoolStatus,
    schoolData,
    teachersToImport: Math.max(0, teachersToImport),
    duplicateEmployeeNumbers,
    duplicateEmails,
    invalidTeachers
  };
}
