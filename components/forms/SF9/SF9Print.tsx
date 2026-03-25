/**
 * SF9Print.tsx
 * SF9 Report Card Print/PDF Component
 * Handles bulk printing of multiple students or single student SF9 report cards
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStudentsPostgreSQL } from '../../../src/hooks/useStudentsPostgreSQL';
import { useGradesPostgreSQL } from '../../../src/hooks/useGradesPostgreSQL';
import { useSectionsPostgreSQL } from '../../../src/hooks/useSectionsPostgreSQL';
import { useCoreValuesPostgreSQL } from '../../../src/hooks/useCoreValuesPostgreSQL';
import { useAttendancePostgreSQL } from '../../../src/hooks/useAttendancePostgreSQL';
import { useLearningAreasPostgreSQL } from '../../../src/hooks/useLearningAreasPostgreSQL';
import { useTeachersPostgreSQL } from '../../../src/hooks/useTeachersPostgreSQL';
import { useHomeroomGuidancePostgreSQL } from '../../../src/hooks/useHomeroomGuidancePostgreSQL';
import { useSchoolContext } from '../../../src/contexts/SchoolContext';
import { supabase } from '../../../src/lib/supabase';
import PrintableSF9Report from './PrintableSF9Report';

const SF9Print: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { schoolId } = useSchoolContext();
  const sid = schoolId ?? undefined;

  const { students, loading: studentsLoading } = useStudentsPostgreSQL({ schoolId: sid });
  const { grades, loading: gradesLoading } = useGradesPostgreSQL({ schoolId: sid });
  const { sections, loading: sectionsLoading } = useSectionsPostgreSQL({ schoolId: sid });
  const { learningAreas, loading: learningAreasLoading } = useLearningAreasPostgreSQL();
  const { coreValues, coreValueGrades, loading: coreValuesLoading } = useCoreValuesPostgreSQL(true, sid);
  const { attendanceRecords, loading: attendanceLoading } = useAttendancePostgreSQL({ schoolId: sid || '' });
  const { teachers, loading: teachersLoading } = useTeachersPostgreSQL({ schoolId: sid });
  const { grades: homeroomGuidanceGrades, loading: hgLoading } = useHomeroomGuidancePostgreSQL(true, sid);

  const [settings, setSettings] = useState<any>({ schoolYear: '2025-2026' });
  const [settingsLoading, setSettingsLoading] = useState(true);

  const loading = studentsLoading || gradesLoading || sectionsLoading || learningAreasLoading || coreValuesLoading || attendanceLoading || teachersLoading || hgLoading || settingsLoading;

  const schoolData = useMemo(() => ({
    students,
    grades,
    sections,
    teachers,
    settings,
    learningAreas,
    coreValues,
    coreValueGrades,
    attendanceRecords,
    homeroomGuidanceGrades,
    monthlySchoolDaysConfig: {
      Jan: 22, Feb: 20, Mar: 22, Apr: 10, May: 0, Jun: 10,
      Jul: 22, Aug: 22, Sep: 21, Oct: 22, Nov: 21, Dec: 10
    } as Record<string, number>,
  }), [students, grades, sections, teachers, settings, learningAreas, coreValues, coreValueGrades, attendanceRecords, homeroomGuidanceGrades]);

  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Fetch school settings
  useEffect(() => {
    const fetchSettings = async () => {
      setSettingsLoading(true);
      try {
        if (schoolId !== 'default') {
          const { data, error } = await supabase.from('schools').select('*').eq('id', schoolId).single();
          if (!error && data) {
            setSettings({
              schoolYear: data.current_school_year || '2025-2026',
              schoolName: data.name || 'School Name',
              schoolId: data.school_id_number || '',
              division: data.division || 'Division',
              region: data.region || 'Region',
              district: data.district || 'District',
              principalName: data.principal_name || '',
              ...data.settings,
            });
          }
        }
      } catch (err) {
        console.error('[SF9Print] Error fetching school settings:', err);
      } finally {
        setSettingsLoading(false);
      }
    };
    if (schoolId) fetchSettings();
  }, [schoolId]);

  useEffect(() => {
    if (!loading && students.length > 0) {
      const studentIds = searchParams.get('students');
      if (studentIds) {
        const ids = studentIds.split(',');
        const found = students.filter(s => ids.includes(s.id));
        setSelectedStudents(found);
        setShowPrintModal(true);
      }
    }
  }, [students, loading, searchParams]);

  const handleBulkPrintPDF = async () => {
    if (selectedStudents.length === 0) return;
    const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 80);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ unit: 'in', format: 'letter', orientation: 'landscape' });
      let isFirstPage = true;
      document.body.classList.add('pdf-export');
      for (const student of selectedStudents) {
        const page1 = document.getElementById(`sf9-page-1-${student.id}`);
        const page2 = document.getElementById(`sf9-page-2-${student.id}`);
        if (!page1 || !page2) continue;
        const cnvOpts = { scale: 2, useCORS: true, allowTaint: false, backgroundColor: '#ffffff', scrollY: 0 } as const;
        const [c1, c2] = await Promise.all([html2canvas(page1, cnvOpts), html2canvas(page2, cnvOpts)]);
        const pdfW = 11;
        const pdfH = 8.5;
        const h1 = Math.min((c1.height * pdfW) / c1.width, pdfH);
        const h2 = Math.min((c2.height * pdfW) / c2.width, pdfH);
        if (!isFirstPage) pdf.addPage('letter', 'landscape');
        pdf.addImage(c1.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0, pdfW, h1);
        pdf.addPage('letter', 'landscape');
        pdf.addImage(c2.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0, pdfW, h2);
        isFirstPage = false;
      }
      document.body.classList.remove('pdf-export');
      const filename = selectedStudents.length === 1
        ? `SF9_${slug(selectedStudents[0].name)}_${new Date().getFullYear()}.pdf`
        : `SF9_Multiple_Students_${new Date().getFullYear()}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('SF9 PDF generation error:', error);
      document.body.classList.remove('pdf-export');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading student data...</p>
        </div>
      </div>
    );
  }

  if (selectedStudents.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-yellow-600 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-yellow-600 mb-2">No Students Selected</h2>
          <p className="text-gray-600 mb-4">Please select students to print from the SF9 dashboard.</p>
          <button onClick={() => navigate('/reports/school-forms/sf9')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            ← Back to SF9 Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-auto">
          <div className="min-h-screen p-4">
            <div className="max-w-[95vw] lg:max-w-[1200px] mx-auto bg-white rounded-lg shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center rounded-t-lg z-10">
                <h3 className="text-lg font-semibold text-slate-800">
                  School Form 9 - Report Card {selectedStudents.length > 1 && `(${selectedStudents.length} students)`}
                </h3>
                <div className="flex items-center gap-3">
                  <button onClick={handleBulkPrintPDF} className="group flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    <span className="text-sm">Download PDF</span>
                  </button>
                  <button onClick={() => { setShowPrintModal(false); navigate('/reports/school-forms/sf9'); }} className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">
                    ✕ Close
                  </button>
                </div>
              </div>
              <div className="max-h-[80vh] overflow-y-auto">
                {selectedStudents.map((student, index) => (
                  <div key={student.id} className={index > 0 ? 'mt-8 pt-8 border-t-4 border-slate-300' : ''}>
                    {selectedStudents.length > 1 && (
                      <div className="bg-slate-100 px-6 py-3 mb-4">
                        <h4 className="font-semibold text-slate-700">Student {index + 1} of {selectedStudents.length}: {student.name}</h4>
                      </div>
                    )}
                    <PrintableSF9Report student={student} schoolData={schoolData} hideDownloadButton={true} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SF9Print;
