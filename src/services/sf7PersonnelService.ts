/**
 * SF7 - School Personnel Assignment List and Basic Profile Service
 * Official DepEd Form
 * 
 * Manages personnel profiles, teaching assignments, and ancillary responsibilities
 */

import { supabase } from '../lib/supabase';
import type {
  SF7PersonnelRecord,
  SF7Summary,
  SF7Filter,
  TeachingAssignment,
  AncillaryResponsibility,
  CreateTeachingAssignmentInput,
  CreateAncillaryResponsibilityInput,
  PositionType,
  EmploymentStatus,
} from '../types/sf7Personnel';

/**
 * Get all personnel with their assignments
 */
export async function getSF7Personnel(filter: SF7Filter): Promise<SF7PersonnelRecord[]> {
  try {
    let query = supabase
      .from('teachers')
      .select(`
        *,
        teaching_assignments:teaching_assignments(*),
        ancillary_responsibilities:ancillary_responsibilities(*)
      `)
      .eq('school_id', filter.school_id)
      .is('deleted_at', null); // Exclude soft-deleted teachers

    // Apply filters
    if (filter.position) {
      query = query.eq('position', filter.position);
    }

    if (filter.employment_status) {
      query = query.eq('employment_status', filter.employment_status);
    }

    if (filter.search) {
      const searchTerm = `%${filter.search.toLowerCase()}%`;
      query = query.or(
        `name.ilike.${searchTerm},` +
        `first_name.ilike.${searchTerm},` +
        `last_name.ilike.${searchTerm},` +
        `employee_number.ilike.${searchTerm}`
      );
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) {
      console.error('Error fetching SF7 personnel:', error);
      throw error;
    }

    if (!data) return [];

    // Process personnel records
    const personnel: SF7PersonnelRecord[] = data.map(teacher => {
      // Filter assignments by school year
      const teachingAssignments = (teacher.teaching_assignments || [])
        .filter((a: TeachingAssignment) => a.school_year === filter.school_year);

      const ancillaryResponsibilities = (teacher.ancillary_responsibilities || [])
        .filter((r: AncillaryResponsibility) => r.school_year === filter.school_year);

      // Filter by grade level if specified
      const filteredAssignments = filter.grade_level
        ? teachingAssignments.filter((a: TeachingAssignment) => a.grade_level === filter.grade_level)
        : teachingAssignments;

      // Calculate total teaching hours
      const totalTeachingHours = filteredAssignments.reduce(
        (sum: number, a: TeachingAssignment) => sum + (a.hours_per_week || 0),
        0
      );

      // Find advisory section
      const advisoryAssignment = teachingAssignments.find((a: TeachingAssignment) => a.is_advisory);
      const advisorySection = advisoryAssignment
        ? `Grade ${advisoryAssignment.grade_level} - ${advisoryAssignment.section_name || 'Unknown'}`
        : undefined;

      return {
        id: teacher.id,
        employee_number: teacher.employee_number,
        first_name: teacher.first_name || '',
        middle_name: teacher.middle_name || '',
        last_name: teacher.last_name || teacher.name, // Fallback to name if last_name not set
        email: teacher.email,
        phone: teacher.phone,
        position: teacher.position as PositionType,
        employment_status: teacher.employment_status as EmploymentStatus,
        date_hired: teacher.date_hired,
        highest_education: teacher.highest_education,
        major_specialization: teacher.major_specialization,
        prc_license_number: teacher.prc_license_number,
        prc_license_expiry: teacher.prc_license_expiry,
        teaching_assignments: filteredAssignments,
        ancillary_responsibilities: ancillaryResponsibilities,
        total_teaching_hours: totalTeachingHours,
        advisory_section: advisorySection,
      };
    });

    return personnel;
  } catch (error) {
    console.error('Error in getSF7Personnel:', error);
    throw error;
  }
}

/**
 * Get SF7 summary statistics
 */
export async function getSF7Summary(filter: SF7Filter): Promise<SF7Summary> {
  try {
    const personnel = await getSF7Personnel(filter);

    // Initialize position counts
    const byPosition: Record<PositionType, number> = {
      teacher_i: 0,
      teacher_ii: 0,
      teacher_iii: 0,
      master_teacher_i: 0,
      master_teacher_ii: 0,
      principal_i: 0,
      principal_ii: 0,
      principal_iii: 0,
      principal_iv: 0,
      head_teacher_i: 0,
      head_teacher_ii: 0,
      head_teacher_iii: 0,
      other: 0,
    };

    // Initialize employment status counts
    const byEmploymentStatus: Record<EmploymentStatus, number> = {
      permanent: 0,
      temporary: 0,
      substitute: 0,
      contract: 0,
      volunteer: 0,
    };

    let totalTeachingHours = 0;
    let withMasters = 0;
    let withDoctorate = 0;
    let withPrcLicense = 0;

    // Process each personnel
    personnel.forEach(person => {
      // Count by position
      if (person.position in byPosition) {
        byPosition[person.position]++;
      }

      // Count by employment status
      if (person.employment_status in byEmploymentStatus) {
        byEmploymentStatus[person.employment_status]++;
      }

      // Sum teaching hours
      totalTeachingHours += person.total_teaching_hours;

      // Count qualifications
      if (person.highest_education?.toLowerCase().includes("master")) {
        withMasters++;
      }
      if (person.highest_education?.toLowerCase().includes("doctor")) {
        withDoctorate++;
      }
      if (person.prc_license_number) {
        withPrcLicense++;
      }
    });

    // Calculate average teaching load
    const teachersWithLoad = personnel.filter(p => p.total_teaching_hours > 0).length;
    const averageTeachingLoad = teachersWithLoad > 0
      ? totalTeachingHours / teachersWithLoad
      : 0;

    return {
      school_id: filter.school_id,
      school_year: filter.school_year,
      total_personnel: personnel.length,
      by_position: byPosition,
      by_employment_status: byEmploymentStatus,
      total_teaching_hours: totalTeachingHours,
      average_teaching_load: Math.round(averageTeachingLoad * 10) / 10,
      with_masters: withMasters,
      with_doctorate: withDoctorate,
      with_prc_license: withPrcLicense,
    };
  } catch (error) {
    console.error('Error in getSF7Summary:', error);
    throw error;
  }
}

/**
 * Create a teaching assignment
 */
export async function createTeachingAssignment(
  input: CreateTeachingAssignmentInput
): Promise<TeachingAssignment> {
  try {
    // If this is an advisory assignment, remove advisory from other assignments
    if (input.is_advisory) {
      const { error: updateError } = await supabase
        .from('teaching_assignments')
        .update({ is_advisory: false })
        .eq('teacher_id', input.teacher_id)
        .eq('school_year', input.school_year)
        .eq('grade_level', input.grade_level);

      if (updateError) {
        console.error('Error updating advisory assignments:', updateError);
      }
    }

    const { data, error } = await supabase
      .from('teaching_assignments')
      .insert([input])
      .select()
      .single();

    if (error) {
      console.error('Error creating teaching assignment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createTeachingAssignment:', error);
    throw error;
  }
}

/**
 * Update a teaching assignment
 */
export async function updateTeachingAssignment(
  id: string,
  updates: Partial<TeachingAssignment>
): Promise<TeachingAssignment> {
  try {
    const { data, error } = await supabase
      .from('teaching_assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating teaching assignment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateTeachingAssignment:', error);
    throw error;
  }
}

/**
 * Delete a teaching assignment
 */
export async function deleteTeachingAssignment(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('teaching_assignments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting teaching assignment:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteTeachingAssignment:', error);
    throw error;
  }
}

/**
 * Create an ancillary responsibility
 */
export async function createAncillaryResponsibility(
  input: CreateAncillaryResponsibilityInput
): Promise<AncillaryResponsibility> {
  try {
    const { data, error } = await supabase
      .from('ancillary_responsibilities')
      .insert([input])
      .select()
      .single();

    if (error) {
      console.error('Error creating ancillary responsibility:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createAncillaryResponsibility:', error);
    throw error;
  }
}

/**
 * Update an ancillary responsibility
 */
export async function updateAncillaryResponsibility(
  id: string,
  updates: Partial<AncillaryResponsibility>
): Promise<AncillaryResponsibility> {
  try {
    const { data, error } = await supabase
      .from('ancillary_responsibilities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating ancillary responsibility:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateAncillaryResponsibility:', error);
    throw error;
  }
}

/**
 * Delete an ancillary responsibility
 */
export async function deleteAncillaryResponsibility(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('ancillary_responsibilities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting ancillary responsibility:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteAncillaryResponsibility:', error);
    throw error;
  }
}

/**
 * Get personnel by ID with full details
 */
export async function getSF7PersonnelById(
  teacherId: string,
  schoolYear: string
): Promise<SF7PersonnelRecord | null> {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select(`
        *,
        teaching_assignments:teaching_assignments(*),
        ancillary_responsibilities:ancillary_responsibilities(*)
      `)
      .eq('id', teacherId)
      .single();

    if (error) {
      console.error('Error fetching personnel by ID:', error);
      throw error;
    }

    if (!data) return null;

    // Filter by school year
    const teachingAssignments = (data.teaching_assignments || [])
      .filter((a: TeachingAssignment) => a.school_year === schoolYear);

    const ancillaryResponsibilities = (data.ancillary_responsibilities || [])
      .filter((r: AncillaryResponsibility) => r.school_year === schoolYear);

    const totalTeachingHours = teachingAssignments.reduce(
      (sum: number, a: TeachingAssignment) => sum + (a.hours_per_week || 0),
      0
    );

    const advisoryAssignment = teachingAssignments.find((a: TeachingAssignment) => a.is_advisory);
    const advisorySection = advisoryAssignment
      ? `Grade ${advisoryAssignment.grade_level} - ${advisoryAssignment.section_name || 'Unknown'}`
      : undefined;

    return {
      id: data.id,
      employee_number: data.employee_number,
      first_name: data.first_name || '',
      middle_name: data.middle_name || '',
      last_name: data.last_name || data.name, // Fallback to name
      email: data.email,
      phone: data.phone,
      position: data.position as PositionType,
      employment_status: data.employment_status as EmploymentStatus,
      date_hired: data.date_hired,
      highest_education: data.highest_education,
      major_specialization: data.major_specialization,
      prc_license_number: data.prc_license_number,
      prc_license_expiry: data.prc_license_expiry,
      teaching_assignments: teachingAssignments,
      ancillary_responsibilities: ancillaryResponsibilities,
      total_teaching_hours: totalTeachingHours,
      advisory_section: advisorySection,
    };
  } catch (error) {
    console.error('Error in getSF7PersonnelById:', error);
    throw error;
  }
}
