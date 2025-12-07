/**
 * SF7 PDF Generator - School Personnel Basic Profile and Assignment
 * Official DepEd Form (SF7-SHS)
 * 
 * Generates DepEd-compliant SF7 report in LANDSCAPE legal format
 * Matches official DepEd SF7-SHS template exactly
 */

import jsPDF from 'jspdf';
import type { SF7PDFOptions, SF7PersonnelRecord } from '../../types/sf7Personnel';
import depedSealUrl from '../../assets/deped-logo.png';
import depedLogoUrl from '../../assets/deped-seal.png';

// Page Configuration - LANDSCAPE LEGAL
const PAGE = {
  WIDTH: 355.6,
  HEIGHT: 215.9,
  MARGIN: 5,
};

// Column widths for main table (16 columns total = 345.6mm usable)
const COL = {
  empNo: 22,
  name: 38,
  sex: 10,
  fund: 14,
  position: 20,
  nature: 22,
  degree: 18,
  major: 24,
  minor: 18,
  subjects: 48,
  grade: 16,
  day: 12,
  from: 14,
  to: 14,
  total: 18,
  remarks: 38,
};

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
  } catch {
    return { seal: new Image(), logo: new Image() };
  }
}

function renderHeader(doc: jsPDF, logos: { seal: HTMLImageElement; logo: HTMLImageElement }, options: SF7PDFOptions): number {
  const { seal, logo } = logos;
  let y = 3;
  
  // DepEd Seal (left) - positioned at left margin
  if (seal.src) {
    doc.addImage(seal, 'PNG', 8, y, 18, 18);
  }

  // DepEd Logo (right) - positioned at right margin
  if (logo.src) {
    doc.addImage(logo, 'PNG', PAGE.WIDTH - 28, y, 22, 20);
  }

  // Title - centered between logos
  y = 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('School Form 7 School Personnel Basic Profile and Assignment for Elementary (SF7-ELEM)', PAGE.WIDTH / 2, y, { align: 'center' });
  
  // Row 1: School Name, School ID, District
  y = 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  // School Name
  let x = 32;
  doc.text('School Name', x, y);
  doc.rect(x + 24, y - 4, 95, 6);
  doc.setFont('helvetica', 'bold');
  doc.text(options.school_name || '', x + 26, y);
  doc.setFont('helvetica', 'normal');
  
  // School ID
  x = 160;
  doc.text('School ID', x, y);
  doc.rect(x + 18, y - 4, 60, 6);
  doc.setFont('helvetica', 'bold');
  doc.text(options.school_id_number || '', x + 20, y);
  doc.setFont('helvetica', 'normal');
  
  // District
  x = 245;
  doc.text('District', x, y);
  doc.rect(x + 15, y - 4, 60, 6);
  doc.setFont('helvetica', 'bold');
  doc.text(options.district || '', x + 17, y);
  doc.setFont('helvetica', 'normal');
  
  // Row 2: Semester, School Year, Division, Region
  y = 23;
  x = 32;
  doc.text('Semester', x, y);
  doc.rect(x + 18, y - 4, 40, 6);
  
  x = 105;
  doc.text('School Year', x, y);
  doc.rect(x + 24, y - 4, 45, 6);
  doc.setFont('helvetica', 'bold');
  doc.text(options.school_year || '', x + 26, y);
  doc.setFont('helvetica', 'normal');
  
  x = 185;
  doc.text('Division', x, y);
  doc.rect(x + 17, y - 4, 50, 6);
  doc.setFont('helvetica', 'bold');
  doc.text(options.division || '', x + 19, y);
  doc.setFont('helvetica', 'normal');
  
  x = 260;
  doc.text('Region', x, y);
  doc.rect(x + 14, y - 4, 45, 6);
  doc.setFont('helvetica', 'bold');
  doc.text(options.region || '', x + 16, y);
  doc.setFont('helvetica', 'normal');
  
  return 28;
}

function renderSummaryTables(doc: jsPDF, y: number): number {
  const headerRowH = 6;
  const subHeaderH = 18;
  const dataRowH = 8;
  const dataRows = 4;
  const tableH = headerRowH + subHeaderH + (dataRowH * dataRows);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  
  // Table A: Nationally-Funded Teaching & Teaching Related Items
  let x = PAGE.MARGIN;
  const tableAWidth = 110;
  
  // Section header row
  doc.rect(x, y, tableAWidth, headerRowH);
  doc.text('(A) Nationally-Funded Teaching & Teaching Related Items', x + tableAWidth / 2, y + 4.5, { align: 'center' });
  
  // Sub-header row
  const subHeaderY = y + headerRowH;
  doc.rect(x, subHeaderY, tableAWidth, subHeaderH);
  
  // Column divider in sub-header
  const colA1Width = 75;
  doc.line(x + colA1Width, subHeaderY, x + colA1Width, y + headerRowH + subHeaderH + (dataRowH * dataRows));
  
  // Sub-header text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('Title of Plantilla Position', x + colA1Width / 2, subHeaderY + 5, { align: 'center' });
  doc.text('(as it appears  in the appointment', x + colA1Width / 2, subHeaderY + 9, { align: 'center' });
  doc.text('document/PSIPOP)', x + colA1Width / 2, subHeaderY + 13, { align: 'center' });
  
  doc.text('Number of', x + colA1Width + (tableAWidth - colA1Width) / 2, subHeaderY + 7, { align: 'center' });
  doc.text('Incumbent', x + colA1Width + (tableAWidth - colA1Width) / 2, subHeaderY + 11, { align: 'center' });
  
  // Data rows
  for (let i = 0; i <= dataRows; i++) {
    const rowY = subHeaderY + subHeaderH + (dataRowH * i);
    doc.line(x, rowY, x + tableAWidth, rowY);
  }
  // Right border for data rows
  doc.line(x + tableAWidth, subHeaderY + subHeaderH, x + tableAWidth, y + tableH);
  // Left border for data rows
  doc.line(x, subHeaderY + subHeaderH, x, y + tableH);
  
  // Table B: Nationally-Funded Non-Teaching Items
  x += tableAWidth + 5;
  const tableBWidth = 95;
  
  // Section header row
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.rect(x, y, tableBWidth, headerRowH);
  doc.text('(B) Nationally-Funded Non-Teaching Items', x + tableBWidth / 2, y + 4.5, { align: 'center' });
  
  // Sub-header row
  doc.rect(x, subHeaderY, tableBWidth, subHeaderH);
  
  // Column divider
  const colB1Width = 60;
  doc.line(x + colB1Width, subHeaderY, x + colB1Width, y + tableH);
  
  // Sub-header text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('Title of Plantilla Position', x + colB1Width / 2, subHeaderY + 5, { align: 'center' });
  doc.text('(as it appears  in the appointment', x + colB1Width / 2, subHeaderY + 9, { align: 'center' });
  doc.text('document/PSIPOP)', x + colB1Width / 2, subHeaderY + 13, { align: 'center' });
  
  doc.text('Number of', x + colB1Width + (tableBWidth - colB1Width) / 2, subHeaderY + 7, { align: 'center' });
  doc.text('Incumbent', x + colB1Width + (tableBWidth - colB1Width) / 2, subHeaderY + 11, { align: 'center' });
  
  // Data rows
  for (let i = 0; i <= dataRows; i++) {
    const rowY = subHeaderY + subHeaderH + (dataRowH * i);
    doc.line(x, rowY, x + tableBWidth, rowY);
  }
  doc.line(x + tableBWidth, subHeaderY + subHeaderH, x + tableBWidth, y + tableH);
  doc.line(x, subHeaderY + subHeaderH, x, y + tableH);
  
  // Table C: Other Appointments and Funding Sources
  x += tableBWidth + 5;
  const tableCWidth = 130;
  
  // Section header row
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.rect(x, y, tableCWidth, headerRowH);
  doc.text('(C ) Other Appointments and Funding Sources', x + tableCWidth / 2, y + 4.5, { align: 'center' });
  
  // Sub-header row
  doc.rect(x, subHeaderY, tableCWidth, subHeaderH);
  
  // Column widths for table C
  const colC1 = 48; // Title of Designation
  const colC2 = 22; // Appointment
  const colC3 = 22; // Fund Source
  const colC4 = 19; // Teaching
  const colC5 = 19; // Non-Teaching
  
  // Column dividers for first 3 columns (full height)
  doc.line(x + colC1, subHeaderY, x + colC1, y + tableH);
  doc.line(x + colC1 + colC2, subHeaderY, x + colC1 + colC2, y + tableH);
  doc.line(x + colC1 + colC2 + colC3, subHeaderY, x + colC1 + colC2 + colC3, y + tableH);
  
  // Vertical divider between Teaching and Non-Teaching starts BELOW the "Number of Incumbent" header
  const incumbentX = x + colC1 + colC2 + colC3;
  const incumbentDividerY = subHeaderY + 9; // Below "Number of Incumbent" text
  doc.line(incumbentX + colC4, incumbentDividerY, incumbentX + colC4, y + tableH);
  
  // Sub-header text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  
  // Column 1: Title of Designation
  doc.text('Title of Designation', x + colC1 / 2, subHeaderY + 5, { align: 'center' });
  doc.text('(as it appears in the contract/document: Teacher,', x + colC1 / 2, subHeaderY + 9, { align: 'center' });
  doc.text('Clerk, Security Guard, Driver etc.)', x + colC1 / 2, subHeaderY + 13, { align: 'center' });
  
  // Column 2: Appointment
  doc.text('Appointment:', x + colC1 + colC2 / 2, subHeaderY + 3, { align: 'center' });
  doc.text('(Contractual,', x + colC1 + colC2 / 2, subHeaderY + 6.5, { align: 'center' });
  doc.text('Substitute,', x + colC1 + colC2 / 2, subHeaderY + 10, { align: 'center' });
  doc.text('Volunteer,', x + colC1 + colC2 / 2, subHeaderY + 13.5, { align: 'center' });
  doc.text('Others specify)', x + colC1 + colC2 / 2, subHeaderY + 17, { align: 'center' });
  
  // Column 3: Fund Source
  doc.text('Fund Source', x + colC1 + colC2 + colC3 / 2, subHeaderY + 5, { align: 'center' });
  doc.text('(SEF, PTA, NGO\'s', x + colC1 + colC2 + colC3 / 2, subHeaderY + 9, { align: 'center' });
  doc.text('etc.)', x + colC1 + colC2 + colC3 / 2, subHeaderY + 13, { align: 'center' });
  
  // Column 4 & 5: Number of Incumbent (spanning header with sub-row)
  const incumbentWidth = colC4 + colC5;
  
  // "Number of Incumbent" header - centered in top portion (no vertical divider here)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('Number of Incumbent', incumbentX + incumbentWidth / 2, subHeaderY + 6, { align: 'center' });
  
  // Horizontal divider between "Number of Incumbent" and Teaching/Non-Teaching
  doc.line(incumbentX, incumbentDividerY, x + tableCWidth, incumbentDividerY);
  
  // Teaching and Non-Teaching sub-headers - centered in bottom portion
  doc.setFontSize(5.5);
  doc.text('Teaching', incumbentX + colC4 / 2, subHeaderY + 14, { align: 'center' });
  doc.text('Non-Teaching', incumbentX + colC4 + colC5 / 2, subHeaderY + 14, { align: 'center' });
  
  // Data rows
  for (let i = 0; i <= dataRows; i++) {
    const rowY = subHeaderY + subHeaderH + (dataRowH * i);
    doc.line(x, rowY, x + tableCWidth, rowY);
  }
  doc.line(x + tableCWidth, subHeaderY + subHeaderH, x + tableCWidth, y + tableH);
  doc.line(x, subHeaderY + subHeaderH, x, y + tableH);
  
  return y + tableH + 3;
}

function renderMainTableHeader(doc: jsPDF, y: number): number {
  const row1H = 10;
  const row2H = 28;
  const headerH = row1H + row2H;
  let x = PAGE.MARGIN;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  
  // Outer border
  const tableW = Object.values(COL).reduce((a, b) => a + b, 0);
  doc.rect(x, y, tableW, headerH);
  
  // Calculate section widths
  const basicW = COL.empNo + COL.name + COL.sex + COL.fund + COL.position + COL.nature;
  const eduW = COL.degree + COL.major + COL.minor;
  const subjectsW = COL.subjects;
  const gradeW = COL.grade;
  
  // ============================================
  // ROW 1: Section headers
  // ============================================
  
  // EDUCATIONAL QUALIFICATION header (spanning 3 columns)
  const eduX = x + basicW;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('EDUCATIONAL QUALIFICATION', eduX + eduW / 2, y + 6, { align: 'center' });
  doc.line(eduX, y + row1H, eduX + eduW, y + row1H);
  // Left boundary line for EDUCATIONAL QUALIFICATION
  doc.setLineWidth(0.4);
  doc.line(eduX, y, eduX, y + headerH);
  doc.setLineWidth(0.2);
  
  // Subjects Taught column - spans both rows (full height, no row divider)
  const subX = eduX + eduW;
  // NO horizontal line - this column spans both rows
  // Left boundary line
  doc.setLineWidth(0.4);
  doc.line(subX, y, subX, y + headerH);
  doc.setLineWidth(0.2);
  // Subjects header text (spans both rows - center vertically)
  doc.setFontSize(5.5);
  doc.text('Subjects Taught, Advisory', subX + subjectsW / 2, y + 10, { align: 'center' });
  doc.text('Class & Other Ancillary', subX + subjectsW / 2, y + 14, { align: 'center' });
  doc.text('Assignments', subX + subjectsW / 2, y + 18, { align: 'center' });
  
  // Grade and Sections column - spans both rows (full height, no row divider)
  const gradeX = subX + subjectsW;
  // NO horizontal line - this column spans both rows
  // Left boundary line
  doc.setLineWidth(0.4);
  doc.line(gradeX, y, gradeX, y + headerH);
  doc.setLineWidth(0.2);
  // Grade header text (spans both rows - center vertically)
  doc.setFontSize(5.5);
  doc.text('Grade', gradeX + gradeW / 2, y + 6, { align: 'center' });
  doc.text('and', gradeX + gradeW / 2, y + 10, { align: 'center' });
  doc.text('Sections', gradeX + gradeW / 2, y + 14, { align: 'center' });
  doc.setFontSize(4.5);
  doc.text('(Enumerate', gradeX + gradeW / 2, y + 18, { align: 'center' });
  doc.text('sections', gradeX + gradeW / 2, y + 22, { align: 'center' });
  doc.text('taught)', gradeX + gradeW / 2, y + 26, { align: 'center' });
  
  // Daily Program (time duration) header - spans DAY, From, To columns (3 columns)
  const dailyX = gradeX + gradeW;
  const dailyW3 = COL.day + COL.from + COL.to; // Width of 3 columns
  doc.setFontSize(6);
  doc.text('Daily Program (time duration)', dailyX + dailyW3 / 2, y + 6, { align: 'center' });
  doc.line(dailyX, y + row1H, dailyX + dailyW3, y + row1H); // Horizontal line under Daily Program
  // Left boundary line for Daily Program section
  doc.setLineWidth(0.4);
  doc.line(dailyX, y, dailyX, y + headerH);
  doc.setLineWidth(0.2);
  
  // Total column - spans both rows (full height, no row divider)
  const totalX = dailyX + dailyW3;
  doc.setLineWidth(0.4);
  doc.line(totalX, y, totalX, y + headerH);
  doc.setLineWidth(0.2);
  // Total header text (spans both rows - center vertically in full height)
  doc.setFontSize(5.5);
  doc.text('Total Actual', totalX + COL.total / 2, y + 8, { align: 'center' });
  doc.text('Teaching', totalX + COL.total / 2, y + 12, { align: 'center' });
  doc.text('Minutes per', totalX + COL.total / 2, y + 16, { align: 'center' });
  doc.text('Week', totalX + COL.total / 2, y + 20, { align: 'center' });
  
  // Remarks column - spans both rows (full height, no row divider)
  const remarksX = totalX + COL.total;
  doc.setLineWidth(0.4);
  doc.line(remarksX, y, remarksX, y + headerH);
  doc.setLineWidth(0.2);
  // Remarks header text (spans both rows - left aligned)
  doc.setFontSize(6);
  doc.text('Remarks:', remarksX + 2, y + 5);
  doc.setFontSize(5);
  doc.text('*For Detailed Items, Indicate', remarksX + 2, y + 10);
  doc.text('name of school/office,', remarksX + 2, y + 14);
  doc.text('*For IP - Ethnicity)', remarksX + 2, y + 18);
  doc.text('*For additional loads from JHS-', remarksX + 2, y + 22);
  doc.text('please indicate the number of', remarksX + 2, y + 26);
  doc.text('teaching minutes per week)', remarksX + 2, y + 30);
  
  // ============================================
  // ROW 2: Individual column headers
  // ============================================
  const row2Y = y + row1H;
  x = PAGE.MARGIN;
  
  // Column 1: Employee No. (or Tax Identification Number -T.I.N.)
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.text('Employee', x + COL.empNo / 2, row2Y + 4, { align: 'center' });
  doc.text('No. (or Tax', x + COL.empNo / 2, row2Y + 7.5, { align: 'center' });
  doc.text('Identification', x + COL.empNo / 2, row2Y + 11, { align: 'center' });
  doc.text('Number', x + COL.empNo / 2, row2Y + 14.5, { align: 'center' });
  doc.text('-T.I.N.)', x + COL.empNo / 2, row2Y + 18, { align: 'center' });
  x += COL.empNo;
  doc.line(x, y, x, y + headerH);
  
  // Column 2: Name of School Personnel (Arrange by Position, Descending)
  doc.text('Name of School Personnel', x + COL.name / 2, row2Y + 8, { align: 'center' });
  doc.text('(Arrange by Position,', x + COL.name / 2, row2Y + 12, { align: 'center' });
  doc.text('Descending)', x + COL.name / 2, row2Y + 16, { align: 'center' });
  x += COL.name;
  doc.line(x, y, x, y + headerH);
  
  // Column 3: Sex
  doc.text('Sex', x + COL.sex / 2, row2Y + 12, { align: 'center' });
  x += COL.sex;
  doc.line(x, y, x, y + headerH);
  
  // Column 4: Fund Source
  doc.text('Fund', x + COL.fund / 2, row2Y + 10, { align: 'center' });
  doc.text('Source', x + COL.fund / 2, row2Y + 14, { align: 'center' });
  x += COL.fund;
  doc.line(x, y, x, y + headerH);
  
  // Column 5: Position/Designation
  doc.text('Position/', x + COL.position / 2, row2Y + 10, { align: 'center' });
  doc.text('Designation', x + COL.position / 2, row2Y + 14, { align: 'center' });
  x += COL.position;
  doc.line(x, y, x, y + headerH);
  
  // Column 6: Nature of Appointment/Employment Status
  doc.text('Nature of', x + COL.nature / 2, row2Y + 3, { align: 'center' });
  doc.text('Appointment/', x + COL.nature / 2, row2Y + 6.5, { align: 'center' });
  doc.text('Employment', x + COL.nature / 2, row2Y + 10, { align: 'center' });
  doc.text('Status', x + COL.nature / 2, row2Y + 13.5, { align: 'center' });
  doc.text('(Regular/', x + COL.nature / 2, row2Y + 17, { align: 'center' });
  doc.text('Probationary/', x + COL.nature / 2, row2Y + 20.5, { align: 'center' });
  doc.text('Part Time)', x + COL.nature / 2, row2Y + 24, { align: 'center' });
  x += COL.nature;
  // Section boundary already drawn above
  
  // Column 7: Degree/Postgraduate (under EDUCATIONAL QUALIFICATION)
  doc.text('Degree/', x + COL.degree / 2, row2Y + 8, { align: 'center' });
  doc.text('Post-', x + COL.degree / 2, row2Y + 11.5, { align: 'center' });
  doc.text('graduate', x + COL.degree / 2, row2Y + 15, { align: 'center' });
  x += COL.degree;
  doc.line(x, row2Y, x, y + headerH);
  
  // Column 8: Major/Specialization/Specialized Training Attended
  doc.text('Major/', x + COL.major / 2, row2Y + 4, { align: 'center' });
  doc.text('Specialization/', x + COL.major / 2, row2Y + 7.5, { align: 'center' });
  doc.text('Specialized', x + COL.major / 2, row2Y + 11, { align: 'center' });
  doc.text('Training', x + COL.major / 2, row2Y + 14.5, { align: 'center' });
  doc.text('Attended', x + COL.major / 2, row2Y + 18, { align: 'center' });
  x += COL.major;
  doc.line(x, row2Y, x, y + headerH);
  
  // Column 9: Minor
  doc.text('Minor', x + COL.minor / 2, row2Y + 12, { align: 'center' });
  x += COL.minor;
  // Skip subjects and grade columns in Row 2 - they are rendered spanning both rows above
  x += COL.subjects;
  x += COL.grade;
  
  // Column 12: DAY (M/T/W/TH/F) - under Daily Program
  doc.text('DAY', x + COL.day / 2, row2Y + 6, { align: 'center' });
  doc.text('(M/T/W/', x + COL.day / 2, row2Y + 11, { align: 'center' });
  doc.text('TH/F)', x + COL.day / 2, row2Y + 16, { align: 'center' });
  x += COL.day;
  doc.line(x, row2Y, x, y + headerH);
  
  // Column 13: From (00:00) - under Daily Program
  doc.text('From', x + COL.from / 2, row2Y + 6, { align: 'center' });
  doc.text('(00:00)', x + COL.from / 2, row2Y + 11, { align: 'center' });
  x += COL.from;
  doc.line(x, row2Y, x, y + headerH);
  
  // Column 14: To (00:00) - under Daily Program
  doc.text('To', x + COL.to / 2, row2Y + 11, { align: 'center' });
  doc.text('(00:00)', x + COL.to / 2, row2Y + 16, { align: 'center' });
  // Note: Total and Remarks columns already rendered spanning both rows above
  
  return y + headerH;
}

function renderDataRows(doc: jsPDF, y: number, personnel: SF7PersonnelRecord[]): number {
  const rowH = 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  
  const tableW = Object.values(COL).reduce((a, b) => a + b, 0);
  
  // Handle empty or undefined personnel array
  if (!personnel || personnel.length === 0) {
    // Draw empty row
    let x = PAGE.MARGIN;
    doc.rect(x, y, tableW, rowH);
    doc.text('No personnel records found', x + 100, y + 6);
    return y + rowH;
  }
  
  personnel.forEach((person, index) => {
    if (y > PAGE.HEIGHT - 20) {
      doc.addPage();
      y = PAGE.MARGIN;
      y = renderMainTableHeader(doc, y);
    }
    
    let x = PAGE.MARGIN;
    const textY = y + 6;
    
    doc.rect(x, y, tableW, rowH);
    
    // Employee No / T.I.N.
    doc.text(person.employee_number || `${index + 1}`, x + 2, textY, { maxWidth: COL.empNo - 3 });
    x += COL.empNo;
    doc.line(x, y, x, y + rowH);
    
    // Name (Last, First, Middle)
    const name = [person.last_name, person.first_name, person.middle_name].filter(Boolean).join(', ');
    doc.text(name, x + 2, textY, { maxWidth: COL.name - 4 });
    x += COL.name;
    doc.line(x, y, x, y + rowH);
    
    // Sex
    doc.text(person.sex || '', x + COL.sex / 2, textY, { align: 'center' });
    x += COL.sex;
    doc.line(x, y, x, y + rowH);
    
    // Fund Source
    const fundSource = person.employment_status === 'permanent' ? 'DepEd' : 'Other';
    doc.text(fundSource, x + 2, textY, { maxWidth: COL.fund - 3 });
    x += COL.fund;
    doc.line(x, y, x, y + rowH);
    
    // Position/Designation
    const pos = (person.position || '').replace(/_/g, ' ');
    doc.text(pos, x + 2, textY, { maxWidth: COL.position - 3 });
    x += COL.position;
    doc.line(x, y, x, y + rowH);
    
    // Nature of Appointment/Employment Status
    const nature = person.employment_status || '';
    doc.text(nature.charAt(0).toUpperCase() + nature.slice(1), x + 2, textY, { maxWidth: COL.nature - 3 });
    x += COL.nature;
    // Section boundary (thicker) - EDUCATIONAL QUALIFICATION starts here
    doc.setLineWidth(0.4);
    doc.line(x, y, x, y + rowH);
    doc.setLineWidth(0.2);
    
    // Degree/Postgraduate
    doc.text(person.highest_education || '', x + 2, textY, { maxWidth: COL.degree - 3 });
    x += COL.degree;
    doc.line(x, y, x, y + rowH);
    
    // Major/Specialization
    doc.text(person.major_specialization || '', x + 2, textY, { maxWidth: COL.major - 3 });
    x += COL.major;
    doc.line(x, y, x, y + rowH);
    
    // Minor
    doc.text('', x + 2, textY, { maxWidth: COL.minor - 3 });
    x += COL.minor;
    // Section boundary (thicker) - SUBJECTS TAUGHT starts here
    doc.setLineWidth(0.4);
    doc.line(x, y, x, y + rowH);
    doc.setLineWidth(0.2);
    
    // Subjects Taught, Advisory Class & Other Ancillary Assignments
    const subjects = (person.teaching_assignments || []).map(a => a.subject).join(', ');
    const ancillary = (person.ancillary_responsibilities || []).map(r => r.responsibility).join(', ');
    const allAssignments = [subjects, ancillary].filter(Boolean).join('; ');
    doc.text(allAssignments || '', x + 2, textY, { maxWidth: COL.subjects - 3 });
    x += COL.subjects;
    // Section boundary (thicker) - GRADE starts here
    doc.setLineWidth(0.4);
    doc.line(x, y, x, y + rowH);
    doc.setLineWidth(0.2);
    
    // Grade and Sections
    const grades = (person.teaching_assignments || [])
      .map(a => `G${a.grade_level}`)
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(', ');
    doc.text(grades || '', x + 2, textY, { maxWidth: COL.grade - 3 });
    x += COL.grade;
    // Section boundary (thicker) - DAILY PROGRAM starts here
    doc.setLineWidth(0.4);
    doc.line(x, y, x, y + rowH);
    doc.setLineWidth(0.2);
    
    // DAY (M/T/W/TH/F)
    doc.text('M-F', x + COL.day / 2, textY, { align: 'center' });
    x += COL.day;
    doc.line(x, y, x, y + rowH);
    
    // From (00:00)
    doc.text('08:00', x + COL.from / 2, textY, { align: 'center' });
    x += COL.from;
    doc.line(x, y, x, y + rowH);
    
    // To (00:00)
    doc.text('17:00', x + COL.to / 2, textY, { align: 'center' });
    x += COL.to;
    // Section boundary (thicker) - TOTAL starts here
    doc.setLineWidth(0.4);
    doc.line(x, y, x, y + rowH);
    doc.setLineWidth(0.2);
    
    // Total Actual Teaching Minutes per Week
    const totalMins = (person.total_teaching_hours || 0) * 60;
    doc.text(totalMins > 0 ? totalMins.toString() : '', x + COL.total / 2, textY, { align: 'center' });
    x += COL.total;
    // Section boundary (thicker) - REMARKS starts here
    doc.setLineWidth(0.4);
    doc.line(x, y, x, y + rowH);
    doc.setLineWidth(0.2);
    
    // Remarks
    doc.text('', x + 2, textY, { maxWidth: COL.remarks - 3 });
    
    y += rowH;
  });
  
  return y;
}

export async function downloadSF7PDF(options: SF7PDFOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'legal',
  });
  
  const logos = await loadLogos();
  const safePersonnel = options.personnel || [];
  
  let y = renderHeader(doc, logos, options);
  y = renderSummaryTables(doc, y);
  y = renderMainTableHeader(doc, y);
  y = renderDataRows(doc, y, safePersonnel);
  
  const filename = `SF7_${options.school_name.replace(/\s+/g, '_')}_${options.school_year}.pdf`;
  doc.save(filename);
}

export async function generateSF7PDFBlob(options: SF7PDFOptions): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'legal',
  });
  
  const logos = await loadLogos();
  const safePersonnel = options.personnel || [];
  
  let y = renderHeader(doc, logos, options);
  y = renderSummaryTables(doc, y);
  y = renderMainTableHeader(doc, y);
  y = renderDataRows(doc, y, safePersonnel);
  
  return doc.output('blob');
}
