/**
 * ELLN Export Service
 * 
 * Handles Excel and PDF exports for ELLN assessments and reports.
 * Generates DepEd-compliant spreadsheets and documents.
 */

import * as XLSX from 'xlsx';
import { ELLNAssessment, ProficiencyLevel } from '../components/forms/shared/FormTypes';
import { formatDepEdDate, getCurrentSchoolYear } from './dateHelpers';

interface ExportOptions {
  reportType: 'section' | 'grade' | 'school';
  reportName: string;
  quarter: 'all' | 'q1' | 'q2' | 'q3' | 'q4';
  schoolYear: string;
}

interface StudentInfo {
  id: string;
  name: string;
  lrn: string;
  gradeLevel: number;
  sectionName: string;
}

/**
 * Export ELLN Report to Excel
 */
export function exportELLNToExcel(
  assessments: ELLNAssessment[],
  studentsMap: Map<string, StudentInfo>,
  options: ExportOptions
): void {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Summary Statistics
  const summarySheet = createSummarySheet(assessments, options);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Sheet 2: Proficiency Distribution
  const distributionSheet = createDistributionSheet(assessments, options);
  XLSX.utils.book_append_sheet(workbook, distributionSheet, 'Proficiency Distribution');

  // Sheet 3: Detailed Assessment Data
  const detailsSheet = createDetailsSheet(assessments, studentsMap, options);
  XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Assessment Details');

  // Sheet 4: Student List
  const studentsSheet = createStudentsSheet(assessments, studentsMap, options);
  XLSX.utils.book_append_sheet(workbook, studentsSheet, 'Student List');

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const quarterStr = options.quarter === 'all' ? 'All-Quarters' : options.quarter.toUpperCase();
  const filename = `ELLN_Report_${options.reportName}_${quarterStr}_${timestamp}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, filename);
}

/**
 * Create Summary Statistics Sheet
 */
function createSummarySheet(assessments: ELLNAssessment[], options: ExportOptions): XLSX.WorkSheet {
  const data: any[] = [];

  // Header
  data.push(['ELLN ASSESSMENT REPORT - SUMMARY STATISTICS']);
  data.push(['']);
  data.push(['Report Type:', options.reportType.toUpperCase()]);
  data.push(['Report Name:', options.reportName]);
  data.push(['School Year:', options.schoolYear]);
  data.push(['Quarter:', options.quarter === 'all' ? 'All Quarters' : options.quarter.toUpperCase()]);
  data.push(['Generated:', formatDepEdDate(new Date())]);
  data.push(['']);

  // Overall Statistics
  data.push(['OVERALL STATISTICS']);
  data.push(['']);
  
  const totalAssessments = assessments.length;
  const avgLiteracy = totalAssessments > 0 
    ? Math.round((assessments.reduce((sum, a) => sum + a.literacyScore, 0) / totalAssessments) * 10) / 10 
    : 0;
  const avgNumeracy = totalAssessments > 0 
    ? Math.round((assessments.reduce((sum, a) => sum + a.numeracyScore, 0) / totalAssessments) * 10) / 10 
    : 0;
  const avgOverall = totalAssessments > 0 
    ? Math.round((assessments.reduce((sum, a) => sum + a.overallScore, 0) / totalAssessments) * 10) / 10 
    : 0;

  data.push(['Total Assessments:', totalAssessments]);
  data.push(['Average Literacy Score:', avgLiteracy]);
  data.push(['Average Numeracy Score:', avgNumeracy]);
  data.push(['Average Overall Score:', avgOverall]);
  data.push(['']);

  // Proficiency Distribution
  data.push(['PROFICIENCY LEVEL DISTRIBUTION']);
  data.push(['']);
  data.push(['Proficiency Level', 'Count', 'Percentage']);

  const distribution: Record<ProficiencyLevel, number> = {
    'Advanced': 0,
    'Proficient': 0,
    'Approaching': 0,
    'Developing': 0,
    'Beginning': 0
  };

  assessments.forEach(a => {
    distribution[a.proficiencyLevel]++;
  });

  const levels: ProficiencyLevel[] = ['Advanced', 'Proficient', 'Approaching', 'Developing', 'Beginning'];
  levels.forEach(level => {
    const count = distribution[level];
    const percentage = totalAssessments > 0 ? ((count / totalAssessments) * 100).toFixed(1) : '0.0';
    data.push([level, count, `${percentage}%`]);
  });

  data.push(['']);
  data.push(['Total:', totalAssessments, '100%']);

  // Quarterly Breakdown (if all quarters)
  if (options.quarter === 'all') {
    data.push(['']);
    data.push(['QUARTERLY BREAKDOWN']);
    data.push(['']);
    data.push(['Quarter', 'Assessments', 'Avg Literacy', 'Avg Numeracy', 'Avg Overall']);

    const quarters: ('q1' | 'q2' | 'q3' | 'q4')[] = ['q1', 'q2', 'q3', 'q4'];
    quarters.forEach(q => {
      const qAssessments = assessments.filter(a => a.quarter === q);
      const count = qAssessments.length;
      
      if (count > 0) {
        const qAvgLit = Math.round((qAssessments.reduce((sum, a) => sum + a.literacyScore, 0) / count) * 10) / 10;
        const qAvgNum = Math.round((qAssessments.reduce((sum, a) => sum + a.numeracyScore, 0) / count) * 10) / 10;
        const qAvgOvr = Math.round((qAssessments.reduce((sum, a) => sum + a.overallScore, 0) / count) * 10) / 10;
        data.push([q.toUpperCase(), count, qAvgLit, qAvgNum, qAvgOvr]);
      } else {
        data.push([q.toUpperCase(), 0, 'N/A', 'N/A', 'N/A']);
      }
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 }
  ];

  return ws;
}

/**
 * Create Proficiency Distribution Sheet
 */
function createDistributionSheet(assessments: ELLNAssessment[], options: ExportOptions): XLSX.WorkSheet {
  const data: any[] = [];

  // Header
  data.push(['PROFICIENCY LEVEL DISTRIBUTION']);
  data.push(['']);
  data.push(['Report Type:', options.reportType.toUpperCase()]);
  data.push(['Report Name:', options.reportName]);
  data.push(['Quarter:', options.quarter === 'all' ? 'All Quarters' : options.quarter.toUpperCase()]);
  data.push(['']);

  // Distribution Table
  data.push(['Proficiency Level', 'Description', 'Count', 'Percentage', 'Score Range']);

  const distribution: Record<ProficiencyLevel, number> = {
    'Advanced': 0,
    'Proficient': 0,
    'Approaching': 0,
    'Developing': 0,
    'Beginning': 0
  };

  assessments.forEach(a => {
    distribution[a.proficiencyLevel]++;
  });

  const totalAssessments = assessments.length;

  const levelDescriptions: Record<ProficiencyLevel, { desc: string; range: string }> = {
    'Advanced': { desc: 'Outstanding performance', range: '90-100' },
    'Proficient': { desc: 'Acceptable performance', range: '85-89' },
    'Approaching': { desc: 'Developing performance', range: '80-84' },
    'Developing': { desc: 'Fairly satisfactory', range: '75-79' },
    'Beginning': { desc: 'Needs improvement', range: '0-74' }
  };

  const levels: ProficiencyLevel[] = ['Advanced', 'Proficient', 'Approaching', 'Developing', 'Beginning'];
  levels.forEach(level => {
    const count = distribution[level];
    const percentage = totalAssessments > 0 ? ((count / totalAssessments) * 100).toFixed(1) : '0.0';
    const { desc, range } = levelDescriptions[level];
    data.push([level, desc, count, `${percentage}%`, range]);
  });

  data.push(['']);
  data.push(['Total', '', totalAssessments, '100%', '']);

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 20 },
    { wch: 30 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 }
  ];

  return ws;
}

/**
 * Create Detailed Assessment Data Sheet
 */
function createDetailsSheet(
  assessments: ELLNAssessment[],
  studentsMap: Map<string, StudentInfo>,
  options: ExportOptions
): XLSX.WorkSheet {
  const data: any[] = [];

  // Header
  data.push(['DETAILED ASSESSMENT DATA']);
  data.push(['']);
  data.push(['Report:', options.reportName]);
  data.push(['Quarter:', options.quarter === 'all' ? 'All Quarters' : options.quarter.toUpperCase()]);
  data.push(['']);

  // Column Headers
  data.push([
    'LRN',
    'Student Name',
    'Grade',
    'Section',
    'Quarter',
    'Literacy Score',
    'Numeracy Score',
    'Overall Score',
    'Proficiency Level',
    'Assessment Date',
    'Assessed By'
  ]);

  // Assessment Data
  assessments.forEach(assessment => {
    const student = studentsMap.get(assessment.studentId);
    if (student) {
      data.push([
        student.lrn || 'N/A',
        student.name,
        student.gradeLevel === 0 ? 'K' : `Grade ${student.gradeLevel}`,
        student.sectionName,
        assessment.quarter.toUpperCase(),
        assessment.literacyScore,
        assessment.numeracyScore,
        assessment.overallScore,
        assessment.proficiencyLevel,
        formatDepEdDate(assessment.assessmentDate),
        assessment.assessedBy || 'N/A'
      ]);
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // LRN
    { wch: 25 }, // Name
    { wch: 10 }, // Grade
    { wch: 15 }, // Section
    { wch: 10 }, // Quarter
    { wch: 12 }, // Literacy
    { wch: 12 }, // Numeracy
    { wch: 12 }, // Overall
    { wch: 18 }, // Proficiency
    { wch: 15 }, // Date
    { wch: 20 }  // Assessed By
  ];

  return ws;
}

/**
 * Create Students Sheet (Master List)
 */
function createStudentsSheet(
  assessments: ELLNAssessment[],
  studentsMap: Map<string, StudentInfo>,
  options: ExportOptions
): XLSX.WorkSheet {
  const data: any[] = [];

  // Header
  data.push(['STUDENT MASTER LIST']);
  data.push(['']);
  data.push(['Report:', options.reportName]);
  data.push(['']);

  // Column Headers
  data.push([
    'LRN',
    'Student Name',
    'Grade Level',
    'Section',
    'Total Assessments',
    'Latest Score',
    'Latest Proficiency'
  ]);

  // Get unique students
  const uniqueStudentIds = [...new Set(assessments.map(a => a.studentId))];

  uniqueStudentIds.forEach(studentId => {
    const student = studentsMap.get(studentId);
    if (student) {
      const studentAssessments = assessments.filter(a => a.studentId === studentId);
      const latestAssessment = studentAssessments.sort((a, b) => 
        new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime()
      )[0];

      data.push([
        student.lrn || 'N/A',
        student.name,
        student.gradeLevel === 0 ? 'Kindergarten' : `Grade ${student.gradeLevel}`,
        student.sectionName,
        studentAssessments.length,
        latestAssessment?.overallScore || 'N/A',
        latestAssessment?.proficiencyLevel || 'N/A'
      ]);
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 12 },
    { wch: 18 }
  ];

  return ws;
}
