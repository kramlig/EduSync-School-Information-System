/**
 * SF4 PDF Generator - Monthly Learner Movement & Attendance Report
 * Generates official DepEd Form SF4 for tracking enrollment changes
 */

import jsPDF from 'jspdf';
import type { SF4PDFOptions } from '../../types/studentMovements';
import depedSealUrl from '../../assets/deped-logo.png';
import depedLogoUrl from '../../assets/deped-seal.png';

// === CONSTANTS ===
const PAGE_CONFIG = {
  FORMAT: 'legal' as const,
  ORIENTATION: 'landscape' as const,
  UNIT: 'mm' as const,
} as const;

const MARGINS = { LEFT: 10, RIGHT: 10, TOP: 10, BOTTOM: 10 } as const;

const LOGO_CONFIG = {
  HEIGHT: 15,
  Y_POSITION: 3,
  MARGIN: 5,
} as const;

const FONT_SIZES = {
  HEADER_MAIN: 14,
  HEADER_SUB: 11,
  HEADER_DETAIL: 12,
  HEADER_SMALL: 10,
  FIELD_LABEL: 9,
  TABLE_HEADER: 9,
  TABLE_DATA: 9,
  ATTENDANCE: 10,
  ATTENDANCE_DATA: 9,
  FOOTER: 9,
  FOOTER_LABEL: 8,
} as const;

const FIELD_CONFIG = {
  HEIGHT: 6,
  Y_START: 50,
  ROW_SPACING: 9,
} as const;

const TABLE_CONFIG = {
  HEIGHT: 48,
  HEADER_HEIGHT: 10,
  ROW_SPACING: 6,
  LINE_WIDTH: 0.5,
  COL_WIDTHS: {
    DESCRIPTION: 0.3,
    BEGINNING: 0.14,
    TRANSFER_IN: 0.14,
    TRANSFER_OUT: 0.14,
    DROPPED: 0.14,
    ENDING: 0.14,
  },
} as const;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

// === TYPES ===
interface LogoImages {
  seal: { data: string; width: number; height: number };
  logo: { data: string; width: number; height: number };
}

interface PageConfig {
  schoolInfo: any;
  schoolYear: string;
  month: string;
  gradeLevel?: number;
  section?: any;
  summary: any;
  pageWidth: number;
  pageHeight: number;
  leftMargin: number;
  rightMargin: number;
  logoImages: LogoImages | null;
}

interface TableConfig {
  summary: any;
  tableY: number;
  leftMargin: number;
  rightMargin: number;
  pageWidth: number;
}

// === MAIN FUNCTION ===
export async function generateSF4PDF(options: SF4PDFOptions): Promise<void> {
  const { schoolInfo, schoolYear, month, gradeLevel, section, summary } = options;

  const doc = new jsPDF({
    orientation: PAGE_CONFIG.ORIENTATION,
    unit: PAGE_CONFIG.UNIT,
    format: PAGE_CONFIG.FORMAT,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const logoImages = await loadLogos().catch(() => {
    console.warn('Logo loading failed, PDF will render without logos');
    return null;
  });

  renderSF4Page(doc, {
    schoolInfo,
    schoolYear,
    month,
    gradeLevel,
    section,
    summary,
    pageWidth,
    pageHeight,
    leftMargin: MARGINS.LEFT,
    rightMargin: MARGINS.RIGHT,
    logoImages,
  });

  const monthDisplay = formatMonthDisplay(month);
  const gradeText = gradeLevel !== undefined ? `Grade${gradeLevel}` : 'AllGrades';
  doc.save(`SF4_${monthDisplay}_${gradeText}_${schoolYear.replace(/\//g, '-')}.pdf`);
}

// === LOGO LOADING ===
async function loadLogos(): Promise<LogoImages> {
  const [sealData, logoData] = await Promise.all([
    loadImageAsBase64(depedSealUrl),
    loadImageAsBase64(depedLogoUrl),
  ]);

  const [seal, logo] = await Promise.all([
    removeTransparency(sealData),
    removeTransparency(logoData),
  ]);

  return { seal, logo };
}

function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    const timeout = setTimeout(() => reject(new Error('Image load timeout')), 5000);
    
    img.onload = () => {
      clearTimeout(timeout);
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
    
    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

function removeTransparency(base64Data: string): Promise<{ data: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timeout = setTimeout(() => reject(new Error('Transparency removal timeout')), 5000);
    
    img.onload = () => {
      clearTimeout(timeout);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      resolve({
        data: canvas.toDataURL('image/png'),
        width: img.width,
        height: img.height,
      });
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to load image'));
    };
    
    img.src = base64Data;
  });
}

// === PAGE RENDERING ===
function renderSF4Page(doc: jsPDF, config: PageConfig): void {
  renderLogos(doc, config);
  renderHeader(doc, config);
  renderSchoolInfoFields(doc, config);
  
  const tableY = calculateTableY(config);
  renderStatisticsTable(doc, { ...config, tableY });
  renderFooter(doc, config);
}

function renderLogos(doc: jsPDF, { pageWidth, leftMargin, rightMargin, logoImages }: PageConfig): void {
  if (!logoImages) return;

  const sealWidth = (logoImages.seal.width / logoImages.seal.height) * LOGO_CONFIG.HEIGHT;
  const logoWidth = (logoImages.logo.width / logoImages.logo.height) * LOGO_CONFIG.HEIGHT;
  
  doc.addImage(
    logoImages.seal.data,
    'PNG',
    leftMargin + LOGO_CONFIG.MARGIN,
    LOGO_CONFIG.Y_POSITION,
    sealWidth,
    LOGO_CONFIG.HEIGHT
  );
  
  doc.addImage(
    logoImages.logo.data,
    'PNG',
    pageWidth - rightMargin - logoWidth - LOGO_CONFIG.MARGIN,
    LOGO_CONFIG.Y_POSITION,
    logoWidth,
    LOGO_CONFIG.HEIGHT
  );
}

function renderHeader(doc: jsPDF, { pageWidth, schoolInfo }: PageConfig): void {
  doc.setFont('helvetica', 'bold');
  
  doc.setFontSize(FONT_SIZES.HEADER_DETAIL);
  doc.text('Republic of the Philippines', pageWidth / 2, 8, { align: 'center' });
  doc.text('Department of Education', pageWidth / 2, 13, { align: 'center' });
  
  doc.setFontSize(FONT_SIZES.HEADER_SMALL);
  doc.text(schoolInfo.region, pageWidth / 2, 18, { align: 'center' });
  doc.text(schoolInfo.division, pageWidth / 2, 23, { align: 'center' });
  doc.text(schoolInfo.district, pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(FONT_SIZES.HEADER_MAIN);
  doc.text('SCHOOL FORM 4 (SF4)', pageWidth / 2, 36, { align: 'center' });
  
  doc.setFontSize(FONT_SIZES.HEADER_SUB);
  doc.text('MONTHLY LEARNER MOVEMENT AND ATTENDANCE REPORT', pageWidth / 2, 42, { align: 'center' });
}

function renderSchoolInfoFields(doc: jsPDF, { leftMargin, schoolInfo, schoolYear, month, gradeLevel, section }: PageConfig): void {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SIZES.FIELD_LABEL);
  
  let fieldY = FIELD_CONFIG.Y_START;

  // Row 1: School Name and School ID
  doc.text('School:', leftMargin, fieldY);
  doc.rect(leftMargin + 15, fieldY - 4, 115, FIELD_CONFIG.HEIGHT);
  doc.text(schoolInfo.name, leftMargin + 17, fieldY);
  
  doc.text('School ID:', leftMargin + 138, fieldY);
  doc.rect(leftMargin + 163, fieldY - 4, 55, FIELD_CONFIG.HEIGHT);
  doc.text(schoolInfo.schoolId, leftMargin + 165, fieldY);
  
  // Row 2: School Year and Month
  fieldY += FIELD_CONFIG.ROW_SPACING;
  doc.text('School Year:', leftMargin, fieldY);
  doc.rect(leftMargin + 25, fieldY - 4, 50, FIELD_CONFIG.HEIGHT);
  doc.text(schoolYear, leftMargin + 27, fieldY);
  
  doc.text('Month:', leftMargin + 85, fieldY);
  doc.rect(leftMargin + 100, fieldY - 4, 70, FIELD_CONFIG.HEIGHT);
  doc.text(formatMonthDisplay(month), leftMargin + 102, fieldY);
  
  // Row 3: Grade Level and Section (conditional)
  if (gradeLevel !== undefined) {
    fieldY += FIELD_CONFIG.ROW_SPACING;
    doc.text('Grade Level:', leftMargin, fieldY);
    doc.rect(leftMargin + 25, fieldY - 4, 30, FIELD_CONFIG.HEIGHT);
    doc.text(gradeLevel.toString(), leftMargin + 27, fieldY);
    
    if (section) {
      doc.text('Section:', leftMargin + 65, fieldY);
      doc.rect(leftMargin + 82, fieldY - 4, 60, FIELD_CONFIG.HEIGHT);
      doc.text(section.name, leftMargin + 84, fieldY);
    }
  }
}

function calculateTableY({ gradeLevel }: PageConfig): number {
  const rows = gradeLevel !== undefined ? 3 : 2;
  return FIELD_CONFIG.Y_START + (rows * FIELD_CONFIG.ROW_SPACING) + 3;
}

function renderStatisticsTable(doc: jsPDF, config: TableConfig): void {
  const { summary, tableY, leftMargin, rightMargin, pageWidth } = config;
  const tableWidth = pageWidth - leftMargin - rightMargin;

  const colWidths = calculateColumnWidths(tableWidth);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(FONT_SIZES.TABLE_HEADER);
  doc.setLineWidth(TABLE_CONFIG.LINE_WIDTH);
  
  doc.rect(leftMargin, tableY, tableWidth, TABLE_CONFIG.HEIGHT);
  
  renderTableHeaders(doc, { tableY, leftMargin, colWidths });
  renderTableData(doc, { tableY, leftMargin, colWidths, summary });
  renderAttendanceSummary(doc, { tableY, leftMargin, summary });
}

function calculateColumnWidths(tableWidth: number) {
  return {
    description: tableWidth * TABLE_CONFIG.COL_WIDTHS.DESCRIPTION,
    beginning: tableWidth * TABLE_CONFIG.COL_WIDTHS.BEGINNING,
    transferIn: tableWidth * TABLE_CONFIG.COL_WIDTHS.TRANSFER_IN,
    transferOut: tableWidth * TABLE_CONFIG.COL_WIDTHS.TRANSFER_OUT,
    dropped: tableWidth * TABLE_CONFIG.COL_WIDTHS.DROPPED,
    ending: tableWidth * TABLE_CONFIG.COL_WIDTHS.ENDING,
  };
}

function renderTableHeaders(doc: jsPDF, { tableY, leftMargin, colWidths }: any): void {
  let currentY = tableY + 6;
  let currentX = leftMargin;

  const headers = [
    { text: 'PARTICULARS', width: colWidths.description, multiline: false },
    { text: 'BEGINNING', width: colWidths.beginning, multiline: false },
    { text: ['TRANSFERRED', 'IN'], width: colWidths.transferIn, multiline: true },
    { text: ['TRANSFERRED', 'OUT'], width: colWidths.transferOut, multiline: true },
    { text: 'DROPPED', width: colWidths.dropped, multiline: false },
    { text: ['ENDING', 'ENROLLMENT'], width: colWidths.ending, multiline: true },
  ];

  headers.forEach(({ text, width, multiline }, index) => {
    if (index > 0) {
      doc.line(currentX, tableY, currentX, tableY + TABLE_CONFIG.HEIGHT);
    }

    if (multiline && Array.isArray(text)) {
      doc.text(text[0], currentX + width / 2, currentY - 2, { align: 'center' });
      doc.text(text[1], currentX + width / 2, currentY + 2, { align: 'center' });
    } else {
      const displayText = Array.isArray(text) ? text[0] : text;
      if (index === 0) {
        doc.text(displayText, currentX + 2, currentY);
      } else {
        doc.text(displayText, currentX + width / 2, currentY, { align: 'center' });
      }
    }

    currentX += width;
  });

  doc.line(leftMargin, tableY + TABLE_CONFIG.HEADER_HEIGHT, currentX, tableY + TABLE_CONFIG.HEADER_HEIGHT);
}

function renderTableData(doc: jsPDF, { tableY, leftMargin, colWidths, summary }: any): void {
  doc.setFont('helvetica', 'normal');
  let currentY = tableY + 16;

  const rows = [
    { label: 'MALE', data: summary.by_gender.male, bold: false },
    { label: 'FEMALE', data: summary.by_gender.female, bold: false },
    { 
      label: 'TOTAL', 
      data: {
        beginning: summary.total_beginning_enrollment,
        transferred_in: summary.total_transferred_in,
        transferred_out: summary.total_transferred_out,
        dropped: summary.total_dropped,
        ending: summary.total_ending_enrollment,
      }, 
      bold: true 
    },
  ];

  rows.forEach((row, index) => {
    if (row.bold) doc.setFont('helvetica', 'bold');
    
    doc.text(row.label, leftMargin + 2, currentY);
    
    const dataKeys = ['beginning', 'transferred_in', 'transferred_out', 'dropped', 'ending'];
    let xPos = leftMargin + colWidths.description;

    dataKeys.forEach(key => {
      const value = row.data[key]?.toString() || '0';
      const colKey = key === 'beginning' ? 'beginning' : 
                     key === 'transferred_in' ? 'transferIn' :
                     key === 'transferred_out' ? 'transferOut' :
                     key === 'dropped' ? 'dropped' : 'ending';
      doc.text(value, xPos + colWidths[colKey] / 2, currentY, { align: 'center' });
      xPos += colWidths[colKey];
    });

    if (index < rows.length - 1) {
      currentY += TABLE_CONFIG.ROW_SPACING;
      const tableWidth = (Object.values(colWidths) as number[]).reduce((a, b) => a + b, 0);
      doc.line(leftMargin, currentY, leftMargin + tableWidth, currentY);
      currentY += TABLE_CONFIG.ROW_SPACING;
    }

    if (row.bold) doc.setFont('helvetica', 'normal');
  });
}

function renderAttendanceSummary(doc: jsPDF, { tableY, leftMargin, summary }: any): void {
  let currentY = tableY + 58;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(FONT_SIZES.ATTENDANCE);
  doc.text('ATTENDANCE SUMMARY', leftMargin + 2, currentY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SIZES.ATTENDANCE_DATA);
  
  const attendanceData = [
    `Total School Days: ${summary.attendance_summary.total_school_days}`,
    `Total Absences: ${summary.attendance_summary.total_absences || 0}`,
    `Average Attendance Rate: ${summary.attendance_summary.average_attendance_rate.toFixed(2)}%`,
  ];

  attendanceData.forEach((text, index) => {
    currentY += index === 0 ? 6 : 5;
    doc.text(text, leftMargin + 5, currentY);
  });
}

function renderFooter(doc: jsPDF, { pageWidth, leftMargin, rightMargin }: PageConfig): void {
  const footerY = 185;
  
  doc.setFontSize(FONT_SIZES.FOOTER);
  
  // Prepared by
  doc.text('Prepared by:', leftMargin, footerY);
  doc.line(leftMargin + 30, footerY + 12, leftMargin + 90, footerY + 12);
  doc.setFontSize(FONT_SIZES.FOOTER_LABEL);
  doc.text('Teacher/Adviser', leftMargin + 45, footerY + 16, { align: 'center' });

  // Checked by
  doc.setFontSize(FONT_SIZES.FOOTER);
  doc.text('Checked by:', pageWidth - rightMargin - 100, footerY);
  doc.line(pageWidth - rightMargin - 90, footerY + 12, pageWidth - rightMargin - 30, footerY + 12);
  doc.setFontSize(FONT_SIZES.FOOTER_LABEL);
  doc.text('School Head', pageWidth - rightMargin - 60, footerY + 16, { align: 'center' });
}

// === UTILITIES ===
function formatMonthDisplay(month: string): string {
  const [year, monthNum] = month.split('-');
  return `${MONTH_NAMES[parseInt(monthNum) - 1]} ${year}`;
}
