
import type { FormType } from './types';
import { FORM_LABELS } from './types';

interface Props {
  selected: FormType | null;
  onSelect: (type: FormType) => void;
}

const FORM_OPTIONS: { type: FormType; icon: string; available: boolean }[] = [
  { type: 'sf5', icon: '📊', available: true },
  { type: 'sf9', icon: '📝', available: true },
  { type: 'sf2', icon: '📋', available: true },
];

export default function FormTypeSelector({ selected, onSelect }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Select Form Type</h2>
        <p className="text-gray-500 mt-1">
          Choose the DepEd form you want to generate from your CSV/Excel data.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FORM_OPTIONS.map(({ type, icon, available }) => {
          const info = FORM_LABELS[type];
          const isSelected = selected === type;
          return (
            <button
              key={type}
              type="button"
              disabled={!available}
              onClick={() => onSelect(type)}
              className={`
                relative p-6 rounded-lg border-2 text-left transition-all
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : available
                    ? 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                    : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                }
              `}
            >
              {!available && (
                <span className="absolute top-2 right-2 text-xs bg-gray-200 text-gray-500 rounded px-2 py-0.5">
                  Coming Soon
                </span>
              )}
              <div className="text-3xl mb-3">{icon}</div>
              <div className="font-semibold text-gray-800">{info.label}</div>
              <div className="text-sm text-gray-500 mt-1">{info.description}</div>
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded text-sm text-blue-700">
        <strong>Free Tool:</strong> Upload a CSV or Excel file with your student data and download up to 3 DepEd-formatted PDFs per day — no account needed.
      </div>
    </div>
  );
}
