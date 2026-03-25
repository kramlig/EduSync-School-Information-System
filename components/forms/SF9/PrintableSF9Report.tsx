import React, { useMemo, useCallback } from 'react';
import DepEdLogo from '../../DepEdLogo';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { Student, Grade, SubGradeRecord } from '../../../types';
import { PrinterIcon } from '../../icons';

// ── Types ──────────────────────────────────────────────────────
interface SF9SchoolData {
  grades: Grade[];
  learningAreas: any[];
  coreValues: any[];
  coreValueGrades: any[];
  attendanceRecords: any[];
  homeroomGuidanceGrades?: any[];
  monthlySchoolDaysConfig: Record<string, number>;
  teachers: any[];
  sections: any[];
  settings: {
    schoolName?: string;
    schoolId?: string;
    region?: string;
    division?: string;
    district?: string;
    schoolYear?: string;
    [key: string]: any;
  };
}

interface PrintableSF9ReportProps {
  student: Student;
  schoolData: SF9SchoolData;
  hideDownloadButton?: boolean;
  studentIndex?: number;
}

// ── Helpers ────────────────────────────────────────────────────
const normalizeGradeLevel = (gradeLevel: string | number): number | null => {
  if (typeof gradeLevel === 'number') return gradeLevel;
  if (gradeLevel === 'Kindergarten') return 0;
  const match = String(gradeLevel).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

const calculateAge = (dateOfBirth?: string): number | string => {
  if (!dateOfBirth) return '';
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const calculateQuarterAverage = (grade: number | SubGradeRecord | undefined | null): number | string => {
  if (grade === undefined || grade === null) return '';
  if (typeof grade === 'number') return grade;
  const subGrades = Object.values(grade).filter(g => typeof g === 'number') as number[];
  if (subGrades.length === 0) return '';
  return Math.round(subGrades.reduce((a, b) => a + b, 0) / subGrades.length);
};

/** Map numeric average → descriptive rating per MATATAG curriculum */
const getDescriptiveRating = (avg: number | undefined): string => {
  if (avg === undefined) return '';
  if (avg >= 90) return 'A';
  if (avg >= 85) return 'P';
  if (avg >= 80) return 'AP';
  if (avg >= 75) return 'D';
  return 'B';
};

/** Format student name as LAST, FIRST, MIDDLE */
const formatNameLFM = (student: Student): string => {
  // If the student object has separate name parts, use them
  const last = (student as any).lastName || '';
  const first = (student as any).firstName || '';
  const middle = (student as any).middleName || '';

  if (last && first) {
    return `${last.toUpperCase()}, ${first.toUpperCase()}${middle ? ', ' + middle.toUpperCase() : ''}`;
  }

  // Fall back to splitting the full `name` field
  if (student.name) {
    const parts = student.name.trim().split(/\s+/);
    if (parts.length >= 3) {
      return `${parts[parts.length - 1].toUpperCase()}, ${parts.slice(0, parts.length - 1).join(' ').toUpperCase()}`;
    }
    return student.name.toUpperCase();
  }
  return '';
};

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 80);

// ── Sub-components ─────────────────────────────────────────────
const Td: React.FC<{ children?: React.ReactNode; className?: string; colSpan?: number; rowSpan?: number }> = ({ children, className, colSpan, rowSpan }) => (
  <td className={`border border-black p-1 text-center text-[9px] ${className ?? ''}`} colSpan={colSpan} rowSpan={rowSpan}>{children}</td>
);
const Th: React.FC<{ children?: React.ReactNode; className?: string; colSpan?: number; rowSpan?: number }> = ({ children, className, colSpan, rowSpan }) => (
  <th className={`border border-black p-1 text-center font-bold bg-[#4472C4] text-white text-[9px] ${className ?? ''}`} colSpan={colSpan} rowSpan={rowSpan}>{children}</th>
);
const InfoField: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className }) => (
  <div className={`flex items-baseline ${className ?? ''}`}>
    <span className="font-bold">{label}</span>
    <span className="flex-1 border-b border-black text-center font-semibold pb-1">{value}</span>
  </div>
);

// ── Homeroom Guidance competencies per quarter (DepEd MATATAG curriculum) ──
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

// ── Main Component ─────────────────────────────────────────────
const PrintableSF9Report: React.FC<PrintableSF9ReportProps> = ({ student, schoolData, hideDownloadButton = false }) => {
  const { grades, learningAreas, coreValues, coreValueGrades, attendanceRecords, homeroomGuidanceGrades, monthlySchoolDaysConfig, teachers, sections } = schoolData;

  const settings = schoolData.settings || {
    schoolName: 'School Name',
    region: 'Region',
    division: 'Division',
    district: 'District',
    schoolYear: '2025-2026',
  };

  // ── Data derivations ──
  const studentGrades = useMemo(() => {
    const map = new Map<string, Grade>();
    grades.filter(g => g.studentId === student.id).forEach(g => map.set(g.learningAreaId, g));
    return map;
  }, [grades, student.id]);

  const studentCoreValues = useMemo(
    () => new Map(coreValueGrades.filter((g: any) => g.studentId === student.id).map((g: any) => [g.coreValueId, g])),
    [coreValueGrades, student.id],
  );

  // Homeroom guidance: find this student's record (q1_ratings / q2_ratings / etc.)
  const studentHG = useMemo(() => {
    if (!homeroomGuidanceGrades?.length) return null;
    return homeroomGuidanceGrades.find((g: any) => g.studentId === student.id || g.student_id === student.id) || null;
  }, [homeroomGuidanceGrades, student.id]);

  const section = useMemo(() => sections.find((s: any) => s.id === student.sectionId), [sections, student.sectionId]);
  const adviser = useMemo(() => teachers.find((t: any) => t.id === section?.adviserId), [teachers, section]);
  const schoolHead = useMemo(() => teachers.find((t: any) => t.role === 'principal'), [teachers]);

  const studentLearningAreas = useMemo(() => {
    const gradeLevel = section?.gradeLevel;
    const numericGL = gradeLevel ? normalizeGradeLevel(gradeLevel) : null;
    const studentGradeIds = new Set(Array.from(studentGrades.keys()));

    const filtered = numericGL !== null
      ? learningAreas.filter((la: any) => {
          if (Array.isArray(la.gradeLevel)) return la.gradeLevel.includes(numericGL);
          return la.gradeLevel === numericGL;
        })
      : learningAreas.filter((la: any) => studentGradeIds.has(la.id));

    if (filtered.length === 0 && studentGradeIds.size > 0) {
      return learningAreas.filter((la: any) => studentGradeIds.has(la.id));
    }
    return filtered;
  }, [learningAreas, section, studentGrades]);

  const getFinalGrade = useCallback((grade: Grade | undefined): number | undefined => {
    if (!grade) return undefined;
    if (grade.finalGrade !== undefined) return grade.finalGrade;
    const quarters: ('q1' | 'q2' | 'q3' | 'q4')[] = ['q1', 'q2', 'q3', 'q4'];
    const values: number[] = [];
    for (const q of quarters) {
      const v = grade[q];
      if (typeof v === 'number') values.push(v);
      else if (v && typeof v === 'object') {
        const nums = Object.values(v as Record<string, any>).filter(n => typeof n === 'number') as number[];
        if (nums.length) values.push(Math.round(nums.reduce((a, b) => a + b, 0) / nums.length));
      }
    }
    if (!values.length) return undefined;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, []);

  const getRemarks = useCallback((finalGrade: number | undefined): string => {
    if (finalGrade === undefined) return '';
    return finalGrade >= 75 ? 'Passed' : 'Failed';
  }, []);

  const generalAverage = useMemo(() => {
    const finals = Array.from(studentGrades.values()).map(g => getFinalGrade(g)).filter((g): g is number => typeof g === 'number');
    if (finals.length === 0) return null;
    return (finals.reduce((s, g) => s + g, 0) / finals.length).toFixed(2);
  }, [studentGrades, getFinalGrade]);

  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

  const monthlyAttendanceSummary = useMemo(() => {
    const summary: Record<string, { present: number; absent: number }> = {};
    const records = attendanceRecords.filter((r: any) => r.studentId === student.id);
    for (const record of records) {
      const r = record as any;
      if (!r.date || !r.status) continue;
      const date = new Date(r.date + 'T00:00:00');
      const monthAbbr = date.toLocaleString('default', { month: 'short' });
      if (!summary[monthAbbr]) summary[monthAbbr] = { present: 0, absent: 0 };
      const status = r.status?.toLowerCase();
      if (status === 'present' || status === 'late') summary[monthAbbr].present++;
      else if (status === 'absent' || status === 'excused') summary[monthAbbr].absent++;
    }
    return summary;
  }, [attendanceRecords, student.id]);

  // ── Render ──
  return (
    <div className="text-black bg-white" style={{ fontFamily: "'Calibri', 'Carlito', 'Segoe UI', Arial, sans-serif" }}>
      {/* Download button */}
      {!hideDownloadButton && (
        <div className="flex justify-end items-center gap-3 mb-4 print:hidden">
          <button
            onClick={async () => {
              let page1 = document.getElementById(`sf9-page-1-${student.id}`) as HTMLElement | null;
              let page2 = document.getElementById(`sf9-page-2-${student.id}`) as HTMLElement | null;
              if (!page1 || !page2) {
                const blocks = Array.from(document.querySelectorAll('#sf9-print-content .sf9-page-content')) as HTMLElement[];
                if (!page1) page1 = blocks[0] ?? null;
                if (!page2) page2 = blocks[1] ?? null;
              }
              if (!page1 || !page2) { console.error('SF9 PDF export: could not find two page blocks.'); return; }
              document.body.classList.add('pdf-export');
              try {
                const cnvOpts = { scale: 2, useCORS: true, allowTaint: false, backgroundColor: '#ffffff', scrollY: 0 } as const;
                const [c1, c2] = await Promise.all([html2canvas(page1, cnvOpts), html2canvas(page2, cnvOpts)]);
                const img1 = c1.toDataURL('image/jpeg', 0.98);
                const img2 = c2.toDataURL('image/jpeg', 0.98);
                const pdf = new jsPDF({ unit: 'in', format: 'letter', orientation: 'landscape' });
                const pdfW = 11;
                const pdfH = 8.5;
                // Scale each page proportionally, capped at page bounds
                const h1 = Math.min((c1.height * pdfW) / c1.width, pdfH);
                const h2 = Math.min((c2.height * pdfW) / c2.width, pdfH);
                pdf.addImage(img1, 'JPEG', 0, 0, pdfW, h1);
                pdf.addPage('letter', 'landscape');
                pdf.addImage(img2, 'JPEG', 0, 0, pdfW, h2);
                pdf.save(`SF9_${slug(student.name)}_${slug(String(settings.schoolYear))}.pdf`);
              } finally {
                document.body.classList.remove('pdf-export');
              }
            }}
            className="group flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <div className="transition-transform group-hover:rotate-12"><PrinterIcon /></div>
            <span className="text-sm tracking-wide">Download SF9 PDF</span>
          </button>
        </div>
      )}

      <div id="sf9-print-content" className="p-4 bg-gray-200 text-[10px]">
        {/* ═══════════════════ PAGE 1 ═══════════════════ */}
        <div id={`sf9-page-1-${student.id}`} className="sf9-page-content bg-white shadow-lg p-8 mb-8 mx-auto" style={{ width: '11in', minHeight: '8.5in', pageBreakAfter: 'always', breakAfter: 'page' }}>
          <div className="grid grid-cols-12 gap-4">
            {/* ── LEFT COLUMN ── */}
            <div className="col-span-6">
              {/* Report on Attendance */}
              <h3 className="font-bold text-center mb-1 text-xs">REPORT ON ATTENDANCE</h3>
              <table className="w-full border-collapse border border-black text-[9px] mb-4">
                <thead>
                  <tr>
                    <Th className="w-[18%]"></Th>
                    {months.map(m => <Th key={m}>{m}</Th>)}
                    <Th>Total</Th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <Td className="text-left font-bold text-[8px] h-6">No. of School Days</Td>
                    {months.map(m => <Td key={m}>{monthlySchoolDaysConfig[m] ?? ''}</Td>)}
                    <Td className="font-bold">{Object.entries(monthlySchoolDaysConfig).filter(([k]) => months.includes(k)).reduce((a, [, v]) => a + (v as number), 0)}</Td>
                  </tr>
                  <tr>
                    <Td className="text-left font-bold text-[8px] h-6">No. of days Present</Td>
                    {months.map(m => <Td key={m}>{monthlyAttendanceSummary[m]?.present ?? ''}</Td>)}
                    <Td className="font-bold">{Object.values(monthlyAttendanceSummary).reduce((s, m) => s + (m.present || 0), 0)}</Td>
                  </tr>
                  <tr>
                    <Td className="text-left font-bold text-[8px] h-6">No. of days Absent</Td>
                    {months.map(m => <Td key={m}>{monthlyAttendanceSummary[m]?.absent ?? ''}</Td>)}
                    <Td className="font-bold">{Object.values(monthlyAttendanceSummary).reduce((s, m) => s + (m.absent || 0), 0)}</Td>
                  </tr>
                </tbody>
              </table>

              {/* Learning Delivery Mode */}
              <table className="w-full border-collapse border border-black text-[9px] mb-6">
                <thead>
                  <tr><Th colSpan={4}>LEARNING DELIVERY MODE</Th></tr>
                  <tr><Th>FIRST QUARTER</Th><Th>SECOND QUARTER</Th><Th>THIRD QUARTER</Th><Th>FOURTH QUARTER</Th></tr>
                </thead>
                <tbody>
                  <tr><Td className="h-6"></Td><Td></Td><Td></Td><Td></Td></tr>
                </tbody>
              </table>

              {/* Parent/Guardian's Signature */}
              <h3 className="font-bold text-center mb-1 text-xs mt-6">PARENT/GUARDIAN'S SIGNATURE</h3>
              <p className="text-[9px] italic mb-4 text-justify px-2">
                By signing, it is understood that I received and read the contents of this report card reflecting the name of my son/daughter.
              </p>
              <div className="mt-4 space-y-8 p-2">
                <div className="flex items-baseline"><span className="w-28 text-[10px]">1<sup>st</sup> Quarter:</span><div className="flex-1 border-b border-black pb-1"></div></div>
                <div className="flex items-baseline"><span className="w-28 text-[10px]">2<sup>nd</sup> Quarter:</span><div className="flex-1 border-b border-black pb-1"></div></div>
                <div className="flex items-baseline"><span className="w-28 text-[10px]">3<sup>rd</sup> Quarter:</span><div className="flex-1 border-b border-black pb-1"></div></div>
                <div className="flex items-baseline"><span className="w-28 text-[10px]">4<sup>th</sup> Quarter:</span><div className="flex-1 border-b border-black pb-1"></div></div>
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="col-span-6">
              <div className="flex items-start mb-2">
                {/* School Form 9 label */}
                <div className="text-left text-[10px] italic w-1/4">School Form 9</div>
                {/* Center: DepEd header */}
                <div className="text-center text-[10px] w-1/2 leading-tight">
                  <div className="flex justify-center mb-1"><DepEdLogo className="w-14 h-14" /></div>
                  <p className="font-semibold">Republic of the Philippines</p>
                  <p className="font-bold">Department of Education</p>
                  <p>{settings.region}</p>
                  <p>{settings.division}</p>
                  <p>{settings.district}</p>
                  <p className="font-bold text-xs mt-1 uppercase">{settings.schoolName}</p>
                  {settings.schoolId && <p className="font-bold text-xs">{settings.schoolId}</p>}
                  <p className="font-bold text-xs mt-1">
                    GRADE {section?.gradeLevel} – {section?.name?.toUpperCase()}
                  </p>
                </div>
                <div className="w-1/4"></div>
              </div>

              {/* Student info */}
              <div className="space-y-2 text-[10px] mb-3">
                <div className="flex items-baseline gap-2">
                  <InfoField label="Name: " value={<span className="font-bold">{formatNameLFM(student)}</span>} className="flex-[2]" />
                  <InfoField label="Age: " value={calculateAge(student.dateOfBirth)} className="w-24" />
                  <InfoField label="Sex: " value={<span className="font-bold">{student.sex?.toUpperCase()}</span>} className="w-24" />
                </div>
                <div className="flex items-baseline gap-2">
                  <InfoField label="LRN: " value={<span className="font-bold">{student.lrn}</span>} className="flex-1" />
                  <InfoField label="School Year: " value={<span className="font-bold">{settings.schoolYear}</span>} className="flex-1" />
                </div>
              </div>

              {/* Dear Parent */}
              <div className="text-[10px] space-y-1 mb-3">
                <p className="font-bold italic">Dear Parent:</p>
                <p className="text-justify indent-8 leading-relaxed">
                  This report card shows the ability and progress your child has made in the different learning areas as well as his/her core values. The school welcomes you should you desire to know more about the student's progress.
                </p>
              </div>

              {/* Adviser & School Head */}
              <div className="grid grid-cols-2 gap-4 mt-4 text-[10px]">
                <div className="text-center">
                  <div className="font-bold border-b border-black w-4/5 mx-auto pb-1 uppercase">{schoolHead?.name ?? ''}</div>
                  <p>School Head</p>
                </div>
                <div className="text-center">
                  <div className="font-bold border-b border-black w-4/5 mx-auto pb-1 uppercase">{adviser?.name ?? ''}</div>
                  <p>Adviser</p>
                </div>
              </div>

              {/* Certificate of Transfer */}
              <div className="mt-6 text-[10px]">
                <h3 className="font-bold text-center">Certificate of Transfer</h3>
                <div className="mt-2 space-y-1">
                  <div className="flex items-baseline"><span className="w-36">Admitted to Grade:</span><span className="flex-1 border-b border-black pb-1"></span><span className="w-20 ml-2">Section:</span><span className="flex-1 border-b border-black pb-1"></span></div>
                  <div className="flex items-baseline mt-2"><span className="w-52">Eligibility for Admission to Grade:</span><span className="flex-1 border-b border-black pb-1"></span></div>
                  <div className="flex items-baseline mt-2"><span className="w-20">Approved:</span><span className="flex-1 border-b border-black pb-1"></span></div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="text-center"><div className="font-bold border-b border-black w-4/5 mx-auto pb-1 uppercase">{schoolHead?.name ?? ''}</div><p>School Head</p></div>
                  <div className="text-center"><div className="font-bold border-b border-black w-4/5 mx-auto pb-1 uppercase">{adviser?.name ?? ''}</div><p>Teacher</p></div>
                </div>
              </div>

              {/* Cancellation of Eligibility to Transfer */}
              <div className="mt-6 text-[10px]">
                <h3 className="font-bold text-center">Cancellation of Eligibility to Transfer</h3>
                <div className="mt-2 space-y-1">
                  <div className="flex items-baseline"><span className="w-24">Admitted in:</span><span className="flex-1 border-b border-black pb-1"></span></div>
                  <div className="flex items-baseline mt-4"><span className="w-12">Date:</span><span className="flex-1 border-b border-black mr-20 pb-1"></span><span className="flex-1 border-b border-black pb-1"></span></div>
                  <div className="flex items-baseline"><span className="w-12"></span><span className="flex-1 mr-20"></span><span className="flex-1 text-center">School Head</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* page break */}
        <div style={{ pageBreakAfter: 'always', breakAfter: 'page', height: 0, display: 'block' }} className="print:block hidden" aria-hidden="true" />

        {/* ═══════════════════ PAGE 2 ═══════════════════ */}
        <div id={`sf9-page-2-${student.id}`} className="sf9-page-content bg-white shadow-lg p-8 mx-auto" style={{ width: '11in', minHeight: '8.5in', pageBreakBefore: 'always', breakBefore: 'page' }}>
          <div className="grid grid-cols-2 gap-6">
            {/* ── LEFT: Learning Progress + Core Values ── */}
            <div>
              <h2 className="text-center font-bold text-[11px] mb-0 uppercase">MATATAG Curriculum</h2>
              <h3 className="text-center font-bold text-[10px] mb-1">REPORT ON LEARNING PROGRESS AND ACHIEVEMENT</h3>

              <table className="w-full border-collapse border border-black text-[9px]">
                <thead>
                  <tr>
                    <Th rowSpan={2} className="w-[28%]">LEARNING AREA</Th>
                    <Th colSpan={4}>QUARTER</Th>
                    <Th rowSpan={2}>AVERAGE</Th>
                    <Th rowSpan={2} className="text-[7px] leading-tight"><div className="transform -rotate-0">Descriptive<br/>Rating</div></Th>
                    <Th rowSpan={2} className="text-[7px] leading-tight"><div className="transform -rotate-0">Remarks</div></Th>
                  </tr>
                  <tr><Th>1</Th><Th>2</Th><Th>3</Th><Th>4</Th></tr>
                </thead>
                <tbody>
                  {studentLearningAreas.map((la: any) => {
                    const grade = studentGrades.get(la.id);
                    const avg = getFinalGrade(grade);
                    const remarks = grade?.remarks || getRemarks(avg);
                    const rating = getDescriptiveRating(avg);
                    return (
                      <React.Fragment key={la.id}>
                        <tr>
                          <Td className="text-left font-bold uppercase">{la.name}</Td>
                          <Td>{calculateQuarterAverage(grade?.q1)}</Td>
                          <Td>{calculateQuarterAverage(grade?.q2)}</Td>
                          <Td>{calculateQuarterAverage(grade?.q3)}</Td>
                          <Td>{calculateQuarterAverage(grade?.q4)}</Td>
                          <Td className="font-bold">{avg ?? ''}</Td>
                          <Td>{rating}</Td>
                          <Td className="font-bold">{remarks}</Td>
                        </tr>
                        {la.isComposite && la.subSubjects?.map((sub: string) => (
                          <tr key={sub}>
                            <Td className="text-left pl-4 italic">{sub}</Td>
                            <Td>{(grade?.q1 as SubGradeRecord)?.[sub] ?? ''}</Td>
                            <Td>{(grade?.q2 as SubGradeRecord)?.[sub] ?? ''}</Td>
                            <Td>{(grade?.q3 as SubGradeRecord)?.[sub] ?? ''}</Td>
                            <Td>{(grade?.q4 as SubGradeRecord)?.[sub] ?? ''}</Td>
                            <Td></Td><Td></Td><Td></Td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  <tr>
                    <Td colSpan={5} className="text-right font-bold pr-4">GENERAL AVERAGE</Td>
                    <Td className="font-bold">{generalAverage}</Td>
                    <Td>{generalAverage ? getDescriptiveRating(parseFloat(generalAverage)) : ''}</Td>
                    <Td className="font-bold">{generalAverage ? (parseFloat(generalAverage) >= 75 ? 'Passed' : 'Failed') : ''}</Td>
                  </tr>
                </tbody>
              </table>

              {/* MATATAG grading legend */}
              <div className="mt-2 text-[8px] border border-black p-2">
                <p className="font-bold mb-1">LEGEND:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0">
                  <div><span className="font-bold">A</span> (Advanced) <span className="ml-2">-90% and above</span></div>
                  <div><span className="font-bold">D</span> (Developing) <span className="ml-2">- 75-79%</span></div>
                  <div><span className="font-bold">P</span> (Proficient) <span className="ml-2">-85-89%</span></div>
                  <div><span className="font-bold">B</span> (Beginning) <span className="ml-2">-74% below</span></div>
                  <div><span className="font-bold">AP</span> (Approaching Proficiency) <span className="ml-2">-80-84%</span></div>
                </div>
              </div>

              {/* ── Core Values ── */}
              <h3 className="text-center font-bold text-[10px] mt-3 mb-1 uppercase">Report on Learner's Observed Behavior</h3>
              <table className="w-full border-collapse border border-black text-[8px]">
                <thead>
                  <tr><Th className="w-[15%]">Core Values</Th><Th className="w-[45%]">Behavior Statements</Th><Th colSpan={4}>QUARTER</Th></tr>
                  <tr><Th colSpan={2}></Th><Th>1</Th><Th>2</Th><Th>3</Th><Th>4</Th></tr>
                </thead>
                <tbody>
                  {coreValues.map((cv: any) => (
                    <React.Fragment key={cv.id}>
                      {(cv.behaviors || []).map((behavior: string, bIndex: number) => (
                        <tr key={behavior}>
                          {bIndex === 0 && <Td rowSpan={(cv.behaviors || []).length} className="font-bold align-top italic text-left">{cv.name}</Td>}
                          <Td className="text-left leading-tight">{behavior}</Td>
                          <Td>{studentCoreValues.get(cv.id)?.q1?.[behavior] ?? ''}</Td>
                          <Td>{studentCoreValues.get(cv.id)?.q2?.[behavior] ?? ''}</Td>
                          <Td>{studentCoreValues.get(cv.id)?.q3?.[behavior] ?? ''}</Td>
                          <Td>{studentCoreValues.get(cv.id)?.q4?.[behavior] ?? ''}</Td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              <div className="grid grid-cols-4 gap-1 mt-1 text-[7px]">
                <div><span className="font-bold">Marking</span></div>
                <div><span className="font-bold">Non-Numerical Rating</span></div>
                <div><span className="font-bold">Marking</span></div>
                <div><span className="font-bold">Non-Numerical Rating</span></div>
                <div>AO</div><div>Always Observed</div><div>RO</div><div>Rarely Observed</div>
                <div>SO</div><div>Sometimes Observed</div><div>NO</div><div>Not Observed</div>
              </div>
            </div>

            {/* ── RIGHT: Homeroom Guidance ── */}
            <div>
              <h2 className="text-center font-bold text-[10px] mb-1 uppercase bg-[#4472C4] text-white p-1">
                Homeroom Guidance Learner's Development Assessment
              </h2>

              {/* Legend */}
              <div className="text-[8px] mb-2 border border-black p-1">
                <p className="font-bold">LEGEND:</p>
                <div className="grid grid-cols-3 gap-x-2">
                  <div><span className="font-bold">4</span>-Developed and Commendable</div>
                  <div><span className="font-bold">2</span>- Developing</div>
                  <div><span className="font-bold">0</span>-No Chance to observe</div>
                  <div><span className="font-bold">3</span>-Sufficiently Developed</div>
                  <div><span className="font-bold">1</span>- Needs Improvement</div>
                </div>
              </div>

              <table className="w-full border-collapse border border-black text-[8px]">
                <thead>
                  <tr>
                    <Th className="text-left w-[65%]">COMPETENCY</Th>
                    <Th>4</Th><Th>3</Th><Th>2</Th><Th>1</Th><Th>0</Th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(HOMEROOM_COMPETENCIES).map(([quarter, competencies]) => {
                    // Map quarter label to ratings key
                    const qKey: Record<string, string> = { 'FIRST QUARTER': 'q1', 'SECOND QUARTER': 'q2', 'THIRD QUARTER': 'q3', 'FOURTH QUARTER': 'q4' };
                    const q = qKey[quarter] || '';
                    const ratings: Record<string, number> = studentHG
                      ? (studentHG[`${q}Ratings`] || studentHG[`${q}_ratings`] || {})
                      : {};

                    return (
                      <React.Fragment key={quarter}>
                        <tr>
                          <td colSpan={6} className="border border-black bg-[#4472C4] text-white font-bold p-1 text-[8px]">{quarter}</td>
                        </tr>
                        {competencies.map((comp) => {
                          const score = ratings[comp];
                          return (
                            <tr key={comp}>
                              <Td className="text-left leading-tight">{comp}</Td>
                              <Td>{score === 4 ? '/' : ''}</Td>
                              <Td>{score === 3 ? '/' : ''}</Td>
                              <Td>{score === 2 ? '/' : ''}</Td>
                              <Td>{score === 1 ? '/' : ''}</Td>
                              <Td>{score === 0 ? '/' : ''}</Td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Carlito:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        @page {
          size: letter landscape;
          margin: 0.5in;
        }
        .sf9-page-content, .sf9-page-content * {
          font-family: 'Calibri', 'Carlito', 'Segoe UI', Arial, sans-serif !important;
        }
        .pdf-export #sf9-print-content {
          padding: 0 !important;
          background: white !important;
        }
        .pdf-export #sf9-print-content .sf9-page-content {
          box-sizing: border-box !important;
          width: 11in !important;
          min-height: 8.5in !important;
          height: auto !important;
          overflow: visible !important;
          margin: 0 auto !important;
          padding: 0.45in !important;
          box-shadow: none !important;
          border: none !important;
          page-break-before: auto !important;
          page-break-after: auto !important;
          break-before: auto !important;
          break-after: auto !important;
        }
        .pdf-export #sf9-print-content .sf9-page-content + .sf9-page-content { margin-top: 0 !important; }
        .pdf-export #sf9-print-content .sf9-page-content { margin-bottom: 0 !important; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body * { visibility: hidden; }
          #sf9-print-content, #sf9-print-content * { visibility: visible; }
          #sf9-print-content { position: static !important; left: auto !important; top: auto !important; width: auto !important; background: transparent !important; margin: 0 !important; padding: 0 !important; }
          .sf9-page-content { box-sizing: border-box; width: calc(11in - 1in) !important; min-height: calc(8.5in - 1in) !important; margin: 0 auto !important; padding: 0.2in !important; border: none !important; box-shadow: none !important; page-break-inside: avoid; break-inside: avoid-page; break-after: page; page-break-after: always; }
          .sf9-page-content:last-child { break-after: auto; page-break-after: auto; }
          table { page-break-inside: auto; }
          thead { display: table-header-group; }
          tr, td, th { page-break-inside: avoid; break-inside: avoid; }
          html, body { height: auto !important; overflow: visible !important; }
          * { box-shadow: none !important; }
          p, td, th, div { overflow-wrap: anywhere; word-break: break-word; }
        }
      `}</style>
    </div>
  );
};

export default PrintableSF9Report;
