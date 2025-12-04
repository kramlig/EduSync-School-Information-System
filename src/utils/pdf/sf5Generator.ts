/**
 * SF5 PDF Generator - Promotion & Proficiency Report (Elementary & JHS)
 * Generates official DepEd Form SF5 matching the exact format with pagination
 */

import jsPDF from 'jspdf';
import type { PromotionRecordWithStudent } from '../../types/promotionRecords';
// Import DepEd logo and seal (swapped because files are named incorrectly)
import depedSealUrl from '../../assets/deped-logo.png';
import depedLogoUrl from '../../assets/deped-seal.png';

interface SF5PDFOptions {
  schoolInfo: {
    name: string;
    schoolId: string;
    division: string;
    region: string;
    district: string;
  };
  schoolYear: string;
  gradingPeriod: string;
  gradeLevel?: number;
  section?: { name: string; grade_level: number };
  records: PromotionRecordWithStudent[];
  preparedBy: string;
}

export async function generateSF5PDF(options: SF5PDFOptions): Promise<void> {
  const { schoolInfo, schoolYear, gradeLevel, section, records } = options;

  // Separate students by gender for totals
  const maleStudents = records.filter(r => r.student.gender === 'Male');
  const femaleStudents = records.filter(r => r.student.gender === 'Female');
  
  // Calculate pagination (similar to SF2)
  const studentsPerPage = 20; // Conservative for landscape legal size with header
  const studentPageCount = Math.ceil(records.length / studentsPerPage);
  const totalPages = studentPageCount + 1; // +1 for summary page
  
  // Split students into chunks for pagination
  const studentChunks: PromotionRecordWithStudent[][] = [];
  for (let i = 0; i < records.length; i += studentsPerPage) {
    studentChunks.push(records.slice(i, i + studentsPerPage));
  }
  
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'legal', // 355.6 x 215.9 mm
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftMargin = 10;
  const rightMargin = 10;
  
  // Load logos once for all pages
  let logoImages: { seal: any; logo: any } | null = null;
  try {
    logoImages = await loadLogos();
  } catch (error) {
    console.error('Failed to load logos:', error);
  }
  
  // Render each student page
  for (let pageIndex = 0; pageIndex < studentChunks.length; pageIndex++) {
    const pageNumber = pageIndex + 1;
    const chunk = studentChunks[pageIndex];
    const includeHeader = pageNumber === 1;
    const isLastStudentPage = pageNumber === studentPageCount;
    
    if (pageIndex > 0) {
      doc.addPage();
    }
    
    renderStudentPage(doc, {
      students: chunk,
      allMaleStudents: maleStudents,
      allFemaleStudents: femaleStudents,
      allRecords: records,
      pageNumber,
      totalPages,
      isLastStudentPage,
      includeHeader,
      logoImages,
      schoolInfo,
      schoolYear,
      gradeLevel,
      section,
      pageWidth,
      pageHeight,
      leftMargin,
      rightMargin
    });
  }
  
  // Add summary page (always last)
  doc.addPage();
  renderSummaryPage(doc, {
    allRecords: records,
    maleStudents,
    femaleStudents,
    schoolInfo,
    schoolYear,
    gradeLevel,
    section,
    pageWidth,
    pageHeight,
    leftMargin,
    rightMargin,
    totalPages
  });
  
  // Save
  const fileName = `SF5_${schoolYear.replace(/\//g, '-')}_Grade${gradeLevel || 'All'}_${section?.name || 'All'}.pdf`;
  doc.save(fileName);
}

// Load logos once
async function loadLogos(): Promise<{ seal: any; logo: any }> {
  const loadImageAsBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  };
  
  const removeTransparency = async (base64Data: string): Promise<{data: string, width: number, height: number}> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeout = setTimeout(() => reject(new Error('Image load timeout')), 5000);
      img.onload = () => {
        clearTimeout(timeout);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        }
        resolve({
          data: canvas.toDataURL('image/png'),
          width: img.width,
          height: img.height
        });
      };
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load image'));
      };
      img.src = base64Data;
    });
  };
  
  const logoData = await loadImageAsBase64(depedLogoUrl);
  const sealData = await loadImageAsBase64(depedSealUrl);
  
  const sealResult = await removeTransparency(sealData);
  const logoResult = await removeTransparency(logoData);
  
  return { seal: sealResult, logo: logoResult };
}

// Render a student page
function renderStudentPage(doc: jsPDF, config: {
  students: PromotionRecordWithStudent[];
  allMaleStudents: PromotionRecordWithStudent[];
  allFemaleStudents: PromotionRecordWithStudent[];
  allRecords: PromotionRecordWithStudent[];
  pageNumber: number;
  totalPages: number;
  isLastStudentPage: boolean;
  includeHeader: boolean;
  logoImages: { seal: any; logo: any } | null;
  schoolInfo: any;
  schoolYear: string;
  gradeLevel?: number;
  section?: { name: string; grade_level: number };
  pageWidth: number;
  pageHeight: number;
  leftMargin: number;
  rightMargin: number;
}): void {
  const {
    students,
    allRecords,
    pageNumber,
    totalPages,
    isLastStudentPage,
    includeHeader,
    logoImages,
    schoolInfo,
    schoolYear,
    gradeLevel,
    section,
    pageWidth,
    pageHeight,
    leftMargin,
    rightMargin
  } = config;
  
  if (includeHeader) {
    // === LOGOS ===
    if (logoImages) {
      const logoY = 3; // Position logos higher to avoid overlapping with field lines
      const sealHeight = 15;
      const sealWidth = (logoImages.seal.width / logoImages.seal.height) * sealHeight;
      const logoHeight = 15;
      const logoWidth = (logoImages.logo.width / logoImages.logo.height) * logoHeight;
      
      // Position seal on left and logo on right, aligned at same Y position
      doc.addImage(logoImages.seal.data, 'PNG', leftMargin + 5, logoY, sealWidth, sealHeight);
      doc.addImage(logoImages.logo.data, 'PNG', pageWidth - rightMargin - logoWidth - 5, logoY, logoWidth, logoHeight);
    }
    
    // === TITLE ===
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('School Form 5 (SF5) Report on Promotion and Learning Progress & Achievement', pageWidth / 2, 8, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Revised to conform with the instructions of DepEd Order 8, s. 2015', pageWidth / 2, 13, { align: 'center' });
    
    // === SCHOOL INFO FIELDS ===
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    let fieldY = 24;
    const fieldHeight = 6;
    
    // Row 1: Region, Division, District
    doc.text('Region', leftMargin, fieldY);
    doc.rect(leftMargin + 16, fieldY - 4, 60, fieldHeight);
    doc.text(schoolInfo.region, leftMargin + 18, fieldY);
    
    doc.text('Division', leftMargin + 85, fieldY);
    doc.rect(leftMargin + 105, fieldY - 4, 110, fieldHeight);
    doc.text(schoolInfo.division, leftMargin + 107, fieldY);
    
    doc.text('District', leftMargin + 225, fieldY);
    doc.rect(leftMargin + 245, fieldY - 4, 90, fieldHeight);
    doc.text(schoolInfo.district, leftMargin + 247, fieldY);
    
    // Row 2: School ID, School Year, Curriculum
    fieldY += 9;
    doc.text('School ID', leftMargin, fieldY);
    doc.rect(leftMargin + 21, fieldY - 4, 60, fieldHeight);
    doc.text(schoolInfo.schoolId, leftMargin + 23, fieldY);
    
    doc.text('School Year', leftMargin + 90, fieldY);
    doc.rect(leftMargin + 125, fieldY - 4, 90, fieldHeight);
    doc.text(schoolYear, leftMargin + 127, fieldY);
    
    doc.text('Curriculum', leftMargin + 225, fieldY);
    doc.rect(leftMargin + 265, fieldY - 4, 70, fieldHeight);
    doc.text('K-12', leftMargin + 267, fieldY);
    
    // Row 3: School Name, Grade Level, Section
    fieldY += 9;
    doc.text('School Name', leftMargin, fieldY);
    doc.rect(leftMargin + 29, fieldY - 4, 150, fieldHeight);
    doc.text(schoolInfo.name, leftMargin + 31, fieldY);
    
    doc.text('Grade Level', leftMargin + 190, fieldY);
    doc.rect(leftMargin + 228, fieldY - 4, 42, fieldHeight);
    doc.text(gradeLevel?.toString() || 'All', leftMargin + 230, fieldY);
    
    doc.text('Section', leftMargin + 280, fieldY);
    doc.rect(leftMargin + 300, fieldY - 4, 35, fieldHeight);
    doc.text(section?.name || 'All', leftMargin + 302, fieldY);
  }
  
  // === MAIN TABLE ===
  const tableY = includeHeader ? 50 : 10; // Start lower if header is included, else start at top
  const tableHeight = 145; // Fixed height like SF2
  const tableWidth = pageWidth - leftMargin - rightMargin;
  
  // Main table border
  doc.setLineWidth(0.5);
  doc.rect(leftMargin, tableY, tableWidth, tableHeight);
  
  // Column widths
  const lrnWidth = 35;
  const nameWidth = 100;
  const genAveWidth = 35;
  const actionWidth = 95;
  const remarksWidth = tableWidth - lrnWidth - nameWidth - genAveWidth - actionWidth;
  
  // Header row
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  
  let x = leftMargin;
  const headerY = tableY + 7;
  
  // LRN
  doc.text('LRN', x + lrnWidth / 2, headerY, { align: 'center' });
  x += lrnWidth;
  doc.line(x, tableY, x, tableY + tableHeight);
  
  // LEARNER'S NAME
  doc.text("LEARNER'S NAME", x + nameWidth / 2, headerY - 2, { align: 'center' });
  doc.setFontSize(6);
  doc.text('(Last Name, First Name, Middle Name)', x + nameWidth / 2, headerY + 2, { align: 'center' });
  doc.setFontSize(7);
  x += nameWidth;
  doc.line(x, tableY, x, tableY + tableHeight);
  
  // GENERAL AVERAGE
  doc.setFontSize(7);
  doc.text('GENERAL', x + genAveWidth / 2, headerY - 1, { align: 'center' });
  doc.text('AVERAGE', x + genAveWidth / 2, headerY + 2, { align: 'center' });
  doc.setFontSize(6);
  doc.text('(Whole numbers for', x + genAveWidth / 2, headerY + 5, { align: 'center' });
  doc.text('non-readers)', x + genAveWidth / 2, headerY + 8, { align: 'center' });
  doc.setFontSize(7);
  x += genAveWidth;
  doc.line(x, tableY, x, tableY + tableHeight);
  
  // ACTION TAKEN
  doc.text('ACTION TAKEN: PROMOTED,', x + actionWidth / 2, headerY - 2, { align: 'center' });
  doc.text('CONDITIONAL, or RETAINED', x + actionWidth / 2, headerY + 2, { align: 'center' });
  x += actionWidth;
  doc.line(x, tableY, x, tableY + tableHeight);
  
  // Remarks
  doc.text('Did Not Meet Expectations of the', x + remarksWidth / 2, headerY - 2, { align: 'center' });
  doc.text('ff. Learning Areas as of end of', x + remarksWidth / 2, headerY + 2, { align: 'center' });
  doc.text('Current School Year', x + remarksWidth / 2, headerY + 6, { align: 'center' });
  
  // Draw header separator
  doc.line(leftMargin, tableY + 16, pageWidth - rightMargin, tableY + 16);
  
  // === DATA ROWS ===
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  
  let dataY = tableY + 21;
  const rowHeight = 5;
  
  // Separate this page's students by gender
  const pageMaleStudents = students.filter(r => r.student.gender === 'Male');
  const pageFemaleStudents = students.filter(r => r.student.gender === 'Female');
  
  // Render male students
  pageMaleStudents.forEach((record) => {
    if (dataY > tableY + tableHeight - 15) return;
    
    x = leftMargin + 2;
    
    // LRN
    doc.text(record.student.lrn || '', x + 2, dataY);
    x += lrnWidth;
    
    // Name
    const fullName = `${record.student.last_name}, ${record.student.first_name} ${record.student.middle_name || ''}`.trim();
    doc.text(fullName.substring(0, 45), x + 2, dataY);
    x += nameWidth;
    
    // General Average
    doc.text(record.general_average?.toFixed(2) || '-', x + genAveWidth / 2, dataY, { align: 'center' });
    x += genAveWidth;
    
    // Action Taken
    const status = record.promotion_status === 'promoted' ? 'PROMOTED' :
                   record.promotion_status === 'retained' ? 'RETAINED' :
                   record.promotion_status === 'graduated' ? 'PROMOTED' : 'Pending';
    doc.text(status, x + actionWidth / 2, dataY, { align: 'center' });
    x += actionWidth;
    
    // Remarks
    doc.text(record.remarks?.substring(0, 30) || '', x + 2, dataY);
    
    dataY += rowHeight;
  });
  
  // Male total row
  if (dataY <= tableY + tableHeight - 10) {
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL MALE', leftMargin + 2, dataY);
    doc.text(pageMaleStudents.length.toString(), leftMargin + lrnWidth + nameWidth / 2, dataY, { align: 'center' });
    dataY += rowHeight + 1;
    doc.setFont('helvetica', 'normal');
  }
  
  // Render female students
  pageFemaleStudents.forEach((record) => {
    if (dataY > tableY + tableHeight - 10) return;
    
    x = leftMargin + 2;
    
    // LRN
    doc.text(record.student.lrn || '', x + 2, dataY);
    x += lrnWidth;
    
    // Name
    const fullName = `${record.student.last_name}, ${record.student.first_name} ${record.student.middle_name || ''}`.trim();
    doc.text(fullName.substring(0, 45), x + 2, dataY);
    x += nameWidth;
    
    // General Average
    doc.text(record.general_average?.toFixed(2) || '-', x + genAveWidth / 2, dataY, { align: 'center' });
    x += genAveWidth;
    
    // Action Taken
    const status = record.promotion_status === 'promoted' ? 'PROMOTED' :
                   record.promotion_status === 'retained' ? 'RETAINED' :
                   record.promotion_status === 'graduated' ? 'PROMOTED' : 'Pending';
    doc.text(status, x + actionWidth / 2, dataY, { align: 'center' });
    x += actionWidth;
    
    // Remarks
    doc.text(record.remarks?.substring(0, 30) || '', x + 2, dataY);
    
    dataY += rowHeight;
  });
  
  // Female total row
  if (dataY <= tableY + tableHeight - 10) {
    doc.setFont('helvetica', 'bold');
    doc.text('FEMALE TOTAL', leftMargin + 2, dataY);
    doc.text(pageFemaleStudents.length.toString(), leftMargin + lrnWidth + nameWidth / 2, dataY, { align: 'center' });
    dataY += rowHeight + 1;
  }
  
  // Grand total (only on last student page)
  if (isLastStudentPage && dataY <= tableY + tableHeight - 10) {
    doc.text('GRAND TOTAL', leftMargin + 2, dataY);
    doc.text(allRecords.length.toString(), leftMargin + lrnWidth + nameWidth / 2, dataY, { align: 'center' });
  }
  
  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`School Form 5 Page ${pageNumber} of ${totalPages}`, pageWidth - rightMargin - 50, pageHeight - 10);
}

// Render summary page
function renderSummaryPage(doc: jsPDF, config: {
  allRecords: PromotionRecordWithStudent[];
  maleStudents: PromotionRecordWithStudent[];
  femaleStudents: PromotionRecordWithStudent[];
  schoolInfo: any;
  schoolYear: string;
  gradeLevel?: number;
  section?: { name: string; grade_level: number };
  pageWidth: number;
  pageHeight: number;
  leftMargin: number;
  rightMargin: number;
  totalPages: number;
}): void {
  const {
    maleStudents,
    femaleStudents,
    pageWidth,
    pageHeight,
    leftMargin,
    rightMargin,
    totalPages
  } = config;
  
  // === SUMMARY TABLES ===
  const summaryY = 15;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  // Calculate promotion statistics
  const promotedMale = maleStudents.filter(r => r.promotion_status === 'promoted').length;
  const promotedFemale = femaleStudents.filter(r => r.promotion_status === 'promoted').length;
  const promotedTotal = promotedMale + promotedFemale;
  
  const retainedMale = maleStudents.filter(r => r.promotion_status === 'retained').length;
  const retainedFemale = femaleStudents.filter(r => r.promotion_status === 'retained').length;
  const retainedTotal = retainedMale + retainedFemale;
  
  // Count conditional promotions (promoted but with CONDITIONAL remark)
  const conditionalMale = maleStudents.filter(r => 
    r.promotion_status === 'promoted' && r.remarks?.includes('CONDITIONAL')
  ).length;
  const conditionalFemale = femaleStudents.filter(r => 
    r.promotion_status === 'promoted' && r.remarks?.includes('CONDITIONAL')
  ).length;
  const conditionalTotal = conditionalMale + conditionalFemale;
  
  // SUMMARY TABLE
  doc.text('SUMMARY TABLE', leftMargin, summaryY);
  
  const summaryTableY = summaryY + 3;
  const summaryTableWidth = 120;
  const summaryTableHeight = 45;
  
  // Draw table border
  doc.setLineWidth(0.5);
  doc.rect(leftMargin, summaryTableY, summaryTableWidth, summaryTableHeight);
  
  // Column widths
  const statusColWidth = 40;
  const genderColWidth = 26.67;
  
  // Header row
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  let summaryX = leftMargin;
  let currentY = summaryTableY + 6;
  
  doc.text('STATUS', summaryX + statusColWidth / 2, currentY, { align: 'center' });
  summaryX += statusColWidth;
  doc.line(summaryX, summaryTableY, summaryX, summaryTableY + summaryTableHeight);
  
  doc.text('MALE', summaryX + genderColWidth / 2, currentY, { align: 'center' });
  summaryX += genderColWidth;
  doc.line(summaryX, summaryTableY, summaryX, summaryTableY + summaryTableHeight);
  
  doc.text('FEMALE', summaryX + genderColWidth / 2, currentY, { align: 'center' });
  summaryX += genderColWidth;
  doc.line(summaryX, summaryTableY, summaryX, summaryTableY + summaryTableHeight);
  
  doc.text('TOTAL', summaryX + genderColWidth / 2, currentY, { align: 'center' });
  
  // Header separator
  currentY += 2;
  doc.line(leftMargin, summaryTableY + 8, leftMargin + summaryTableWidth, summaryTableY + 8);
  
  // Data rows
  doc.setFont('helvetica', 'normal');
  const summaryRowHeight = 12;
  
  // PROMOTED
  currentY += 6;
  doc.text('PROMOTED', leftMargin + 2, currentY);
  doc.text(promotedMale.toString(), leftMargin + statusColWidth + genderColWidth / 2, currentY, { align: 'center' });
  doc.text(promotedFemale.toString(), leftMargin + statusColWidth + genderColWidth + genderColWidth / 2, currentY, { align: 'center' });
  doc.text(promotedTotal.toString(), leftMargin + statusColWidth + genderColWidth * 2 + genderColWidth / 2, currentY, { align: 'center' });
  currentY += summaryRowHeight;
  doc.line(leftMargin, summaryTableY + 20, leftMargin + summaryTableWidth, summaryTableY + 20);
  
  // *Conditional
  doc.setFontSize(7);
  doc.text('*Conditional', leftMargin + 2, currentY);
  doc.text(conditionalMale.toString(), leftMargin + statusColWidth + genderColWidth / 2, currentY, { align: 'center' });
  doc.text(conditionalFemale.toString(), leftMargin + statusColWidth + genderColWidth + genderColWidth / 2, currentY, { align: 'center' });
  doc.text(conditionalTotal.toString(), leftMargin + statusColWidth + genderColWidth * 2 + genderColWidth / 2, currentY, { align: 'center' });
  currentY += summaryRowHeight;
  doc.line(leftMargin, summaryTableY + 32, leftMargin + summaryTableWidth, summaryTableY + 32);
  
  // RETAINED
  doc.setFontSize(8);
  doc.text('RETAINED', leftMargin + 2, currentY);
  doc.text(retainedMale.toString(), leftMargin + statusColWidth + genderColWidth / 2, currentY, { align: 'center' });
  doc.text(retainedFemale.toString(), leftMargin + statusColWidth + genderColWidth + genderColWidth / 2, currentY, { align: 'center' });
  doc.text(retainedTotal.toString(), leftMargin + statusColWidth + genderColWidth * 2 + genderColWidth / 2, currentY, { align: 'center' });
  
  // LEARNING PROGRESS TABLE
  const learningTableX = leftMargin + summaryTableWidth + 10;
  const learningTableWidth = 120;
  const learningTableHeight = 85;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text("LEARNING PROGRESS AND ACHIEVEMENT (Based on Learners' General Average)", learningTableX, summaryY, { maxWidth: learningTableWidth });
  
  const learningTableY = summaryY + 6;
  
  // Draw table border
  doc.rect(learningTableX, learningTableY, learningTableWidth, learningTableHeight);
  
  // Header
  currentY = learningTableY + 6;
  doc.text('Descriptors & Grading', learningTableX + 2, currentY);
  doc.text('Scale', learningTableX + 2, currentY + 3);
  doc.line(learningTableX + 50, learningTableY, learningTableX + 50, learningTableY + learningTableHeight);
  doc.text('MALE', learningTableX + 50 + 10, currentY + 1.5, { align: 'center' });
  doc.line(learningTableX + 73.33, learningTableY, learningTableX + 73.33, learningTableY + learningTableHeight);
  doc.text('FEMALE', learningTableX + 73.33 + 11.67, currentY + 1.5, { align: 'center' });
  doc.line(learningTableX + 96.67, learningTableY, learningTableX + 96.67, learningTableY + learningTableHeight);
  doc.text('TOTAL', learningTableX + 96.67 + 11.67, currentY + 1.5, { align: 'center' });
  
  currentY += 3;
  doc.line(learningTableX, learningTableY + 9, learningTableX + learningTableWidth, learningTableY + 9);
  
  // Calculate achievement levels based on general average
  const didNotMeetMale = maleStudents.filter(r => r.general_average && r.general_average <= 74).length;
  const didNotMeetFemale = femaleStudents.filter(r => r.general_average && r.general_average <= 74).length;
  
  const fairlyMale = maleStudents.filter(r => r.general_average && r.general_average >= 75 && r.general_average <= 79).length;
  const fairlyFemale = femaleStudents.filter(r => r.general_average && r.general_average >= 75 && r.general_average <= 79).length;
  
  const satisfactoryMale = maleStudents.filter(r => r.general_average && r.general_average >= 80 && r.general_average <= 84).length;
  const satisfactoryFemale = femaleStudents.filter(r => r.general_average && r.general_average >= 80 && r.general_average <= 84).length;
  
  const verySatisfactoryMale = maleStudents.filter(r => r.general_average && r.general_average >= 85 && r.general_average <= 89).length;
  const verySatisfactoryFemale = femaleStudents.filter(r => r.general_average && r.general_average >= 85 && r.general_average <= 89).length;
  
  const outstandingMale = maleStudents.filter(r => r.general_average && r.general_average >= 90 && r.general_average <= 100).length;
  const outstandingFemale = femaleStudents.filter(r => r.general_average && r.general_average >= 90 && r.general_average <= 100).length;
  
  // Achievement levels
  doc.setFont('helvetica', 'normal');
  const achievementRows = [
    { label: 'Did Not Meet\nExpectations\n( 74 and below)', m: didNotMeetMale, f: didNotMeetFemale },
    { label: 'Fairly Satisfactory\n(75-79)', m: fairlyMale, f: fairlyFemale },
    { label: 'Satisfactory\n(80-84)', m: satisfactoryMale, f: satisfactoryFemale },
    { label: 'Very Satisfactory\n(85-89)', m: verySatisfactoryMale, f: verySatisfactoryFemale },
    { label: 'Outstanding\n(90-100)', m: outstandingMale, f: outstandingFemale }
  ];
  
  currentY += 4;
  const achievementRowHeight = 15;
  
  achievementRows.forEach((row, index) => {
    const lines = row.label.split('\n');
    let lineY = currentY;
    lines.forEach(line => {
      doc.text(line, learningTableX + 2, lineY);
      lineY += 3;
    });
    
    const centerY = currentY + 6;
    doc.text(row.m.toString(), learningTableX + 50 + 11.67, centerY, { align: 'center' });
    doc.text(row.f.toString(), learningTableX + 73.33 + 11.67, centerY, { align: 'center' });
    doc.text((row.m + row.f).toString(), learningTableX + 96.67 + 11.67, centerY, { align: 'center' });
    
    currentY += achievementRowHeight;
    if (index < achievementRows.length - 1) {
      doc.line(learningTableX, learningTableY + 9 + (index + 1) * achievementRowHeight, learningTableX + learningTableWidth, learningTableY + 9 + (index + 1) * achievementRowHeight);
    }
  });
  
  // === SIGNATURE BLOCKS ===
  const sigY = Math.max(summaryTableY + summaryTableHeight, learningTableY + learningTableHeight) + 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  // PREPARED BY
  doc.text('PREPARED BY:', leftMargin, sigY);
  doc.line(leftMargin, sigY + 15, leftMargin + 80, sigY + 15);
  doc.setFontSize(7);
  doc.text('Class Adviser', leftMargin + 30, sigY + 18);
  doc.text('(Name and Signature)', leftMargin + 23, sigY + 21);
  
  // CERTIFIED CORRECT & SUBMITTED
  doc.setFontSize(8);
  doc.text('CERTIFIED CORRECT & SUBMITTED:', leftMargin, sigY + 30);
  doc.line(leftMargin, sigY + 45, leftMargin + 80, sigY + 45);
  doc.setFontSize(7);
  doc.text('School Head', leftMargin + 30, sigY + 48);
  doc.text('(Name and Signature)', leftMargin + 23, sigY + 51);
  
  // REVIEWED BY
  doc.setFontSize(8);
  doc.text('REVIEWED BY:', leftMargin, sigY + 60);
  doc.line(leftMargin, sigY + 75, leftMargin + 80, sigY + 75);
  doc.setFontSize(7);
  doc.text('Division Representative', leftMargin + 20, sigY + 78);
  doc.text('(Name and Signature)', leftMargin + 23, sigY + 81);
  
  // GUIDELINES (Right side)
  const guideX = learningTableX;
  let guideY = sigY;
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('GUIDELINES:', guideX, guideY);
  doc.setFont('helvetica', 'normal');
  guideY += 4;
  
  const guidelines = [
    '1. Do not Include Dropped and Transferred Out (ALS,',
    'HE/IHE or NFE) as of Date of Submission based on the',
    "Learner's Form 137.",
    '',
    '2. On the Last Row, reflect the total number of learners',
    'PROMOTED (from Grade 1-5); and for Grade 6, reflect the total',
    'number of learners PROMOTED; Did Not Meet Expectations in at',
    'least five (5) learning areas; and the Learning Progress and',
    'Achievement of the learners at the end of the Grading Period and',
    'the grading system in the 2012 Order shall be in effect for all',
    'grade levels. Details are shown in Form 137 and Form 138',
    '',
    '3. On the Next Endorsement of the Learning Areas: This refers to',
    'learning areas of the learners in the next Grading or in the next',
    'SY (learners who failed in at least five (5) learning areas at the',
    'end of the school year).',
    '',
    '4. Purpose of submitting: 1. profection as under the succeeding of',
    'the followed Division Superintendent.'
  ];
  
  guidelines.forEach(line => {
    doc.text(line, guideX, guideY, { maxWidth: learningTableWidth });
    guideY += 3;
  });
  
  // Footer page number
  doc.setFontSize(8);
  doc.text(`School Form 5 Page ${totalPages} of ${totalPages}`, pageWidth - rightMargin - 50, pageHeight - 10);
}
