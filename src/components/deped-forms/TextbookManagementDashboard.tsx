/**
 * TextbookManagementDashboard - Textbook Ledger (Custom Management Tool)
 * 
 * NOTE: This is a custom school management tool, not an official DepEd form.
 * Official DepEd SF6 is "Summarized Report on Promotion and Level of Proficiency"
 * 
 * IMPORTANT: Feature flag hooks are memoized to prevent infinite render loops
 * caused by settings object reference changes from useSchoolData
 * 
 * Performance optimizations:
 * - useMemo for expensive filtering and calculations
 * - useCallback for event handlers to prevent child re-renders
 * - Optimized data loading with Promise.all
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useSchoolContext } from '../../contexts/SchoolContext';
import DistributeTextbookModal from './modals/DistributeTextbookModal';
import ReturnTextbookModal from './modals/ReturnTextbookModal';
import MarkLostModal from './modals/MarkLostModal';
import { useSchoolDataPostgreSQL } from '../../hooks/useSchoolDataPostgreSQL';
import {
  getTextbookDistributions,
  getSF6Summary,
} from '../../services/textbookDistributionsService';
import { getBooks } from '../../services/bookManagementService';
import type {
  TextbookDistributionWithDetails,
  SF6Summary,
  DistributionStatus,
} from '../../types/textbookDistributions';
import type { Book } from '../../types/bookManagement';
import { downloadSF6PDF } from '../../utils/pdf/textbookLedgerGenerator';

const TextbookManagementDashboard: React.FC = () => {
  const { schoolId: contextSchoolId } = useSchoolContext();
  
  // TEMPORARY DEV FIX: If schoolId is null, try to get from localStorage or use first school from database
  // This is a workaround for the SchoolContext not being properly initialized
  const [actualSchoolId, setActualSchoolId] = useState<string | null>(null);
  
  useEffect(() => {
    const initSchoolId = async () => {
      if (contextSchoolId && contextSchoolId !== 'undefined') {
        console.log('[SF6] Using context schoolId:', contextSchoolId);
        setActualSchoolId(contextSchoolId);
        return;
      }
      
      // Fallback: Try to get from session
      try {
        const sessionStr = localStorage.getItem('edusync_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          if (session.user?.schoolId && session.user.schoolId !== 'default') {
            console.log('[SF6] Using schoolId from session:', session.user.schoolId);
            setActualSchoolId(session.user.schoolId);
            return;
          }
        }
        
        // Last resort: Query database for first school
        console.warn('[SF6] No schoolId in context or session, querying database...');
        const { data: schools } = await supabase.from('schools').select('id').limit(1);
        if (schools && schools.length > 0) {
          console.log('[SF6] Using first school from database:', schools[0].id);
          setActualSchoolId(schools[0].id);
        }
      } catch (err) {
        console.error('[SF6] Failed to get schoolId:', err);
      }
    };
    
    initSchoolId();
  }, [contextSchoolId]);
  
  const schoolId = actualSchoolId;
  const { settings, loading: schoolDataLoading } = useSchoolDataPostgreSQL({
    schoolId,
  });

  const [distributions, setDistributions] = useState<TextbookDistributionWithDetails[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [summary, setSummary] = useState<SF6Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [schoolYear, setSchoolYear] = useState<string>(() => {
    // Initialize with current school year based on Philippine calendar
    const now = new Date();
    const currentYear = now.getFullYear();
    const month = now.getMonth(); // 0-11
    const startYear = month < 5 ? currentYear - 1 : currentYear;
    return `${startYear}-${startYear + 1}`;
  });
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<DistributionStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Modal states
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState<TextbookDistributionWithDetails | null>(null);

  // Track if user has manually changed school year
  const [isSchoolYearManuallySet, setIsSchoolYearManuallySet] = useState(false);

  // Initialize school year from settings if available (override default)
  useEffect(() => {
    if (isSchoolYearManuallySet) return; // Don't override user's selection
    
    if (settings?.schoolYear) {
      console.log('[SF6] Overriding with school year from settings:', settings.schoolYear);
      setSchoolYear(settings.schoolYear);
    }
  }, [settings, isSchoolYearManuallySet]);

  // Load data
  useEffect(() => {
    // Wait for schoolId to be available
    if (!schoolId || !schoolYear || schoolDataLoading) {
      console.log('[SF6Dashboard] Waiting for data:', { schoolId, schoolYear, schoolDataLoading });
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch ALL data without filters - filtering will be done client-side
        console.log('[SF6] Loading all data for:', { school_id: schoolId, school_year: schoolYear });

        try {
          // Optimized parallel data loading with error handling
          const [distributionsData, booksData, summaryData] = await Promise.all([
            getTextbookDistributions({
              school_id: schoolId,
              school_year: schoolYear,
            }).catch((err) => {
              console.warn('[SF6] Failed to load distributions:', err);
              return [];
            }),
            getBooks(schoolId).catch((err) => {
              console.warn('[SF6] Failed to load books:', err);
              return [];
            }),
            getSF6Summary({ schoolId, schoolYear }).catch((err) => {
              console.warn('[SF6] Failed to load summary:', err);
              return {
                total_distributions: 0,
                total_books_issued: 0,
                total_books_returned: 0,
                total_books_lost: 0,
                total_books_damaged: 0,
                total_outstanding: 0,
                total_amount_charged: 0,
                total_amount_paid: 0,
                total_amount_pending: 0,
                by_grade: [],
                by_subject: [],
                condition_summary: {
                  excellent: 0,
                  good: 0,
                  fair: 0,
                  poor: 0,
                  damaged: 0,
                },
              };
            }),
          ]);

          console.log('[SF6] Data received:', {
            distributions: distributionsData?.length || 0,
            books: booksData?.length || 0,
            summary: summaryData,
          });

          setDistributions(distributionsData);
          setBooks(booksData);
          setSummary(summaryData);
        } catch (innerErr) {
          console.warn('Some data failed to load:', innerErr);
          // Set empty defaults
          setDistributions([]);
          setBooks([]);
          setSummary({
            total_distributions: 0,
            total_books_issued: 0,
            total_books_returned: 0,
            total_books_lost: 0,
            total_books_damaged: 0,
            total_outstanding: 0,
            total_amount_charged: 0,
            total_amount_paid: 0,
            total_amount_pending: 0,
            by_grade: [],
            by_subject: [],
            condition_summary: {
              excellent: 0,
              good: 0,
              fair: 0,
              poor: 0,
              damaged: 0,
            },
          });
        }
      } catch (err) {
        console.error('Error loading SF6 data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    schoolId,
    schoolYear,
    // All other filters removed - they work client-side now for instant filtering
    schoolDataLoading,
  ]);

  // Client-side filtering - memoized for performance
  const filteredDistributions = useMemo(() => {
    return distributions.filter(dist => {
      // Grade filter
      if (selectedGrade && dist.student.grade_level !== selectedGrade) return false;
      
      // Section filter
      if (selectedSection && dist.section_id !== selectedSection) return false;
      
      // Book filter
      if (selectedBook && dist.book_id !== selectedBook) return false;
      
      // Status filter
      if (selectedStatus && dist.distribution_status !== selectedStatus) return false;
      
      // Search filter (searches across student name, LRN, book title)
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
          dist.student.lrn.toLowerCase().includes(searchLower) ||
          dist.student.first_name.toLowerCase().includes(searchLower) ||
          dist.student.last_name.toLowerCase().includes(searchLower) ||
          dist.book.title.toLowerCase().includes(searchLower) ||
          dist.book.book_number.toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }
      
      return true;
    });
  }, [distributions, selectedGrade, selectedSection, selectedBook, selectedStatus, searchTerm]);

  // Pagination calculations - memoized
  const { totalPages, paginatedDistributions, startIndex, endIndex } = useMemo(() => {
    const total = Math.ceil(filteredDistributions.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = filteredDistributions.slice(start, end);
    
    return { 
      totalPages: total, 
      paginatedDistributions: paginated,
      startIndex: start,
      endIndex: end
    };
  }, [filteredDistributions, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change (but don't reload data)
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGrade, selectedSection, selectedBook, selectedStatus, searchTerm]);

  // Handle download PDF - memoized to prevent recreation on every render
  const handleDownloadPDF = useCallback(async () => {
    if (!schoolId || !settings || !summary) return;

    try {
      // Get section from distributions if a section is selected
      const sectionData = selectedSection && distributions.length > 0
        ? distributions.find((d) => d.section_id === selectedSection)?.section
        : null;
      
      const section = sectionData ? {
        name: sectionData.name,
        grade_level: sectionData.grade_level
      } : undefined;

      await downloadSF6PDF({
        schoolInfo: {
          name: (settings as any)?.schoolName || '',
          schoolId: (settings as any)?.schoolIdNumber || '',
          division: (settings as any)?.division || '',
          region: (settings as any)?.region || '',
          district: (settings as any)?.district || '',
        },
        schoolYear,
        gradeLevel: selectedGrade || undefined,
        section,
        distributions: filteredDistributions, // Use all filtered data, not just current page
        summary,
        preparedBy: (settings as any)?.schoolName || 'Librarian', // TODO: Use actual user name
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF');
    }
  }, [schoolId, settings, summary, selectedSection, distributions, schoolYear, selectedGrade, filteredDistributions]);

  if (schoolDataLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading textbook distributions...</p>
          {!schoolId && <p className="mt-2 text-sm text-amber-600">Waiting for school context...</p>}
        </div>
      </div>
    );
  }

  // Show error if no schoolId is available
  if (!schoolId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">School Context Not Available</h3>
            <p className="text-sm text-red-600 mb-4">
              Unable to determine your school ID. This may be due to:
            </p>
            <ul className="text-sm text-red-600 text-left list-disc list-inside space-y-1 mb-4">
              <li>Not being logged in</li>
              <li>Missing school assignment in your profile</li>
              <li>Session expired</li>
            </ul>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      {/* Breadcrumbs */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <a href="/dashboard" className="text-gray-500 hover:text-gray-700 transition-colors">
              Dashboard
            </a>
          </li>
          <li>
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </li>
          <li>
            <a href="/reports/school-forms" className="text-gray-500 hover:text-gray-700 transition-colors">
              School Forms
            </a>
          </li>
          <li>
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </li>
          <li>
            <span className="font-medium text-gray-900">Textbook Management</span>
          </li>
        </ol>
      </nav>
      
      {/* Header with gradient and icons */}
      <div className="mb-8 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-200/50 p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                  Textbook Management System
                </h1>
                <p className="mt-1 text-gray-600 text-lg">
                  Track textbook distribution, returns, and accountability
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={loading || !summary}
              className="group px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </span>
            </button>
            <button
              onClick={() => setShowDistributeModal(true)}
              className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Distribute Textbook
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Setup Notice */}
      {distributions.length === 0 && books.length === 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Setup Required</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>The SF6 Textbook Ledger requires database setup:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Run the migration: <code className="bg-blue-100 px-1 rounded">supabase/migrations/create_textbook_distributions_table.sql</code></li>
                  <li>Ensure books exist in the system (SF3 - School Register of Books)</li>
                  <li>Run the seeding script: <code className="bg-blue-100 px-1 rounded">scripts/sf6-seed.ts</code></li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards - Dynamic based on filtered data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-600">Total Issued</div>
          <div className="mt-1 text-2xl font-bold text-blue-900">
            {filteredDistributions.filter(d => d.distribution_status === 'issued').length}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm font-medium text-green-600">Total Returned</div>
          <div className="mt-1 text-2xl font-bold text-green-900">
            {filteredDistributions.filter(d => d.distribution_status === 'returned').length}
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-sm font-medium text-orange-600">Outstanding</div>
          <div className="mt-1 text-2xl font-bold text-orange-900">
            {filteredDistributions.filter(d => d.distribution_status === 'issued').length}
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm font-medium text-red-600">Lost/Damaged</div>
          <div className="mt-1 text-2xl font-bold text-red-900">
            {filteredDistributions.filter(d => d.distribution_status === 'lost' || d.distribution_status === 'damaged').length}
          </div>
        </div>
      </div>

      {/* Filters - Modern Design */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 relative">
        {/* Loading Overlay for School Year Change */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
            <div className="flex items-center space-x-3">
              <svg className="animate-spin h-6 w-6 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm font-medium text-gray-700">Loading data for {schoolYear}...</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          {(selectedGrade || selectedSection || selectedBook || selectedStatus || searchTerm) && (
            <button
              onClick={() => {
                setSelectedGrade(null);
                setSelectedSection('');
                setSelectedBook('');
                setSelectedStatus('');
                setSearchTerm('');
              }}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Primary Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* School Year - Editable */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              School Year
            </label>
            <select
              value={schoolYear}
              onChange={(e) => {
                setSchoolYear(e.target.value);
                setIsSchoolYearManuallySet(true); // Mark as manually changed
              }}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors appearance-none cursor-pointer hover:border-gray-400"
              aria-label="Select school year"
            >
              {/* Generate school years dynamically - last 5 years + next 2 years */}
              {Array.from({ length: 8 }, (_, i) => {
                const year = new Date().getFullYear() - 3 + i;
                const syValue = `${year}-${year + 1}`;
                return (
                  <option key={syValue} value={syValue}>
                    {syValue}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Grade Level - Dynamic from data */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Grade Level
            </label>
            <select
              value={selectedGrade || ''}
              onChange={(e) => {
                setSelectedGrade(e.target.value ? Number(e.target.value) : null);
                setSelectedSection('');
              }}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors appearance-none cursor-pointer hover:border-gray-400"
              aria-label="Filter by grade level"
            >
              <option value="">All Grades</option>
              {/* Extract unique grade levels from distributions */}
              {Array.from(new Set(distributions.map(d => d.student.grade_level)))
                .sort((a, b) => a - b)
                .map(grade => (
                  <option key={grade} value={grade}>
                    Grade {grade}
                  </option>
                ))}
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value);
              }}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors appearance-none cursor-pointer hover:border-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
              disabled={!selectedGrade}
              aria-label="Filter by section"
            >
              <option value="">All Sections</option>
              {Array.from(new Map(distributions
                .filter(d => d.section && (!selectedGrade || d.student.grade_level === selectedGrade))
                .map(d => [d.section_id, d.section])
              ).values())
                .sort((a: any, b: any) => a.name.localeCompare(b.name))
                .map((section: any) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as DistributionStatus | '')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors appearance-none cursor-pointer hover:border-gray-400"
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="issued">✓ Issued</option>
              <option value="returned">↩ Returned</option>
              <option value="lost">⚠ Lost</option>
              <option value="damaged">⚡ Damaged</option>
              <option value="replaced">🔄 Replaced</option>
            </select>
          </div>
        </div>

        {/* Secondary Filters Row */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
          {/* Book Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Book
            </label>
            <select
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors appearance-none cursor-pointer hover:border-gray-400"
              aria-label="Filter by book"
            >
              <option value="">All Books</option>
              {books
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Quick Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, LRN, or book title..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors placeholder-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedGrade || selectedSection || selectedBook || selectedStatus) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide py-1">Active:</span>
              {selectedGrade && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Grade {selectedGrade}
                  <button onClick={() => setSelectedGrade(null)} className="ml-1.5 hover:text-blue-900">×</button>
                </span>
              )}
              {selectedSection && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {distributions.find(d => d.section_id === selectedSection)?.section?.name || 'Section'}
                  <button onClick={() => setSelectedSection('')} className="ml-1.5 hover:text-purple-900">×</button>
                </span>
              )}
              {selectedBook && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {books.find(b => b.id === selectedBook)?.title || 'Book'}
                  <button onClick={() => setSelectedBook('')} className="ml-1.5 hover:text-yellow-900">×</button>
                </span>
              )}
              {selectedStatus && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                  <button onClick={() => setSelectedStatus('')} className="ml-1.5 hover:text-red-900">×</button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LRN
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade/Section
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Book
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issued
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Returned
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Condition
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedDistributions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    No distributions found. Start by distributing textbooks to students.
                  </td>
                </tr>
              ) : (
                paginatedDistributions.map((dist) => (
                  <tr key={dist.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {dist.student.lrn}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {dist.student.first_name} {dist.student.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {dist.section
                        ? `${dist.student.grade_level}-${dist.section.name}`
                        : `Grade ${dist.student.grade_level}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {dist.book.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(dist.distributed_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {dist.actual_return_date
                        ? new Date(dist.actual_return_date).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          dist.distribution_status === 'issued'
                            ? 'bg-blue-100 text-blue-800'
                            : dist.distribution_status === 'returned'
                            ? 'bg-green-100 text-green-800'
                            : dist.distribution_status === 'lost'
                            ? 'bg-red-100 text-red-800'
                            : dist.distribution_status === 'damaged'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {dist.distribution_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {(dist.condition_returned || dist.condition_issued).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {dist.amount_charged > 0 ? `₱${dist.amount_charged.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {dist.distribution_status === 'issued' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedDistribution(dist);
                              setShowReturnModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            Return
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDistribution(dist);
                              setShowLostModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Mark Lost
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {distributions.length > 0 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredDistributions.length)} of{' '}
              {filteredDistributions.length} distributions
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500"
              aria-label="Items per page"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
              <option value={200}>200 per page</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {/* Page numbers with ellipsis */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      currentPage === page
                        ? 'bg-emerald-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className="px-2 text-gray-500">
                    ...
                  </span>
                );
              }
              return null;
            })}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Distribute Textbook Modal */}
      {showDistributeModal && (
        <DistributeTextbookModal
          schoolId={actualSchoolId!}
          schoolYear={schoolYear}
          onClose={() => setShowDistributeModal(false)}
          onSuccess={() => {
            setShowDistributeModal(false);
            window.location.reload();
          }}
        />
      )}

      {/* Return Textbook Modal */}
      {showReturnModal && selectedDistribution && (
        <ReturnTextbookModal
          distribution={selectedDistribution}
          onClose={() => {
            setShowReturnModal(false);
            setSelectedDistribution(null);
          }}
          onSuccess={() => {
            setShowReturnModal(false);
            setSelectedDistribution(null);
            window.location.reload();
          }}
        />
      )}

      {/* Mark Lost Modal */}
      {showLostModal && selectedDistribution && (
        <MarkLostModal
          distribution={selectedDistribution}
          onClose={() => {
            setShowLostModal(false);
            setSelectedDistribution(null);
          }}
          onSuccess={() => {
            setShowLostModal(false);
            setSelectedDistribution(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default TextbookManagementDashboard;
