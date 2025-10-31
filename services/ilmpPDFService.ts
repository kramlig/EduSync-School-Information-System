/**
 * ILMP PDF Export Service
 * 
 * Generates printable Individualized Learning & Monitoring Plan (ILMP)
 * documents in DepEd-compliant format using jsPDF.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDepEdDate, getCurrentSchoolYear } from './dateHelpers';

interface StudentInfo {
  name: string;
  lrn: string;
  gradeLevel: number;
  sectionName: string;
}

interface InterventionStrategy {
  id: string;
  area: string;
  strategy: string;
  timeline: string;
  responsible: string;
}

interface ILMPData {
  student: StudentInfo;
  identifiedNeeds: string;
  learningGoals: string;
  strategies: InterventionStrategy[];
  monitoringPlan: string;
  parentInvolvement: string;
}

/**
 * Generate ILMP PDF Document
 */
export function generateILMPPDF(data: ILMPData): void {
  const doc = new jsPDF('p', 'mm', 'letter');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Helper function to add page if needed
  const checkAddPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper function to draw section box
  const drawSectionBox = (title: string, content: string, startY: number): number => {
    const boxPadding = 5;
    const titleHeight = 8;
    
    // Title background
    doc.setFillColor(59, 130, 246); // Blue
    doc.rect(margin, startY, contentWidth, titleHeight, 'F');
    
    // Title text
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin + boxPadding, startY + 5.5);
    
    // Content box
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    const contentLines = doc.splitTextToSize(content || 'N/A', contentWidth - (boxPadding * 2));
    const contentHeight = (contentLines.length * 5) + (boxPadding * 2);
    doc.rect(margin, startY + titleHeight, contentWidth, contentHeight);
    
    // Content text
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(contentLines, margin + boxPadding, startY + titleHeight + boxPadding + 4);
    
    return startY + titleHeight + contentHeight + 5;
  };

  // ===== HEADER =====
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INDIVIDUALIZED LEARNING & MONITORING PLAN', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('(ILMP)', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(9);
  doc.text(`School Year: ${getCurrentSchoolYear()}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // ===== STUDENT INFORMATION =====
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, contentWidth, 30, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, yPos, contentWidth, 30);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENT INFORMATION', margin + 5, yPos + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  yPos += 12;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Name:', margin + 5, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.student.name, margin + 25, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('LRN:', margin + 110, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.student.lrn, margin + 125, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Grade Level:', margin + 5, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(
    data.student.gradeLevel === 0 ? 'Kindergarten' : `Grade ${data.student.gradeLevel}`,
    margin + 25,
    yPos
  );

  doc.setFont('helvetica', 'bold');
  doc.text('Section:', margin + 110, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.student.sectionName, margin + 125, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Date Prepared:', margin + 5, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDepEdDate(new Date()), margin + 30, yPos);
  yPos += 15;

  // ===== IDENTIFIED NEEDS =====
  checkAddPage(40);
  yPos = drawSectionBox('I. IDENTIFIED LEARNING NEEDS', data.identifiedNeeds, yPos);

  // ===== LEARNING GOALS =====
  checkAddPage(40);
  yPos = drawSectionBox('II. LEARNING GOALS', data.learningGoals, yPos);

  // ===== INTERVENTION STRATEGIES =====
  checkAddPage(60);
  doc.setFillColor(59, 130, 246);
  doc.rect(margin, yPos, contentWidth, 8, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('III. INTERVENTION STRATEGIES', margin + 5, yPos + 5.5);
  yPos += 10;

  // Strategies table
  const strategyRows = data.strategies
    .filter(s => s.area || s.strategy) // Only include filled strategies
    .map(s => [
      s.area || 'N/A',
      s.strategy || 'N/A',
      s.timeline || 'N/A',
      s.responsible || 'N/A'
    ]);

  if (strategyRows.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Learning Area', 'Strategy/Activity', 'Timeline', 'Responsible Person']],
      body: strategyRows,
      theme: 'grid',
      headStyles: {
        fillColor: [229, 231, 235],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('No intervention strategies specified.', margin + 5, yPos);
    yPos += 10;
  }

  // ===== MONITORING PLAN =====
  checkAddPage(40);
  doc.setTextColor(0, 0, 0);
  yPos = drawSectionBox('IV. MONITORING & EVALUATION PLAN', data.monitoringPlan, yPos);

  // ===== PARENT INVOLVEMENT =====
  checkAddPage(40);
  yPos = drawSectionBox('V. PARENT/GUARDIAN INVOLVEMENT', data.parentInvolvement, yPos);

  // ===== SIGNATURES =====
  checkAddPage(50);
  yPos += 10;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  // Teacher signature
  doc.text('_________________________________', margin + 5, yPos);
  doc.text('Teacher Signature over Printed Name', margin + 5, yPos + 6);
  doc.text('Date: _______________', margin + 5, yPos + 12);
  
  // Principal signature
  doc.text('_________________________________', margin + 110, yPos);
  doc.text('Principal Signature over Printed Name', margin + 110, yPos + 6);
  doc.text('Date: _______________', margin + 110, yPos + 12);
  
  yPos += 20;
  
  // Parent signature
  doc.text('_________________________________', margin + 5, yPos);
  doc.text('Parent/Guardian Signature', margin + 5, yPos + 6);
  doc.text('Date: _______________', margin + 5, yPos + 12);

  // ===== FOOTER =====
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${totalPages} | Generated: ${formatDepEdDate(new Date())}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    
    // DepEd reference
    doc.setFontSize(7);
    doc.text(
      'Reference: DepEd Order No. 21, s. 2019 - Policy Guidelines on the K to 12 Basic Education Program',
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // ===== SAVE PDF =====
  const studentName = data.student.name.replace(/[^a-z0-9]/gi, '_');
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `ILMP_${studentName}_${timestamp}.pdf`;
  
  doc.save(filename);
}
