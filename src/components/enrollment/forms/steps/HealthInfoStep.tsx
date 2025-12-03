import React from 'react';
import type { EnrollmentApplication } from '../../../../../types';

interface HealthInfoStepProps {
  data: Partial<EnrollmentApplication>;
  updateData: (updates: Partial<EnrollmentApplication>) => void;
  errors: Record<string, string>;
}

export const HealthInfoStep = React.memo<HealthInfoStepProps>(({ data, updateData }) => {
  const healthInfo = data.healthInfo || {};

  const handleChange = (field: string, value: string) => {
    updateData({
      healthInfo: {
        ...healthInfo,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          ℹ️ <strong>Optional:</strong> Health information helps us provide better care for your child. All fields are optional.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Blood Type
        </label>
        <select
          value={healthInfo.bloodType || ''}
          onChange={(e) => handleChange('bloodType', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          aria-label="Blood type"
        >
          <option value="">Select blood type</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Allergies
        </label>
        <textarea
          value={healthInfo.allergies || ''}
          onChange={(e) => handleChange('allergies', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="List any known allergies"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Medical Conditions
        </label>
        <textarea
          value={healthInfo.medicalConditions || ''}
          onChange={(e) => handleChange('medicalConditions', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="List any existing medical conditions"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Current Medications
        </label>
        <textarea
          value={healthInfo.medications || ''}
          onChange={(e) => handleChange('medications', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="List any medications the student is currently taking"
        />
      </div>
    </div>
  );
});
