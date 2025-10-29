/**
 * Form138Print.tsx
 * Form 138 Report Card Print Component
 * Handles bulk printing of multiple students or single student reports
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSchoolData } from '../../../hooks/useSchoolData';
import PrintableReport from '../../PrintableReport';

const Form138Print: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const schoolData = useSchoolData([
    'students', 
    'grades', 
    'sections', 
    'teachers',
    'learningAreas',
    'coreValues',
    'coreValueGrades',
    'attendanceRecords',
    'parents'
  ]);
  const { students, grades, sections, teachers, settings, loading, error } = schoolData;
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    if (!loading && students.length > 0) {
      const studentIds = searchParams.get('students');
      if (studentIds) {
        const ids = studentIds.split(',');
        const foundStudents = students.filter(s => ids.includes(s.id));
        setSelectedStudents(foundStudents);
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
      
      // Process each student
      for (const student of selectedStudents) {
        const page1 = document.getElementById(`page-1-${student.id}`) as HTMLElement | null;
        const page2 = document.getElementById(`page-2-${student.id}`) as HTMLElement | null;
        
        if (!page1 || !page2) continue;
        
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
        
        if (!isFirstPage) {
          pdf.addPage('letter', 'landscape');
        }
        pdf.addImage(img1, 'JPEG', 0, 0, 11, 8.5);
        pdf.addPage('letter', 'landscape');
        pdf.addImage(img2, 'JPEG', 0, 0, 11, 8.5);
        
        isFirstPage = false;
      }
      
      document.body.classList.remove('pdf-export');
      
      const filename = selectedStudents.length === 1
        ? `Form138_${slug(selectedStudents[0].name)}_${new Date().getFullYear()}.pdf`
        : `Form138_Multiple_Students_${new Date().getFullYear()}.pdf`;
      
      pdf.save(filename);
    } catch (error) {
      console.error('PDF generation error:', error);
      document.body.classList.remove('pdf-export');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/grades/form138')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ← Back to Form 138 Dashboard
          </button>
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
          <p className="text-gray-600 mb-4">Please select students to print from the dashboard.</p>
          <button
            onClick={() => navigate('/grades/form138')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ← Back to Form 138 Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-auto">
          <div className="min-h-screen p-4">
            <div className="max-w-[95vw] lg:max-w-[1200px] mx-auto bg-white rounded-lg shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center rounded-t-lg z-10">
                <h3 className="text-lg font-semibold text-slate-800">
                  DepEd Form 138 - Report Card {selectedStudents.length > 1 && `(${selectedStudents.length} students)`}
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBulkPrintPDF}
                    className="group flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span className="text-sm">Download PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowPrintModal(false);
                      navigate('/grades/form138');
                    }}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
              <div className="max-h-[80vh] overflow-y-auto">
                {selectedStudents.map((student, index) => (
                  <div key={student.id} className={index > 0 ? 'mt-8 pt-8 border-t-4 border-slate-300' : ''}>
                    {selectedStudents.length > 1 && (
                      <div className="bg-slate-100 px-6 py-3 mb-4">
                        <h4 className="font-semibold text-slate-700">
                          Student {index + 1} of {selectedStudents.length}: {student.name}
                        </h4>
                      </div>
                    )}
                    <PrintableReport
                      student={student}
                      schoolData={schoolData}
                      hideDownloadButton={true}
                    />
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

export default Form138Print;