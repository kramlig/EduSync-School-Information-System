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
      className={`relative w-full py-2 px-4 text-center text-sm font-semibold transition-all duration-300 ${
        isOnline 
          ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border-b border-blue-200 dark:border-blue-800' 
          : 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border-b border-amber-200 dark:border-amber-800'
      }`}
      role="status"
      aria-live="polite"
    >
      {isOnline ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>
            ✓ Connection restored. 
            {pendingWrites > 0 && ` Syncing ${pendingWrites} pending change${pendingWrites > 1 ? 's' : ''}...`}
            {pendingWrites === 0 && ' All changes saved.'}
          </span>
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>
            ℹ️ Offline Mode: You can continue working. Changes will sync automatically when connection is restored.
            {pendingWrites > 0 && ` • ${pendingWrites} change${pendingWrites > 1 ? 's' : ''} pending`}
          </span>
        </span>
      )}
    </div>
  );
};

export default OfflineBanner;
