import React from 'react';
import type { EnrollmentApplication } from '../../../../../types';

interface ReviewStepProps {
  data: Partial<EnrollmentApplication>;
  updateData: (updates: Partial<EnrollmentApplication>) => void;
  errors: Record<string, string>;
}

export const ReviewStep = React.memo<ReviewStepProps>(({ data, errors }) => {
  const studentInfo = data.studentInfo;
  const guardian1 = data.guardian1;
  const currentAddress = data.currentAddress;
  const academicInfo = data.academicInfo;

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-green-800">
          ✓ <strong>Review Your Application:</strong> Please review all information before submitting. 
          You can go back to any step to make changes.
        </p>
      </div>

      {errors.student && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{errors.student}</p>
        </div>
      )}

      {/* Student Information */}
      <div className="border rounded-lg p-4">
        <h3 className="font-bold text-lg mb-3">Student Information</h3>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div><span className="font-semibold">Name:</span> {studentInfo?.firstName} {studentInfo?.middleName} {studentInfo?.lastName}</div>
          <div><span className="font-semibold">Birthdate:</span> {studentInfo?.dateOfBirth}</div>
          <div><span className="font-semibold">Sex:</span> {studentInfo?.sex}</div>
          <div><span className="font-semibold">Nationality:</span> {studentInfo?.nationality}</div>
        </div>
      </div>

      {/* Guardian Information */}
      <div className="border rounded-lg p-4">
        <h3 className="font-bold text-lg mb-3">Guardian Information</h3>
        <div className="space-y-3 text-sm">
          {guardian1 && (
            <div>
              <p className="font-semibold">Primary Guardian:</p>
              <p>{guardian1.fullName} ({guardian1.relationship})</p>
              <p>Contact: {guardian1.contactNumber}</p>
            </div>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="border rounded-lg p-4">
        <h3 className="font-bold text-lg mb-3">Address</h3>
        <p className="text-sm">
          {currentAddress?.street && `${currentAddress.street}, `}
          {currentAddress?.barangay}, {currentAddress?.city}, {currentAddress?.province}
        </p>
      </div>

      {/* Academic Information */}
      <div className="border rounded-lg p-4">
        <h3 className="font-bold text-lg mb-3">Academic Information</h3>
        <p className="text-sm">
          <span className="font-semibold">Grade Level:</span> Grade {academicInfo?.gradeLevel}
        </p>
        {academicInfo?.previousSchool && (
          <p className="text-sm mt-2">
            <span className="font-semibold">Previous School:</span> {academicInfo.previousSchool}
          </p>
        )}
      </div>

      {/* Confirmation */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <label className="flex items-start">
          <input type="checkbox" required className="mt-1 mr-3" />
          <span className="text-sm text-gray-700">
            I certify that all information provided in this application is true and accurate to the best of my knowledge.
            I understand that any false information may result in the rejection of this application.
          </span>
        </label>
      </div>
    </div>
  );
});
