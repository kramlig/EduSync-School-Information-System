import { useState, useEffect, useRef } from 'react';

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
  const isOnlineRef = useRef(navigator.onLine); // Track current state for polling

  useEffect(() => {
    // Update ref whenever state changes
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  useEffect(() => {
    const handleOnline = () => {
      console.log('[Network] 🟢 Back online');
      setIsOnline(true);
      setWasOffline(true);
      // Auto-clear "wasOffline" flag after 5 seconds
      setTimeout(() => {
        setWasOffline(false);
      }, 5000);
    };

    const handleOffline = () => {
      console.log('[Network] 🔴 Gone offline');
      setIsOnline(false);
      setWasOffline(false); // Reset when going offline
    };

    // Listen to browser online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Poll navigator.onLine for DevTools offline mode (which doesn't fire events)
    // This is a workaround because DevTools Network throttling doesn't trigger window events
    const pollInterval = setInterval(() => {
      const currentOnlineStatus = navigator.onLine;
      if (currentOnlineStatus !== isOnlineRef.current) {
        console.log('[Network] 🔄 Detected status change via polling:', currentOnlineStatus);
        if (currentOnlineStatus) {
          handleOnline();
        } else {
          handleOffline();
        }
      }
    }, 1000); // Check every second

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(pollInterval);
    };
  }, []); // Empty deps - set up once

  return { isOnline, wasOffline };
};
