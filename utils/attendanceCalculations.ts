/**
 * Shared Attendance Calculation Utilities for SF2
 * Used by both UI components and report generation
 */

import type { Student, AttendanceRecord, Section, AttendanceStatus } from '../types';

// ==================== DAILY CALCULATIONS ====================

/**
 * Calculate attendance statistics for a specific date
 */
export const calculateDailyAttendance = (
  dateStr: string,
  students: Student[],
  attendanceRecords: AttendanceRecord[]
): {
  present: number;
  absent: number;
  late: number;
  excused: number;
  notMarked: number;
  total: number;
  rate: number;
} => {
  let present = 0, absent = 0, late = 0, excused = 0, notMarked = 0;

  students.forEach(student => {
    const record = attendanceRecords.find(r => r.studentId === student.id);
    const status = record?.dailyStatus[dateStr];

    switch (status) {
      case 'P': present++; break;
      case 'A': absent++; break;
      case 'L': late++; break;
      case 'E': excused++; break;
      default: notMarked++; break;
    }
  });

  const total = students.length;
  const marked = present + absent + late + excused;
  const rate = marked > 0 ? ((present + late + excused) / marked) * 100 : 0;

  return { present, absent, late, excused, notMarked, total, rate };
};

/**
 * Calculate gender-based daily totals
 */
export const calculateDailyAttendanceByGender = (
  dateStr: string,
  students: Student[],
  attendanceRecords: AttendanceRecord[]
): {
  male: { present: number; absent: number; late: number; total: number };
  female: { present: number; absent: number; late: number; total: number };
  combined: { present: number; absent: number; late: number; total: number };
} => {
  const maleStudents = students.filter(s => s.sex === 'Male');
  const femaleStudents = students.filter(s => s.sex === 'Female');

  const male = calculateDailyAttendance(dateStr, maleStudents, attendanceRecords);
  const female = calculateDailyAttendance(dateStr, femaleStudents, attendanceRecords);

  return {
    male: {
      present: male.present,
      absent: male.absent,
      late: male.late,
      total: male.total
    },
    female: {
      present: female.present,
      absent: female.absent,
      late: female.late,
      total: female.total
    },
    combined: {
      present: male.present + female.present,
      absent: male.absent + female.absent,
      late: male.late + female.late,
      total: male.total + female.total
    }
  };
};

// ==================== MONTHLY CALCULATIONS ====================

/**
 * Calculate monthly attendance totals for a single student
 */
export const calculateStudentMonthlyTotals = (
  studentId: string,
  yearMonth: string, // Format: "YYYY-MM"
  attendanceRecords: AttendanceRecord[]
): {
  present: number;
  absent: number;
  late: number;
  excused: number;
  totalDays: number;
  attendanceRate: number;
} => {
  const [year, month] = yearMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  const record = attendanceRecords.find(r => r.studentId === studentId);
  
  let present = 0, absent = 0, late = 0, excused = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // Skip weekends
    const dayOfWeek = new Date(year, month - 1, day).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const status = record?.dailyStatus[dateStr];

    switch (status) {
      case 'P': present++; break;
      case 'A': absent++; break;
      case 'L': late++; break;
      case 'E': excused++; break;
    }
  }

  const totalDays = present + absent + late + excused;
  const attendanceRate = totalDays > 0 ? ((present + late + excused) / totalDays) * 100 : 0;

  return { present, absent, late, excused, totalDays, attendanceRate };
};

/**
 * Calculate monthly attendance for all students
 */
export const calculateMonthlyAttendance = (
  yearMonth: string,
  students: Student[],
  attendanceRecords: AttendanceRecord[]
): {
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
  totalSchoolDays: number;
  averageDailyAttendance: number;
  attendanceRate: number;
} => {
  const [year, month] = yearMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  let totalPresent = 0, totalAbsent = 0, totalLate = 0, totalExcused = 0;
  let schoolDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeek = new Date(year, month - 1, day).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    schoolDays++;
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const dailyStats = calculateDailyAttendance(dateStr, students, attendanceRecords);

    totalPresent += dailyStats.present;
    totalAbsent += dailyStats.absent;
    totalLate += dailyStats.late;
    totalExcused += dailyStats.excused;
  }

  const totalMarked = totalPresent + totalAbsent + totalLate + totalExcused;
  const attendanceRate = totalMarked > 0 ? ((totalPresent + totalLate + totalExcused) / totalMarked) * 100 : 0;
  const averageDailyAttendance = schoolDays > 0 ? totalPresent / schoolDays : 0;

  return {
    totalPresent,
    totalAbsent,
    totalLate,
    totalExcused,
    totalSchoolDays: schoolDays,
    averageDailyAttendance,
    attendanceRate
  };
};

// ==================== ADVANCED ANALYTICS ====================

/**
 * Find students with consecutive absences
 */
export const findConsecutiveAbsences = (
  days: number,
  yearMonth: string,
  students: Student[],
  attendanceRecords: AttendanceRecord[]
): Student[] => {
  const [year, month] = yearMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  return students.filter(student => {
    const record = attendanceRecords.find(r => r.studentId === student.id);
    if (!record) return false;

    let consecutiveCount = 0;
    let maxConsecutive = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = new Date(year, month - 1, day).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const status = record.dailyStatus[dateStr];

      if (status === 'A') {
        consecutiveCount++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
      } else if (status === 'P' || status === 'L' || status === 'E') {
        consecutiveCount = 0;
      }
    }

    return maxConsecutive >= days;
  });
};

/**
 * Calculate data completeness percentage
 */
export const calculateDataCompleteness = (
  yearMonth: string,
  students: Student[],
  attendanceRecords: AttendanceRecord[]
): number => {
  const [year, month] = yearMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  let totalExpectedEntries = 0;
  let totalMarkedEntries = 0;

  console.log('[calculateDataCompleteness] Debug:', {
    yearMonth,
    studentsCount: students.length,
    attendanceRecordsCount: attendanceRecords.length,
    daysInMonth,
    sampleRecord: attendanceRecords[0],
    sampleRecordDailyStatus: attendanceRecords[0]?.dailyStatus,
    dailyStatusKeys: attendanceRecords[0] ? Object.keys(attendanceRecords[0].dailyStatus) : [],
    firstFewDates: attendanceRecords[0] ? Object.keys(attendanceRecords[0].dailyStatus).slice(0, 5) : []
  });

  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeek = new Date(year, month - 1, day).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    totalExpectedEntries += students.length;

    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    students.forEach(student => {
      const record = attendanceRecords.find(r => r.studentId === student.id);
      if (record?.dailyStatus[dateStr]) {
        totalMarkedEntries++;
      }
    });
  }
  
  // Debug: Check first student's record in detail
  if (students.length > 0 && attendanceRecords.length > 0) {
    const firstStudent = students[0];
    const firstStudentRecord = attendanceRecords.find(r => r.studentId === firstStudent.id);
    const testDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    
    console.log('[calculateDataCompleteness] Detailed check:', {
      firstStudentId: firstStudent.id,
      hasRecord: !!firstStudentRecord,
      dailyStatusKeys: firstStudentRecord ? Object.keys(firstStudentRecord.dailyStatus) : [],
      lookingForDate: testDate,
      foundInDailyStatus: firstStudentRecord?.dailyStatus[testDate],
      entireDailyStatus: firstStudentRecord?.dailyStatus
    });
  }

  const completeness = totalExpectedEntries > 0 ? (totalMarkedEntries / totalExpectedEntries) * 100 : 0;
  
  console.log('[calculateDataCompleteness] Result:', {
    totalExpectedEntries,
    totalMarkedEntries,
    completeness: completeness.toFixed(1) + '%'
  });

  return completeness;
};

// ==================== ENROLLMENT CALCULATIONS ====================

/**
 * Get enrollment count for a specific date
 */
export const getEnrollmentCount = (
  dateStr: string,
  students: Student[]
): number => {
  return students.filter(student => {
    // Check if student was enrolled on this date
    const enrollmentDate = new Date(student.enrollmentDate || '1900-01-01');
    const targetDate = new Date(dateStr);
    
    return enrollmentDate <= targetDate && student.status !== 'dropped';
  }).length;
};

/**
 * Get late enrollment count for a month (after first Friday of school year)
 */
export const getLateEnrollmentCount = (
  yearMonth: string,
  students: Student[],
  schoolYearStartDate: string = '2024-06-07' // First Friday of June
): number => {
  const [year, month] = yearMonth.split('-').map(Number);
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);
  const cutoffDate = new Date(schoolYearStartDate);

  return students.filter(student => {
    if (!student.enrollmentDate) return false;
    
    const enrollDate = new Date(student.enrollmentDate);
    return enrollDate > cutoffDate && enrollDate >= startOfMonth && enrollDate <= endOfMonth;
  }).length;
};

/**
 * Calculate percentage of enrollment
 */
export const calculatePercentageEnrollment = (
  currentEnrollment: number,
  initialEnrollment: number
): number => {
  if (initialEnrollment === 0) return 0;
  return (currentEnrollment / initialEnrollment) * 100;
};

// ==================== GRADE LEVEL BREAKDOWN ====================

/**
 * Calculate attendance by grade level
 */
export const calculateAttendanceByGradeLevel = (
  yearMonth: string,
  students: Student[],
  sections: Section[],
  attendanceRecords: AttendanceRecord[]
): Record<number, { present: number; total: number; rate: number }> => {
  const gradeMap: Record<number, { present: number; total: number; rate: number }> = {};

  students.forEach(student => {
    const section = sections.find(s => s.id === student.sectionId);
    if (!section) return;

    const gradeLevel = section.gradeLevel;
    if (!gradeMap[gradeLevel]) {
      gradeMap[gradeLevel] = { present: 0, total: 0, rate: 0 };
    }

    const monthlyTotals = calculateStudentMonthlyTotals(student.id, yearMonth, attendanceRecords);
    gradeMap[gradeLevel].present += monthlyTotals.present;
    gradeMap[gradeLevel].total += monthlyTotals.totalDays;
  });

  // Calculate rates
  Object.keys(gradeMap).forEach(grade => {
    const gradeLevel = parseInt(grade);
    const data = gradeMap[gradeLevel];
    data.rate = data.total > 0 ? (data.present / data.total) * 100 : 0;
  });

  return gradeMap;
};

// ==================== VALIDATION ====================

/**
 * Validate if report can be generated
 */
export const validateReportGeneration = (
  students: Student[],
  yearMonth: string,
  attendanceRecords: AttendanceRecord[]
): { valid: boolean; message: string } => {
  if (students.length === 0) {
    return { valid: false, message: 'No students in selected section' };
  }

  const completeness = calculateDataCompleteness(yearMonth, students, attendanceRecords);
  
  if (completeness === 0) {
    return { valid: false, message: 'No attendance data recorded for this month' };
  }

  if (completeness < 20) {
    return { 
      valid: true, 
      message: `Warning: Only ${completeness.toFixed(1)}% of attendance data is recorded. Report may be incomplete.` 
    };
  }

  return { valid: true, message: '' };
};

// ==================== WEEKDAY UTILITIES ====================

/**
 * Get all school days (weekdays) in a month
 */
export const getSchoolDaysInMonth = (yearMonth: string): string[] => {
  const [year, month] = yearMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const schoolDays: string[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeek = new Date(year, month - 1, day).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    schoolDays.push(dateStr);
  }

  return schoolDays;
};

/**
 * Get day of week abbreviation (M, T, W, TH, F)
 */
export const getDayAbbreviation = (dateStr: string): string => {
  const date = new Date(dateStr);
  const day = date.getDay();
  
  const abbrevs = ['SUN', 'M', 'T', 'W', 'TH', 'F', 'SAT'];
  return abbrevs[day];
};
