/**
 * Division Report Service - Aggregated reports for division-level users
 * 
 * This service provides aggregated data across multiple schools for:
 * - SF5: Promotion and Proficiency Report
 * - SF6: Summarized Enrollment Report
 * - SF7: Personnel Assignment List
 * 
 * @see docs/features/DIVISION_LEVEL_ACCESS.md
 */

import { supabase } from '../lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface DivisionEnrollmentSummary {
  school_id: string;
  school_name: string;
  district: string | null;
  total_students: number;
  male_count: number;
  female_count: number;
  by_grade: Record<number, { male: number; female: number; total: number }>;
  by_status: Record<string, number>;
}

export interface DivisionEnrollmentAggregate {
  total_schools: number;
  total_students: number;
  total_male: number;
  total_female: number;
  by_grade: Record<number, { male: number; female: number; total: number }>;
  by_district: Record<string, { schools: number; students: number; male: number; female: number }>;
  schools: DivisionEnrollmentSummary[];
}

export interface DivisionPersonnelSummary {
  school_id: string;
  school_name: string;
  district: string | null;
  total_personnel: number;
  by_position: Record<string, number>;
  by_status: Record<string, number>;
}

export interface DivisionPersonnelAggregate {
  total_schools: number;
  total_personnel: number;
  by_position: Record<string, number>;
  by_status: Record<string, number>;
  by_district: Record<string, { schools: number; personnel: number }>;
  schools: DivisionPersonnelSummary[];
}

export interface DivisionPromotionSummary {
  school_id: string;
  school_name: string;
  district: string | null;
  total_students: number;
  promoted: number;
  retained: number;
  conditionally_promoted: number;
  promotion_rate: number;
  by_grade: Record<number, {
    total: number;
    promoted: number;
    retained: number;
    conditionally_promoted: number;
    promotion_rate: number;
  }>;
}

export interface DivisionPromotionAggregate {
  total_schools: number;
  total_students: number;
  total_promoted: number;
  total_retained: number;
  total_conditionally_promoted: number;
  overall_promotion_rate: number;
  by_grade: Record<number, {
    total: number;
    promoted: number;
    retained: number;
    conditionally_promoted: number;
    promotion_rate: number;
  }>;
  by_district: Record<string, {
    schools: number;
    students: number;
    promoted: number;
    promotion_rate: number;
  }>;
  schools: DivisionPromotionSummary[];
}

export interface DivisionReportFilter {
  division_id: string;
  school_ids?: string[];
  school_year?: string;
  grading_period?: string;
}

// =====================================================
// ENROLLMENT REPORTS (SF1/SF5K/SF6)
// =====================================================

/**
 * Get aggregated enrollment data for a division using RPC function for optimal performance
 */
export const getDivisionEnrollmentSummary = async (
  filter: DivisionReportFilter
): Promise<DivisionEnrollmentAggregate> => {
  console.log('[DivisionReportService] getDivisionEnrollmentSummary called - RPC VERSION');
  const { division_id, school_ids } = filter;

  // Use RPC function for server-side aggregation (1 API call instead of 40+)
  const { data, error } = await supabase.rpc('get_division_enrollment_summary', {
    p_division_id: division_id,
    p_school_ids: school_ids && school_ids.length > 0 ? school_ids : null,
  });

  // Check if RPC function doesn't exist (fall back to pagination)
  if (error?.code === '42883' || error?.message?.includes('function') && error?.message?.includes('does not exist')) {
    console.warn('[DivisionReportService] RPC function not deployed, falling back to pagination');
    return getDivisionEnrollmentSummaryFallback(filter);
  }

  if (error) {
    console.error('[DivisionReportService] RPC error:', error);
    throw new Error(`Failed to fetch enrollment summary: ${error.message}`);
  }

  console.log('[DivisionReportService] RPC result:', {
    total_schools: data?.total_schools,
    total_students: data?.total_students,
  });

  // Transform RPC response to match expected format
  const result: DivisionEnrollmentAggregate = {
    total_schools: data?.total_schools || 0,
    total_students: data?.total_students || 0,
    total_male: data?.total_male || 0,
    total_female: data?.total_female || 0,
    by_grade: data?.by_grade || {},
    by_district: data?.by_district || {},
    schools: (data?.schools || []).map((school: {
      school_id: string;
      school_name: string;
      district: string | null;
      total_students: number;
      male_count: number;
      female_count: number;
      by_grade: Record<string, { male: number; female: number; total: number }>;
    }) => ({
      school_id: school.school_id,
      school_name: school.school_name,
      district: school.district,
      total_students: school.total_students,
      male_count: school.male_count,
      female_count: school.female_count,
      by_grade: school.by_grade || {},
      by_status: { enrolled: school.total_students },
    })),
  };

  return result;
};

/**
 * Fallback method using pagination (for when RPC function is not deployed)
 */
const getDivisionEnrollmentSummaryFallback = async (
  filter: DivisionReportFilter
): Promise<DivisionEnrollmentAggregate> => {
  console.log('[DivisionReportService] Using fallback pagination method');
  const { division_id, school_ids } = filter;

  // Get schools in division
  let schoolsQuery = supabase
    .from('schools')
    .select('id, name, district')
    .eq('division_id', division_id)
    .is('deleted_at', null);

  if (school_ids && school_ids.length > 0) {
    schoolsQuery = schoolsQuery.in('id', school_ids);
  }

  const { data: schools, error: schoolsError } = await schoolsQuery;

  if (schoolsError) {
    console.error('[DivisionReportService] Error fetching schools:', schoolsError);
    throw new Error(`Failed to fetch schools: ${schoolsError.message}`);
  }

  if (!schools || schools.length === 0) {
    return {
      total_schools: 0,
      total_students: 0,
      total_male: 0,
      total_female: 0,
      by_grade: {},
      by_district: {},
      schools: [],
    };
  }

  const schoolIdList = schools.map(s => s.id);

  // Get students count
  const { count: totalCount } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .in('school_id', schoolIdList)
    .is('deleted_at', null)
    .eq('enrollment_status', 'enrolled');

  const PAGE_SIZE = 1000;
  let allStudents: {
    id: string;
    school_id: string;
    grade_level: number;
    gender: string;
    enrollment_status: string;
  }[] = [];
  
  const totalPages = Math.ceil((totalCount || 0) / PAGE_SIZE);
  
  for (let page = 0; page < totalPages; page++) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    
    const { data: pageStudents, error: pageError } = await supabase
      .from('students')
      .select('id, school_id, grade_level, gender, enrollment_status')
      .in('school_id', schoolIdList)
      .is('deleted_at', null)
      .eq('enrollment_status', 'enrolled')
      .order('id', { ascending: true })
      .range(from, to);

    if (pageError) {
      throw new Error(`Failed to fetch students: ${pageError.message}`);
    }

    if (pageStudents && pageStudents.length > 0) {
      allStudents = [...allStudents, ...pageStudents];
    }
  }

  const students = allStudents;
  const schoolLookup = new Map(schools.map(s => [s.id, s]));

  const aggregate: DivisionEnrollmentAggregate = {
    total_schools: schools.length,
    total_students: 0,
    total_male: 0,
    total_female: 0,
    by_grade: {},
    by_district: {},
    schools: [],
  };

  const schoolSummaries = new Map<string, DivisionEnrollmentSummary>();

  schools.forEach(school => {
    schoolSummaries.set(school.id, {
      school_id: school.id,
      school_name: school.name,
      district: school.district,
      total_students: 0,
      male_count: 0,
      female_count: 0,
      by_grade: {},
      by_status: {},
    });
  });

  (students || []).forEach(student => {
    const school = schoolLookup.get(student.school_id);
    if (!school) return;

    const summary = schoolSummaries.get(student.school_id)!;
    const grade = Number(student.grade_level) || 0;
    const isMale = student.gender === 'Male';

    summary.total_students++;
    if (isMale) summary.male_count++;
    else summary.female_count++;

    if (!summary.by_grade[grade]) {
      summary.by_grade[grade] = { male: 0, female: 0, total: 0 };
    }
    summary.by_grade[grade].total++;
    if (isMale) summary.by_grade[grade].male++;
    else summary.by_grade[grade].female++;

    summary.by_status[student.enrollment_status || 'unknown'] =
      (summary.by_status[student.enrollment_status || 'unknown'] || 0) + 1;

    aggregate.total_students++;
    if (isMale) aggregate.total_male++;
    else aggregate.total_female++;

    if (!aggregate.by_grade[grade]) {
      aggregate.by_grade[grade] = { male: 0, female: 0, total: 0 };
    }
    aggregate.by_grade[grade].total++;
    if (isMale) aggregate.by_grade[grade].male++;
    else aggregate.by_grade[grade].female++;

    const district = school.district || 'Unassigned';
    if (!aggregate.by_district[district]) {
      aggregate.by_district[district] = { schools: 0, students: 0, male: 0, female: 0 };
    }
    aggregate.by_district[district].students++;
    if (isMale) aggregate.by_district[district].male++;
    else aggregate.by_district[district].female++;
  });

  schools.forEach(school => {
    const district = school.district || 'Unassigned';
    if (!aggregate.by_district[district]) {
      aggregate.by_district[district] = { schools: 0, students: 0, male: 0, female: 0 };
    }
    aggregate.by_district[district].schools++;
  });

  aggregate.schools = Array.from(schoolSummaries.values());

  return aggregate;
};

// =====================================================
// PERSONNEL REPORTS (SF7)
// =====================================================

/**
 * Get aggregated personnel data for a division using RPC function for optimal performance
 */
export const getDivisionPersonnelSummary = async (
  filter: DivisionReportFilter
): Promise<DivisionPersonnelAggregate> => {
  console.log('[DivisionReportService] getDivisionPersonnelSummary called - RPC VERSION');
  const { division_id, school_ids } = filter;

  // Use RPC function for server-side aggregation (1 API call instead of multiple)
  const { data, error } = await supabase.rpc('get_division_personnel_summary', {
    p_division_id: division_id,
    p_school_ids: school_ids && school_ids.length > 0 ? school_ids : null,
  });

  // Check if RPC function doesn't exist (fall back to pagination)
  // Error codes: 42883 (PostgreSQL), PGRST202 (PostgREST - function not found in schema cache)
  if (error?.code === '42883' || error?.code === 'PGRST202' || 
      (error?.message?.includes('function') && (error?.message?.includes('does not exist') || error?.message?.includes('schema cache')))) {
    console.warn('[DivisionReportService] RPC function not deployed, falling back to pagination');
    return getDivisionPersonnelSummaryFallback(filter);
  }

  if (error) {
    console.error('[DivisionReportService] RPC error:', error);
    throw new Error(`Failed to fetch personnel summary: ${error.message}`);
  }

  console.log('[DivisionReportService] RPC returned personnel data:', data?.total_personnel, 'personnel');

  // Transform RPC result to expected format
  return {
    total_schools: data?.total_schools || 0,
    total_personnel: data?.total_personnel || 0,
    by_position: data?.by_position || {},
    by_status: data?.by_status || {},
    by_district: data?.by_district || {},
    schools: (data?.schools || []).map((s: {
      school_id: string;
      school_name: string;
      district: string | null;
      total_personnel: number;
      by_position: Record<string, number>;
      by_status: Record<string, number>;
    }) => ({
      school_id: s.school_id,
      school_name: s.school_name,
      district: s.district,
      total_personnel: s.total_personnel,
      by_position: s.by_position || {},
      by_status: s.by_status || {},
    })),
  };
};

/**
 * Fallback: Get aggregated personnel data using client-side pagination
 */
const getDivisionPersonnelSummaryFallback = async (
  filter: DivisionReportFilter
): Promise<DivisionPersonnelAggregate> => {
  const { division_id, school_ids } = filter;

  // Get schools in division
  let schoolsQuery = supabase
    .from('schools')
    .select('id, name, district')
    .eq('division_id', division_id)
    .is('deleted_at', null);

  if (school_ids && school_ids.length > 0) {
    schoolsQuery = schoolsQuery.in('id', school_ids);
  }

  const { data: schools, error: schoolsError } = await schoolsQuery;

  if (schoolsError) {
    console.error('[DivisionReportService] Error fetching schools:', schoolsError);
    throw new Error(`Failed to fetch schools: ${schoolsError.message}`);
  }

  if (!schools || schools.length === 0) {
    return {
      total_schools: 0,
      total_personnel: 0,
      by_position: {},
      by_status: {},
      by_district: {},
      schools: [],
    };
  }

  const schoolIdList = schools.map(s => s.id);

  // Get teachers for all schools with pagination to avoid Supabase 1000 row limit
  // First, get the count
  const { count: teacherCount } = await supabase
    .from('teachers')
    .select('id', { count: 'exact', head: true })
    .in('school_id', schoolIdList)
    .is('deleted_at', null);

  console.log('[DivisionReportService] Total teachers count:', teacherCount);

  const PAGE_SIZE = 1000;
  let allTeachers: {
    id: string;
    school_id: string;
    position: string | null;
    employment_status: string | null;
  }[] = [];

  const totalPages = Math.ceil((teacherCount || 0) / PAGE_SIZE);

  for (let page = 0; page < totalPages; page++) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data: pageTeachers, error: pageError } = await supabase
      .from('teachers')
      .select('id, school_id, position, employment_status')
      .in('school_id', schoolIdList)
      .is('deleted_at', null)
      .order('id', { ascending: true })
      .range(from, to);

    if (pageError) {
      console.error('[DivisionReportService] Error fetching teachers page', page, ':', pageError);
      throw new Error(`Failed to fetch teachers: ${pageError.message}`);
    }

    if (pageTeachers && pageTeachers.length > 0) {
      allTeachers = [...allTeachers, ...pageTeachers];
    }
  }

  const teachers = allTeachers;

  console.log('[DivisionReportService] Teachers fetched:', teachers?.length || 0);

  // Build school lookup
  const schoolLookup = new Map(schools.map(s => [s.id, s]));

  // Aggregate data
  const aggregate: DivisionPersonnelAggregate = {
    total_schools: schools.length,
    total_personnel: 0,
    by_position: {},
    by_status: {},
    by_district: {},
    schools: [],
  };

  // Per-school summaries
  const schoolSummaries = new Map<string, DivisionPersonnelSummary>();

  schools.forEach(school => {
    schoolSummaries.set(school.id, {
      school_id: school.id,
      school_name: school.name,
      district: school.district,
      total_personnel: 0,
      by_position: {},
      by_status: {},
    });
  });

  // Process teachers
  (teachers || []).forEach(teacher => {
    const school = schoolLookup.get(teacher.school_id);
    if (!school) return;

    const summary = schoolSummaries.get(teacher.school_id)!;
    const position = teacher.position || 'other';
    const status = teacher.employment_status || 'unknown';

    // Update school summary
    summary.total_personnel++;
    summary.by_position[position] = (summary.by_position[position] || 0) + 1;
    summary.by_status[status] = (summary.by_status[status] || 0) + 1;

    // Update aggregate
    aggregate.total_personnel++;
    aggregate.by_position[position] = (aggregate.by_position[position] || 0) + 1;
    aggregate.by_status[status] = (aggregate.by_status[status] || 0) + 1;

    // Update by district
    const district = school.district || 'Unassigned';
    if (!aggregate.by_district[district]) {
      aggregate.by_district[district] = { schools: 0, personnel: 0 };
    }
    aggregate.by_district[district].personnel++;
  });

  // Count schools per district
  schools.forEach(school => {
    const district = school.district || 'Unassigned';
    if (!aggregate.by_district[district]) {
      aggregate.by_district[district] = { schools: 0, personnel: 0 };
    }
    aggregate.by_district[district].schools++;
  });

  aggregate.schools = Array.from(schoolSummaries.values());

  return aggregate;
};

// =====================================================
// PROMOTION REPORTS (SF5/SF6)
// =====================================================

/**
 * Get aggregated promotion data for a division using RPC function for optimal performance
 */
export const getDivisionPromotionSummary = async (
  filter: DivisionReportFilter
): Promise<DivisionPromotionAggregate> => {
  console.log('[DivisionReportService] getDivisionPromotionSummary called - RPC VERSION');
  const { division_id, school_ids, school_year, grading_period } = filter;

  // Use RPC function for server-side aggregation (1 API call instead of 40+)
  const { data, error } = await supabase.rpc('get_division_promotion_summary', {
    p_division_id: division_id,
    p_school_year: school_year || null,
    p_grading_period: grading_period || 'final',
    p_school_ids: school_ids && school_ids.length > 0 ? school_ids : null,
  });

  // Check if RPC function doesn't exist (fall back to pagination)
  if (error?.code === '42883' || error?.message?.includes('function') && error?.message?.includes('does not exist')) {
    console.warn('[DivisionReportService] RPC function not deployed, falling back to pagination');
    return getDivisionPromotionSummaryFallback(filter);
  }

  if (error) {
    console.error('[DivisionReportService] RPC error:', error);
    throw new Error(`Failed to fetch promotion summary: ${error.message}`);
  }

  console.log('[DivisionReportService] RPC promotion result:', {
    total_schools: data?.total_schools,
    total_students: data?.total_students,
    total_promoted: data?.total_promoted,
  });

  // Transform RPC response to match expected format
  const result: DivisionPromotionAggregate = {
    total_schools: data?.total_schools || 0,
    total_students: data?.total_students || 0,
    total_promoted: data?.total_promoted || 0,
      total_retained: data?.total_retained || 0,
      total_conditionally_promoted: data?.total_conditionally_promoted || 0,
      overall_promotion_rate: data?.overall_promotion_rate || 0,
      by_grade: data?.by_grade || {},
      by_district: data?.by_district || {},
      schools: (data?.schools || []).map((school: {
        school_id: string;
        school_name: string;
        district: string | null;
        total_students: number;
        promoted: number;
        retained: number;
        conditionally_promoted: number;
        promotion_rate: number;
        by_grade: Record<string, { total: number; promoted: number; retained: number; conditionally_promoted: number; promotion_rate: number }>;
      }) => ({
        school_id: school.school_id,
        school_name: school.school_name,
        district: school.district,
        total_students: school.total_students,
        promoted: school.promoted,
        retained: school.retained,
        conditionally_promoted: school.conditionally_promoted,
        promotion_rate: school.promotion_rate,
        by_grade: school.by_grade || {},
      })),
    };

  return result;
};

/**
 * Fallback method using pagination (for when RPC function is not deployed)
 */
const getDivisionPromotionSummaryFallback = async (
  filter: DivisionReportFilter
): Promise<DivisionPromotionAggregate> => {
  console.log('[DivisionReportService] Using fallback pagination method for promotion');
  const { division_id, school_ids, school_year, grading_period } = filter;

  // Get schools in division
  let schoolsQuery = supabase
    .from('schools')
    .select('id, name, district')
    .eq('division_id', division_id)
    .is('deleted_at', null);

  if (school_ids && school_ids.length > 0) {
    schoolsQuery = schoolsQuery.in('id', school_ids);
  }

  const { data: schools, error: schoolsError } = await schoolsQuery;

  if (schoolsError) {
    throw new Error(`Failed to fetch schools: ${schoolsError.message}`);
  }

  if (!schools || schools.length === 0) {
    return {
      total_schools: 0,
      total_students: 0,
      total_promoted: 0,
      total_retained: 0,
      total_conditionally_promoted: 0,
      overall_promotion_rate: 0,
      by_grade: {},
      by_district: {},
      schools: [],
    };
  }

  const schoolIdList = schools.map(s => s.id);

  // Get count
  let countQuery = supabase
    .from('promotion_records')
    .select('id', { count: 'exact', head: true })
    .in('school_id', schoolIdList);

  if (school_year) {
    countQuery = countQuery.eq('school_year', school_year);
  }
  if (grading_period) {
    countQuery = countQuery.eq('grading_period', grading_period);
  }

  const { count: totalCount } = await countQuery;

  const PAGE_SIZE = 1000;
  let allRecords: {
    id: string;
    school_id: string;
    student_id: string;
    current_grade_level: number;
    promotion_status: string;
    school_year: string;
    grading_period: string;
  }[] = [];

  const totalPages = Math.ceil((totalCount || 0) / PAGE_SIZE);

  for (let page = 0; page < totalPages; page++) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let promotionQuery = supabase
      .from('promotion_records')
      .select('id, school_id, student_id, current_grade_level, promotion_status, school_year, grading_period')
      .in('school_id', schoolIdList)
      .order('id', { ascending: true })
      .range(from, to);

    if (school_year) {
      promotionQuery = promotionQuery.eq('school_year', school_year);
    }
    if (grading_period) {
      promotionQuery = promotionQuery.eq('grading_period', grading_period);
    }

    const { data: pageRecords, error: pageError } = await promotionQuery;

    if (pageError) {
      throw new Error(`Failed to fetch promotion records: ${pageError.message}`);
    }

    if (pageRecords && pageRecords.length > 0) {
      allRecords = [...allRecords, ...pageRecords];
    }
  }

  const records = allRecords;
  const schoolLookup = new Map(schools.map(s => [s.id, s]));

  const aggregate: DivisionPromotionAggregate = {
    total_schools: schools.length,
    total_students: 0,
    total_promoted: 0,
    total_retained: 0,
    total_conditionally_promoted: 0,
    overall_promotion_rate: 0,
    by_grade: {},
    by_district: {},
    schools: [],
  };

  const schoolSummaries = new Map<string, DivisionPromotionSummary>();

  schools.forEach(school => {
    schoolSummaries.set(school.id, {
      school_id: school.id,
      school_name: school.name,
      district: school.district,
      total_students: 0,
      promoted: 0,
      retained: 0,
      conditionally_promoted: 0,
      promotion_rate: 0,
      by_grade: {},
    });
  });

  (records || []).forEach(record => {
    const school = schoolLookup.get(record.school_id);
    if (!school) return;

    const summary = schoolSummaries.get(record.school_id)!;
    const grade = Number(record.current_grade_level) || 0;
    const status = record.promotion_status;

    summary.total_students++;
    if (status === 'promoted') summary.promoted++;
    else if (status === 'retained') summary.retained++;
    else if (status === 'conditionally_promoted') summary.conditionally_promoted++;

    if (!summary.by_grade[grade]) {
      summary.by_grade[grade] = {
        total: 0,
        promoted: 0,
        retained: 0,
        conditionally_promoted: 0,
        promotion_rate: 0,
      };
    }
    summary.by_grade[grade].total++;
    if (status === 'promoted') summary.by_grade[grade].promoted++;
    else if (status === 'retained') summary.by_grade[grade].retained++;
    else if (status === 'conditionally_promoted') summary.by_grade[grade].conditionally_promoted++;

    aggregate.total_students++;
    if (status === 'promoted') aggregate.total_promoted++;
    else if (status === 'retained') aggregate.total_retained++;
    else if (status === 'conditionally_promoted') aggregate.total_conditionally_promoted++;

    if (!aggregate.by_grade[grade]) {
      aggregate.by_grade[grade] = {
        total: 0,
        promoted: 0,
        retained: 0,
        conditionally_promoted: 0,
        promotion_rate: 0,
      };
    }
    aggregate.by_grade[grade].total++;
    if (status === 'promoted') aggregate.by_grade[grade].promoted++;
    else if (status === 'retained') aggregate.by_grade[grade].retained++;
    else if (status === 'conditionally_promoted') aggregate.by_grade[grade].conditionally_promoted++;

    const district = school.district || 'Unassigned';
    if (!aggregate.by_district[district]) {
      aggregate.by_district[district] = { schools: 0, students: 0, promoted: 0, promotion_rate: 0 };
    }
    aggregate.by_district[district].students++;
    if (status === 'promoted') aggregate.by_district[district].promoted++;
  });

  schools.forEach(school => {
    const district = school.district || 'Unassigned';
    if (!aggregate.by_district[district]) {
      aggregate.by_district[district] = { schools: 0, students: 0, promoted: 0, promotion_rate: 0 };
    }
    aggregate.by_district[district].schools++;
  });

  if (aggregate.total_students > 0) {
    aggregate.overall_promotion_rate =
      Math.round((aggregate.total_promoted / aggregate.total_students) * 10000) / 100;
  }

  Object.values(aggregate.by_grade).forEach(gradeData => {
    if (gradeData.total > 0) {
      gradeData.promotion_rate =
        Math.round((gradeData.promoted / gradeData.total) * 10000) / 100;
    }
  });

  Object.values(aggregate.by_district).forEach(districtData => {
    if (districtData.students > 0) {
      districtData.promotion_rate =
        Math.round((districtData.promoted / districtData.students) * 10000) / 100;
    }
  });

  schoolSummaries.forEach(summary => {
    if (summary.total_students > 0) {
      summary.promotion_rate =
        Math.round((summary.promoted / summary.total_students) * 10000) / 100;
    }
    Object.values(summary.by_grade).forEach(gradeData => {
      if (gradeData.total > 0) {
        gradeData.promotion_rate =
          Math.round((gradeData.promoted / gradeData.total) * 10000) / 100;
      }
    });
  });

  aggregate.schools = Array.from(schoolSummaries.values());

  return aggregate;
};

// =====================================================
// EXPORT UTILITIES
// =====================================================

/**
 * Export enrollment summary to CSV
 */
export const exportEnrollmentToCSV = (data: DivisionEnrollmentAggregate): string => {
  let csv = 'Division Enrollment Summary Report\n';
  csv += `Generated: ${new Date().toLocaleString()}\n\n`;

  csv += 'Summary\n';
  csv += `Total Schools,${data.total_schools}\n`;
  csv += `Total Students,${data.total_students}\n`;
  csv += `Male,${data.total_male}\n`;
  csv += `Female,${data.total_female}\n\n`;

  csv += 'By Grade Level\n';
  csv += 'Grade,Male,Female,Total\n';
  Object.entries(data.by_grade)
    .sort(([a], [b]) => Number(a) - Number(b))
    .forEach(([grade, counts]) => {
      csv += `Grade ${grade},${counts.male},${counts.female},${counts.total}\n`;
    });

  csv += '\nBy District\n';
  csv += 'District,Schools,Students,Male,Female\n';
  Object.entries(data.by_district)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([district, counts]) => {
      csv += `${district},${counts.schools},${counts.students},${counts.male},${counts.female}\n`;
    });

  csv += '\nBy School\n';
  csv += 'School,District,Total,Male,Female\n';
  data.schools
    .sort((a, b) => a.school_name.localeCompare(b.school_name))
    .forEach(school => {
      csv += `"${school.school_name}","${school.district || ''}",${school.total_students},${school.male_count},${school.female_count}\n`;
    });

  return csv;
};

/**
 * Export personnel summary to CSV
 */
export const exportPersonnelToCSV = (data: DivisionPersonnelAggregate): string => {
  let csv = 'Division Personnel Summary Report\n';
  csv += `Generated: ${new Date().toLocaleString()}\n\n`;

  csv += 'Summary\n';
  csv += `Total Schools,${data.total_schools}\n`;
  csv += `Total Personnel,${data.total_personnel}\n\n`;

  csv += 'By Position\n';
  csv += 'Position,Count\n';
  Object.entries(data.by_position)
    .sort(([, a], [, b]) => b - a)
    .forEach(([position, count]) => {
      csv += `${position.replace(/_/g, ' ')},${count}\n`;
    });

  csv += '\nBy Employment Status\n';
  csv += 'Status,Count\n';
  Object.entries(data.by_status)
    .sort(([, a], [, b]) => b - a)
    .forEach(([status, count]) => {
      csv += `${status},${count}\n`;
    });

  csv += '\nBy District\n';
  csv += 'District,Schools,Personnel\n';
  Object.entries(data.by_district)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([district, counts]) => {
      csv += `${district},${counts.schools},${counts.personnel}\n`;
    });

  csv += '\nBy School\n';
  csv += 'School,District,Personnel\n';
  data.schools
    .sort((a, b) => a.school_name.localeCompare(b.school_name))
    .forEach(school => {
      csv += `"${school.school_name}","${school.district || ''}",${school.total_personnel}\n`;
    });

  return csv;
};

/**
 * Export promotion summary to CSV
 */
export const exportPromotionToCSV = (data: DivisionPromotionAggregate): string => {
  let csv = 'Division Promotion Summary Report (SF5/SF6)\n';
  csv += `Generated: ${new Date().toLocaleString()}\n\n`;

  csv += 'Summary\n';
  csv += `Total Schools,${data.total_schools}\n`;
  csv += `Total Students,${data.total_students}\n`;
  csv += `Promoted,${data.total_promoted}\n`;
  csv += `Retained,${data.total_retained}\n`;
  csv += `Conditionally Promoted,${data.total_conditionally_promoted}\n`;
  csv += `Overall Promotion Rate,${data.overall_promotion_rate}%\n\n`;

  csv += 'By Grade Level\n';
  csv += 'Grade,Total,Promoted,Retained,Cond. Promoted,Rate\n';
  Object.entries(data.by_grade)
    .sort(([a], [b]) => Number(a) - Number(b))
    .forEach(([grade, counts]) => {
      csv += `Grade ${grade},${counts.total},${counts.promoted},${counts.retained},${counts.conditionally_promoted},${counts.promotion_rate}%\n`;
    });

  csv += '\nBy District\n';
  csv += 'District,Schools,Students,Promoted,Rate\n';
  Object.entries(data.by_district)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([district, counts]) => {
      csv += `${district},${counts.schools},${counts.students},${counts.promoted},${counts.promotion_rate}%\n`;
    });

  csv += '\nBy School\n';
  csv += 'School,District,Total,Promoted,Retained,Cond. Promoted,Rate\n';
  data.schools
    .sort((a, b) => a.school_name.localeCompare(b.school_name))
    .forEach(school => {
      csv += `"${school.school_name}","${school.district || ''}",${school.total_students},${school.promoted},${school.retained},${school.conditionally_promoted},${school.promotion_rate}%\n`;
    });

  return csv;
};
