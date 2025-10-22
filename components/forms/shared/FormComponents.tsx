/**
 * Reusable Form Components
 * 
 * Shared UI components for DepEd forms:
 * - FormHeader: Title, school info, student info
 * - SectionHeader: Section dividers within forms
 * - GradeTable: Display grades in table format
 * - InfoRow: Display label-value pairs
 * - FormActions: Save, Cancel, Print buttons
 */

import React from 'react';
import { PrinterIcon } from '../../icons';

/**
 * Form Header Component
 * Displays school letterhead, DepEd logo, and form title
 */
interface FormHeaderProps {
  formTitle: string;
  formCode?: string; // e.g., "SF1", "SF2"
  schoolName: string;
  schoolId?: string;
  schoolYear: string;
  deped?: {
    region?: string;
    division?: string;
    district?: string;
  };
}

export const FormHeader: React.FC<FormHeaderProps> = ({
  formTitle,
  formCode,
  schoolName,
  schoolId,
  schoolYear,
  deped
}) => {
  return (
    <div className="border-b-2 border-slate-300 dark:border-slate-600 pb-6 mb-6">
      {/* DepEd Letterhead */}
      <div className="text-center mb-4">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Republic of the Philippines
        </div>
        <div className="text-lg font-bold text-slate-900 dark:text-white">
          Department of Education
        </div>
        {deped?.region && (
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {deped.region}
          </div>
        )}
        {deped?.division && (
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {deped.division}
          </div>
        )}
        {deped?.district && (
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {deped.district}
          </div>
        )}
      </div>

      {/* Form Title */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          {formTitle}
        </h1>
        {formCode && (
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {formCode}
          </div>
        )}
      </div>

      {/* School Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">School: </span>
          <span className="text-slate-900 dark:text-white">{schoolName}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">School Year: </span>
          <span className="text-slate-900 dark:text-white">{schoolYear}</span>
        </div>
        {schoolId && (
          <div className="col-span-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">School ID: </span>
            <span className="text-slate-900 dark:text-white">{schoolId}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Section Header Component
 * Divider for sections within forms
 */
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, icon }) => {
  return (
    <div className="flex items-center gap-3 mb-4 mt-8">
      {icon && (
        <div className="text-indigo-600 dark:text-indigo-400">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      <div className="h-px bg-slate-300 dark:bg-slate-600 flex-1" />
    </div>
  );
};

/**
 * Info Row Component
 * Display label-value pairs in a consistent format
 */
interface InfoRowProps {
  label: string;
  value: string | number | React.ReactNode;
  inline?: boolean;
  bold?: boolean;
}

export const InfoRow: React.FC<InfoRowProps> = ({ label, value, inline = true, bold = false }) => {
  if (inline) {
    return (
      <div className="flex gap-2 text-sm">
        <span className="font-semibold text-slate-700 dark:text-slate-300">{label}:</span>
        <span className={`text-slate-900 dark:text-white ${bold ? 'font-bold' : ''}`}>
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="text-sm">
      <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</div>
      <div className={`text-slate-900 dark:text-white ${bold ? 'font-bold' : ''}`}>
        {value}
      </div>
    </div>
  );
};

/**
 * Grade Table Component
 * Display grades in a table format
 */
interface GradeTableColumn {
  header: string;
  accessor: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
}

interface GradeTableProps {
  columns: GradeTableColumn[];
  data: any[];
  stickyHeader?: boolean;
}

export const GradeTable: React.FC<GradeTableProps> = ({ columns, data, stickyHeader = false }) => {
  return (
    <div className="overflow-x-auto border border-slate-300 dark:border-slate-600 rounded-lg">
      <table className="w-full text-sm">
        <thead className={`bg-slate-100 dark:bg-slate-800 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={`px-4 py-3 text-${column.align || 'left'} font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-600`}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 last:border-0"
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-4 py-3 text-${column.align || 'left'} text-slate-900 dark:text-white`}
                  >
                    {column.render
                      ? column.render(row[column.accessor], row)
                      : row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Form Actions Component
 * Action buttons for forms (Save, Cancel, Print, etc.)
 */
interface FormActionsProps {
  onSave?: () => void;
  onCancel?: () => void;
  onPrint?: () => void;
  onExport?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  printLabel?: string;
  exportLabel?: string;
  isSaving?: boolean;
  disabled?: boolean;
}

export const FormActions: React.FC<FormActionsProps> = ({
  onSave,
  onCancel,
  onPrint,
  onExport,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  printLabel = 'Print',
  exportLabel = 'Export',
  isSaving = false,
  disabled = false
}) => {
  return (
    <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-300 dark:border-slate-600 mt-8">
      <div className="flex gap-2">
        {onPrint && (
          <button
            onClick={onPrint}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PrinterIcon />
            {printLabel}
          </button>
        )}
        {onExport && (
          <button
            onClick={onExport}
            disabled={disabled}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exportLabel}
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={disabled || isSaving}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cancelLabel}
          </button>
        )}
        {onSave && (
          <button
            onClick={onSave}
            disabled={disabled || isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : saveLabel}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Student Info Card
 * Display student information at the top of forms
 */
interface StudentInfoCardProps {
  studentName: string;
  lrn?: string;
  gradeLevel: number;
  section?: string;
  birthDate?: string;
  age?: number;
}

export const StudentInfoCard: React.FC<StudentInfoCardProps> = ({
  studentName,
  lrn,
  gradeLevel,
  section,
  birthDate,
  age
}) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-6 border border-slate-200 dark:border-slate-700">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="col-span-2">
          <InfoRow label="Student Name" value={studentName} bold />
        </div>
        {lrn && (
          <div>
            <InfoRow label="LRN" value={lrn} />
          </div>
        )}
        <div>
          <InfoRow label="Grade Level" value={gradeLevel === 0 ? 'Kinder' : `Grade ${gradeLevel}`} />
        </div>
        {section && (
          <div>
            <InfoRow label="Section" value={section} />
          </div>
        )}
        {birthDate && (
          <div>
            <InfoRow label="Birth Date" value={birthDate} />
          </div>
        )}
        {age !== undefined && (
          <div>
            <InfoRow label="Age" value={`${age} years old`} />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Empty State Component
 * Display when no data is available
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {icon && (
        <div className="text-slate-400 dark:text-slate-500 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md mb-4">
        {message}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

/**
 * Badge Component
 * Display status or labels
 */
interface BadgeProps {
  label: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'indigo' | 'purple' | 'gray';
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({ label, color = 'gray', size = 'md' }) => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
    gray: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${colorClasses[color]} ${sizeClasses[size]}`}>
      {label}
    </span>
  );
};
