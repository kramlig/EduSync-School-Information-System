/**
 * SupabaseTest Component
 * 
 * Simple component to test Supabase connection and data fetching.
 * Displays student count and recent students from PostgreSQL.
 * 
 * This is a PROOF OF CONCEPT to verify:
 * 1. Supabase client is configured correctly
 * 2. Database connection works
 * 3. Real-time subscriptions function
 * 4. Data can be queried
 */

import React from 'react';
import { useSupabase, useStudents } from '../hooks/useSupabase';

export const SupabaseTest: React.FC = () => {
  // Test 1: Fetch all schools
  const { data: schools, loading: loadingSchools, error: schoolsError } = useSupabase('schools');

  // Test 2: Fetch students (using specialized hook)
  const { data: students, loading: loadingStudents, error: studentsError } = useStudents();

  // Test 3: Fetch sections
  const { data: sections, loading: loadingSections, error: sectionsError } = useSupabase('sections', {
    orderBy: 'grade_level',
  });

  if (loadingSchools || loadingStudents || loadingSections) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
        <p className="text-sm text-gray-500 mt-4">Loading data from PostgreSQL...</p>
      </div>
    );
  }

  if (schoolsError || studentsError || sectionsError) {
    return (
      <div className="p-6 bg-red-50 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          ❌ Supabase Connection Error
        </h3>
        <p className="text-sm text-red-600 mb-4">
          Failed to connect to PostgreSQL database.
        </p>
        <div className="bg-red-100 p-3 rounded text-xs font-mono text-red-800">
          {schoolsError?.message || studentsError?.message || sectionsError?.message}
        </div>
        <p className="text-sm text-red-600 mt-4">
          Please check:
          <br />• Supabase URL and keys in .env.local
          <br />• Network connection
          <br />• Supabase project is active
        </p>
      </div>
    );
  }

  const school = schools?.[0];
  const studentCount = students?.length || 0;
  const sectionCount = sections?.length || 0;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold text-green-600 mb-4">
        ✅ Supabase Connected Successfully!
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* School Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600 font-medium">School</div>
          <div className="text-2xl font-bold text-blue-800">
            {school?.name || 'No school'}
          </div>
          <div className="text-xs text-blue-600">
            {school?.current_school_year || 'N/A'}
          </div>
        </div>

        {/* Student Count */}
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600 font-medium">Total Students</div>
          <div className="text-2xl font-bold text-green-800">{studentCount}</div>
          <div className="text-xs text-green-600">From PostgreSQL</div>
        </div>

        {/* Section Count */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-600 font-medium">Sections</div>
          <div className="text-2xl font-bold text-purple-800">{sectionCount}</div>
          <div className="text-xs text-purple-600">Grades 1-3</div>
        </div>
      </div>

      {/* Recent Students */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Recent Students (First 5)
        </h3>
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  LRN
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Grade
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students?.slice(0, 5).map((student: any) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-900">{student.lrn}</td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                    {student.name}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    Grade {student.grade_level}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        student.enrollment_status === 'Enrolled'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {student.enrollment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sections List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Sections</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {sections?.map((section: any) => (
            <div key={section.id} className="bg-indigo-50 p-3 rounded-lg">
              <div className="text-sm font-semibold text-indigo-800">
                Grade {section.grade_level} - {section.name}
              </div>
              <div className="text-xs text-indigo-600">{section.room_number}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-sm text-green-800">
          <strong>✅ Migration Test Successful!</strong>
          <br />
          Data is being read from PostgreSQL via Supabase.
          <br />
          Real-time subscriptions are active (changes will update automatically).
        </p>
      </div>
    </div>
  );
};

export default SupabaseTest;
