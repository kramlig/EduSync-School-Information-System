/**
 * SF1 Import Service
 * 
 * Handles database operations for importing SF1 (School Form 1) data
 * from DepEd LIS into PostgreSQL.
 * 
 * This service manages:
 * - School creation/lookup
 * - Section creation/lookup
 * - Bulk student insertion
 * - Parent record creation and linking
 * 
 * @see docs/features/SF1_IMPORT_MODULE.md
 */

import { supabase } from '../lib/supabase';
import type { SF1Metadata, SF1Student, SF1ParseResult } from './sf1Parser';

// ============================================================================
// TYPES
// ============================================================================

export interface SF1ImportOptions {
  divisionId?: string;       // Division UUID for permission check
  createSchoolIfMissing: boolean;
  createSectionIfMissing: boolean;
  skipDuplicateLRNs: boolean;
  updateExistingStudents: boolean;  // Update existing students with new data (parents, address, etc.)
  importParents: boolean;
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
    district: string;
  } | null;
}

export interface SectionLookupResult {
  exists: boolean;
  sectionId: string | null;
  sectionData: {
    id: string;
    name: string;
    grade_level: number;
    school_year: string;
  } | null;
}

export interface SF1ImportResult {
  success: boolean;
  schoolCreated: boolean;
  schoolId: string | null;
  sectionCreated: boolean;
  sectionId: string | null;
  studentsImported: number;
  studentsUpdated: number;   // NEW: Count of updated existing students
  studentsSkipped: number;
  studentsFailed: number;
  parentsCreated: number;
  errors: string[];
  warnings: string[];
  importedStudents: Array<{ lrn: string; name: string; id: string }>;
  updatedStudents: Array<{ lrn: string; name: string; id: string }>;  // NEW
  skippedStudents: Array<{ lrn: string; name: string; reason: string }>;
  failedStudents: Array<{ lrn: string; name: string; error: string }>;
}

export interface DuplicateLRNCheck {
  existingLRNs: Set<string>;
  duplicates: Array<{ lrn: string; existingSchoolId: string; existingSchoolName: string }>;
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
    .select('id, name, school_id_number, division, region, district')
    .eq('school_id_number', schoolIdNumber)
    .is('deleted_at', null)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[SF1Import] Error looking up school:', error);
  }

  return {
    exists: !!data,
    schoolId: data?.id || null,
    schoolData: data || null
  };
}

/**
 * Check if a section exists for a school/grade/year combination
 */
export async function lookupSection(
  schoolId: string,
  gradeLevel: number,
  sectionName: string,
  schoolYear: string
): Promise<SectionLookupResult> {
  const { data, error } = await supabase
    .from('sections')
    .select('id, name, grade_level, school_year')
    .eq('school_id', schoolId)
    .eq('grade_level', gradeLevel)
    .eq('name', sectionName)
    .eq('school_year', schoolYear)
    .is('deleted_at', null)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[SF1Import] Error looking up section:', error);
  }

  return {
    exists: !!data,
    sectionId: data?.id || null,
    sectionData: data || null
  };
}

/**
 * Check for duplicate LRNs across the entire database
 */
export async function checkDuplicateLRNs(lrns: string[]): Promise<DuplicateLRNCheck> {
  if (lrns.length === 0) {
    return { existingLRNs: new Set(), duplicates: [] };
  }

  const { data, error } = await supabase
    .from('students')
    .select(`
      lrn,
      school_id,
      schools!inner(name)
    `)
    .in('lrn', lrns)
    .is('deleted_at', null);

  if (error) {
    console.error('[SF1Import] Error checking duplicate LRNs:', error);
    return { existingLRNs: new Set(), duplicates: [] };
  }

  const existingLRNs = new Set(data?.map(s => s.lrn) || []);
  const duplicates = data?.map(s => ({
    lrn: s.lrn,
    existingSchoolId: s.school_id,
    existingSchoolName: (s.schools as any)?.name || 'Unknown'
  })) || [];

  return { existingLRNs, duplicates };
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a new school from SF1 metadata
 */
export async function createSchoolFromSF1(metadata: SF1Metadata, _divisionId?: string): Promise<string | null> {
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
        imported_from_sf1: true,
        import_date: new Date().toISOString(),
        import_source: 'DepEd LIS'
      }
    })
    .select('id')
    .single();

  if (error) {
    console.error('[SF1Import] Error creating school:', error);
    return null;
  }

  console.log('[SF1Import] Created school:', data.id, metadata.schoolName);
  return data.id;
}

/**
 * Create a new section from SF1 metadata
 */
export async function createSectionFromSF1(
  schoolId: string,
  metadata: SF1Metadata
): Promise<string | null> {
  const { data, error } = await supabase
    .from('sections')
    .insert({
      school_id: schoolId,
      name: metadata.sectionName,
      grade_level: metadata.gradeLevel,
      school_year: metadata.schoolYear,
      // adviser_id will be null initially - can be assigned later
    })
    .select('id')
    .single();

  if (error) {
    console.error('[SF1Import] Error creating section:', error);
    return null;
  }

  console.log('[SF1Import] Created section:', data.id, metadata.sectionName);
  return data.id;
}

/**
 * Bulk insert students from SF1 data
 */
export async function importStudents(
  schoolId: string,
  sectionId: string,
  students: SF1Student[],
  gradeLevel: number,
  _skipDuplicates: boolean = true,
  updateExisting: boolean = false
): Promise<{
  imported: Array<{ lrn: string; name: string; id: string }>;
  updated: Array<{ lrn: string; name: string; id: string }>;
  skipped: Array<{ lrn: string; name: string; reason: string }>;
  failed: Array<{ lrn: string; name: string; error: string }>;
}> {
  const imported: Array<{ lrn: string; name: string; id: string }> = [];
  const updated: Array<{ lrn: string; name: string; id: string }> = [];
  const skipped: Array<{ lrn: string; name: string; reason: string }> = [];
  const failed: Array<{ lrn: string; name: string; error: string }> = [];

  // Check for existing LRNs
  const lrns = students.map(s => s.lrn);
  const { existingLRNs, duplicates } = await checkDuplicateLRNs(lrns);

  // Separate students into new vs existing
  const studentsToImport: SF1Student[] = [];
  const studentsToUpdate: SF1Student[] = [];
  
  for (const student of students) {
    if (!student.isValid) {
      failed.push({
        lrn: student.lrn,
        name: student.fullName,
        error: student.validationErrors.join(', ')
      });
      continue;
    }

    if (existingLRNs.has(student.lrn)) {
      if (updateExisting) {
        // Will update this student
        studentsToUpdate.push(student);
      } else {
        const dup = duplicates.find(d => d.lrn === student.lrn);
        skipped.push({
          lrn: student.lrn,
          name: student.fullName,
          reason: `LRN already exists in ${dup?.existingSchoolName || 'another school'}`
        });
      }
      continue;
    }

    studentsToImport.push(student);
  }

  // Update existing students if requested
  if (updateExisting && studentsToUpdate.length > 0) {
    console.log(`[SF1Import] Updating ${studentsToUpdate.length} existing students...`);
    for (const student of studentsToUpdate) {
      const updateData: Record<string, unknown> = {
        name: student.fullName,
        first_name: student.firstName,
        middle_name: student.middleName || null,
        last_name: student.lastName,
        gender: student.sex === 'M' ? 'Male' : 'Female',
        date_of_birth: student.birthDate || null,
        address: student.address.full || null,
        contact_number: student.contactNumber || null,
        religion: student.religion || null,
        indigenous_people: !!student.indigenousGroup && student.indigenousGroup.toLowerCase() !== 'none',
        // Store additional SF1 data in metadata or specific columns if they exist
        mother_tongue: student.motherTongue || null,
        updated_at: new Date().toISOString()
      };

      const { data: updateResult, error: updateError } = await supabase
        .from('students')
        .update(updateData)
        .eq('lrn', student.lrn)
        .eq('school_id', schoolId)
        .select('id, lrn, name')
        .single();

      if (updateError) {
        console.error(`[SF1Import] Error updating student ${student.lrn}:`, updateError);
        failed.push({
          lrn: student.lrn,
          name: student.fullName,
          error: updateError.message
        });
      } else if (updateResult) {
        updated.push({
          lrn: updateResult.lrn,
          name: updateResult.name,
          id: updateResult.id
        });
      }
    }
  }

  if (studentsToImport.length === 0) {
    return { imported, updated, skipped, failed };
  }

  // Prepare student records for bulk insert
  const studentRecords = studentsToImport.map(student => ({
    school_id: schoolId,
    section_id: sectionId,
    lrn: student.lrn,
    name: student.fullName,
    first_name: student.firstName,
    middle_name: student.middleName || null,
    last_name: student.lastName,
    gender: student.sex === 'M' ? 'Male' : 'Female',
    date_of_birth: student.birthDate || null,
    grade_level: gradeLevel,
    enrollment_status: 'enrolled',
    address: student.address.full || null,
    contact_number: student.contactNumber || null,
    religion: student.religion || null,
    indigenous_people: !!student.indigenousGroup && student.indigenousGroup.toLowerCase() !== 'none'
  }));

  // Bulk insert with conflict handling
  const { data, error } = await supabase
    .from('students')
    .insert(studentRecords)
    .select('id, lrn, name');

  if (error) {
    console.error('[SF1Import] Bulk insert error:', error);
    // If bulk insert fails, try individual inserts
    for (const student of studentsToImport) {
      const record = studentRecords.find(r => r.lrn === student.lrn);
      if (!record) continue;

      const { data: singleData, error: singleError } = await supabase
        .from('students')
        .insert(record)
        .select('id, lrn, name')
        .single();

      if (singleError) {
        failed.push({
          lrn: student.lrn,
          name: student.fullName,
          error: singleError.message
        });
      } else if (singleData) {
        imported.push({
          lrn: singleData.lrn,
          name: singleData.name,
          id: singleData.id
        });
      }
    }
  } else if (data) {
    for (const student of data) {
      imported.push({
        lrn: student.lrn,
        name: student.name,
        id: student.id
      });
    }
  }

  return { imported, updated, skipped, failed };
}

/**
 * Create parent records and link them to a student
 */
export async function createParentRecords(
  schoolId: string,
  studentId: string,
  student: SF1Student
): Promise<number> {
  let parentsCreated = 0;

  const parentData: Array<{
    name: string;
    relationship: string;
    contactNumber?: string;
  }> = [];

  if (student.fatherName) {
    parentData.push({
      name: student.fatherName,
      relationship: 'Father',
      contactNumber: student.contactNumber
    });
  }

  if (student.motherName) {
    parentData.push({
      name: student.motherName,
      relationship: 'Mother',
      contactNumber: student.contactNumber
    });
  }

  if (student.guardianName && student.guardianName !== student.fatherName && student.guardianName !== student.motherName) {
    parentData.push({
      name: student.guardianName,
      relationship: student.guardianRelationship || 'Guardian',
      contactNumber: student.contactNumber
    });
  }

  for (const parent of parentData) {
    // Insert parent
    const { data: parentRecord, error: parentError } = await supabase
      .from('parents')
      .insert({
        school_id: schoolId,
        name: parent.name,
        relationship: parent.relationship,
        contact_number: parent.contactNumber || null
      })
      .select('id')
      .single();

    if (parentError) {
      console.error('[SF1Import] Error creating parent:', parentError);
      continue;
    }

    // Link parent to student
    const { error: linkError } = await supabase
      .from('parent_students')
      .insert({
        parent_id: parentRecord.id,
        student_id: studentId,
        relationship: parent.relationship,
        is_primary_contact: parent.relationship === 'Mother' // Mother is typically primary contact
      });

    if (linkError) {
      console.error('[SF1Import] Error linking parent:', linkError);
    } else {
      parentsCreated++;
    }
  }

  return parentsCreated;
}

// ============================================================================
// MAIN IMPORT FUNCTION
// ============================================================================

/**
 * Main SF1 import function - orchestrates the entire import process
 */
export async function importSF1(
  parseResult: SF1ParseResult,
  options: SF1ImportOptions
): Promise<SF1ImportResult> {
  const result: SF1ImportResult = {
    success: false,
    schoolCreated: false,
    schoolId: null,
    sectionCreated: false,
    sectionId: null,
    studentsImported: 0,
    studentsUpdated: 0,
    studentsSkipped: 0,
    studentsFailed: 0,
    parentsCreated: 0,
    errors: [],
    warnings: [],
    importedStudents: [],
    updatedStudents: [],
    skippedStudents: [],
    failedStudents: []
  };

  // Validate parse result
  if (!parseResult.success || !parseResult.metadata) {
    result.errors.push('Invalid SF1 parse result');
    return result;
  }

  const metadata = parseResult.metadata;

  try {
    // Step 1: Lookup or create school
    console.log('[SF1Import] Step 1: Looking up school:', metadata.schoolId);
    let schoolLookup = await lookupSchoolByDepEdId(metadata.schoolId);

    if (!schoolLookup.exists) {
      if (!options.createSchoolIfMissing) {
        result.errors.push(`School not found: ${metadata.schoolName} (ID: ${metadata.schoolId}). Enable "Create school if missing" to create it.`);
        return result;
      }

      console.log('[SF1Import] Creating new school:', metadata.schoolName);
      const newSchoolId = await createSchoolFromSF1(metadata, options.divisionId);
      
      if (!newSchoolId) {
        result.errors.push(`Failed to create school: ${metadata.schoolName}`);
        return result;
      }

      result.schoolCreated = true;
      result.schoolId = newSchoolId;
    } else {
      result.schoolId = schoolLookup.schoolId;
    }

    // Step 2: Lookup or create section
    console.log('[SF1Import] Step 2: Looking up section:', metadata.sectionName);
    let sectionLookup = await lookupSection(
      result.schoolId!,
      metadata.gradeLevel,
      metadata.sectionName,
      metadata.schoolYear
    );

    if (!sectionLookup.exists) {
      if (!options.createSectionIfMissing) {
        result.errors.push(`Section not found: ${metadata.sectionName}. Enable "Create section if missing" to create it.`);
        return result;
      }

      console.log('[SF1Import] Creating new section:', metadata.sectionName);
      const newSectionId = await createSectionFromSF1(result.schoolId!, metadata);
      
      if (!newSectionId) {
        result.errors.push(`Failed to create section: ${metadata.sectionName}`);
        return result;
      }

      result.sectionCreated = true;
      result.sectionId = newSectionId;
    } else {
      result.sectionId = sectionLookup.sectionId;
    }

    // Step 3: Import students
    console.log('[SF1Import] Step 3: Importing', parseResult.students.length, 'students');
    const { imported, updated, skipped, failed } = await importStudents(
      result.schoolId!,
      result.sectionId!,
      parseResult.students,
      metadata.gradeLevel,
      options.skipDuplicateLRNs,
      options.updateExistingStudents
    );

    result.importedStudents = imported;
    result.updatedStudents = updated;
    result.skippedStudents = skipped;
    result.failedStudents = failed;
    result.studentsImported = imported.length;
    result.studentsUpdated = updated.length;
    result.studentsSkipped = skipped.length;
    result.studentsFailed = failed.length;

    // Step 4: Create parent records (optional)
    if (options.importParents) {
      console.log('[SF1Import] Step 4: Creating parent records');
      // Create parents for newly imported students
      for (const importedStudent of imported) {
        const originalStudent = parseResult.students.find(s => s.lrn === importedStudent.lrn);
        if (originalStudent) {
          const parentsCreated = await createParentRecords(
            result.schoolId!,
            importedStudent.id,
            originalStudent
          );
          result.parentsCreated += parentsCreated;
        }
      }
      // Also update parents for updated students
      for (const updatedStudent of updated) {
        const originalStudent = parseResult.students.find(s => s.lrn === updatedStudent.lrn);
        if (originalStudent) {
          const parentsCreated = await createParentRecords(
            result.schoolId!,
            updatedStudent.id,
            originalStudent
          );
          result.parentsCreated += parentsCreated;
        }
      }
    }

    // Success!
    result.success = result.studentsImported > 0 || result.studentsUpdated > 0 || result.schoolCreated || result.sectionCreated;

    // Add warnings
    if (result.studentsSkipped > 0) {
      result.warnings.push(`${result.studentsSkipped} student(s) skipped due to duplicate LRNs`);
    }
    if (result.studentsFailed > 0) {
      result.warnings.push(`${result.studentsFailed} student(s) failed due to validation errors`);
    }

    console.log('[SF1Import] Import complete:', {
      imported: result.studentsImported,
      updated: result.studentsUpdated,
      skipped: result.studentsSkipped,
      failed: result.studentsFailed,
      schoolCreated: result.schoolCreated,
      sectionCreated: result.sectionCreated
    });

  } catch (error: any) {
    console.error('[SF1Import] Fatal error:', error);
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
export async function previewSF1Import(parseResult: SF1ParseResult): Promise<{
  schoolStatus: 'exists' | 'will_create' | 'error';
  schoolData: SchoolLookupResult['schoolData'];
  sectionStatus: 'exists' | 'will_create' | 'unknown';
  sectionData: SectionLookupResult['sectionData'];
  studentsToImport: number;
  duplicateLRNs: DuplicateLRNCheck['duplicates'];
  invalidStudents: SF1Student[];
}> {
  const metadata = parseResult.metadata;
  
  if (!metadata) {
    return {
      schoolStatus: 'error',
      schoolData: null,
      sectionStatus: 'unknown',
      sectionData: null,
      studentsToImport: 0,
      duplicateLRNs: [],
      invalidStudents: []
    };
  }

  // Check school
  const schoolLookup = await lookupSchoolByDepEdId(metadata.schoolId);
  
  // Check section (only if school exists)
  let sectionLookup: SectionLookupResult = {
    exists: false,
    sectionId: null,
    sectionData: null
  };
  
  if (schoolLookup.exists && schoolLookup.schoolId) {
    sectionLookup = await lookupSection(
      schoolLookup.schoolId,
      metadata.gradeLevel,
      metadata.sectionName,
      metadata.schoolYear
    );
  }

  // Check for duplicate LRNs
  const validStudents = parseResult.students.filter(s => s.isValid);
  const { duplicates, existingLRNs } = await checkDuplicateLRNs(validStudents.map(s => s.lrn));

  // Count students to import
  const studentsToImport = validStudents.filter(s => !existingLRNs.has(s.lrn)).length;

  // Get invalid students
  const invalidStudents = parseResult.students.filter(s => !s.isValid);

  return {
    schoolStatus: schoolLookup.exists ? 'exists' : 'will_create',
    schoolData: schoolLookup.schoolData,
    sectionStatus: sectionLookup.exists ? 'exists' : 'will_create',
    sectionData: sectionLookup.sectionData,
    studentsToImport,
    duplicateLRNs: duplicates,
    invalidStudents
  };
}
