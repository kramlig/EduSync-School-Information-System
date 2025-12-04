/**
 * SF5-K PDF Generator - Kindergarten Proficiency Report
 * Generates official DepEd Form SF5-K with pagination and summary page
 * 
 * Features:
 * - Multi-page support (28 students per page)
 * - Two-column summary page with statistics
 * - Official DepEd format compliance
 */

import jsPDF from 'jspdf';
import type { PromotionRecordWithStudent } from '../../types/promotionRecords';
import depedSealUrl from '../../assets/deped-logo.png';
import depedLogoUrl from '../../assets/deped-seal.png';

interface SF5KPDFOptions {
  schoolInfo: {
    name: string;
    schoolId: string;
    division: string;
    region: string;
    district: string;
  };
  schoolYear: string;
  section?: { name: string; grade_level: number };
  records: PromotionRecordWithStudent[];
  preparedBy: string;
}

const STUDENTS_PER_PAGE = 28;
const PAGE_FORMAT = 'legal'; // 355.6 x 215.9 mm
const MARGINS = { left: 8, right: 8 };

/**
 * Generates SF5-K PDF (Kindergarten Report on Promotion and Level of Proficiency).
 * Includes pagination (28 students per page) and a dedicated summary page.
 * 
 * @param options - Configuration including school info, records, section, and school year
 */
export async function generateSF5KPDF(options: SF5KPDFOptions): Promise<void> {
  const { schoolInfo, schoolYear, section, records } = options;

  const maleStudents = records.filter(r => r.student.gender === 'Male');
  const femaleStudents = records.filter(r => r.student.gender === 'Female');
  
  const studentsPerPage = STUDENTS_PER_PAGE;
  const studentPageCount = Math.ceil(records.length / studentsPerPage);
  const totalPages = studentPageCount + 1;
  
  const studentChunks: PromotionRecordWithStudent[][] = [];
  for (let i = 0; i < records.length; i += studentsPerPage) {
    studentChunks.push(records.slice(i, i + studentsPerPage));
  }
  
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: PAGE_FORMAT,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const { left: leftMargin, right: rightMargin } = MARGINS;
  
  let logoImages: { seal: any; logo: any } | null = null;
  try {
    logoImages = await loadLogos();
  } catch (error) {
    console.warn('Logo loading failed, PDF will render without logos');
  }
  
  for (let pageIndex = 0; pageIndex < studentChunks.length; pageIndex++) {
    if (pageIndex > 0) doc.addPage();
    
    renderStudentPage(doc, {
      students: studentChunks[pageIndex],
      allRecords: records,
      maleStudents,
      femaleStudents,
      schoolInfo,
      schoolYear,
      section,
      pageNumber: pageIndex + 1,
      totalPages,
      pageWidth,
      pageHeight,
      leftMargin,
      rightMargin,
      logoImages,
      isLastStudentPage: pageIndex === studentChunks.length - 1,
    });
  }
  
  doc.addPage();
  renderSummaryPage(doc, {
    allRecords: records,
    maleStudents,
    femaleStudents,
    schoolInfo,
    schoolYear,
    section,
    pageWidth,
    pageHeight,
    leftMargin,
    rightMargin,
    totalPages,
  });
  
  doc.save(`SF5K_${schoolYear.replace(/\//g, '-')}_${section?.name || 'All'}.pdf`);
}

/**
 * Loads and processes DepEd logos (seal and school logo).
 * Removes transparency and converts to base64 for PDF embedding.
 * 
 * @returns Promise resolving to seal and logo image data
 */
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
      
      const timeout = setTimeout(() => {
        reject(new Error('Image load timeout'));
      }, 5000);
      
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

/**
 * Renders school information fields (school name, district, section, etc.)
 */
function renderSchoolInfoFields(
  doc: jsPDF,
  params: {
    schoolInfo: any;
    schoolYear: string;
    section: { name: string; grade_level: number } | undefined;
    leftMargin: number;
    rightMargin: number;
    pageWidth: number;
  }
): void {
  const { schoolInfo, schoolYear, section, leftMargin, rightMargin, pageWidth } = params;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setLineWidth(0.3);
  
  let fieldY = 30;
  const fieldHeight = 6;
  
  // Row 1: School Name, District, Division, Region
  doc.text('School Name', leftMargin, fieldY);
  const schoolNameX = leftMargin + 26;
  const schoolNameWidth = 100;
  doc.rect(schoolNameX, fieldY - 4, schoolNameWidth, fieldHeight);
  doc.text(schoolInfo.name, schoolNameX + 2, fieldY);
  
  const districtLabelX = schoolNameX + schoolNameWidth + 5;
  doc.text('District', districtLabelX, fieldY);
  const districtX = districtLabelX + 16;
  const districtWidth = 60;
  doc.rect(districtX, fieldY - 4, districtWidth, fieldHeight);
  doc.text(schoolInfo.district, districtX + 2, fieldY);
  
  const divisionLabelX = districtX + districtWidth + 5;
  doc.text('Division', divisionLabelX, fieldY);
  const divisionX = divisionLabelX + 17;
  const divisionWidth = 60;
  doc.rect(divisionX, fieldY - 4, divisionWidth, fieldHeight);
  doc.text(schoolInfo.division, divisionX + 2, fieldY);
  
  const regionLabelX = divisionX + divisionWidth + 5;
  doc.text('Region', regionLabelX, fieldY);
  const regionX = regionLabelX + 16;
  const regionWidth = pageWidth - regionX - rightMargin;
  doc.rect(regionX, fieldY - 4, regionWidth, fieldHeight);
  doc.text(schoolInfo.region, regionX + 2, fieldY);
  
  // Row 2: School ID, Section, School Year
  fieldY += 9;
  
  doc.text('School ID', leftMargin, fieldY);
  const schoolIdX = leftMargin + 21;
  const schoolIdWidth = 60;
  doc.rect(schoolIdX, fieldY - 4, schoolIdWidth, fieldHeight);
  doc.text(schoolInfo.schoolId, schoolIdX + 2, fieldY);
  
  const sectionLabelX = schoolIdX + schoolIdWidth + 5;
  doc.text('Section', sectionLabelX, fieldY);
  const sectionX = sectionLabelX + 15;
  const sectionWidth = 110;
  doc.rect(sectionX, fieldY - 4, sectionWidth, fieldHeight);
  doc.text(section?.name || 'All Sections', sectionX + 2, fieldY);
  
  const syLabelX = sectionX + sectionWidth + 5;
  doc.text('School Year', syLabelX, fieldY);
  const syX = syLabelX + 24;
  const syWidth = pageWidth - syX - rightMargin;
  doc.rect(syX, fieldY - 4, syWidth, fieldHeight);
  doc.text(schoolYear, syX + 2, fieldY);
}

/**
 * Renders a single page of student promotion records (up to 28 students).
 * Includes student table with LRN, names, summative assessment, interpretation, and appraised level.
 * Displays gender totals on the last student page.
 */
function renderStudentPage(doc: jsPDF, config: {
  students: PromotionRecordWithStudent[];
  allRecords: PromotionRecordWithStudent[];
  maleStudents: PromotionRecordWithStudent[];
  femaleStudents: PromotionRecordWithStudent[];
  schoolInfo: any;
  schoolYear: string;
  section?: { name: string; grade_level: number };
  pageNumber: number;
  totalPages: number;
  pageWidth: number;
  pageHeight: number;
  leftMargin: number;
  rightMargin: number;
  logoImages: { seal: any; logo: any } | null;
  isLastStudentPage: boolean;
}): void {
  const {
    students,
    allRecords,
    maleStudents,
    femaleStudents,
    schoolInfo,
    schoolYear,
    section,
    pageNumber,
    totalPages,
    pageWidth,
    pageHeight,
    leftMargin,
    rightMargin,
    logoImages,
    isLastStudentPage,
  } = config;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('School Form 5  Report on Promotion & Level of Proficiency For Kinder (SF5-K)', pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(10);
  doc.text('End of School Year Kindergarten Appraisal Report', pageWidth / 2, 16, { align: 'center' });
  
  if (logoImages) {
    const sealHeight = 15;
    const sealWidth = (logoImages.seal.width / logoImages.seal.height) * sealHeight;
    const logoHeight = 15;
    const logoWidth = (logoImages.logo.width / logoImages.logo.height) * logoHeight;
    
    doc.addImage(logoImages.seal.data, 'PNG', leftMargin, 3, sealWidth, sealHeight);
    doc.addImage(logoImages.logo.data, 'PNG', pageWidth - rightMargin - logoWidth, 3, logoWidth, logoHeight);
  }
  
  renderSchoolInfoFields(doc, { schoolInfo, schoolYear, section, leftMargin, rightMargin, pageWidth });
  
  const tableY = 45;
  const tableHeight = 140;
  const tableWidth = pageWidth - leftMargin - rightMargin;
  
  doc.setLineWidth(0.5);
  doc.rect(leftMargin, tableY, tableWidth, tableHeight);
  
  // Column widths (6 columns total - matching official format)
  const noWidth = 12;
  const lrnWidth = 40;
  const nameWidth = 120;
  const summativeWidth = 40;
  const interpretationWidth = 50;
  const appraisedWidth = tableWidth - noWidth - lrnWidth - nameWidth - summativeWidth - interpretationWidth;
  
  // Render table header
  renderTableHeader(doc, { leftMargin, tableY, tableHeight, tableWidth, noWidth, lrnWidth, nameWidth, summativeWidth, interpretationWidth, appraisedWidth });
  
  // === DATA ROWS ===
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  
  let dataY = tableY + 16; // Adjusted from 30 to align with new header separator at tableY + 12
  const rowHeight = 5;
  
  // Get page-specific students (maintaining gender order)
  const pageMaleStudents = students.filter(s => maleStudents.find(m => m.id === s.id));
  const pageFemaleStudents = students.filter(s => femaleStudents.find(f => f.id === s.id));
  
  let x;
  let globalIndex = allRecords.indexOf(students[0]); // Starting index in overall list
  
  // Render male students on this page
  pageMaleStudents.forEach((record) => {
    if (dataY > tableY + tableHeight - 10) return;
    
    x = leftMargin + 2;
    doc.text((globalIndex + 1).toString(), x + noWidth / 2 - 2, dataY, { align: 'center' });
    x += noWidth;
    
    doc.text(record.student.lrn || '', x + 2, dataY);
    x += lrnWidth;
    
    const fullName = `${record.student.last_name}, ${record.student.first_name} ${record.student.middle_name || ''}`.trim();
    doc.text(fullName.substring(0, 45), x + 2, dataY);
    x += nameWidth;
    
    doc.text('-', x + summativeWidth / 2, dataY, { align: 'center' });
    x += summativeWidth;
    
    const interpretation = record.socio_emotional_dev === 'advancing' ? 'Advancing' : 
                          record.socio_emotional_dev === 'emerging' ? 'Emerging' : 'Developing';
    doc.text(interpretation, x + 2, dataY);
    x += interpretationWidth;
    
    const appraised = record.promotion_status === 'promoted' ? 'Ready' : 'Needs Intervention';
    doc.text(appraised, x + 2, dataY);
    
    dataY += rowHeight;
    globalIndex++;
  });
  
  // Male total row (only on last student page)
  if (isLastStudentPage && pageMaleStudents.length > 0) {
    doc.setFont('helvetica', 'bold');
    x = leftMargin + 2;
    doc.text('MALE', x, dataY);
    // Display total count in the name column area
    doc.text(maleStudents.length.toString(), leftMargin + noWidth + lrnWidth + nameWidth / 2, dataY, { align: 'center' });
    dataY += rowHeight + 1;
    doc.setFont('helvetica', 'normal');
  }
  
  // Render female students on this page
  pageFemaleStudents.forEach((record) => {
    if (dataY > tableY + tableHeight - 10) return;
    
    x = leftMargin + 2;
    doc.text((globalIndex + 1).toString(), x + noWidth / 2 - 2, dataY, { align: 'center' });
    x += noWidth;
    
    doc.text(record.student.lrn || '', x + 2, dataY);
    x += lrnWidth;
    
    const fullName = `${record.student.last_name}, ${record.student.first_name} ${record.student.middle_name || ''}`.trim();
    doc.text(fullName.substring(0, 45), x + 2, dataY);
    x += nameWidth;
    
    doc.text('-', x + summativeWidth / 2, dataY, { align: 'center' });
    x += summativeWidth;
    
    const interpretation = record.socio_emotional_dev === 'advancing' ? 'Advancing' : 
                          record.socio_emotional_dev === 'emerging' ? 'Emerging' : 'Developing';
    doc.text(interpretation, x + 2, dataY);
    x += interpretationWidth;
    
    const appraised = record.promotion_status === 'promoted' ? 'Ready' : 'Needs Intervention';
    doc.text(appraised, x + 2, dataY);
    
    dataY += rowHeight;
    globalIndex++;
  });
  
  // Female total row (only on last student page)
  if (isLastStudentPage && pageFemaleStudents.length > 0) {
    doc.setFont('helvetica', 'bold');
    x = leftMargin + 2;
    doc.text('FEMALE', x, dataY);
    // Display total count in the name column area
    doc.text(femaleStudents.length.toString(), leftMargin + noWidth + lrnWidth + nameWidth / 2, dataY, { align: 'center' });
    dataY += rowHeight + 1;
  }
  
  // Grand total (only on last student page) - removed as not in official format
  
  // === FOOTER ===
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`School Form 5-K Page ${pageNumber} of ${totalPages}`, pageWidth - rightMargin - 60, pageHeight - 10);
}

// Render table header
function renderTableHeader(doc: jsPDF, config: {
  leftMargin: number;
  tableY: number;
  tableHeight: number;
  tableWidth: number;
  noWidth: number;
  lrnWidth: number;
  nameWidth: number;
  summativeWidth: number;
  interpretationWidth: number;
  appraisedWidth: number;
}): void {
  const { leftMargin, tableY, tableHeight, noWidth, lrnWidth, nameWidth, summativeWidth, interpretationWidth, appraisedWidth } = config;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  
  let x = leftMargin;
  const headerY = tableY + 5; // Increased from 4 to 5 for more vertical space
  
  // No.
  doc.text('No.', x + noWidth / 2, headerY, { align: 'center' });
  x += noWidth;
  doc.line(x, tableY, x, tableY + tableHeight);
  
  // LRN
  doc.text('LRN', x + lrnWidth / 2, headerY, { align: 'center' });
  x += lrnWidth;
  doc.line(x, tableY, x, tableY + tableHeight);
  
  // NAME OF LEARNER
  doc.setFontSize(8); // Slightly larger for main title
  doc.text('NAME OF LEARNER', x + nameWidth / 2, headerY - 1, { align: 'center' });
  doc.setFontSize(6);
  doc.text('(Last Name, First Name, Name Extension, Middle Name)', x + nameWidth / 2, headerY + 4, { align: 'center' });
  doc.setFontSize(7);
  x += nameWidth;
  doc.line(x, tableY, x, tableY + tableHeight);
  
  // SUMMATIVE ASSESSMENT (split into 3 lines with better spacing)
  doc.setFontSize(7);
  doc.text('SUMMATIVE', x + summativeWidth / 2, headerY - 2, { align: 'center' });
  doc.text('ASSESSMENT', x + summativeWidth / 2, headerY + 1, { align: 'center' });
  doc.setFontSize(6);
  doc.text('STANDARD SCORE', x + summativeWidth / 2, headerY + 4, { align: 'center' });
  doc.setFontSize(7);
  x += summativeWidth;
  doc.line(x, tableY, x, tableY + tableHeight);
  
  // INTERPRETATION
  doc.setFontSize(8);
  doc.text('INTERPRETATION', x + interpretationWidth / 2, headerY, { align: 'center' });
  doc.setFontSize(7);
  x += interpretationWidth;
  doc.line(x, tableY, x, tableY + tableHeight);
  
  // APPRAISED
  doc.setFontSize(8);
  doc.text('APPRAISED', x + appraisedWidth / 2, headerY - 2, { align: 'center' });
  doc.setFontSize(6);
  doc.text('(Grade One Ready or Needs', x + appraisedWidth / 2, headerY + 1.5, { align: 'center' });
  doc.text('Further Intervention)', x + appraisedWidth / 2, headerY + 4.5, { align: 'center' });
  
  // Header separator (moved down for more space)
  doc.line(leftMargin, tableY + 12, leftMargin + noWidth + lrnWidth + nameWidth + summativeWidth + interpretationWidth + appraisedWidth, tableY + 12);
}

/**
 * Renders the summary page with two-column layout:
 * - LEFT: Summary table (Grade One Ready, Needs Intervention)
 * - RIGHT: Level of Progress and Achievement (proficiency levels by gender)
 * Includes signature blocks and DepEd guidelines.
 */
function renderSummaryPage(doc: jsPDF, config: {
  allRecords: PromotionRecordWithStudent[];
  maleStudents: PromotionRecordWithStudent[];
  femaleStudents: PromotionRecordWithStudent[];
  schoolInfo: any;
  schoolYear: string;
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
    totalPages,
  } = config;
  
  // Calculate statistics
  const readyMale = maleStudents.filter(r => r.promotion_status === 'promoted').length;
  const readyFemale = femaleStudents.filter(r => r.promotion_status === 'promoted').length;
  const readyTotal = readyMale + readyFemale;
  
  const interventionMale = maleStudents.filter(r => r.promotion_status !== 'promoted').length;
  const interventionFemale = femaleStudents.filter(r => r.promotion_status !== 'promoted').length;
  const interventionTotal = interventionMale + interventionFemale;
  
  // Proficiency levels (using socio_emotional_dev as primary indicator)
  const shadMale = maleStudents.filter(r => r.socio_emotional_dev === 'advancing').length;
  const shadFemale = femaleStudents.filter(r => r.socio_emotional_dev === 'advancing').length;
  
  const ssadMale = 0; // Support Slight Advanced Development (not currently tracked)
  const ssadFemale = 0;
  
  const adMale = maleStudents.filter(r => r.socio_emotional_dev === 'emerging').length;
  const adFemale = femaleStudents.filter(r => r.socio_emotional_dev === 'emerging').length;
  
  const ssdodMale = maleStudents.filter(r => r.socio_emotional_dev === 'developing').length;
  const ssdodFemale = femaleStudents.filter(r => r.socio_emotional_dev === 'developing').length;
  
  // === TWO-COLUMN LAYOUT ===
  const columnGap = 10;
  const leftColStart = leftMargin;
  const leftColWidth = (pageWidth - leftMargin - rightMargin - columnGap) / 2;
  const rightColStart = leftColStart + leftColWidth + columnGap;
  const rightColWidth = leftColWidth;
  
  const startY = 30;
  doc.setLineWidth(0.5);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  
  const summaryTableHeight = 50;
  doc.rect(leftColStart, startY, leftColWidth, summaryTableHeight);
  doc.text('SUMMARY TABLE', leftColStart + leftColWidth / 2, startY + 5, { align: 'center' });
  
  doc.line(leftColStart, startY + 7, leftColStart + leftColWidth, startY + 7);
  
  const colW = leftColWidth / 4;
  let summaryY = startY + 12;
  
  doc.setFontSize(7);
  doc.text('STATUS', leftColStart + colW / 2, summaryY, { align: 'center' });
  doc.line(leftColStart + colW, startY + 7, leftColStart + colW, startY + summaryTableHeight);
  
  doc.text('MALE', leftColStart + colW + colW / 2, summaryY, { align: 'center' });
  doc.line(leftColStart + colW * 2, startY + 7, leftColStart + colW * 2, startY + summaryTableHeight);
  
  doc.text('FEMALE', leftColStart + colW * 2 + colW / 2, summaryY, { align: 'center' });
  doc.line(leftColStart + colW * 3, startY + 7, leftColStart + colW * 3, startY + summaryTableHeight);
  
  doc.text('TOTAL', leftColStart + colW * 3 + colW / 2, summaryY, { align: 'center' });
  
  doc.line(leftColStart, startY + 15, leftColStart + leftColWidth, startY + 15);
  
  summaryY = startY + 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  
  doc.text('GRADE ONE (1)', leftColStart + 2, summaryY);
  doc.text('READY', leftColStart + 2, summaryY + 3);
  doc.text(readyMale.toString(), leftColStart + colW + colW / 2, summaryY + 1.5, { align: 'center' });
  doc.text(readyFemale.toString(), leftColStart + colW * 2 + colW / 2, summaryY + 1.5, { align: 'center' });
  doc.text(readyTotal.toString(), leftColStart + colW * 3 + colW / 2, summaryY + 1.5, { align: 'center' });
  
  doc.line(leftColStart, summaryY + 6, leftColStart + leftColWidth, summaryY + 6);
  summaryY += 10;
  
  doc.text('NEEDS FURTHER', leftColStart + 2, summaryY);
  doc.text('INTERVENTION', leftColStart + 2, summaryY + 3);
  doc.text(interventionMale.toString(), leftColStart + colW + colW / 2, summaryY + 1.5, { align: 'center' });
  doc.text(interventionFemale.toString(), leftColStart + colW * 2 + colW / 2, summaryY + 1.5, { align: 'center' });
  doc.text(interventionTotal.toString(), leftColStart + colW * 3 + colW / 2, summaryY + 1.5, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  
  const progressTableHeight = 80;
  doc.rect(rightColStart, startY, rightColWidth, progressTableHeight);
  doc.text('LEVEL OF PROGRESS AND ACHIEVEMENT', rightColStart + rightColWidth / 2, startY + 5, { align: 'center' });
  
  doc.line(rightColStart, startY + 7, rightColStart + rightColWidth, startY + 7);
  
  const interpretColW = rightColWidth * 0.6;
  const dataColW = (rightColWidth - interpretColW) / 3;
  let progressY = startY + 12;
  
  doc.setFontSize(7);
  doc.text('INTERPRETATION', rightColStart + interpretColW / 2, progressY, { align: 'center' });
  doc.line(rightColStart + interpretColW, startY + 7, rightColStart + interpretColW, startY + progressTableHeight);
  
  doc.text('MALE', rightColStart + interpretColW + dataColW / 2, progressY, { align: 'center' });
  doc.line(rightColStart + interpretColW + dataColW, startY + 7, rightColStart + interpretColW + dataColW, startY + progressTableHeight);
  
  doc.text('FEMALE', rightColStart + interpretColW + dataColW + dataColW / 2, progressY, { align: 'center' });
  doc.line(rightColStart + interpretColW + dataColW * 2, startY + 7, rightColStart + interpretColW + dataColW * 2, startY + progressTableHeight);
  
  doc.text('TOTAL', rightColStart + interpretColW + dataColW * 2 + dataColW / 2, progressY, { align: 'center' });
  
  // Header separator
  doc.line(rightColStart, startY + 15, rightColStart + rightColWidth, startY + 15);
  
  progressY = startY + 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  
  // S.H.A.D (130 and above)
  doc.text('Suggest Highly Advanced Development -', rightColStart + 2, progressY);
  doc.text('S.H.A.D. (130 and above)', rightColStart + 2, progressY + 3);
  doc.text(shadMale.toString(), rightColStart + interpretColW + dataColW / 2, progressY + 1.5, { align: 'center' });
  doc.text(shadFemale.toString(), rightColStart + interpretColW + dataColW + dataColW / 2, progressY + 1.5, { align: 'center' });
  doc.text((shadMale + shadFemale).toString(), rightColStart + interpretColW + dataColW * 2 + dataColW / 2, progressY + 1.5, { align: 'center' });
  
  doc.line(rightColStart, progressY + 6, rightColStart + rightColWidth, progressY + 6);
  progressY += 9;
  
  // S.S.A.D (120-129)
  doc.text('Support Slight Advanced Development', rightColStart + 2, progressY);
  doc.text('- S.S.A.D. (120-129)', rightColStart + 2, progressY + 3);
  doc.text(ssadMale.toString(), rightColStart + interpretColW + dataColW / 2, progressY + 1.5, { align: 'center' });
  doc.text(ssadFemale.toString(), rightColStart + interpretColW + dataColW + dataColW / 2, progressY + 1.5, { align: 'center' });
  doc.text((ssadMale + ssadFemale).toString(), rightColStart + interpretColW + dataColW * 2 + dataColW / 2, progressY + 1.5, { align: 'center' });
  
  doc.line(rightColStart, progressY + 6, rightColStart + rightColWidth, progressY + 6);
  progressY += 9;
  
  // A.D (90-119)
  doc.text('Average Development - A.D. (90-119)', rightColStart + 2, progressY + 1.5);
  doc.text(adMale.toString(), rightColStart + interpretColW + dataColW / 2, progressY + 1.5, { align: 'center' });
  doc.text(adFemale.toString(), rightColStart + interpretColW + dataColW + dataColW / 2, progressY + 1.5, { align: 'center' });
  doc.text((adMale + adFemale).toString(), rightColStart + interpretColW + dataColW * 2 + dataColW / 2, progressY + 1.5, { align: 'center' });
  
  doc.line(rightColStart, progressY + 5, rightColStart + rightColWidth, progressY + 5);
  progressY += 8;
  
  // S.S.D.O.D (70-89) - Split into two lines
  doc.text('Suggest Significant Delay in Overall', rightColStart + 2, progressY);
  doc.text('Development - S.S.D.O.D (70-89)', rightColStart + 2, progressY + 3);
  doc.text(ssdodMale.toString(), rightColStart + interpretColW + dataColW / 2, progressY + 1.5, { align: 'center' });
  doc.text(ssdodFemale.toString(), rightColStart + interpretColW + dataColW + dataColW / 2, progressY + 1.5, { align: 'center' });
  doc.text((ssdodMale + ssdodFemale).toString(), rightColStart + interpretColW + dataColW * 2 + dataColW / 2, progressY + 1.5, { align: 'center' });
  
  doc.line(rightColStart, progressY + 6, rightColStart + rightColWidth, progressY + 6);
  progressY += 9;
  
  // S.S.D.O.D (69 and below) - Split into two lines
  doc.text('Suggest Significant Delay in Overall', rightColStart + 2, progressY);
  doc.text('Development - S.S.D.O.D (69 and below)', rightColStart + 2, progressY + 3);
  doc.text('0', rightColStart + interpretColW + dataColW / 2, progressY + 1.5, { align: 'center' });
  doc.text('0', rightColStart + interpretColW + dataColW + dataColW / 2, progressY + 1.5, { align: 'center' });
  doc.text('0', rightColStart + interpretColW + dataColW * 2 + dataColW / 2, progressY + 1.5, { align: 'center' });
  
  doc.line(rightColStart, progressY + 6, rightColStart + rightColWidth, progressY + 6);
  progressY += 9;
  
  // Total by Gender
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('TOTAL BY GENDER', rightColStart + 2, progressY + 1.5);
  doc.text(maleStudents.length.toString(), rightColStart + interpretColW + dataColW / 2, progressY + 1.5, { align: 'center' });
  doc.text(femaleStudents.length.toString(), rightColStart + interpretColW + dataColW + dataColW / 2, progressY + 1.5, { align: 'center' });
  doc.text((maleStudents.length + femaleStudents.length).toString(), rightColStart + interpretColW + dataColW * 2 + dataColW / 2, progressY + 1.5, { align: 'center' });
  
  // === SIGNATURE BLOCKS (4 signatures in 2x2 grid) ===
  const sigY = startY + progressTableHeight + 15;
  const sigColWidth = (pageWidth - leftMargin - rightMargin - columnGap) / 2;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  // Row 1: Prepared By | Certified Correct & Submitted By
  doc.text('Prepared By:', leftColStart, sigY);
  doc.line(leftColStart, sigY + 10, leftColStart + sigColWidth - 10, sigY + 10);
  doc.setFontSize(7);
  doc.text('Signature of Class Adviser over Printed Name', leftColStart + sigColWidth / 2 - 30, sigY + 13);
  
  doc.setFontSize(8);
  doc.text('Certified Correct & Submitted By:', rightColStart, sigY);
  doc.line(rightColStart, sigY + 10, rightColStart + sigColWidth - 10, sigY + 10);
  doc.setFontSize(7);
  doc.text('Signature of School Head over Printed Name', rightColStart + sigColWidth / 2 - 30, sigY + 13);
  
  // Row 2: Reviewed By | Checked & Validated By
  const sig2Y = sigY + 25;
  doc.setFontSize(8);
  doc.text('Reviewed By:', leftColStart, sig2Y);
  doc.line(leftColStart, sig2Y + 10, leftColStart + sigColWidth - 10, sig2Y + 10);
  doc.setFontSize(7);
  doc.text('Signature of Public Schools District Supervisor/Representative over Printed Name', leftColStart + 5, sig2Y + 13);
  
  doc.setFontSize(8);
  doc.text('Checked & Validated By:', rightColStart, sig2Y);
  doc.line(rightColStart, sig2Y + 10, rightColStart + sigColWidth - 10, sig2Y + 10);
  doc.setFontSize(7);
  doc.text('Signature of Division Representative over Printed Name', rightColStart + sigColWidth / 2 - 30, sig2Y + 13);
  
  // === GUIDELINES ===
  const guideY = sig2Y + 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('GUIDELINES:', leftMargin, guideY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  let guideTextY = guideY + 5;
  
  doc.text('1. Do not include Dropouts and Transferred Out (DO 4, s 2014)', leftMargin, guideTextY);
  guideTextY += 4;
  
  doc.text('2. This should be prepared by the Adviser. Post Test Standard Scores should be taken from the record', leftMargin, guideTextY);
  guideTextY += 3.5;
  doc.text('   submitted to the Division Office.', leftMargin, guideTextY);
  guideTextY += 4;
  
  doc.text('3. The summary table should reflect the total number of learners. For GRADE ONE READY and', leftMargin, guideTextY);
  guideTextY += 3.5;
  doc.text('   INTERVENTION, the Summative Assessment Standard Score must be 80 and above.', leftMargin, guideTextY);
  guideTextY += 4;
  
  doc.text('4. ATTENTION shall be given to those learners who scored 79 and below:', leftMargin, guideTextY);
  
  // Page number
  doc.setFontSize(8);
  doc.text(`School Form 5-K Page ${totalPages} of ${totalPages}`, pageWidth - rightMargin - 60, pageHeight - 10);
}
