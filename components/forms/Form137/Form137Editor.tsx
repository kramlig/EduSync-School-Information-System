/**
 * Form 137 Editor Component
 * 
 * Create and edit Form 137 (Permanent Academic Record) entries
 * Features:
 * - Student information input
 * - Subject and grade management
 * - Attendance tracking
 * - Core values assessment
 * - Auto-calculation of averages
 * - Real-time validation
 */

import React, { useState, useEffect } from 'react';
import { AcademicHistory, SubjectGrade, QuarterGrade, ObservedValue } from '../shared/FormTypes';
import { Form137Service } from '../../../services/formsService';
import { 
  computeQuarterlyGrade, 
  computeFinalGrade, 
  computeGeneralAverage,
  determinePromotionStatus,
  getGradeDescriptor
} from '../../../services/gradingFormulas';
import { validateForm137, isFormComplete } from '../../../services/formValidation';
import { getCurrentSchoolYear, getSchoolYearOptions } from '../../../services/dateHelpers';
import {
  FormHeader,
  SectionHeader,
  InfoRow,
  FormActions,
  Badge
} from '../shared/FormComponents';
import {
  LoadingSpinner,
  SuccessState,
  ErrorState
} from '../shared/LoadingStates';

interface Form137EditorProps {
  recordId?: string; // For editing existing record
  studentId: string;
  initialData?: Partial<AcademicHistory>;
  onSave?: (record: AcademicHistory) => void;
  onCancel?: () => void;
}

// Elementary subjects (Grades 1-6)
const ELEMENTARY_SUBJECTS = [
  { id: 'FIL', name: 'Filipino' },
  { id: 'ENG', name: 'English' },
  { id: 'MATH', name: 'Mathematics' },
  { id: 'SCI', name: 'Science' },
  { id: 'AP', name: 'Araling Panlipunan' },
  { id: 'EPP', name: 'Edukasyon sa Pagpapakatao' },
  { id: 'MUSIC', name: 'Music' },
  { id: 'ARTS', name: 'Arts' },
  { id: 'PE', name: 'Physical Education' },
  { id: 'HEALTH', name: 'Health' }
];

// Core values for assessment
const CORE_VALUES = [
  'Maka-Diyos',
  'Makatao',
  'Makakalikasan',
  'Makabansa'
];

const OBSERVED_VALUE_OPTIONS: { value: ObservedValue; label: string }[] = [
  { value: 'SO', label: 'Always Observed (SO)' },
  { value: 'AO', label: 'Often Observed (AO)' },
  { value: 'RO', label: 'Sometimes Observed (RO)' },
  { value: 'NO', label: 'Not Observed (NO)' }
];

export const Form137Editor: React.FC<Form137EditorProps> = ({
  recordId,
  studentId,
  initialData,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<AcademicHistory>>({
    studentId,
    schoolYear: getCurrentSchoolYear(),
    gradeLevel: 1,
    section: '',
    adviserName: '',
    schoolName: '',
    schoolId: '',
    studentName: '',
    lrn: '',
    birthDate: '',
    birthPlace: '',
    parentGuardian: '',
    subjects: ELEMENTARY_SUBJECTS.map(sub => ({
      learningAreaId: sub.id,
      learningAreaName: sub.name,
      q1: 0,
      q2: 0,
      q3: 0,
      q4: 0,
      finalRating: 0,
      remarks: 'Failed'
    })),
    generalAverage: 0,
    daysOfSchool: 200,
    daysPresent: 0,
    promotionStatus: 'RETAINED',
    remarks: '',
    coreValues: {
      observedValues: {}
    },
    ...initialData
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Auto-calculate grades when subjects change
  useEffect(() => {
    calculateAverages();
  }, [formData.subjects]);

  const calculateAverages = () => {
    if (!formData.subjects || formData.subjects.length === 0) return;

    // Calculate final ratings for each subject
    const updatedSubjects = formData.subjects.map(subject => {
      const q1 = typeof subject.q1 === 'number' ? subject.q1 : 0;
      const q2 = typeof subject.q2 === 'number' ? subject.q2 : 0;
      const q3 = typeof subject.q3 === 'number' ? subject.q3 : 0;
      const q4 = typeof subject.q4 === 'number' ? subject.q4 : 0;

      const finalRating = computeFinalGrade(q1, q2, q3, q4);
      const remarks: 'Passed' | 'Failed' = finalRating >= 75 ? 'Passed' : 'Failed';

      return { ...subject, finalRating, remarks };
    });

    // Calculate general average
    const generalAverage = computeGeneralAverage(
      updatedSubjects.map(s => s.finalRating)
    );

    // Determine promotion status
    const promotionStatus = determinePromotionStatus(generalAverage);

    setFormData(prev => ({
      ...prev,
      subjects: updatedSubjects,
      generalAverage,
      promotionStatus
    }));
  };

  const handleInputChange = (field: keyof AcademicHistory, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubjectGradeChange = (index: number, quarter: 'q1' | 'q2' | 'q3' | 'q4', value: number) => {
    const updatedSubjects = [...(formData.subjects || [])];
    updatedSubjects[index] = {
      ...updatedSubjects[index],
      [quarter]: value
    };
    setFormData(prev => ({ ...prev, subjects: updatedSubjects }));
  };

  const handleCoreValueChange = (value: string, rating: ObservedValue) => {
    setFormData(prev => ({
      ...prev,
      coreValues: {
        ...prev.coreValues,
        observedValues: {
          ...(prev.coreValues?.observedValues || {}),
          [value]: rating
        }
      }
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      setValidationErrors([]);

      // Validate form
      const validation = validateForm137(formData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors.map(e => e.message));
        setIsSaving(false);
        return;
      }

      // Prepare data for save
      const dataToSave: Omit<AcademicHistory, 'id'> = {
        ...(formData as AcademicHistory),
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: formData.createdBy || 'current-user',
        updatedBy: 'current-user'
      };

      // Save to Firestore
      let savedId: string;
      if (recordId) {
        await Form137Service.update(recordId, dataToSave);
        savedId = recordId;
      } else {
        savedId = await Form137Service.create(dataToSave);
      }

      // Get saved record
      const savedRecord = await Form137Service.getById(savedId);
      
      setSaveSuccess(true);
      
      if (onSave && savedRecord) {
        setTimeout(() => onSave(savedRecord), 1500);
      }
    } catch (error) {
      console.error('Error saving Form 137:', error);
      setSaveError('Failed to save record. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  if (saveSuccess) {
    return (
      <SuccessState
        title="Record Saved Successfully!"
        message={`Form 137 for ${formData.studentName} has been saved.`}
        action={
          onSave
            ? {
                label: 'Close',
                onClick: () => onSave(formData as AcademicHistory)
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8">
      {/* Form Header */}
      <FormHeader
        formTitle="LEARNER'S PERMANENT ACADEMIC RECORD - EDITOR"
        formCode="DepEd Form 137"
        schoolName={formData.schoolName || '[School Name]'}
        schoolId={formData.schoolId || '[School ID]'}
        schoolYear={formData.schoolYear || getCurrentSchoolYear()}
      />

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
            Please fix the following errors:
          </h3>
          <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-400 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {saveError && (
        <div className="mb-6">
          <ErrorState
            title="Save Failed"
            message={saveError}
            onRetry={handleSave}
          />
        </div>
      )}

      {/* Student Information */}
      <SectionHeader title="Student Information" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Student Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.studentName || ''}
            onChange={(e) => handleInputChange('studentName', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            placeholder="Last Name, First Name M.I."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            LRN
          </label>
          <input
            type="text"
            value={formData.lrn || ''}
            onChange={(e) => handleInputChange('lrn', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            placeholder="12-digit LRN"
            maxLength={12}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Birth Date
          </label>
          <input
            type="date"
            value={formData.birthDate || ''}
            onChange={(e) => handleInputChange('birthDate', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Birth Place
          </label>
          <input
            type="text"
            value={formData.birthPlace || ''}
            onChange={(e) => handleInputChange('birthPlace', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            placeholder="City, Province"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Parent/Guardian
          </label>
          <input
            type="text"
            value={formData.parentGuardian || ''}
            onChange={(e) => handleInputChange('parentGuardian', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            placeholder="Full Name"
          />
        </div>
      </div>

      {/* School Information */}
      <SectionHeader title="School Information" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            School Year <span className="text-red-500">*</span>
          </label>
          <select
            aria-label="Select school year"
            value={formData.schoolYear || ''}
            onChange={(e) => handleInputChange('schoolYear', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
          >
            {getSchoolYearOptions(5).map(sy => (
              <option key={sy} value={sy}>{sy}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Grade Level <span className="text-red-500">*</span>
          </label>
          <select
            aria-label="Select grade level"
            value={formData.gradeLevel || 1}
            onChange={(e) => handleInputChange('gradeLevel', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
          >
            <option value={0}>Kinder</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
              <option key={grade} value={grade}>Grade {grade}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Section <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.section || ''}
            onChange={(e) => handleInputChange('section', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            placeholder="Section Name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Adviser <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.adviserName || ''}
            onChange={(e) => handleInputChange('adviserName', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            placeholder="Teacher Name"
          />
        </div>
      </div>

      {/* Quarterly Grades */}
      <SectionHeader 
        title="Quarterly Grades"
        subtitle="Enter grades for each quarter (60-100 scale)"
      />

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-600">
                Learning Area
              </th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-600">
                Q1
              </th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-600">
                Q2
              </th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-600">
                Q3
              </th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-600">
                Q4
              </th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-600">
                Final
              </th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-600">
                Remarks
              </th>
            </tr>
          </thead>
          <tbody>
            {(formData.subjects || []).map((subject, index) => (
              <tr key={subject.learningAreaId} className="border-b border-slate-200 dark:border-slate-700 last:border-0">
                <td className="px-4 py-3 text-slate-900 dark:text-white">
                  {subject.learningAreaName}
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min="60"
                    max="100"
                    value={typeof subject.q1 === 'number' ? subject.q1 : 0}
                    onChange={(e) => handleSubjectGradeChange(index, 'q1', parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 text-center border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min="60"
                    max="100"
                    value={typeof subject.q2 === 'number' ? subject.q2 : 0}
                    onChange={(e) => handleSubjectGradeChange(index, 'q2', parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 text-center border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min="60"
                    max="100"
                    value={typeof subject.q3 === 'number' ? subject.q3 : 0}
                    onChange={(e) => handleSubjectGradeChange(index, 'q3', parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 text-center border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min="60"
                    max="100"
                    value={typeof subject.q4 === 'number' ? subject.q4 : 0}
                    onChange={(e) => handleSubjectGradeChange(index, 'q4', parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 text-center border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </td>
                <td className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-white">
                  {subject.finalRating}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge 
                    label={subject.remarks}
                    color={subject.remarks === 'Passed' ? 'green' : 'red'}
                    size="sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
        <div>
          <div className="text-sm text-indigo-600 dark:text-indigo-400 mb-1">General Average</div>
          <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">
            {formData.generalAverage}
          </div>
          <div className="text-xs text-indigo-600 dark:text-indigo-400">
            {getGradeDescriptor(formData.generalAverage || 0).label}
          </div>
        </div>
        <div>
          <div className="text-sm text-indigo-600 dark:text-indigo-400 mb-1">Promotion Status</div>
          <div className="text-lg font-semibold mt-2">
            <Badge 
              label={formData.promotionStatus || 'RETAINED'}
              color={
                formData.promotionStatus === 'PROMOTED' ? 'green' :
                formData.promotionStatus === 'RETAINED' ? 'red' : 'yellow'
              }
            />
          </div>
        </div>
        <div>
          <div className="text-sm text-indigo-600 dark:text-indigo-400 mb-1">Subjects Passed</div>
          <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">
            {(formData.subjects || []).filter(s => s.remarks === 'Passed').length} / {(formData.subjects || []).length}
          </div>
        </div>
      </div>

      {/* Attendance */}
      <SectionHeader title="Attendance" />
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Total School Days
          </label>
          <input
            type="number"
            value={formData.daysOfSchool || 0}
            onChange={(e) => handleInputChange('daysOfSchool', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Days Present
          </label>
          <input
            type="number"
            value={formData.daysPresent || 0}
            onChange={(e) => handleInputChange('daysPresent', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
          />
        </div>
      </div>

      {/* Core Values */}
      <SectionHeader title="Core Values Assessment" />
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {CORE_VALUES.map(value => (
          <div key={value}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {value}
            </label>
            <select
              aria-label={`Select ${value} rating`}
              value={formData.coreValues?.observedValues?.[value] || 'NO'}
              onChange={(e) => handleCoreValueChange(value, e.target.value as ObservedValue)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            >
              {OBSERVED_VALUE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Remarks */}
      <SectionHeader title="Remarks" />
      
      <textarea
        value={formData.remarks || ''}
        onChange={(e) => handleInputChange('remarks', e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm mb-6"
        placeholder="Additional remarks or notes..."
      />

      {/* Actions */}
      <FormActions
        onSave={handleSave}
        onCancel={handleCancel}
        saveLabel={recordId ? 'Update Record' : 'Save Record'}
        isSaving={isSaving}
      />
    </div>
  );
};

export default Form137Editor;
