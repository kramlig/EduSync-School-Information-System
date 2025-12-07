/**
 * Facilities Inventory PDF Generator (Custom Management Tool)
 * 
 * NOTE: This is a custom school management tool, not an official DepEd form.
 * Official DepEd SF7 is "School Personnel Assignment List and Basic Profile"
 * 
 * Generates comprehensive facilities and maintenance tracking reports
 */

import jsPDF from 'jspdf';
import type { SF7PDFOptions, Facility } from '../../types/facilities';
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
  START_Y: 60,
  ROW_HEIGHT: 6,
  HEADER_HEIGHT: 12,
};

// Column Widths (Total: 325.6mm available width = 355.6mm page - 30mm margins)
const COLUMN_WIDTHS = {
  number: 13,
  name: 65,
  type: 30,
  building: 35,
  room: 20,
  capacity: 20,
  area: 20,
  condition: 30,
  status: 30,
  value: 32.6,
};

interface LogoImages {
  seal: { data: string; width: number; height: number };
  logo: { data: string; width: number; height: number };
}

/**
 * Load logo images
 */
async function loadLogos(): Promise<LogoImages> {
  const loadImage = (url: string): Promise<{ data: string; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Draw white background first
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        resolve({
          data: canvas.toDataURL('image/png'),
          width: img.width,
          height: img.height,
        });
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
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
 * Render header with logos and title
 */
function renderHeader(doc: jsPDF, logos: LogoImages) {
  const { seal, logo } = logos;
  const pageWidth = PAGE_CONFIG.WIDTH;
  
  // Calculate logo widths maintaining aspect ratio
  const sealWidth = (seal.width / seal.height) * LOGO_CONFIG.HEIGHT;
  const logoWidth = (logo.width / logo.height) * LOGO_CONFIG.HEIGHT;
  
  // Draw DepEd seal (left)
  const sealX = MARGINS.LEFT;
  doc.addImage(
    seal.data,
    'PNG',
    sealX,
    LOGO_CONFIG.Y_POSITION,
    sealWidth,
    LOGO_CONFIG.HEIGHT
  );
  
  // Draw school logo (right)
  const logoX = pageWidth - MARGINS.RIGHT - logoWidth;
  doc.addImage(
    logo.data,
    'PNG',
    logoX,
    LOGO_CONFIG.Y_POSITION,
    logoWidth,
    LOGO_CONFIG.HEIGHT
  );
  
  // Title section (centered)
  const centerX = pageWidth / 2;
  let yPos = 8;
  
  doc.setFontSize(FONT_SIZES.TITLE);
  doc.setFont('helvetica', 'bold');
  doc.text('SCHOOL FORM 7 (SF7)', centerX, yPos, { align: 'center' });
  
  yPos += 5;
  doc.setFontSize(FONT_SIZES.SUBTITLE);
  doc.text('School Building and Facilities Inventory', centerX, yPos, { align: 'center' });
}

/**
 * Render school information boxes
 */
function renderSchoolInfo(doc: jsPDF, options: SF7PDFOptions) {
  const { schoolInfo, reportDate } = options;
  let yPos = 25;
  const boxHeight = FIELD_CONFIG.BOX_HEIGHT;
  const fieldWidth = 95;
  
  doc.setFontSize(FONT_SIZES.HEADER);
  doc.setFont('helvetica', 'normal');
  
  // Row 1: School ID, Report Date, Region
  let xPos = MARGINS.LEFT;
  
  // School ID
  doc.rect(xPos, yPos, fieldWidth, boxHeight);
  doc.setFont('helvetica', 'bold');
  doc.text('SCHOOL ID:', xPos + 2, yPos + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolInfo.schoolId, xPos + 25, yPos + 4);
  
  xPos += fieldWidth + 5;
  
  // Report Date
  doc.rect(xPos, yPos, fieldWidth, boxHeight);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORT DATE:', xPos + 2, yPos + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(reportDate, xPos + 30, yPos + 4);
  
  xPos += fieldWidth + 5;
  
  // Region
  doc.rect(xPos, yPos, fieldWidth, boxHeight);
  doc.setFont('helvetica', 'bold');
  doc.text('REGION:', xPos + 2, yPos + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolInfo.region, xPos + 20, yPos + 4);
  
  // Row 2: School Name, Division, District
  yPos += boxHeight + 2;
  xPos = MARGINS.LEFT;
  
  // School Name (wider)
  const wideFieldWidth = 145;
  doc.rect(xPos, yPos, wideFieldWidth, boxHeight);
  doc.setFont('helvetica', 'bold');
  doc.text('NAME OF SCHOOL:', xPos + 2, yPos + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolInfo.name, xPos + 38, yPos + 4);
  
  xPos += wideFieldWidth + 5;
  
  // Division
  doc.rect(xPos, yPos, fieldWidth, boxHeight);
  doc.setFont('helvetica', 'bold');
  doc.text('DIVISION:', xPos + 2, yPos + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolInfo.division, xPos + 22, yPos + 4);
  
  xPos += fieldWidth + 5;
  
  // District
  const districtWidth = 45;
  doc.rect(xPos, yPos, districtWidth, boxHeight);
  doc.setFont('helvetica', 'bold');
  doc.text('DISTRICT:', xPos + 2, yPos + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolInfo.district || 'N/A', xPos + 20, yPos + 4);
}

/**
 * Render table header
 */
function renderTableHeader(doc: jsPDF, yPos: number): number {
  const startX = MARGINS.LEFT;
  let currentX = startX;
  
  doc.setFontSize(FONT_SIZES.HEADER);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  
  // Draw header background
  doc.rect(startX, yPos, PAGE_CONFIG.WIDTH - MARGINS.LEFT - MARGINS.RIGHT, TABLE_CONFIG.HEADER_HEIGHT, 'F');
  doc.rect(startX, yPos, PAGE_CONFIG.WIDTH - MARGINS.LEFT - MARGINS.RIGHT, TABLE_CONFIG.HEADER_HEIGHT, 'S');
  
  const headers = [
    { text: 'No.', width: COLUMN_WIDTHS.number },
    { text: 'Facility Name', width: COLUMN_WIDTHS.name },
    { text: 'Type', width: COLUMN_WIDTHS.type },
    { text: 'Building', width: COLUMN_WIDTHS.building },
    { text: 'Room No.', width: COLUMN_WIDTHS.room },
    { text: 'Capacity', width: COLUMN_WIDTHS.capacity },
    { text: 'Area (m²)', width: COLUMN_WIDTHS.area },
    { text: 'Condition', width: COLUMN_WIDTHS.condition },
    { text: 'Status', width: COLUMN_WIDTHS.status },
    { text: 'Est. Value (₱)', width: COLUMN_WIDTHS.value },
  ];
  
  headers.forEach(header => {
    // Draw vertical line
    doc.line(currentX, yPos, currentX, yPos + TABLE_CONFIG.HEADER_HEIGHT);
    
    // Center text in cell
    const textX = currentX + header.width / 2;
    const textY = yPos + 7;
    doc.text(header.text, textX, textY, { align: 'center' });
    
    currentX += header.width;
  });
  
  // Right border
  doc.line(currentX, yPos, currentX, yPos + TABLE_CONFIG.HEADER_HEIGHT);
  
  return yPos + TABLE_CONFIG.HEADER_HEIGHT;
}

/**
 * Render table rows with pagination
 */
function renderTableRows(
  doc: jsPDF,
  facilities: Facility[],
  startY: number,
  logos: LogoImages,
  options: SF7PDFOptions
): void {
  let yPos = startY;
  const startX = MARGINS.LEFT;
  const rowHeight = TABLE_CONFIG.ROW_HEIGHT;
  const maxY = PAGE_CONFIG.HEIGHT - MARGINS.BOTTOM - 35; // Reserve space for summary
  
  doc.setFontSize(FONT_SIZES.BODY);
  doc.setFont('helvetica', 'normal');
  
  facilities.forEach((facility, index) => {
    // Check if we need a new page
    if (yPos + rowHeight > maxY) {
      doc.addPage();
      renderHeader(doc, logos);
      renderSchoolInfo(doc, options);
      yPos = renderTableHeader(doc, TABLE_CONFIG.START_Y);
    }
    
    let currentX = startX;
    
    // Draw row background (alternate colors)
    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(startX, yPos, PAGE_CONFIG.WIDTH - MARGINS.LEFT - MARGINS.RIGHT, rowHeight, 'F');
    }
    
    const textY = yPos + 4;
    
    // No.
    doc.line(currentX, yPos, currentX, yPos + rowHeight);
    doc.text(String(index + 1), currentX + COLUMN_WIDTHS.number / 2, textY, { align: 'center' });
    currentX += COLUMN_WIDTHS.number;
    
    // Facility Name
    doc.line(currentX, yPos, currentX, yPos + rowHeight);
    doc.text(facility.name.substring(0, 40), currentX + 2, textY);
    currentX += COLUMN_WIDTHS.name;
    
    // Type
    doc.line(currentX, yPos, currentX, yPos + rowHeight);
    const typeLabel = facility.facility_type.replace('_', ' ').toUpperCase();
    doc.text(typeLabel.substring(0, 12), currentX + 2, textY);
    currentX += COLUMN_WIDTHS.type;
    
    // Building
    doc.line(currentX, yPos, currentX, yPos + rowHeight);
    doc.text(facility.building_name?.substring(0, 18) || 'N/A', currentX + 2, textY);
    currentX += COLUMN_WIDTHS.building;
    
    // Room No.
    doc.line(currentX, yPos, currentX, yPos + rowHeight);
    doc.text(facility.room_number || 'N/A', currentX + COLUMN_WIDTHS.room / 2, textY, { align: 'center' });
    currentX += COLUMN_WIDTHS.room;
    
    // Capacity
    doc.line(currentX, yPos, currentX, yPos + rowHeight);
    doc.text(facility.capacity ? String(facility.capacity) : 'N/A', currentX + COLUMN_WIDTHS.capacity / 2, textY, { align: 'center' });
    currentX += COLUMN_WIDTHS.capacity;
    
    // Area
    doc.line(currentX, yPos, currentX, yPos + rowHeight);
    doc.text(facility.area_sqm ? facility.area_sqm.toFixed(1) : 'N/A', currentX + COLUMN_WIDTHS.area / 2, textY, { align: 'center' });
    currentX += COLUMN_WIDTHS.area;
    
    // Condition
    doc.line(currentX, yPos, currentX, yPos + rowHeight);
    const conditionLabel = facility.condition.replace('_', ' ').toUpperCase();
    doc.text(conditionLabel.substring(0, 12), currentX + 2, textY);
    currentX += COLUMN_WIDTHS.condition;
    
    // Status
    doc.line(currentX, yPos, currentX, yPos + rowHeight);
    const statusLabel = facility.status.replace('_', ' ').toUpperCase();
    doc.text(statusLabel.substring(0, 12), currentX + 2, textY);
    currentX += COLUMN_WIDTHS.status;
    
    // Value
    doc.line(currentX, yPos, currentX, yPos + rowHeight);
    const value = facility.estimated_value || facility.acquisition_cost || 0;
    doc.text(value.toLocaleString('en-PH', { minimumFractionDigits: 2 }), currentX + COLUMN_WIDTHS.value - 2, textY, { align: 'right' });
    currentX += COLUMN_WIDTHS.value;
    
    // Right border
    doc.line(currentX, yPos, currentX, yPos + rowHeight);
    
    // Bottom border
    doc.line(startX, yPos + rowHeight, currentX, yPos + rowHeight);
    
    yPos += rowHeight;
  });
}

/**
 * Render summary section
 */
function renderSummary(doc: jsPDF, options: SF7PDFOptions): void {
  const { summary } = options;
  let yPos = PAGE_CONFIG.HEIGHT - MARGINS.BOTTOM - 30;
  
  doc.setFontSize(FONT_SIZES.HEADER);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMARY', MARGINS.LEFT, yPos);
  
  yPos += 6;
  doc.setFontSize(FONT_SIZES.BODY);
  doc.setFont('helvetica', 'normal');
  
  const col1X = MARGINS.LEFT;
  const col2X = MARGINS.LEFT + 90;
  const col3X = MARGINS.LEFT + 180;
  const col4X = MARGINS.LEFT + 250;
  
  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.text('Total Facilities:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(String(summary.total_facilities), col1X + 35, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Total Classrooms:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(String(summary.total_classrooms), col2X + 35, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Total Laboratories:', col3X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(String(summary.total_laboratories), col3X + 38, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Total Capacity:', col4X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(String(summary.total_capacity), col4X + 32, yPos);
  
  // Row 2
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Total Area:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${summary.total_area_sqm.toFixed(2)} m²`, col1X + 23, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Total Value:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`₱${summary.total_value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, col2X + 23, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Operational:', col3X, yPos);
  doc.setFont('helvetica', 'normal');
  const operational = summary.by_status.find(s => s.status === 'operational')?.count || 0;
  doc.text(String(operational), col3X + 25, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Need Repair:', col4X, yPos);
  doc.setFont('helvetica', 'normal');
  const needsRepair = summary.by_condition.find(c => c.condition === 'needs_repair')?.count || 0;
  doc.text(String(needsRepair), col4X + 28, yPos);
}

/**
 * Render signature section
 */
function renderSignatures(doc: jsPDF, options: SF7PDFOptions): void {
  const yPos = PAGE_CONFIG.HEIGHT - MARGINS.BOTTOM - 15;
  
  doc.setFontSize(FONT_SIZES.SMALL);
  doc.setFont('helvetica', 'normal');
  
  // Prepared by
  const col1X = MARGINS.LEFT + 30;
  doc.text('Prepared by:', MARGINS.LEFT, yPos);
  doc.line(col1X, yPos + 2, col1X + 60, yPos + 2);
  doc.text(options.preparedBy, col1X + 30, yPos + 6, { align: 'center' });
  doc.setFontSize(FONT_SIZES.SMALL - 1);
  doc.text('Property Custodian/Facilities Manager', col1X + 30, yPos + 10, { align: 'center' });
  
  // Certified by
  const col2X = PAGE_CONFIG.WIDTH - MARGINS.RIGHT - 90;
  doc.setFontSize(FONT_SIZES.SMALL);
  doc.text('Certified by:', col2X - 25, yPos);
  doc.line(col2X, yPos + 2, col2X + 60, yPos + 2);
  doc.text(options.certifiedBy || 'School Principal', col2X + 30, yPos + 6, { align: 'center' });
  doc.setFontSize(FONT_SIZES.SMALL - 1);
  doc.text('School Head', col2X + 30, yPos + 10, { align: 'center' });
}

/**
 * Main function to generate SF7 PDF
 */
export async function downloadSF7PDF(options: SF7PDFOptions): Promise<void> {
  try {
    const doc = new jsPDF({
      orientation: PAGE_CONFIG.ORIENTATION,
      unit: PAGE_CONFIG.UNIT,
      format: PAGE_CONFIG.FORMAT,
    });
    
    // Load logos
    const logos = await loadLogos();
    
    // Render first page
    renderHeader(doc, logos);
    renderSchoolInfo(doc, options);
    const tableStartY = renderTableHeader(doc, TABLE_CONFIG.START_Y);
    
    // Render table rows with pagination
    renderTableRows(doc, options.facilities, tableStartY, logos, options);
    
    // Render summary and signatures on last page
    renderSummary(doc, options);
    renderSignatures(doc, options);
    
    // Generate filename
    const filename = `SF7_Facilities_Inventory_${options.schoolInfo.schoolId}_${options.reportDate.replace(/\//g, '-')}.pdf`;
    
    // Download
    doc.save(filename);
  } catch (error) {
    console.error('[SF7] Error generating PDF:', error);
    throw new Error('Failed to generate SF7 PDF');
  }
}
