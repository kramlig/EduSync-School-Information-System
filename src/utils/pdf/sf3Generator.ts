/**
 * SF3 PDF Generator - School Register of Books and Other Instructional Materials
 * Generates DepEd-compliant SF3 report for book inventory and issuance tracking
 */

import jsPDF from 'jspdf';
import type { SF3PDFOptions, BookWithStats } from '../../types/bookManagement';
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
  number: 13,
  bookNumber: 24,
  title: 75,
  author: 43,
  publisher: 40,
  subject: 30,
  grade: 19,
  total: 19,
  available: 19,
  issued: 19,
  condition: 24.6,
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
  doc.text('SCHOOL FORM 3 (SF3)', centerX, 23, { align: 'center' });
  
  doc.setFontSize(FONT_SIZES.SUBTITLE);
  doc.text('School Register of Books and Other Instructional Materials', centerX, 28, { align: 'center' });
  
  doc.setFontSize(FONT_SIZES.SMALL);
  doc.setFont('helvetica', 'normal');
  doc.text('(to be accomplished at the end of the school year)', centerX, 32, { align: 'center' });
}

/**
 * Render school information fields
 */
function renderSchoolInfoFields(doc: jsPDF, schoolInfo: SF3PDFOptions['schoolInfo'], options: SF3PDFOptions): void {
  const leftMargin = MARGINS.LEFT;
  const rightMargin = PAGE_CONFIG.WIDTH - MARGINS.RIGHT;
  let fieldY = 38;

  doc.setFontSize(FONT_SIZES.BODY);
  doc.setFont('helvetica', 'normal');

  // Row 1: School, School ID
  doc.text('School:', leftMargin, fieldY);
  doc.rect(leftMargin + FIELD_CONFIG.LABEL_OFFSET, fieldY - 4, 150, FIELD_CONFIG.BOX_HEIGHT);
  doc.text(schoolInfo.name, leftMargin + FIELD_CONFIG.VALUE_OFFSET, fieldY);

  doc.text('School ID:', rightMargin - 110, fieldY);
  doc.rect(rightMargin - 85, fieldY - 4, 85, FIELD_CONFIG.BOX_HEIGHT);
  doc.text(schoolInfo.schoolId, rightMargin - 83, fieldY);

  fieldY += 8;

  // Row 2: Division, District
  doc.text('Division:', leftMargin, fieldY);
  doc.rect(leftMargin + FIELD_CONFIG.LABEL_OFFSET, fieldY - 4, 100, FIELD_CONFIG.BOX_HEIGHT);
  doc.text(schoolInfo.division, leftMargin + FIELD_CONFIG.VALUE_OFFSET, fieldY);

  doc.text('District:', leftMargin + 125, fieldY);
  doc.rect(leftMargin + 145, fieldY - 4, 100, FIELD_CONFIG.BOX_HEIGHT);
  doc.text(schoolInfo.district, leftMargin + 147, fieldY);

  fieldY += 8;

  // Row 3: School Year, Category/Subject/Grade filters
  doc.text('School Year:', leftMargin, fieldY);
  doc.rect(leftMargin + 25, fieldY - 4, 40, FIELD_CONFIG.BOX_HEIGHT);
  doc.text(options.schoolYear, leftMargin + 27, fieldY);

  if (options.category) {
    doc.text('Category:', leftMargin + 75, fieldY);
    doc.rect(leftMargin + 95, fieldY - 4, 50, FIELD_CONFIG.BOX_HEIGHT);
    doc.text(options.category, leftMargin + 97, fieldY);
  }

  if (options.subject) {
    doc.text('Subject:', leftMargin + 155, fieldY);
    doc.rect(leftMargin + 175, fieldY - 4, 50, FIELD_CONFIG.BOX_HEIGHT);
    doc.text(options.subject, leftMargin + 177, fieldY);
  }

  if (options.gradeLevel) {
    doc.text('Grade Level:', rightMargin - 85, fieldY);
    doc.rect(rightMargin - 50, fieldY - 4, 50, FIELD_CONFIG.BOX_HEIGHT);
    doc.text(`Grade ${options.gradeLevel}`, rightMargin - 48, fieldY);
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
    { text: 'Book Number', width: COLUMN_WIDTHS.bookNumber },
    { text: 'Title of Book/Material', width: COLUMN_WIDTHS.title },
    { text: 'Author', width: COLUMN_WIDTHS.author },
    { text: 'Publisher', width: COLUMN_WIDTHS.publisher },
    { text: 'Subject', width: COLUMN_WIDTHS.subject },
    { text: 'Grade', width: COLUMN_WIDTHS.grade },
    { text: 'Total', width: COLUMN_WIDTHS.total },
    { text: 'Available', width: COLUMN_WIDTHS.available },
    { text: 'Issued', width: COLUMN_WIDTHS.issued },
    { text: 'Condition', width: COLUMN_WIDTHS.condition },
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
 * Render table rows
 */
function renderTableRows(doc: jsPDF, books: BookWithStats[], startY: number): number {
  let currentY = startY;
  const maxY = PAGE_CONFIG.HEIGHT - MARGINS.BOTTOM - 20;

  doc.setFontSize(FONT_SIZES.BODY);
  doc.setFont('helvetica', 'normal');

  books.forEach((book, index) => {
    if (currentY > maxY) {
      doc.addPage();
      currentY = renderTableHeaders(doc);
    }

    let currentX = MARGINS.LEFT;

    const rowData = [
      { value: (index + 1).toString(), width: COLUMN_WIDTHS.number },
      { value: book.book_number || '-', width: COLUMN_WIDTHS.bookNumber },
      { value: book.title, width: COLUMN_WIDTHS.title },
      { value: book.author || '-', width: COLUMN_WIDTHS.author },
      { value: book.publisher || '-', width: COLUMN_WIDTHS.publisher },
      { value: book.subject || '-', width: COLUMN_WIDTHS.subject },
      { value: book.grade_level ? `Grade ${book.grade_level}` : '-', width: COLUMN_WIDTHS.grade },
      { value: book.total_copies.toString(), width: COLUMN_WIDTHS.total },
      { value: book.available_copies.toString(), width: COLUMN_WIDTHS.available },
      { value: book.issued_count.toString(), width: COLUMN_WIDTHS.issued },
      { value: book.condition, width: COLUMN_WIDTHS.condition },
    ];

    rowData.forEach(({ value, width }) => {
      doc.rect(currentX, currentY, width, TABLE_CONFIG.ROW_HEIGHT);
      
      // Truncate long text
      const maxWidth = width - 2;
      const truncated = doc.getTextWidth(value) > maxWidth 
        ? value.substring(0, Math.floor(value.length * maxWidth / doc.getTextWidth(value))) + '...'
        : value;
      
      doc.text(truncated, currentX + 1, currentY + 4);
      currentX += width;
    });

    currentY += TABLE_CONFIG.ROW_HEIGHT;
  });

  return currentY;
}

/**
 * Render summary statistics
 */
function renderSummary(doc: jsPDF, books: BookWithStats[], currentY: number): void {
  const summaryY = currentY + 10;
  
  const totalBooks = books.length;
  const totalCopies = books.reduce((sum, b) => sum + b.total_copies, 0);
  const totalAvailable = books.reduce((sum, b) => sum + b.available_copies, 0);
  const totalIssued = books.reduce((sum, b) => sum + b.issued_count, 0);
  const totalLost = books.reduce((sum, b) => sum + b.lost_count, 0);
  const totalDamaged = books.reduce((sum, b) => sum + b.damaged_count, 0);

  doc.setFontSize(FONT_SIZES.BODY);
  doc.setFont('helvetica', 'bold');
  
  doc.text('SUMMARY STATISTICS:', MARGINS.LEFT, summaryY);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Books: ${totalBooks}`, MARGINS.LEFT, summaryY + 6);
  doc.text(`Total Copies: ${totalCopies}`, MARGINS.LEFT, summaryY + 12);
  doc.text(`Available: ${totalAvailable}`, MARGINS.LEFT + 80, summaryY + 6);
  doc.text(`Issued: ${totalIssued}`, MARGINS.LEFT + 80, summaryY + 12);
  doc.text(`Lost: ${totalLost}`, MARGINS.LEFT + 140, summaryY + 6);
  doc.text(`Damaged: ${totalDamaged}`, MARGINS.LEFT + 140, summaryY + 12);
}

/**
 * Render footer
 */
function renderFooter(doc: jsPDF): void {
  const footerY = PAGE_CONFIG.HEIGHT - 15;
  
  doc.setFontSize(FONT_SIZES.SMALL);
  doc.setFont('helvetica', 'italic');
  
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  doc.text(`Generated on: ${today}`, MARGINS.LEFT, footerY);
  doc.text('Page ' + doc.getCurrentPageInfo().pageNumber, PAGE_CONFIG.WIDTH - MARGINS.RIGHT - 20, footerY);
}

/**
 * Generate SF3 PDF
 */
export async function generateSF3PDF(
  books: BookWithStats[],
  options: SF3PDFOptions
): Promise<jsPDF> {
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
  const tableEndY = renderTableRows(doc, books, tableStartY);
  
  renderSummary(doc, books, tableEndY);
  renderFooter(doc);

  return doc;
}

/**
 * Download SF3 PDF
 */
export async function downloadSF3PDF(
  books: BookWithStats[],
  options: SF3PDFOptions
): Promise<void> {
  const doc = await generateSF3PDF(books, options);
  
  const filename = `SF3_${options.schoolInfo.schoolId}_${options.schoolYear.replace('/', '-')}_${Date.now()}.pdf`;
  doc.save(filename);
}
