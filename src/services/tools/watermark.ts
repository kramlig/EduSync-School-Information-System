/**
 * Watermark utility for free-tier PDF downloads.
 * Adds a subtle footer to every page.
 */

import type jsPDF from 'jspdf';

export function addWatermark(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(170, 170, 170);
    doc.text(
      'Generated with EduSync Free Tools — edusync.ph/tools',
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 4,
      { align: 'center' }
    );
  }
}
