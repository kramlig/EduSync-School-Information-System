import React from 'react';
import { useSchoolsPostgreSQL } from '../../../../hooks/useSchoolsPostgreSQL';

interface SchoolSelectionStepProps {
  data: {
    selectedSchoolId?: string;
  };
  updateData: (updates: { selectedSchoolId: string }) => void;
  errors: Record<string, string>;
}

/**
 * SchoolSelectionStep - First step in enrollment to choose which school
 * 
 * Allows parents to select which school they're enrolling their child to.
 * Now uses PostgreSQL via useSchoolsPostgreSQL hook
 */
export const SchoolSelectionStep = React.memo<SchoolSelectionStepProps>(({ data, updateData, errors }) => {
  const { schools, loading, error } = useSchoolsPostgreSQL();

  const handleSchoolSelect = (schoolId: string) => {
    updateData({ selectedSchoolId: schoolId });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading available schools...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              <strong>Error loading schools:</strong> {error}. Please refresh the page or contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Important:</strong> Please select the school where you want to enroll your child. 
              This cannot be changed after submission.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-4">
          Select School <span className="text-red-500">*</span>
        </label>
        
        {schools.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No schools available for enrollment at this time.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {schools.map((school) => (
              <button
                key={school.id}
                type="button"
                onClick={() => handleSchoolSelect(school.id)}
                className={`text-left p-6 rounded-lg border-2 transition-all ${
                  data.selectedSchoolId === school.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {school.name}
                    </h3>
                    
                    {school.address && (
                      <p className="text-sm text-gray-600 mb-2">
                        📍 {school.address}
                      </p>
                    )}
                    
                    {school.principalName && (
                      <p className="text-sm text-gray-600">
                        👤 Principal: {school.principalName}
                      </p>
                    )}
                    
                    {school.contactEmail && (
                      <p className="text-sm text-gray-600">
                        ✉️ {school.contactEmail}
                      </p>
                    )}
                    
                    {school.contactPhone && (
                      <p className="text-sm text-gray-600">
                        📞 {school.contactPhone}
                      </p>
                    )}
                  </div>
                  
                  {data.selectedSchoolId === school.id && (
                    <div className="ml-4">
                      <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
        
        {errors.school && (
          <p className="mt-2 text-sm text-red-600">{errors.school}</p>
        )}
      </div>

      {data.selectedSchoolId && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <strong>School selected!</strong> Click "Next" to continue with your application.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
