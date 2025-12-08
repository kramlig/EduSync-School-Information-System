/**
 * DivisionReports - Generate division-level reports
 * 
 * Provides report generation and export functionality:
 * - Enrollment summary reports
 * - Personnel summary reports
 * - Report completion tracking
 * - Export to CSV/PDF
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useDivisionContext } from '../../contexts/DivisionContext';
import { supabase } from '../../lib/supabase';
import { ChartBarIcon, ArrowDownTrayIcon, ClipboardDocumentListIcon, DocumentTextIcon, ArrowPathIcon, CheckCircleIcon } from '../../../components/icons';

interface ReportData {
  type: 'enrollment' | 'personnel' | 'completion';
  generated: boolean;
  loading: boolean;
  data: Record<string, unknown> | null;
  error: string | null;
}

const DivisionReports: React.FC = () => {
  const { division, accessibleSchools, selectedSchoolId, hasPermission, loading: contextLoading } = useDivisionContext();

  const canGenerate = hasPermission('reports', 'generate');
  const canExport = hasPermission('reports', 'export');

  const [reports, setReports] = useState<Record<string, ReportData>>({
    enrollment: { type: 'enrollment', generated: false, loading: false, data: null, error: null },
    personnel: { type: 'personnel', generated: false, loading: false, data: null, error: null },
    completion: { type: 'completion', generated: false, loading: false, data: null, error: null },
  });

  // Memoize school IDs
  const schoolIds = useMemo(() => {
    if (selectedSchoolId) return [selectedSchoolId];
    return accessibleSchools.map(s => s.id);
  }, [selectedSchoolId, accessibleSchools]);

  // Generate enrollment summary report using RPC for optimal performance
  const generateEnrollmentReport = useCallback(async () => {
    if (schoolIds.length === 0 || !division?.id) return;

    setReports(prev => ({
      ...prev,
      enrollment: { ...prev.enrollment, loading: true, error: null },
    }));

    try {
      // Try RPC first for optimal performance
      const { data, error } = await supabase.rpc('get_division_enrollment_summary', {
        p_division_id: division.id,
        p_school_ids: selectedSchoolId ? [selectedSchoolId] : null,
      });

      // Fallback to direct query if RPC not available
      if (error?.code === '42883' || error?.code === 'PGRST202') {
        console.warn('[DivisionReports] RPC not available, using fallback');
        await generateEnrollmentReportFallback();
        return;
      }

      if (error) throw error;

      // Transform RPC response to expected format
      const summary = {
        totalStudents: data?.total_students || 0,
        byGrade: data?.by_grade || {},
        byStatus: { enrolled: data?.total_students || 0 },
        bySchool: {},
      };

      setReports(prev => ({
        ...prev,
        enrollment: { ...prev.enrollment, loading: false, generated: true, data: summary },
      }));
    } catch (err) {
      console.error('[DivisionReports] Enrollment report error:', err);
      setReports(prev => ({
        ...prev,
        enrollment: { ...prev.enrollment, loading: false, error: 'Failed to generate report' },
      }));
    }
  }, [schoolIds, division?.id, selectedSchoolId]);

  // Fallback: Generate enrollment report using direct queries
  const generateEnrollmentReportFallback = useCallback(async () => {
    try {
      const { data: students, error } = await supabase
        .from('students')
        .select('school_id, grade_level, gender, enrollment_status')
        .in('school_id', schoolIds)
        .is('deleted_at', null)
        .limit(10000); // Limit for safety

      if (error) throw error;

      const summary = {
        totalStudents: students?.length || 0,
        byGrade: {} as Record<number, { male: number; female: number; total: number }>,
        byStatus: {} as Record<string, number>,
        bySchool: {} as Record<string, number>,
      };

      (students || []).forEach(s => {
        const grade = Number(s.grade_level) || 0;
        if (!summary.byGrade[grade]) {
          summary.byGrade[grade] = { male: 0, female: 0, total: 0 };
        }
        summary.byGrade[grade].total++;
        if (s.gender === 'Male') summary.byGrade[grade].male++;
        else if (s.gender === 'Female') summary.byGrade[grade].female++;

        summary.byStatus[s.enrollment_status || 'unknown'] = 
          (summary.byStatus[s.enrollment_status || 'unknown'] || 0) + 1;
        summary.bySchool[s.school_id] = (summary.bySchool[s.school_id] || 0) + 1;
      });

      setReports(prev => ({
        ...prev,
        enrollment: { ...prev.enrollment, loading: false, generated: true, data: summary },
      }));
    } catch (err) {
      setReports(prev => ({
        ...prev,
        enrollment: { ...prev.enrollment, loading: false, error: 'Failed to generate report' },
      }));
    }
  }, [schoolIds]);

  // Generate personnel summary report using RPC for optimal performance
  const generatePersonnelReport = useCallback(async () => {
    if (schoolIds.length === 0 || !division?.id) return;

    setReports(prev => ({
      ...prev,
      personnel: { ...prev.personnel, loading: true, error: null },
    }));

    try {
      // Try RPC first for optimal performance
      const { data, error } = await supabase.rpc('get_division_personnel_summary', {
        p_division_id: division.id,
        p_school_ids: selectedSchoolId ? [selectedSchoolId] : null,
      });

      // Fallback to direct query if RPC not available
      if (error?.code === '42883' || error?.code === 'PGRST202') {
        console.warn('[DivisionReports] RPC not available, using fallback');
        await generatePersonnelReportFallback();
        return;
      }

      if (error) throw error;

      // Transform RPC response to expected format
      const summary = {
        totalTeachers: data?.total_personnel || 0,
        byPosition: data?.by_position || {},
        byStatus: data?.by_status || {},
        bySchool: {},
      };

      setReports(prev => ({
        ...prev,
        personnel: { ...prev.personnel, loading: false, generated: true, data: summary },
      }));
    } catch (err) {
      console.error('[DivisionReports] Personnel report error:', err);
      setReports(prev => ({
        ...prev,
        personnel: { ...prev.personnel, loading: false, error: 'Failed to generate report' },
      }));
    }
  }, [schoolIds, division?.id, selectedSchoolId]);

  // Fallback: Generate personnel report using direct queries
  const generatePersonnelReportFallback = useCallback(async () => {
    try {
      const { data: teachers, error } = await supabase
        .from('teachers')
        .select('school_id, position, employment_status')
        .in('school_id', schoolIds)
        .is('deleted_at', null)
        .limit(10000); // Limit for safety

      if (error) throw error;

      const summary = {
        totalTeachers: teachers?.length || 0,
        byPosition: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        bySchool: {} as Record<string, number>,
      };

      (teachers || []).forEach(t => {
        summary.byPosition[t.position || 'other'] = 
          (summary.byPosition[t.position || 'other'] || 0) + 1;
        summary.byStatus[t.employment_status || 'unknown'] = 
          (summary.byStatus[t.employment_status || 'unknown'] || 0) + 1;
        summary.bySchool[t.school_id] = (summary.bySchool[t.school_id] || 0) + 1;
      });

      setReports(prev => ({
        ...prev,
        personnel: { ...prev.personnel, loading: false, generated: true, data: summary },
      }));
    } catch (err) {
      setReports(prev => ({
        ...prev,
        personnel: { ...prev.personnel, loading: false, error: 'Failed to generate report' },
      }));
    }
  }, [schoolIds]);

  // Export report to CSV
  const exportReport = useCallback((reportType: string) => {
    const report = reports[reportType];
    if (!report?.data) return;

    let csvContent = '';
    const now = new Date().toISOString().split('T')[0];

    if (reportType === 'enrollment') {
      const data = report.data as { totalStudents: number; byGrade: Record<number, { male: number; female: number; total: number }> };
      csvContent = 'Grade Level,Male,Female,Total\n';
      Object.entries(data.byGrade)
        .sort(([a], [b]) => Number(a) - Number(b))
        .forEach(([grade, counts]) => {
          csvContent += `Grade ${grade},${counts.male},${counts.female},${counts.total}\n`;
        });
      csvContent += `\nTotal,,${data.totalStudents}\n`;
    } else if (reportType === 'personnel') {
      const data = report.data as { totalTeachers: number; byPosition: Record<string, number>; byStatus: Record<string, number> };
      csvContent = 'Position,Count\n';
      Object.entries(data.byPosition).forEach(([pos, count]) => {
        csvContent += `${pos},${count}\n`;
      });
      csvContent += `\nEmployment Status,Count\n`;
      Object.entries(data.byStatus).forEach(([status, count]) => {
        csvContent += `${status},${count}\n`;
      });
      csvContent += `\nTotal,${data.totalTeachers}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${now}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [reports]);

  const reportTypes = [
    {
      id: 'enrollment',
      title: 'Enrollment Summary',
      description: 'Consolidated enrollment data by grade level and sex',
      Icon: DocumentTextIcon,
      onGenerate: generateEnrollmentReport,
    },
    {
      id: 'personnel',
      title: 'Personnel Summary',
      description: 'Teacher and staff statistics by position and status',
      Icon: ClipboardDocumentListIcon,
      onGenerate: generatePersonnelReport,
    },
    {
      id: 'completion',
      title: 'Report Completion Status',
      description: 'Track which schools have submitted required reports',
      Icon: ChartBarIcon,
      onGenerate: () => {
        setReports(prev => ({
          ...prev,
          completion: { ...prev.completion, generated: true, data: { status: 'coming_soon' } },
        }));
      },
    },
  ];

  if (contextLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 animate-spin text-blue-600"><ArrowPathIcon /></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Division Reports
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Generate consolidated reports for {selectedSchoolId ? '1 school' : `${accessibleSchools.length} schools`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map(report => {
          const reportState = reports[report.id];
          return (
            <div
              key={report.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  reportState?.generated 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  <span className={`w-5 h-5 ${
                    reportState?.generated 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {reportState?.generated ? <CheckCircleIcon /> : <report.Icon />}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {report.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {report.description}
                  </p>
                </div>
              </div>
              
              {reportState?.error && (
                <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-600 dark:text-red-400 text-sm">
                  {reportState.error}
                </div>
              )}
              
              <div className="flex gap-2 mt-4">
                {canGenerate && (
                  <button 
                    onClick={report.onGenerate}
                    disabled={reportState?.loading}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <span className={`w-4 h-4 ${reportState?.loading ? 'animate-spin' : ''}`}>
                      {reportState?.loading ? <ArrowPathIcon /> : <ChartBarIcon />}
                    </span>
                    {reportState?.generated ? 'Regenerate' : 'Generate'}
                  </button>
                )}
                {canExport && reportState?.generated && reportState.data && (
                  <button 
                    onClick={() => exportReport(report.id)}
                    title="Export report"
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    <span className="w-4 h-4"><ArrowDownTrayIcon /></span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Report Preview Section */}
      {(reports.enrollment.generated || reports.personnel.generated) && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white">Generated Reports Preview</h3>
          </div>
          
          <div className="p-4 space-y-4">
            {reports.enrollment.generated && reports.enrollment.data && (
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Enrollment Summary</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-slate-600 dark:text-slate-400">Grade</th>
                        <th className="px-3 py-2 text-right text-slate-600 dark:text-slate-400">Male</th>
                        <th className="px-3 py-2 text-right text-slate-600 dark:text-slate-400">Female</th>
                        <th className="px-3 py-2 text-right text-slate-600 dark:text-slate-400">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {Object.entries((reports.enrollment.data as { byGrade: Record<number, { male: number; female: number; total: number }> }).byGrade)
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([grade, counts]) => (
                          <tr key={grade}>
                            <td className="px-3 py-2 text-slate-900 dark:text-white">Grade {grade}</td>
                            <td className="px-3 py-2 text-right text-blue-600">{counts.male}</td>
                            <td className="px-3 py-2 text-right text-pink-600">{counts.female}</td>
                            <td className="px-3 py-2 text-right font-medium text-slate-900 dark:text-white">{counts.total}</td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-900/50 font-medium">
                      <tr>
                        <td className="px-3 py-2 text-slate-900 dark:text-white">Total</td>
                        <td className="px-3 py-2 text-right" colSpan={2}></td>
                        <td className="px-3 py-2 text-right text-slate-900 dark:text-white">
                          {(reports.enrollment.data as { totalStudents: number }).totalStudents}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {reports.personnel.generated && reports.personnel.data && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Personnel Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm text-slate-500 dark:text-slate-400 mb-2">By Position</h5>
                    {Object.entries((reports.personnel.data as { byPosition: Record<string, number> }).byPosition).map(([pos, count]) => (
                      <div key={pos} className="flex justify-between py-1">
                        <span className="text-slate-600 dark:text-slate-400 capitalize">{pos.replace(/_/g, ' ')}</span>
                        <span className="font-medium text-slate-900 dark:text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h5 className="text-sm text-slate-500 dark:text-slate-400 mb-2">By Status</h5>
                    {Object.entries((reports.personnel.data as { byStatus: Record<string, number> }).byStatus).map(([status, count]) => (
                      <div key={status} className="flex justify-between py-1">
                        <span className="text-slate-600 dark:text-slate-400 capitalize">{status}</span>
                        <span className="font-medium text-slate-900 dark:text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DivisionReports;
