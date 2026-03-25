/**
 * SF10-ES — Learner Permanent Academic Record (Elementary School)
 * 
 * Renders the official DepEd SF10-ES format:
 * - Page 1: Personal info + Eligibility + Scholastic Records (Grades 1-2)
 * - Page 2: Scholastic Records (Grades 3-6)
 * - Page 3: Certification sections
 * 
 * Two school-year blocks per row, matching the DepEd template layout.
 */

import React from 'react';
import type { AcademicHistory, SchoolYearRecord, SubjectGrade, QuarterGrade } from '../shared/FormTypes';
import './SF10Print.css';

// Standard elementary subjects in DepEd order
const ES_SUBJECTS = [
  'Mother Tongue',
  'Filipino',
  'English',
  'Mathematics',
  'Science',
  'Araling Panlipunan',
  'EPP / TLE',
  'MAPEH',
];

const MAPEH_COMPONENTS = ['Music', 'Arts', 'Physical Education', 'Health'];

const CORE_VALUES = [
  'Eduk. sa Pagpapakatao',
  '*Arabic Language',
  '*Islamic Values Education',
];

interface SF10ElementaryViewProps {
  record: AcademicHistory;
  schoolInfo?: {
    district?: string;
    division?: string;
    region?: string;
  };
}

function getGradeValue(grade: number | QuarterGrade | undefined): string {
  if (grade === undefined || grade === null) return '';
  if (typeof grade === 'number') return grade > 0 ? String(grade) : '';
  if (grade && typeof grade === 'object') return grade.finalGrade > 0 ? String(grade.finalGrade) : '';
  return '';
}

function computeGeneralAverage(grades: SubjectGrade[]): string {
  const finalGrades = grades.filter(g => g.finalGrade > 0).map(g => g.finalGrade);
  if (finalGrades.length === 0) return '';
  return (finalGrades.reduce((sum, g) => sum + g, 0) / finalGrades.length).toFixed(2);
}

/**
 * Maps subject grades to the standard DepEd subject list.
 * Returns grades in official order, with blanks for missing subjects.
 */
function mapGradesToSubjects(grades: SubjectGrade[]): Map<string, SubjectGrade> {
  const map = new Map<string, SubjectGrade>();

  for (const g of grades) {
    const name = g.learningAreaName.toLowerCase();

    // Map to standard names
    if (name.includes('mother tongue') || name.includes('mtb')) {
      map.set('Mother Tongue', g);
    } else if (name.includes('filipino') || name.includes('fil')) {
      map.set('Filipino', g);
    } else if (name.includes('english') || name.includes('eng')) {
      map.set('English', g);
    } else if (name.includes('math')) {
      map.set('Mathematics', g);
    } else if (name.includes('science') || name.includes('sci')) {
      map.set('Science', g);
    } else if (name.includes('araling') || name.includes('ap ') || name === 'ap') {
      map.set('Araling Panlipunan', g);
    } else if (name.includes('epp') || name.includes('tle')) {
      map.set('EPP / TLE', g);
    } else if (name.includes('mapeh')) {
      map.set('MAPEH', g);
    } else if (name.includes('music')) {
      map.set('Music', g);
    } else if (name.includes('arts') || name === 'art') {
      map.set('Arts', g);
    } else if (name.includes('physical education') || name.includes('pe')) {
      map.set('Physical Education', g);
    } else if (name.includes('health')) {
      map.set('Health', g);
    } else if (name.includes('esp') || name.includes('pagpapakatao')) {
      map.set('Eduk. sa Pagpapakatao', g);
    } else if (name.includes('arabic')) {
      map.set('*Arabic Language', g);
    } else if (name.includes('islamic')) {
      map.set('*Islamic Values Education', g);
    }
  }

  return map;
}

/** Renders one scholastic record block (one school year) */
function ScholasticBlock({ yearData, schoolInfo }: { yearData?: SchoolYearRecord; schoolInfo?: SF10ElementaryViewProps['schoolInfo'] }) {
  const gradeMap = yearData ? mapGradesToSubjects(yearData.grades) : new Map();

  return (
    <div className="sf10-scholastic-block">
      {/* School Info */}
      <div className="sf10-school-info">
        <div className="sf10-school-info-row">
          <span><span className="sf10-info-label">School:</span> <strong>{yearData?.schoolName || ''}</strong></span>
          <span><span className="sf10-info-label">School ID:</span> {yearData?.schoolId || ''}</span>
        </div>
        <div className="sf10-school-info-row">
          <span><span className="sf10-info-label">District:</span> {schoolInfo?.district || ''}</span>
          <span><span className="sf10-info-label">Division:</span> {schoolInfo?.division || ''}</span>
          <span><span className="sf10-info-label">Region:</span> {schoolInfo?.region || ''}</span>
        </div>
        <div className="sf10-school-info-row">
          <span><span className="sf10-info-label">Classified as Grade:</span> {yearData ? yearData.gradeLevel : ''}</span>
          <span><span className="sf10-info-label">Section:</span> {yearData?.section || ''}</span>
          <span><span className="sf10-info-label">School Year:</span> {yearData?.schoolYear || ''}</span>
        </div>
        <div className="sf10-school-info-row">
          <span><span className="sf10-info-label">Name of Adviser/Teacher:</span> {yearData?.adviserName || ''}</span>
          <span><span className="sf10-info-label">Signature:</span> _______________</span>
        </div>
      </div>

      {/* Grades Table */}
      <table className="sf10-grade-table">
        <thead>
          <tr>
            <th className="w-[35%]">LEARNING AREAS</th>
            <th colSpan={4}>Quarterly Rating</th>
            <th className="w-[10%]">Final<br />Rating</th>
            <th className="w-[14%]">Remarks</th>
          </tr>
          <tr>
            <th></th>
            <th className="w-[8%]">1</th>
            <th className="w-[8%]">2</th>
            <th className="w-[8%]">3</th>
            <th className="w-[8%]">4</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {ES_SUBJECTS.map((subject) => {
            const g = gradeMap.get(subject);
            const isMAPEH = subject === 'MAPEH';

            return (
              <React.Fragment key={subject}>
                <tr>
                  <td className={isMAPEH ? 'sf10-subject-name' : 'sf10-subject-name'}>
                    {subject}
                  </td>
                  <td>{isMAPEH ? '' : getGradeValue(g?.q1)}</td>
                  <td>{isMAPEH ? '' : getGradeValue(g?.q2)}</td>
                  <td>{isMAPEH ? '' : getGradeValue(g?.q3)}</td>
                  <td>{isMAPEH ? '' : getGradeValue(g?.q4)}</td>
                  <td>{isMAPEH ? '' : (g?.finalGrade ? String(g.finalGrade) : '')}</td>
                  <td>{isMAPEH ? '' : (g?.remarks || '')}</td>
                </tr>
                {isMAPEH && MAPEH_COMPONENTS.map((comp) => {
                  const cg = gradeMap.get(comp);
                  return (
                    <tr key={comp}>
                      <td className="sf10-sub-subject">{comp}</td>
                      <td>{getGradeValue(cg?.q1)}</td>
                      <td>{getGradeValue(cg?.q2)}</td>
                      <td>{getGradeValue(cg?.q3)}</td>
                      <td>{getGradeValue(cg?.q4)}</td>
                      <td>{cg?.finalGrade ? String(cg.finalGrade) : ''}</td>
                      <td>{cg?.remarks || ''}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* Core Values / special subjects */}
          {CORE_VALUES.map((subject) => {
            const g = gradeMap.get(subject);
            return (
              <tr key={subject}>
                <td className={`sf10-subject-name ${subject.startsWith('*') ? 'italic' : ''}`}>
                  {subject}
                </td>
                <td>{getGradeValue(g?.q1)}</td>
                <td>{getGradeValue(g?.q2)}</td>
                <td>{getGradeValue(g?.q3)}</td>
                <td>{getGradeValue(g?.q4)}</td>
                <td>{g?.finalGrade ? String(g.finalGrade) : ''}</td>
                <td>{g?.remarks || ''}</td>
              </tr>
            );
          })}

          {/* General Average */}
          <tr className="sf10-gen-avg-row">
            <td className="sf10-subject-name">General Average</td>
            <td colSpan={4}></td>
            <td>{yearData ? computeGeneralAverage(yearData.grades) : ''}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      {/* Remedial Classes */}
      <div className="sf10-remedial-header">
        Remedial Classes&emsp;Date Conducted: ________ to ________
      </div>
      <table className="sf10-remedial-table">
        <thead>
          <tr>
            <th>Learning Areas</th>
            <th>Final Rating</th>
            <th>Remedial Class Mark</th>
            <th>Recomputed Final Grade</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
          <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
        </tbody>
      </table>
    </div>
  );
}

export const SF10ElementaryView: React.FC<SF10ElementaryViewProps> = ({ record, schoolInfo }) => {
  // Group school years by grade level (1-6 for elementary)
  const yearsByGrade = new Map<number, SchoolYearRecord>();
  for (const yr of record.schoolYears) {
    if (yr.gradeLevel >= 1 && yr.gradeLevel <= 6) {
      yearsByGrade.set(yr.gradeLevel, yr);
    }
  }

  // Build pairs: [Grade 1 + Grade 2], [Grade 3 + Grade 4], [Grade 5 + Grade 6]
  const pairs: [SchoolYearRecord | undefined, SchoolYearRecord | undefined][] = [
    [yearsByGrade.get(1), yearsByGrade.get(2)],
    [yearsByGrade.get(3), yearsByGrade.get(4)],
    [yearsByGrade.get(5), yearsByGrade.get(6)],
  ];

  return (
    <div className="sf10-print-container">
      {/* PAGE 1: Personal Info + Grades 1-2 */}
      <div className="sf10-page">
        <div className="sf10-form">
          {/* Header */}
          <div className="sf10-header">
            <div className="sf10-header-label">SF10-ES</div>
            <div className="sf10-header-logo-left">
              <img src="/deped.png" alt="DepEd Logo" className="sf10-logo" />
            </div>
            <div className="sf10-header-center">
              <div className="sf10-header-republic">Republic of the Philippines</div>
              <div className="sf10-header-dept">Department of Education</div>
              <div className="sf10-header-title">
                Learner Permanent Academic Record for Elementary School (SF10-ES)
              </div>
              <div className="sf10-header-subtitle">(Formerly Form 137)</div>
            </div>
            <div className="sf10-header-logo-right">
              <img src="/deped-seal.png" alt="DepEd Seal" className="sf10-logo" />
            </div>
          </div>

          {/* Personal Information */}
          <div className="sf10-personal-info">
            <div className="sf10-personal-info-header">LEARNER'S PERSONAL INFORMATION</div>
            <div className="sf10-info-row">
              <div className="sf10-info-cell">
                <span className="sf10-info-label">LAST NAME:</span>
                <span className="sf10-info-value">{record.studentName?.split(',')[0]?.trim() || ''}</span>
              </div>
              <div className="sf10-info-cell">
                <span className="sf10-info-label">FIRST NAME:</span>
                <span className="sf10-info-value">
                  {record.studentName?.split(',')[1]?.trim().split(/\s+/)[0] || ''}
                </span>
              </div>
              <div className="sf10-info-cell">
                <span className="sf10-info-label">NAME EXTN. (Jr/III):</span>
                <span className="sf10-info-value"></span>
              </div>
              <div className="sf10-info-cell">
                <span className="sf10-info-label">MIDDLE NAME:</span>
                <span className="sf10-info-value">
                  {(() => {
                    const parts = record.studentName?.split(',')[1]?.trim().split(/\s+/) || [];
                    return parts.length > 1 ? parts.slice(1).join(' ') : '';
                  })()}
                </span>
              </div>
            </div>
            <div className="sf10-info-row">
              <div className="sf10-info-cell">
                <span className="sf10-info-label">Learner Reference Number (LRN):</span>
                <span className="sf10-info-value">{record.lrn || ''}</span>
              </div>
              <div className="sf10-info-cell">
                <span className="sf10-info-label">Birthdate (mm/dd/yyyy):</span>
                <span className="sf10-info-value">{record.birthDate || ''}</span>
              </div>
              <div className="sf10-info-cell">
                <span className="sf10-info-label">Sex:</span>
                <span className="sf10-info-value">{record.sex || ''}</span>
              </div>
            </div>
          </div>

          {/* Eligibility */}
          <div className="sf10-eligibility">
            <div className="sf10-eligibility-header">ELIGIBILITY FOR ELEMENTARY SCHOOL ENROLMENT</div>
            <div className="sf10-info-row">
              <div className="sf10-info-cell">
                <span className="sf10-info-label">Credential Presented for Grade 1:</span>
              </div>
              <div className="sf10-info-cell">
                <span className="sf10-info-label">☐ Kinder Progress Report</span>
              </div>
              <div className="sf10-info-cell">
                <span className="sf10-info-label">☐ ECCD Checklist</span>
              </div>
              <div className="sf10-info-cell">
                <span className="sf10-info-label">☐ Kindergarten Certificate of Completion</span>
              </div>
            </div>
            <div className="sf10-info-row">
              <div className="sf10-info-cell">
                <span className="sf10-info-label">Name of School:</span>
                <span className="sf10-info-value">{record.currentSchoolName || ''}</span>
              </div>
              <div className="sf10-info-cell">
                <span className="sf10-info-label">School ID:</span>
                <span className="sf10-info-value">{record.currentSchoolId || ''}</span>
              </div>
              <div className="sf10-info-cell">
                <span className="sf10-info-label">Address of School:</span>
                <span className="sf10-info-value"></span>
              </div>
            </div>
          </div>

          {/* Scholastic Record Header */}
          <div className="sf10-scholastic-section-header">SCHOLASTIC RECORD</div>

          {/* Grades 1-2 pair */}
          <div className="sf10-scholastic-pair">
            <ScholasticBlock yearData={pairs[0][0]} schoolInfo={schoolInfo} />
            <ScholasticBlock yearData={pairs[0][1]} schoolInfo={schoolInfo} />
          </div>
        </div>
      </div>

      {/* PAGE 2: Grades 3-4 and 5-6 */}
      <div className="sf10-page">
        <div className="sf10-form">
          {/* Grades 3-4 pair */}
          <div className="sf10-scholastic-section-header mt-0">SCHOLASTIC RECORD</div>
          <div className="sf10-scholastic-pair">
            <ScholasticBlock yearData={pairs[1][0]} schoolInfo={schoolInfo} />
            <ScholasticBlock yearData={pairs[1][1]} schoolInfo={schoolInfo} />
          </div>

          {/* Grades 5-6 pair */}
          <div className="sf10-scholastic-pair mt-2">
            <ScholasticBlock yearData={pairs[2][0]} schoolInfo={schoolInfo} />
            <ScholasticBlock yearData={pairs[2][1]} schoolInfo={schoolInfo} />
          </div>

          {/* Transfer Out note */}
          <div className="text-[8px] italic mt-1.5 border-t border-black pt-1">
            For Transfer Out /Elementary School Completers Only
          </div>

          {/* Certification */}
          <div className="sf10-certification">
            <div className="sf10-certification-title">CERTIFICATION</div>
            <div className="sf10-certification-text">
              I CERTIFY that this is a true record of{' '}
              <span className="sf10-certification-underline">{record.studentName || ''}</span>{' '}
              with LRN <span className="sf10-certification-underline">{record.lrn || ''}</span>{' '}
              and that he/she is eligible for admission to Grade{' '}
              <span className="sf10-certification-underline">____</span>.
            </div>
            <div className="mt-2 text-[8px]">
              <div className="sf10-info-row border-none">
                <div className="sf10-info-cell border-none">
                  <span className="sf10-info-label">School Name:</span>
                  <span className="sf10-info-value">{record.currentSchoolName || ''}</span>
                </div>
                <div className="sf10-info-cell border-none">
                  <span className="sf10-info-label">School ID:</span>
                  <span className="sf10-info-value">{record.currentSchoolId || ''}</span>
                </div>
                <div className="sf10-info-cell border-none">
                  <span className="sf10-info-label">Division:</span>
                  <span className="sf10-info-value">{schoolInfo?.division || ''}</span>
                </div>
                <div className="sf10-info-cell border-none">
                  <span className="sf10-info-label">Last School Year Attended:</span>
                  <span className="sf10-info-value">
                    {record.schoolYears.length > 0
                      ? record.schoolYears[record.schoolYears.length - 1].schoolYear
                      : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="sf10-signature-row">
              <div className="sf10-signature-block">
                <div className="sf10-signature-line"></div>
                <div className="sf10-signature-label">Date</div>
              </div>
              <div className="sf10-signature-block">
                <div className="sf10-signature-line"></div>
                <div className="sf10-signature-label">Signature of Principal/School Head over Printed Name</div>
              </div>
              <div className="sf10-signature-block italic text-[7px]">
                (Affix School Seal here)
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sf10-footer">BPRT Revised 2017</div>
        </div>
      </div>
    </div>
  );
};

export default SF10ElementaryView;
