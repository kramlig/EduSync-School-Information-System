/**
 * Toast - Notification toast component
 * 
 * Displays success, error, or info messages with optional undo action
 */

import React, { memo } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  undo?: () => void;
  onClose: () => void;
}

const TOAST_STYLES: Record<string, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
};

const Toast: React.FC<ToastProps> = memo(({ message, type, undo, onClose }) => {
  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg flex items-center justify-between gap-3 ${TOAST_STYLES[type]} animate-fade-in`}
      role="alert"
      aria-live="polite"
    >
      <span>{message}</span>
      <div className="flex gap-2">
        {undo && (
          <button
            onClick={() => {
              undo();
              onClose();
            }}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-semibold transition-colors"
          >
            Undo
          </button>
        )}
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white font-bold text-xl leading-none"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
});

Toast.displayName = 'Toast';

export default Toast;
export type { ToastProps };
