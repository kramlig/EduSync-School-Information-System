/**
 * SF6Dashboard - Summarized Report on Promotion and Level of Proficiency
 * Official DepEd Form
 * 
 * This is the CORRECT SF6 as per official DepEd documentation.
 * Displays promotion status and proficiency levels summary.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSchoolContext } from '../../contexts/SchoolContext';
import { useSchoolDataPostgreSQL } from '../../hooks/useSchoolDataPostgreSQL';
import {
  getSF6SchoolSummary,
  getSF6ByGrade,
  getSF6BySection,
} from '../../services/sf6PromotionService';
import { downloadSF6PDF } from '../../utils/pdf/sf6PromotionGenerator';
import type {
  SF6SchoolSummary,
  SF6GradeSummary,
  SF6SectionSummary,
} from '../../types/sf6Promotion';
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const SF6Dashboard: React.FC = () => {
  const { schoolId } = useSchoolContext();
  const { settings, loading: schoolDataLoading } = useSchoolDataPostgreSQL({ schoolId });

  const [summary, setSummary] = useState<SF6SchoolSummary | null>(null);
  const [byGrade, setByGrade] = useState<SF6GradeSummary[]>([]);
  const [bySection, setBySection] = useState<SF6SectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedGrade, setSelectedGrade] = useState<number | ''>('');
  const [viewMode, setViewMode] = useState<'grade' | 'section'>('grade');

  const schoolYear = settings?.schoolYear || new Date().getFullYear().toString();
  const gradingPeriod = 'final'; // Could be made dynamic for SHS (sem1, sem2)

  useEffect(() => {
    if (!schoolId || schoolDataLoading) {
      console.log('[SF6] Waiting for data:', { schoolId, schoolDataLoading });
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[SF6] Loading summary for:', { schoolId, schoolYear, gradingPeriod });

        const [summaryData, gradeData, sectionData] = await Promise.all([
          getSF6SchoolSummary({ school_id: schoolId, school_year: schoolYear, grading_period: gradingPeriod }),
          getSF6ByGrade({ school_id: schoolId, school_year: schoolYear, grading_period: gradingPeriod }),
          getSF6BySection({ school_id: schoolId, school_year: schoolYear, grading_period: gradingPeriod }),
        ]);

        setSummary(summaryData);
        setByGrade(gradeData);
        setBySection(sectionData);

        console.log('[SF6] Data loaded:', {
          totalLearners: summaryData.total_learners,
          promotionRate: summaryData.overall_promotion_rate,
          grades: gradeData.length,
          sections: sectionData.length,
        });
      } catch (err) {
        console.error('[SF6] Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load promotion summary');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [schoolId, schoolYear, gradingPeriod, schoolDataLoading]);

  // Filter data based on selected grade
  const filteredByGrade = useMemo(() => {
    if (selectedGrade === '') return byGrade;
    return byGrade.filter(g => g.grade_level === selectedGrade);
  }, [byGrade, selectedGrade]);

  const filteredBySection = useMemo(() => {
    if (selectedGrade === '') return bySection;
    return bySection.filter(s => s.grade_level === selectedGrade);
  }, [bySection, selectedGrade]);

  const handleDownloadPDF = async () => {
    if (!summary || !settings) return;

    try {
      await downloadSF6PDF({
        school_id: schoolId,
        school_name: settings.schoolName || 'School',
        school_year: schoolYear,
        grading_period: gradingPeriod,
        region: settings.region,
        division: settings.division,
        district: settings.district,
        summary: summary,
        principal_name: settings.principalName,
        registrar_name: undefined, // TODO: Add to settings
      });
    } catch (err) {
      console.error('[SF6] Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading promotion summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm">
          <a href="/dashboard" className="text-gray-500 hover:text-gray-700">Dashboard</a>
          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
          <a href="/reports/school-forms" className="text-gray-500 hover:text-gray-700">School Forms</a>
          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-900">SF6 - Promotion Summary</span>
        </nav>

        {/* Header */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl blur-xl opacity-20"></div>
                <div className="relative p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                  <ChartBarIcon className="w-10 h-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  SF6 - Summarized Report on Promotion and Level of Proficiency
                </h1>
                <p className="text-gray-600 mt-1">Official DepEd Form - End of {gradingPeriod === 'final' ? 'School Year' : 'Semester'}</p>
              </div>
            </div>
            <button
              onClick={handleDownloadPDF}
              disabled={!summary}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Learners</p>
                <p className="text-3xl font-bold text-gray-900">{summary?.total_learners || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  M: {summary?.total_male || 0} / F: {summary?.total_female || 0}
                </p>
              </div>
              <UserGroupIcon className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Promoted</p>
                <p className="text-3xl font-bold text-green-600">{summary?.total_promoted || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary?.overall_promotion_rate.toFixed(1)}% rate
                </p>
              </div>
              <AcademicCapIcon className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Retained</p>
                <p className="text-3xl font-bold text-red-600">{summary?.total_retained || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary && summary.total_learners > 0
                    ? ((summary.total_retained / summary.total_learners) * 100).toFixed(1)
                    : 0}% rate
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Incomplete</p>
                <p className="text-3xl font-bold text-amber-600">{summary?.total_incomplete || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary && summary.total_learners > 0
                    ? ((summary.total_incomplete / summary.total_learners) * 100).toFixed(1)
                    : 0}% rate
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>
        </div>

        {/* Proficiency Levels Summary */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Proficiency Levels Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Advanced</p>
              <p className="text-2xl font-bold text-purple-600">{summary?.total_advanced || 0}</p>
              <p className="text-xs text-gray-500">90-100</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Proficient</p>
              <p className="text-2xl font-bold text-blue-600">{summary?.total_proficient || 0}</p>
              <p className="text-xs text-gray-500">85-89</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Approaching</p>
              <p className="text-2xl font-bold text-green-600">{summary?.total_approaching_proficiency || 0}</p>
              <p className="text-xs text-gray-500">80-84</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">Developing</p>
              <p className="text-2xl font-bold text-yellow-600">{summary?.total_developing || 0}</p>
              <p className="text-xs text-gray-500">75-79</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">Beginning</p>
              <p className="text-2xl font-bold text-orange-600">{summary?.total_beginning || 0}</p>
              <p className="text-xs text-gray-500">Below 75</p>
            </div>
          </div>
        </div>

        {/* Filters and View Mode */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Grade Level:</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value === '' ? '' : Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Grades</option>
                {Array.from(new Set(byGrade.map(g => g.grade_level))).sort((a, b) => a - b).map(level => (
                  <option key={level} value={level}>Grade {level}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grade')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grade'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                By Grade
              </button>
              <button
                onClick={() => setViewMode('section')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'section'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                By Section
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {viewMode === 'grade' ? 'Grade Level' : 'Section'}
                  </th>
                  {viewMode === 'section' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adviser
                    </th>
                  )}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Male
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Female
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Promoted
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Retained
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incomplete
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {viewMode === 'grade' ? (
                  filteredByGrade.length > 0 ? (
                    filteredByGrade.map((row) => (
                      <tr key={row.grade_level} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Grade {row.grade_level}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {row.total_learners}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                          {row.male_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                          {row.female_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                            {row.promoted}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">
                            {row.retained}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                            {row.incomplete}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-blue-600">
                          {row.promotion_rate.toFixed(1)}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                        No data available
                      </td>
                    </tr>
                  )
                ) : (
                  filteredBySection.length > 0 ? (
                    filteredBySection.map((row) => (
                      <tr key={row.section_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {row.section_name}
                          <span className="ml-2 text-xs text-gray-500">(Grade {row.grade_level})</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {row.adviser_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {row.total_learners}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                          {row.male_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                          {row.female_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                            {row.promoted}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">
                            {row.retained}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                            {row.incomplete}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-blue-600">
                          {row.promotion_rate.toFixed(1)}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                        No data available
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SF6Dashboard;
