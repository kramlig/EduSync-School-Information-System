/**
 * Division Proficiency Excel Export Generator
 * 
 * Generates Excel files matching the exact DepEd format for
 * "Elementary Q2 Proficiency Level" reports.
 * 
 * Features:
 * - Exact DepEd column structure
 * - District grouping with yellow headers
 * - Kindergarten ABC proficiency levels
 * - Subject-based MPS and passing rates
 * - Division-wide summary
 * 
 * @see docs/presentations/Q2_PROFICIENCY_REPORT_AUTOMATION.md
 */

import * as XLSX from 'xlsx';
import type {
  DivisionProficiencyReport,
  SchoolProficiencySummary,
  ProficiencyExcelOptions,
} from '../../types/divisionProficiency';

// =====================================================
// COLUMN CONFIGURATION
// =====================================================

/**
 * Column headers matching the exact DepEd format
 */
const COLUMN_HEADERS = {
  // Column A: School Name
  SCHOOL: 'School Name',
  
  // Kindergarten (B-E)
  KINDER_A: 'A.\nBeginning',
  KINDER_B: 'B.\nDeveloping',
  KINDER_C: 'C.\nConsistent',
  KINDER_TOTAL: 'TOTAL\nPERCENTAGE',
  
  // Language Grade 1 (F-G)
  LANG_G1_PERCENT: 'Percentage\nof Learners\nwith 75%\nMPS and\nabove',
  LANG_G1_MPS: 'Mean\nPercentage\nScore\n(MPS)',
  
  // Language Grade 2 (H-I)
  LANG_G2_PERCENT: 'Percentage\nof Learners\nwith 75%\nMPS and\nabove',
  LANG_G2_MPS: 'Mean\nPercentage\nScore\n(MPS)',
  
  // Mother Tongue Grade 3 (J-K)
  MT_G3_PERCENT: 'Percentage\nof Learners\nwith 75%\nMPS and\nabove',
  MT_G3_MPS: 'Mean\nPercentage\nScore\n(MPS)',
  
  // Reading & Literacy (L-Q)
  READ_G1_PERCENT: 'Percentage\nof Learners\nwith 75%\nMPS and\nabove',
  READ_G1_MPS: 'Mean\nPercentage\nScore\n(MPS)',
  READ_G2_PERCENT: 'Percentage\nof Learners\nwith 75%\nMPS and\nabove',
  READ_G2_MPS: 'Mean\nPercentage\nScore\n(MPS)',
  READ_G3_PERCENT: 'Percentage\nof Learners\nwith 75%\nMPS and\nabove',
  READ_G3_MPS: 'Mean\nPercentage\nScore\n(MPS)',
  
  // English (R-W)
  ENG_G4_PERCENT: 'Percentage\nof Learners\nwith 75%\nMPS and\nabove',
  ENG_G4_MPS: 'Mean\nPercentage\nScore\n(MPS)',
  ENG_G5_PERCENT: 'Percentage\nof Learners\nwith 75%\nMPS and\nabove',
  ENG_G5_MPS: 'Mean\nPercentage\nScore\n(MPS)',
  ENG_G6_PERCENT: 'Percentage\nof Learners\nwith 75%\nMPS and\nabove',
  ENG_G6_MPS: 'Mean\nPercentage\nScore\n(MPS)',
};

// =====================================================
// MAIN EXPORT FUNCTION
// =====================================================

/**
 * Export Division Proficiency Report to Excel
 * Matches the exact DepEd format from the screenshot
 */
export function exportProficiencyToExcel(
  report: DivisionProficiencyReport,
  options: ProficiencyExcelOptions
): void {
  const workbook = XLSX.utils.book_new();
  
  // Create main proficiency sheet
  const mainSheet = createProficiencySheet(report, options);
  XLSX.utils.book_append_sheet(workbook, mainSheet, `${report.quarter} Proficiency`);
  
  // Create summary sheet
  const summarySheet = createSummarySheet(report, options);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  
  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${report.quarter}_Proficiency_Level_${options.school_year.replace('-', '_')}_${timestamp}.xlsx`;
  
  // Download file
  XLSX.writeFile(workbook, filename);
}

/**
 * Export to CSV format
 */
export function exportProficiencyToCSV(
  report: DivisionProficiencyReport
): string {
  const rows: (string | number | null)[][] = [];
  
  // Header row 1: Subject groups
  rows.push([
    '',
    'KINDERGARTEN', '', '', '',
    'LANGUAGE', '',
    'LANGUAGE', '',
    'MOTHER TONGUE', '',
    'READING & LITERACY', '', '', '', '', '',
    'ENGLISH', '', '', '', '', ''
  ]);
  
  // Header row 2: Grade levels
  rows.push([
    '',
    '', '', '', '',
    'GRADE 1', '',
    'GRADE 2', '',
    'GRADE 3', '',
    'GRADE 1', '',
    'GRADE 2', '',
    'GRADE 3', '',
    'GRADE 4', '',
    'GRADE 5', '',
    'GRADE 6', ''
  ]);
  
  // Header row 3: Metrics
  rows.push([
    'School Name',
    'A. Beginning', 'B. Developing', 'C. Consistent', 'Total %',
    '% ≥75 MPS', 'MPS',
    '% ≥75 MPS', 'MPS',
    '% ≥75 MPS', 'MPS',
    '% ≥75 MPS', 'MPS',
    '% ≥75 MPS', 'MPS',
    '% ≥75 MPS', 'MPS',
    '% ≥75 MPS', 'MPS',
    '% ≥75 MPS', 'MPS',
    '% ≥75 MPS', 'MPS'
  ]);
  
  // Data rows by district
  for (const district of report.districts) {
    // District header row
    rows.push([`ELEMENTARY (${district.district_name.toUpperCase()})`]);
    
    // School rows
    for (const school of district.schools) {
      rows.push(schoolToRow(school));
    }
  }
  
  // Convert to CSV
  return rows.map(row => row.map(cell => {
    const cellStr = String(cell ?? '');
    // Escape quotes and wrap in quotes if contains comma
    if (cellStr.includes(',') || cellStr.includes('"')) {
      return `"${cellStr.replace(/"/g, '""')}"`;
    }
    return cellStr;
  }).join(',')).join('\n');
}

// =====================================================
// SHEET CREATION HELPERS
// =====================================================

/**
 * Create the main proficiency data sheet
 */
function createProficiencySheet(
  report: DivisionProficiencyReport,
  options: ProficiencyExcelOptions
): XLSX.WorkSheet {
  const data: (string | number | null)[][] = [];
  
  // Row 1: Empty row for spacing
  data.push([]);
  
  // Row 2: Main title
  data.push([
    `${report.quarter.toUpperCase()} QUARTER`,
    '', '', '', '',
    'KINDERGARTEN', '', '', '',
    'LANGUAGE', '', '', '',
    'MOTHER TONGUE', '',
    'READING & LITERACY', '', '', '', '', '',
    'ENGLISH', '', '', '', '', ''
  ]);
  
  // Row 3: Title continuation
  data.push([
    'PROFICIENCY',
    '', '', '', '',
    '', '', '', '',
    'GRADE 1', '',
    'GRADE 2', '',
    'GRADE 3', '',
    'GRADE 1', '',
    'GRADE 2', '',
    'GRADE 3', '',
    'GRADE 4', '',
    'GRADE 5', '',
    'GRADE 6', ''
  ]);
  
  // Row 4: School year
  data.push([
    `LEVEL ${options.school_year}`,
    'A.', 'B.', 'C.', 'TOTAL',
    'Percentage', 'Mean', 'Percentage', 'Mean',
    'Percentage', 'Mean',
    'Percentage', 'Mean', 'Percentage', 'Mean', 'Percentage', 'Mean',
    'Percentage', 'Mean', 'Percentage', 'Mean', 'Percentage', 'Mean'
  ]);
  
  // Row 5: Sub-headers
  data.push([
    '',
    'Beginning', 'Developing', 'Consistent', 'PERCENTAGE',
    'of Learners', 'Percentage', 'of Learners', 'Percentage',
    'of Learners', 'Percentage',
    'of Learners', 'Percentage', 'of Learners', 'Percentage', 'of Learners', 'Percentage',
    'of Learners', 'Percentage', 'of Learners', 'Percentage', 'of Learners', 'Percentage'
  ]);
  
  // Row 6: More sub-headers
  data.push([
    '',
    '', '', '', '',
    'with 75%', 'Score', 'with 75%', 'Score',
    'with 75%', 'Score',
    'with 75%', 'Score', 'with 75%', 'Score', 'with 75%', 'Score',
    'with 75%', 'Score', 'with 75%', 'Score', 'with 75%', 'Score'
  ]);
  
  // Row 7: MPS labels
  data.push([
    '',
    '', '', '', '',
    'MPS and', '(MPS)', 'MPS and', '(MPS)',
    'MPS and', '(MPS)',
    'MPS and', '(MPS)', 'MPS and', '(MPS)', 'MPS and', '(MPS)',
    'MPS and', '(MPS)', 'MPS and', '(MPS)', 'MPS and', '(MPS)'
  ]);
  
  // Row 8: "above" labels
  data.push([
    '',
    '', '', '', '',
    'above', '', 'above', '',
    'above', '',
    'above', '', 'above', '', 'above', '',
    'above', '', 'above', '', 'above', ''
  ]);
  
  // Data rows by district
  for (const district of report.districts) {
    // District header row (yellow background in Excel)
    data.push([`ELEMENTARY (${district.district_name.toUpperCase()})`]);
    
    // School rows
    for (const school of district.schools) {
      data.push(schoolToRow(school));
    }
  }
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 30 }, // A: School Name
    { wch: 10 }, // B: Kinder A
    { wch: 10 }, // C: Kinder B
    { wch: 10 }, // D: Kinder C
    { wch: 10 }, // E: Kinder Total
    { wch: 12 }, // F: Lang G1 %
    { wch: 8 },  // G: Lang G1 MPS
    { wch: 12 }, // H: Lang G2 %
    { wch: 8 },  // I: Lang G2 MPS
    { wch: 12 }, // J: MT G3 %
    { wch: 8 },  // K: MT G3 MPS
    { wch: 12 }, // L: Read G1 %
    { wch: 8 },  // M: Read G1 MPS
    { wch: 12 }, // N: Read G2 %
    { wch: 8 },  // O: Read G2 MPS
    { wch: 12 }, // P: Read G3 %
    { wch: 8 },  // Q: Read G3 MPS
    { wch: 12 }, // R: Eng G4 %
    { wch: 8 },  // S: Eng G4 MPS
    { wch: 12 }, // T: Eng G5 %
    { wch: 8 },  // U: Eng G5 MPS
    { wch: 12 }, // V: Eng G6 %
    { wch: 8 },  // W: Eng G6 MPS
  ];
  
  return ws;
}

/**
 * Convert school data to a row array
 */
function schoolToRow(school: SchoolProficiencySummary): (string | number | null)[] {
  const formatPercent = (val: number | undefined): string => {
    if (val === undefined || val === null) return '';
    return `${val.toFixed(2)}%`;
  };
  
  const formatMPS = (val: number | undefined): string => {
    if (val === undefined || val === null) return '';
    return val.toFixed(2);
  };
  
  return [
    school.school_name,
    
    // Kindergarten
    formatPercent(school.kindergarten?.beginning_percent),
    formatPercent(school.kindergarten?.developing_percent),
    formatPercent(school.kindergarten?.consistent_percent),
    formatPercent(school.kindergarten?.total_percent),
    
    // Language Grade 1
    formatPercent(school.language.grade_1?.percent_75_above),
    formatMPS(school.language.grade_1?.mean_percentage_score),
    
    // Language Grade 2
    formatPercent(school.language.grade_2?.percent_75_above),
    formatMPS(school.language.grade_2?.mean_percentage_score),
    
    // Mother Tongue Grade 3
    formatPercent(school.mother_tongue.grade_3?.percent_75_above),
    formatMPS(school.mother_tongue.grade_3?.mean_percentage_score),
    
    // Reading & Literacy Grades 1-3
    formatPercent(school.reading_literacy.grade_1?.percent_75_above),
    formatMPS(school.reading_literacy.grade_1?.mean_percentage_score),
    formatPercent(school.reading_literacy.grade_2?.percent_75_above),
    formatMPS(school.reading_literacy.grade_2?.mean_percentage_score),
    formatPercent(school.reading_literacy.grade_3?.percent_75_above),
    formatMPS(school.reading_literacy.grade_3?.mean_percentage_score),
    
    // English Grades 4-6
    formatPercent(school.english.grade_4?.percent_75_above),
    formatMPS(school.english.grade_4?.mean_percentage_score),
    formatPercent(school.english.grade_5?.percent_75_above),
    formatMPS(school.english.grade_5?.mean_percentage_score),
    formatPercent(school.english.grade_6?.percent_75_above),
    formatMPS(school.english.grade_6?.mean_percentage_score),
  ];
}

/**
 * Create summary statistics sheet
 */
function createSummarySheet(
  report: DivisionProficiencyReport,
  options: ProficiencyExcelOptions
): XLSX.WorkSheet {
  const data: (string | number)[][] = [];
  
  // Header
  data.push([`${report.quarter} PROFICIENCY LEVEL REPORT - SUMMARY`]);
  data.push([]);
  data.push(['Division:', options.division_name]);
  data.push(['Region:', options.region]);
  data.push(['School Year:', options.school_year]);
  data.push(['Quarter:', options.quarter]);
  data.push(['Generated:', new Date().toLocaleDateString('en-PH')]);
  data.push([]);
  
  // Overall Statistics
  data.push(['OVERALL STATISTICS']);
  data.push([]);
  data.push(['Total Schools:', report.summary.total_schools]);
  data.push(['Total Districts:', report.summary.total_districts]);
  data.push(['Total Elementary Students:', report.summary.total_students_elementary]);
  data.push(['Total Kindergarten Students:', report.summary.total_students_kindergarten]);
  data.push(['Overall MPS (Elementary):', `${report.summary.overall_mps_elementary.toFixed(2)}%`]);
  data.push(['Overall Passing Rate:', `${report.summary.overall_passing_rate.toFixed(2)}%`]);
  data.push([]);
  
  // District Summary
  data.push(['DISTRICT SUMMARY']);
  data.push([]);
  data.push(['District', 'Schools', 'Kinder Total %', 'Elementary Avg MPS']);
  
  for (const district of report.districts) {
    const kinderTotal = district.aggregated.kindergarten?.total_percent ?? 0;
    
    // Calculate average MPS for elementary
    let totalMPS = 0;
    let mpsCount = 0;
    
    const subjects = [
      district.aggregated.language.grade_1,
      district.aggregated.language.grade_2,
      district.aggregated.mother_tongue.grade_3,
      district.aggregated.reading_literacy.grade_1,
      district.aggregated.reading_literacy.grade_2,
      district.aggregated.reading_literacy.grade_3,
      district.aggregated.english.grade_4,
      district.aggregated.english.grade_5,
      district.aggregated.english.grade_6,
    ];
    
    for (const subj of subjects) {
      if (subj) {
        totalMPS += subj.mean_percentage_score;
        mpsCount++;
      }
    }
    
    const avgMPS = mpsCount > 0 ? totalMPS / mpsCount : 0;
    
    data.push([
      district.district_name,
      district.schools_count,
      `${kinderTotal.toFixed(2)}%`,
      `${avgMPS.toFixed(2)}%`
    ]);
  }
  
  data.push([]);
  
  // Prepared by section
  if (options.prepared_by) {
    data.push([]);
    data.push(['Prepared by:', options.prepared_by]);
    if (options.prepared_by_position) {
      data.push(['Position:', options.prepared_by_position]);
    }
  }
  
  if (options.certified_by) {
    data.push([]);
    data.push(['Certified by:', options.certified_by]);
    if (options.certified_by_position) {
      data.push(['Position:', options.certified_by_position]);
    }
  }
  
  return XLSX.utils.aoa_to_sheet(data);
}

// =====================================================
// EXPORT
// =====================================================

export { COLUMN_HEADERS };
