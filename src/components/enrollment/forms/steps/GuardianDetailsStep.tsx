import React from 'react';
import type { EnrollmentApplication } from '../../../../../types';

interface GuardianDetailsStepProps {
  data: Partial<EnrollmentApplication>;
  updateData: (updates: Partial<EnrollmentApplication>) => void;
  errors: Record<string, string>;
}

export const GuardianDetailsStep: React.FC<GuardianDetailsStepProps> = ({ data, updateData, errors }) => {
  const guardian1 = data.guardian1 || {
    fullName: '',
    relationship: 'Father',
    contactNumber: '',
    email: ''
  };

  const guardian2 = data.guardian2 || {
    fullName: '',
    relationship: 'Mother',
    contactNumber: '',
    email: ''
  };

  const handleGuardian1Change = (field: string, value: string | number) => {
    updateData({
      guardian1: {
        ...guardian1,
        [field]: value
      }
    });
  };

  const handleGuardian2Change = (field: string, value: string | number) => {
    updateData({
      guardian2: {
        ...guardian2,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Error message if no guardians */}
      {errors.guardian && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{errors.guardian}</p>
        </div>
      )}

      {/* Guardian 1 */}
      <div className="border-2 border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Guardian 1 (Required)</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={guardian1.fullName}
              onChange={(e) => handleGuardian1Change('fullName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Relationship <span className="text-red-500">*</span>
            </label>
            <select
              value={guardian1.relationship}
              onChange={(e) => handleGuardian1Change('relationship', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Guardian">Legal Guardian</option>
              <option value="Grandparent">Grandparent</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={guardian1.contactNumber}
              onChange={(e) => handleGuardian1Change('contactNumber', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="09XX XXX XXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={guardian1.email || ''}
              onChange={(e) => handleGuardian1Change('email', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Occupation
            </label>
            <input
              type="text"
              value={guardian1.occupation || ''}
              onChange={(e) => handleGuardian1Change('occupation', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter occupation"
            />
          </div>
        </div>
      </div>

      {/* Guardian 2 (Optional) */}
      <div className="border-2 border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Guardian 2 (Optional)</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={guardian2.fullName}
              onChange={(e) => handleGuardian2Change('fullName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter full name (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Relationship
            </label>
            <select
              value={guardian2.relationship}
              onChange={(e) => handleGuardian2Change('relationship', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Mother">Mother</option>
              <option value="Father">Father</option>
              <option value="Guardian">Legal Guardian</option>
              <option value="Grandparent">Grandparent</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contact Number
            </label>
            <input
              type="tel"
              value={guardian2.contactNumber}
              onChange={(e) => handleGuardian2Change('contactNumber', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="09XX XXX XXXX (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={guardian2.email || ''}
              onChange={(e) => handleGuardian2Change('email', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="email@example.com (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Occupation
            </label>
            <input
              type="text"
              value={guardian2.occupation || ''}
              onChange={(e) => handleGuardian2Change('occupation', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter occupation (optional)"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
