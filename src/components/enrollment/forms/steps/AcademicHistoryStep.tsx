import React from 'react';
import type { EnrollmentApplication } from '../../../../../types';

interface AcademicHistoryStepProps {
  data: Partial<EnrollmentApplication>;
  updateData: (updates: Partial<EnrollmentApplication>) => void;
  errors: Record<string, string>;
}

export const AcademicHistoryStep: React.FC<AcademicHistoryStepProps> = ({ data, updateData }) => {
  const academicInfo = data.academicInfo || {
    gradeLevel: 1
  };

  const handleChange = (field: string, value: string | number) => {
    updateData({
      academicInfo: {
        ...academicInfo,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Grade Level to Enroll <span className="text-red-500">*</span>
        </label>
        <select
          value={academicInfo.gradeLevel}
          onChange={(e) => handleChange('gradeLevel', parseInt(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          aria-label="Grade level"
        >
          <option value={1}>Grade 1</option>
          <option value={2}>Grade 2</option>
          <option value={3}>Grade 3</option>
          <option value={4}>Grade 4</option>
          <option value={5}>Grade 5</option>
          <option value={6}>Grade 6</option>
          <option value={7}>Grade 7</option>
          <option value={8}>Grade 8</option>
          <option value={9}>Grade 9</option>
          <option value={10}>Grade 10</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Previous School
        </label>
        <input
          type="text"
          value={academicInfo.previousSchool || ''}
          onChange={(e) => handleChange('previousSchool', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Name of previous school (if transferring)"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Year Last Attended
        </label>
        <input
          type="text"
          value={academicInfo.yearLastAttended || ''}
          onChange={(e) => handleChange('yearLastAttended', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., 2024-2025"
        />
      </div>
    </div>
  );
});
