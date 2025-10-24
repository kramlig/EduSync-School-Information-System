import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { getFirestoreInstance } from '../src/services/firestoreService';

const db = getFirestoreInstance();

interface ValidationResult {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  actualTesterName: string;
  actualTesterEmail: string;
  actualTesterSchool?: string;
  timestamp: Timestamp;
  totalSteps: number;
  passedSteps: number;
  feedback: string;
  answers: Record<number, { answer: string; passed: boolean; autoChecked: boolean }>;
  autoValidations: {
    studentCount: number;
    sectionCount: number;
    learningAreaCount: number;
  };
}

const ValidationResultsDashboard: React.FC = () => {
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<ValidationResult | null>(null);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'validationResults'),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ValidationResult[];
      setResults(data);
    } catch (err) {
      console.error('Error loading validation results:', err);
      setError('Failed to load validation results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(result => {
    const search = searchQuery.toLowerCase();
    return (
      result.actualTesterName?.toLowerCase().includes(search) ||
      result.actualTesterEmail?.toLowerCase().includes(search) ||
      result.actualTesterSchool?.toLowerCase().includes(search) ||
      result.teacherName?.toLowerCase().includes(search)
    );
  });

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Tester Name',
      'Tester Email',
      'School',
      'Test Account',
      'Passed Steps',
      'Total Steps',
      'Success Rate',
      'Student Count',
      'Section Count',
      'Learning Areas',
      'Feedback'
    ];

    const rows = filteredResults.map(result => [
      result.timestamp?.toDate().toLocaleString() || 'N/A',
      result.actualTesterName || 'N/A',
      result.actualTesterEmail || 'N/A',
      result.actualTesterSchool || 'N/A',
      result.teacherName || 'N/A',
      result.passedSteps || 0,
      result.totalSteps || 0,
      `${Math.round(((result.passedSteps || 0) / (result.totalSteps || 1)) * 100)}%`,
      result.autoValidations?.studentCount || 'N/A',
      result.autoValidations?.sectionCount || 'N/A',
      result.autoValidations?.learningAreaCount || 'N/A',
      (result.feedback || 'No feedback').replace(/"/g, '""') // Escape quotes
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (passed: number, total: number) => {
    const percentage = (passed / total) * 100;
    if (percentage === 100) return 'text-green-600 bg-green-50';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading validation results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">{error}</p>
        <button
          onClick={loadResults}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Validation Results</h1>
            <p className="text-gray-600 mt-1">
              {results.length} total submission{results.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={exportToCSV}
            disabled={filteredResults.length === 0}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export to CSV
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by name, email, or school..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Submissions</p>
          <p className="text-3xl font-bold text-blue-600">{results.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Perfect Scores</p>
          <p className="text-3xl font-bold text-green-600">
            {results.filter(r => r.passedSteps === r.totalSteps).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Unique Testers</p>
          <p className="text-3xl font-bold text-purple-600">
            {new Set(results.map(r => r.actualTesterEmail)).size}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Average Success Rate</p>
          <p className="text-3xl font-bold text-yellow-600">
            {results.length > 0
              ? Math.round(
                  (results.reduce((sum, r) => sum + (r.passedSteps / r.totalSteps), 0) / results.length) * 100
                )
              : 0}%
          </p>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Results
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {searchQuery ? 'No results found' : 'No validation submissions yet'}
                  </td>
                </tr>
              ) : (
                filteredResults.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.timestamp?.toDate().toLocaleDateString()} <br />
                      <span className="text-gray-500">
                        {result.timestamp?.toDate().toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {result.actualTesterName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.actualTesterEmail || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.actualTesterSchool || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.teacherName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(result.passedSteps, result.totalSteps)}`}>
                        {result.passedSteps}/{result.totalSteps} passed
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedResult(result)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Validation Details</h2>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tester Info */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Tester Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-medium">{selectedResult.actualTesterName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium">{selectedResult.actualTesterEmail}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">School</p>
                    <p className="font-medium">{selectedResult.actualTesterSchool || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Test Account Used</p>
                    <p className="font-medium">{selectedResult.teacherName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Date & Time</p>
                    <p className="font-medium">{selectedResult.timestamp?.toDate().toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Results Summary */}
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Results Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Steps Passed</p>
                    <p className="text-2xl font-bold text-green-600">{selectedResult.passedSteps}/{selectedResult.totalSteps}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round((selectedResult.passedSteps / selectedResult.totalSteps) * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className={`text-xl font-bold ${selectedResult.passedSteps === selectedResult.totalSteps ? 'text-green-600' : 'text-yellow-600'}`}>
                      {selectedResult.passedSteps === selectedResult.totalSteps ? '✅ Perfect' : '⚠️ Issues Found'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Auto Validations */}
              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Auto-Validation Data</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Student Count</p>
                    <p className="font-medium">{selectedResult.autoValidations?.studentCount || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Sections</p>
                    <p className="font-medium">{selectedResult.autoValidations?.sectionCount || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Learning Areas</p>
                    <p className="font-medium">{selectedResult.autoValidations?.learningAreaCount || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Results */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Step-by-Step Results</h3>
                <div className="space-y-2">
                  {Object.entries(selectedResult.answers || {}).map(([stepId, answer]) => (
                    <div key={stepId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Step {stepId}</span>
                      <div className="flex items-center gap-2">
                        {answer.autoChecked && (
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Auto</span>
                        )}
                        <span className={`text-sm font-semibold ${answer.passed ? 'text-green-600' : 'text-red-600'}`}>
                          {answer.passed ? '✅ Passed' : '❌ Failed'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              {selectedResult.feedback && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Tester Feedback</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedResult.feedback}</p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedResult(null)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationResultsDashboard;
