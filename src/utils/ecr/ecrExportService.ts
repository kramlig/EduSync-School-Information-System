/**
 * ECR Export Service - Electronic Class Record Export Utilities
 * 
 * Provides CSV and PDF export functionality for ECR data
 * following Division of Mati City ECR format with DepEd branding
 * 
 * Features:
 * - CSV export for spreadsheet compatibility
 * - PDF export with DepEd and school logos
 * - Official Division format layout
 */

import jsPDF from 'jspdf';
import type { ECRStudentRow, ECRActivity, ECRQuarter } from '../../types/ecr.types';
// DepEd logo assets - follows SF Forms standard naming convention
import depedSealUrl from '../../assets/deped-logo.png'; // DepEd Logo (left)
import depedLogoUrl from '../../assets/deped-seal.png'; // DepEd Seal (right)

// ============================================
// Types
// ============================================

export interface ECRExportData {
  schoolName: string;
  schoolId: string;
  schoolIdNumber: string; // Official DepEd school ID number
  region: string;
  division: string;
  district: string;
  schoolYear: string;
  quarter: ECRQuarter;
  gradeLevel: number;
  sectionName: string;
  learningAreaName: string;
  learningAreaCode: string; // Short code for learning area
  teacherName: string;
  activities: {
    ww: ECRActivity[];
    pt: ECRActivity[];
    qa: ECRActivity[];
  };
  weights: {
    ww: number;
    pt: number;
    qa: number;
  };
  students: ECRStudentRow[];
}

// ============================================
// Logo Loading Utility (matches SF Forms pattern)
// ============================================

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

// ============================================
// CSV Export
// ============================================

/**
 * Generate CSV content for ECR
 * Format matches Division of Mati City ECR template
 */
export function generateECRCSV(data: ECRExportData): string {
  const lines: string[] = [];
  const ACTIVITY_SLOTS = 5; // Number of activity columns per component
  
  // Header information
  lines.push('ELECTRONIC CLASS RECORD (ECR)');
  lines.push(`School Name:,${data.schoolName}`);
  lines.push(`School ID:,${data.schoolIdNumber}`);
  lines.push(`Region:,${data.region}`);
  lines.push(`Division:,${data.division}`);
  lines.push(`District:,${data.district}`);
  lines.push(`School Year:,${data.schoolYear}`);
  lines.push(`Quarter:,${data.quarter}`);
  lines.push(`Grade Level:,${data.gradeLevel}`);
  lines.push(`Section:,${data.sectionName}`);
  lines.push(`Learning Area:,${data.learningAreaCode || data.learningAreaName}`);
  lines.push(`Teacher:,${data.teacherName}`);
  lines.push('');
  
  // Build column headers
  const headers: string[] = ['No.', 'Name'];
  
  // WW columns (5 slots)
  if (data.weights.ww > 0) {
    for (let i = 1; i <= ACTIVITY_SLOTS; i++) {
      const activity = data.activities.ww.find(a => a.activityNumber === i);
      headers.push(activity ? `WW${i}(${activity.maxScore})` : `WW${i}`);
    }
    headers.push('WW Total', 'WW PS', 'WW WS');
  }
  
  // PT columns (5 slots)
  if (data.weights.pt > 0) {
    for (let i = 1; i <= ACTIVITY_SLOTS; i++) {
      const activity = data.activities.pt.find(a => a.activityNumber === i);
      headers.push(activity ? `PT${i}(${activity.maxScore})` : `PT${i}`);
    }
    headers.push('PT Total', 'PT PS', 'PT WS');
  }
  
  // QA columns (only if weight > 0)
  if (data.weights.qa > 0) {
    for (let i = 1; i <= ACTIVITY_SLOTS; i++) {
      const activity = data.activities.qa.find(a => a.activityNumber === i);
      headers.push(activity ? `QA${i}(${activity.maxScore})` : `QA${i}`);
    }
    headers.push('QA Total', 'QA PS', 'QA WS');
  }
  
  headers.push('Initial Grade', 'Quarterly Grade', 'Remarks');
  lines.push(headers.join(','));
  
  // Student rows
  data.students.forEach((student, index) => {
    const row: string[] = [
      String(index + 1),
      `"${student.studentName}"`
    ];
    
    // WW scores
    if (data.weights.ww > 0) {
      for (let i = 1; i <= ACTIVITY_SLOTS; i++) {
        const activity = data.activities.ww.find(a => a.activityNumber === i);
        if (activity) {
          const score = student.scores[activity.id]?.rawScore;
          row.push(score !== null && score !== undefined ? String(score) : '');
        } else {
          row.push('');
        }
      }
      row.push(
        `${student.wwTotal}/${student.wwMax}`,
        `${student.wwPercentage.toFixed(0)}%`,
        student.wwWeighted.toFixed(2)
      );
    }
    
    // PT scores
    if (data.weights.pt > 0) {
      for (let i = 1; i <= ACTIVITY_SLOTS; i++) {
        const activity = data.activities.pt.find(a => a.activityNumber === i);
        if (activity) {
          const score = student.scores[activity.id]?.rawScore;
          row.push(score !== null && score !== undefined ? String(score) : '');
        } else {
          row.push('');
        }
      }
      row.push(
        `${student.ptTotal}/${student.ptMax}`,
        `${student.ptPercentage.toFixed(0)}%`,
        student.ptWeighted.toFixed(2)
      );
    }
    
    // QA scores (only if weight > 0)
    if (data.weights.qa > 0) {
      for (let i = 1; i <= ACTIVITY_SLOTS; i++) {
        const activity = data.activities.qa.find(a => a.activityNumber === i);
        if (activity) {
          const score = student.scores[activity.id]?.rawScore;
          row.push(score !== null && score !== undefined ? String(score) : '');
        } else {
          row.push('');
        }
      }
      row.push(
        `${student.qaTotal}/${student.qaMax}`,
        `${student.qaPercentage.toFixed(0)}%`,
        student.qaWeighted.toFixed(2)
      );
    }
    
    // Final grades
    const initialGrade = (student.wwWeighted + student.ptWeighted + student.qaWeighted).toFixed(2);
    row.push(
      initialGrade,
      String(student.quarterlyGrade),
      student.quarterlyGrade >= 75 ? 'Passed' : (student.quarterlyGrade > 0 ? 'Failed' : '')
    );
    
    lines.push(row.join(','));
  });
  
  // Weight summary at bottom
  lines.push('');
  lines.push('COMPONENT WEIGHTS:');
  lines.push(`Written Work (WW):,${data.weights.ww}%`);
  lines.push(`Performance Task (PT):,${data.weights.pt}%`);
  lines.push(`Quarterly Assessment (QA):,${data.weights.qa}%`);
  lines.push(`Total:,${data.weights.ww + data.weights.pt + data.weights.qa}%`);
  
  return lines.join('\n');
}

/**
 * Download ECR as CSV file
 */
export function downloadECRCSV(data: ECRExportData): void {
  const csv = generateECRCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ECR_${data.sectionName}_${data.learningAreaName}_${data.quarter}_${data.schoolYear.replace('-', '_')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================
// PDF Export
// ============================================

/**
 * Generate PDF for ECR following Division format
 * Landscape LEGAL with DepEd Logo (left) and DepEd Seal (right)
 * Follows SF Forms standard layout with dynamic column sizing
 */
export async function generateECRPDF(data: ECRExportData): Promise<void> {
  const logos = await loadLogos();
  
  // Use LEGAL paper (same as SF7) for more width
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'legal' // 355.6mm x 215.9mm
  });
  
  const PAGE_WIDTH = 355.6;
  const PAGE_HEIGHT = 215.9;
  const MARGIN = 8;
  const USABLE_WIDTH = PAGE_WIDTH - 2 * MARGIN;
  
  // Determine which components are visible
  const showWW = data.weights.ww > 0;
  const showPT = data.weights.pt > 0;
  const showQA = data.weights.qa > 0;
  const componentCount = (showWW ? 1 : 0) + (showPT ? 1 : 0) + (showQA ? 1 : 0);
  
  // Dynamic activity slots - use 10 (UI default) if fits, otherwise calculate
  // For Legal paper: we have ~340mm usable
  // Fixed columns: No(7) + Name(40) + Grade(12) + Remarks(18) = 77mm
  // Remaining for components: 340 - 77 = 263mm
  // Per component with 10 activities: 10*6 + 3*10 = 90mm → 3 components = 270mm (too wide)
  // Per component with 5 activities: 5*6 + 3*10 = 60mm → 3 components = 180mm (fits!)
  // Per component with 3 activities: 3*6 + 3*10 = 48mm → 3 components = 144mm (fits well)
  
  // Calculate optimal activity slots based on component count
  const remainingWidth = USABLE_WIDTH - 77; // Fixed columns
  const maxActivitySlotsPerComponent = Math.floor((remainingWidth / componentCount - 30) / 6);
  const ACTIVITY_SLOTS = Math.min(10, Math.max(3, maxActivitySlotsPerComponent));
  
  // Column widths (tighter for better fit)
  const numColWidth = 7;
  const nameColWidth = 40;
  const scoreColWidth = 6;
  const summaryColWidth = 10;
  const initialGradeColWidth = 14; // Initial Grade (sum of weighted scores)
  const gradeColWidth = 14; // Quarterly Grade
  const remarksColWidth = 16;
  
  // ============================================
  // Header Section
  // ============================================
  let y = 5;
  
  // DepEd Seal (left) - Calculate width based on natural aspect ratio
  if (logos.seal.src) {
    const sealHeight = 15;
    const sealWidth = (logos.seal.naturalWidth / logos.seal.naturalHeight) * sealHeight;
    doc.addImage(logos.seal, 'PNG', MARGIN, y, sealWidth, sealHeight);
  }
  
  // DepEd Logo (right) - Calculate width based on natural aspect ratio to prevent distortion
  if (logos.logo.src) {
    const logoHeight = 18;
    const logoWidth = (logos.logo.naturalWidth / logos.logo.naturalHeight) * logoHeight;
    doc.addImage(logos.logo, 'PNG', PAGE_WIDTH - MARGIN - logoWidth, y, logoWidth, logoHeight);
  }
  
  // Header text - centered
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Republic of the Philippines', PAGE_WIDTH / 2, y + 4, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Department of Education', PAGE_WIDTH / 2, y + 9, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.region || 'Region XI', PAGE_WIDTH / 2, y + 14, { align: 'center' });
  doc.text(data.division || 'Division of the City of Mati', PAGE_WIDTH / 2, y + 18, { align: 'center' });
  
  // Title
  y = 27;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ELECTRONIC CLASS RECORD (ECR)', PAGE_WIDTH / 2, y, { align: 'center' });
  
  // School info - 2 rows with better spacing
  y = 34;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  // Row 1: School Name, School ID, District
  let x = MARGIN;
  doc.text('School Name:', x, y);
  doc.setFont('helvetica', 'bold');
  doc.text(data.schoolName || '', x + 22, y);
  
  x = 120;
  doc.setFont('helvetica', 'normal');
  doc.text('School ID:', x, y);
  doc.setFont('helvetica', 'bold');
  doc.text(data.schoolIdNumber || data.schoolId || '', x + 18, y);
  
  x = 200;
  doc.setFont('helvetica', 'normal');
  doc.text('District:', x, y);
  doc.setFont('helvetica', 'bold');
  doc.text(data.district || '', x + 15, y);
  
  // Row 2: School Year, Quarter, Grade, Section, Learning Area
  y = 39;
  x = MARGIN;
  doc.setFont('helvetica', 'normal');
  doc.text('School Year:', x, y);
  doc.setFont('helvetica', 'bold');
  doc.text(data.schoolYear || '', x + 22, y);
  
  x = 70;
  doc.setFont('helvetica', 'normal');
  doc.text('Quarter:', x, y);
  doc.setFont('helvetica', 'bold');
  doc.text(getQuarterLabel(data.quarter), x + 15, y);
  
  x = 130;
  doc.setFont('helvetica', 'normal');
  doc.text('Grade Level:', x, y);
  doc.setFont('helvetica', 'bold');
  doc.text(String(data.gradeLevel || ''), x + 22, y);
  
  x = 175;
  doc.setFont('helvetica', 'normal');
  doc.text('Section:', x, y);
  doc.setFont('helvetica', 'bold');
  doc.text(data.sectionName || '', x + 15, y);
  
  x = 240;
  doc.setFont('helvetica', 'normal');
  doc.text('Learning Area:', x, y);
  doc.setFont('helvetica', 'bold');
  doc.text(data.learningAreaCode || data.learningAreaName || '', x + 28, y);
  
  // Row 3: Teacher
  y = 44;
  x = MARGIN;
  doc.setFont('helvetica', 'normal');
  doc.text('Teacher:', x, y);
  doc.setFont('helvetica', 'bold');
  doc.text(data.teacherName || '', x + 15, y);
  
  // ============================================
  // Table Section
  // ============================================
  let tableY = 49;
  const rowHeight = 5;
  const headerHeight = 8;
  
  // Calculate actual table width for centering
  let tableWidth = numColWidth + nameColWidth;
  if (showWW) tableWidth += ACTIVITY_SLOTS * scoreColWidth + 3 * summaryColWidth;
  if (showPT) tableWidth += ACTIVITY_SLOTS * scoreColWidth + 3 * summaryColWidth;
  if (showQA) tableWidth += ACTIVITY_SLOTS * scoreColWidth + 3 * summaryColWidth;
  tableWidth += initialGradeColWidth + gradeColWidth + remarksColWidth; // Initial Grade + Quarterly Grade + Remarks
  
  // Center the table
  const tableStartX = Math.max(MARGIN, (PAGE_WIDTH - tableWidth) / 2);
  
  // Helper function to draw table header (reused on each page)
  const drawTableHeader = (startY: number): number => {
    let y = startY;
    let colX = tableStartX;
    
    // Draw table header background
    doc.setFillColor(51, 65, 85); // Slate-700
    doc.rect(tableStartX, y, tableWidth, headerHeight, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    
    // No. column
    doc.rect(colX, y, numColWidth, headerHeight);
    doc.text('No.', colX + numColWidth / 2, y + 5, { align: 'center' });
    colX += numColWidth;
    
    // Name column
    doc.rect(colX, y, nameColWidth, headerHeight);
    doc.text("Learner's Name", colX + nameColWidth / 2, y + 5, { align: 'center' });
    colX += nameColWidth;
    
    // WW columns
    if (showWW) {
      const wwWidth = ACTIVITY_SLOTS * scoreColWidth + 3 * summaryColWidth;
      doc.setFillColor(37, 99, 235); // Blue-600
      doc.rect(colX, y, wwWidth, headerHeight / 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`Written Work (${data.weights.ww}%)`, colX + wwWidth / 2, y + 3, { align: 'center' });
      
      for (let i = 1; i <= ACTIVITY_SLOTS; i++) {
        doc.setFillColor(59, 130, 246); // Blue-500
        doc.rect(colX, y + headerHeight / 2, scoreColWidth, headerHeight / 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(String(i), colX + scoreColWidth / 2, y + headerHeight - 1, { align: 'center' });
        colX += scoreColWidth;
      }
      ['Total', 'PS', 'WS'].forEach(label => {
        doc.setFillColor(30, 64, 175); // Blue-800
        doc.rect(colX, y + headerHeight / 2, summaryColWidth, headerHeight / 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(label, colX + summaryColWidth / 2, y + headerHeight - 1, { align: 'center' });
        colX += summaryColWidth;
      });
    }
    
    // PT columns
    if (showPT) {
      const ptWidth = ACTIVITY_SLOTS * scoreColWidth + 3 * summaryColWidth;
      doc.setFillColor(22, 163, 74); // Green-600
      doc.rect(colX, y, ptWidth, headerHeight / 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`Performance Task (${data.weights.pt}%)`, colX + ptWidth / 2, y + 3, { align: 'center' });
      
      for (let i = 1; i <= ACTIVITY_SLOTS; i++) {
        doc.setFillColor(34, 197, 94); // Green-500
        doc.rect(colX, y + headerHeight / 2, scoreColWidth, headerHeight / 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(String(i), colX + scoreColWidth / 2, y + headerHeight - 1, { align: 'center' });
        colX += scoreColWidth;
      }
      ['Total', 'PS', 'WS'].forEach(label => {
        doc.setFillColor(21, 128, 61); // Green-700
        doc.rect(colX, y + headerHeight / 2, summaryColWidth, headerHeight / 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(label, colX + summaryColWidth / 2, y + headerHeight - 1, { align: 'center' });
        colX += summaryColWidth;
      });
    }
    
    // QA columns
    if (showQA) {
      const qaWidth = ACTIVITY_SLOTS * scoreColWidth + 3 * summaryColWidth;
      doc.setFillColor(147, 51, 234); // Purple-600
      doc.rect(colX, y, qaWidth, headerHeight / 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`Quarterly Assessment (${data.weights.qa}%)`, colX + qaWidth / 2, y + 3, { align: 'center' });
      
      for (let i = 1; i <= ACTIVITY_SLOTS; i++) {
        doc.setFillColor(168, 85, 247); // Purple-500
        doc.rect(colX, y + headerHeight / 2, scoreColWidth, headerHeight / 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(String(i), colX + scoreColWidth / 2, y + headerHeight - 1, { align: 'center' });
        colX += scoreColWidth;
      }
      ['Total', 'PS', 'WS'].forEach(label => {
        doc.setFillColor(107, 33, 168); // Purple-800
        doc.rect(colX, y + headerHeight / 2, summaryColWidth, headerHeight / 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(label, colX + summaryColWidth / 2, y + headerHeight - 1, { align: 'center' });
        colX += summaryColWidth;
      });
    }
    
    // Initial Grade column
    doc.setFillColor(71, 85, 105); // Slate-600
    doc.rect(colX, y, initialGradeColWidth, headerHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(5);
    doc.text('Initial', colX + initialGradeColWidth / 2, y + 3, { align: 'center' });
    doc.text('Grade', colX + initialGradeColWidth / 2, y + 6, { align: 'center' });
    doc.setFontSize(6);
    colX += initialGradeColWidth;
    
    // Quarterly Grade column
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(colX, y, gradeColWidth, headerHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(5);
    doc.text('Quarterly', colX + gradeColWidth / 2, y + 3, { align: 'center' });
    doc.text('Grade', colX + gradeColWidth / 2, y + 6, { align: 'center' });
    doc.setFontSize(6);
    colX += gradeColWidth;
    
    // Remarks column
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(colX, y, remarksColWidth, headerHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('Remarks', colX + remarksColWidth / 2, y + 5, { align: 'center' });
    
    return y + headerHeight;
  };
  
  // Draw initial table header
  y = drawTableHeader(tableY);
  
  // ============================================
  // Data Rows
  // ============================================
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  
  data.students.forEach((student, index) => {
    // Check for page break - redraw header on new page
    if (y + rowHeight > PAGE_HEIGHT - 25) {
      doc.addPage();
      y = drawTableHeader(10); // Redraw full header on new page
      // Reset text settings after header draw
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
    }
    
    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252); // Slate-50
    } else {
      doc.setFillColor(255, 255, 255); // White
    }
    doc.rect(tableStartX, y, tableWidth, rowHeight, 'F');
    
    let colX = tableStartX;
    
    // Row number
    doc.setDrawColor(200, 200, 200);
    doc.rect(colX, y, numColWidth, rowHeight);
    doc.text(String(index + 1), colX + numColWidth / 2, y + 3.5, { align: 'center' });
    colX += numColWidth;
    
    // Student name
    doc.rect(colX, y, nameColWidth, rowHeight);
    doc.text(student.studentName.substring(0, 25), colX + 1, y + 3.5);
    colX += nameColWidth;
    
    // WW scores
    if (showWW) {
      for (let i = 1; i <= ACTIVITY_SLOTS; i++) {
        doc.rect(colX, y, scoreColWidth, rowHeight);
        const activity = data.activities.ww.find(a => a.activityNumber === i);
        if (activity) {
          const score = student.scores[activity.id]?.rawScore;
          if (score !== null && score !== undefined) {
            doc.text(String(score), colX + scoreColWidth / 2, y + 3.5, { align: 'center' });
          }
        }
        colX += scoreColWidth;
      }
      // Summary columns
      doc.rect(colX, y, summaryColWidth, rowHeight);
      doc.text(String(student.wwTotal || 0), colX + summaryColWidth / 2, y + 3.5, { align: 'center' });
      colX += summaryColWidth;
      
      doc.rect(colX, y, summaryColWidth, rowHeight);
      doc.text(`${(student.wwPercentage || 0).toFixed(0)}%`, colX + summaryColWidth / 2, y + 3.5, { align: 'center' });
      colX += summaryColWidth;
      
      doc.rect(colX, y, summaryColWidth, rowHeight);
      doc.text((student.wwWeighted || 0).toFixed(1), colX + summaryColWidth / 2, y + 3.5, { align: 'center' });
      colX += summaryColWidth;
    }
    
    // PT scores
    if (showPT) {
      for (let i = 1; i <= ACTIVITY_SLOTS; i++) {
        doc.rect(colX, y, scoreColWidth, rowHeight);
        const activity = data.activities.pt.find(a => a.activityNumber === i);
        if (activity) {
          const score = student.scores[activity.id]?.rawScore;
          if (score !== null && score !== undefined) {
            doc.text(String(score), colX + scoreColWidth / 2, y + 3.5, { align: 'center' });
          }
        }
        colX += scoreColWidth;
      }
      doc.rect(colX, y, summaryColWidth, rowHeight);
      doc.text(String(student.ptTotal || 0), colX + summaryColWidth / 2, y + 3.5, { align: 'center' });
      colX += summaryColWidth;
      
      doc.rect(colX, y, summaryColWidth, rowHeight);
      doc.text(`${(student.ptPercentage || 0).toFixed(0)}%`, colX + summaryColWidth / 2, y + 3.5, { align: 'center' });
      colX += summaryColWidth;
      
      doc.rect(colX, y, summaryColWidth, rowHeight);
      doc.text((student.ptWeighted || 0).toFixed(1), colX + summaryColWidth / 2, y + 3.5, { align: 'center' });
      colX += summaryColWidth;
    }
    
    // QA scores
    if (showQA) {
      for (let i = 1; i <= ACTIVITY_SLOTS; i++) {
        doc.rect(colX, y, scoreColWidth, rowHeight);
        const activity = data.activities.qa.find(a => a.activityNumber === i);
        if (activity) {
          const score = student.scores[activity.id]?.rawScore;
          if (score !== null && score !== undefined) {
            doc.text(String(score), colX + scoreColWidth / 2, y + 3.5, { align: 'center' });
          }
        }
        colX += scoreColWidth;
      }
      doc.rect(colX, y, summaryColWidth, rowHeight);
      doc.text(String(student.qaTotal || 0), colX + summaryColWidth / 2, y + 3.5, { align: 'center' });
      colX += summaryColWidth;
      
      doc.rect(colX, y, summaryColWidth, rowHeight);
      doc.text(`${(student.qaPercentage || 0).toFixed(0)}%`, colX + summaryColWidth / 2, y + 3.5, { align: 'center' });
      colX += summaryColWidth;
      
      doc.rect(colX, y, summaryColWidth, rowHeight);
      doc.text((student.qaWeighted || 0).toFixed(1), colX + summaryColWidth / 2, y + 3.5, { align: 'center' });
      colX += summaryColWidth;
    }
    
    // Initial Grade (sum of weighted scores: WW + PT + QA)
    const initialGrade = (student.wwWeighted || 0) + (student.ptWeighted || 0) + (student.qaWeighted || 0);
    doc.rect(colX, y, initialGradeColWidth, rowHeight);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(initialGrade > 0 ? initialGrade.toFixed(2) : '-', colX + initialGradeColWidth / 2, y + 3.5, { align: 'center' });
    colX += initialGradeColWidth;
    
    // Quarterly Grade (transmuted final grade)
    doc.rect(colX, y, gradeColWidth, rowHeight);
    doc.setFont('helvetica', 'bold');
    const grade = student.quarterlyGrade || 0;
    if (grade >= 75) {
      doc.setTextColor(22, 163, 74); // Green
    } else if (grade > 0) {
      doc.setTextColor(220, 38, 38); // Red
    } else {
      doc.setTextColor(0, 0, 0);
    }
    doc.text(grade > 0 ? String(grade) : '-', colX + gradeColWidth / 2, y + 3.5, { align: 'center' });
    colX += gradeColWidth;
    
    // Remarks
    doc.rect(colX, y, remarksColWidth, rowHeight);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    if (grade > 0) {
      const remark = grade >= 75 ? 'Passed' : 'Failed';
      if (grade < 75) doc.setTextColor(220, 38, 38);
      doc.text(remark, colX + remarksColWidth / 2, y + 3.5, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    }
    
    y += rowHeight;
  });
  
  // ============================================
  // Footer - Weight Summary and Signatures
  // ============================================
  y += 8;
  
  // Weight summary
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPONENT WEIGHTS:', MARGIN, y);
  doc.setFont('helvetica', 'normal');
  y += 4;
  const weightsText = [];
  if (showWW) weightsText.push(`Written Work: ${data.weights.ww}%`);
  if (showPT) weightsText.push(`Performance Task: ${data.weights.pt}%`);
  if (showQA) weightsText.push(`Quarterly Assessment: ${data.weights.qa}%`);
  doc.text(weightsText.join('   |   '), MARGIN, y);
  
  // Signature lines
  y += 12;
  const sigWidth = 70;
  const sigGap = 40;
  
  // Prepared by
  doc.setFont('helvetica', 'normal');
  doc.line(MARGIN, y, MARGIN + sigWidth, y);
  doc.text('Prepared by:', MARGIN, y + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(data.teacherName || '', MARGIN, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Subject Teacher', MARGIN, y + 12);
  
  // Checked by
  const checkX = MARGIN + sigWidth + sigGap;
  doc.setFontSize(8);
  doc.line(checkX, y, checkX + sigWidth, y);
  doc.text('Checked by:', checkX, y + 4);
  doc.text('___________________', checkX, y + 8);
  doc.setFontSize(7);
  doc.text('Department Head', checkX, y + 12);
  
  // Noted by
  const notedX = checkX + sigWidth + sigGap;
  doc.setFontSize(8);
  doc.line(notedX, y, notedX + sigWidth, y);
  doc.text('Noted by:', notedX, y + 4);
  doc.text('___________________', notedX, y + 8);
  doc.setFontSize(7);
  doc.text('School Principal', notedX, y + 12);
  
  // Date generated
  y += 18;
  doc.setFontSize(7);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`, MARGIN, y);
  
  // Save
  const filename = `ECR_${data.sectionName}_${data.learningAreaCode || data.learningAreaName}_${data.quarter}_${data.schoolYear.replace('-', '_')}.pdf`;
  doc.save(filename);
}

// ============================================
// Utility Functions
// ============================================

function getQuarterLabel(quarter: ECRQuarter): string {
  const labels: Record<ECRQuarter, string> = {
    'Q1': 'First Quarter',
    'Q2': 'Second Quarter',
    'Q3': 'Third Quarter',
    'Q4': 'Fourth Quarter'
  };
  return labels[quarter];
}
