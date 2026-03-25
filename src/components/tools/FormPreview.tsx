import { useState } from 'react';
import type { FormType, SchoolInfo } from './types';
import { FORM_LABELS } from './types';
import type { UploadResult } from './DataUploader';
import { canDownload, recordDownload, downloadsRemaining } from '../../services/tools/rateLimiter';
import { generateSF5Standalone } from '../../services/tools/sf5StandaloneGenerator';
import { generateSF9Standalone } from '../../services/tools/sf9StandaloneGenerator';
import { generateSF2Standalone } from '../../services/tools/sf2StandaloneGenerator';

interface Props {
  formType: FormType;
  schoolInfo: SchoolInfo;
  uploadResult: UploadResult;
}

export default function FormPreview({ formType, schoolInfo, uploadResult }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const remaining = downloadsRemaining();
  const allowed = canDownload();
  const info = FORM_LABELS[formType];

  const studentCount = formType === 'sf5'
    ? uploadResult.sf5Data?.length ?? 0
    : formType === 'sf9'
      ? new Set(uploadResult.sf9Data?.map(r => r.lrn)).size
      : uploadResult.sf2Data?.length ?? 0;

  const handleGenerate = async () => {
    if (!allowed) return;
    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      const sharedInfo = {
        schoolInfo: {
          name: schoolInfo.name,
          schoolId: schoolInfo.schoolId,
          division: schoolInfo.division,
          region: schoolInfo.region,
          district: schoolInfo.district,
        },
        schoolYear: schoolInfo.schoolYear,
        gradeLevel: schoolInfo.gradeLevel,
        sectionName: schoolInfo.sectionName,
        adviserName: schoolInfo.adviserName,
      };

      if (formType === 'sf5' && uploadResult.sf5Data) {
        await generateSF5Standalone({
          ...sharedInfo,
          students: uploadResult.sf5Data,
          addWatermark: true,
        });
      } else if (formType === 'sf9' && uploadResult.sf9Data) {
        await generateSF9Standalone({
          ...sharedInfo,
          rows: uploadResult.sf9Data,
          applyWatermark: true,
        });
      } else if (formType === 'sf2' && uploadResult.sf2Data && uploadResult.reportMonth) {
        await generateSF2Standalone({
          schoolName: schoolInfo.name,
          schoolId: schoolInfo.schoolId,
          district: schoolInfo.district,
          division: schoolInfo.division,
          region: schoolInfo.region,
          schoolYear: schoolInfo.schoolYear,
          gradeLevel: String(schoolInfo.gradeLevel),
          sectionName: schoolInfo.sectionName,
          adviserName: schoolInfo.adviserName,
          reportMonth: uploadResult.reportMonth,
          students: uploadResult.sf2Data,
          applyWatermark: true,
        });
      }

      recordDownload();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Review & Download</h2>
        <p className="text-gray-500 mt-1">
          Verify the details below, then generate your <strong>{info.label}</strong> PDF.
        </p>
      </div>

      {/* Summary card */}
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        <SummaryRow label="Form Type" value={`${info.label} — ${info.description}`} />
        <SummaryRow label="School" value={schoolInfo.name || '—'} />
        <SummaryRow label="School Year" value={schoolInfo.schoolYear || '—'} />
        <SummaryRow label="Grade & Section" value={`Grade ${schoolInfo.gradeLevel} — ${schoolInfo.sectionName || '—'}`} />
        <SummaryRow label="Adviser" value={schoolInfo.adviserName || '—'} />
        {uploadResult.reportMonth && (
          <SummaryRow label="Report Month" value={uploadResult.reportMonth} />
        )}
        <SummaryRow label="Data File" value={uploadResult.fileName} />
        <SummaryRow label="Students" value={String(studentCount)} />
        <SummaryRow
          label="Data Validation"
          value={uploadResult.validation.errors.length === 0 ? '✓ All valid' : `⚠ ${uploadResult.validation.errors.length} issues`}
          warn={uploadResult.validation.errors.length > 0}
        />
      </div>

      {/* Rate-limit warning */}
      {!allowed && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-sm text-red-700">
          <strong>Daily limit reached.</strong> Free accounts can generate up to 3 PDFs per day.
          Come back tomorrow or create a free EduSync account for higher limits.
        </div>
      )}

      {/* Remaining downloads */}
      {allowed && (
        <div className="text-sm text-gray-500">
          {remaining} free download{remaining !== 1 ? 's' : ''} remaining today.
        </div>
      )}

      {/* Validation errors blocking download */}
      {uploadResult.validation.errors.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded text-sm text-yellow-700">
          Your data has validation issues. The PDF will still generate, but some values may be
          inaccurate. Consider fixing the errors in your spreadsheet and re-uploading.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded text-sm text-green-700">
          ✓ PDF downloaded successfully! Check your browser's downloads folder.
        </div>
      )}

      {/* Generate button */}
      <button
        type="button"
        disabled={!allowed || isGenerating}
        onClick={handleGenerate}
        className={`
          w-full sm:w-auto px-8 py-3 rounded-lg font-semibold text-white transition-colors
          ${allowed && !isGenerating
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-gray-400 cursor-not-allowed'
          }
        `}
      >
        {isGenerating ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating PDF…
          </span>
        ) : success ? (
          '↻ Generate Again'
        ) : (
          `⬇ Download ${info.label} PDF`
        )}
      </button>

      {/* Watermark notice */}
      <p className="text-xs text-gray-400">
        Free-tier PDFs include a small EduSync watermark footer. Create an account to remove it.
      </p>
    </div>
  );
}

/* ---------- Summary row ---------- */

function SummaryRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex px-4 py-3 text-sm">
      <span className="w-40 shrink-0 font-medium text-gray-600">{label}</span>
      <span className={warn ? 'text-yellow-600 font-medium' : 'text-gray-800'}>{value}</span>
    </div>
  );
}
