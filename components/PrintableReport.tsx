import React, { useMemo } from 'react';
import type { Student, Grade, SubGradeRecord, CoreValueGrade, AttendanceRecord, Section } from '../types';
import type { SchoolDataHook } from '../hooks/useSchoolData';
import { PrinterIcon } from './icons';

interface PrintableReportProps {
  student: Student;
  schoolData: SchoolDataHook;
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
  <td className={`border border-black p-1 text-center text-xs ${className ?? ''}`} colSpan={colSpan} rowSpan={rowSpan}>{children}</td>
);
const Th: React.FC<{ children?: React.ReactNode; className?: string, colSpan?: number, rowSpan?: number }> = ({ children, className, colSpan, rowSpan }) => (
  <td className={`border border-black p-1 text-center font-bold bg-gray-100 text-xs ${className ?? ''}`} colSpan={colSpan} rowSpan={rowSpan}>{children}</td>
);

const PrintableReport: React.FC<PrintableReportProps> = ({ student, schoolData }) => {
  const { grades, learningAreas, coreValues, coreValueGrades, attendanceRecords, monthlySchoolDaysConfig, teachers, sections } = schoolData;
  
  const studentGrades = useMemo(() => new Map(grades.filter(g => g.studentId === student.id).map(g => [g.learningAreaId, g])), [grades, student.id]);
  const studentCoreValues = useMemo(() => new Map(coreValueGrades.filter(g => g.studentId === student.id).map(g => [g.coreValueId, g])), [coreValueGrades, student.id]);
  const studentAttendance = useMemo(() => attendanceRecords.find(r => r.studentId === student.id), [attendanceRecords, student.id]);
  const section = useMemo(() => sections.find(s => s.id === student.sectionId), [sections, student.sectionId]);
  const adviser = useMemo(() => teachers.find(t => t.id === section?.adviserId), [teachers, section]);

  const generalAverage = useMemo(() => {
    const finalGrades = Array.from(studentGrades.values()).map(g => g.finalGrade).filter((g): g is number => typeof g === 'number');
    if (finalGrades.length === 0) return null;
    const total = finalGrades.reduce((sum, grade) => sum + grade, 0);
    return (total / finalGrades.length).toFixed(2);
  }, [studentGrades]);

  const months = Object.keys(monthlySchoolDaysConfig);
  const depedLogoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAgAElEQVR4nOy9d7AlV33ff8+5t6/X9Tru+2466UwnTp06jRyJg01cYiCSgEACSRgCJIQQgiBIkEAEEiABEiCB+IQQQoLEJEiQIMlExE1iYhMncWLHdJ3OdDrd7/v+et+fe8/5/lFVVXV1dXf1VF3X9T5ePHp1dXVVvec8z9n/2v7b//Nf/wP2vCCAAAIggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCAgn/nz5w8EEEAAAQTkK86dOzdAAAEEEEAABIAACCCAAIIAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAAC-i-y5uCqGAAAAABJRU5ErkJggg==";
return (
    <div className="text-black bg-white font-serif">
      <div className="flex justify-end mb-4 print:hidden">
        <button onClick={() => window.print()} className="flex items-center bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"><PrinterIcon /><span className="ml-2">Print</span></button>
      </div>

      <div id="print-content" className="p-4 bg-white text-[10px]">
        {/* PAGE 1: Front Page */}
        <div className="page">
           <div className="text-center font-bold mb-2">PRINTABLE (Front Page)</div>
           <div className="grid grid-cols-2 gap-4">
             {/* Left side */}
             <div className="text-xs">
                <h3 className="font-bold text-center mb-1">REPORT ON ATTENDANCE</h3>
                <table className="w-full border-collapse border border-black">
                  <thead>
                    <tr>
                        <Th className="w-1/4"></Th>
                        {months.map(m => <Th key={m}>{m}</Th>)}
                        <Th>Total</Th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                        <Td className="text-left font-bold">No. of school days</Td>
                        {months.map(m => <Td key={m}>{monthlySchoolDaysConfig[m]}</Td>)}
                        <Td>{Object.values(monthlySchoolDaysConfig).reduce((a,b) => a+b, 0)}</Td>
                    </tr>
                    <tr>
                        <Td className="text-left font-bold">No. of days present</Td>
                        {months.map(m => <Td key={m}>{studentAttendance?.monthlyData[m]?.present ?? ''}</Td>)}
                        <Td>{Object.values(studentAttendance?.monthlyData ?? {}).reduce((sum, m) => sum + (m.present || 0), 0)}</Td>
                    </tr>
                    <tr>
                        <Td className="text-left font-bold">No. of days absent</Td>
                        {months.map(m => <Td key={m}>{studentAttendance?.monthlyData[m]?.absent ?? ''}</Td>)}
                        <Td>{Object.values(studentAttendance?.monthlyData ?? {}).reduce((sum, m) => sum + (m.absent || 0), 0)}</Td>
                    </tr>
                  </tbody>
                </table>
                <div className="mt-8">
                    <h3 className="font-bold text-center">PARENTS / GUARDIAN'S SIGNATURE</h3>
                    <div className="mt-4 space-y-4">
                        <div className="flex items-end"><span className="w-24">1st Quarter</span><div className="flex-1 border-b border-black"></div></div>
                        <div className="flex items-end"><span className="w-24">2nd Quarter</span><div className="flex-1 border-b border-black"></div></div>
                        <div className="flex items-end"><span className="w-24">3rd Quarter</span><div className="flex-1 border-b border-black"></div></div>
                        <div className="flex items-end"><span className="w-24">4th Quarter</span><div className="flex-1 border-b border-black"></div></div>
                    </div>
                </div>
             </div>
             {/* Right side */}
             <div className="text-xs">
                 <div className="flex justify-between items-start">
                    <div className="text-center">
                        <p className="font-bold">DepEd FORM 138</p>
                        <p>Republic of the Philippines</p>
                        <p>Department of Education</p>
                        <p>Region XI</p>
                        <p>Division of the City of Mati</p>
                        <p>Governor Generoso North District</p>
                        <p className="font-bold text-sm mt-1">ENRIQUE URENCIA ELEMENTARY SCHOOL</p>
                    </div>
                    <div className="w-20 h-20 flex items-center justify-center">
                        <img src={depedLogoBase64} alt="DepEd Logo" className="w-20 h-20 object-contain" />
                    </div>
                 </div>
                <div className="mt-4 space-y-1">
                  <div className="flex"><span className="w-16">Name:</span> <span className="flex-1 border-b border-black">{student.name}</span></div>
                  <div className="grid grid-cols-2">
                    <div className="flex"><span className="w-16">Age:</span> <span className="flex-1 border-b border-black">{calculateAge(student.dateOfBirth)}</span></div>
                    <div className="flex"><span className="w-16">Sex:</span> <span className="flex-1 border-b border-black">{student.sex}</span></div>
                  </div>
                  <div className="grid grid-cols-2">
                    <div className="flex"><span className="w-16">Grade:</span> <span className="flex-1 border-b border-black">{section?.gradeLevel}</span></div>
                    <div className="flex"><span className="w-16">Section:</span> <span className="flex-1 border-b border-black">{section?.name}</span></div>
                  </div>
                  <div className="grid grid-cols-2">
                    <div className="flex"><span className="w-16">SchoolYear:</span> <span className="flex-1 border-b border-black">{student.schoolYear}</span></div>
                    <div className="flex"><span className="w-16">LRN:</span> <span className="flex-1 border-b border-black">{student.lrn}</span></div>
                  </div>
                </div>
                <div className="mt-4 border border-black p-2">
                    <p className="font-bold">Dear Parent:</p>
                    <p className="text-justify indent-4">This report card shows the ability and progress your child has made in the different learning areas as well as his/her core values. The school welcomes you should you desire to know more about your child's progress.</p>
                    <div className="grid grid-cols-2 gap-4 mt-8">
                       <div className="text-center"><div className="border-b border-black w-4/5 mx-auto"></div><p>Principal</p></div>
                       <div className="text-center"><div className="border-b border-black w-4/5 mx-auto font-bold text-[11px] pt-1">{adviser?.name}</div><p>Teacher</p></div>
                    </div>
                </div>
                <div className="mt-4 border border-black p-2">
                    <h3 className="font-bold text-center">Certificate of Transfer</h3>
                    <div className="mt-2 space-y-1">
                        <div className="flex"><span className="w-24">Admitted to Grade:</span><span className="flex-1 border-b border-black"></span><span className="w-12 ml-2">Section:</span><span className="flex-1 border-b border-black"></span></div>
                        <div className="flex"><span className="w-36">Eligible for Admission to Grade:</span><span className="flex-1 border-b border-black"></span></div>
                        <div className="flex"><span className="w-12">Approved:</span><span className="flex-1 border-b border-black"></span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8">
                       <div className="text-center"><div className="border-b border-black w-4/5 mx-auto"></div><p>Principal</p></div>
                       <div className="text-center"><div className="border-b border-black w-4/5 mx-auto"></div><p>Teacher</p></div>
                    </div>
                    <h3 className="font-bold text-center mt-4">Cancellation of Eligibility to Transfer</h3>
                    <div className="mt-2 space-y-1">
                        <div className="flex"><span className="w-20">Admitted in:</span><span className="flex-1 border-b border-black"></span></div>
                        <div className="flex"><span className="w-20">Date:</span><span className="flex-1 border-b border-black"></span><span className="w-12 ml-2"></span><span className="flex-1 border-b border-black"></span></div>
                    </div>
                     <div className="text-center mt-8"><div className="border-b border-black w-2/5 mx-auto"></div><p>Principal</p></div>
                </div>
             </div>
           </div>
        </div>

        {/* PAGE 2: Back Page */}
        <div className="page">
           <div className="text-center font-bold mb-2 text-sm">PRINTABLE (Back Page)</div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h2 className="text-center font-bold text-sm mb-1">REPORT ON LEARNING PROGRESS ACHIEVEMENT</h2>
                    <table className="w-full border-collapse border border-black">
                        <thead>
                            <tr><Th rowSpan={2} className="w-1/3">Learning Areas</Th><Th colSpan={4}>Quarter</Th><Th rowSpan={2}>Final Grade</Th><Th rowSpan={2}>Remarks</Th></tr>
                            <tr><Th>1</Th><Th>2</Th><Th>3</Th><Th>4</Th></tr>
                        </thead>
                        <tbody>
                            {learningAreas.map(la => {
                                const grade = studentGrades.get(la.id);
                                return (<React.Fragment key={la.id}>
                                        <tr>
                                            <Td className="text-left font-bold">{la.name}</Td>
                                            <Td>{calculateQuarterAverage(grade?.q1)}</Td><Td>{calculateQuarterAverage(grade?.q2)}</Td><Td>{calculateQuarterAverage(grade?.q3)}</Td><Td>{calculateQuarterAverage(grade?.q4)}</Td>
                                            <Td className="font-bold">{grade?.finalGrade ?? ''}</Td><Td className="font-bold">{grade?.remarks ?? ''}</Td>
                                        </tr>
                                        {la.isComposite && la.subSubjects?.map(sub => (
                                            <tr key={sub}>
                                                <Td className="text-left pl-4 italic">{sub}</Td>
                                                <Td>{(grade?.q1 as SubGradeRecord)?.[sub] ?? ''}</Td><Td>{(grade?.q2 as SubGradeRecord)?.[sub] ?? ''}</Td><Td>{(grade?.q3 as SubGradeRecord)?.[sub] ?? ''}</Td><Td>{(grade?.q4 as SubGradeRecord)?.[sub] ?? ''}</Td>
                                                <Td></Td><Td></Td>
                                            </tr>
                                        ))}
                                </React.Fragment>)})}
                             <tr><Td colSpan={5} className="text-right font-bold pr-4">General Average</Td><Td className="font-bold">{generalAverage}</Td><Td className="font-bold">{generalAverage !== null && (parseFloat(generalAverage) >= 75 ? 'Passed' : 'Failed')}</Td></tr>
                        </tbody>
                    </table>
                     <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                        <div><div className="font-bold">Descriptors</div><div>Outstanding</div><div>Very Satisfactory</div><div>Satisfactory</div><div>Fairly Satisfactory</div><div>Did Not Meet Expectations</div></div>
                        <div><div className="font-bold">Grading Scale</div><div>90-100</div><div>85-89</div><div>80-84</div><div>75-79</div><div>Below 75</div></div>
                        <div><div className="font-bold">Remarks</div><div>Passed</div><div>Passed</div><div>Passed</div><div>Passed</div><div>Failed</div></div>
                    </div>
                </div>
                <div>
                    <h2 className="text-center font-bold text-sm mb-1">REPORT ON LEARNER'S OBSERVED VALUES</h2>
                     <table className="w-full border-collapse border border-black">
                         <thead>
                            <tr><Th className="w-1/5">Core Values</Th><Th className="w-2/5">Behavior Statements</Th><Th colSpan={4}>Quarter</Th></tr>
                             <tr><Th colSpan={2}></Th><Th>1</Th><Th>2</Th><Th>3</Th><Th>4</Th></tr>
                         </thead>
                         <tbody>
                            {coreValues.map((cv, index) => (
                               <React.Fragment key={cv.id}>
                                {cv.behaviors.map((behavior, bIndex) => (
                                    <tr key={behavior}>
                                        {bIndex === 0 && <Td rowSpan={cv.behaviors.length} className="font-bold align-top">{index + 1}. {cv.name}</Td>}
                                        <Td className="text-left">{behavior}</Td>
                                        <Td>{studentCoreValues.get(cv.id)?.q1?.[behavior] ?? ''}</Td><Td>{studentCoreValues.get(cv.id)?.q2?.[behavior] ?? ''}</Td><Td>{studentCoreValues.get(cv.id)?.q3?.[behavior] ?? ''}</Td><Td>{studentCoreValues.get(cv.id)?.q4?.[behavior] ?? ''}</Td>
                                    </tr>
                                ))}
                               </React.Fragment>
                            ))}
                         </tbody>
                     </table>
                     <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                         <div><div className="font-bold">Marking</div><div>AO</div><div>SO</div><div>RO</div><div>NO</div></div>
                         <div><div className="font-bold">Non-numerical Rating</div><div>Always Observed</div><div>Sometimes Observed</div><div>Rarely Observed</div><div>Not Observed</div></div>
                     </div>
                </div>
            </div>
        </div>
      </div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-content, #print-content * { visibility: visible; }
          #print-content { position: absolute; left: 0; top: 0; width: 100%; }
          .page { page-break-after: always; }
          .page:last-child { page-break-after: auto; }
        }
      `}</style>
    </div>
  );
};

export default PrintableReport;