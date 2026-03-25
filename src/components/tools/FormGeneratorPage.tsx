import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { FormType, SchoolInfo, WizardStep } from './types';
import { SCHOOL_INFO_CACHE_KEY } from './types';
import FormTypeSelector from './FormTypeSelector';
import SchoolInfoForm from './SchoolInfoForm';
import DataUploader from './DataUploader';
import type { UploadResult } from './DataUploader';
import FormPreview from './FormPreview';

const STEPS: { key: WizardStep; label: string; num: number }[] = [
  { key: 'select-form', label: 'Form Type', num: 1 },
  { key: 'school-info', label: 'School Info', num: 2 },
  { key: 'upload-data', label: 'Upload Data', num: 3 },
  { key: 'preview',     label: 'Download',   num: 4 },
];

function loadCachedSchoolInfo(): SchoolInfo {
  try {
    const raw = localStorage.getItem(SCHOOL_INFO_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { name: '', schoolId: '', division: '', region: '', district: '', schoolYear: '', gradeLevel: 0, sectionName: '', adviserName: '' };
}

export default function FormGeneratorPage() {
  const [step, setStep] = useState<WizardStep>('select-form');
  const [formType, setFormType] = useState<FormType | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(loadCachedSchoolInfo);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  useEffect(() => {
    document.title = 'Free DepEd Form Generator — EduSync';
    return () => { document.title = 'EduSync — School Information System for Filipino Educators'; };
  }, []);

  const currentIndex = STEPS.findIndex(s => s.key === step);

  // --- Validation per step ---
  const canProceedFromStep = (s: WizardStep): boolean => {
    switch (s) {
      case 'select-form': return formType !== null;
      case 'school-info': return !!(schoolInfo.name && schoolInfo.schoolYear && schoolInfo.gradeLevel && schoolInfo.sectionName);
      case 'upload-data': return uploadResult !== null;
      default: return false;
    }
  };

  const goNext = () => {
    if (currentIndex < STEPS.length - 1 && canProceedFromStep(step)) {
      setStep(STEPS[currentIndex + 1].key);
    }
  };
  const goBack = () => {
    if (currentIndex > 0) setStep(STEPS[currentIndex - 1].key);
  };

  const handleFormSelect = useCallback((type: FormType) => {
    setFormType(type);
    // Clear upload if form type changes
    setUploadResult(null);
  }, []);

  const handleDataReady = useCallback((result: UploadResult) => {
    setUploadResult(result);
  }, []);

  const handleClearData = useCallback(() => {
    setUploadResult(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors">
            <span className="text-xl font-bold">EduSync</span>
            <span className="text-sm text-gray-400">/ Free Tools</span>
          </Link>
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            DepEd Form Generator
          </h1>
          <p className="text-gray-500 mt-2">
            Upload your student data and download official DepEd forms as PDF — free, no account needed.
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            {STEPS.map((s, i) => {
              const isCompleted = i < currentIndex;
              const isCurrent = i === currentIndex;
              return (
                <React.Fragment key={s.key}>
                  {i > 0 && (
                    <div className={`hidden sm:block h-0.5 w-8 sm:w-12 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                        ${isCompleted ? 'bg-green-600 text-white'
                          : isCurrent ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'}
                      `}
                    >
                      {isCompleted ? '✓' : s.num}
                    </div>
                    <span className={`text-xs ${isCurrent ? 'text-blue-600 font-medium' : 'text-gray-400'} hidden sm:block`}>
                      {s.label}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
          {step === 'select-form' && (
            <FormTypeSelector selected={formType} onSelect={handleFormSelect} />
          )}
          {step === 'school-info' && (
            <SchoolInfoForm data={schoolInfo} onChange={setSchoolInfo} />
          )}
          {step === 'upload-data' && formType && (
            <DataUploader
              formType={formType}
              onDataReady={handleDataReady}
              onClear={handleClearData}
              currentResult={uploadResult}
            />
          )}
          {step === 'preview' && formType && uploadResult && (
            <FormPreview
              formType={formType}
              schoolInfo={schoolInfo}
              uploadResult={uploadResult}
            />
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={goBack}
            disabled={currentIndex === 0}
            className={`
              px-6 py-2 rounded-lg font-semibold transition-colors
              ${currentIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}
            `}
          >
            ← Previous
          </button>

          {currentIndex < STEPS.length - 1 && (
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceedFromStep(step)}
              className={`
                px-6 py-2 rounded-lg font-semibold transition-colors
                ${canProceedFromStep(step)
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Next →
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-xs text-gray-400">
          <p>
            This tool processes your data entirely in your browser. No data is uploaded to any server.
          </p>
          <p className="mt-1">
            <Link to="/" className="text-blue-500 hover:underline">EduSync SIS</Link> — School Information System for Filipino educators.
          </p>
        </div>
      </main>
    </div>
  );
}
