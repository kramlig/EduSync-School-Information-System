import { useState, useEffect } from 'react';

/**
 * Hook to detect online/offline status
 * 
 * Returns:
 * - isOnline: Current connection status
 * - wasOffline: Whether user was offline and just came back (for showing "back online" message)
 * 
 * Example:
 * const { isOnline, wasOffline } = useOnlineStatus();
 * if (!isOnline) return <OfflineBanner />;
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('[Network] 🟢 Back online');
      setIsOnline(true);
      // If user was offline before, mark for temporary "back online" message
      if (!isOnline) {
        setWasOffline(true);
        // Auto-clear "wasOffline" flag after 5 seconds
        setTimeout(() => {
          setWasOffline(false);
        }, 5000);
      }
    };

    const handleOffline = () => {
      console.log('[Network] 🔴 Gone offline');
      setIsOnline(false);
      setWasOffline(false); // Reset when going offline
    };

    // Listen to browser online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]); // Re-run when isOnline changes

  return { isOnline, wasOffline };
};
