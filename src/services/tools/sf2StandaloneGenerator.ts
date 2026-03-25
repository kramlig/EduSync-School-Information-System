import jsPDF from 'jspdf';
import { registerCalibriFont } from '../../utils/pdf/registerCalibriFont';
import { addWatermark } from './watermark';
import type { SF2ParsedRow } from './csvParser';

export interface SF2StandaloneOptions {
  schoolName: string;
  schoolId: string;
  district?: string;
  division?: string;
  region?: string;
  schoolYear: string;
  gradeLevel: string;
  sectionName: string;
  adviserName?: string;
  reportMonth: string; // "YYYY-MM"
  students: SF2ParsedRow[];
  applyWatermark?: boolean;
}

interface LoadedImage {
  data: string;
  width: number;
  height: number;
}

function loadImageProcessed(url: string): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timeout = setTimeout(() => reject(new Error('Image load timeout')), 5000);
    img.onload = () => {
      clearTimeout(timeout);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve({
          data: canvas.toDataURL('image/png'),
          width: img.width,
          height: img.height,
        });
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error(`Failed to load image: ${url}`));
    };
    img.src = url;
  });
}

export async function generateSF2Standalone(opts: SF2StandaloneOptions): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

  // Register Calibri (Carlito) font
  await registerCalibriFont(doc);

  const [yearStr, monthStr] = opts.reportMonth.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long' });

  let sealImg: LoadedImage | null = null;
  let logoImg: LoadedImage | null = null;
  try { sealImg = await loadImageProcessed('/deped-seal.png'); } catch { /* optional */ }
  try { logoImg = await loadImageProcessed('/logo192.png'); } catch { /* optional */ }

  const males = opts.students.filter(s => s.gender?.toUpperCase().startsWith('M'));
  const females = opts.students.filter(s => !s.gender?.toUpperCase().startsWith('M'));

  // Layout constants
  const leftMargin = 8;
  const pageWidth = 215.9;
  const usableWidth = pageWidth - leftMargin * 2;

  const noColW = 10;
  const nameColW = 50;
  const absentColW = 12;
  const tardyColW = 12;
  const remarksColW = 30;
  const fixedW = noColW + nameColW + absentColW + tardyColW + remarksColW;
  const daysAreaW = usableWidth - fixedW;
  const dayColW = daysAreaW / 31;

  const rowH = 5;
  const headerRowH = 12;
  const maxRowsPerPage = 28;

  function renderHeader(startY: number): number {
    let y = startY;
    const logoH = 12;

    if (sealImg) {
      const w = (sealImg.width / sealImg.height) * logoH;
      doc.addImage(sealImg.data, 'PNG', leftMargin + 2, y, w, logoH);
    }
    if (logoImg) {
      const w = (logoImg.width / logoImg.height) * logoH;
      doc.addImage(logoImg.data, 'PNG', pageWidth - leftMargin - w - 2, y, w, logoH);
    }

    doc.setFontSize(9);
    doc.setFont('Calibri', 'bold');
    doc.text('Republic of the Philippines', pageWidth / 2, y + 3, { align: 'center' });
    doc.text('Department of Education', pageWidth / 2, y + 7, { align: 'center' });
    doc.setFontSize(10);
    doc.text('School Form 2 (SF2) Daily Attendance Report of Learners', pageWidth / 2, y + 12, { align: 'center' });
    y += 16;

    doc.setFontSize(7);
    doc.setFont('Calibri', 'normal');
    const c2 = pageWidth / 2 + 10;

    doc.text(`School Name: ${opts.schoolName}`, leftMargin, y);
    doc.text(`School ID: ${opts.schoolId}`, c2, y);
    y += 4;
    doc.text(`Grade Level: ${opts.gradeLevel}     Section: ${opts.sectionName}`, leftMargin, y);
    doc.text(`School Year: ${opts.schoolYear}`, c2, y);
    y += 4;
    if (opts.district || opts.division) {
      doc.text(`District: ${opts.district || ''}     Division: ${opts.division || ''}`, leftMargin, y);
    }
    if (opts.adviserName) {
      doc.text(`Adviser: ${opts.adviserName}`, c2, y);
    }
    y += 4;
    doc.text(`Report for the Month of: ${monthName} ${year}`, leftMargin, y);
    y += 6;

    return y;
  }

  function renderTableHeader(y: number): number {
    doc.setFillColor(230, 230, 230);
    doc.rect(leftMargin, y, usableWidth, headerRowH, 'F');

    doc.setFont('Calibri', 'bold');
    let x = leftMargin;

    doc.setFontSize(6);
    doc.text('No.', x + noColW / 2, y + 5, { align: 'center' });
    x += noColW;

    doc.setFontSize(6);
    doc.text("LEARNER'S NAME", x + 2, y + 3);
    doc.setFontSize(5);
    doc.text('(Last, First, Middle)', x + 2, y + 6);
    x += nameColW;

    doc.setFontSize(5);
    for (let d = 1; d <= 31; d++) {
      const dayX = x + (d - 1) * dayColW;
      doc.text(String(d), dayX + dayColW / 2, y + 4, { align: 'center' });
      if (d <= daysInMonth) {
        const date = new Date(year, month - 1, d);
        const dow = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()];
        doc.text(dow, dayX + dayColW / 2, y + 8, { align: 'center' });
      }
    }
    x += daysAreaW;

    doc.setFontSize(5);
    doc.text('ABSENT', x + absentColW / 2, y + 5, { align: 'center' });
    x += absentColW;
    doc.text('TARDY', x + tardyColW / 2, y + 5, { align: 'center' });
    x += tardyColW;
    doc.text('REMARKS', x + remarksColW / 2, y + 5, { align: 'center' });

    // Borders
    doc.setLineWidth(0.3);
    doc.rect(leftMargin, y, usableWidth, headerRowH);
    x = leftMargin + noColW;
    doc.line(x, y, x, y + headerRowH);
    x += nameColW;
    doc.line(x, y, x, y + headerRowH);
    x += daysAreaW;
    doc.line(x, y, x, y + headerRowH);
    x += absentColW;
    doc.line(x, y, x, y + headerRowH);
    x += tardyColW;
    doc.line(x, y, x, y + headerRowH);

    doc.setFont('Calibri', 'normal');
    return y + headerRowH;
  }

  function getStudentDayStatus(student: SF2ParsedRow, d: number): string | undefined {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return student.attendance[dateKey] || student.attendance[String(d)];
  }

  function renderStudentRow(student: SF2ParsedRow, rowNum: number, y: number): void {
    let x = leftMargin;
    doc.setFontSize(6);
    doc.setFont('Calibri', 'normal');

    doc.text(String(rowNum), x + noColW / 2, y + rowH / 2 + 1, { align: 'center' });
    x += noColW;

    const name = `${student.lastName}, ${student.firstName}${student.middleName ? ' ' + student.middleName : ''}`;
    doc.text(name.substring(0, 35), x + 1, y + rowH / 2 + 1);
    x += nameColW;

    let absent = 0;
    let tardy = 0;

    for (let d = 1; d <= 31; d++) {
      const dayX = x + (d - 1) * dayColW;
      if (d > daysInMonth) continue;

      const date = new Date(year, month - 1, d);
      if (date.getDay() === 0 || date.getDay() === 6) {
        doc.setFillColor(240, 240, 240);
        doc.rect(dayX, y, dayColW, rowH, 'F');
        continue;
      }

      const status = getStudentDayStatus(student, d);
      if (status === 'A') {
        doc.setFont('Calibri', 'bold');
        doc.text('X', dayX + dayColW / 2, y + rowH / 2 + 1, { align: 'center' });
        doc.setFont('Calibri', 'normal');
        absent++;
      } else if (status === 'L') {
        doc.setFillColor(200, 200, 200);
        doc.rect(dayX, y, dayColW, rowH, 'F');
        doc.setFontSize(5);
        doc.setFont('Calibri', 'bold');
        doc.text('L', dayX + dayColW / 2, y + rowH / 2 + 1, { align: 'center' });
        doc.setFont('Calibri', 'normal');
        doc.setFontSize(6);
        tardy++;
      } else if (status === 'E') {
        doc.setFontSize(5);
        doc.text('E', dayX + dayColW / 2, y + rowH / 2 + 1, { align: 'center' });
        doc.setFontSize(6);
      }
    }

    x += daysAreaW;
    if (absent > 0) doc.text(String(absent), x + absentColW / 2, y + rowH / 2 + 1, { align: 'center' });
    x += absentColW;
    if (tardy > 0) doc.text(String(tardy), x + tardyColW / 2, y + rowH / 2 + 1, { align: 'center' });

    doc.setLineWidth(0.1);
    doc.rect(leftMargin, y, usableWidth, rowH);
    let cx = leftMargin + noColW;
    doc.line(cx, y, cx, y + rowH);
    cx += nameColW;
    doc.line(cx, y, cx, y + rowH);
    cx += daysAreaW;
    doc.line(cx, y, cx, y + rowH);
    cx += absentColW;
    doc.line(cx, y, cx, y + rowH);
    cx += tardyColW;
    doc.line(cx, y, cx, y + rowH);
  }

  function renderSubtotalRow(label: string, students: SF2ParsedRow[], y: number): void {
    doc.setFillColor(245, 245, 245);
    doc.rect(leftMargin, y, usableWidth, rowH, 'F');

    doc.setFontSize(6);
    doc.setFont('Calibri', 'bold');
    doc.text(label, leftMargin + noColW + 2, y + rowH / 2 + 1);

    let x = leftMargin + noColW + nameColW;
    let totalAbsent = 0;
    let totalTardy = 0;

    for (let d = 1; d <= 31; d++) {
      const dayX = x + (d - 1) * dayColW;
      if (d > daysInMonth) continue;
      const date = new Date(year, month - 1, d);
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      let dayPresent = 0;
      for (const s of students) {
        const status = getStudentDayStatus(s, d);
        if (!status || status === 'P') dayPresent++;
        if (status === 'A') totalAbsent++;
        if (status === 'L') totalTardy++;
      }
      doc.setFontSize(5);
      doc.text(String(dayPresent), dayX + dayColW / 2, y + rowH / 2 + 1, { align: 'center' });
    }

    x += daysAreaW;
    doc.setFontSize(6);
    doc.text(String(totalAbsent), x + absentColW / 2, y + rowH / 2 + 1, { align: 'center' });
    x += absentColW;
    doc.text(String(totalTardy), x + tardyColW / 2, y + rowH / 2 + 1, { align: 'center' });

    doc.setFont('Calibri', 'normal');
    doc.setLineWidth(0.3);
    doc.rect(leftMargin, y, usableWidth, rowH);
    let cx = leftMargin + noColW;
    doc.line(cx, y, cx, y + rowH);
    cx += nameColW;
    doc.line(cx, y, cx, y + rowH);
    cx += daysAreaW;
    doc.line(cx, y, cx, y + rowH);
    cx += absentColW;
    doc.line(cx, y, cx, y + rowH);
    cx += tardyColW;
    doc.line(cx, y, cx, y + rowH);
  }

  // === Main rendering ===
  let currentY = renderHeader(10);
  currentY = renderTableHeader(currentY);

  let rowNum = 1;
  let rowsOnPage = 0;

  for (const student of males) {
    if (rowsOnPage >= maxRowsPerPage) {
      doc.addPage();
      currentY = renderTableHeader(10);
      rowsOnPage = 0;
    }
    renderStudentRow(student, rowNum++, currentY);
    currentY += rowH;
    rowsOnPage++;
  }

  if (males.length > 0) {
    if (rowsOnPage >= maxRowsPerPage) {
      doc.addPage();
      currentY = renderTableHeader(10);
      rowsOnPage = 0;
    }
    renderSubtotalRow(`MALE (${males.length})`, males, currentY);
    currentY += rowH;
    rowsOnPage++;
  }

  for (const student of females) {
    if (rowsOnPage >= maxRowsPerPage) {
      doc.addPage();
      currentY = renderTableHeader(10);
      rowsOnPage = 0;
    }
    renderStudentRow(student, rowNum++, currentY);
    currentY += rowH;
    rowsOnPage++;
  }

  if (females.length > 0) {
    if (rowsOnPage >= maxRowsPerPage) {
      doc.addPage();
      currentY = renderTableHeader(10);
      rowsOnPage = 0;
    }
    renderSubtotalRow(`FEMALE (${females.length})`, females, currentY);
    currentY += rowH;
    rowsOnPage++;
  }

  if (rowsOnPage >= maxRowsPerPage) {
    doc.addPage();
    currentY = renderTableHeader(10);
  }
  renderSubtotalRow(`COMBINED TOTAL (${opts.students.length})`, opts.students, currentY);

  if (opts.applyWatermark !== false) {
    addWatermark(doc);
  }

  const filename = `SF2_${opts.sectionName}_${monthName}_${year}.pdf`;
  doc.save(filename);
}
