import React, { useEffect, useState } from 'react';

interface OfflineBannerProps {
  isOnline: boolean;
  wasOffline: boolean;
  pendingWrites?: number;
}

/**
 * Banner that appears at the top of the screen to indicate offline status
 * 
 * States:
 * - Offline: Orange banner with warning
 * - Back online: Green banner with success message
 * - Normal online: Hidden
 * 
 * Props:
 * - isOnline: Current connection status
 * - wasOffline: Whether user just came back online
 * - pendingWrites: Number of pending changes to sync (optional)
 */
const OfflineBanner: React.FC<OfflineBannerProps> = ({ 
  isOnline, 
  wasOffline,
  pendingWrites = 0 
}) => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      // Show offline banner immediately
      setShowBanner(true);
    } else if (wasOffline) {
      // Show "back online" banner temporarily
      setShowBanner(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      // Normal online state - hide banner
      setShowBanner(false);
    }
  }, [isOnline, wasOffline]);

  if (!showBanner) return null;

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center text-sm font-semibold transition-all duration-300 ${
        isOnline 
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
          : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      }`}
      role="alert"
      aria-live="polite"
    >
      {isOnline ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>
            Back online. 
            {pendingWrites > 0 && ` Syncing ${pendingWrites} pending change${pendingWrites > 1 ? 's' : ''}...`}
            {pendingWrites === 0 && ' All changes saved.'}
          </span>
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>
            You're offline. Changes will be saved and synced when connection is restored.
          </span>
        </span>
      )}
    </div>
  );
};

export default OfflineBanner;
