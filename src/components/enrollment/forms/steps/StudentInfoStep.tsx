import React from 'react';
import type { EnrollmentApplication } from '../../../../../types';

interface StudentInfoStepProps {
  data: Partial<EnrollmentApplication>;
  updateData: (updates: Partial<EnrollmentApplication>) => void;
  errors: Record<string, string>;
}

export const StudentInfoStep = React.memo<StudentInfoStepProps>(({ data, updateData, errors }) => {
  const studentInfo = data.studentInfo || {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    sex: 'Male' as 'Male' | 'Female',
    nationality: 'Filipino'
  };

  const handleChange = (field: string, value: string) => {
    updateData({
      studentInfo: {
        ...studentInfo,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* First Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          First Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={studentInfo.firstName || ''}
          onChange={(e) => handleChange('firstName', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.firstName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter student's first name"
        />
        {errors.firstName && (
          <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
        )}
      </div>

      {/* Middle Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Middle Name
        </label>
        <input
          type="text"
          value={studentInfo.middleName || ''}
          onChange={(e) => handleChange('middleName', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter student's middle name (optional)"
        />
      </div>

      {/* Last Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Last Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={studentInfo.lastName || ''}
          onChange={(e) => handleChange('lastName', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.lastName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter student's last name"
        />
        {errors.lastName && (
          <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
        )}
      </div>

      {/* Birthdate */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Birthdate <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={studentInfo.dateOfBirth || ''}
          onChange={(e) => handleChange('dateOfBirth', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
          }`}
          max={new Date().toISOString().split('T')[0]}
          aria-label="Student birthdate"
        />
        {errors.dateOfBirth && (
          <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth}</p>
        )}
      </div>

      {/* Gender/Sex */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Sex <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-6">
          <label className="flex items-center">
            <input
              type="radio"
              name="sex"
              value="Male"
              checked={studentInfo.sex === 'Male'}
              onChange={(e) => handleChange('sex', e.target.value)}
              className="mr-2"
            />
            <span>Male</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="sex"
              value="Female"
              checked={studentInfo.sex === 'Female'}
              onChange={(e) => handleChange('sex', e.target.value)}
              className="mr-2"
            />
            <span>Female</span>
          </label>
        </div>
        {errors.sex && (
          <p className="mt-1 text-sm text-red-500">{errors.sex}</p>
        )}
      </div>

      {/* Birthplace */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Place of Birth
        </label>
        <input
          type="text"
          value={studentInfo.placeOfBirth || ''}
          onChange={(e) => handleChange('placeOfBirth', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="City/Municipality, Province"
        />
      </div>

      {/* LRN (Learner Reference Number) */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          LRN (Learner Reference Number)
        </label>
        <input
          type="text"
          value={studentInfo.lrn || ''}
          onChange={(e) => handleChange('lrn', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="12-digit LRN (if available)"
          maxLength={12}
        />
        <p className="mt-1 text-xs text-gray-500">
          Optional: If the student has an existing LRN from a previous school
        </p>
      </div>

      {/* Helpful Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Make sure all information matches the student's birth certificate exactly.
          This will help speed up the verification process.
        </p>
      </div>
    </div>
  );
});
