/**
 * Form 138 PDF Generator V2 - Uses Official PrintableReport Format
 * 
 * This generator uses the same PrintableReport component that admin/teachers use
 * to ensure consistent DepEd-compliant formatting across the system.
 * 
 * NOTE: This requires rendering the PrintableReport component in the DOM
 * and using html2canvas to convert it to PDF (same approach as teacher view).
 */

import type { Student } from '../../types';
import type { SchoolDataHook } from '../../hooks/useSchoolData';

/**
 * Generate Form 138 PDF using the official PrintableReport component
 * This is a wrapper that will be called from the React component
 */
export async function generateForm138PDFFromComponent(
  student: Student,
  schoolData: SchoolDataHook
): Promise<void> {
  try {
    // Dynamically import heavy dependencies only when needed
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');
    
    // Find the rendered PrintableReport pages
    const page1 = document.getElementById(`page-1-${student.id}`) as HTMLElement | null;
    const page2 = document.getElementById(`page-2-${student.id}`) as HTMLElement | null;
    
    console.log('PDF Generation Debug:', {
      studentId: student.id,
      page1Found: !!page1,
      page2Found: !!page2,
      page1Dimensions: page1 ? { width: page1.offsetWidth, height: page1.offsetHeight } : null,
      page2Dimensions: page2 ? { width: page2.offsetWidth, height: page2.offsetHeight } : null,
    });
    
    if (!page1 || !page2) {
      throw new Error('Could not find rendered Form 138 pages. Make sure PrintableReport component is mounted.');
    }
    
    if (page1.offsetWidth === 0 || page1.offsetHeight === 0) {
      throw new Error('Page 1 has zero dimensions. Component may not be rendering properly.');
    }
    
    if (page2.offsetWidth === 0 || page2.offsetHeight === 0) {
      throw new Error('Page 2 has zero dimensions. Component may not be rendering properly.');
    }
    
    // Add PDF export class to body for print styles
    document.body.classList.add('pdf-export');
    
    try {
      // Canvas options for high-quality rendering
      const canvasOptions = {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        scrollY: 0,
      } as const;
      
      // Capture both pages as canvases
      const [canvas1, canvas2] = await Promise.all([
        html2canvas(page1, canvasOptions),
        html2canvas(page2, canvasOptions),
      ]);
      
      // Convert canvases to images
      const img1 = canvas1.toDataURL('image/jpeg', 0.98);
      const img2 = canvas2.toDataURL('image/jpeg', 0.98);
      
      // Create PDF in landscape Letter format (11" x 8.5")
      const pdf = new jsPDF({ 
        unit: 'in', 
        format: 'letter', 
        orientation: 'landscape' 
      });
      
      // Add first page
      pdf.addImage(img1, 'JPEG', 0, 0, 11, 8.5);
      
      // Add second page
      pdf.addPage('letter', 'landscape');
      pdf.addImage(img2, 'JPEG', 0, 0, 11, 8.5);
      
      // Generate filename
      const slug = (s: string) => 
        s.toLowerCase()
         .replace(/[^a-z0-9]+/g, '-')
         .replace(/^-+|-+$/g, '')
         .substring(0, 80);
      
      const filename = `Form138_${slug(student.name)}_${slug(String(schoolData.settings.schoolYear))}.pdf`;
      
      // Save PDF
      pdf.save(filename);
      
    } finally {
      // Always remove PDF export class
      document.body.classList.remove('pdf-export');
    }
    
  } catch (error) {
    console.error('Form 138 PDF generation error:', error);
    throw new Error('Failed to generate Form 138 PDF. Please try again.');
  }
}

/**
 * Preview Form 138 data before generating PDF
 * Returns a summary of what will be in the report
 */
export function previewForm138Data(
  student: Student,
  schoolData: SchoolDataHook
): {
  studentInfo: {
    name: string;
    lrn: string;
    gradeLevel: string | number;
    section: string;
  };
  gradesCount: number;
  attendanceData: {
    present: number;
    absent: number;
    total: number;
    percentage: number;
  };
  coreValuesCount: number;
  average: string;
} {
  const { grades, sections, attendanceRecords, learningAreas } = schoolData;
  
  // Find student's section
  const section = sections?.find(s => s.id === student.sectionId);
  
  // Get student's grades
  const studentGrades = (grades || []).filter(g => g.studentId === student.id);
  
  // Filter learning areas by student's grade level and only show subjects where student has grades
  const gradeLevel = section?.gradeLevel;
  const studentGradeIds = new Set(studentGrades.map(g => g.learningAreaId));
  
  const relevantLearningAreas = (learningAreas || []).filter(la => {
    // Must have a grade for this subject
    if (!studentGradeIds.has(la.id)) return false;
    
    // If grade level is set, filter by it
    if (gradeLevel) {
      if (Array.isArray(la.gradeLevel)) {
        return la.gradeLevel.includes(gradeLevel as number);
      }
      return la.gradeLevel === gradeLevel;
    }
    
    return true;
  });
  
  // Calculate average from grades that have final grades
  const finalGrades = studentGrades
    .map(g => g.finalGrade)
    .filter((g): g is number => typeof g === 'number' && g > 0);
  
  const average = finalGrades.length > 0
    ? (finalGrades.reduce((sum: number, g: number) => sum + g, 0) / finalGrades.length).toFixed(2)
    : 'N/A';
  
  // Get attendance data - handle new individual record structure
  const studentAttendanceRecords = (attendanceRecords || []).filter(r => r.studentId === student.id);
  let attendanceData = { present: 0, absent: 0, total: 0, percentage: 0 };
  
  if (studentAttendanceRecords.length > 0) {
    const present = studentAttendanceRecords.filter((r: any) => r.status === 'present' || r.status === 'late').length;
    const absent = studentAttendanceRecords.filter((r: any) => r.status === 'absent').length;
    const total = present + absent;
    const percentage = total > 0 ? (present / total) * 100 : 0;
    
    attendanceData = { present, absent, total, percentage };
  }
  
  return {
    studentInfo: {
      name: student.name,
      lrn: student.lrn || 'N/A',
      gradeLevel: section?.gradeLevel || 'N/A',
      section: section?.name || 'N/A',
    },
    gradesCount: relevantLearningAreas.length, // Only count subjects for student's grade level with actual grades
    attendanceData,
    coreValuesCount: schoolData.coreValues?.length || 0,
    average,
  };
}
