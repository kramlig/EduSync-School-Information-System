/**
 * SF3Dashboard - School Register of Books and Other Instructional Materials
 * 
 * IMPORTANT: Feature flag hooks are memoized to prevent infinite render loops
 * caused by settings object reference changes from useSchoolData
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSchoolContext } from '../../contexts/SchoolContext';
import { useSchoolDataPostgreSQL } from '../../hooks/useSchoolDataPostgreSQL';
import {
  getBooksWithStats,
  getSF3Summary,
} from '../../services/bookManagementService';
import { downloadSF3PDF } from '../../utils/pdf/sf3Generator';
import type {
  BookWithStats,
  SF3Summary,
  BookCategory,
} from '../../types/bookManagement';
import {
  BookOpenIcon,
  DocumentTextIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const BOOK_CATEGORIES: BookCategory[] = [
  'Textbook',
  'Workbook',
  'Reference Book',
  'Manual',
  'Dictionary',
  'Atlas',
  'Other',
];

export const SF3Dashboard: React.FC = () => {
  const { schoolId } = useSchoolContext();
  const { settings } = useSchoolDataPostgreSQL({ schoolId: schoolId || null });

  const [books, setBooks] = useState<BookWithStats[]>([]);
  const [summary, setSummary] = useState<SF3Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [schoolYear, setSchoolYear] = useState('2024-2025');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50); // Default 50 items per page

  // Get school info from settings
  const schoolInfo = useMemo(() => ({
    name: (settings as any)?.schoolName || 'School Name',
    address: (settings as any)?.address || '',
    schoolId: (settings as any)?.schoolIdNumber || 'N/A',
    division: (settings as any)?.division || '',
    district: (settings as any)?.district || '',
  }), [settings]);

  const schoolIdMemo = useMemo(() => schoolId || '', [schoolId]);

  // Load data
  useEffect(() => {
    if (!schoolIdMemo) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const filters = {
          category: selectedCategory || undefined,
          subject: selectedSubject || undefined,
          gradeLevel: selectedGrade || undefined,
        };

        const [booksData, summaryData] = await Promise.all([
          getBooksWithStats(schoolIdMemo, schoolYear, filters),
          getSF3Summary(schoolIdMemo, schoolYear, filters),
        ]);

        setBooks(booksData);
        setSummary(summaryData);
      } catch (err) {
        console.error('Failed to load SF3 data:', err);
        setError('Failed to load book inventory data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [schoolIdMemo, schoolYear, selectedCategory, selectedSubject, selectedGrade]);

  // Handle PDF download
  const handleDownloadPDF = async () => {
    try {
      await downloadSF3PDF(books, {
        schoolYear,
        category: selectedCategory as BookCategory || undefined,
        subject: selectedSubject || undefined,
        gradeLevel: selectedGrade || undefined,
        schoolInfo,
      });
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Filter books by search term
  const filteredBooks = useMemo(() => {
    if (!searchTerm) return books;
    
    const term = searchTerm.toLowerCase();
    return books.filter(book =>
      book.title.toLowerCase().includes(term) ||
      book.author?.toLowerCase().includes(term) ||
      book.isbn?.toLowerCase().includes(term) ||
      book.book_number?.toLowerCase().includes(term)
    );
  }, [books, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedSubject, selectedGrade]);

  // Handle page change
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-500">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <a href="/" className="hover:text-blue-600">Home</a>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2">/</span>
              <a href="/reports/school-forms" className="hover:text-blue-600">School Forms</a>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <span className="mx-2">/</span>
              <span className="text-gray-700">SF3 - School Register of Books</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">School Form 3 (SF3)</h1>
          <p className="text-gray-600 mt-1">School Register of Books and Other Instructional Materials</p>
        </div>
        <button
          onClick={handleDownloadPDF}
          disabled={books.length === 0}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
          Download PDF
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School Year</label>
            <input
              type="text"
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="2024-2025"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              title="Select category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {BOOK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="All Subjects"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
            <select
              title="Select grade level"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Grades</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                <option key={grade} value={grade}>Grade {grade}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Search books..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Books</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total_books}</p>
              </div>
              <BookOpenIcon className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Copies</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total_copies}</p>
              </div>
              <DocumentTextIcon className="w-8 h-8 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-green-600">{summary.available_copies}</p>
              </div>
              <ArrowTrendingUpIcon className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Issued</p>
                <p className="text-2xl font-bold text-orange-600">{summary.issued_copies}</p>
              </div>
              <UsersIcon className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{summary.issuances.overdue}</p>
              </div>
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      )}

      {/* Books Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Books Inventory</h3>
              <p className="text-sm text-gray-500 mt-1">
                {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'} 
                {searchTerm && ` matching "${searchTerm}"`}
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Total: {books.length} books
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Book Info
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Classification
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Inventory
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedBooks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12">
                    <div className="text-center">
                      <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        {searchTerm ? 'No books found' : 'No books in inventory'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm 
                          ? `No books matching "${searchTerm}". Try a different search term.`
                          : 'Get started by adding books to your inventory.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBooks.map((book, index) => (
                  <tr 
                    key={book.id} 
                    className={`hover:bg-gray-50 transition-colors duration-150 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    {/* Book Info */}
                    <td className="sticky left-0 z-10 bg-inherit px-6 py-4 whitespace-nowrap">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <BookOpenIcon className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate max-w-xs" title={book.title}>
                            {book.title}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              {book.book_number || 'N/A'}
                            </span>
                            {book.author && (
                              <span className="text-xs text-gray-500 truncate max-w-[150px]" title={book.author}>
                                {book.author}
                              </span>
                            )}
                          </div>
                          {book.publisher && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs" title={book.publisher}>
                              {book.publisher}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Classification */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                            book.category === 'Textbook' ? 'bg-blue-100 text-blue-800' :
                            book.category === 'Workbook' ? 'bg-purple-100 text-purple-800' :
                            book.category === 'Reference Book' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {book.category}
                          </span>
                        </div>
                        {book.subject && (
                          <p className="text-sm text-gray-900 font-medium">{book.subject}</p>
                        )}
                        {book.grade_level && (
                          <p className="text-xs text-gray-500">Grade {book.grade_level}</p>
                        )}
                      </div>
                    </td>

                    {/* Inventory */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{book.total_copies}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{book.available_copies}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Available</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">{book.issued_count}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Issued</p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center space-y-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          book.condition === 'Excellent' ? 'bg-green-100 text-green-800 border border-green-200' :
                          book.condition === 'Good' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          book.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                          'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {book.condition}
                        </span>
                        {book.lost_count > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                            {book.lost_count} Lost
                          </span>
                        )}
                        {book.damaged_count > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                            {book.damaged_count} Damaged
                          </span>
                        )}
                        {book.overdue_count > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            {book.overdue_count} Overdue
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filteredBooks.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Results Info */}
              <div className="text-sm text-gray-700">
                Showing <span className="font-semibold">{startIndex + 1}</span> to{' '}
                <span className="font-semibold">{Math.min(endIndex, filteredBooks.length)}</span> of{' '}
                <span className="font-semibold">{filteredBooks.length}</span> books
                {filteredBooks.length !== books.length && (
                  <span className="text-gray-500"> (filtered from {books.length} total)</span>
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  {/* Items per page */}
                  <div className="flex items-center gap-2 mr-4">
                    <label htmlFor="itemsPerPage" className="text-sm text-gray-600">Per page:</label>
                    <select
                      id="itemsPerPage"
                      title="Items per page"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={200}>200</option>
                    </select>
                  </div>

                  {/* Previous Button */}
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {/* First page */}
                    {currentPage > 3 && (
                      <>
                        <button
                          onClick={() => goToPage(1)}
                          className="px-3 py-1 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                        >
                          1
                        </button>
                        {currentPage > 4 && <span className="px-2 text-gray-400">...</span>}
                      </>
                    )}

                    {/* Current page range */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      if (pageNum < 1 || pageNum > totalPages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            pageNum === currentPage
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    {/* Last page */}
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && <span className="px-2 text-gray-400">...</span>}
                        <button
                          onClick={() => goToPage(totalPages)}
                          className="px-3 py-1 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SF3Dashboard;
