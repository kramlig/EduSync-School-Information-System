/**
 * Loading State Components
 * 
 * Loading indicators and skeleton screens for DepEd forms:
 * - FormSkeleton: Skeleton screen for forms
 * - LoadingSpinner: Centered spinner with message
 * - ProgressBar: Progress indicator with percentage
 * - ErrorState: Error display with retry action
 */

import React from 'react';

/**
 * Form Skeleton Component
 * Displays animated placeholder while form is loading
 */
interface FormSkeletonProps {
  lines?: number;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({ lines = 10 }) => {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mx-auto" />
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mx-auto" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mx-auto" />
      </div>

      {/* Student info skeleton */}
      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 space-y-3">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <div className="bg-slate-100 dark:bg-slate-800 p-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="p-3 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/5" />
            </div>
          ))}
        </div>
      </div>

      {/* Actions skeleton */}
      <div className="flex justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-24" />
        <div className="flex gap-2">
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-24" />
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-24" />
        </div>
      </div>
    </div>
  );
};

/**
 * Loading Spinner Component
 * Centered spinner with optional message
 */
interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div
        className={`${sizeClasses[size]} border-indigo-200 border-t-indigo-600 rounded-full animate-spin`}
      />
      {message && (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          {message}
        </p>
      )}
    </div>
  );
};

/**
 * Progress Bar Component
 * Shows progress percentage with animated bar
 */
interface ProgressBarProps {
  progress: number; // 0-100
  message?: string;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  message,
  showPercentage = true
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="w-full">
      {(message || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {message && (
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {message}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {clampedProgress}%
            </span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 transition-all duration-300 ease-out rounded-full"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Error State Component
 * Displays error message with retry action
 */
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'An error occurred',
  message,
  onRetry,
  retryLabel = 'Try Again'
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Error Icon */}
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-red-600 dark:text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* Error Message */}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md mb-4">
        {message}
      </p>

      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
};

/**
 * Success State Component
 * Displays success message with optional action
 */
interface SuccessStateProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  title = 'Success!',
  message,
  action
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Success Icon */}
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-green-600 dark:text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Success Message */}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md mb-4">
        {message}
      </p>

      {/* Action Button */}
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
 * Warning State Component
 * Displays warning message with optional action
 */
interface WarningStateProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const WarningState: React.FC<WarningStateProps> = ({
  title = 'Warning',
  message,
  action
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Warning Icon */}
      <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      {/* Warning Message */}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md mb-4">
        {message}
      </p>

      {/* Action Button */}
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
 * Card Skeleton Component
 * Skeleton for card-based layouts (e.g., FormsLibrary)
 */
export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
      <div className="space-y-4">
        {/* Icon */}
        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded" />
        
        {/* Title */}
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        
        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
        </div>
        
        {/* Stats */}
        <div className="flex gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
        </div>
      </div>
    </div>
  );
};

/**
 * Table Skeleton Component
 * Skeleton for table layouts
 */
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden animate-pulse">
      {/* Header */}
      <div className="bg-slate-100 dark:bg-slate-800 p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="h-4 bg-slate-200 dark:bg-slate-700 rounded" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-3">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-slate-200 dark:bg-slate-700 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
