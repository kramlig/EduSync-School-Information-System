/**
 * Receipt PDF Generator
 * 
 * Generates BIR-compliant official receipt PDFs using jsPDF
 * Features:
 * - Auto-sized layout
 * - School letterhead
 * - Receipt numbering
 * - Amount in words
 * - Payment details
 * - Balance tracking
 */

import { jsPDF } from 'jspdf';
import type { Receipt, Student, SchoolSettings } from '../../types';

/**
 * Convert number to words (Philippine English)
 */
function numberToWords(num: number): string {
  if (num === 0) return 'Zero Pesos';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const thousands = ['', 'Thousand', 'Million', 'Billion'];

  function convertHundreds(n: number): string {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const one = n % 10;
      return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
    }
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    return ones[hundred] + ' Hundred' + (remainder > 0 ? ' ' + convertHundreds(remainder) : '');
  }

  // Split into pesos and centavos
  const pesos = Math.floor(num);
  const centavos = Math.round((num - pesos) * 100);

  let result = '';
  
  // Convert pesos
  if (pesos === 0) {
    result = 'Zero Pesos';
  } else {
    let tempPesos = pesos;
    let thousandIndex = 0;
    const parts: string[] = [];

    while (tempPesos > 0) {
      const chunk = tempPesos % 1000;
      if (chunk > 0) {
        const chunkWords = convertHundreds(chunk);
        const thousandWord = thousands[thousandIndex];
        parts.unshift(chunkWords + (thousandWord ? ' ' + thousandWord : ''));
      }
      tempPesos = Math.floor(tempPesos / 1000);
      thousandIndex++;
    }

    result = parts.join(' ') + ' Pesos';
  }

  // Add centavos
  if (centavos > 0) {
    result += ' and ' + convertHundreds(centavos) + ' Centavos';
  }

  return result + ' Only';
}

/**
 * Format currency
 * Note: Using 'P' instead of '₱' for PDF compatibility
 * jsPDF's default helvetica font doesn't support the peso Unicode character
 */
function formatCurrency(amount: number): string {
  return 'P ' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Format date
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format time
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Generate Receipt PDF
 */
export function generateReceiptPDF(
  receipt: Receipt,
  student: Student,
  settings: SchoolSettings
): jsPDF {
  // Create PDF (A5 size for receipts - 148 x 210 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  // Helper function to add centered text
  const addCenteredText = (text: string, size: number = 10, style: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
  };

  // Use school info from database if available, otherwise fallback to settings
  const schoolInfo = (receipt as any).schoolInfo;
  console.log('[receiptPDFGenerator] Receipt school info:', schoolInfo);
  console.log('[receiptPDFGenerator] Settings:', settings);
  
  const schoolName = schoolInfo?.name || settings.schoolName || 'School Name';
  const region = schoolInfo?.region || settings.region;
  const division = schoolInfo?.division || settings.division;
  const district = schoolInfo?.district || settings.district;
  const contactPhone = schoolInfo?.contact_phone; // Updated field name
  const contactEmail = schoolInfo?.contact_email; // Updated field name
  const tin = schoolInfo?.tin;

  // Header - School Name
  addCenteredText(schoolName.toUpperCase(), 16, 'bold');
  y += 6;
  
  // Region/Division/District Info
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const locationParts = [];
  if (region) locationParts.push(`Region ${region}`);
  if (division) locationParts.push(`Division of ${division}`);
  if (district) locationParts.push(`${district}`);
  if (locationParts.length > 0) {
    const locationInfo = locationParts.join(' • ');
    const locationWidth = doc.getTextWidth(locationInfo);
    doc.text(locationInfo, (pageWidth - locationWidth) / 2, y);
    y += 5;
  }

  // Contact info from database
  doc.setFontSize(8);
  const contactParts = [];
  if (contactPhone) contactParts.push(`Tel: ${contactPhone}`); // Updated variable name
  if (contactEmail) contactParts.push(contactEmail); // Updated variable name
  if (contactParts.length > 0) {
    const contactInfo = contactParts.join(' • ');
    const contactWidth = doc.getTextWidth(contactInfo);
    doc.text(contactInfo, (pageWidth - contactWidth) / 2, y);
    y += 5;
  }

  // TIN from database (for BIR compliance)
  if (tin) {
    const tinText = `TIN: ${tin}`;
    const tinWidth = doc.getTextWidth(tinText);
    doc.text(tinText, (pageWidth - tinWidth) / 2, y);
    y += 5;
  }
  y += 5;

  y += 3;

  // Title
  addCenteredText('OFFICIAL RECEIPT', 14, 'bold');
  y += 8;

  // Line separator
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // Receipt Number and Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Receipt No.:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(receipt.receiptNumber, margin + 30, y);

  doc.setFont('helvetica', 'bold');
  const dateLabel = 'Date:';
  const dateLabelWidth = doc.getTextWidth(dateLabel);
  doc.text(dateLabel, pageWidth - margin - dateLabelWidth - 35, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(receipt.date), pageWidth - margin - 35, y);
  y += 6;

  // Time
  doc.setFont('helvetica', 'bold');
  const timeLabel = 'Time:';
  const timeLabelWidth = doc.getTextWidth(timeLabel);
  doc.text(timeLabel, pageWidth - margin - timeLabelWidth - 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatTime(receipt.date), pageWidth - margin - 20, y);
  y += 8;

  // Received from
  doc.setFont('helvetica', 'bold');
  doc.text('Received from:', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(receipt.studentName, margin + 5, y);
  y += 5;
  
  // Student details
  doc.setFontSize(9);
  const sectionDisplay = student.sectionName || (student.sectionId ? `Section ${student.sectionId.substring(0, 8)}...` : 'N/A');
  const studentDetails = `LRN: ${student.lrn || 'N/A'} • Section: ${sectionDisplay}`;
  doc.text(studentDetails, margin + 5, y);
  y += 8;

  // Amount
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Amount:', margin, y);
  doc.setFontSize(14);
  const amountText = formatCurrency(receipt.amount);
  const amountWidth = doc.getTextWidth(amountText);
  doc.text(amountText, pageWidth - margin - amountWidth, y);
  y += 8;

  // Amount in words
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  const amountInWords = numberToWords(receipt.amount);
  const maxWidth = contentWidth - 10;
  const wrappedWords = doc.splitTextToSize(amountInWords, maxWidth);
  doc.text(wrappedWords, margin + 5, y);
  y += (wrappedWords.length * 4) + 5;

  // Line separator
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Payment for
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment for:', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const descriptionLines = doc.splitTextToSize(receipt.description, contentWidth - 10);
  doc.text(descriptionLines, margin + 5, y);
  y += (descriptionLines.length * 4) + 5;

  // Payment Method
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Method:', margin, y);
  doc.setFont('helvetica', 'normal');
  const methodText = receipt.paymentMethod ? receipt.paymentMethod.toUpperCase().replace('_', ' ') : 'CASH';
  doc.text(methodText, margin + 35, y);
  y += 5;

  // Reference Number (if applicable)
  if (receipt.referenceNumber) {
    doc.setFont('helvetica', 'bold');
    doc.text('Reference No.:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(receipt.referenceNumber, margin + 35, y);
    y += 5;
  }

  // Check Number (if applicable)
  if (receipt.checkNumber) {
    doc.setFont('helvetica', 'bold');
    doc.text('Check No.:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(receipt.checkNumber, margin + 35, y);
    y += 5;
  }

  // Bank Name (if applicable)
  if (receipt.bankName) {
    doc.setFont('helvetica', 'bold');
    doc.text('Bank:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(receipt.bankName, margin + 35, y);
    y += 5;
  }

  y += 3;

  // Line separator
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Balance Information
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  // Previous Balance
  doc.text('Previous Balance:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCurrency(receipt.previousBalance), pageWidth - margin - 25, y);
  y += 5;

  // Amount Paid
  doc.setFont('helvetica', 'bold');
  doc.text('Amount Paid:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 128, 0); // Green
  doc.text('- ' + formatCurrency(receipt.amountPaid), pageWidth - margin - 25, y);
  doc.setTextColor(0, 0, 0); // Back to black
  y += 6;

  // Line above new balance
  doc.setLineWidth(0.3);
  doc.line(pageWidth - margin - 30, y - 1, pageWidth - margin, y - 1);
  y += 3;

  // New Balance
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('New Balance:', margin, y);
  doc.setFontSize(12);
  if (receipt.newBalance === 0) {
    doc.setTextColor(0, 128, 0); // Green for fully paid
    doc.text('PAID', pageWidth - margin - 20, y);
  } else {
    doc.text(formatCurrency(receipt.newBalance), pageWidth - margin - 25, y);
  }
  doc.setTextColor(0, 0, 0); // Back to black
  y += 10;

  // Line separator
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // Received by
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Received by:', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(receipt.receivedByName, margin + 5, y);
  y += 8;

  // Signature line
  doc.line(margin + 5, y, margin + 50, y);
  y += 4;
  doc.setFontSize(8);
  doc.text('Authorized Signature', margin + 5, y);
  y += 10;

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const footerText = 'This serves as your official receipt. Please keep for your records.';
  const footerWidth = doc.getTextWidth(footerText);
  doc.text(footerText, (pageWidth - footerWidth) / 2, y);
  y += 4;

  const footerText2 = 'Thank you for your payment!';
  const footer2Width = doc.getTextWidth(footerText2);
  doc.text(footerText2, (pageWidth - footer2Width) / 2, y);

  return doc;
}

/**
 * Download receipt as PDF
 */
export function downloadReceipt(
  receipt: Receipt,
  student: Student,
  settings: SchoolSettings
): void {
  const doc = generateReceiptPDF(receipt, student, settings);
  const filename = `Receipt_${receipt.receiptNumber}_${student.lastName || 'Student'}.pdf`;
  doc.save(filename);
}

/**
 * Print receipt
 */
export function printReceipt(
  receipt: Receipt,
  student: Student,
  settings: SchoolSettings
): void {
  const doc = generateReceiptPDF(receipt, student, settings);
  
  // Open in new window for printing
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/**
 * Get receipt as base64 string (for storage or email)
 */
export function getReceiptBase64(
  receipt: Receipt,
  student: Student,
  settings: SchoolSettings
): string {
  const doc = generateReceiptPDF(receipt, student, settings);
  return doc.output('dataurlstring');
}
