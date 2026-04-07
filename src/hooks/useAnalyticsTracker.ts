/**
 * useAnalyticsTracker Hook
 * 
 * Automatically tracks page views on route changes and provides
 * utility functions for tracking custom events (clicks, errors, etc.).
 * 
 * Usage: Place in App layout once. It auto-tracks page_view on each navigation.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent, getSessionId } from '../services/analyticsService';
import type { AuthUser, StudentUser, ParentUser } from '../../types';

interface UseAnalyticsTrackerOptions {
  session: {
    user: AuthUser | StudentUser | ParentUser;
    type: 'staff' | 'student' | 'parent' | 'division' | 'personal';
  } | null;
  schoolName?: string;
}

function getUserFields(session: UseAnalyticsTrackerOptions['session'], schoolNameOverride?: string) {
  if (!session) return null;
  const user = session.user;
  
  const userId = String(('postgresqlId' in user && user.postgresqlId) || user.id || '');
  const userRole = ('role' in user && user.role) ? user.role : session.type;
  const tier = ('tier' in user && (user as any).tier) ? (user as any).tier : 'school';

  return {
    userId,
    userEmail: user.email || '',
    userName: user.name || '',
    userRole: userRole as string,
    userType: session.type as 'staff' | 'student' | 'parent' | 'division' | 'personal',
    schoolId: ('schoolId' in user ? user.schoolId : '') || '',
    schoolName: schoolNameOverride || ('schoolName' in user ? (user as any).schoolName : '') || '',
    tier: tier as 'free' | 'pro' | 'school',
  };
}

export function useAnalyticsTracker({ session, schoolName }: UseAnalyticsTrackerOptions) {
  const location = useLocation();
  const prevPathRef = useRef<string>('');
  const sessionTrackedRef = useRef(false);

  // Track session_start once
  useEffect(() => {
    if (!session || sessionTrackedRef.current) return;
    sessionTrackedRef.current = true;
    const fields = getUserFields(session, schoolName);
    if (!fields) return;

    trackEvent({
      eventType: 'session_start',
      ...fields,
      page: location.pathname,
    });

    // Track session_end on unload
    const handleUnload = () => {
      // Use sendBeacon for reliability on page close
      const payload = JSON.stringify({
        eventType: 'session_end',
        ...fields,
        page: location.pathname,
        sessionId: getSessionId(),
        timestamp: new Date().toISOString(),
      });
      // Best-effort: sendBeacon doesn't guarantee Firestore write, but we catch it
      navigator.sendBeacon?.('/api/analytics-beacon', payload);
      // Also try the direct approach (may not complete)
      trackEvent({
        eventType: 'session_end',
        ...fields,
        page: location.pathname,
      });
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [session, location.pathname]);

  // Track page_view on route change
  useEffect(() => {
    if (!session) return;
    const currentPath = location.pathname;
    
    // Skip duplicate tracking for same path
    if (currentPath === prevPathRef.current) return;
    prevPathRef.current = currentPath;

    const fields = getUserFields(session, schoolName);
    if (!fields) return;

    trackEvent({
      eventType: 'page_view',
      ...fields,
      page: currentPath,
      referrer: document.referrer || undefined,
    });
  }, [location.pathname, session, schoolName]);

  // Utility: track custom click events
  const trackClick = useCallback((elementName: string, metadata?: Record<string, string | number | boolean>) => {
    if (!session) return;
    const fields = getUserFields(session, schoolName);
    if (!fields) return;

    trackEvent({
      eventType: 'click',
      ...fields,
      page: location.pathname,
      metadata: { element: elementName, ...metadata },
    });
  }, [session, location.pathname, schoolName]);

  // Utility: track errors
  const trackError = useCallback((errorMessage: string, metadata?: Record<string, string | number | boolean>) => {
    if (!session) return;
    const fields = getUserFields(session, schoolName);
    if (!fields) return;

    trackEvent({
      eventType: 'error',
      ...fields,
      page: location.pathname,
      metadata: { error: errorMessage, ...metadata },
    });
  }, [session, location.pathname, schoolName]);

  return { trackClick, trackError };
}
