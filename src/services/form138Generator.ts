/**
 * Form 138 PDF Generator
 * 
 * Generates DepEd-compliant Report Card (Form 138) PDFs for students
 * Includes grades, attendance, and core values for each quarter
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Student, Grade, AttendanceRecord, CoreValueGrade, LearningArea, SchoolSettings, Section, CoreValue } from '../../types';

interface Form138Data {
  student: Student;
  section: Section | null;
  grades: Grade[];
  attendance: AttendanceRecord | null;
  coreValueGrades: CoreValueGrade[];
  coreValues: CoreValue[];
  learningAreas: LearningArea[];
  settings: SchoolSettings;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Final';
}

interface QuarterAttendance {
  present: number;
  absent: number;
  total: number;
  percentage: number;
}

/**
 * Calculate attendance for a specific quarter
 * AttendanceRecord structure: { studentId, dailyStatus: { "YYYY-MM-DD": "P" | "A" | "L" | "E" } }
 */
function calculateQuarterAttendance(
  attendanceRecord: AttendanceRecord | null,
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Final'
): QuarterAttendance {
  if (!attendanceRecord || !attendanceRecord.dailyStatus) {
    return { present: 0, absent: 0, total: 0, percentage: 0 };
  }

  const dailyStatus = attendanceRecord.dailyStatus;
  const dates = Object.keys(dailyStatus);

  // Filter by quarter months if not Final
  let filteredDates = dates;
  if (quarter !== 'Final') {
    const quarterMonths: Record<string, string[]> = {
      Q1: ['08', '09', '10'], // Aug-Oct
      Q2: ['11', '12', '01'], // Nov-Jan
      Q3: ['02', '03', '04'], // Feb-Apr
      Q4: ['05', '06', '07']  // May-Jul
    };

    const months = quarterMonths[quarter];
    filteredDates = dates.filter(date => {
      const month = date.substring(5, 7);
      return months.includes(month);
    });
  }

  const total = filteredDates.length;
  const present = filteredDates.filter(date => dailyStatus[date] === 'P').length;
  const absent = filteredDates.filter(date => dailyStatus[date] === 'A').length;

  return {
    present,
    absent,
    total,
    percentage: total > 0 ? (present / total) * 100 : 0
  };
}

/**
 * Get quarter grades for a student
 */
function getQuarterGrades(
  grades: Grade[],
  learningAreas: LearningArea[],
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Final'
): Array<{ subject: string; grade: number; remarks: string }> {
  const quarterKey = quarter === 'Final' ? 'final' : quarter.toLowerCase();
  
  return learningAreas.map(area => {
    const grade = grades.find(g => g.learningAreaId === area.id);
    const gradeValue = grade ? grade[quarterKey as keyof Grade] as number || 0 : 0;
    
    return {
      subject: area.name,
      grade: gradeValue,
      remarks: gradeValue >= 75 ? 'Passed' : gradeValue > 0 ? 'Failed' : 'N/A'
    };
  }).filter(g => g.grade > 0); // Only show subjects with grades
}

/**
 * Get core values for a quarter
 * CoreValueGrade structure: { studentId, coreValueId, q1: Record<string, marking>, q2, q3, q4 }
 */
function getCoreValues(
  coreValueGrades: CoreValueGrade[],
  coreValues: CoreValue[],
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Final'
): Array<{ value: string; rating: string }> {
  const quarterKey = quarter === 'Final' ? 'q4' : quarter.toLowerCase();
  
  return coreValueGrades.map(cvGrade => {
    const coreValue = coreValues.find(cv => cv.id === cvGrade.coreValueId);
    const quarterData = cvGrade[quarterKey as keyof CoreValueGrade];
    
    // Get the first marking from the quarter's Record<string, marking>
    let rating = 'N/A';
    if (quarterData && typeof quarterData === 'object') {
      const markings = Object.values(quarterData as Record<string, string>);
      rating = markings[0] || 'N/A';
    }
    
    return {
      value: coreValue?.name || 'Core Value',
      rating
    };
  });
}

/**
 * Generate Form 138 PDF
 */
export function generateForm138PDF(data: Form138Data): void {
  const { student, section, grades, attendance, coreValueGrades, coreValues, learningAreas, settings, quarter } = data;

  // Create PDF document (Letter size: 8.5" x 11")
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // ===== HEADER =====
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // School info
  doc.text('Republic of the Philippines', pageWidth / 2, 15, { align: 'center' });
  doc.text('Department of Education', pageWidth / 2, 20, { align: 'center' });
  doc.text(settings.region || 'Region XI', pageWidth / 2, 25, { align: 'center' });
  doc.text(settings.division || 'Division of Davao Oriental', pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.schoolName || 'ENRIQUE URENCIA ELEMENTARY SCHOOL', pageWidth / 2, 38, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.district || 'Governor Generoso North District', pageWidth / 2, 43, { align: 'center' });

  // Form title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORT CARD (FORM 138)', pageWidth / 2, 52, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`School Year: ${settings.schoolYear || '2023-2024'}`, pageWidth / 2, 57, { align: 'center' });
  doc.text(`${quarter === 'Final' ? 'FINAL GRADES' : quarter + ' REPORT'}`, pageWidth / 2, 62, { align: 'center' });

  // ===== STUDENT INFORMATION =====
  let yPos = 72;
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENT INFORMATION', margin, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  // Student details in two columns
  doc.text(`Name: ${student.name || 'N/A'}`, margin, yPos);
  doc.text(`LRN: ${student.lrn || 'N/A'}`, pageWidth / 2 + 10, yPos);
  
  yPos += 5;
  doc.text(`Grade Level: ${section?.gradeLevel || 'N/A'}`, margin, yPos);
  doc.text(`Section: ${section?.name || 'N/A'}`, pageWidth / 2 + 10, yPos);
  
  yPos += 5;
  doc.text(`Sex: ${student.sex || 'N/A'}`, margin, yPos);
  doc.text(`Date of Birth: ${student.dateOfBirth || 'N/A'}`, pageWidth / 2 + 10, yPos);

  // ===== GRADES TABLE =====
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ACADEMIC PERFORMANCE', margin, yPos);
  
  yPos += 5;
  const quarterGrades = getQuarterGrades(grades, learningAreas, quarter);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Learning Area', 'Grade', 'Remarks']],
    body: quarterGrades.map(g => [g.subject, g.grade.toString(), g.remarks]),
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: margin, right: margin }
  });

  // Calculate general average
  const totalGrade = quarterGrades.reduce((sum, g) => sum + g.grade, 0);
  const average = quarterGrades.length > 0 ? (totalGrade / quarterGrades.length).toFixed(2) : '0.00';
  
  yPos = (doc as any).lastAutoTable.finalY + 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`General Average: ${average}`, margin, yPos);

  // ===== CORE VALUES =====
  yPos += 10;
  doc.text('CORE VALUES', margin, yPos);
  
  yPos += 5;
  const coreValueRatings = getCoreValues(coreValueGrades, coreValues, quarter);
  
  if (coreValueRatings.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Core Value', 'Rating']],
      body: coreValueRatings.map(cv => [cv.value, cv.rating]),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { cellWidth: pageWidth - 2 * margin - 30 },
        1: { cellWidth: 30, halign: 'center' }
      }
    });
    yPos = (doc as any).lastAutoTable.finalY + 5;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('No core values data available', margin, yPos);
    yPos += 10;
  }

  // ===== ATTENDANCE =====
  yPos += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ATTENDANCE', margin, yPos);
  
  yPos += 5;
  const attendanceData = calculateQuarterAttendance(attendance, quarter);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Total Days', 'Present', 'Absent', 'Attendance Rate']],
    body: [[
      attendanceData.total.toString(),
      attendanceData.present.toString(),
      attendanceData.absent.toString(),
      attendanceData.percentage.toFixed(1) + '%'
    ]],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
    margin: { left: margin, right: margin }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ===== FOOTER / CERTIFICATION =====
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  yPos += 5;
  doc.text('This is to certify that this is a true and correct copy of the learner\'s grades.', margin, yPos);
  
  yPos += 15;
  const sigWidth = 60;
  const col1X = margin;
  const col2X = pageWidth - margin - sigWidth;
  
  // Adviser signature
  doc.text('_'.repeat(35), col1X, yPos);
  yPos += 5;
  doc.text('Class Adviser', col1X, yPos);
  doc.text('Date: __________', col1X, yPos + 5);
  
  // Principal signature
  doc.text('_'.repeat(35), col2X, yPos - 5);
  yPos += 5;
  doc.text('School Principal', col2X, yPos);
  doc.text('Date: __________', col2X, yPos + 5);

  // ===== FOOTER INFO =====
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} via EduSync Parent Portal`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // ===== SAVE PDF =====
  const fileName = `Form138_${student.name.replace(/\s+/g, '_')}_${quarter}_${settings.schoolYear}.pdf`;
  doc.save(fileName);
}

/**
 * Preview Form 138 data before generating PDF
 */
export function previewForm138Data(data: Form138Data): {
  studentInfo: any;
  gradesCount: number;
  attendanceData: QuarterAttendance;
  coreValuesCount: number;
  average: string;
} {
  const { student, section, grades, attendance, coreValueGrades, coreValues, learningAreas, quarter } = data;
  
  const quarterGrades = getQuarterGrades(grades, learningAreas, quarter);
  const attendanceData = calculateQuarterAttendance(attendance, quarter);
  const coreValueRatings = getCoreValues(coreValueGrades, coreValues, quarter);
  
  const totalGrade = quarterGrades.reduce((sum, g) => sum + g.grade, 0);
  const average = quarterGrades.length > 0 ? (totalGrade / quarterGrades.length).toFixed(2) : '0.00';
  
  return {
    studentInfo: {
      name: student.name,
      lrn: student.lrn,
      gradeLevel: section?.gradeLevel,
      section: section?.name
    },
    gradesCount: quarterGrades.length,
    attendanceData,
    coreValuesCount: coreValueRatings.length,
    average
  };
}
