/**
 * Division SF5 PDF Generator - Consolidated Promotion Report
 * 
 * Generates DepEd-compliant Division-level SF5 report summarizing
 * promotion status across all schools in a division
 */

import jsPDF from 'jspdf';
import type { DivisionPromotionAggregate } from '../../services/divisionReportService';
import depedSealUrl from '../../assets/deped-logo.png';
import depedLogoUrl from '../../assets/deped-seal.png';

// Types
export interface DivisionSF5PDFOptions {
  division_name: string;
  region: string;
  school_year: string;
  grading_period: string;
  prepared_by?: string;
  prepared_by_position?: string;
  noted_by?: string;
  noted_by_position?: string;
  date_prepared?: string;
}

// Page Configuration - Legal Portrait
const PAGE_CONFIG = {
  WIDTH: 215.9,
  HEIGHT: 355.6,
  ORIENTATION: 'portrait' as const,
  UNIT: 'mm' as const,
  FORMAT: 'legal' as const,
};

const MARGINS = {
  TOP: 15,
  LEFT: 12,
  RIGHT: 12,
  BOTTOM: 15,
};

const LOGO_CONFIG = {
  HEIGHT: 15,
  Y_POSITION: 3,
  MARGIN: 5,
};

const FONT_SIZES = {
  TITLE: 12,
  SUBTITLE: 10,
  SECTION: 9,
  HEADER: 8,
  BODY: 7,
  SMALL: 6,
};

const COLORS = {
  HEADER_BG: [240, 240, 240] as [number, number, number],
  BORDER: [0, 0, 0] as [number, number, number],
  PRIMARY: [0, 71, 171] as [number, number, number],
};

/**
 * Load logo images
 */
async function loadLogos(): Promise<{ seal: HTMLImageElement; logo: HTMLImageElement }> {
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
 * Render header with DepEd logos
 */
function renderHeader(
  doc: jsPDF,
  logos: { seal: HTMLImageElement; logo: HTMLImageElement },
  options: DivisionSF5PDFOptions
): number {
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
  doc.text('DIVISION CONSOLIDATED SF5', pageWidth / 2, 22, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SIZES.BODY);
  doc.text('Summarized Report on Promotion and Level of Proficiency', pageWidth / 2, 27, { align: 'center' });

  // Division info
  let y = 35;
  const lineHeight = 5;

  doc.setFontSize(FONT_SIZES.BODY);
  doc.text(`Division: ${options.division_name}`, MARGINS.LEFT, y);
  doc.text(`School Year: ${options.school_year}`, pageWidth - MARGINS.RIGHT - 50, y);

  y += lineHeight;
  doc.text(`Region: ${options.region || 'Region XI'}`, MARGINS.LEFT, y);
  doc.text(`Grading Period: ${options.grading_period?.toUpperCase() || 'FINAL'}`, pageWidth - MARGINS.RIGHT - 50, y);

  y += lineHeight;
  doc.text(`Date Prepared: ${options.date_prepared || new Date().toLocaleDateString()}`, MARGINS.LEFT, y);

  return y + 8;
}

/**
 * Render summary statistics cards
 */
function renderSummaryCards(
  doc: jsPDF,
  y: number,
  data: DivisionPromotionAggregate
): number {
  const cardWidth = 45;
  const cardHeight = 20;
  const startX = MARGINS.LEFT;
  const gap = 3;

  const cards = [
    { label: 'Total Schools', value: data.total_schools.toLocaleString() },
    { label: 'Total Students', value: data.total_students.toLocaleString() },
    { label: 'Promoted', value: data.total_promoted.toLocaleString() },
    { label: 'Promotion Rate', value: `${data.overall_promotion_rate}%` },
  ];

  cards.forEach((card, i) => {
    const x = startX + i * (cardWidth + gap);

    // Card border
    doc.setDrawColor(...COLORS.BORDER);
    doc.setFillColor(...COLORS.HEADER_BG);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');

    // Value
    doc.setFontSize(FONT_SIZES.TITLE);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.PRIMARY);
    doc.text(card.value, x + cardWidth / 2, y + 10, { align: 'center' });

    // Label
    doc.setFontSize(FONT_SIZES.SMALL);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(card.label, x + cardWidth / 2, y + 16, { align: 'center' });
  });

  return y + cardHeight + 8;
}

/**
 * Render section title
 */
function renderSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(...COLORS.PRIMARY);
  doc.rect(MARGINS.LEFT, y, PAGE_CONFIG.WIDTH - MARGINS.LEFT - MARGINS.RIGHT, 6, 'F');

  doc.setFontSize(FONT_SIZES.SECTION);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(title, MARGINS.LEFT + 3, y + 4.5);
  doc.setTextColor(0, 0, 0);

  return y + 10;
}

/**
 * Render promotion by grade level table
 */
function renderByGradeTable(
  doc: jsPDF,
  y: number,
  data: DivisionPromotionAggregate
): number {
  const tableWidth = PAGE_CONFIG.WIDTH - MARGINS.LEFT - MARGINS.RIGHT;
  const colWidths = [30, 25, 25, 25, 35, 25]; // Grade, Total, Promoted, Retained, Cond. Promoted, Rate
  const rowHeight = 6;

  // Headers
  const headers = ['Grade Level', 'Total', 'Promoted', 'Retained', 'Cond. Promoted', 'Rate (%)'];

  doc.setFillColor(...COLORS.HEADER_BG);
  doc.rect(MARGINS.LEFT, y, tableWidth, rowHeight, 'F');

  doc.setFontSize(FONT_SIZES.HEADER);
  doc.setFont('helvetica', 'bold');

  let x = MARGINS.LEFT;
  headers.forEach((header, i) => {
    doc.text(header, x + 2, y + 4);
    x += colWidths[i];
  });

  y += rowHeight;

  // Data rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SIZES.BODY);

  const grades = Object.keys(data.by_grade)
    .map(Number)
    .sort((a, b) => a - b);

  grades.forEach((grade) => {
    const gradeData = data.by_grade[grade];
    x = MARGINS.LEFT;

    // Alternate row coloring
    if (grades.indexOf(grade) % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(MARGINS.LEFT, y, tableWidth, rowHeight, 'F');
    }

    const gradeLabel = grade <= 6 ? `Grade ${grade}` : grade <= 10 ? `Grade ${grade}` : `Grade ${grade}`;
    const values = [
      gradeLabel,
      gradeData.total.toLocaleString(),
      gradeData.promoted.toLocaleString(),
      gradeData.retained.toLocaleString(),
      gradeData.conditionally_promoted.toLocaleString(),
      `${gradeData.promotion_rate}%`,
    ];

    values.forEach((val, i) => {
      doc.text(val, x + 2, y + 4);
      x += colWidths[i];
    });

    y += rowHeight;
  });

  // Draw table border
  doc.setDrawColor(...COLORS.BORDER);
  doc.rect(MARGINS.LEFT, y - (grades.length + 1) * rowHeight, tableWidth, (grades.length + 1) * rowHeight);

  return y + 5;
}

/**
 * Render promotion by district table
 */
function renderByDistrictTable(
  doc: jsPDF,
  y: number,
  data: DivisionPromotionAggregate
): number {
  const tableWidth = PAGE_CONFIG.WIDTH - MARGINS.LEFT - MARGINS.RIGHT;
  const colWidths = [60, 25, 35, 35, 35];
  const rowHeight = 6;

  const headers = ['District', 'Schools', 'Students', 'Promoted', 'Rate (%)'];

  doc.setFillColor(...COLORS.HEADER_BG);
  doc.rect(MARGINS.LEFT, y, tableWidth, rowHeight, 'F');

  doc.setFontSize(FONT_SIZES.HEADER);
  doc.setFont('helvetica', 'bold');

  let x = MARGINS.LEFT;
  headers.forEach((header, i) => {
    doc.text(header, x + 2, y + 4);
    x += colWidths[i];
  });

  y += rowHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SIZES.BODY);

  const districts = Object.entries(data.by_district).sort((a, b) => a[0].localeCompare(b[0]));

  districts.forEach(([district, districtData], index) => {
    x = MARGINS.LEFT;

    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(MARGINS.LEFT, y, tableWidth, rowHeight, 'F');
    }

    const values = [
      district,
      districtData.schools.toLocaleString(),
      districtData.students.toLocaleString(),
      districtData.promoted.toLocaleString(),
      `${districtData.promotion_rate}%`,
    ];

    values.forEach((val, i) => {
      doc.text(val, x + 2, y + 4);
      x += colWidths[i];
    });

    y += rowHeight;
  });

  doc.setDrawColor(...COLORS.BORDER);
  doc.rect(MARGINS.LEFT, y - (districts.length + 1) * rowHeight, tableWidth, (districts.length + 1) * rowHeight);

  return y + 5;
}

/**
 * Render school-by-school summary (compact)
 */
function renderSchoolSummary(
  doc: jsPDF,
  y: number,
  data: DivisionPromotionAggregate
): number {
  const tableWidth = PAGE_CONFIG.WIDTH - MARGINS.LEFT - MARGINS.RIGHT;
  const colWidths = [70, 25, 25, 25, 25, 20];
  const rowHeight = 5;

  const headers = ['School Name', 'Total', 'Promoted', 'Retained', 'Cond.', 'Rate'];

  doc.setFillColor(...COLORS.HEADER_BG);
  doc.rect(MARGINS.LEFT, y, tableWidth, rowHeight, 'F');

  doc.setFontSize(FONT_SIZES.SMALL);
  doc.setFont('helvetica', 'bold');

  let x = MARGINS.LEFT;
  headers.forEach((header, i) => {
    doc.text(header, x + 1, y + 3.5);
    x += colWidths[i];
  });

  y += rowHeight;

  doc.setFont('helvetica', 'normal');

  const schools = data.schools.sort((a, b) => a.school_name.localeCompare(b.school_name));

  schools.forEach((school, index) => {
    // Check if we need a new page
    if (y > PAGE_CONFIG.HEIGHT - MARGINS.BOTTOM - 30) {
      doc.addPage();
      y = MARGINS.TOP;

      // Re-render header on new page
      doc.setFillColor(...COLORS.HEADER_BG);
      doc.rect(MARGINS.LEFT, y, tableWidth, rowHeight, 'F');

      doc.setFontSize(FONT_SIZES.SMALL);
      doc.setFont('helvetica', 'bold');

      x = MARGINS.LEFT;
      headers.forEach((header, i) => {
        doc.text(header, x + 1, y + 3.5);
        x += colWidths[i];
      });

      y += rowHeight;
      doc.setFont('helvetica', 'normal');
    }

    x = MARGINS.LEFT;

    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(MARGINS.LEFT, y, tableWidth, rowHeight, 'F');
    }

    // Truncate school name if too long
    let schoolName = school.school_name;
    if (schoolName.length > 40) {
      schoolName = schoolName.substring(0, 37) + '...';
    }

    const values = [
      schoolName,
      school.total_students.toLocaleString(),
      school.promoted.toLocaleString(),
      school.retained.toLocaleString(),
      school.conditionally_promoted.toLocaleString(),
      `${school.promotion_rate}%`,
    ];

    values.forEach((val, i) => {
      doc.text(val, x + 1, y + 3.5);
      x += colWidths[i];
    });

    y += rowHeight;
  });

  return y + 5;
}

/**
 * Render signature section
 */
function renderSignatures(doc: jsPDF, y: number, options: DivisionSF5PDFOptions): void {
  const pageWidth = PAGE_CONFIG.WIDTH;
  const colWidth = 80;

  // Ensure enough space
  if (y > PAGE_CONFIG.HEIGHT - 50) {
    doc.addPage();
    y = MARGINS.TOP + 20;
  }

  y += 15;

  doc.setFontSize(FONT_SIZES.BODY);
  doc.setFont('helvetica', 'normal');

  // Prepared by
  const prepX = MARGINS.LEFT + 20;
  doc.text('Prepared by:', prepX, y);
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.text(options.prepared_by || '_______________________', prepX, y);
  doc.setFont('helvetica', 'normal');
  y += 4;
  doc.text(options.prepared_by_position || 'Division Planning Officer', prepX, y);

  // Noted by
  const noteX = pageWidth - MARGINS.RIGHT - colWidth;
  y -= 19;
  doc.text('Noted by:', noteX, y);
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.text(options.noted_by || '_______________________', noteX, y);
  doc.setFont('helvetica', 'normal');
  y += 4;
  doc.text(options.noted_by_position || 'Schools Division Superintendent', noteX, y);
}

/**
 * Main PDF generation function
 */
export async function generateDivisionSF5PDF(
  data: DivisionPromotionAggregate,
  options: DivisionSF5PDFOptions
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: PAGE_CONFIG.ORIENTATION,
    unit: PAGE_CONFIG.UNIT,
    format: PAGE_CONFIG.FORMAT,
  });

  const logos = await loadLogos();

  // Page 1: Summary
  let y = renderHeader(doc, logos, options);
  y = renderSummaryCards(doc, y, data);

  y = renderSectionTitle(doc, 'PROMOTION BY GRADE LEVEL', y);
  y = renderByGradeTable(doc, y, data);

  y = renderSectionTitle(doc, 'PROMOTION BY DISTRICT', y);
  y = renderByDistrictTable(doc, y, data);

  // Page 2+: School details
  if (data.schools.length > 0) {
    doc.addPage();
    y = MARGINS.TOP;

    y = renderSectionTitle(doc, 'SCHOOL-BY-SCHOOL SUMMARY', y);
    y = renderSchoolSummary(doc, y, data);
  }

  renderSignatures(doc, y, options);

  return doc;
}

/**
 * Generate and download the PDF
 */
export async function downloadDivisionSF5PDF(
  data: DivisionPromotionAggregate,
  options: DivisionSF5PDFOptions
): Promise<void> {
  const doc = await generateDivisionSF5PDF(data, options);
  const filename = `Division_SF5_${options.division_name.replace(/\s+/g, '_')}_${options.school_year}.pdf`;
  doc.save(filename);
}
