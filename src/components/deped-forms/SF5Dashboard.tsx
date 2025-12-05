/**
 * SF5 Dashboard - Promotion and Proficiency Report (Elementary & Junior High School)
 * DepEd Form SF5 for Grades 1-10
 * 
 * IMPORTANT: Feature flag hooks are memoized to prevent infinite render loops
 * caused by settings object reference changes from useSchoolData
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon, 
  ArrowPathIcon, 
  FunnelIcon, 
  UsersIcon, 
  ArrowTrendingUpIcon, 
  ExclamationCircleIcon, 
  CheckCircleIcon,
  ChevronRightIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { useSchoolContext } from '../../../src/contexts/SchoolContext';
import { useSchoolDataPostgreSQL } from '../../../src/hooks/useSchoolDataPostgreSQL';
import { useSectionsPostgreSQL } from '../../../src/hooks/useSectionsPostgreSQL';
import type {
  PromotionRecordWithStudent,
  PromotionRecordsFilter,
  GeneratePromotionRecordsRequest,
  PromotionSummary,
  GradingPeriod
} from '../../../src/types/promotionRecords';
import {
  getPromotionRecords,
  generatePromotionRecords,
  getPromotionSummary
} from '../../../src/services/promotionRecordsService';
import { generateSF5PDF } from '../../../src/utils/pdf/sf5Generator';
import type { AuthUser, StudentUser, ParentUser } from '../../../types';

interface SF5DashboardProps {
  schoolYear: string;
  gradingPeriod: GradingPeriod;
  session?: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
}

const SF5Dashboard: React.FC<SF5DashboardProps> = ({ schoolYear, gradingPeriod, session }) => {
  const { schoolId } = useSchoolContext();
  const { settings } = useSchoolDataPostgreSQL({ schoolId: schoolId || null });
  const { sections, loading: sectionsLoading } = useSectionsPostgreSQL({ schoolId: schoolId || undefined });

  const [promotionRecords, setPromotionRecords] = useState<PromotionRecordWithStudent[]>([]);
  const [summary, setSummary] = useState<PromotionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Filters
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<number | undefined>(undefined);
  const [selectedSection, setSelectedSection] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);

  // Memoize school ID to prevent unnecessary re-fetches
  const schoolIdMemo = useMemo(() => schoolId || '', [schoolId]);

  // Fetch promotion records
  useEffect(() => {
    if (!schoolIdMemo || sectionsLoading) return;

    const fetchRecords = async () => {
      try {
        setLoading(true);
        setError(null);

        const filter: PromotionRecordsFilter = {
          school_id: schoolIdMemo,
          school_year: schoolYear,
          grading_period: gradingPeriod,
          grade_level: selectedGradeLevel,
          section_id: selectedSection,
          promotion_status: selectedStatus as any,
        };

        const [records, summaryData] = await Promise.all([
          getPromotionRecords(filter),
          getPromotionSummary(schoolIdMemo, schoolYear, selectedGradeLevel)
        ]);

        setPromotionRecords(records);
        setSummary(summaryData);
      } catch (err) {
        console.error('Error fetching promotion records:', err);
        setError(err instanceof Error ? err.message : 'Failed to load promotion records');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [schoolIdMemo, schoolYear, gradingPeriod, selectedGradeLevel, selectedSection, selectedStatus, sectionsLoading]);

  // Auto-generate promotion records from grades
  const handleGenerate = async () => {
    if (!schoolIdMemo) return;

    try {
      setGenerating(true);
      setError(null);
      setDebugInfo([]); // Clear previous debug info
      
      const addDebug = (msg: string) => {
        console.log(`[DEBUG] ${msg}`);
        setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
      };

      addDebug('=== STARTING AUTO GENERATE ===');
      addDebug(`School ID: ${schoolIdMemo}`);
      addDebug(`School Year: ${schoolYear}`);
      addDebug(`Grading Period: ${gradingPeriod}`);
      addDebug(`Grade Level: ${selectedGradeLevel || 'All'}`);
      addDebug(`Section: ${selectedSection || 'All'}`);

      const request: GeneratePromotionRecordsRequest = {
        school_id: schoolIdMemo,
        school_year: schoolYear,
        grading_period: gradingPeriod,
        grade_level: selectedGradeLevel,
        section_id: selectedSection,
      };

      addDebug('Calling generatePromotionRecords...');
      const result = await generatePromotionRecords(request, addDebug);
      
      addDebug(`Result received: Success=${result.success}`);
      addDebug(`Records Created: ${result.records_created}`);
      addDebug(`Records Updated: ${result.records_updated}`);
      addDebug(`Errors: ${result.errors.length}`);
      
      if (result.errors.length > 0) {
        result.errors.forEach((err, idx) => {
          addDebug(`Error ${idx + 1}: ${err.student_name} - ${err.error}`);
        });
      }

      if (result.success) {
        addDebug('Refreshing data...');
        
        // Refresh data
        const filter: PromotionRecordsFilter = {
          school_id: schoolIdMemo,
          school_year: schoolYear,
          grading_period: gradingPeriod,
          grade_level: selectedGradeLevel,
          section_id: selectedSection,
        };
        
        const [records, summaryData] = await Promise.all([
          getPromotionRecords(filter),
          getPromotionSummary(schoolIdMemo, schoolYear, selectedGradeLevel)
        ]);

        addDebug(`Fetched ${records.length} promotion records`);
        setPromotionRecords(records);
        setSummary(summaryData);
        addDebug('=== GENERATION COMPLETE ===');
      } else {
        setError(`Generation completed with ${result.errors.length} errors. See debug panel below.`);
        addDebug('=== GENERATION FAILED ===');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate promotion records';
      console.error('Error generating promotion records:', err);
      setError(errorMsg);
      setDebugInfo(prev => [...prev, `ERROR: ${errorMsg}`]);
    } finally {
      setGenerating(false);
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    try {
      if (promotionRecords.length === 0) {
        alert('No records to export');
        return;
      }

      // Get selected section info if filtering by section
      const selectedSectionInfo = selectedSection
        ? sections?.find((s: any) => s.id === selectedSection)
        : undefined;

      await generateSF5PDF({
        schoolInfo: {
          name: settings?.schoolName || 'School Name',
          schoolId: settings?.schoolIdNumber || schoolIdMemo,
          division: settings?.division || 'Division',
          region: settings?.region || 'Region',
          district: settings?.district || 'District',
        },
        schoolYear,
        gradingPeriod,
        gradeLevel: selectedGradeLevel,
        section: selectedSectionInfo ? {
          name: selectedSectionInfo.name,
          grade_level: typeof selectedSectionInfo.gradeLevel === 'number' 
            ? selectedSectionInfo.gradeLevel 
            : parseInt(selectedSectionInfo.gradeLevel as string)
        } : undefined,
        records: promotionRecords,
        preparedBy: session?.user.email || 'Unknown',
      });

      alert('PDF generated successfully!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. See console for details.');
    }
  };

  // Filter sections by selected grade level
  const filteredSections = useMemo(() => {
    if (!sections || selectedGradeLevel === undefined) return sections || [];
    return sections.filter((s: any) => s.grade_level === selectedGradeLevel);
  }, [sections, selectedGradeLevel]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const total = promotionRecords.length;
    const promoted = promotionRecords.filter(r => r.promotion_status === 'promoted').length;
    const retained = promotionRecords.filter(r => r.promotion_status === 'retained').length;
    const pending = promotionRecords.filter(r => r.promotion_status === 'pending').length;

    return {
      total,
      promoted,
      retained,
      pending,
      promotionRate: total > 0 ? ((promoted / total) * 100).toFixed(1) : '0.0',
      retentionRate: total > 0 ? ((retained / total) * 100).toFixed(1) : '0.0',
    };
  }, [promotionRecords]);

  // Pagination calculations
  const totalPages = Math.ceil(promotionRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRecords = promotionRecords.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGradeLevel, selectedSection, selectedStatus, schoolYear, gradingPeriod]);

  // Go to specific page
  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (sectionsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <a
              href="/"
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
            >
              <HomeIcon className="w-4 h-4 mr-2" />
              Home
            </a>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              <a
                href="/reports/school-forms"
                className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2 dark:text-gray-400 dark:hover:text-white"
              >
                School Forms
              </a>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2 dark:text-gray-400">
                SF5 - Promotion & Proficiency Report
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              SF5 - Promotion & Proficiency Report
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Elementary & Junior High School • {schoolYear} • {gradingPeriod.toUpperCase()}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-5 w-5 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'Auto-Generate'}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={promotionRecords.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <ExclamationCircleIcon className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Debug Panel */}
      {debugInfo.length > 0 && (
        <div className="mb-6 bg-gray-900 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-green-400 font-mono">🔍 DEBUG LOG</h3>
            <button
              onClick={() => setDebugInfo([])}
              className="text-xs text-gray-400 hover:text-white"
            >
              Clear
            </button>
          </div>
          <div className="bg-black rounded p-3 max-h-96 overflow-y-auto font-mono text-xs space-y-1">
            {debugInfo.map((msg, idx) => (
              <div key={idx} className={`
                ${msg.includes('ERROR') ? 'text-red-400' : ''}
                ${msg.includes('===') ? 'text-yellow-400 font-bold' : 'text-green-300'}
                ${msg.includes('Success=true') ? 'text-blue-400' : ''}
              `}>
                {msg}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{overallStats.total}</p>
            </div>
            <UsersIcon className="h-12 w-12 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Promoted</p>
              <p className="text-3xl font-bold text-green-600">{overallStats.promoted}</p>
              <p className="text-xs text-gray-500 mt-1">{overallStats.promotionRate}%</p>
            </div>
            <CheckCircleIcon className="h-12 w-12 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Retained</p>
              <p className="text-3xl font-bold text-red-600">{overallStats.retained}</p>
              <p className="text-xs text-gray-500 mt-1">{overallStats.retentionRate}%</p>
            </div>
            <ExclamationCircleIcon className="h-12 w-12 text-red-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{overallStats.pending}</p>
            </div>
            <ArrowTrendingUpIcon className="h-12 w-12 text-yellow-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
            <select
              value={selectedGradeLevel || ''}
              onChange={(e) => setSelectedGradeLevel(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by grade level"
            >
              <option value="">All Grades</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(grade => (
                <option key={grade} value={grade}>Grade {grade}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="section-filter">Section</label>
            <select
              id="section-filter"
              value={selectedSection || ''}
              onChange={(e) => setSelectedSection(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sections</option>
              {filteredSections.map((section: any) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus || ''}
              onChange={(e) => setSelectedStatus(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by promotion status"
            >
              <option value="">All Statuses</option>
              <option value="promoted">Promoted</option>
              <option value="retained">Retained</option>
              <option value="pending">Pending</option>
              <option value="graduated">Graduated</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary by Grade Level */}
      {summary.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary by Grade Level</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Promoted</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Retained</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pending</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Promotion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {summary.map(s => (
                  <tr key={s.grade_level}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">Grade {s.grade_level}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{s.total_students}</td>
                    <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">{s.promoted}</td>
                    <td className="px-4 py-3 text-sm text-red-600 text-right font-medium">{s.retained}</td>
                    <td className="px-4 py-3 text-sm text-yellow-600 text-right font-medium">{s.pending}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{s.promotion_rate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Promotion Records</h2>
            <p className="text-sm text-gray-600 mt-1">
              Showing {startIndex + 1} to {Math.min(endIndex, promotionRecords.length)} of {promotionRecords.length} record(s)
            </p>
          </div>
          {promotionRecords.length > 25 && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                aria-label="Items per page"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : promotionRecords.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No records found</h3>
            <p className="mt-1 text-sm text-gray-500">Click "Auto-Generate" to create promotion records from grades.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">LRN</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">General Average</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedRecords.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{record.student.lrn}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {record.student.first_name} {record.student.middle_name} {record.student.last_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{record.current_grade_level}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{record.section?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {record.general_average?.toFixed(2) || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          record.promotion_status === 'promoted' ? 'bg-green-100 text-green-800' :
                          record.promotion_status === 'retained' ? 'bg-red-100 text-red-800' :
                          record.promotion_status === 'graduated' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.promotion_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {record.next_grade_level ? `Grade ${record.next_grade_level}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-2">
                  {/* First page */}
                  {currentPage > 3 && (
                    <>
                      <button
                        onClick={() => goToPage(1)}
                        className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                      >
                        1
                      </button>
                      <span className="text-gray-500">...</span>
                    </>
                  )}
                  
                  {/* Page numbers around current page */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => page === currentPage || Math.abs(page - currentPage) <= 1)
                    .map(page => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-1 text-sm font-medium rounded ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  
                  {/* Last page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      <span className="text-gray-500">...</span>
                      <button
                        onClick={() => goToPage(totalPages)}
                        className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SF5Dashboard;
