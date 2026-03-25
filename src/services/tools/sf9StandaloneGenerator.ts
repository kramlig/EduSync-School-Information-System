/**
 * SF9 Standalone PDF Generator – MATATAG Format
 * Two-page landscape layout matching DepEd School Form 9 (report card).
 * Page 1: Attendance, Learning Delivery Mode, Parent Signatures (left) |
 *         Header, Student Info, Certificate of Transfer (right)
 * Page 2: Learning Progress table, Core Values (left) |
 *         Homeroom Guidance Assessment (right)
 *
 * Uses jsPDF directly — no html2canvas, no DOM rendering.
 */

import jsPDF from 'jspdf';
import { registerCalibriFont } from '../../utils/pdf/registerCalibriFont';
import { addWatermark } from './watermark';
import type { SF9ParsedRow } from './csvParser';
import depedLogoUrl from '../../assets/deped-logo.png';

// ═══════════════════════════════ Types ═══════════════════════════════

/** Per-student attendance: keyed by student LRN or "lastName-firstName" */
export interface SF9AttendanceRecord {
  /** Daily status map: "YYYY-MM-DD" → "P"|"A"|"L"|"E" */
  dailyStatus: Record<string, string>;
}

/** Per-student core-value ratings */
export interface SF9CoreValueGrade {
  coreValueCode: string; // e.g. 'MAKA_DIYOS'
  q1?: string; // 'AO'|'SO'|'RO'|'NO'
  q2?: string;
  q3?: string;
  q4?: string;
  /** Optional per-behavior ratings: { "q1": { "behaviorText": "AO" }, ... } */
  indicatorRatings?: Record<string, Record<string, string>>;
}

/** Per-student homeroom guidance ratings: { q1_ratings: { "competency": 4 }, ... } */
export interface SF9HomeroomGuidanceGrades {
  q1_ratings: Record<string, number>;
  q2_ratings: Record<string, number>;
  q3_ratings: Record<string, number>;
  q4_ratings: Record<string, number>;
}

export interface SF9StandaloneOptions {
  schoolInfo: {
    name: string;
    schoolId: string;
    division: string;
    region: string;
    district: string;
  };
  schoolYear: string;
  gradeLevel: number;
  sectionName: string;
  adviserName: string;
  principalName?: string;
  rows: SF9ParsedRow[];
  applyWatermark?: boolean;
  /** Optional: per-student attendance keyed by LRN or "lastName-firstName" */
  attendance?: Record<string, SF9AttendanceRecord>;
  /** Optional: per-student core value grades keyed by LRN or "lastName-firstName" */
  coreValueGrades?: Record<string, SF9CoreValueGrade[]>;
  /** Optional: number of school days per month abbr (Jun, Jul, …) */
  monthlySchoolDays?: Record<string, number>;
  /** Optional: per-student homeroom guidance grades keyed by LRN or "lastName-firstName" */
  homeroomGuidanceGrades?: Record<string, SF9HomeroomGuidanceGrades>;
}

interface StudentGrades {
  lrn: string;
  lastName: string;
  firstName: string;
  middleName: string;
  gender: string;
  subjects: {
    name: string;
    q1: number | null;
    q2: number | null;
    q3: number | null;
    q4: number | null;
    final: number | null;
  }[];
  generalAverage: number | null;
  /** Per-month attendance: { "Jun": { present: 5, absent: 1 }, ... } */
  monthlyAttendance: Record<string, { present: number; absent: number }>;
  /** Core value grades for this student */
  coreValueGrades: SF9CoreValueGrade[];
  /** Homeroom guidance grades for this student */
  homeroomGuidanceGrades: SF9HomeroomGuidanceGrades | null;
}

interface LoadedImage {
  data: string;
  width: number;
  height: number;
}

// ═══════════════════════════════ Constants ═══════════════════════════════

const MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

const BLUE: [number, number, number] = [68, 114, 196];
const WHITE: [number, number, number] = [255, 255, 255];

const HOMEROOM_COMPETENCIES: Record<string, string[]> = {
  'FIRST QUARTER': [
    'Value oneself',
    'Value others',
    'Respect individual differences',
    'Gain understanding of oneself and others',
    'Identify the methods of effective study habits toward lifelong learning',
    'Demonstrate effective study habit',
  ],
  'SECOND QUARTER': [
    'Provide proper procedure toward responsible decision-making',
    'Evaluate experiences in decision-making toward achieving common good',
    'Share the lessons learned from school and community that can be used in daily living',
    'Apply lessons from home, school, and community to daily living with consideration to family and society',
    'Understand the importance of guidance from parents or guardians and significant adults in choosing a profession, vocation, and future plans',
  ],
  'THIRD QUARTER': [
    'Enrich knowledge and skills toward academic achievement',
    'Reflect on the decisions made for life and profession',
  ],
  'FOURTH QUARTER': [
    "Share one's abilities for the development of others and community",
    'Strengthen self-empowerment to respond to the needs of the community',
    'Respond to personal and social needs that can contribute to the promotion of international standards',
    'Demonstrate academic excellence based on global needs',
  ],
};

const CORE_VALUES = [
  {
    name: 'Maka-Diyos',
    behaviors: [
      "Expresses one's spiritual beliefs while respecting the spiritual beliefs of others",
      'Shows adherence to ethical principles by upholding truth',
    ],
  },
  {
    name: 'Makatao',
    behaviors: [
      'Is sensitive to individual, social, and cultural differences',
      'Demonstrates contributions toward solidarity',
    ],
  },
  {
    name: 'Makakalikasan',
    behaviors: [
      'Cares for the environment and utilizes resources wisely, judiciously, and economically',
    ],
  },
  {
    name: 'Makabansa',
    behaviors: [
      'Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen',
      'Demonstrates appropriate behavior in civic engagement activities in the school, community, and country',
    ],
  },
];

const MARGIN = 10;
const GAP = 4;

// ═══════════════════════════════ Helpers ═══════════════════════════════

/** Convert daily status map into monthly present/absent counts keyed by month abbreviation. */
function buildMonthlyAttendance(
  dailyStatus: Record<string, string>,
): Record<string, { present: number; absent: number }> {
  const result: Record<string, { present: number; absent: number }> = {};
  for (const [dateStr, status] of Object.entries(dailyStatus)) {
    const date = new Date(dateStr + 'T00:00:00');
    const monthAbbr = date.toLocaleString('en-US', { month: 'short' });
    if (!result[monthAbbr]) result[monthAbbr] = { present: 0, absent: 0 };
    const s = status.charAt(0).toUpperCase();
    if (s === 'P' || s === 'L') result[monthAbbr].present++;
    else if (s === 'A' || s === 'E') result[monthAbbr].absent++;
  }
  return result;
}

function groupByStudent(
  rows: SF9ParsedRow[],
  attendanceMap?: Record<string, SF9AttendanceRecord>,
  coreValueMap?: Record<string, SF9CoreValueGrade[]>,
  hgMap?: Record<string, SF9HomeroomGuidanceGrades>,
): StudentGrades[] {
  const map = new Map<string, StudentGrades>();
  for (const row of rows) {
    const key = row.lrn || `${row.lastName}-${row.firstName}`;
    if (!map.has(key)) {
      const attRec = attendanceMap?.[key];
      map.set(key, {
        lrn: row.lrn,
        lastName: row.lastName,
        firstName: row.firstName,
        middleName: row.middleName,
        gender: row.gender,
        subjects: [],
        generalAverage: null,
        monthlyAttendance: attRec ? buildMonthlyAttendance(attRec.dailyStatus) : {},
        coreValueGrades: coreValueMap?.[key] ?? [],
        homeroomGuidanceGrades: hgMap?.[key] ?? null,
      });
    }
    const student = map.get(key)!;
    const { q1, q2, q3, q4 } = row;
    const grades = [q1, q2, q3, q4].filter((g): g is number => g !== null);
    const final =
      grades.length > 0
        ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 100) / 100
        : null;
    student.subjects.push({ name: row.subject, q1, q2, q3, q4, final });
  }
  for (const student of map.values()) {
    const finals = student.subjects.map((s) => s.final).filter((f): f is number => f !== null);
    student.generalAverage =
      finals.length > 0
        ? Math.round((finals.reduce((a, b) => a + b, 0) / finals.length) * 100) / 100
        : null;
  }
  return Array.from(map.values());
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
        resolve({ data: canvas.toDataURL('image/png'), width: img.width, height: img.height });
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

function getDescriptiveRating(avg: number | null): string {
  if (avg === null) return '';
  if (avg >= 90) return 'A';
  if (avg >= 85) return 'P';
  if (avg >= 80) return 'AP';
  if (avg >= 75) return 'D';
  return 'B';
}

function getRemarks(finalGrade: number | null): string {
  if (finalGrade === null) return '';
  return finalGrade >= 75 ? 'Passed' : 'Failed';
}

const fmtGrade = (g: number | null): string => (g !== null ? String(g) : '');

// ═══════════════════════════════ Drawing helpers ═══════════════════════════════

interface CellOpts {
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
  fillColor?: [number, number, number];
  textColor?: [number, number, number];
  fontSize?: number;
  padding?: number;
  noBorder?: boolean;
  wrap?: boolean;
}

function drawCell(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  opts: CellOpts = {},
): void {
  const {
    align = 'center',
    bold = false,
    fillColor,
    textColor = [0, 0, 0],
    fontSize = 7.5,
    padding = 1.5,
    noBorder = false,
  } = opts;

  if (fillColor) {
    doc.setFillColor(...fillColor);
    doc.rect(x, y, w, h, 'F');
  }
  if (!noBorder) {
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.rect(x, y, w, h, 'S');
  }

  doc.setFontSize(fontSize);
  doc.setFont('Calibri', bold ? 'bold' : 'normal');
  doc.setTextColor(...textColor);

  if (!text) {
    doc.setTextColor(0);
    doc.setFont('Calibri', 'normal');
    return;
  }

  let tx: number;
  if (align === 'center') tx = x + w / 2;
  else if (align === 'right') tx = x + w - padding;
  else tx = x + padding;

  const maxTextW = w - padding * 2;
  const lines: string[] = opts.wrap ? doc.splitTextToSize(text, maxTextW) : text.split('\n');
  const lineH = fontSize * 0.4;
  const totalH = lines.length * lineH;
  let startY = y + (h - totalH) / 2 + lineH * 0.7;
  for (const line of lines) {
    doc.text(line, tx, startY, { align });
    startY += lineH;
  }

  doc.setTextColor(0);
  doc.setFont('Calibri', 'normal');
}

function hLine(doc: jsPDF, x1: number, y: number, x2: number): void {
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(x1, y, x2, y);
}

function getLayout(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const midX = pageW / 2;
  return {
    pageW,
    pageH,
    midX,
    leftX: MARGIN,
    leftW: midX - MARGIN - GAP / 2,
    rightX: midX + GAP / 2,
    rightW: pageW - MARGIN - (midX + GAP / 2),
  };
}

// ═══════════════════════════════ PAGE 1 ═══════════════════════════════

function renderPage1(
  doc: jsPDF,
  student: StudentGrades,
  options: SF9StandaloneOptions,
  logo: LoadedImage | undefined,
): void {
  const { leftX, leftW, rightX, rightW } = getLayout(doc);

  // ═══ LEFT COLUMN ═══
  let y = MARGIN;

  // — REPORT ON ATTENDANCE —
  doc.setFont('Calibri', 'bold');
  doc.setFontSize(9);
  doc.text('REPORT ON ATTENDANCE', leftX + leftW / 2, y + 3, { align: 'center' });
  y += 6;

  const attLabelW = 24;
  const attTotalW = 12;
  const attMonthW = (leftW - attLabelW - attTotalW) / MONTHS.length;
  const attRowH = 6;

  // Header row
  drawCell(doc, leftX, y, attLabelW, attRowH, '', { fillColor: BLUE });
  let ax = leftX + attLabelW;
  for (const m of MONTHS) {
    drawCell(doc, ax, y, attMonthW, attRowH, m, {
      bold: true,
      fillColor: BLUE,
      textColor: WHITE,
      fontSize: 6.5,
    });
    ax += attMonthW;
  }
  drawCell(doc, ax, y, attTotalW, attRowH, 'Total', {
    bold: true,
    fillColor: BLUE,
    textColor: WHITE,
    fontSize: 6.5,
  });
  y += attRowH;

  // Attendance data rows
  const msd = options.monthlySchoolDays || {};
  const att = student.monthlyAttendance;
  const attRows: { label: string; getVal: (m: string) => string; getTotal: () => string }[] = [
    {
      label: 'No. of School Days',
      getVal: (m) => (msd[m] != null ? String(msd[m]) : ''),
      getTotal: () => {
        const t = MONTHS.reduce((s, m) => s + (msd[m] || 0), 0);
        return t > 0 ? String(t) : '';
      },
    },
    {
      label: 'No. of days Present',
      getVal: (m) => (att[m]?.present ? String(att[m].present) : ''),
      getTotal: () => {
        const t = MONTHS.reduce((s, m) => s + (att[m]?.present || 0), 0);
        return t > 0 ? String(t) : '';
      },
    },
    {
      label: 'No. of days Absent',
      getVal: (m) => (att[m]?.absent ? String(att[m].absent) : ''),
      getTotal: () => {
        const t = MONTHS.reduce((s, m) => s + (att[m]?.absent || 0), 0);
        return t > 0 ? String(t) : '';
      },
    },
  ];

  for (const row of attRows) {
    drawCell(doc, leftX, y, attLabelW, attRowH, row.label, {
      align: 'left',
      bold: true,
      fontSize: 5.5,
    });
    ax = leftX + attLabelW;
    for (const m of MONTHS) {
      drawCell(doc, ax, y, attMonthW, attRowH, row.getVal(m), { fontSize: 6 });
      ax += attMonthW;
    }
    drawCell(doc, ax, y, attTotalW, attRowH, row.getTotal(), { bold: true, fontSize: 6 });
    y += attRowH;
  }
  y += 4;

  // — LEARNING DELIVERY MODE —
  const ldmRowH = 6;
  drawCell(doc, leftX, y, leftW, ldmRowH, 'LEARNING DELIVERY MODE', {
    bold: true,
    fillColor: BLUE,
    textColor: WHITE,
    fontSize: 8,
  });
  y += ldmRowH;
  const ldmColW = leftW / 4;
  const quarters = ['FIRST QUARTER', 'SECOND QUARTER', 'THIRD QUARTER', 'FOURTH QUARTER'];
  for (let i = 0; i < 4; i++) {
    drawCell(doc, leftX + i * ldmColW, y, ldmColW, ldmRowH, quarters[i], {
      bold: true,
      fillColor: BLUE,
      textColor: WHITE,
      fontSize: 6.5,
    });
  }
  y += ldmRowH;
  for (let i = 0; i < 4; i++) drawCell(doc, leftX + i * ldmColW, y, ldmColW, ldmRowH, '');
  y += ldmRowH;
  y += 6;

  // — PARENT/GUARDIAN'S SIGNATURE —
  doc.setFont('Calibri', 'bold');
  doc.setFontSize(9);
  doc.text("PARENT/GUARDIAN'S SIGNATURE", leftX + leftW / 2, y + 3, { align: 'center' });
  y += 7;

  doc.setFont('Calibri', 'normal');
  doc.setFontSize(7);
  const sigDisclaimer =
    'By signing, it is understood that I received and read the contents of this report card reflecting the name of my son/daughter.';
  const discLines = doc.splitTextToSize(sigDisclaimer, leftW - 4);
  doc.text(discLines, leftX + 2, y);
  y += discLines.length * 3 + 4;

  doc.setFontSize(8);
  for (const label of ['1st Quarter:', '2nd Quarter:', '3rd Quarter:', '4th Quarter:']) {
    doc.text(label, leftX + 4, y);
    hLine(doc, leftX + 30, y + 1, leftX + leftW - 4);
    y += 10;
  }

  // ═══ RIGHT COLUMN ═══
  y = MARGIN;

  // — "School Form 9" label —
  doc.setFont('Calibri', 'normal');
  doc.setFontSize(8);
  doc.text('School Form 9', rightX, y + 3);

  // — DepEd Logo (centered) —
  const logoH = 14;
  try {
    if (logo) {
      const lw = (logo.width / logo.height) * logoH;
      doc.addImage(logo.data, 'PNG', rightX + rightW / 2 - lw / 2, y, lw, logoH);
    }
  } catch {
    /* logos are optional */
  }
  y += logoH + 2;

  // — Republic header —
  doc.setFont('Calibri', 'normal');
  doc.setFontSize(8);
  doc.text('Republic of the Philippines', rightX + rightW / 2, y, { align: 'center' });
  y += 3.5;
  doc.setFont('Calibri', 'bold');
  doc.setFontSize(9);
  doc.text('Department of Education', rightX + rightW / 2, y, { align: 'center' });
  y += 3.5;
  doc.setFont('Calibri', 'normal');
  doc.setFontSize(8);
  doc.text(options.schoolInfo.region, rightX + rightW / 2, y, { align: 'center' });
  y += 3;
  doc.text(options.schoolInfo.division, rightX + rightW / 2, y, { align: 'center' });
  y += 3;
  doc.text(options.schoolInfo.district, rightX + rightW / 2, y, { align: 'center' });
  y += 4;
  doc.setFont('Calibri', 'bold');
  doc.setFontSize(9);
  doc.text(options.schoolInfo.name.toUpperCase(), rightX + rightW / 2, y, { align: 'center' });
  y += 3.5;
  if (options.schoolInfo.schoolId) {
    doc.setFontSize(8);
    doc.text(options.schoolInfo.schoolId, rightX + rightW / 2, y, { align: 'center' });
    y += 3.5;
  }
  doc.setFontSize(9);
  doc.text(
    `GRADE ${options.gradeLevel} \u2013 ${options.sectionName.toUpperCase()}`,
    rightX + rightW / 2,
    y,
    { align: 'center' },
  );
  y += 6;

  // — Student Info —
  const fullName = `${student.lastName.toUpperCase()}, ${student.firstName.toUpperCase()}${student.middleName ? ', ' + student.middleName.toUpperCase() : ''}`;
  doc.setFontSize(8);
  doc.setFont('Calibri', 'bold');
  doc.text('Name:', rightX, y);
  doc.text(fullName, rightX + 14, y);
  doc.text('Age:', rightX + rightW * 0.65, y);
  doc.text('Sex:', rightX + rightW * 0.82, y);
  doc.setFont('Calibri', 'bold');
  doc.text(student.gender?.toUpperCase() || '', rightX + rightW * 0.9, y);
  hLine(doc, rightX + 14, y + 1, rightX + rightW * 0.62);
  hLine(doc, rightX + rightW * 0.72, y + 1, rightX + rightW * 0.8);
  hLine(doc, rightX + rightW * 0.87, y + 1, rightX + rightW);
  y += 5;

  doc.text('LRN:', rightX, y);
  doc.text(student.lrn || '', rightX + 12, y);
  hLine(doc, rightX + 12, y + 1, rightX + rightW * 0.48);
  doc.text('School Year:', rightX + rightW * 0.52, y);
  doc.text(options.schoolYear, rightX + rightW * 0.72, y);
  hLine(doc, rightX + rightW * 0.72, y + 1, rightX + rightW);
  y += 7;

  // — Dear Parent —
  doc.setFont('Calibri', 'bold');
  doc.setFontSize(8);
  doc.text('Dear Parent:', rightX, y);
  y += 4;
  doc.setFont('Calibri', 'normal');
  doc.setFontSize(7.5);
  const dpText =
    "This report card shows the ability and progress your child has made in the different learning areas as well as his/her core values. The school welcomes you should you desire to know more about the student's progress.";
  const dpLines = doc.splitTextToSize(dpText, rightW - 10);
  doc.text(dpLines, rightX + 10, y);
  y += dpLines.length * 3 + 5;

  // — Adviser & School Head signatures —
  const sigW = rightW * 0.4;
  const principal = options.principalName || '';
  const advX = rightX + rightW - sigW;

  doc.setFont('Calibri', 'bold');
  doc.setFontSize(8);
  doc.text(principal.toUpperCase(), rightX + sigW / 2, y, { align: 'center' });
  hLine(doc, rightX + 2, y + 1, rightX + sigW - 2);
  doc.setFont('Calibri', 'normal');
  doc.text('School Head', rightX + sigW / 2, y + 4, { align: 'center' });

  doc.setFont('Calibri', 'bold');
  doc.text(options.adviserName.toUpperCase(), advX + sigW / 2, y, { align: 'center' });
  hLine(doc, advX + 2, y + 1, advX + sigW - 2);
  doc.setFont('Calibri', 'normal');
  doc.text('Adviser', advX + sigW / 2, y + 4, { align: 'center' });
  y += 12;

  // — Certificate of Transfer —
  doc.setFont('Calibri', 'bold');
  doc.setFontSize(9);
  doc.text('Certificate of Transfer', rightX + rightW / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('Calibri', 'normal');
  doc.setFontSize(8);
  doc.text('Admitted to Grade:', rightX, y);
  hLine(doc, rightX + 36, y + 1, rightX + rightW * 0.55);
  doc.text('Section:', rightX + rightW * 0.58, y);
  hLine(doc, rightX + rightW * 0.72, y + 1, rightX + rightW);
  y += 5;
  doc.text('Eligibility for Admission to Grade:', rightX, y);
  hLine(doc, rightX + 62, y + 1, rightX + rightW);
  y += 5;
  doc.text('Approved:', rightX, y);
  hLine(doc, rightX + 22, y + 1, rightX + rightW);
  y += 10;

  // Certificate signatures
  doc.setFont('Calibri', 'bold');
  doc.text(principal.toUpperCase(), rightX + sigW / 2, y, { align: 'center' });
  hLine(doc, rightX + 2, y + 1, rightX + sigW - 2);
  doc.setFont('Calibri', 'normal');
  doc.text('School Head', rightX + sigW / 2, y + 4, { align: 'center' });

  doc.setFont('Calibri', 'bold');
  doc.text(options.adviserName.toUpperCase(), advX + sigW / 2, y, { align: 'center' });
  hLine(doc, advX + 2, y + 1, advX + sigW - 2);
  doc.setFont('Calibri', 'normal');
  doc.text('Teacher', advX + sigW / 2, y + 4, { align: 'center' });
  y += 12;

  // — Cancellation of Eligibility to Transfer —
  doc.setFont('Calibri', 'bold');
  doc.setFontSize(9);
  doc.text('Cancellation of Eligibility to Transfer', rightX + rightW / 2, y, {
    align: 'center',
  });
  y += 5;
  doc.setFont('Calibri', 'normal');
  doc.setFontSize(8);
  doc.text('Admitted in:', rightX, y);
  hLine(doc, rightX + 24, y + 1, rightX + rightW);
  y += 8;
  doc.text('Date:', rightX, y);
  hLine(doc, rightX + 12, y + 1, rightX + rightW * 0.55);
  hLine(doc, rightX + rightW * 0.6, y + 1, rightX + rightW);
  y += 4;
  doc.text('School Head', rightX + rightW * 0.8, y, { align: 'center' });
}

// ═══════════════════════════════ PAGE 2 ═══════════════════════════════

function renderPage2(doc: jsPDF, student: StudentGrades): void {
  const { leftX, leftW, rightX, rightW } = getLayout(doc);

  // ═══ LEFT COLUMN ═══
  let y = MARGIN;

  // — MATATAG Curriculum header —
  doc.setFont('Calibri', 'bold');
  doc.setFontSize(10);
  doc.text('MATATAG Curriculum', leftX + leftW / 2, y + 3, { align: 'center' });
  y += 5;
  doc.setFontSize(9);
  doc.text('REPORT ON LEARNING PROGRESS AND ACHIEVEMENT', leftX + leftW / 2, y + 3, {
    align: 'center',
  });
  y += 6;

  // — Learning Progress Table —
  const rowH = 5.5;
  const laW = leftW * 0.28; // Learning Area
  const qW = leftW * 0.09; // Each quarter column
  const avgW = leftW * 0.1; // Average
  const drW = leftW * 0.1; // Descriptive Rating
  const remW = leftW - laW - 4 * qW - avgW - drW; // Remarks

  // Header row 1 (spanning)
  drawCell(doc, leftX, y, laW, rowH * 2, 'LEARNING AREA', {
    bold: true,
    fillColor: BLUE,
    textColor: WHITE,
    fontSize: 7,
  });
  drawCell(doc, leftX + laW, y, qW * 4, rowH, 'QUARTER', {
    bold: true,
    fillColor: BLUE,
    textColor: WHITE,
    fontSize: 7,
  });
  drawCell(doc, leftX + laW + qW * 4, y, avgW, rowH * 2, 'AVERAGE', {
    bold: true,
    fillColor: BLUE,
    textColor: WHITE,
    fontSize: 6,
  });
  drawCell(doc, leftX + laW + qW * 4 + avgW, y, drW, rowH * 2, 'Descriptive\nRating', {
    bold: true,
    fillColor: BLUE,
    textColor: WHITE,
    fontSize: 5.5,
  });
  drawCell(doc, leftX + laW + qW * 4 + avgW + drW, y, remW, rowH * 2, 'Remarks', {
    bold: true,
    fillColor: BLUE,
    textColor: WHITE,
    fontSize: 6,
  });

  // Header row 2 (quarter numbers)
  for (let q = 0; q < 4; q++) {
    drawCell(doc, leftX + laW + q * qW, y + rowH, qW, rowH, String(q + 1), {
      bold: true,
      fillColor: BLUE,
      textColor: WHITE,
      fontSize: 7,
    });
  }
  y += rowH * 2;

  // Subject rows
  for (const subj of student.subjects) {
    let cx = leftX;
    drawCell(doc, cx, y, laW, rowH, subj.name, { align: 'left', bold: true, fontSize: 6.5 });
    cx += laW;
    drawCell(doc, cx, y, qW, rowH, fmtGrade(subj.q1), { fontSize: 7 });
    cx += qW;
    drawCell(doc, cx, y, qW, rowH, fmtGrade(subj.q2), { fontSize: 7 });
    cx += qW;
    drawCell(doc, cx, y, qW, rowH, fmtGrade(subj.q3), { fontSize: 7 });
    cx += qW;
    drawCell(doc, cx, y, qW, rowH, fmtGrade(subj.q4), { fontSize: 7 });
    cx += qW;
    drawCell(doc, cx, y, avgW, rowH, fmtGrade(subj.final), { bold: true, fontSize: 7 });
    cx += avgW;
    drawCell(doc, cx, y, drW, rowH, getDescriptiveRating(subj.final), { fontSize: 7 });
    cx += drW;
    drawCell(doc, cx, y, remW, rowH, getRemarks(subj.final), { bold: true, fontSize: 6.5 });
    y += rowH;
  }

  // General Average row
  const gaStr = student.generalAverage !== null ? String(student.generalAverage) : '';
  drawCell(doc, leftX, y, laW + qW * 4, rowH, 'GENERAL AVERAGE', {
    align: 'right',
    bold: true,
    fontSize: 7,
    padding: 4,
  });
  drawCell(doc, leftX + laW + qW * 4, y, avgW, rowH, gaStr, { bold: true, fontSize: 7 });
  drawCell(doc, leftX + laW + qW * 4 + avgW, y, drW, rowH, getDescriptiveRating(student.generalAverage), {
    fontSize: 7,
  });
  drawCell(doc, leftX + laW + qW * 4 + avgW + drW, y, remW, rowH, getRemarks(student.generalAverage), {
    bold: true,
    fontSize: 6.5,
  });
  y += rowH + 2;

  // — LEGEND box —
  const legendY = y;
  doc.setFont('Calibri', 'bold');
  doc.setFontSize(7);
  doc.text('LEGEND:', leftX + 2, y + 3);
  y += 4;
  doc.setFontSize(6.5);
  const legend: [string, string][][] = [
    [
      ['A', '(Advanced) - 90% and above'],
      ['D', '(Developing) - 75-79%'],
    ],
    [
      ['P', '(Proficient) - 85-89%'],
      ['B', '(Beginning) - 74% below'],
    ],
    [['AP', '(Approaching Proficiency) - 80-84%'], []],
  ];
  for (const row of legend) {
    for (let c = 0; c < row.length; c++) {
      if (row[c].length === 0) continue;
      const ox = c === 0 ? leftX + 2 : leftX + leftW / 2;
      doc.setFont('Calibri', 'bold');
      doc.text(row[c][0], ox, y + 2.5);
      doc.setFont('Calibri', 'normal');
      doc.text(row[c][1], ox + (row[c][0].length > 1 ? 8 : 5), y + 2.5);
    }
    y += 3;
  }
  y += 1;
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.rect(leftX, legendY, leftW, y - legendY, 'S');
  y += 3;

  // — Core Values: Observed Behavior —
  doc.setFont('Calibri', 'bold');
  doc.setFontSize(9);
  doc.text("Report on Learner's Observed Behavior", leftX + leftW / 2, y + 3, {
    align: 'center',
  });
  y += 6;

  const cvRowH = 7;
  const cvNameW = leftW * 0.15;
  const cvBehW = leftW * 0.49;
  const cvQW = (leftW - cvNameW - cvBehW) / 4;

  // Header row 1
  drawCell(doc, leftX, y, cvNameW, cvRowH, 'Core Values', {
    bold: true,
    fillColor: BLUE,
    textColor: WHITE,
    fontSize: 6,
  });
  drawCell(doc, leftX + cvNameW, y, cvBehW, cvRowH, 'Behavior Statements', {
    bold: true,
    fillColor: BLUE,
    textColor: WHITE,
    fontSize: 6,
  });
  drawCell(doc, leftX + cvNameW + cvBehW, y, cvQW * 4, cvRowH, 'QUARTER', {
    bold: true,
    fillColor: BLUE,
    textColor: WHITE,
    fontSize: 6,
  });
  y += cvRowH;

  // Header row 2
  drawCell(doc, leftX, y, cvNameW, cvRowH, '', { fillColor: BLUE });
  drawCell(doc, leftX + cvNameW, y, cvBehW, cvRowH, '', { fillColor: BLUE });
  for (let q = 0; q < 4; q++) {
    drawCell(doc, leftX + cvNameW + cvBehW + q * cvQW, y, cvQW, cvRowH, String(q + 1), {
      bold: true,
      fillColor: BLUE,
      textColor: WHITE,
      fontSize: 6.5,
    });
  }
  y += cvRowH;

  // Core value rows — look up actual ratings if available
  // Build a map: core value code → SF9CoreValueGrade for this student
  const cvGradeMap = new Map<string, SF9CoreValueGrade>();
  for (const cvg of student.coreValueGrades) {
    cvGradeMap.set(cvg.coreValueCode, cvg);
  }

  for (const cv of CORE_VALUES) {
    const numBeh = cv.behaviors.length;
    // Try to find matching grade by code (MAKA_DIYOS, MAKATAO, etc.)
    // Normalize: strip non-alpha, uppercase → matches DB codes like MAKADIYOS
    const cvCodeNorm = cv.name.toUpperCase().replace(/[^A-Z]/g, '');
    const cvCodeUnderscore = cv.name.toUpperCase().replace(/[^A-Z]/g, '_').replace(/_+/g, '_');
    const cvGrade = cvGradeMap.get(cvCodeNorm) || cvGradeMap.get(cvCodeUnderscore) || cvGradeMap.get(cv.name);

    for (let b = 0; b < numBeh; b++) {
      if (b === 0) {
        drawCell(doc, leftX, y, cvNameW, cvRowH * numBeh, cv.name, {
          align: 'left',
          bold: true,
          fontSize: 5.5,
          padding: 1,
        });
      }
      drawCell(doc, leftX + cvNameW, y, cvBehW, cvRowH, cv.behaviors[b], {
        align: 'left',
        fontSize: 5,
        padding: 1,
        wrap: true,
      });

      // Fill in quarter ratings
      const qKeys = ['q1', 'q2', 'q3', 'q4'] as const;
      for (let q = 0; q < 4; q++) {
        let rating = '';
        if (cvGrade) {
          // Check per-behavior indicator ratings first
          const qIndicators = cvGrade.indicatorRatings?.[qKeys[q]];
          if (qIndicators) {
            // Exact match first
            if (qIndicators[cv.behaviors[b]]) {
              rating = qIndicators[cv.behaviors[b]];
            } else {
              // Normalized match: strip punctuation/case differences
              const normBeh = cv.behaviors[b].toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
              for (const [indText, val] of Object.entries(qIndicators)) {
                const normInd = indText.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
                if (normInd === normBeh || normBeh.includes(normInd) || normInd.includes(normBeh)) {
                  rating = val;
                  break;
                }
              }
            }
          }
          if (!rating && b === 0) {
            // Fall back to overall quarter rating for first behavior
            rating = cvGrade[qKeys[q]] || '';
          }
        }
        drawCell(doc, leftX + cvNameW + cvBehW + q * cvQW, y, cvQW, cvRowH, rating, {
          fontSize: 6,
        });
      }
      y += cvRowH;
    }
  }
  y += 2;

  // Marking legend
  doc.setFontSize(6.5);
  doc.setFont('Calibri', 'bold');
  doc.text('Marking', leftX, y + 2);
  doc.text('Non-Numerical Rating', leftX + 18, y + 2);
  doc.text('Marking', leftX + leftW * 0.5, y + 2);
  doc.text('Non-Numerical Rating', leftX + leftW * 0.5 + 18, y + 2);
  y += 4;
  doc.setFont('Calibri', 'normal');
  doc.text('AO', leftX, y + 2);
  doc.text('Always Observed', leftX + 18, y + 2);
  doc.text('RO', leftX + leftW * 0.5, y + 2);
  doc.text('Rarely Observed', leftX + leftW * 0.5 + 18, y + 2);
  y += 3;
  doc.text('SO', leftX, y + 2);
  doc.text('Sometimes Observed', leftX + 18, y + 2);
  doc.text('NO', leftX + leftW * 0.5, y + 2);
  doc.text('Not Observed', leftX + leftW * 0.5 + 18, y + 2);

  // ═══ RIGHT COLUMN ═══
  let ry = MARGIN;

  // — Homeroom Guidance header —
  const hgHeaderH = 7;
  drawCell(doc, rightX, ry, rightW, hgHeaderH, "Homeroom Guidance Learner's Development Assessment", {
    bold: true,
    fillColor: BLUE,
    textColor: WHITE,
    fontSize: 8,
  });
  ry += hgHeaderH + 2;

  // — Legend box —
  const hgLegY = ry;
  doc.setFont('Calibri', 'bold');
  doc.setFontSize(7);
  doc.text('LEGEND:', rightX + 2, ry + 3);
  ry += 4;
  doc.setFontSize(6);
  const colW = rightW / 3;
  const hgLeg: [string, string][][] = [
    [
      ['4', '-Developed and Commendable'],
      ['2', '- Developing'],
      ['0', '-No Chance to observe'],
    ],
    [
      ['3', '-Sufficiently Developed'],
      ['1', '- Needs Improvement'],
      ['', ''],
    ],
  ];
  for (const row of hgLeg) {
    for (let c = 0; c < row.length; c++) {
      if (!row[c][0]) continue;
      doc.setFont('Calibri', 'bold');
      doc.text(row[c][0], rightX + c * colW + 2, ry + 2);
      doc.setFont('Calibri', 'normal');
      doc.text(row[c][1], rightX + c * colW + 5, ry + 2);
    }
    ry += 3;
  }
  const hgLegH = ry - hgLegY;
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.rect(rightX, hgLegY, rightW, hgLegH, 'S');
  ry += 2;

  // — Competencies table —
  const hgCompW = rightW * 0.65;
  const hgScoreW = (rightW - hgCompW) / 5;
  const hgRowH = 5.5;

  // Header
  drawCell(doc, rightX, ry, hgCompW, hgRowH, 'COMPETENCY', {
    align: 'left',
    bold: true,
    fillColor: BLUE,
    textColor: WHITE,
    fontSize: 6.5,
    padding: 2,
  });
  const scores = ['4', '3', '2', '1', '0'];
  for (let i = 0; i < 5; i++) {
    drawCell(doc, rightX + hgCompW + i * hgScoreW, ry, hgScoreW, hgRowH, scores[i], {
      bold: true,
      fillColor: BLUE,
      textColor: WHITE,
      fontSize: 7,
    });
  }
  ry += hgRowH;

  // Quarter sections
  for (const [quarter, competencies] of Object.entries(HOMEROOM_COMPETENCIES)) {
    // Quarter header
    drawCell(doc, rightX, ry, rightW, hgRowH, quarter, {
      align: 'left',
      bold: true,
      fillColor: BLUE,
      textColor: WHITE,
      fontSize: 7,
      padding: 2,
    });
    ry += hgRowH;

    // Competency rows
    for (const comp of competencies) {
      // Determine which quarter ratings column to use
      const qColMap: Record<string, keyof SF9HomeroomGuidanceGrades> = {
        'FIRST QUARTER': 'q1_ratings',
        'SECOND QUARTER': 'q2_ratings',
        'THIRD QUARTER': 'q3_ratings',
        'FOURTH QUARTER': 'q4_ratings',
      };
      const qCol = qColMap[quarter];
      const ratings = student.homeroomGuidanceGrades?.[qCol] || {};
      const studentRating = ratings[comp];

      drawCell(doc, rightX, ry, hgCompW, hgRowH, comp, {
        align: 'left',
        fontSize: 5,
        padding: 2,
        wrap: true,
      });
      for (let i = 0; i < 5; i++) {
        const scoreVal = 4 - i; // columns are 4, 3, 2, 1, 0
        const isChecked = studentRating === scoreVal;
        drawCell(doc, rightX + hgCompW + i * hgScoreW, ry, hgScoreW, hgRowH, isChecked ? '/' : '');
      }
      ry += hgRowH;
    }
  }
}

// ═══════════════════════════════ Main Export ═══════════════════════════════

export async function generateSF9Standalone(options: SF9StandaloneOptions): Promise<void> {
  const students = groupByStudent(options.rows, options.attendance, options.coreValueGrades, options.homeroomGuidanceGrades);
  if (students.length === 0) return;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  await registerCalibriFont(doc);

  let logo: LoadedImage | undefined;
  try {
    logo = await loadImageProcessed(depedLogoUrl).catch(() => undefined);
  } catch {
    /* logos are optional */
  }

  for (let i = 0; i < students.length; i++) {
    if (i > 0) doc.addPage();
    renderPage1(doc, students[i], options, logo);
    doc.addPage();
    renderPage2(doc, students[i]);
  }

  if (options.applyWatermark !== false) {
    addWatermark(doc);
  }

  doc.save(
    `SF9_${options.schoolYear.replace(/\//g, '-')}_Grade${options.gradeLevel}_${options.sectionName}.pdf`,
  );
}
