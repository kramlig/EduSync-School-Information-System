/**
 * LIS Export Service
 * 
 * Generates JSON exports compatible with the EduSync LIS Helper browser extension.
 */

import { supabase } from '../lib/supabase';

export interface LISExportStudent {
  lrn: string;
  name: string;
  lastName: string;
  firstName: string;
  middleName: string;
  extensionName: string;
  gender: string;
  birthdate: string;
  gradeLevel: number;
  section: string;
  address: string;
  barangay: string;
  municipality: string;
  province: string;
  region: string;
  motherName: string;
  fatherName: string;
  guardianName: string;
  contactNumber: string;
}

export interface LISExportData {
  school: {
    name: string;
    schoolId: string;
    division: string;
    region: string;
  };
  schoolYear: string;
  students: LISExportStudent[];
  exportedAt: string;
  exportedBy: string;
  totalCount: number;
}

/**
 * Export students for LIS import
 */
export async function exportForLIS(
  schoolId: string,
  schoolYear: string,
  options?: {
    gradeLevel?: number;
    sectionId?: string;
    onlyWithLrn?: boolean;
  }
): Promise<LISExportData> {
  
  // Fetch school info
  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('name, school_id_number, division, region')
    .eq('id', schoolId)
    .single();
  
  if (schoolError) throw new Error(`Failed to fetch school: ${schoolError.message}`);
  
  // Build student query - students table has section_id and grade_level directly
  // Note: Schema uses suffix (not extension_name), date_of_birth (not birthdate)
  // Parent info is in separate parents table via parent_students junction
  let query = supabase
    .from('students')
    .select(`
      id,
      lrn,
      name,
      last_name,
      first_name,
      middle_name,
      suffix,
      gender,
      date_of_birth,
      grade_level,
      section_id,
      address,
      contact_number,
      sections (
        name
      )
    `)
    .eq('school_id', schoolId)
    .eq('enrollment_status', 'enrolled');
  
  // Apply filters
  if (options?.gradeLevel) {
    query = query.eq('grade_level', options.gradeLevel);
  }
  
  if (options?.sectionId) {
    query = query.eq('section_id', options.sectionId);
  }
  
  if (options?.onlyWithLrn) {
    query = query.not('lrn', 'is', null);
  }
  
  const { data: students, error: studentsError } = await query;
  
  if (studentsError) throw new Error(`Failed to fetch students: ${studentsError.message}`);
  
  // Transform to LIS format
  // Note: Some LIS fields (barangay, municipality, etc.) not available in current schema
  // Parent info would need separate query to parents table if needed
  const lisStudents: LISExportStudent[] = (students || []).map((s: any) => {
    const section = s.sections;
    
    return {
      lrn: s.lrn || '',
      name: s.name || `${s.last_name}, ${s.first_name} ${s.middle_name || ''}`.trim(),
      lastName: s.last_name || extractLastName(s.name),
      firstName: s.first_name || extractFirstName(s.name),
      middleName: s.middle_name || extractMiddleName(s.name),
      extensionName: s.suffix || '', // Schema uses 'suffix' for Jr., Sr., III, etc.
      gender: s.gender || '',
      birthdate: s.date_of_birth || '', // Schema uses 'date_of_birth'
      gradeLevel: s.grade_level || 0,
      section: section?.name || '',
      address: s.address || '',
      barangay: '', // Not in current schema - would need address parsing
      municipality: '', // Not in current schema
      province: '', // Not in current schema
      region: '', // Not in current schema
      motherName: '', // In parents table - would need join
      fatherName: '', // In parents table - would need join
      guardianName: '', // In parents table - would need join
      contactNumber: s.contact_number || ''
    };
  });
  
  // Sort by grade level, then section, then name
  lisStudents.sort((a, b) => {
    if (a.gradeLevel !== b.gradeLevel) return a.gradeLevel - b.gradeLevel;
    if (a.section !== b.section) return a.section.localeCompare(b.section);
    return a.name.localeCompare(b.name);
  });
  
  return {
    school: {
      name: school.name || '',
      schoolId: school.school_id_number || '',
      division: school.division || '',
      region: school.region || ''
    },
    schoolYear,
    students: lisStudents,
    exportedAt: new Date().toISOString(),
    exportedBy: 'EduSync SIS',
    totalCount: lisStudents.length
  };
}

/**
 * Download export as JSON file
 */
export function downloadLISExport(data: LISExportData, filename?: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const defaultFilename = `lis-export-${data.schoolYear}-${new Date().toISOString().split('T')[0]}.json`;
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================================
// UTILITIES
// ============================================================================

function extractLastName(fullName: string | null): string {
  if (!fullName) return '';
  const parts = fullName.split(',');
  return parts[0]?.trim() || '';
}

function extractFirstName(fullName: string | null): string {
  if (!fullName) return '';
  const parts = fullName.split(',');
  if (parts.length > 1) {
    const nameParts = parts[1].trim().split(' ');
    return nameParts[0] || '';
  }
  return '';
}

function extractMiddleName(fullName: string | null): string {
  if (!fullName) return '';
  const parts = fullName.split(',');
  if (parts.length > 1) {
    const nameParts = parts[1].trim().split(' ');
    return nameParts.slice(1).join(' ') || '';
  }
  return '';
}
