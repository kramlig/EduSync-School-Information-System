/**
 * SF6 PDF Generator - Summarized Report on Promotion and Level of Proficiency
 * Official DepEd Form
 * 
 * Generates DepEd-compliant SF6 report summarizing promotion status and
 * proficiency levels by end of semester/school year
 */

import jsPDF from 'jspdf';
import type { SF6PDFOptions, SF6GradeSummary } from '../../types/sf6Promotion';
import depedSealUrl from '../../assets/deped-logo.png';
import depedLogoUrl from '../../assets/deped-seal.png';

// Page Configuration
const PAGE_CONFIG = {
  WIDTH: 215.9,  // Legal portrait (8.5 inches)
  HEIGHT: 355.6, // Legal portrait (14 inches)
  ORIENTATION: 'portrait' as const,
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
  HEIGHT: 15,
  Y_POSITION: 3,
  MARGIN: 5,
};

// Font Sizes
const FONT_SIZES = {
  TITLE: 14,
  SUBTITLE: 11,
  HEADER: 9,
  BODY: 8,
  SMALL: 7,
};

/**
 * Load and prepare logo images
 */
async function loadLogos() {
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  const [seal, logo] = await Promise.all([
    loadImage(depedSealUrl),
    loadImage(depedLogoUrl),
  ]);

  return { seal, logo };
}

/**
 * Render header with DepEd logos and title
 */
function renderHeader(doc: jsPDF, logos: { seal: HTMLImageElement; logo: HTMLImageElement }) {
  const { seal, logo } = logos;
  const pageWidth = PAGE_CONFIG.WIDTH;

  // DepEd Seal (left)
  const sealWidth = LOGO_CONFIG.HEIGHT * (seal.width / seal.height);
  doc.addImage(seal, 'PNG', LOGO_CONFIG.MARGIN, LOGO_CONFIG.Y_POSITION, sealWidth, LOGO_CONFIG.HEIGHT);

  // DepEd Logo (right)
  const logoWidth = LOGO_CONFIG.HEIGHT * (logo.width / logo.height);
  doc.addImage(logo, 'PNG', pageWidth - logoWidth - LOGO_CONFIG.MARGIN, LOGO_CONFIG.Y_POSITION, logoWidth, LOGO_CONFIG.HEIGHT);

  // Title
  doc.setFontSize(FONT_SIZES.TITLE);
  doc.setFont('helvetica', 'bold');
  doc.text('Republic of the Philippines', pageWidth / 2, 10, { align: 'center' });
  doc.text('Department of Education', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(FONT_SIZES.SUBTITLE);
  doc.text('SCHOOL FORM 6 (SF6)', pageWidth / 2, 21, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SIZES.BODY);
  doc.text('Summarized Report on Promotion and Level of Proficiency', pageWidth / 2, 26, { align: 'center' });
}

/**
 * Render school information fields
 */
function renderSchoolInfo(doc: jsPDF, options: SF6PDFOptions) {
  const y = 32;
  const lineHeight = 5;
  
  doc.setFontSize(FONT_SIZES.BODY);
  doc.setFont('helvetica', 'normal');

  // Row 1
  doc.text(`School: ${options.school_name}`, MARGINS.LEFT, y);
  doc.text(`School Year: ${options.school_year}`, PAGE_CONFIG.WIDTH - MARGINS.RIGHT - 60, y);
  
  // Row 2
  doc.text(`Region: ${options.region || '_______________'}`, MARGINS.LEFT, y + lineHeight);
  doc.text(`Division: ${options.division || '_______________'}`, PAGE_CONFIG.WIDTH / 2 - 20, y + lineHeight);
  
  // Row 3
  doc.text(`District: ${options.district || '_______________'}`, MARGINS.LEFT, y + lineHeight * 2);
  doc.text(`Grading Period: ${options.grading_period.toUpperCase()}`, PAGE_CONFIG.WIDTH - MARGINS.RIGHT - 60, y + lineHeight * 2);
}

/**
 * Render table header
 */
function renderTableHeader(doc: jsPDF, y: number): number {
  const colWidths = {
    grade: 20,
    section: 30,
    total: 20,
    male: 15,
    female: 15,
    promoted: 20,
    retained: 18,
    incomplete: 20,
    rate: 20,
  };

  doc.setFontSize(FONT_SIZES.HEADER);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(230, 230, 230);
  doc.rect(MARGINS.LEFT, y, PAGE_CONFIG.WIDTH - MARGINS.LEFT - MARGINS.RIGHT, 10, 'F');

  let x = MARGINS.LEFT + 2;
  
  doc.text('Grade', x, y + 7);
  x += colWidths.grade;
  
  doc.text('Section', x, y + 7);
  x += colWidths.section;
  
  doc.text('Total', x, y + 7);
  x += colWidths.total;
  
  doc.text('Male', x, y + 7);
  x += colWidths.male;
  
  doc.text('Female', x, y + 7);
  x += colWidths.female;
  
  doc.text('Promoted', x, y + 7);
  x += colWidths.promoted;
  
  doc.text('Retained', x, y + 7);
  x += colWidths.retained;
  
  doc.text('Incomplete', x, y + 7);
  x += colWidths.incomplete;
  
  doc.text('Rate %', x, y + 7);

  return y + 10;
}

/**
 * Render table rows
 */
function renderTableRows(doc: jsPDF, startY: number, data: SF6GradeSummary[]): number {
  const colWidths = {
    grade: 20,
    section: 30,
    total: 20,
    male: 15,
    female: 15,
    promoted: 20,
    retained: 18,
    incomplete: 20,
    rate: 20,
  };

  let y = startY;
  const rowHeight = 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SIZES.BODY);

  data.forEach((row, index) => {
    // Check if we need a new page
    if (y > PAGE_CONFIG.HEIGHT - MARGINS.BOTTOM - 20) {
      doc.addPage();
      y = MARGINS.TOP;
      y = renderTableHeader(doc, y);
    }

    // Alternating row background
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(MARGINS.LEFT, y, PAGE_CONFIG.WIDTH - MARGINS.LEFT - MARGINS.RIGHT, rowHeight, 'F');
    }

    let x = MARGINS.LEFT + 2;
    
    doc.text(`Grade ${row.grade_level}`, x, y + 5);
    x += colWidths.grade;
    
    doc.text(row.section_name || 'All', x, y + 5);
    x += colWidths.section;
    
    doc.text(row.total_learners.toString(), x, y + 5);
    x += colWidths.total;
    
    doc.text(row.male_count.toString(), x, y + 5);
    x += colWidths.male;
    
    doc.text(row.female_count.toString(), x, y + 5);
    x += colWidths.female;
    
    doc.text(row.promoted.toString(), x, y + 5);
    x += colWidths.promoted;
    
    doc.text(row.retained.toString(), x, y + 5);
    x += colWidths.retained;
    
    doc.text(row.incomplete.toString(), x, y + 5);
    x += colWidths.incomplete;
    
    doc.text(`${row.promotion_rate.toFixed(1)}%`, x, y + 5);

    y += rowHeight;
  });

  return y;
}

/**
 * Render summary totals
 */
function renderSummary(doc: jsPDF, y: number, options: SF6PDFOptions) {
  const { summary } = options;
  
  y += 5;
  
  doc.setFontSize(FONT_SIZES.HEADER);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMARY', MARGINS.LEFT, y);
  y += 6;
  
  doc.setFontSize(FONT_SIZES.BODY);
  doc.setFont('helvetica', 'normal');
  
  const lineHeight = 5;
  
  doc.text(`Total Learners: ${summary.total_learners}`, MARGINS.LEFT, y);
  doc.text(`Male: ${summary.total_male}`, MARGINS.LEFT + 60, y);
  doc.text(`Female: ${summary.total_female}`, MARGINS.LEFT + 100, y);
  y += lineHeight;
  
  doc.text(`Promoted: ${summary.total_promoted}`, MARGINS.LEFT, y);
  doc.text(`Retained: ${summary.total_retained}`, MARGINS.LEFT + 60, y);
  doc.text(`Incomplete: ${summary.total_incomplete}`, MARGINS.LEFT + 100, y);
  y += lineHeight;
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Overall Promotion Rate: ${summary.overall_promotion_rate.toFixed(2)}%`, MARGINS.LEFT, y);
  y += lineHeight + 2;
  
  // Proficiency Levels
  doc.setFont('helvetica', 'bold');
  doc.text('PROFICIENCY LEVELS:', MARGINS.LEFT, y);
  y += lineHeight;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Advanced: ${summary.total_advanced || 0}`, MARGINS.LEFT, y);
  doc.text(`Proficient: ${summary.total_proficient || 0}`, MARGINS.LEFT + 60, y);
  y += lineHeight;
  
  doc.text(`Approaching Proficiency: ${summary.total_approaching_proficiency || 0}`, MARGINS.LEFT, y);
  y += lineHeight;
  
  doc.text(`Developing: ${summary.total_developing || 0}`, MARGINS.LEFT, y);
  doc.text(`Beginning: ${summary.total_beginning || 0}`, MARGINS.LEFT + 60, y);
  
  return y;
}

/**
 * Render signature section
 */
function renderSignatures(doc: jsPDF, y: number, options: SF6PDFOptions) {
  y += 15;
  
  doc.setFontSize(FONT_SIZES.BODY);
  doc.setFont('helvetica', 'normal');
  
  const col1 = MARGINS.LEFT + 20;
  const col2 = PAGE_CONFIG.WIDTH - MARGINS.RIGHT - 60;
  
  // Prepared by
  doc.text('Prepared by:', col1, y);
  y += 10;
  doc.line(col1, y, col1 + 50, y);
  y += 4;
  doc.text(options.registrar_name || '__________________', col1, y, { align: 'center', maxWidth: 50 });
  y += 4;
  doc.setFontSize(FONT_SIZES.SMALL);
  doc.text('Registrar/Class Adviser', col1 + 25, y, { align: 'center' });
  
  // Certified by
  y -= 18;
  doc.setFontSize(FONT_SIZES.BODY);
  doc.text('Certified by:', col2, y);
  y += 10;
  doc.line(col2, y, col2 + 50, y);
  y += 4;
  doc.text(options.principal_name || '__________________', col2, y, { align: 'center', maxWidth: 50 });
  y += 4;
  doc.setFontSize(FONT_SIZES.SMALL);
  doc.text('School Principal', col2 + 25, y, { align: 'center' });
}

/**
 * Main function to generate and download SF6 PDF
 */
export async function downloadSF6PDF(options: SF6PDFOptions) {
  const doc = new jsPDF({
    orientation: PAGE_CONFIG.ORIENTATION,
    unit: PAGE_CONFIG.UNIT,
    format: PAGE_CONFIG.FORMAT,
  });

  // Load logos
  const logos = await loadLogos();

  // Render document
  renderHeader(doc, logos);
  renderSchoolInfo(doc, options);
  
  let y = 52;
  y = renderTableHeader(doc, y);
  y = renderTableRows(doc, y, options.summary.by_grade);
  y = renderSummary(doc, y, options);
  renderSignatures(doc, y, options);

  // Download
  const filename = `SF6_Promotion_Summary_${options.school_year}_${options.grading_period}.pdf`;
  doc.save(filename);
}
