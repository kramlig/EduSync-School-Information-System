/**
 * SF5 Import Service
 * 
 * Handles database operations for importing SF5 (Promotion Report) data
 * from DepEd LIS into PostgreSQL.
 * 
 * This service manages:
 * - School/Section lookup
 * - Student matching by LRN or name
 * - Bulk promotion record insertion/update
 * - Duplicate checking
 * 
 * @see docs/features/SF1_IMPORT_MODULE.md (similar architecture)
 */

import { supabase } from '../lib/supabase';
import type { SF5Metadata, SF5Student, SF5ParseResult } from './sf5Parser';
import type { PromotionStatus, GradingPeriod } from '../types/promotionRecords';

// ============================================================================
// TYPES
// ============================================================================

export interface SF5ImportOptions {
  divisionId?: string;
  schoolId?: string;
  sectionId?: string;
  schoolYear: string;
  gradingPeriod: GradingPeriod;
  createSchoolIfMissing: boolean;
  createSectionIfMissing: boolean;
  skipExistingRecords: boolean;
  updateExistingRecords: boolean;
  matchByLRN: boolean;
  matchByName: boolean;
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

export interface SectionLookupResult {
  exists: boolean;
  sectionId: string | null;
  sectionData: {
    id: string;
    name: string;
    grade_level: number;
    school_id: string;
  } | null;
}

export interface StudentMatch {
  sf5Student: SF5Student;
  dbStudentId: string | null;
  matchMethod: 'lrn' | 'name' | 'none';
  existingRecord: boolean;
}

export interface SF5ImportResult {
  success: boolean;
  schoolId: string | null;
  sectionId: string | null;
  schoolCreated: boolean;
  sectionCreated: boolean;
  recordsImported: number;
  recordsUpdated: number;
  recordsSkipped: number;
  recordsFailed: number;
  studentsNotFound: number;
  errors: string[];
  warnings: string[];
  importedRecords: Array<{ lrn: string; name: string; status: PromotionStatus }>;
  skippedRecords: Array<{ lrn: string; name: string; reason: string }>;
  failedRecords: Array<{ lrn: string; name: string; error: string }>;
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
    console.error('[SF5Import] Error looking up school:', error);
  }

  return {
    exists: !!data,
    schoolId: data?.id || null,
    schoolData: data || null
  };
}

/**
 * Check if a section exists
 */
export async function lookupSection(
  schoolId: string,
  gradeLevel: number,
  sectionName: string
): Promise<SectionLookupResult> {
  const { data, error } = await supabase
    .from('sections')
    .select('id, name, grade_level, school_id')
    .eq('school_id', schoolId)
    .eq('grade_level', gradeLevel)
    .ilike('name', sectionName)
    .is('deleted_at', null)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[SF5Import] Error looking up section:', error);
  }

  return {
    exists: !!data,
    sectionId: data?.id || null,
    sectionData: data || null
  };
}

/**
 * Match SF5 students with database students
 */
export async function matchStudents(
  schoolId: string,
  students: SF5Student[],
  options: { matchByLRN: boolean; matchByName: boolean }
): Promise<StudentMatch[]> {
  const matches: StudentMatch[] = [];
  
  // Get all students in school
  const { data: dbStudents } = await supabase
    .from('students')
    .select('id, lrn, first_name, middle_name, last_name')
    .eq('school_id', schoolId)
    .is('deleted_at', null);

  const studentsByLRN = new Map<string, { id: string; fullName: string }>();
  const studentsByName = new Map<string, { id: string; lrn: string }>();

  for (const s of dbStudents || []) {
    if (s.lrn) {
      studentsByLRN.set(s.lrn, {
        id: s.id,
        fullName: `${s.last_name}, ${s.first_name} ${s.middle_name || ''}`.trim()
      });
    }
    const normalizedName = `${s.last_name}, ${s.first_name}`.toLowerCase().replace(/\s+/g, ' ').trim();
    studentsByName.set(normalizedName, { id: s.id, lrn: s.lrn || '' });
  }

  for (const sf5Student of students) {
    let dbStudentId: string | null = null;
    let matchMethod: 'lrn' | 'name' | 'none' = 'none';

    // Try LRN match first
    if (options.matchByLRN && sf5Student.lrn) {
      const match = studentsByLRN.get(sf5Student.lrn);
      if (match) {
        dbStudentId = match.id;
        matchMethod = 'lrn';
      }
    }

    // Try name match if LRN failed
    if (!dbStudentId && options.matchByName && sf5Student.fullName) {
      const normalizedName = `${sf5Student.lastName}, ${sf5Student.firstName}`
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
      const match = studentsByName.get(normalizedName);
      if (match) {
        dbStudentId = match.id;
        matchMethod = 'name';
      }
    }

    matches.push({
      sf5Student,
      dbStudentId,
      matchMethod,
      existingRecord: false // Will be updated later
    });
  }

  return matches;
}

/**
 * Check for existing promotion records
 */
export async function checkExistingRecords(
  schoolId: string,
  studentIds: string[],
  schoolYear: string,
  gradingPeriod: GradingPeriod
): Promise<Set<string>> {
  if (studentIds.length === 0) return new Set();

  const { data } = await supabase
    .from('promotion_records')
    .select('student_id')
    .eq('school_id', schoolId)
    .eq('school_year', schoolYear)
    .eq('grading_period', gradingPeriod)
    .in('student_id', studentIds);

  return new Set((data || []).map(r => r.student_id));
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a new school from SF5 metadata
 */
export async function createSchoolFromSF5(metadata: SF5Metadata): Promise<string | null> {
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
        imported_from_sf5: true,
        import_date: new Date().toISOString(),
        import_source: 'DepEd LIS'
      }
    })
    .select('id')
    .single();

  if (error) {
    console.error('[SF5Import] Error creating school:', error);
    return null;
  }

  return data.id;
}

/**
 * Create a new section from SF5 metadata
 */
export async function createSectionFromSF5(
  schoolId: string,
  gradeLevel: number,
  sectionName: string,
  schoolYear: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('sections')
    .insert({
      school_id: schoolId,
      name: sectionName || `Section ${gradeLevel}`,
      grade_level: gradeLevel,
      school_year: schoolYear,
      max_students: 50
    })
    .select('id')
    .single();

  if (error) {
    console.error('[SF5Import] Error creating section:', error);
    return null;
  }

  return data.id;
}

// ============================================================================
// MAIN IMPORT FUNCTION
// ============================================================================

/**
 * Import promotion records from SF5 data
 */
export async function importSF5(
  parseResult: SF5ParseResult,
  options: SF5ImportOptions
): Promise<SF5ImportResult> {
  const result: SF5ImportResult = {
    success: false,
    schoolId: null,
    sectionId: null,
    schoolCreated: false,
    sectionCreated: false,
    recordsImported: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    recordsFailed: 0,
    studentsNotFound: 0,
    errors: [],
    warnings: [],
    importedRecords: [],
    skippedRecords: [],
    failedRecords: []
  };

  if (!parseResult.success || !parseResult.metadata) {
    result.errors.push('Invalid SF5 parse result');
    return result;
  }

  const metadata = parseResult.metadata;

  try {
    // Step 1: Determine school
    console.log('[SF5Import] Step 1: Determining school');
    
    if (options.schoolId) {
      result.schoolId = options.schoolId;
    } else if (metadata.schoolId) {
      const schoolLookup = await lookupSchoolByDepEdId(metadata.schoolId);

      if (!schoolLookup.exists) {
        if (!options.createSchoolIfMissing) {
          result.errors.push(`School not found: ${metadata.schoolName} (ID: ${metadata.schoolId})`);
          return result;
        }

        const newSchoolId = await createSchoolFromSF5(metadata);
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
      result.errors.push('No school ID provided and none found in SF5 file');
      return result;
    }

    // Step 2: Determine section
    console.log('[SF5Import] Step 2: Determining section');
    
    if (options.sectionId) {
      result.sectionId = options.sectionId;
    } else if (metadata.sectionName && metadata.gradeLevel >= 0) {
      const sectionLookup = await lookupSection(
        result.schoolId!,
        metadata.gradeLevel,
        metadata.sectionName
      );

      if (!sectionLookup.exists) {
        if (!options.createSectionIfMissing) {
          result.warnings.push(`Section not found: ${metadata.sectionName} - records will have no section`);
        } else {
          const newSectionId = await createSectionFromSF5(
            result.schoolId!,
            metadata.gradeLevel,
            metadata.sectionName,
            options.schoolYear
          );
          if (newSectionId) {
            result.sectionCreated = true;
            result.sectionId = newSectionId;
          }
        }
      } else {
        result.sectionId = sectionLookup.sectionId;
      }
    }

    // Step 3: Match students
    console.log('[SF5Import] Step 3: Matching students');
    
    const validStudents = parseResult.students.filter(s => s.isValid);
    const matches = await matchStudents(result.schoolId!, validStudents, {
      matchByLRN: options.matchByLRN,
      matchByName: options.matchByName
    });

    // Check for existing records
    const matchedStudentIds = matches
      .filter(m => m.dbStudentId)
      .map(m => m.dbStudentId!);
    
    const existingRecords = await checkExistingRecords(
      result.schoolId!,
      matchedStudentIds,
      options.schoolYear,
      options.gradingPeriod
    );

    // Update match info with existing record status
    for (const match of matches) {
      if (match.dbStudentId) {
        match.existingRecord = existingRecords.has(match.dbStudentId);
      }
    }

    // Step 4: Import records
    console.log('[SF5Import] Step 4: Importing records');
    
    for (const match of matches) {
      const student = match.sf5Student;

      // Student not found in database
      if (!match.dbStudentId) {
        result.studentsNotFound++;
        result.skippedRecords.push({
          lrn: student.lrn,
          name: student.fullName,
          reason: 'Student not found in database'
        });
        continue;
      }

      // Handle existing records
      if (match.existingRecord) {
        if (options.skipExistingRecords && !options.updateExistingRecords) {
          result.recordsSkipped++;
          result.skippedRecords.push({
            lrn: student.lrn,
            name: student.fullName,
            reason: 'Record already exists'
          });
          continue;
        }

        if (options.updateExistingRecords) {
          // Update existing record
          const { error } = await supabase
            .from('promotion_records')
            .update({
              general_average: student.generalAverage,
              promotion_status: student.promotionStatus,
              remarks: student.remarks || null,
              updated_at: new Date().toISOString()
            })
            .eq('school_id', result.schoolId!)
            .eq('student_id', match.dbStudentId)
            .eq('school_year', options.schoolYear)
            .eq('grading_period', options.gradingPeriod);

          if (error) {
            result.recordsFailed++;
            result.failedRecords.push({
              lrn: student.lrn,
              name: student.fullName,
              error: error.message
            });
          } else {
            result.recordsUpdated++;
            result.importedRecords.push({
              lrn: student.lrn,
              name: student.fullName,
              status: student.promotionStatus
            });
          }
          continue;
        }
      }

      // Insert new record
      const { error } = await supabase
        .from('promotion_records')
        .insert({
          school_id: result.schoolId!,
          student_id: match.dbStudentId,
          section_id: result.sectionId || null,
          school_year: options.schoolYear,
          grading_period: options.gradingPeriod,
          current_grade_level: metadata.gradeLevel,
          general_average: student.generalAverage,
          promotion_status: student.promotionStatus,
          remarks: student.remarks || null,
          // Kindergarten fields (if applicable)
          socio_emotional_dev: student.socioEmotionalDev as any || null,
          physical_motor_dev: student.physicalMotorDev as any || null,
          cognitive_dev: student.cognitiveDev as any || null,
          language_literacy_dev: student.languageLiteracyDev as any || null
        });

      if (error) {
        result.recordsFailed++;
        result.failedRecords.push({
          lrn: student.lrn,
          name: student.fullName,
          error: error.message
        });
      } else {
        result.recordsImported++;
        result.importedRecords.push({
          lrn: student.lrn,
          name: student.fullName,
          status: student.promotionStatus
        });
      }
    }

    // Success if any records were imported
    result.success = result.recordsImported > 0 || result.recordsUpdated > 0 || result.schoolCreated;

    // Add warnings
    if (result.studentsNotFound > 0) {
      result.warnings.push(`${result.studentsNotFound} student(s) not found in database`);
    }
    if (result.recordsSkipped > 0) {
      result.warnings.push(`${result.recordsSkipped} record(s) skipped (already exist)`);
    }
    if (result.recordsFailed > 0) {
      result.warnings.push(`${result.recordsFailed} record(s) failed to import`);
    }

    console.log('[SF5Import] Import complete:', {
      imported: result.recordsImported,
      updated: result.recordsUpdated,
      skipped: result.recordsSkipped,
      failed: result.recordsFailed,
      notFound: result.studentsNotFound
    });

  } catch (error: any) {
    console.error('[SF5Import] Fatal error:', error);
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
export async function previewSF5Import(
  parseResult: SF5ParseResult,
  options: Partial<SF5ImportOptions>
): Promise<{
  schoolStatus: 'exists' | 'will_create' | 'provided' | 'error';
  schoolData: SchoolLookupResult['schoolData'];
  sectionStatus: 'exists' | 'will_create' | 'not_needed' | 'error';
  sectionData: SectionLookupResult['sectionData'];
  studentsMatched: number;
  studentsNotFound: number;
  existingRecords: number;
  recordsToImport: number;
  invalidStudents: SF5Student[];
}> {
  const metadata = parseResult.metadata;
  
  if (!metadata) {
    return {
      schoolStatus: 'error',
      schoolData: null,
      sectionStatus: 'error',
      sectionData: null,
      studentsMatched: 0,
      studentsNotFound: 0,
      existingRecords: 0,
      recordsToImport: 0,
      invalidStudents: []
    };
  }

  // Check school
  let schoolStatus: 'exists' | 'will_create' | 'provided' | 'error' = 'error';
  let schoolData: SchoolLookupResult['schoolData'] = null;
  let effectiveSchoolId: string | undefined;

  if (options.schoolId) {
    schoolStatus = 'provided';
    const { data } = await supabase
      .from('schools')
      .select('id, name, school_id_number, division, region')
      .eq('id', options.schoolId)
      .single();
    schoolData = data;
    effectiveSchoolId = options.schoolId;
  } else if (metadata.schoolId) {
    const schoolLookup = await lookupSchoolByDepEdId(metadata.schoolId);
    schoolStatus = schoolLookup.exists ? 'exists' : 'will_create';
    schoolData = schoolLookup.schoolData;
    effectiveSchoolId = schoolLookup.schoolId || undefined;
  }

  // Check section
  let sectionStatus: 'exists' | 'will_create' | 'not_needed' | 'error' = 'not_needed';
  let sectionData: SectionLookupResult['sectionData'] = null;

  if (options.sectionId) {
    sectionStatus = 'exists';
    const { data } = await supabase
      .from('sections')
      .select('id, name, grade_level, school_id')
      .eq('id', options.sectionId)
      .single();
    sectionData = data;
  } else if (effectiveSchoolId && metadata.sectionName && metadata.gradeLevel >= 0) {
    const sectionLookup = await lookupSection(effectiveSchoolId, metadata.gradeLevel, metadata.sectionName);
    sectionStatus = sectionLookup.exists ? 'exists' : 'will_create';
    sectionData = sectionLookup.sectionData;
  }

  // Match students (if we have a school)
  let studentsMatched = 0;
  let studentsNotFound = 0;
  let existingRecords = 0;

  if (effectiveSchoolId) {
    const validStudents = parseResult.students.filter(s => s.isValid);
    const matches = await matchStudents(effectiveSchoolId, validStudents, {
      matchByLRN: options.matchByLRN ?? true,
      matchByName: options.matchByName ?? true
    });

    studentsMatched = matches.filter(m => m.dbStudentId).length;
    studentsNotFound = matches.filter(m => !m.dbStudentId).length;

    // Check existing records
    if (options.schoolYear && options.gradingPeriod) {
      const matchedIds = matches.filter(m => m.dbStudentId).map(m => m.dbStudentId!);
      const existing = await checkExistingRecords(
        effectiveSchoolId,
        matchedIds,
        options.schoolYear,
        options.gradingPeriod
      );
      existingRecords = existing.size;
    }
  }

  // Get invalid students
  const invalidStudents = parseResult.students.filter(s => !s.isValid);

  // Calculate records to import
  const recordsToImport = studentsMatched - (options.skipExistingRecords ? existingRecords : 0);

  return {
    schoolStatus,
    schoolData,
    sectionStatus,
    sectionData,
    studentsMatched,
    studentsNotFound,
    existingRecords,
    recordsToImport: Math.max(0, recordsToImport),
    invalidStudents
  };
}
