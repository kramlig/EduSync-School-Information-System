import React from 'react';
import type { EnrollmentApplication } from '../../../../../types';

interface AddressStepProps {
  data: Partial<EnrollmentApplication>;
  updateData: (updates: Partial<EnrollmentApplication>) => void;
  errors: Record<string, string>;
}

export const AddressStep = React.memo<AddressStepProps>(({ data, updateData }) => {
  const currentAddress = data.currentAddress || {
    barangay: '',
    city: '',
    province: ''
  };

  const sameAsCurrent = data.sameAsCurrent ?? true;

  const handleChange = (field: string, value: string) => {
    updateData({
      currentAddress: {
        ...currentAddress,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">Current Address</h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            House/Unit Number
          </label>
          <input
            type="text"
            value={currentAddress.houseNumber || ''}
            onChange={(e) => handleChange('houseNumber', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="House/Unit #"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Street
          </label>
          <input
            type="text"
            value={currentAddress.street || ''}
            onChange={(e) => handleChange('street', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Street name"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Barangay <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={currentAddress.barangay}
          onChange={(e) => handleChange('barangay', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Enter barangay"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            City/Municipality <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={currentAddress.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter city/municipality"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Province <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={currentAddress.province}
            onChange={(e) => handleChange('province', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter province"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          ZIP Code
        </label>
        <input
          type="text"
          value={currentAddress.zipCode || ''}
          onChange={(e) => handleChange('zipCode', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="ZIP code"
          maxLength={4}
        />
      </div>

      <div className="border-t pt-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={sameAsCurrent}
            onChange={(e) => updateData({ sameAsCurrent: e.target.checked })}
            className="mr-3 w-4 h-4"
          />
          <span className="text-sm font-semibold text-gray-700">
            Permanent address is the same as current address
          </span>
        </label>
      </div>
    </div>
  );
});
