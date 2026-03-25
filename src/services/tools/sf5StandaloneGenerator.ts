/**
 * SF5 Standalone PDF Generator for Free Form Generator Tool
 * Converts parsed CSV data into the format expected by the existing SF5 generator,
 * then calls it. Adds watermark for anonymous (Tier 0) users.
 */

import { generateSF5PDF } from '../../utils/pdf/sf5Generator';
import { addWatermark } from './watermark';
import type { SF5ParsedRow } from './csvParser';
import type { PromotionRecordWithStudent } from '../../types/promotionRecords';

export interface SF5StandaloneOptions {
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
  students: SF5ParsedRow[];
  addWatermark?: boolean;
}

/**
 * Convert parsed CSV rows into PromotionRecordWithStudent[] for the existing generator.
 */
function convertToPromotionRecords(
  students: SF5ParsedRow[],
  gradeLevel: number,
  sectionName: string
): PromotionRecordWithStudent[] {
  return students.map((s, index) => {
    const generalAverage = s.generalAverage || 0;
    // DepEd: 75 is the passing grade
    const promoted = generalAverage >= 75;

    return {
      id: `standalone-${index}`,
      school_id: 'standalone',
      student_id: `student-${index}`,
      section_id: 'standalone-section',
      school_year: '',
      grading_period: 'final',
      current_grade_level: gradeLevel,
      socio_emotional_dev: null,
      physical_motor_dev: null,
      cognitive_dev: null,
      language_literacy_dev: null,
      general_average: generalAverage,
      promotion_status: promoted ? 'promoted' : 'retained',
      next_grade_level: promoted ? gradeLevel + 1 : gradeLevel,
      next_section_id: null,
      remarks: null,
      attendance_days_present: null,
      attendance_days_absent: null,
      recorded_by: null,
      approved_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      student: {
        id: `student-${index}`,
        first_name: s.firstName,
        middle_name: s.middleName || null,
        last_name: s.lastName,
        lrn: s.lrn || '',
        gender: s.gender || 'Male',
      },
      section: {
        id: 'standalone-section',
        name: sectionName,
        grade_level: gradeLevel,
      },
    };
  });
}

/**
 * Generate SF5 PDF from raw CSV data.
 */
export async function generateSF5Standalone(options: SF5StandaloneOptions): Promise<void> {
  const records = convertToPromotionRecords(
    options.students,
    options.gradeLevel,
    options.sectionName
  );

  const doc = await generateSF5PDF({
    schoolInfo: options.schoolInfo,
    schoolYear: options.schoolYear,
    gradingPeriod: 'Final',
    gradeLevel: options.gradeLevel,
    section: { name: options.sectionName, grade_level: options.gradeLevel },
    records,
    preparedBy: options.adviserName,
    returnDoc: true,
  });

  if (doc) {
    if (options.addWatermark !== false) {
      addWatermark(doc);
    }
    const fileName = `SF5_${options.schoolYear.replace(/\//g, '-')}_Grade${options.gradeLevel}_${options.sectionName}.pdf`;
    doc.save(fileName);
  }
}
