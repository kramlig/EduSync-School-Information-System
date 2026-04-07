/**
 * CSV/Excel Parser for Free Form Generator Tool
 * Parses uploaded files into structured data for PDF generation.
 * Runs entirely client-side — no data leaves the browser.
 */

import Papa from 'papaparse';

export interface ParsedStudent {
  lrn: string;
  lastName: string;
  firstName: string;
  middleName: string;
  gender: string;
}

export interface SF5ParsedRow extends ParsedStudent {
  subjects: Record<string, number>;  // subject name → final grade
  generalAverage: number;
}

export interface SF9ParsedRow extends ParsedStudent {
  subject: string;
  q1: number | null;
  q2: number | null;
  q3: number | null;
  q4: number | null;
}

export interface SF2ParsedRow extends ParsedStudent {
  /** Daily attendance: key = "YYYY-MM-DD", value = "P"|"A"|"L"|"E" */
  attendance: Record<string, string>;
}

export interface CoreValuesParsedRow extends ParsedStudent {
  coreValue: string;    // "Maka-Diyos", "Makatao", "Makakalikasan", "Makabansa"
  behavior: string;     // behavior statement
  q1: string;           // "AO"|"SO"|"RO"|"NO"|""
  q2: string;
  q3: string;
  q4: string;
}

export interface HomeroomGuidanceParsedRow extends ParsedStudent {
  quarter: string;      // "First Quarter", "Second Quarter", "Third Quarter", "Fourth Quarter"
  competency: string;
  rating: number | null; // 0–4
}

export interface ParseResult<T> {
  data: T[];
  errors: ParseError[];
  totalRows: number;
}

export interface ParseError {
  row: number;
  field: string;
  message: string;
}

/**
 * Detect column mapping from CSV headers.
 * Supports flexible header names (case-insensitive, with aliases).
 */
const HEADER_MAP: Record<string, string[]> = {
  lrn: ['lrn', 'learner reference number', 'learner_reference_number'],
  lastName: ['last name', 'last_name', 'lastname', 'surname'],
  firstName: ['first name', 'first_name', 'firstname', 'given name'],
  middleName: ['middle name', 'middle_name', 'middlename'],
  gender: ['gender', 'sex'],
  subject: ['subject', 'learning area', 'learning_area'],
  q1: ['q1', 'quarter 1', 'quarter_1', '1st quarter', 'first quarter'],
  q2: ['q2', 'quarter 2', 'quarter_2', '2nd quarter', 'second quarter'],
  q3: ['q3', 'quarter 3', 'quarter_3', '3rd quarter', 'third quarter'],
  q4: ['q4', 'quarter 4', 'quarter_4', '4th quarter', 'fourth quarter'],
  generalAverage: ['final average', 'final_average', 'general average', 'general_average', 'average'],
  coreValue: ['core value', 'core_value', 'corevalue', 'value'],
  behavior: ['behavior', 'behavior statement', 'behavior_statement', 'indicator'],
  quarter: ['quarter', 'qtr'],
  competency: ['competency', 'competencies', 'skill'],
  rating: ['rating', 'score', 'mark'],
};

function mapHeader(header: string): string | null {
  const normalized = header.trim().toLowerCase();
  for (const [key, aliases] of Object.entries(HEADER_MAP)) {
    if (aliases.includes(normalized)) return key;
  }
  return null;
}

function buildColumnMap(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (let i = 0; i < headers.length; i++) {
    const mapped = mapHeader(headers[i]);
    if (mapped) {
      map[mapped] = i;
    }
  }
  return map;
}

/**
 * Parse a raw CSV string (from PapaParse or manual read).
 */
function parseCSVString(csvText: string): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(csvText, {
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err: Error) => reject(err),
    });
  });
}

/**
 * Parse an Excel (.xlsx) file using SheetJS.
 * Dynamically imports xlsx to keep bundle small for non-Excel users.
 */
async function parseExcelFile(file: File): Promise<string[][]> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: string[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
  return rows.filter(row => row.some(cell => cell !== undefined && cell !== ''));
}

/**
 * Read a file and return rows as string[][].
 */
export async function parseFile(file: File): Promise<string[][]> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xls') {
    return parseExcelFile(file);
  }
  // CSV or other text formats
  const text = await file.text();
  return parseCSVString(text);
}

/**
 * Parse SF5 data from a file.
 * Expected columns: LRN, Last Name, First Name, Middle Name, Gender, [Subject1], [Subject2], ..., Final Average
 */
export async function parseSF5File(file: File): Promise<ParseResult<SF5ParsedRow>> {
  const rows = await parseFile(file);
  if (rows.length < 2) {
    return { data: [], errors: [{ row: 0, field: '', message: 'File is empty or has no data rows.' }], totalRows: 0 };
  }

  const headers = rows[0].map(h => String(h).trim());
  const colMap = buildColumnMap(headers);
  const errors: ParseError[] = [];
  const data: SF5ParsedRow[] = [];

  // Identify subject columns: any column not mapped to a known field
  const knownIndices = new Set(Object.values(colMap));
  const subjectColumns: { index: number; name: string }[] = [];
  for (let i = 0; i < headers.length; i++) {
    if (!knownIndices.has(i) && headers[i]) {
      subjectColumns.push({ index: i, name: headers[i] });
    }
  }

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r].map(c => String(c ?? '').trim());
    if (row.every(c => c === '')) continue;

    const student: SF5ParsedRow = {
      lrn: row[colMap.lrn] || '',
      lastName: row[colMap.lastName] || '',
      firstName: row[colMap.firstName] || '',
      middleName: row[colMap.middleName] || '',
      gender: row[colMap.gender] || '',
      subjects: {},
      generalAverage: 0,
    };

    // Parse subject grades
    for (const sc of subjectColumns) {
      const val = parseFloat(row[sc.index]);
      if (!isNaN(val)) {
        student.subjects[sc.name] = val;
      }
    }

    // Parse general average
    if (colMap.generalAverage !== undefined) {
      student.generalAverage = parseFloat(row[colMap.generalAverage]) || 0;
    } else {
      // Auto-calculate if not provided
      const grades = Object.values(student.subjects);
      if (grades.length > 0) {
        student.generalAverage = Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 100) / 100;
      }
    }

    data.push(student);
  }

  return { data, errors, totalRows: data.length };
}

/**
 * Parse SF9 data from a file.
 * Expected: LRN, Last Name, First Name, Middle Name, Gender, Subject, Q1, Q2, Q3, Q4
 * Each student appears on MULTIPLE rows (one per subject).
 */
export async function parseSF9File(file: File): Promise<ParseResult<SF9ParsedRow>> {
  const rows = await parseFile(file);
  if (rows.length < 2) {
    return { data: [], errors: [{ row: 0, field: '', message: 'File is empty or has no data rows.' }], totalRows: 0 };
  }

  const headers = rows[0].map(h => String(h).trim());
  const colMap = buildColumnMap(headers);
  const errors: ParseError[] = [];
  const data: SF9ParsedRow[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r].map(c => String(c ?? '').trim());
    if (row.every(c => c === '')) continue;

    const parseGrade = (idx: number | undefined): number | null => {
      if (idx === undefined) return null;
      const val = parseFloat(row[idx]);
      return isNaN(val) ? null : val;
    };

    data.push({
      lrn: row[colMap.lrn] || '',
      lastName: row[colMap.lastName] || '',
      firstName: row[colMap.firstName] || '',
      middleName: row[colMap.middleName] || '',
      gender: row[colMap.gender] || '',
      subject: row[colMap.subject] || '',
      q1: parseGrade(colMap.q1),
      q2: parseGrade(colMap.q2),
      q3: parseGrade(colMap.q3),
      q4: parseGrade(colMap.q4),
    });
  }

  return { data, errors, totalRows: data.length };
}

/**
 * Parse SF2 data from a file.
 * Expected: LRN, Last Name, First Name, Middle Name, Gender, then date columns (1-31 or YYYY-MM-DD).
 * Each cell is P, A, L, or E (or blank = not marked).
 */
export async function parseSF2File(file: File, reportMonth: string): Promise<ParseResult<SF2ParsedRow>> {
  const rows = await parseFile(file);
  if (rows.length < 2) {
    return { data: [], errors: [{ row: 0, field: '', message: 'File is empty or has no data rows.' }], totalRows: 0 };
  }

  const headers = rows[0].map(h => String(h).trim());
  const colMap = buildColumnMap(headers);
  const errors: ParseError[] = [];
  const data: SF2ParsedRow[] = [];

  // Identify date columns: numeric (1-31) or date strings
  const dateColumns: { index: number; date: string }[] = [];
  const [year, month] = reportMonth.split('-').map(Number);

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    // Skip known mapped columns
    if (Object.values(colMap).includes(i)) continue;
    if (!h) continue;

    // Check if header is a day number (1-31)
    const dayNum = parseInt(h, 10);
    if (dayNum >= 1 && dayNum <= 31) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      dateColumns.push({ index: i, date: dateStr });
    }
    // Check if it's already a date (YYYY-MM-DD)
    else if (/^\d{4}-\d{2}-\d{2}$/.test(h)) {
      dateColumns.push({ index: i, date: h });
    }
  }

  if (dateColumns.length === 0) {
    errors.push({ row: 0, field: '', message: 'No date columns found. Use day numbers (1-31) or YYYY-MM-DD format as column headers.' });
    return { data, errors, totalRows: 0 };
  }

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r].map(c => String(c ?? '').trim());
    if (row.every(c => c === '')) continue;

    const attendance: Record<string, string> = {};
    for (const dc of dateColumns) {
      const val = row[dc.index]?.toUpperCase();
      if (val === 'P' || val === 'A' || val === 'L' || val === 'E') {
        attendance[dc.date] = val;
      }
    }

    data.push({
      lrn: row[colMap.lrn] || '',
      lastName: row[colMap.lastName] || '',
      firstName: row[colMap.firstName] || '',
      middleName: row[colMap.middleName] || '',
      gender: row[colMap.gender] || '',
      attendance,
    });
  }

  return { data, errors, totalRows: data.length };
}

/**
 * Parse Core Values data from a file.
 * Expected: LRN, Last Name, First Name, Middle Name, Gender, Core Value, Behavior, Q1, Q2, Q3, Q4
 * Each student appears on MULTIPLE rows (one per behavior per core value).
 * Q1-Q4 values should be AO, SO, RO, or NO.
 */
export async function parseCoreValuesFile(file: File): Promise<ParseResult<CoreValuesParsedRow>> {
  const rows = await parseFile(file);
  if (rows.length < 2) {
    return { data: [], errors: [{ row: 0, field: '', message: 'File is empty or has no data rows.' }], totalRows: 0 };
  }

  const headers = rows[0].map(h => String(h).trim());
  const colMap = buildColumnMap(headers);
  const errors: ParseError[] = [];
  const data: CoreValuesParsedRow[] = [];

  if (colMap.coreValue === undefined) {
    errors.push({ row: 0, field: 'Core Value', message: 'Missing "Core Value" column header.' });
    return { data, errors, totalRows: 0 };
  }
  if (colMap.behavior === undefined) {
    errors.push({ row: 0, field: 'Behavior', message: 'Missing "Behavior" column header.' });
    return { data, errors, totalRows: 0 };
  }

  const VALID_RATINGS = ['AO', 'SO', 'RO', 'NO', ''];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r].map(c => String(c ?? '').trim());
    if (row.every(c => c === '')) continue;

    const parseRating = (idx: number | undefined): string => {
      if (idx === undefined) return '';
      const val = row[idx]?.toUpperCase().trim() || '';
      return VALID_RATINGS.includes(val) ? val : '';
    };

    data.push({
      lrn: row[colMap.lrn] || '',
      lastName: row[colMap.lastName] || '',
      firstName: row[colMap.firstName] || '',
      middleName: row[colMap.middleName] || '',
      gender: row[colMap.gender] || '',
      coreValue: row[colMap.coreValue] || '',
      behavior: row[colMap.behavior] || '',
      q1: parseRating(colMap.q1),
      q2: parseRating(colMap.q2),
      q3: parseRating(colMap.q3),
      q4: parseRating(colMap.q4),
    });
  }

  return { data, errors, totalRows: data.length };
}

/**
 * Parse Homeroom Guidance data from a file.
 * Expected: LRN, Last Name, First Name, Middle Name, Gender, Quarter, Competency, Rating
 * Each student appears on MULTIPLE rows (one per competency per quarter).
 * Rating values: 0–4.
 */
export async function parseHomeroomGuidanceFile(file: File): Promise<ParseResult<HomeroomGuidanceParsedRow>> {
  const rows = await parseFile(file);
  if (rows.length < 2) {
    return { data: [], errors: [{ row: 0, field: '', message: 'File is empty or has no data rows.' }], totalRows: 0 };
  }

  const headers = rows[0].map(h => String(h).trim());
  const colMap = buildColumnMap(headers);
  const errors: ParseError[] = [];
  const data: HomeroomGuidanceParsedRow[] = [];

  if (colMap.quarter === undefined) {
    errors.push({ row: 0, field: 'Quarter', message: 'Missing "Quarter" column header.' });
    return { data, errors, totalRows: 0 };
  }
  if (colMap.competency === undefined) {
    errors.push({ row: 0, field: 'Competency', message: 'Missing "Competency" column header.' });
    return { data, errors, totalRows: 0 };
  }

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r].map(c => String(c ?? '').trim());
    if (row.every(c => c === '')) continue;

    let ratingVal: number | null = null;
    if (colMap.rating !== undefined) {
      const parsed = parseInt(row[colMap.rating], 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 4) ratingVal = parsed;
    }

    const rawQuarter = row[colMap.quarter] || '';
    const normalizedQuarter = normalizeQuarter(rawQuarter);

    data.push({
      lrn: row[colMap.lrn] || '',
      lastName: row[colMap.lastName] || '',
      firstName: row[colMap.firstName] || '',
      middleName: row[colMap.middleName] || '',
      gender: row[colMap.gender] || '',
      quarter: normalizedQuarter || rawQuarter,
      competency: row[colMap.competency] || '',
      rating: ratingVal,
    });
  }

  return { data, errors, totalRows: data.length };
}

function normalizeQuarter(q: string): string {
  const lower = q.toLowerCase().trim();
  if (lower === '1' || lower === 'q1' || lower === '1st' || lower.includes('first')) return 'FIRST QUARTER';
  if (lower === '2' || lower === 'q2' || lower === '2nd' || lower.includes('second')) return 'SECOND QUARTER';
  if (lower === '3' || lower === 'q3' || lower === '3rd' || lower.includes('third')) return 'THIRD QUARTER';
  if (lower === '4' || lower === 'q4' || lower === '4th' || lower.includes('fourth')) return 'FOURTH QUARTER';
  return q.toUpperCase();
}
