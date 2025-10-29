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
import { AcademicHistory, SubjectGrade, ObservedValue, SchoolYearRecord } from '../shared/FormTypes';
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

// Flat structure for editor (ONE school year at a time)
interface Form137EditorData {
  studentId: string;
  studentName: string;
  lrn: string;
  birthDate: string;
  birthPlace: string;
  parentGuardian: string;
  schoolYear: string;
  gradeLevel: number;
  section: string;
  adviserName: string;
  schoolName: string;
  schoolId: string;
  subjects: SubjectGrade[];
  generalAverage: number;
  daysOfSchool: number;
  daysPresent: number;
  promotionStatus: 'Promoted' | 'Retained' | 'Conditional';
  remarks: string;
  coreValues?: {
    observedValues: Record<string, ObservedValue>;
  };
}

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
  // FIXED: Extract data from cumulative structure (schoolYears[])
  const initializeFormData = (): Form137EditorData => {
    // If editing existing record, extract the latest/selected school year
    if (initialData && initialData.schoolYears && initialData.schoolYears.length > 0) {
      const latestYear = initialData.schoolYears[initialData.schoolYears.length - 1];
      
      // Map cumulative structure to flat editor structure
      return {
        studentId,
        studentName: initialData.studentName || '',
        lrn: initialData.lrn || '',
        birthDate: initialData.birthDate || '',
        birthPlace: initialData.birthPlace || '',
        parentGuardian: initialData.parentGuardian || '',
        schoolYear: latestYear.schoolYear || getCurrentSchoolYear(),
        gradeLevel: latestYear.gradeLevel || 1,
        section: latestYear.section || '',
        adviserName: latestYear.adviserName || '',
        schoolName: latestYear.schoolName || '',
        schoolId: latestYear.schoolId || '',
        // Map 'grades' to 'subjects' for the editor
        subjects: latestYear.grades || [],
        generalAverage: latestYear.generalAverage || 0,
        daysOfSchool: latestYear.daysOfSchool || 200,
        daysPresent: latestYear.daysPresent || 0,
        promotionStatus: latestYear.promotionStatus || 'Retained',
        remarks: latestYear.remarks || '',
        coreValues: {
          observedValues: {}
        }
      };
    }
    
    // Default for new record
    return {
      studentId,
      studentName: '',
      lrn: '',
      birthDate: '',
      birthPlace: '',
      parentGuardian: '',
      schoolYear: getCurrentSchoolYear(),
      gradeLevel: 1,
      section: '',
      adviserName: '',
      schoolName: '',
      schoolId: '',
      subjects: ELEMENTARY_SUBJECTS.map(sub => ({
        learningAreaId: sub.id,
        learningAreaName: sub.name,
        q1: 0,
        q2: 0,
        q3: 0,
        q4: 0,
        finalGrade: 0,
        remarks: 'Failed'
      })),
      generalAverage: 0,
      daysOfSchool: 200,
      daysPresent: 0,
      promotionStatus: 'Retained',
      remarks: '',
      coreValues: {
        observedValues: {}
      }
    };
  };

  const [formData, setFormData] = useState<Form137EditorData>(initializeFormData());

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

    // Calculate final grades for each subject
    const updatedSubjects = formData.subjects.map(subject => {
      const q1 = typeof subject.q1 === 'number' ? subject.q1 : 0;
      const q2 = typeof subject.q2 === 'number' ? subject.q2 : 0;
      const q3 = typeof subject.q3 === 'number' ? subject.q3 : 0;
      const q4 = typeof subject.q4 === 'number' ? subject.q4 : 0;

      const finalGrade = computeFinalGrade(q1, q2, q3, q4);
      const remarks: 'Passed' | 'Failed' = finalGrade >= 75 ? 'Passed' : 'Failed';

      return { ...subject, finalGrade, remarks };
    });

    // Calculate general average
    const generalAverage = computeGeneralAverage(
      updatedSubjects.map(s => s.finalGrade)
    );

    // Determine promotion status
    const promotionStatusRaw = determinePromotionStatus(generalAverage);
    // Convert to proper case format
    const promotionStatus: 'Promoted' | 'Retained' | 'Conditional' = 
      promotionStatusRaw === 'PROMOTED' ? 'Promoted' :
      promotionStatusRaw === 'RETAINED' ? 'Retained' : 'Conditional';

    setFormData(prev => ({
      ...prev,
      subjects: updatedSubjects,
      generalAverage,
      promotionStatus
    }));
  };

  const handleInputChange = (field: keyof Form137EditorData, value: any) => {
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

      // Convert flat editor data to cumulative AcademicHistory structure
      const schoolYearRecord: SchoolYearRecord = {
        schoolYear: formData.schoolYear,
        gradeLevel: formData.gradeLevel,
        section: formData.section,
        adviserName: formData.adviserName,
        schoolName: formData.schoolName,
        schoolId: formData.schoolId,
        grades: formData.subjects, // Editor's 'subjects' maps to 'grades' in cumulative structure
        generalAverage: formData.generalAverage,
        daysOfSchool: formData.daysOfSchool,
        daysPresent: formData.daysPresent,
        promotionStatus: formData.promotionStatus,
        remarks: formData.remarks,
        recordedAt: new Date().toISOString(),
        recordedBy: 'current-user'
      };

      // Prepare cumulative structure
      const dataToSave: Omit<AcademicHistory, 'id'> = {
        studentId: formData.studentId,
        studentName: formData.studentName,
        lrn: formData.lrn,
        birthDate: formData.birthDate,
        birthPlace: formData.birthPlace,
        parentGuardian: formData.parentGuardian,
        currentSchoolName: formData.schoolName,
        currentSchoolId: formData.schoolId,
        schoolYears: initialData?.schoolYears 
          ? [...initialData.schoolYears.filter(y => y.schoolYear !== formData.schoolYear), schoolYearRecord]
          : [schoolYearRecord],
        createdAt: initialData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: initialData?.createdBy || 'current-user',
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
        title="Saved Successfully!"
        message="Form 137 record has been saved."
        action={
          onCancel
            ? {
                label: 'Close',
                onClick: onCancel
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Premium Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-2xl p-8 mb-8">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full blur-3xl -z-10"></div>
          
          <div className="relative z-10">
            <FormHeader
              formTitle="LEARNER'S PERMANENT ACADEMIC RECORD - EDITOR"
              formCode="DepEd Form 137"
              schoolName={formData.schoolName || '[School Name]'}
              schoolId={formData.schoolId || '[School ID]'}
              schoolYear={formData.schoolYear || getCurrentSchoolYear()}
            />
          </div>
        </div>

        {/* Premium Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-8 relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50/80 to-rose-50/60 dark:from-red-900/30 dark:to-rose-900/20 backdrop-blur-xl border border-red-200/40 dark:border-red-700/40 shadow-lg p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-600/5 -z-10"></div>
            <div className="relative z-10">
              <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-700 to-rose-700 dark:from-red-400 dark:to-rose-400 mb-3">
                ⚠️ Please fix the following errors:
              </h3>
              <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-2">
                {validationErrors.map((error, index) => (
                  <li key={index} className="leading-relaxed">{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {saveError && (
          <div className="mb-8">
            <ErrorState
              title="Save Failed"
              message={saveError}
              onRetry={handleSave}
            />
          </div>
        )}

        {/* Premium Student Information Section */}
        <div className="mb-8">
          <SectionHeader title="Student Information" />
          
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-xl p-6">
            {/* Decorative orb */}
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-full blur-3xl -z-10"></div>
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Student Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.studentName || ''}
                  onChange={(e) => handleInputChange('studentName', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="Last Name, First Name M.I."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  LRN
                </label>
                <input
                  type="text"
                  value={formData.lrn || ''}
                  onChange={(e) => handleInputChange('lrn', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="12-digit LRN"
                  maxLength={12}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Birth Date
                </label>
                <input
                  type="date"
                  value={formData.birthDate || ''}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Birth Place
                </label>
                <input
                  type="text"
                  value={formData.birthPlace || ''}
                  onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
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
                  className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="Full Name"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Premium School Information Section */}
        <div className="mb-8">
          <SectionHeader title="School Information" />
          
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-xl p-6">
            {/* Decorative orb */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 rounded-full blur-3xl -z-10"></div>
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        </div>

        {/* Premium Quarterly Grades Section */}
        <div className="mb-8">
          <SectionHeader 
            title="Quarterly Grades"
            subtitle="Enter grades for each quarter (60-100 scale)"
          />

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-xl">
            {/* Decorative orb */}
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 rounded-full blur-3xl -z-10"></div>
            
            <div className="relative z-10 overflow-x-auto">
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
                  {subject.finalGrade}
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

        {/* Premium Summary Cards */}
        <div className="p-6 grid grid-cols-3 gap-4">
          {/* General Average */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50/80 to-purple-50/60 dark:from-indigo-900/30 dark:to-purple-900/20 backdrop-blur-sm border border-indigo-200/40 dark:border-indigo-700/40 p-4 hover:scale-105 transition-all duration-300">
            <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2">📊 General Average</div>
            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              {formData.generalAverage}
            </div>
            <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-1">
              {getGradeDescriptor(formData.generalAverage || 0).label}
            </div>
          </div>

          {/* Promotion Status */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50/80 to-emerald-50/60 dark:from-green-900/30 dark:to-emerald-900/20 backdrop-blur-sm border border-green-200/40 dark:border-green-700/40 p-4 hover:scale-105 transition-all duration-300">
            <div className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">✅ Promotion Status</div>
            <div className="mt-2">
              <Badge 
                label={formData.promotionStatus || 'Retained'}
                color={
                  formData.promotionStatus === 'Promoted' ? 'green' :
                  formData.promotionStatus === 'Retained' ? 'red' : 'yellow'
                }
              />
            </div>
          </div>

          {/* Subjects Passed */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50/80 to-cyan-50/60 dark:from-blue-900/30 dark:to-cyan-900/20 backdrop-blur-sm border border-blue-200/40 dark:border-blue-700/40 p-4 hover:scale-105 transition-all duration-300">
            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">📚 Subjects Passed</div>
            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400">
              {(formData.subjects || []).filter(s => s.remarks === 'Passed').length} / {(formData.subjects || []).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

        {/* Premium Attendance Section */}
        <div className="mb-8">
          <SectionHeader title="Attendance" />
      
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-xl p-6">
            {/* Decorative orb */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-500/10 to-teal-600/10 rounded-full blur-3xl -z-10"></div>
            
            <div className="relative z-10 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  📚 Total School Days
                </label>
                <input
                  type="number"
                  value={formData.daysOfSchool || 0}
                  onChange={(e) => handleInputChange('daysOfSchool', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  ✅ Days Present
                </label>
                <input
                  type="number"
                  value={formData.daysPresent || 0}
                  onChange={(e) => handleInputChange('daysPresent', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Premium Core Values Section */}
        <div className="mb-8">
          <SectionHeader title="Core Values Assessment" />
          
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-xl p-6">
            {/* Decorative orb */}
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-full blur-3xl -z-10"></div>
            
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4">
              {CORE_VALUES.map(value => (
                <div key={value}>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {value}
                  </label>
                  <select
                    aria-label={`Select ${value} rating`}
                    value={formData.coreValues?.observedValues?.[value] || 'NO'}
                    onChange={(e) => handleCoreValueChange(value, e.target.value as ObservedValue)}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
          </div>
        </div>

        {/* Premium Remarks Section */}
        <div className="mb-8">
          <SectionHeader title="Remarks" />
          
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50/80 to-yellow-50/60 dark:from-amber-900/30 dark:to-yellow-900/20 backdrop-blur-xl border border-amber-200/40 dark:border-amber-700/40 shadow-lg p-6">
            <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-amber-500/10 to-yellow-600/10 rounded-full blur-3xl -z-10"></div>
            <textarea
              value={formData.remarks || ''}
              onChange={(e) => handleInputChange('remarks', e.target.value)}
              rows={3}
              className="relative z-10 w-full px-4 py-3 border-2 border-amber-200 dark:border-amber-700 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-slate-900 dark:text-white text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
              placeholder="Additional remarks or notes..."
            />
          </div>
        </div>

        {/* Premium Actions */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-lg p-6">
          <FormActions
            onSave={handleSave}
            onCancel={handleCancel}
            saveLabel={recordId ? 'Update Record' : 'Save Record'}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
};

export default Form137Editor;
