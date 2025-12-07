/**
 * DistributeTextbookModal - Modal for distributing textbooks to students
 * 
 * IMPORTANT: Uses memoization to prevent infinite render loops
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { distributeTextbook } from '../../../services/textbookDistributionsService';
import type { DistributeTextbookInput, BookCondition } from '../../../types/textbookDistributions';

interface Student {
  id: string;
  lrn: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  grade_level: number;
  section_id?: string;
}

interface Book {
  id: string;
  book_number: string;
  title: string;
  author?: string;
  subject?: string;
  grade_level?: number;
  available_copies: number;
  total_copies: number;
}

interface Section {
  id: string;
  name: string;
  grade_level: number;
}

interface DistributeTextbookModalProps {
  schoolId: string;
  schoolYear: string;
  onClose: () => void;
  onSuccess: () => void;
}

const DistributeTextbookModal: React.FC<DistributeTextbookModalProps> = ({
  schoolId,
  schoolYear,
  onClose,
  onSuccess,
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [distributedDate, setDistributedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>('');
  const [conditionIssued, setConditionIssued] = useState<BookCondition>('good');
  const [remarks, setRemarks] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState<string>('');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [studentsRes, booksRes, sectionsRes] = await Promise.all([
          supabase
            .from('students')
            .select('id, lrn, first_name, middle_name, last_name, grade_level, section_id')
            .eq('school_id', schoolId)
            .is('deleted_at', null)
            .order('last_name'),
          supabase
            .from('books')
            .select('id, book_number, title, author, subject, grade_level, available_copies, total_copies')
            .eq('school_id', schoolId)
            .gt('available_copies', 0)
            .is('deleted_at', null)
            .order('title'),
          supabase
            .from('sections')
            .select('id, name, grade_level')
            .eq('school_id', schoolId)
            .is('deleted_at', null)
            .order('grade_level, name'),
        ]);

        if (studentsRes.error) throw studentsRes.error;
        if (booksRes.error) throw booksRes.error;
        if (sectionsRes.error) throw sectionsRes.error;

        setStudents(studentsRes.data || []);
        setBooks(booksRes.data || []);
        setSections(sectionsRes.data || []);
      } catch (err) {
        console.error('Error loading modal data:', err);
        setError('Failed to load students and books');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [schoolId]);

  // Auto-fill section when student is selected
  useEffect(() => {
    if (selectedStudent) {
      const student = students.find((s) => s.id === selectedStudent);
      if (student?.section_id) {
        setSelectedSection(student.section_id);
      }
    }
  }, [selectedStudent, students]);

  // Filter students by search
  const filteredStudents = students.filter((student) => {
    const searchLower = studentSearch.toLowerCase();
    const fullName = `${student.first_name} ${student.middle_name || ''} ${student.last_name}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      student.lrn.includes(searchLower)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent || !selectedBook) {
      setError('Please select both a student and a book');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const input: DistributeTextbookInput = {
        school_id: schoolId,
        book_id: selectedBook,
        student_id: selectedStudent,
        section_id: selectedSection || undefined,
        school_year: schoolYear,
        distributed_date: distributedDate,
        expected_return_date: expectedReturnDate || undefined,
        condition_issued: conditionIssued,
        remarks: remarks || undefined,
      };

      const result = await distributeTextbook(input);

      if (!result.success) {
        setError(result.error || 'Failed to distribute textbook');
        return;
      }

      onSuccess();
    } catch (err) {
      console.error('Error distributing textbook:', err);
      setError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBookData = books.find((b) => b.id === selectedBook);
  const selectedStudentData = students.find((s) => s.id === selectedStudent);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Distribute Textbook</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-8 bg-blue-50 rounded-lg border border-blue-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-800">Loading students and books...</span>
              </div>
            )}
            
            {!loading && (
              <>
              {/* Student Selection with Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student *
                </label>
                <input
                  type="text"
                  placeholder="Search by name or LRN..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                  aria-label="Search students"
                />
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  size={5}
                  aria-label="Select student"
                >
                  <option value="">-- Select Student --</option>
                  {filteredStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.last_name}, {student.first_name} {student.middle_name?.[0]}. - Grade {student.grade_level} (LRN: {student.lrn})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Showing {filteredStudents.length} of {students.length} students
                </p>
              </div>

              {/* Book Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Textbook *
                </label>
                <select
                  value={selectedBook}
                  onChange={(e) => setSelectedBook(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors appearance-none cursor-pointer hover:border-gray-400"
                  size={5}
                  aria-label="Select textbook"
                >
                  <option value="">-- Select Book --</option>
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title} ({book.available_copies}/{book.total_copies} available)
                      {book.grade_level && ` - Grade ${book.grade_level}`}
                    </option>
                  ))}
                </select>
                {selectedBookData && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>{selectedBookData.title}</strong>
                      {selectedBookData.author && ` by ${selectedBookData.author}`}
                      <br />
                      Book #: {selectedBookData.book_number} | 
                      Available: {selectedBookData.available_copies}/{selectedBookData.total_copies}
                    </p>
                  </div>
                )}
              </div>

              {/* Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  aria-label="Select section"
                >
                  <option value="">-- Select Section (Optional) --</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      Grade {section.grade_level} - {section.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distribution Date *
                  </label>
                  <input
                    type="date"
                    value={distributedDate}
                    onChange={(e) => setDistributedDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    aria-label="Distribution date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Return Date
                  </label>
                  <input
                    type="date"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    aria-label="Expected return date"
                  />
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Book Condition *
                </label>
                <select
                  value={conditionIssued}
                  onChange={(e) => setConditionIssued(e.target.value as BookCondition)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  aria-label="Book condition"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional notes about this distribution..."
                />
              </div>

              {/* Summary */}
              {selectedStudentData && selectedBookData && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Distribution Summary</h3>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>
                      <strong>Student:</strong> {selectedStudentData.first_name} {selectedStudentData.last_name} (Grade {selectedStudentData.grade_level})
                    </li>
                    <li>
                      <strong>Book:</strong> {selectedBookData.title}
                    </li>
                    <li>
                      <strong>School Year:</strong> {schoolYear}
                    </li>
                    <li>
                      <strong>Condition:</strong> {conditionIssued.charAt(0).toUpperCase() + conditionIssued.slice(1)}
                    </li>
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedStudent || !selectedBook}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Distributing...' : 'Distribute Textbook'}
                </button>
              </div>
              </>
            )}
            </form>
        </div>
      </div>
    </div>
  );
};

export default DistributeTextbookModal;
