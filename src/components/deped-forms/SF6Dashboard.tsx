/**
 * SF6Dashboard - Textbook Ledger
 * 
 * IMPORTANT: Feature flag hooks are memoized to prevent infinite render loops
 * caused by settings object reference changes from useSchoolData
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchoolData } from '../../hooks/useSchoolData';
import LoadingSpinner from '../LoadingSpinner';
import {
  getTextbookDistributions,
  getSF6Summary,
  distributeTextbook,
  returnTextbook,
  markTextbookLost,
  markTextbookDamaged,
  recordPayment,
} from '../../services/textbookDistributionsService';
import { getBooks } from '../../services/bookManagementService';
import type {
  TextbookDistributionWithDetails,
  DistributeTextbookInput,
  ReturnTextbookInput,
  MarkTextbookLostInput,
  SF6Summary,
  DistributionStatus,
} from '../../types/textbookDistributions';
import type { Book } from '../../types/bookManagement';
import { downloadSF6PDF } from '../../utils/pdf/sf6Generator';

const SF6Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { students, sections, settings, loading: schoolDataLoading } = useSchoolData([
    'students',
    'sections',
    'settings',
  ]);

  const [distributions, setDistributions] = useState<TextbookDistributionWithDetails[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [summary, setSummary] = useState<SF6Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [schoolYear, setSchoolYear] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
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

  // Initialize school year from settings
  useEffect(() => {
    if (settings?.academic?.currentYear) {
      setSchoolYear(settings.academic.currentYear);
    }
  }, [settings]);

  // Load data
  useEffect(() => {
    if (!user?.schoolId || !schoolYear || schoolDataLoading) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [distributionsData, booksData, summaryData] = await Promise.all([
          getTextbookDistributions({
            schoolId: user.schoolId,
            schoolYear,
            gradeLevel: selectedGrade || undefined,
            sectionId: selectedSection || undefined,
            studentId: selectedStudent || undefined,
            bookId: selectedBook || undefined,
            status: selectedStatus || undefined,
            search: searchTerm || undefined,
          }),
          getBooks({ schoolId: user.schoolId }),
          getSF6Summary({ schoolId: user.schoolId, schoolYear }),
        ]);

        setDistributions(distributionsData);
        setBooks(booksData);
        setSummary(summaryData);
      } catch (err) {
        console.error('Error loading SF6 data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    user?.schoolId,
    schoolYear,
    selectedGrade,
    selectedSection,
    selectedStudent,
    selectedBook,
    selectedStatus,
    searchTerm,
    schoolDataLoading,
  ]);

  // Pagination calculations
  const totalPages = Math.ceil(distributions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDistributions = distributions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGrade, selectedSection, selectedStudent, selectedBook, selectedStatus, searchTerm]);

  // Handle distribute
  const handleDistribute = async (input: DistributeTextbookInput) => {
    if (!user?.id) return;

    try {
      await distributeTextbook({
        ...input,
        distributedBy: user.id,
        receivedBy: user.id,
      });
      setShowDistributeModal(false);
      // Reload data
      window.location.reload();
    } catch (err) {
      console.error('Error distributing textbook:', err);
      alert(err instanceof Error ? err.message : 'Failed to distribute textbook');
    }
  };

  // Handle return
  const handleReturn = async (input: ReturnTextbookInput) => {
    if (!selectedDistribution) return;

    try {
      await returnTextbook(selectedDistribution.id, input);
      setShowReturnModal(false);
      setSelectedDistribution(null);
      window.location.reload();
    } catch (err) {
      console.error('Error returning textbook:', err);
      alert(err instanceof Error ? err.message : 'Failed to return textbook');
    }
  };

  // Handle mark lost
  const handleMarkLost = async (input: MarkTextbookLostInput) => {
    if (!selectedDistribution) return;

    try {
      await markTextbookLost(selectedDistribution.id, input);
      setShowLostModal(false);
      setSelectedDistribution(null);
      window.location.reload();
    } catch (err) {
      console.error('Error marking textbook as lost:', err);
      alert(err instanceof Error ? err.message : 'Failed to mark textbook as lost');
    }
  };

  // Handle download PDF
  const handleDownloadPDF = async () => {
    if (!user?.schoolId || !settings || !summary) return;

    try {
      const section = selectedSection
        ? sections.find((s) => s.id === selectedSection)
        : undefined;

      await downloadSF6PDF({
        schoolInfo: {
          name: settings.school_name || '',
          schoolId: settings.school_id || '',
          division: settings.division || '',
          district: settings.district || '',
        },
        schoolYear,
        gradeLevel: selectedGrade || undefined,
        section,
        distributions: paginatedDistributions,
        summary: {
          total_books_issued: summary.by_grade.reduce((sum, g) => sum + g.total_issued, 0),
          total_books_returned: summary.by_grade.reduce((sum, g) => sum + g.total_returned, 0),
          total_books_lost: summary.condition_summary.lost,
          total_outstanding: summary.by_grade.reduce((sum, g) => sum + g.total_outstanding, 0),
          total_amount_charged: summary.by_grade.reduce((sum, g) => sum + g.total_charged, 0),
          total_amount_paid: summary.by_grade.reduce((sum, g) => sum + g.total_paid, 0),
          total_amount_pending: summary.by_grade.reduce((sum, g) => sum + g.total_pending, 0),
        },
        preparedBy: user.displayName || '',
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF');
    }
  };

  if (schoolDataLoading || loading) return <LoadingSpinner />;
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">SF6 - Textbook Ledger</h1>
        <p className="mt-2 text-gray-600">
          Track textbook distribution, returns, and accountability
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-600">Total Issued</div>
            <div className="mt-1 text-2xl font-bold text-blue-900">
              {summary.by_grade.reduce((sum, g) => sum + g.total_issued, 0)}
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm font-medium text-green-600">Total Returned</div>
            <div className="mt-1 text-2xl font-bold text-green-900">
              {summary.by_grade.reduce((sum, g) => sum + g.total_returned, 0)}
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-sm font-medium text-orange-600">Outstanding</div>
            <div className="mt-1 text-2xl font-bold text-orange-900">
              {summary.by_grade.reduce((sum, g) => sum + g.total_outstanding, 0)}
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm font-medium text-red-600">Lost/Damaged</div>
            <div className="mt-1 text-2xl font-bold text-red-900">
              {summary.condition_summary.lost + summary.condition_summary.damaged}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* School Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              School Year
            </label>
            <input
              type="text"
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="2024-2025"
              aria-label="School year"
            />
          </div>

          {/* Grade Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade Level
            </label>
            <select
              value={selectedGrade || ''}
              onChange={(e) => setSelectedGrade(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              aria-label="Filter by grade level"
            >
              <option value="">All Grades</option>
              {[7, 8, 9, 10].map((grade) => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              aria-label="Filter by section"
            >
              <option value="">All Sections</option>
              {sections
                .filter((s) => !selectedGrade || s.grade_level === selectedGrade)
                .map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Student */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              aria-label="Filter by student"
            >
              <option value="">All Students</option>
              {students
                .filter(
                  (st) =>
                    (!selectedGrade || st.grade_level === selectedGrade) &&
                    (!selectedSection || st.section_id === selectedSection)
                )
                .map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.first_name} {student.last_name} ({student.lrn})
                  </option>
                ))}
            </select>
          </div>

          {/* Book */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Book
            </label>
            <select
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              aria-label="Filter by book"
            >
              <option value="">All Books</option>
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as DistributionStatus | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="issued">Issued</option>
              <option value="returned">Returned</option>
              <option value="lost">Lost</option>
              <option value="damaged">Damaged</option>
              <option value="replaced">Replaced</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, LRN, or book title..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
            aria-label="Search distributions"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowDistributeModal(true)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          Distribute Textbook
        </button>
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={distributions.length === 0}
        >
          Download PDF
        </button>
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
              Showing {startIndex + 1} to {Math.min(endIndex, distributions.length)} of{' '}
              {distributions.length} distributions
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

      {/* Modals would go here - simplified for now */}
      {/* TODO: Implement DistributeModal, ReturnModal, LostModal components */}
    </div>
  );
};

export default SF6Dashboard;
