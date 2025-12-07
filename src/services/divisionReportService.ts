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
 * Get aggregated enrollment data for a division
 */
export const getDivisionEnrollmentSummary = async (
  filter: DivisionReportFilter
): Promise<DivisionEnrollmentAggregate> => {
  const { division_id, school_ids } = filter;
  // Note: school_year not used - students table doesn't have school_year column

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

  // Get students for all schools
  // Note: Students table doesn't have school_year - we filter by enrollment_status for current students
  const studentsQuery = supabase
    .from('students')
    .select('id, school_id, grade_level, gender, enrollment_status')
    .in('school_id', schoolIdList)
    .is('deleted_at', null)
    .eq('enrollment_status', 'enrolled');

  const { data: students, error: studentsError } = await studentsQuery;

  if (studentsError) {
    console.error('[DivisionReportService] Error fetching students:', studentsError);
    throw new Error(`Failed to fetch students: ${studentsError.message}`);
  }

  // Build school lookup
  const schoolLookup = new Map(schools.map(s => [s.id, s]));

  // Aggregate data
  const aggregate: DivisionEnrollmentAggregate = {
    total_schools: schools.length,
    total_students: 0,
    total_male: 0,
    total_female: 0,
    by_grade: {},
    by_district: {},
    schools: [],
  };

  // Per-school summaries
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

  // Process students
  (students || []).forEach(student => {
    const school = schoolLookup.get(student.school_id);
    if (!school) return;

    const summary = schoolSummaries.get(student.school_id)!;
    const grade = Number(student.grade_level) || 0;
    const isMale = student.gender === 'Male';

    // Update school summary
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

    // Update aggregate
    aggregate.total_students++;
    if (isMale) aggregate.total_male++;
    else aggregate.total_female++;

    if (!aggregate.by_grade[grade]) {
      aggregate.by_grade[grade] = { male: 0, female: 0, total: 0 };
    }
    aggregate.by_grade[grade].total++;
    if (isMale) aggregate.by_grade[grade].male++;
    else aggregate.by_grade[grade].female++;

    // Update by district
    const district = school.district || 'Unassigned';
    if (!aggregate.by_district[district]) {
      aggregate.by_district[district] = { schools: 0, students: 0, male: 0, female: 0 };
    }
    aggregate.by_district[district].students++;
    if (isMale) aggregate.by_district[district].male++;
    else aggregate.by_district[district].female++;
  });

  // Count schools per district
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
 * Get aggregated personnel data for a division
 */
export const getDivisionPersonnelSummary = async (
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

  // Get teachers for all schools
  const { data: teachers, error: teachersError } = await supabase
    .from('teachers')
    .select('id, school_id, position, employment_status')
    .in('school_id', schoolIdList)
    .is('deleted_at', null);

  if (teachersError) {
    console.error('[DivisionReportService] Error fetching teachers:', teachersError);
    throw new Error(`Failed to fetch teachers: ${teachersError.message}`);
  }

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
 * Get aggregated promotion data for a division
 */
export const getDivisionPromotionSummary = async (
  filter: DivisionReportFilter
): Promise<DivisionPromotionAggregate> => {
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
    console.error('[DivisionReportService] Error fetching schools:', schoolsError);
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

  console.log('[DivisionReportService] Fetching promotion records for:', {
    schoolCount: schoolIdList.length,
    school_year,
    grading_period,
  });

  // Get promotion records for all schools
  let promotionQuery = supabase
    .from('promotion_records')
    .select('id, school_id, student_id, current_grade_level, promotion_status, school_year, grading_period')
    .in('school_id', schoolIdList);

  if (school_year) {
    promotionQuery = promotionQuery.eq('school_year', school_year);
  }

  if (grading_period) {
    promotionQuery = promotionQuery.eq('grading_period', grading_period);
  }

  const { data: records, error: recordsError } = await promotionQuery;

  console.log('[DivisionReportService] Promotion records fetched:', records?.length || 0);

  if (recordsError) {
    console.error('[DivisionReportService] Error fetching promotion records:', recordsError);
    throw new Error(`Failed to fetch promotion records: ${recordsError.message}`);
  }

  // Build school lookup
  const schoolLookup = new Map(schools.map(s => [s.id, s]));

  // Aggregate data
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

  // Per-school summaries
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

  // Process records
  (records || []).forEach(record => {
    const school = schoolLookup.get(record.school_id);
    if (!school) return;

    const summary = schoolSummaries.get(record.school_id)!;
    const grade = Number(record.current_grade_level) || 0;
    const status = record.promotion_status;

    // Update school summary
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

    // Update aggregate
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

    // Update by district
    const district = school.district || 'Unassigned';
    if (!aggregate.by_district[district]) {
      aggregate.by_district[district] = { schools: 0, students: 0, promoted: 0, promotion_rate: 0 };
    }
    aggregate.by_district[district].students++;
    if (status === 'promoted') aggregate.by_district[district].promoted++;
  });

  // Count schools per district and calculate rates
  schools.forEach(school => {
    const district = school.district || 'Unassigned';
    if (!aggregate.by_district[district]) {
      aggregate.by_district[district] = { schools: 0, students: 0, promoted: 0, promotion_rate: 0 };
    }
    aggregate.by_district[district].schools++;
  });

  // Calculate promotion rates
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

  // Calculate school-level rates
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
