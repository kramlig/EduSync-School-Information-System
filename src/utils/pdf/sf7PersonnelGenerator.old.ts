/**
 * SF7 PDF Generator - School Personnel Basic Profile and Assignment
 * Official DepEd Form (SF7-SHS)
 * 
 * Generates DepEd-compliant SF7 report in LANDSCAPE legal format
 * Matches official DepEd SF7-SHS template with detailed personnel table
 */

import jsPDF from 'jspdf';
import type { SF7PDFOptions, SF7PersonnelRecord } from '../../types/sf7Personnel';
import depedSealUrl from '../../assets/deped-logo.png';
import depedLogoUrl from '../../assets/deped-seal.png';

// Page Configuration - LANDSCAPE LEGAL
const PAGE_CONFIG = {
  WIDTH: 355.6,  // Legal landscape (14 inches)
  HEIGHT: 215.9, // Legal landscape (8.5 inches)
  ORIENTATION: 'landscape' as const,
  UNIT: 'mm' as const,
  FORMAT: 'legal' as const,
};

const MARGINS = {
  TOP: 8,
  LEFT: 8,
  RIGHT: 8,
  BOTTOM: 8,
};

const LOGO_CONFIG = {
  HEIGHT: 12,
  Y_POSITION: 2,
  MARGIN: 10,
};

const FONT_SIZES = {
  TITLE: 10,
  SUBTITLE: 8,
  HEADER: 6.5,
  BODY: 6,
  SMALL: 5.5,
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

  try {
    const [seal, logo] = await Promise.all([
      loadImage(depedSealUrl),
      loadImage(depedLogoUrl),
    ]);
    return { seal, logo };
  } catch (error) {
    console.error('Error loading logos:', error);
    return { seal: new Image(), logo: new Image() };
  }
}

/**
 * Render header with DepEd logos and title
 */
function renderHeader(doc: jsPDF, logos: { seal: HTMLImageElement; logo: HTMLImageElement }) {
  const { seal, logo } = logos;
  const pageWidth = PAGE_CONFIG.WIDTH;
  const centerX = pageWidth / 2;

  // DepEd Seal (left)
  if (seal.src) {
    const sealWidth = LOGO_CONFIG.HEIGHT * (seal.width / seal.height);
    doc.addImage(seal, 'PNG', LOGO_CONFIG.MARGIN, LOGO_CONFIG.Y_POSITION, sealWidth, LOGO_CONFIG.HEIGHT);
  }

  // DepEd Logo (right)
  if (logo.src) {
    const logoWidth = LOGO_CONFIG.HEIGHT * (logo.width / logo.height);
    doc.addImage(logo, 'PNG', pageWidth - logoWidth - LOGO_CONFIG.MARGIN, LOGO_CONFIG.Y_POSITION, logoWidth, LOGO_CONFIG.HEIGHT);
  }

  // Title
  let y = 8;
  doc.setFontSize(FONT_SIZES.TITLE);
  doc.setFont('helvetica', 'bold');
  doc.text('School Form 7 School Personnel Basic Profile and Assignment for Senior High School (SF7-SHS)', centerX, y, { align: 'center' });
  
  return 16;
}

/**
 * Render school information fields
 */
function renderSchoolInfo(doc: jsPDF, options: SF7PDFOptions): number {
  let y = 16;
  const fieldHeight = 5;
  const boxPadding = 1;
  
  doc.setFontSize(FONT_SIZES.SMALL);
  doc.setFont('helvetica', 'normal');

  // Row 1: School Name, School ID, District, Division, Region
  let x = MARGINS.LEFT;
  
  // School Name
  doc.text('School Name', x, y);
  doc.rect(x + 21, y - 3.5, 75, fieldHeight);
  doc.setFontSize(FONT_SIZES.BODY);
  doc.text(options.school_name, x + 21 + boxPadding, y + boxPadding);
  doc.setFontSize(FONT_SIZES.SMALL);
  x += 100;
  
  // School ID
  doc.text('School ID', x, y);
  doc.rect(x + 18, y - 3.5, 30, fieldHeight);
  doc.setFontSize(FONT_SIZES.BODY);
  doc.text(options.school_id || '', x + 18 + boxPadding, y + boxPadding);
  doc.setFontSize(FONT_SIZES.SMALL);
  x += 52;
  
  // District
  doc.text('District', x, y);
  doc.rect(x + 14, y - 3.5, 45, fieldHeight);
  doc.setFontSize(FONT_SIZES.BODY);
  doc.text(options.district || '', x + 14 + boxPadding, y + boxPadding);
  doc.setFontSize(FONT_SIZES.SMALL);
  x += 63;
  
  // Division
  doc.text('Division', x, y);
  doc.rect(x + 14, y - 3.5, 50, fieldHeight);
  doc.setFontSize(FONT_SIZES.BODY);
  doc.text(options.division || '', x + 14 + boxPadding, y + boxPadding);
  doc.setFontSize(FONT_SIZES.SMALL);
  x += 68;
  
  // Region
  doc.text('Region', x, y);
  doc.rect(x + 12, y - 3.5, 30, fieldHeight);
  doc.setFontSize(FONT_SIZES.BODY);
  doc.text(options.region || '', x + 12 + boxPadding, y + boxPadding);
  doc.setFontSize(FONT_SIZES.SMALL);
  
  // Row 2: Semester and School Year
  x = MARGINS.LEFT;
  y += fieldHeight + 3;
  
  doc.text('Semester', x, y);
  doc.rect(x + 18, y - 3.5, 25, fieldHeight);
  doc.setFontSize(FONT_SIZES.BODY);
  doc.text('1st', x + 18 + boxPadding, y + boxPadding);
  doc.setFontSize(FONT_SIZES.SMALL);
  x += 48;
  
  doc.text('School Year', x, y);
  doc.rect(x + 21, y - 3.5, 30, fieldHeight);
  doc.setFontSize(FONT_SIZES.BODY);
  doc.text(options.school_year, x + 21 + boxPadding, y + boxPadding);
  doc.setFontSize(FONT_SIZES.SMALL);
  
  return y + fieldHeight + 2;
}

/**
 * Render the three summary tables at the top
 */
function renderSummaryTables(doc: jsPDF, startY: number): number {
  let y = startY;
  const tableHeight = 14;
  const headerHeight = 7;
  
  doc.setFontSize(FONT_SIZES.SMALL);
  doc.setFont('helvetica', 'bold');
  
  // Table widths
  const table1Width = 110;
  const table2Width = 90;
  const table3Width = 135;
  const gap = 3;
  
  let x = MARGINS.LEFT;
  
  // Table (A): Nationally-Funded Teaching & Teaching Related Items
  doc.rect(x, y, table1Width, tableHeight);
  doc.text('(A) Nationally-Funded Teaching & Teaching Related Items', x + table1Width / 2, y + 4, { align: 'center' });
  
  // Column headers for Table A
  doc.line(x, y + headerHeight, x + table1Width, y + headerHeight);
  doc.setFontSize(FONT_SIZES.SMALL - 0.5);
  doc.text('Title of Plantilla Position', x + 2, y + headerHeight + 3.5);
  doc.text('Number of', x + 75, y + headerHeight + 3.5);
  doc.text('Incumbent', x + 77, y + headerHeight + 5.5);
  doc.line(x + 70, y + headerHeight, x + 70, y + tableHeight);
  
  x += table1Width + gap;
  
  // Table (B): Nationally-Funded Non-Teaching Items
  doc.rect(x, y, table2Width, tableHeight);
  doc.setFontSize(FONT_SIZES.SMALL);
  doc.text('(B) Nationally-Funded Non-Teaching Items', x + table2Width / 2, y + 4, { align: 'center' });
  
  // Column headers for Table B
  doc.line(x, y + headerHeight, x + table2Width, y + headerHeight);
  doc.setFontSize(FONT_SIZES.SMALL - 0.5);
  doc.text('Title of Plantilla Position', x + 2, y + headerHeight + 3.5);
  doc.text('Number of', x + 60, y + headerHeight + 3.5);
  doc.text('Incumbent', x + 62, y + headerHeight + 5.5);
  doc.line(x + 55, y + headerHeight, x + 55, y + tableHeight);
  
  x += table2Width + gap;
  
  // Table (C): Other Appointments and Funding Sources
  doc.rect(x, y, table3Width, tableHeight);
  doc.setFontSize(FONT_SIZES.SMALL);
  doc.text('(C) Other Appointments and Funding Sources', x + table3Width / 2, y + 4, { align: 'center' });
  
  // Column headers for Table C
  doc.line(x, y + headerHeight, x + table3Width, y + headerHeight);
  doc.setFontSize(FONT_SIZES.SMALL - 0.5);
  doc.text('Title of Designation', x + 2, y + headerHeight + 3.5);
  doc.text('Appointment:', x + 50, y + headerHeight + 2);
  doc.text('Fund Source', x + 88, y + headerHeight + 2.5);
  doc.text('Number of Incumbent', x + 110, y + headerHeight + 2);
  
  doc.line(x + 45, y + headerHeight, x + 45, y + tableHeight);
  doc.line(x + 83, y + headerHeight, x + 83, y + tableHeight);
  doc.line(x + 105, y + headerHeight, x + 105, y + tableHeight);
  doc.line(x + 118, y + headerHeight, x + 118, y + tableHeight);
  
  // Subcategories for Table C
  doc.setFontSize(FONT_SIZES.SMALL - 1);
  doc.setFont('helvetica', 'normal');
  doc.text('Teaching', x + 107, y + headerHeight + 5.5);
  doc.text('Non-Teaching', x + 120, y + headerHeight + 5.5);
  
  return y + tableHeight + 3;
}

function renderTableHeader(doc: jsPDF, y: number): number {
  const headerHeight = 35;
  
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(255, 255, 255);
  
  const cols = {
    employeeNo: 14,
    name: 30,
    sex: 8,
    fundSource: 12,
    position: 16,
    nature: 16,
    degree: 14,
    major: 18,
    minor: 14,
    subjects: 52,
    grade: 14,
    day: 10,
    fromTo: 16,
    total: 14,
    remarks: 34,
  };
  
  const tableWidth = Object.values(cols).reduce((a, b) => a + b, 0);
  doc.rect(MARGINS.LEFT, y, tableWidth, headerHeight);
  
  let x = MARGINS.LEFT;
  const row1Height = 8;
  const row2Y = y + row1Height;
  
  // Section headers
  const basicInfoWidth = cols.employeeNo + cols.name + cols.sex + cols.fundSource + cols.position + cols.nature;
  const eduX = x + basicInfoWidth;
  const eduWidth = cols.degree + cols.major + cols.minor;
  const subjectsX = eduX + eduWidth;
  const subjectsSecWidth = cols.subjects + cols.grade;
  const dailyX = subjectsX + subjectsSecWidth;
  const dailyWidth = cols.day + cols.fromTo;
  
  doc.setFontSize(7);
  doc.text('EDUCATIONAL QUALIFICATION', eduX + eduWidth / 2, y + 5, { align: 'center' });
  doc.line(eduX, y + row1Height, eduX + eduWidth, y + row1Height);
  
  doc.text('Subjects Taught, Advisory Class &', subjectsX + subjectsSecWidth / 2, y + 3.5, { align: 'center' });
  doc.text('Other Ancillary Assignments', subjectsX + subjectsSecWidth / 2, y + 6.5, { align: 'center' });
  doc.line(subjectsX, y + row1Height, subjectsX + subjectsSecWidth, y + row1Height);
  
  doc.text('Daily Program (time duration)', dailyX + dailyWidth / 2, y + 5, { align: 'center' });
  doc.line(dailyX, y + row1Height, dailyX + dailyWidth, y + row1Height);
  
  doc.setFontSize(5.5);
  x = MARGINS.LEFT;
  
  // Column 1: Employee No.
  doc.text('Employee', x + 2, row2Y + 4);
  doc.text('No. &', x + 2, row2Y + 7);
  doc.text('Identification', x + 1, row2Y + 10);
  doc.text('Number', x + 2, row2Y + 13);
  doc.text('(-TLN-)', x + 2, row2Y + 16);
  x += cols.employeeNo;
  doc.line(x, y, x, y + headerHeight);
  
  // Column 2: Name
  doc.text('Name of School', x + 4, row2Y + 6);
  doc.text('Personnel', x + 6, row2Y + 9);
  doc.text('(Arrange by', x + 5, row2Y + 12);
  doc.text('Position,', x + 6, row2Y + 15);
  doc.text('Descending)', x + 4, row2Y + 18);
  x += cols.name;
  doc.line(x, y, x, y + headerHeight);
  
  // Column 3: Sex
  doc.text('Sex', x + 3, row2Y + 13);
  x += cols.sex;
  doc.line(x, y, x, y + headerHeight);
  
  // Column 4: Fund Source
  doc.text('Fund', x + 4, row2Y + 12);
  doc.text('Source', x + 3, row2Y + 15);
  x += cols.fundSource;
  doc.line(x, y, x, y + headerHeight);
  
  // Column 5: Position
  doc.text('Position/', x + 3, row2Y + 12);
  doc.text('Designation', x + 2, row2Y + 15);
  x += cols.position;
  doc.line(x, y, x, y + headerHeight);
  
  // Column 6: Nature
  doc.text('Nature of', x + 3, row2Y + 7);
  doc.text('Appointment/', x + 2, row2Y + 10);
  doc.text('Employment', x + 2, row2Y + 13);
  doc.text('Status', x + 4, row2Y + 16);
  doc.text('(Regular/', x + 3, row2Y + 19);
  doc.text('Probationary/', x + 1, row2Y + 22);
  doc.text('Part Time)', x + 3, row2Y + 25);
  x += cols.nature;
  doc.line(x, y, x, y + headerHeight);
  
  // Column 7: Degree
  doc.text('Degree/', x + 4, row2Y + 12);
  doc.text('Post-', x + 4, row2Y + 15);
  doc.text('graduate', x + 3, row2Y + 18);
  x += cols.degree;
  doc.line(x, row2Y, x, y + headerHeight);
  
  // Column 8: Major
  doc.text('Major/', x + 5, row2Y + 9);
  doc.text('Specialization/', x + 2, row2Y + 12);
  doc.text('Specialized', x + 3, row2Y + 15);
  doc.text('Training', x + 5, row2Y + 18);
  doc.text('Attended', x + 4, row2Y + 21);
  x += cols.major;
  doc.line(x, row2Y, x, y + headerHeight);
  
  // Column 9: Minor
  doc.text('Minor', x + 5, row2Y + 15);
  x += cols.minor;
  doc.line(x, row2Y, x, y + headerHeight);
  
  // Subjects area (merged - no internal line)
  x += cols.subjects;
  
  // Grade column
  doc.text('Grade', x + 4, row2Y + 10);
  doc.text('and', x + 5, row2Y + 13);
  doc.text('Sections', x + 3, row2Y + 16);
  doc.text('(Enumerate', x + 2, row2Y + 19);
  doc.text('sections', x + 3, row2Y + 22);
  doc.text('taught)', x + 3, row2Y + 25);
  x += cols.grade;
  doc.line(x, row2Y, x, y + headerHeight);
  
  // Column 12: DAY
  doc.text('DAY', x + 3, row2Y + 12);
  doc.text('(M/T/W/', x + 1, row2Y + 16);
  doc.text('TH/F)', x + 2, row2Y + 20);
  x += cols.day;
  doc.line(x, row2Y, x, y + headerHeight);
  
  // Column 13: From-To
  doc.text('From', x + 5, row2Y + 11);
  doc.text('(00:00)', x + 4, row2Y + 15);
  doc.text('To', x + 7, row2Y + 19);
  doc.text('(00:00)', x + 4, row2Y + 23);
  x += cols.fromTo;
  doc.line(x, row2Y, x, y + headerHeight);
  
  // Column 14: Total
  doc.text('Total Actual', x + 1, row2Y + 9);
  doc.text('Teaching', x + 2, row2Y + 13);
  doc.text('Minutes per', x + 1, row2Y + 17);
  doc.text('Week', x + 4, row2Y + 21);
  x += cols.total;
  doc.line(x, y, x, y + headerHeight);
  
  // Column 15: Remarks
  doc.setFontSize(6);
  doc.text('Remarks:', x + 12, row2Y + 3);
  doc.setFontSize(5);
  doc.text('*For Detailed Items,', x + 2, row2Y + 6);
  doc.text('Indicate name of', x + 3, row2Y + 9);
  doc.text('school/office, office', x + 2, row2Y + 12);
  doc.text('held, (School, Etc.)', x + 2, row2Y + 15);
  doc.text('*For IP - Ethnicity)', x + 2, row2Y + 18);
  doc.text('*For additional loads', x + 2, row2Y + 21);
  doc.text('from JHS- please', x + 2, row2Y + 24);
  doc.text('indicate the number', x + 2, row2Y + 27);
  doc.text('of teaching minutes', x + 2, row2Y + 30);
  
  return y + headerHeight;
}

/**
 * Render table rows with personnel data
 */
function renderTableRows(doc: jsPDF, startY: number, personnel: SF7PersonnelRecord[]): number {
  let y = startY;
  const rowHeight = 12;
  
  // MUST match column widths from renderTableHeader
  const cols = {
    employeeNo: 14,
    name: 30,
    sex: 8,
    fundSource: 12,
    position: 16,
    nature: 16,
    degree: 14,
    major: 18,
    minor: 14,
    subjects: 52,
    grade: 14,
    day: 10,
    fromTo: 16,
    total: 14,
    remarks: 34,
  };
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SIZES.SMALL);

  personnel.forEach((person, index) => {
    // Check if we need a new page
    if (y > PAGE_CONFIG.HEIGHT - MARGINS.BOTTOM - 30) {
      doc.addPage();
      y = MARGINS.TOP;
      y = renderTableHeader(doc, y);
    }

    let x = MARGINS.LEFT;
    const textY = y + 7;
    
    // Draw row border
    doc.rect(x, y, PAGE_CONFIG.WIDTH - MARGINS.LEFT - MARGINS.RIGHT, rowHeight);
    
    // Employee Number
    doc.text(person.employee_number || `${index + 1}`, x + 2, textY);
    x += cols.employeeNo;
    doc.line(x, y, x, y + rowHeight);
    
    // Name (Last, First, Middle)
    const fullName = [person.last_name, person.first_name, person.middle_name]
      .filter(Boolean)
      .join(', ');
    doc.text(fullName, x + 2, textY, { maxWidth: cols.name - 4 });
    x += cols.name;
    doc.line(x, y, x, y + rowHeight);
    
    // Sex
    const sex = person.sex || (index % 2 === 0 ? 'M' : 'F');
    doc.text(sex, x + 3, textY);
    x += cols.sex;
    doc.line(x, y, x, y + rowHeight);
    
    // Fund Source
    const fundSource = person.employment_status === 'permanent' ? 'DepEd' : 'Other';
    doc.text(fundSource, x + 2, textY);
    x += cols.fundSource;
    doc.line(x, y, x, y + rowHeight);
    
    // Position
    const position = formatPosition(person.position);
    doc.text(position, x + 1, textY, { maxWidth: cols.position - 2 });
    x += cols.position;
    doc.line(x, y, x, y + rowHeight);
    
    // Nature of Appointment
    const nature = formatEmploymentStatus(person.employment_status);
    doc.text(nature, x + 1, textY);
    x += cols.nature;
    doc.line(x, y, x, y + rowHeight);
    
    // Degree
    const degree = formatDegree(person.highest_education);
    doc.text(degree, x + 1, textY);
    x += cols.degree;
    doc.line(x, y, x, y + rowHeight);
    
    // Major/Specialization
    const major = person.major_specialization || person.specialization || '';
    doc.text(major, x + 1, textY, { maxWidth: cols.major - 2 });
    x += cols.major;
    doc.line(x, y, x, y + rowHeight);
    
    // Minor
    doc.text('', x + 1, textY);
    x += cols.minor;
    doc.line(x, y, x, y + rowHeight);
    
    const subjects = (person.teaching_assignments || [])
      .map(a => `${a.subject} (${a.hours_per_week}h)`)
      .join(', ');
    doc.text(subjects || 'N/A', x + 1, textY, { maxWidth: cols.subjects - 2 });
    x += cols.subjects;
    
    const grades = (person.teaching_assignments || [])
      .map(a => `G${a.grade_level}`)
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(', ');
    doc.text(grades || '', x + 1, textY);
    x += cols.grade;
    doc.line(x, y, x, y + rowHeight);
    
    // DAY
    doc.text('M-F', x + 1, textY);
    x += cols.day;
    doc.line(x, y, x, y + rowHeight);
    
    // Time
    doc.text('8:00-17:00', x + 1, textY);
    x += cols.fromTo;
    doc.line(x, y, x, y + rowHeight);
    
    // Total Teaching Minutes
    const totalHours = person.total_teaching_hours || 0;
    const totalMinutes = totalHours * 60;
    doc.text(totalMinutes.toString(), x + 2, textY);
    x += cols.total;
    doc.line(x, y, x, y + rowHeight);
    
    // Remarks
    const ancillary = (person.ancillary_responsibilities || [])
      .map(r => r.responsibility)
      .join(', ');
    if (ancillary) {
      doc.text(ancillary, x + 1, textY, { maxWidth: cols.remarks - 2 });
    }
    
    y += rowHeight;
  });

  return y;
}

/**
 * Format degree/education level
 */
function formatDegree(education?: string): string {
  if (!education) return '';
  
  const degreeMap: Record<string, string> = {
    'bachelors': "Bachelor's",
    'masters': "Master's",
    'doctorate': 'Doctorate',
  };
  return degreeMap[education] || education;
}

/**
 * Format position title - safe version
 */
function formatPosition(position?: string): string {
  if (!position) return '';
  
  return position
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format employment status - safe version
 */
function formatEmploymentStatus(status?: string): string {
  if (!status) return '';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Render signature section
 */
function renderSignatures(doc: jsPDF, y: number, options: SF7PDFOptions) {
  y += 8;
  
  doc.setFontSize(FONT_SIZES.SMALL);
  doc.setFont('helvetica', 'normal');
  
  const col1 = MARGINS.LEFT + 30;
  const col2 = PAGE_CONFIG.WIDTH - MARGINS.RIGHT - 80;
  
  // Prepared by
  doc.text('Prepared by:', col1, y);
  y += 10;
  doc.line(col1, y, col1 + 50, y);
  y += 3;
  doc.text('Registrar / HR Officer', col1 + 25, y, { align: 'center' });
  
  // Certified correct by
  y -= 13;
  doc.text('Certified correct by:', col2, y);
  y += 10;
  doc.line(col2, y, col2 + 50, y);
  y += 3;
  doc.text(options.principal_name || 'School Principal', col2 + 25, y, { align: 'center' });
  y += 4;
  doc.setFontSize(FONT_SIZES.SMALL - 0.5);
  doc.text('School Principal', col2 + 25, y, { align: 'center' });
}

/**
 * Main function to generate and download SF7 PDF
 */
export async function downloadSF7PDF(options: SF7PDFOptions) {
  const doc = new jsPDF({
    orientation: PAGE_CONFIG.ORIENTATION,
    unit: PAGE_CONFIG.UNIT,
    format: PAGE_CONFIG.FORMAT,
  });

  // Load logos
  const logos = await loadLogos();

  // Render document
  let y = renderHeader(doc, logos);
  y = renderSchoolInfo(doc, options);
  y = renderSummaryTables(doc, y);
  
  y = renderTableHeader(doc, y);
  y = renderTableRows(doc, y, options.personnel);
  renderSignatures(doc, y, options);

  // Download
  const filename = `SF7_Personnel_${options.school_year.replace(/\//g, '-')}.pdf`;
  doc.save(filename);
}

