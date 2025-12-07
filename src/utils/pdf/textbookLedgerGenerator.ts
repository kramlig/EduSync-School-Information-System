/**
 * Textbook Ledger PDF Generator (Custom Management Tool)
 * 
 * NOTE: This is a custom school management tool, not an official DepEd form.
 * Official DepEd SF6 is "Summarized Report on Promotion and Level of Proficiency"
 * 
 * Generates comprehensive textbook distribution and accountability reports
 */

import jsPDF from 'jspdf';
import type { SF6PDFOptions, TextbookDistributionWithDetails } from '../../types/textbookDistributions';
import depedSealUrl from '../../assets/deped-logo.png';
import depedLogoUrl from '../../assets/deped-seal.png';

// Page Configuration
const PAGE_CONFIG = {
  WIDTH: 355.6,  // Legal landscape (14 inches)
  HEIGHT: 215.9, // Legal landscape (8.5 inches)
  ORIENTATION: 'landscape' as const,
  UNIT: 'mm' as const,
  FORMAT: 'legal' as const,
};

// Margins
const MARGINS = {
  TOP: 15,
  LEFT: 15,
  RIGHT: 15,
  BOTTOM: 15,
};

// Logo Configuration
const LOGO_CONFIG = {
  HEIGHT: 18,
  Y_POSITION: 3,
  MARGIN: 5,
};

// Font Sizes
const FONT_SIZES = {
  TITLE: 12,
  SUBTITLE: 10,
  HEADER: 8,
  BODY: 7,
  SMALL: 6,
};

// Field Configuration
const FIELD_CONFIG = {
  BOX_HEIGHT: 6,
  LABEL_OFFSET: 15,
  VALUE_OFFSET: 17,
  SPACING: 2,
};

// Table Configuration
const TABLE_CONFIG = {
  START_Y: 62,
  ROW_HEIGHT: 6,
  HEADER_HEIGHT: 12,
};

// Column Widths (Total: 325.6mm available width = 355.6mm page - 30mm margins)
const COLUMN_WIDTHS = {
  number: 12,
  lrn: 28,
  studentName: 60,
  gradeSection: 30,
  bookTitle: 70,
  dateIssued: 25,
  dateReturned: 25,
  condition: 25,
  status: 25,
  amount: 25.6,
};

interface LogoImages {
  seal: { data: string; width: number; height: number };
  logo: { data: string; width: number; height: number };
}

/**
 * Load logo images
 */
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
      reject(new Error('Failed to process image'));
    };
    
    img.src = base64Data;
  });
}

/**
 * Render DepEd and school logos
 */
function renderLogos(doc: jsPDF, logos: LogoImages | null, pageWidth: number): void {
  if (!logos) return;
  
  const { seal, logo } = logos;
  
  try {
    // DepEd seal (left)
    const sealAspect = seal.width / seal.height;
    const sealWidth = LOGO_CONFIG.HEIGHT * sealAspect;
    doc.addImage(
      seal.data,
      'PNG',
      MARGINS.LEFT + LOGO_CONFIG.MARGIN,
      LOGO_CONFIG.Y_POSITION,
      sealWidth,
      LOGO_CONFIG.HEIGHT
    );

    // DepEd logo (right) - use its own aspect ratio
    const logoAspect = logo.width / logo.height;
    const logoWidth = LOGO_CONFIG.HEIGHT * logoAspect;
    doc.addImage(
      logo.data,
      'PNG',
      pageWidth - MARGINS.RIGHT - logoWidth - LOGO_CONFIG.MARGIN,
      LOGO_CONFIG.Y_POSITION,
      logoWidth,
      LOGO_CONFIG.HEIGHT
    );
  } catch (error) {
    console.warn('Failed to render logos:', error);
  }
}

/**
 * Render header section
 */
function renderHeader(doc: jsPDF, pageWidth: number): void {
  const centerX = pageWidth / 2;
  
  doc.setFontSize(FONT_SIZES.TITLE);
  doc.setFont('helvetica', 'bold');
  doc.text('SCHOOL FORM 6 (SF6)', centerX, 10, { align: 'center' });
  
  doc.setFontSize(FONT_SIZES.SUBTITLE);
  doc.setFont('helvetica', 'normal');
  doc.text('Textbook Ledger', centerX, 15, { align: 'center' });
  
  doc.setFontSize(FONT_SIZES.SMALL);
  doc.text('(to be accomplished at the end of the school year)', centerX, 19, { align: 'center' });
}

/**
 * Render school information fields
 */
function renderSchoolInfoFields(
  doc: jsPDF,
  schoolInfo: SF6PDFOptions['schoolInfo'],
  options: SF6PDFOptions
): void {
  const leftMargin = MARGINS.LEFT;
  const rightMargin = PAGE_CONFIG.WIDTH - MARGINS.RIGHT;
  let fieldY = 42;

  doc.setFontSize(FONT_SIZES.BODY);
  doc.setFont('helvetica', 'normal');

  // Row 1: School, School ID
  doc.text('School:', leftMargin, fieldY);
  doc.rect(leftMargin + 15, fieldY - 4, 145, FIELD_CONFIG.BOX_HEIGHT);
  doc.text(schoolInfo.name, leftMargin + 17, fieldY);

  doc.text('School ID:', rightMargin - 135, fieldY);
  doc.rect(rightMargin - 105, fieldY - 4, 105, FIELD_CONFIG.BOX_HEIGHT);
  doc.text(schoolInfo.schoolId, rightMargin - 103, fieldY);

  fieldY += 8;

  // Row 2: Division, District
  doc.text('Division:', leftMargin, fieldY);
  doc.rect(leftMargin + 15, fieldY - 4, 100, FIELD_CONFIG.BOX_HEIGHT);
  doc.text(schoolInfo.division, leftMargin + 17, fieldY);

  doc.text('District:', leftMargin + 130, fieldY);
  doc.rect(leftMargin + 150, fieldY - 4, 100, FIELD_CONFIG.BOX_HEIGHT);
  doc.text(schoolInfo.district, leftMargin + 152, fieldY);

  fieldY += 8;

  // Row 3: School Year, Grade/Section
  doc.text('School Year:', leftMargin, fieldY);
  doc.rect(leftMargin + 25, fieldY - 4, 40, FIELD_CONFIG.BOX_HEIGHT);
  doc.text(options.schoolYear, leftMargin + 27, fieldY);

  if (options.gradeLevel) {
    doc.text('Grade Level:', leftMargin + 75, fieldY);
    doc.rect(leftMargin + 95, fieldY - 4, 30, FIELD_CONFIG.BOX_HEIGHT);
    doc.text(`Grade ${options.gradeLevel}`, leftMargin + 97, fieldY);
  }

  if (options.section) {
    doc.text('Section:', leftMargin + 135, fieldY);
    doc.rect(leftMargin + 155, fieldY - 4, 50, FIELD_CONFIG.BOX_HEIGHT);
    doc.text(options.section.name, leftMargin + 157, fieldY);
  }
}

/**
 * Render table headers
 */
function renderTableHeaders(doc: jsPDF): number {
  const startY = TABLE_CONFIG.START_Y;
  const availableWidth = PAGE_CONFIG.WIDTH - MARGINS.LEFT - MARGINS.RIGHT;
  const tableStartX = MARGINS.LEFT;
  let currentX = tableStartX;

  doc.setFontSize(FONT_SIZES.HEADER);
  doc.setFont('helvetica', 'bold');

  const headers = [
    { text: 'No.', width: COLUMN_WIDTHS.number },
    { text: 'LRN', width: COLUMN_WIDTHS.lrn },
    { text: 'Student Name', width: COLUMN_WIDTHS.studentName },
    { text: 'Grade/Section', width: COLUMN_WIDTHS.gradeSection },
    { text: 'Book Title', width: COLUMN_WIDTHS.bookTitle },
    { text: 'Date Issued', width: COLUMN_WIDTHS.dateIssued },
    { text: 'Date Returned', width: COLUMN_WIDTHS.dateReturned },
    { text: 'Condition', width: COLUMN_WIDTHS.condition },
    { text: 'Status', width: COLUMN_WIDTHS.status },
    { text: 'Amount', width: COLUMN_WIDTHS.amount },
  ];

  // Draw header background - full width to right margin
  doc.setFillColor(240, 240, 240);
  doc.rect(tableStartX, startY, availableWidth, TABLE_CONFIG.HEADER_HEIGHT, 'F');

  // Draw borders and text
  headers.forEach(({ text, width }) => {
    doc.rect(currentX, startY, width, TABLE_CONFIG.HEADER_HEIGHT);
    doc.text(text, currentX + width / 2, startY + 7, { align: 'center' });
    currentX += width;
  });

  return startY + TABLE_CONFIG.HEADER_HEIGHT;
}

/**
 * Render table rows with pagination
 */
function renderTableRows(
  doc: jsPDF,
  distributions: TextbookDistributionWithDetails[],
  startY: number,
  logos: LogoImages | null
): number {
  let currentY = startY;
  const maxY = PAGE_CONFIG.HEIGHT - MARGINS.BOTTOM - 20; // Reserve space for footer
  let currentPage = 1;

  doc.setFontSize(FONT_SIZES.BODY);
  doc.setFont('helvetica', 'normal');

  distributions.forEach((dist, index) => {
    // Check if we need a new page
    if (currentY + TABLE_CONFIG.ROW_HEIGHT > maxY) {
      // Add new page
      doc.addPage();
      currentPage++;
      
      // Re-render logos and headers on new page
      renderLogos(doc, logos, PAGE_CONFIG.WIDTH);
      renderHeader(doc, PAGE_CONFIG.WIDTH);
      
      // Re-render table headers
      currentY = renderTableHeaders(doc);
    }

    let currentX = MARGINS.LEFT;

    // Number
    doc.rect(currentX, currentY, COLUMN_WIDTHS.number, TABLE_CONFIG.ROW_HEIGHT);
    doc.text(String(index + 1), currentX + COLUMN_WIDTHS.number / 2, currentY + 4, { align: 'center' });
    currentX += COLUMN_WIDTHS.number;

    // LRN
    doc.rect(currentX, currentY, COLUMN_WIDTHS.lrn, TABLE_CONFIG.ROW_HEIGHT);
    doc.text(dist.student.lrn, currentX + 1, currentY + 4);
    currentX += COLUMN_WIDTHS.lrn;

    // Student Name
    doc.rect(currentX, currentY, COLUMN_WIDTHS.studentName, TABLE_CONFIG.ROW_HEIGHT);
    const studentName = `${dist.student.first_name} ${dist.student.last_name}`.substring(0, 30);
    doc.text(studentName, currentX + 1, currentY + 4);
    currentX += COLUMN_WIDTHS.studentName;

    // Grade/Section
    doc.rect(currentX, currentY, COLUMN_WIDTHS.gradeSection, TABLE_CONFIG.ROW_HEIGHT);
    const gradeSection = dist.section 
      ? `${dist.student.grade_level}-${dist.section.name}`
      : `Grade ${dist.student.grade_level}`;
    doc.text(gradeSection, currentX + 1, currentY + 4);
    currentX += COLUMN_WIDTHS.gradeSection;

    // Book Title
    doc.rect(currentX, currentY, COLUMN_WIDTHS.bookTitle, TABLE_CONFIG.ROW_HEIGHT);
    const bookTitle = dist.book.title.substring(0, 35);
    doc.text(bookTitle, currentX + 1, currentY + 4);
    currentX += COLUMN_WIDTHS.bookTitle;

    // Date Issued
    doc.rect(currentX, currentY, COLUMN_WIDTHS.dateIssued, TABLE_CONFIG.ROW_HEIGHT);
    const dateIssued = new Date(dist.distributed_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    doc.text(dateIssued, currentX + 1, currentY + 4);
    currentX += COLUMN_WIDTHS.dateIssued;

    // Date Returned
    doc.rect(currentX, currentY, COLUMN_WIDTHS.dateReturned, TABLE_CONFIG.ROW_HEIGHT);
    if (dist.actual_return_date) {
      const dateReturned = new Date(dist.actual_return_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      doc.text(dateReturned, currentX + 1, currentY + 4);
    }
    currentX += COLUMN_WIDTHS.dateReturned;

    // Condition
    doc.rect(currentX, currentY, COLUMN_WIDTHS.condition, TABLE_CONFIG.ROW_HEIGHT);
    const condition = dist.condition_returned || dist.condition_issued;
    doc.text(condition.toUpperCase(), currentX + 1, currentY + 4);
    currentX += COLUMN_WIDTHS.condition;

    // Status
    doc.rect(currentX, currentY, COLUMN_WIDTHS.status, TABLE_CONFIG.ROW_HEIGHT);
    doc.text(dist.distribution_status.toUpperCase(), currentX + 1, currentY + 4);
    currentX += COLUMN_WIDTHS.status;

    // Amount
    doc.rect(currentX, currentY, COLUMN_WIDTHS.amount, TABLE_CONFIG.ROW_HEIGHT);
    if (dist.amount_charged > 0) {
      doc.text(`₱${dist.amount_charged.toFixed(2)}`, currentX + COLUMN_WIDTHS.amount - 2, currentY + 4, { align: 'right' });
    }

    currentY += TABLE_CONFIG.ROW_HEIGHT;
  });

  return currentY;
}

/**
 * Render summary section
 */
function renderSummary(
  doc: jsPDF,
  summary: SF6PDFOptions['summary'],
  startY: number
): void {
  const summaryY = startY + 10;

  doc.setFontSize(FONT_SIZES.BODY);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary:', MARGINS.LEFT, summaryY);

  doc.setFont('helvetica', 'normal');
  let textY = summaryY + 5;
  
  doc.text(`Total Issued: ${summary.total_books_issued}`, MARGINS.LEFT + 5, textY);
  doc.text(`Total Returned: ${summary.total_books_returned}`, MARGINS.LEFT + 60, textY);
  doc.text(`Total Lost: ${summary.total_books_lost}`, MARGINS.LEFT + 115, textY);
  doc.text(`Outstanding: ${summary.total_outstanding}`, MARGINS.LEFT + 170, textY);
  
  textY += 5;
  doc.text(`Total Charged: ₱${summary.total_amount_charged.toFixed(2)}`, MARGINS.LEFT + 5, textY);
  doc.text(`Total Paid: ₱${summary.total_amount_paid.toFixed(2)}`, MARGINS.LEFT + 60, textY);
  doc.text(`Balance: ₱${summary.total_amount_pending.toFixed(2)}`, MARGINS.LEFT + 115, textY);
}

/**
 * Render footer with signature lines
 */
function renderFooter(doc: jsPDF, preparedBy: string): void {
  const footerY = PAGE_CONFIG.HEIGHT - MARGINS.BOTTOM - 15;

  doc.setFontSize(FONT_SIZES.SMALL);
  doc.setFont('helvetica', 'normal');

  // Prepared by (left)
  doc.text('Prepared by:', MARGINS.LEFT + 30, footerY);
  doc.line(MARGINS.LEFT + 20, footerY + 8, MARGINS.LEFT + 90, footerY + 8);
  doc.text(preparedBy, MARGINS.LEFT + 55, footerY + 11, { align: 'center' });
  doc.text('Librarian/Teacher', MARGINS.LEFT + 55, footerY + 14, { align: 'center' });

  // Noted by (right)
  doc.text('Noted by:', PAGE_CONFIG.WIDTH - MARGINS.RIGHT - 60, footerY);
  doc.line(PAGE_CONFIG.WIDTH - MARGINS.RIGHT - 70, footerY + 8, PAGE_CONFIG.WIDTH - MARGINS.RIGHT, footerY + 8);
  doc.text('School Head', PAGE_CONFIG.WIDTH - MARGINS.RIGHT - 35, footerY + 14, { align: 'center' });
}

/**
 * Generate SF6 PDF
 */
export async function generateSF6PDF(options: SF6PDFOptions): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: PAGE_CONFIG.ORIENTATION,
    unit: PAGE_CONFIG.UNIT,
    format: PAGE_CONFIG.FORMAT,
  });

  const logos = await loadLogos().catch(() => {
    console.warn('Logo loading failed, PDF will render without logos');
    return null;
  });
  
  renderLogos(doc, logos, PAGE_CONFIG.WIDTH);
  renderHeader(doc, PAGE_CONFIG.WIDTH);
  renderSchoolInfoFields(doc, options.schoolInfo, options);
  
  const tableStartY = renderTableHeaders(doc);
  const tableEndY = renderTableRows(doc, options.distributions, tableStartY, logos);
  
  renderSummary(doc, options.summary, tableEndY);
  renderFooter(doc, options.preparedBy);

  return doc;
}

/**
 * Download SF6 PDF
 */
export async function downloadSF6PDF(options: SF6PDFOptions): Promise<void> {
  const doc = await generateSF6PDF(options);
  const gradeText = options.gradeLevel ? `Grade${options.gradeLevel}` : 'AllGrades';
  const sectionText = options.section ? `-${options.section.name}` : '';
  const filename = `SF6_TextbookLedger_${gradeText}${sectionText}_${options.schoolYear.replace(/\//g, '-')}.pdf`;
  doc.save(filename);
}
