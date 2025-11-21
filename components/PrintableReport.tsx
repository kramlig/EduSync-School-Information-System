import React, { useMemo, useCallback } from 'react';
import DepEdLogo from './DepEdLogo';
// Deterministic PDF generation: render each page to canvas, then compose into jsPDF
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { Student, Grade, SubGradeRecord } from '../types';
import type { SchoolDataHook } from '../hooks/useSchoolData';
import { PrinterIcon } from './icons';

// Helper: Convert gradeLevel string to numeric value (for filtering)
const normalizeGradeLevel = (gradeLevel: string | number): number | null => {
  if (typeof gradeLevel === 'number') return gradeLevel;
  if (gradeLevel === 'Kindergarten') return 0;
  const match = gradeLevel.match(/Grade (\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

interface PrintableReportProps {
  student: Student;
  schoolData: SchoolDataHook;
  hideDownloadButton?: boolean;
  studentIndex?: number;
}

const calculateAge = (dateOfBirth?: string): number | string => {
  if (!dateOfBirth) return '';
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const calculateQuarterAverage = (grade: number | SubGradeRecord | undefined): number | string => {
  if (grade === undefined) return '';
  if (typeof grade === 'number') return grade;
  const subGrades = Object.values(grade).filter(g => typeof g === 'number');
  if (subGrades.length === 0) return '';
  const total = subGrades.reduce((acc, val) => acc + val, 0);
  return Math.round(total / subGrades.length);
};

const Td: React.FC<{ children?: React.ReactNode; className?: string, colSpan?: number, rowSpan?: number }> = ({ children, className, colSpan, rowSpan }) => (
  <td className={`border border-black p-1 text-center text-[9px] ${className ?? ''}`} colSpan={colSpan} rowSpan={rowSpan}>{children}</td>
);
const Th: React.FC<{ children?: React.ReactNode; className?: string, colSpan?: number, rowSpan?: number }> = ({ children, className, colSpan, rowSpan }) => (
  <th className={`border border-black p-1 text-center font-bold bg-gray-100 text-[9px] ${className ?? ''}`} colSpan={colSpan} rowSpan={rowSpan}>{children}</th>
);
const InfoField: React.FC<{ label: string; value: React.ReactNode, className?: string }> = ({ label, value, className }) => (
    <div className={`flex items-baseline ${className}`}>
        <span className="font-bold">{label}</span>
        <span className="flex-1 border-b border-black text-center font-semibold pb-1">{value}</span>
    </div>
);

// No runtime fallback needed since the asset is embedded; to change the logo, replace the file on disk.

// Export PDF generation function for use in StudentProfile
export const generateReportCardPDF = async (student: Student, schoolData: SchoolDataHook) => {
  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: 'letter'
    });
    
    // Capture page 1
    const page1Element = document.getElementById('page-1');
    if (!page1Element) throw new Error('Page 1 element not found');
    
    const canvas1 = await html2canvas(page1Element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    const imgData1 = canvas1.toDataURL('image/png');
    const imgWidth = 11;
    const imgHeight = (canvas1.height * imgWidth) / canvas1.width;
    
    pdf.addImage(imgData1, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Capture page 2
    const page2Element = document.getElementById('page-2');
    if (page2Element) {
      pdf.addPage();
      
      const canvas2 = await html2canvas(page2Element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData2 = canvas2.toDataURL('image/png');
      const imgHeight2 = (canvas2.height * imgWidth) / canvas2.width;
      
      pdf.addImage(imgData2, 'PNG', 0, 0, imgWidth, imgHeight2);
    }
    
    // Save PDF
    const schoolYear = schoolData.settings?.schoolYear || schoolData?.settings?.schoolYear || '2023-2024';
    const fileName = `Report-Card-${student.name.replace(/\s+/g, '-')}-${schoolYear}.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};

const PrintableReport: React.FC<PrintableReportProps> = ({ student, schoolData, hideDownloadButton = false, studentIndex = 0 }) => {
  const { grades, learningAreas, coreValues, coreValueGrades, attendanceRecords, monthlySchoolDaysConfig, teachers, sections } = schoolData;
  
  // CRITICAL FIX: Provide default settings for new schools that don't have settings configured yet
  const settings = schoolData.settings || {
    schoolName: 'School Name',
    region: 'Region',
    division: 'Division',
    district: 'District',
    schoolYear: '2023-2024'
  };
  
  const slug = (s: string) => s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
  
  const studentGrades = useMemo(() => {
    const gradeMap = new Map(grades.filter(g => g.studentId === student.id).map(g => [g.learningAreaId, g]));
    return gradeMap;
  }, [grades, student.id]);
  
  const studentCoreValues = useMemo(() => new Map(coreValueGrades.filter(g => g.studentId === student.id).map(g => [g.coreValueId, g])), [coreValueGrades, student.id]);
  const section = useMemo(() => sections.find(s => s.id === student.sectionId), [sections, student.sectionId]);
  const adviser = useMemo(() => teachers.find(t => t.id === section?.adviserId), [teachers, section]);
  const principal = useMemo(() => teachers.find(t => t.role === 'principal'), [teachers]);

  // Filter learning areas by student's grade level, or show only subjects where student has grades
  const studentLearningAreas = useMemo(() => {
    const gradeLevel = section?.gradeLevel;
    const numericGradeLevel = gradeLevel ? normalizeGradeLevel(gradeLevel) : null;
    
    // Get learning area IDs where student has grades
    const studentGradeIds = new Set(Array.from(studentGrades.keys()));
    
    // Filter by grade level if available, otherwise show all learning areas where student has grades
    const filtered = numericGradeLevel !== null
      ? learningAreas.filter(la => {
          // Handle both single grade level and array of grade levels
          if (Array.isArray(la.gradeLevel)) {
            return la.gradeLevel.includes(numericGradeLevel);
          }
          return la.gradeLevel === numericGradeLevel;
        })
      : learningAreas.filter(la => studentGradeIds.has(la.id));
    
    // If filtering by grade level returns empty, fall back to showing subjects with grades
    if (filtered.length === 0 && studentGradeIds.size > 0) {
      return learningAreas.filter(la => studentGradeIds.has(la.id));
    }
    
    return filtered;
  }, [learningAreas, section, studentGrades]);

  // Calculate final grade dynamically if not stored in database
  const getFinalGrade = useCallback((grade: Grade | undefined): number | undefined => {
    if (!grade) return undefined;
    
    // If stored finalGrade exists, use it
    if (grade.finalGrade !== undefined) return grade.finalGrade;
    
    // Otherwise calculate it on-the-fly from quarterly grades
    const quarters: ('q1' | 'q2' | 'q3' | 'q4')[] = ['q1', 'q2', 'q3', 'q4'];
    const values: number[] = [];
    
    for (const q of quarters) {
      const v = grade[q];
      if (typeof v === 'number') {
        values.push(v);
      } else if (v && typeof v === 'object') {
        // Handle composite subjects (e.g., MAPEH with sub-subjects)
        const nums = Object.values(v as Record<string, any>).filter(n => typeof n === 'number') as number[];
        if (nums.length) {
          values.push(Math.round(nums.reduce((a, b) => a + b, 0) / nums.length));
        }
      }
    }
    
    if (!values.length) return undefined;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, []);

  // Calculate remarks based on final grade
  const getRemarks = useCallback((finalGrade: number | undefined): 'Passed' | 'Failed' | undefined => {
    if (finalGrade === undefined) return undefined;
    return finalGrade >= 75 ? 'Passed' : 'Failed';
  }, []);

  const generalAverage = useMemo(() => {
    const finalGrades = Array.from(studentGrades.values()).map((g: Grade) => getFinalGrade(g)).filter((g): g is number => typeof g === 'number');
    if (finalGrades.length === 0) return null;
    const total = finalGrades.reduce((sum: number, grade: number) => sum + grade, 0);
    return (total / finalGrades.length).toFixed(2);
  }, [studentGrades, getFinalGrade]);

  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
  
  const monthlyAttendanceSummary = useMemo(() => {
    // FIX: Ensure a consistently typed object is returned to avoid `unknown` type inference downstream.
    const summary: Record<string, { present: number, absent: number }> = {};
    
    console.log(`[PrintableReport] Total attendance records:`, attendanceRecords.length);
    console.log(`[PrintableReport] Student ID:`, student.id);
    
    // Get individual attendance records for this student
    const studentAttendanceRecords = attendanceRecords.filter(r => r.studentId === student.id);
    
    console.log(`[PrintableReport] Student attendance records:`, studentAttendanceRecords.length);
    if (studentAttendanceRecords.length > 0) {
      console.log(`[PrintableReport] Sample record:`, studentAttendanceRecords[0]);
    }
    
    if (studentAttendanceRecords.length === 0) {
        return summary;
    }
    
  // const monthIndexMap: Record<string, number> = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };

    for (const record of studentAttendanceRecords) {
        const recordData = record as any;
        if (!recordData.date || !recordData.status) continue;
        
        const date = new Date(recordData.date + "T00:00:00");
        const monthAbbr = date.toLocaleString('default', { month: 'short' });
        
        if (!summary[monthAbbr]) {
            summary[monthAbbr] = { present: 0, absent: 0 };
        }
        
        const status = recordData.status?.toLowerCase(); // Handle both 'Present' and 'present'
        if (status === 'present' || status === 'late') {
            summary[monthAbbr].present++;
        } else if (status === 'absent' || status === 'excused') {
            summary[monthAbbr].absent++;
        }
    }
    
    return summary;
  }, [attendanceRecords, student.id]);

  return (
    <div className="text-black bg-white font-serif">
      {!hideDownloadButton && (
        <div className="flex justify-end items-center gap-3 mb-4 print:hidden">
          <button
            onClick={async () => {
            // Robust selection: prefer explicit IDs, fall back to first two .page-content blocks
            let page1 = document.getElementById('page-1') as HTMLElement | null;
            let page2 = document.getElementById('page-2') as HTMLElement | null;
            if (!page1 || !page2) {
              const blocks = Array.from(document.querySelectorAll('#print-content .page-content')) as HTMLElement[];
              if (!page1) page1 = blocks[0] ?? null;
              if (!page2) page2 = blocks[1] ?? null;
            }
            if (!page1 || !page2) {
              console.error('PDF export error: could not find two page blocks.');
              return;
            }
            document.body.classList.add('pdf-export');
            try {
              const cnvOpts = {
                scale: 2,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                scrollY: 0,
              } as const;
              const [c1, c2] = await Promise.all([
                html2canvas(page1, cnvOpts),
                html2canvas(page2, cnvOpts),
              ]);
              const img1 = c1.toDataURL('image/jpeg', 0.98);
              const img2 = c2.toDataURL('image/jpeg', 0.98);
              const pdf = new jsPDF({ unit: 'in', format: 'letter', orientation: 'landscape' });
              pdf.addImage(img1, 'JPEG', 0, 0, 11, 8.5);
              pdf.addPage('letter', 'landscape');
              pdf.addImage(img2, 'JPEG', 0, 0, 11, 8.5);
              const filename = `Form138_${slug(student.name)}_${slug(String(settings.schoolYear))}.pdf`;
              pdf.save(filename);
            } finally {
              document.body.classList.remove('pdf-export');
            }
          }}
          className="group flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          <div className="transition-transform group-hover:rotate-12">
            <PrinterIcon />
          </div>
          <span className="text-sm tracking-wide">Download PDF Report</span>
          <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
      )}

      <div id="print-content" className="p-4 bg-gray-200 text-[10px]">
        {/* PAGE 1: Front Page */}
  <div id={`page-1-${student.id}`} className="page-content bg-white shadow-lg p-8 mb-8 mx-auto" style={{width: '11in', minHeight: '8.5in', pageBreakAfter: 'always', breakAfter: 'page'}}>
          <div className="grid grid-cols-12 gap-4">
            {/* Left Column */}
            <div className="col-span-6">
              <h3 className="font-bold text-center mb-1 text-xs">REPORT ON ATTENDANCE</h3>
              <table className="w-full border-collapse border border-black text-[9px] mb-8">
                  <thead>
                      <tr>
                          <Th className="w-[20%]"></Th>
                          {months.map(m => <Th key={m}>{m}</Th>)}
                          <Th>Total</Th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr>
                          <Td className="text-left font-bold h-6">No. of school days</Td>
                          {months.map(m => <Td key={m}>{monthlySchoolDaysConfig[m] ?? ''}</Td>)}
                          <Td>{Object.values(monthlySchoolDaysConfig).reduce((a: number, b: number) => a + b, 0)}</Td>
                      </tr>
                      <tr>
                          <Td className="text-left font-bold h-6">No. of days present</Td>
                          {months.map(m => <Td key={m}>{monthlyAttendanceSummary[m]?.present ?? ''}</Td>)}
                           <Td>{Object.values(monthlyAttendanceSummary).reduce((sum, m) => sum + (m.present || 0), 0)}</Td>
                      </tr>
                      <tr>
                          <Td className="text-left font-bold h-6">No. of days absent</Td>
                          {months.map(m => <Td key={m}>{monthlyAttendanceSummary[m]?.absent ?? ''}</Td>)}
                           <Td>{Object.values(monthlyAttendanceSummary).reduce((sum, m) => sum + (m.absent || 0), 0)}</Td>
                      </tr>
                  </tbody>
              </table>
              
              <h3 className="font-bold text-center mb-1 text-xs mt-12">PARENTS / GUARDIAN'S SIGNATURE</h3>
              <div className="mt-8 space-y-10 p-2">
                  <div className="flex items-baseline"><span className="w-24">1st Quarter</span><div className="flex-1 border-b border-black pb-1"></div></div>
                  <div className="flex items-baseline"><span className="w-24">2nd Quarter</span><div className="flex-1 border-b border-black pb-1"></div></div>
                  <div className="flex items-baseline"><span className="w-24">3rd Quarter</span><div className="flex-1 border-b border-black pb-1"></div></div>
                  <div className="flex items-baseline"><span className="w-24">4th Quarter</span><div className="flex-1 border-b border-black pb-1"></div></div>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-span-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="text-left text-xs w-1/4">DepEd FORM 138</div>
                    <div className="text-center text-[10px] w-1/2">
                        <p>Republic of the Philippines</p>
                        <p>Department of Education</p>
                        <p>{settings.region}</p>
                        <p>{settings.division}</p>
                        <p>{settings.district}</p>
                        <p className="font-bold text-xs mt-1">{settings.schoolName}</p>
                    </div>
                    <div className="w-1/4 flex justify-center">
                        <DepEdLogo className="w-24 h-24" />
                    </div>
                </div>
                <div className="space-y-2 text-[10px] mb-4">
                    <InfoField label="Name:" value={student.name} />
                    <div className="grid grid-cols-2 gap-4">
                        <InfoField label="Age:" value={calculateAge(student.dateOfBirth)} />
                        <InfoField label="Sex:" value={student.sex} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <InfoField label="Grade:" value={section?.gradeLevel} />
                        <InfoField label="Section:" value={section?.name} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <InfoField label="School Year:" value={settings.schoolYear} />
                        <InfoField label="LRN:" value={student.lrn} />
                    </div>
                </div>
                <div className="text-[10px] space-y-2">
                    <p className="font-bold">Dear Parent:</p>
                    <p className="text-justify indent-4">This report card shows the ability and progress your child has made in the different learning areas as well as his/her core values. The school welcomes you should you desire to know more about your child's progress.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8 text-[10px]">
                    <div className="text-center"><div className="border-b border-black w-4/5 mx-auto font-bold pb-1">{principal?.name ?? ''}</div><p>Principal</p></div>
                    <div className="text-center"><div className="border-b border-black w-4/5 mx-auto font-bold pb-1">{adviser?.name}</div><p>Teacher</p></div>
                </div>

                <div className="mt-8 text-[10px]">
                    <h3 className="font-bold text-center">Certificate of Transfer</h3>
                     <div className="mt-2 space-y-1">
                        <div className="flex items-baseline"><span className="w-28">Admitted to Grade:</span><span className="flex-1 border-b border-black pb-1"></span><span className="w-16 ml-2">Section:</span><span className="flex-1 border-b border-black pb-1"></span></div>
                        <div className="flex items-baseline mt-2"><span className="w-44">Eligible for Admission to Grade:</span><span className="flex-1 border-b border-black pb-1"></span></div>
                        <div className="flex items-baseline mt-2"><span className="w-16">Approved:</span><span className="flex-1 border-b border-black pb-1"></span></div>
                    </div>
                     <div className="grid grid-cols-2 gap-4 mt-12">
                       <div className="text-center"><div className="border-b border-black w-4/5 mx-auto pb-1"></div><p>Principal</p></div>
                       <div className="text-center"><div className="border-b border-black w-4/5 mx-auto pb-1"></div><p>Teacher</p></div>
                    </div>
                </div>
                 <div className="mt-8 text-[10px]">
                    <h3 className="font-bold text-center">Cancellation of Eligibility to Transfer</h3>
                     <div className="mt-2 space-y-1">
                        <div className="flex items-baseline"><span className="w-20">Admitted in:</span><span className="flex-1 border-b border-black pb-1"></span></div>
                        <div className="flex items-baseline mt-4"><span className="w-10">Date:</span><span className="flex-1 border-b border-black mr-20 pb-1"></span><span className="flex-1 border-b border-black pb-1"></span></div>
                        <div className="flex items-baseline"><span className="w-10"></span><span className="flex-1 mr-20"></span><span className="flex-1 text-center">Principal</span></div>

                    </div>
                </div>
            </div>
          </div>
        </div>
        
        {/* PAGE BREAK - Forces new page in print */}
        <div style={{ pageBreakAfter: 'always', breakAfter: 'page', height: '0', display: 'block' }} className="print:block hidden" aria-hidden="true"></div>
        
        {/* PAGE 2: Back Page */}
  <div id={`page-2-${student.id}`} className="page-content bg-white shadow-lg p-8 mx-auto" style={{width: '11in', minHeight: '8.5in', pageBreakBefore: 'always', breakBefore: 'page'}}>
            <div className="grid grid-cols-2 gap-8">
                <div>
                    <h2 className="text-center font-bold text-xs mb-1">REPORT ON LEARNING PROGRESS ACHIEVEMENT</h2>
                    <table className="w-full border-collapse border border-black text-[9px]">
                        <thead>
                            <tr><Th rowSpan={2} className="w-1/3">Learning Areas</Th><Th colSpan={4}>Quarter</Th><Th rowSpan={2}>Final Grade</Th><Th rowSpan={2}>Remarks</Th></tr>
                            <tr><Th>1</Th><Th>2</Th><Th>3</Th><Th>4</Th></tr>
                        </thead>
                        <tbody>
                            {studentLearningAreas.map(la => {
                                const grade = studentGrades.get(la.id);
                                const finalGrade = getFinalGrade(grade);
                                const remarks = grade?.remarks || getRemarks(finalGrade);
                                return (<React.Fragment key={la.id}>
                                        <tr>
                                            <Td className="text-left font-bold">{la.name}</Td>
                                            <Td>{calculateQuarterAverage(grade?.q1)}</Td><Td>{calculateQuarterAverage(grade?.q2)}</Td><Td>{calculateQuarterAverage(grade?.q3)}</Td><Td>{calculateQuarterAverage(grade?.q4)}</Td>
                                            <Td className="font-bold">{finalGrade ?? ''}</Td><Td className="font-bold">{remarks ?? ''}</Td>
                                        </tr>
                                        {la.isComposite && la.subSubjects?.map(sub => (
                                            <tr key={sub}>
                                                <Td className="text-left pl-4 italic">{sub}</Td>
                                                <Td>{(grade?.q1 as SubGradeRecord)?.[sub] ?? ''}</Td><Td>{(grade?.q2 as SubGradeRecord)?.[sub] ?? ''}</Td><Td>{(grade?.q3 as SubGradeRecord)?.[sub] ?? ''}</Td><Td>{(grade?.q4 as SubGradeRecord)?.[sub] ?? ''}</Td>
                                                <Td>{''}</Td><Td>{''}</Td>
                                            </tr>
                                        ))}
                                </React.Fragment>)})}
                             <tr><Td colSpan={5} className="text-right font-bold pr-4">General Average</Td><Td className="font-bold">{generalAverage}</Td><Td className="font-bold">{generalAverage !== null && (parseFloat(generalAverage) >= 75 ? 'Passed' : 'Failed')}</Td></tr>
                        </tbody>
                    </table>
                     <div className="grid grid-cols-3 gap-2 mt-4 text-[9px]">
                        <div><div className="font-bold">Descriptors</div><div>Outstanding</div><div>Very Satisfactory</div><div>Satisfactory</div><div>Fairly Satisfactory</div><div>Did Not Meet Expectations</div></div>
                        <div><div className="font-bold">Grading Scale</div><div>90-100</div><div>85-89</div><div>80-84</div><div>75-79</div><div>Below 75</div></div>
                        <div><div className="font-bold">Remarks</div><div>Passed</div><div>Passed</div><div>Passed</div><div>Passed</div><div>Failed</div></div>
                    </div>
                </div>
                <div>
                    <h2 className="text-center font-bold text-xs mb-1">REPORT ON LEARNER'S OBSERVED VALUES</h2>
                     <table className="w-full border-collapse border border-black text-[9px]">
                         <thead>
                            <tr><Th className="w-1/5">Core Values</Th><Th className="w-2/5">Behavior Statements</Th><Th colSpan={4}>Quarter</Th></tr>
                             <tr><Th colSpan={2}>{''}</Th><Th>1</Th><Th>2</Th><Th>3</Th><Th>4</Th></tr>
                         </thead>
                         <tbody>
                            {coreValues.map((cv, index) => (
                               <React.Fragment key={cv.id}>
                                {(cv.behaviors || []).map((behavior, bIndex) => (
                                    <tr key={behavior}>
                                        {bIndex === 0 && <Td rowSpan={(cv.behaviors || []).length} className="font-bold align-top">{index + 1}. {cv.name}</Td>}
                                        <Td className="text-left leading-tight">{behavior}</Td>
                                        <Td>{studentCoreValues.get(cv.id)?.q1?.[behavior] ?? ''}</Td><Td>{studentCoreValues.get(cv.id)?.q2?.[behavior] ?? ''}</Td><Td>{studentCoreValues.get(cv.id)?.q3?.[behavior] ?? ''}</Td><Td>{studentCoreValues.get(cv.id)?.q4?.[behavior] ?? ''}</Td>
                                    </tr>
                                ))}
                               </React.Fragment>
                            ))}
                         </tbody>
                     </table>
                     <div className="grid grid-cols-2 gap-2 mt-4 text-[9px]">
                         <div><div className="font-bold">Marking</div><div>AO</div><div>SO</div><div>RO</div><div>NO</div></div>
                         <div><div className="font-bold">Non-numerical Rating</div><div>Always Observed</div><div>Sometimes Observed</div><div>Rarely Observed</div><div>Not Observed</div></div>
                     </div>
                </div>
            </div>
        </div>
      </div>
      <style>{`
        @page {
          size: letter landscape;
          margin: 0.5in;
        }
        /* PDF export normalization: ensures exactly two pages without blanks */
        .pdf-export #print-content {
          padding: 0 !important;
          background: white !important;
        }
        .pdf-export #print-content .page-content {
          /* Fit the full Letter landscape page (we add internal padding for margins) */
          box-sizing: border-box !important;
          width: 11in !important;
          height: calc(8.5in - 0.06in) !important; /* compact default to avoid rounding overflow */
          margin: 0 auto !important;
          /* emulate 0.5in external margins via internal padding */
          padding: 0.45in !important; /* compact default */
          box-shadow: none !important;
          border: none !important;
          page-break-before: auto !important;
          page-break-after: auto !important;
          break-before: auto !important;
          break-after: auto !important;
        }
        .pdf-export #print-content .page-content + .page-content {
          /* remove inter-page spacing that could create blank pages */
          margin-top: 0 !important;
        }
        .pdf-export #print-content .page-content { margin-bottom: 0 !important; }
        .pdf-export #print-content .print-break {
          /* marker only; no visual gap */
          height: 0 !important;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Hide everything but print-content */
          body * {
            visibility: hidden;
          }
          #print-content, #print-content * {
            visibility: visible;
          }
          /* Keep natural document flow for proper pagination */
          #print-content {
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: auto !important;
            background: transparent !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Page container: respect page margins; avoid clipping */
          .page-content {
            /* Fit inside printable area for Letter landscape (11in x 8.5in) minus margins */
            box-sizing: border-box;
            width: calc(11in - 1in) !important;
            min-height: calc(8.5in - 1in) !important;
            margin: 0 auto !important;
            padding: 0.2in !important;
            border: none !important;
            box-shadow: none !important;
            page-break-inside: avoid;
            break-inside: avoid-page;
            /* Force a page break after each page block, then cancel on last */
            break-after: page;
            page-break-after: always;
          }
          /* Force a new physical page where requested */
          .print-break {
            break-before: page;
            page-break-before: always;
          }
          .page-content:last-child { break-after: auto; page-break-after: auto; }
          /* Better table pagination */
          table { page-break-inside: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          tr, td, th { page-break-inside: avoid; break-inside: avoid; }
          /* Remove any potential clipping */
          html, body { height: auto !important; overflow: visible !important; }
          * { box-shadow: none !important; }
          /* Improve long text wrapping in print */
          p, td, th, div { overflow-wrap: anywhere; word-break: break-word; }
        }
      `}</style>
    </div>
  );
};

export default PrintableReport;
