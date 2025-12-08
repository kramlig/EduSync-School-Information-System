/**
 * Division SF7 (Personnel Report) PDF Generator
 * 
 * Generates DepEd-compliant SF7 report for division-level personnel data.
 * Uses Legal Portrait (8.5" x 14") format with proper headers and formatting.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DivisionPersonnelAggregate } from '../../services/divisionReportService';
import depedSealUrl from '../../assets/deped-logo.png';
import depedLogoUrl from '../../assets/deped-seal.png';

// Extend jsPDF types for autoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}

export interface DivisionSF7PDFOptions {
  division_name: string;
  region: string;
  school_year: string;
  as_of_date?: string;
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
  MARGIN: {
    TOP: 15,
    BOTTOM: 15,
    LEFT: 12,
    RIGHT: 12,
  },
};

// Colors
const COLORS = {
  PRIMARY: [0, 51, 102] as [number, number, number],
  SECONDARY: [70, 130, 180] as [number, number, number],
  SUCCESS: [34, 139, 34] as [number, number, number],
  WARNING: [255, 165, 0] as [number, number, number],
  HEADER_BG: [240, 248, 255] as [number, number, number],
  LIGHT_GRAY: [245, 245, 245] as [number, number, number],
  TABLE_HEADER: [0, 51, 102] as [number, number, number],
  TABLE_ALT_ROW: [248, 250, 252] as [number, number, number],
};

// Fonts
const FONTS = {
  TITLE: 14,
  SUBTITLE: 11,
  HEADER: 10,
  BODY: 9,
  SMALL: 8,
  TINY: 7,
};

// Position labels for display
const POSITION_LABELS: Record<string, string> = {
  teacher_i: 'Teacher I',
  teacher_ii: 'Teacher II',
  teacher_iii: 'Teacher III',
  master_teacher_i: 'Master Teacher I',
  master_teacher_ii: 'Master Teacher II',
  head_teacher_i: 'Head Teacher I',
  head_teacher_ii: 'Head Teacher II',
  head_teacher_iii: 'Head Teacher III',
  principal_i: 'Principal I',
  principal_ii: 'Principal II',
  principal_iii: 'Principal III',
  principal_iv: 'Principal IV',
  other: 'Other',
};

// Status labels for display
const STATUS_LABELS: Record<string, string> = {
  permanent: 'Permanent',
  temporary: 'Temporary',
  contract: 'Contract of Service',
  substitute: 'Substitute',
  volunteer: 'Volunteer',
};

// Logo configuration
const LOGO_CONFIG = {
  HEIGHT: 18,
  MARGIN: 15,
  Y_POSITION: 8,
};

/**
 * Load logo images using HTMLImageElement
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
 * Add DepEd header with logos and title
 */
const addHeader = async (
  doc: jsPDF,
  options: DivisionSF7PDFOptions
): Promise<number> => {
  const pageWidth = PAGE_CONFIG.WIDTH;
  const margin = PAGE_CONFIG.MARGIN;
  let yPos = margin.TOP;

  // Header background - draw FIRST so logos appear on top
  doc.setFillColor(...COLORS.HEADER_BG);
  doc.rect(margin.LEFT, yPos - 5, pageWidth - margin.LEFT - margin.RIGHT, 35, 'F');

  // Load and add logos AFTER background
  try {
    const { seal, logo } = await loadLogos();
    
    // DepEd Seal (left)
    const sealWidth = LOGO_CONFIG.HEIGHT * (seal.width / seal.height);
    doc.addImage(seal, 'PNG', margin.LEFT + 5, yPos - 2, sealWidth, LOGO_CONFIG.HEIGHT);

    // DepEd Logo (right)
    const logoWidth = LOGO_CONFIG.HEIGHT * (logo.width / logo.height);
    doc.addImage(logo, 'PNG', pageWidth - margin.RIGHT - logoWidth - 5, yPos - 2, logoWidth, LOGO_CONFIG.HEIGHT);
  } catch (err) {
    console.warn('Could not load logos for PDF:', err);
  }

  // Header text (centered)
  const centerX = pageWidth / 2;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONTS.SMALL);
  doc.setTextColor(0, 0, 0);
  doc.text('Republic of the Philippines', centerX, yPos, { align: 'center' });
  
  yPos += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(FONTS.HEADER);
  doc.text('Department of Education', centerX, yPos, { align: 'center' });
  
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONTS.SMALL);
  doc.text(options.region, centerX, yPos, { align: 'center' });
  
  yPos += 4;
  doc.setFont('helvetica', 'bold');
  doc.text(options.division_name, centerX, yPos, { align: 'center' });

  yPos += 10;
  
  // Title
  doc.setFillColor(...COLORS.PRIMARY);
  doc.rect(margin.LEFT, yPos, pageWidth - margin.LEFT - margin.RIGHT, 8, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(FONTS.SUBTITLE);
  doc.setFont('helvetica', 'bold');
  doc.text('SF7 - SCHOOL PERSONNEL REPORT', centerX, yPos + 5.5, { align: 'center' });

  yPos += 12;

  // Report info line
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(FONTS.SMALL);
  doc.setFont('helvetica', 'normal');
  const asOfDate = options.as_of_date || new Date().toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`School Year: ${options.school_year}  |  As of: ${asOfDate}`, centerX, yPos, { align: 'center' });

  return yPos + 8;
};

/**
 * Add summary cards section
 */
const addSummaryCards = (
  doc: jsPDF,
  data: DivisionPersonnelAggregate,
  yPos: number
): number => {
  const margin = PAGE_CONFIG.MARGIN;
  const pageWidth = PAGE_CONFIG.WIDTH;
  const contentWidth = pageWidth - margin.LEFT - margin.RIGHT;
  
  // Card dimensions
  const cardWidth = (contentWidth - 10) / 3;
  const cardHeight = 22;
  
  // Card data
  const cards = [
    {
      title: 'Total Schools',
      value: data.total_schools.toLocaleString(),
      subtitle: `${Object.keys(data.by_district || {}).length} districts`,
      color: COLORS.PRIMARY,
    },
    {
      title: 'Total Personnel',
      value: data.total_personnel.toLocaleString(),
      subtitle: `${Object.keys(data.by_position || {}).length} positions`,
      color: COLORS.SECONDARY,
    },
    {
      title: 'Avg per School',
      value: data.total_schools > 0 
        ? (data.total_personnel / data.total_schools).toFixed(1) 
        : '0',
      subtitle: 'personnel average',
      color: COLORS.SUCCESS,
    },
  ];

  cards.forEach((card, index) => {
    const xPos = margin.LEFT + (index * (cardWidth + 5));
    
    // Card background
    doc.setFillColor(...COLORS.LIGHT_GRAY);
    doc.roundedRect(xPos, yPos, cardWidth, cardHeight, 2, 2, 'F');
    
    // Colored top border
    doc.setFillColor(...card.color);
    doc.rect(xPos, yPos, cardWidth, 2, 'F');
    
    // Card content
    doc.setTextColor(...card.color);
    doc.setFontSize(FONTS.TINY);
    doc.setFont('helvetica', 'bold');
    doc.text(card.title.toUpperCase(), xPos + cardWidth / 2, yPos + 6, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(FONTS.TITLE);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, xPos + cardWidth / 2, yPos + 14, { align: 'center' });
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(FONTS.TINY);
    doc.setFont('helvetica', 'normal');
    doc.text(card.subtitle, xPos + cardWidth / 2, yPos + 19, { align: 'center' });
  });

  return yPos + cardHeight + 8;
};

/**
 * Add position breakdown table
 */
const addPositionTable = (
  doc: jsPDF,
  data: DivisionPersonnelAggregate,
  yPos: number
): number => {
  const margin = PAGE_CONFIG.MARGIN;
  const pageWidth = PAGE_CONFIG.WIDTH;

  // Section title
  doc.setFillColor(...COLORS.SECONDARY);
  doc.rect(margin.LEFT, yPos, pageWidth - margin.LEFT - margin.RIGHT, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(FONTS.SMALL);
  doc.setFont('helvetica', 'bold');
  doc.text('PERSONNEL BY POSITION', margin.LEFT + 4, yPos + 4);

  yPos += 8;

  // Prepare table data - sort by count descending
  const positionEntries = Object.entries(data.by_position || {})
    .map(([key, count]) => ({
      position: POSITION_LABELS[key] || key,
      count,
      percentage: data.total_personnel > 0 
        ? ((count / data.total_personnel) * 100).toFixed(1) + '%'
        : '0%',
    }))
    .sort((a, b) => b.count - a.count);

  const tableData = positionEntries.map((item, index) => [
    (index + 1).toString(),
    item.position,
    item.count.toLocaleString(),
    item.percentage,
  ]);

  // Add total row
  tableData.push([
    '',
    'TOTAL',
    data.total_personnel.toLocaleString(),
    '100%',
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Position', 'Count', '%']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.TABLE_HEADER,
      textColor: [255, 255, 255],
      fontSize: FONTS.SMALL,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: FONTS.SMALL,
      cellPadding: 1.5,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 'auto' },
      2: { halign: 'right', cellWidth: 25 },
      3: { halign: 'right', cellWidth: 20 },
    },
    alternateRowStyles: {
      fillColor: COLORS.TABLE_ALT_ROW,
    },
    margin: { left: margin.LEFT, right: margin.RIGHT },
    tableWidth: (pageWidth - margin.LEFT - margin.RIGHT) / 2 - 3,
    didParseCell: (hookData) => {
      // Style total row
      if (hookData.row.index === tableData.length - 1) {
        hookData.cell.styles.fontStyle = 'bold';
        hookData.cell.styles.fillColor = COLORS.HEADER_BG;
      }
    },
  });

  return doc.lastAutoTable?.finalY || yPos + 50;
};

/**
 * Add employment status breakdown table
 */
const addStatusTable = (
  doc: jsPDF,
  data: DivisionPersonnelAggregate,
  startY: number
): number => {
  const margin = PAGE_CONFIG.MARGIN;
  const pageWidth = PAGE_CONFIG.WIDTH;
  const xPos = margin.LEFT + (pageWidth - margin.LEFT - margin.RIGHT) / 2 + 3;
  const tableY = startY + 8; // After section title space

  // Prepare table data
  const statusEntries = Object.entries(data.by_status || {})
    .map(([key, count]) => ({
      status: STATUS_LABELS[key] || key,
      count,
      percentage: data.total_personnel > 0 
        ? ((count / data.total_personnel) * 100).toFixed(1) + '%'
        : '0%',
    }))
    .sort((a, b) => b.count - a.count);

  const tableData = statusEntries.map((item, index) => [
    (index + 1).toString(),
    item.status,
    item.count.toLocaleString(),
    item.percentage,
  ]);

  // Add total row
  tableData.push([
    '',
    'TOTAL',
    data.total_personnel.toLocaleString(),
    '100%',
  ]);

  autoTable(doc, {
    startY: tableY,
    head: [['#', 'Employment Status', 'Count', '%']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.TABLE_HEADER,
      textColor: [255, 255, 255],
      fontSize: FONTS.SMALL,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: FONTS.SMALL,
      cellPadding: 1.5,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 'auto' },
      2: { halign: 'right', cellWidth: 25 },
      3: { halign: 'right', cellWidth: 20 },
    },
    alternateRowStyles: {
      fillColor: COLORS.TABLE_ALT_ROW,
    },
    margin: { left: xPos, right: margin.RIGHT },
    tableWidth: (pageWidth - margin.LEFT - margin.RIGHT) / 2 - 3,
    didParseCell: (hookData) => {
      // Style total row
      if (hookData.row.index === tableData.length - 1) {
        hookData.cell.styles.fontStyle = 'bold';
        hookData.cell.styles.fillColor = COLORS.HEADER_BG;
      }
    },
  });

  return doc.lastAutoTable?.finalY || tableY + 40;
};

/**
 * Add district breakdown table
 */
const addDistrictTable = (
  doc: jsPDF,
  data: DivisionPersonnelAggregate,
  yPos: number
): number => {
  const margin = PAGE_CONFIG.MARGIN;
  const pageWidth = PAGE_CONFIG.WIDTH;

  // Section title
  doc.setFillColor(...COLORS.SECONDARY);
  doc.rect(margin.LEFT, yPos, pageWidth - margin.LEFT - margin.RIGHT, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(FONTS.SMALL);
  doc.setFont('helvetica', 'bold');
  doc.text('PERSONNEL BY DISTRICT', margin.LEFT + 4, yPos + 4);

  yPos += 8;

  // Prepare table data - sort by personnel count descending
  const districtEntries = Object.entries(data.by_district || {})
    .map(([name, info]) => ({
      name: name || 'No District',
      schools: info.schools,
      personnel: info.personnel,
      avgPerSchool: info.schools > 0 ? (info.personnel / info.schools).toFixed(1) : '0',
    }))
    .sort((a, b) => b.personnel - a.personnel);

  const tableData = districtEntries.map((item, index) => [
    (index + 1).toString(),
    item.name,
    item.schools.toLocaleString(),
    item.personnel.toLocaleString(),
    item.avgPerSchool,
  ]);

  // Add total row
  tableData.push([
    '',
    'TOTAL',
    data.total_schools.toLocaleString(),
    data.total_personnel.toLocaleString(),
    data.total_schools > 0 ? (data.total_personnel / data.total_schools).toFixed(1) : '0',
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'District', 'Schools', 'Personnel', 'Avg/School']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.TABLE_HEADER,
      textColor: [255, 255, 255],
      fontSize: FONTS.SMALL,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: FONTS.SMALL,
      cellPadding: 2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 'auto' },
      2: { halign: 'right', cellWidth: 25 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 25 },
    },
    alternateRowStyles: {
      fillColor: COLORS.TABLE_ALT_ROW,
    },
    margin: { left: margin.LEFT, right: margin.RIGHT },
    didParseCell: (hookData) => {
      // Style total row
      if (hookData.row.index === tableData.length - 1) {
        hookData.cell.styles.fontStyle = 'bold';
        hookData.cell.styles.fillColor = COLORS.HEADER_BG;
      }
    },
  });

  return doc.lastAutoTable?.finalY || yPos + 50;
};

/**
 * Add school-by-school breakdown table
 */
const addSchoolTable = (
  doc: jsPDF,
  data: DivisionPersonnelAggregate,
  yPos: number
): number => {
  const margin = PAGE_CONFIG.MARGIN;
  const pageWidth = PAGE_CONFIG.WIDTH;

  // Check if we need a new page
  if (yPos > PAGE_CONFIG.HEIGHT - 100) {
    doc.addPage();
    yPos = margin.TOP;
  }

  // Section title
  doc.setFillColor(...COLORS.SECONDARY);
  doc.rect(margin.LEFT, yPos, pageWidth - margin.LEFT - margin.RIGHT, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(FONTS.SMALL);
  doc.setFont('helvetica', 'bold');
  doc.text('SCHOOL-BY-SCHOOL PERSONNEL SUMMARY', margin.LEFT + 4, yPos + 4);

  yPos += 8;

  // Get position keys for columns (top 5 positions)
  const topPositions = Object.entries(data.by_position || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key]) => key);

  // Sort schools by personnel count descending
  const sortedSchools = [...(data.schools || [])]
    .sort((a, b) => b.total_personnel - a.total_personnel)
    .slice(0, 50); // Limit to 50 schools for space

  // Create abbreviated but unique position headers
  const getPositionAbbrev = (pos: string): string => {
    const abbrevMap: Record<string, string> = {
      teacher_i: 'T-I',
      teacher_ii: 'T-II',
      teacher_iii: 'T-III',
      master_teacher_i: 'MT-I',
      master_teacher_ii: 'MT-II',
      head_teacher_i: 'HT-I',
      head_teacher_ii: 'HT-II',
      head_teacher_iii: 'HT-III',
      principal_i: 'P-I',
      principal_ii: 'P-II',
      principal_iii: 'P-III',
      principal_iv: 'P-IV',
      other: 'Other',
    };
    return abbrevMap[pos] || pos.slice(0, 6);
  };

  const headers = [
    '#',
    'School Name',
    'District',
    'Total',
    ...topPositions.map(p => getPositionAbbrev(p)),
  ];

  const tableData = sortedSchools.map((school, index) => [
    (index + 1).toString(),
    school.school_name.length > 30 
      ? school.school_name.substring(0, 28) + '...' 
      : school.school_name,
    school.district || '-',
    school.total_personnel.toString(),
    ...topPositions.map(p => (school.by_position[p] || 0).toString()),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [headers],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.TABLE_HEADER,
      textColor: [255, 255, 255],
      fontSize: FONTS.TINY,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 1,
    },
    bodyStyles: {
      fontSize: FONTS.TINY,
      cellPadding: 1,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'left', cellWidth: 55 },
      2: { halign: 'left', cellWidth: 25 },
      3: { halign: 'right', cellWidth: 15 },
    },
    alternateRowStyles: {
      fillColor: COLORS.TABLE_ALT_ROW,
    },
    margin: { left: margin.LEFT, right: margin.RIGHT },
    showFoot: 'lastPage',
  });

  return doc.lastAutoTable?.finalY || yPos + 100;
};

/**
 * Add signatures section
 */
const addSignatures = (
  doc: jsPDF,
  options: DivisionSF7PDFOptions,
  yPos: number
): void => {
  const margin = PAGE_CONFIG.MARGIN;
  const pageWidth = PAGE_CONFIG.WIDTH;

  // Check if we need a new page
  if (yPos > PAGE_CONFIG.HEIGHT - 50) {
    doc.addPage();
    yPos = margin.TOP + 10;
  } else {
    yPos += 15;
  }

  const colWidth = (pageWidth - margin.LEFT - margin.RIGHT) / 2;

  // Prepared by
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(FONTS.SMALL);
  doc.setFont('helvetica', 'normal');
  doc.text('Prepared by:', margin.LEFT, yPos);
  
  yPos += 12;
  doc.setFont('helvetica', 'bold');
  doc.text(options.prepared_by || '____________________', margin.LEFT, yPos);
  doc.line(margin.LEFT, yPos + 1, margin.LEFT + 60, yPos + 1);
  
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONTS.TINY);
  doc.text(options.prepared_by_position || 'Position', margin.LEFT, yPos);

  // Noted by (right side)
  const rightX = margin.LEFT + colWidth + 20;
  yPos -= 16;
  
  doc.setFontSize(FONTS.SMALL);
  doc.text('Noted by:', rightX, yPos);
  
  yPos += 12;
  doc.setFont('helvetica', 'bold');
  doc.text(options.noted_by || '____________________', rightX, yPos);
  doc.line(rightX, yPos + 1, rightX + 60, yPos + 1);
  
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONTS.TINY);
  doc.text(options.noted_by_position || 'Schools Division Superintendent', rightX, yPos);

  // Date
  yPos += 10;
  doc.setFontSize(FONTS.SMALL);
  const datePrepared = options.date_prepared || new Date().toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Date: ${datePrepared}`, margin.LEFT, yPos);
};

/**
 * Add page footer
 */
const addFooter = (doc: jsPDF, pageNumber: number, totalPages: number): void => {
  const margin = PAGE_CONFIG.MARGIN;
  const pageWidth = PAGE_CONFIG.WIDTH;
  const pageHeight = PAGE_CONFIG.HEIGHT;

  doc.setFontSize(FONTS.TINY);
  doc.setTextColor(128, 128, 128);
  doc.setFont('helvetica', 'normal');

  // Page number
  doc.text(
    `Page ${pageNumber} of ${totalPages}`,
    pageWidth / 2,
    pageHeight - margin.BOTTOM + 5,
    { align: 'center' }
  );

  // Generation timestamp
  doc.text(
    `Generated: ${new Date().toLocaleString('en-PH')}`,
    margin.LEFT,
    pageHeight - margin.BOTTOM + 5
  );

  // System name
  doc.text(
    'EduSync SIS',
    pageWidth - margin.RIGHT,
    pageHeight - margin.BOTTOM + 5,
    { align: 'right' }
  );
};

/**
 * Main function to generate Division SF7 PDF
 */
export async function generateDivisionSF7PDF(
  data: DivisionPersonnelAggregate,
  options: DivisionSF7PDFOptions
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: PAGE_CONFIG.ORIENTATION,
    unit: PAGE_CONFIG.UNIT,
    format: [PAGE_CONFIG.WIDTH, PAGE_CONFIG.HEIGHT],
  });

  // Add header
  let yPos = await addHeader(doc, options);

  // Add summary cards
  yPos = addSummaryCards(doc, data, yPos);

  // Add position table (left side)
  const positionTableY = addPositionTable(doc, data, yPos);

  // Add status table (right side, same starting Y)
  addStatusTable(doc, data, yPos);

  // Continue from whichever table is taller
  yPos = positionTableY + 10;

  // Add district breakdown
  yPos = addDistrictTable(doc, data, yPos);

  // Add school-by-school breakdown
  yPos = addSchoolTable(doc, data, yPos);

  // Add signatures
  addSignatures(doc, options, yPos);

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  return doc;
}

/**
 * Convenience function to generate and download PDF
 */
export async function downloadDivisionSF7PDF(
  data: DivisionPersonnelAggregate,
  options: DivisionSF7PDFOptions
): Promise<void> {
  const doc = await generateDivisionSF7PDF(data, options);
  const filename = `division-sf7-${options.school_year}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
