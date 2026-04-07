/**
 * AnalyticsTrackerProvider
 * 
 * Non-rendering component that auto-tracks page views on route changes.
 * Must be placed inside a Router component.
 */

import React from 'react';
import { useAnalyticsTracker } from '../../hooks/useAnalyticsTracker';
import type { AuthUser, StudentUser, ParentUser } from '../../types';

interface AnalyticsTrackerProviderProps {
  session: {
    user: AuthUser | StudentUser | ParentUser;
    type: 'staff' | 'student' | 'parent' | 'division' | 'personal';
  } | null;
  schoolName?: string;
}

const AnalyticsTrackerProvider: React.FC<AnalyticsTrackerProviderProps> = ({ session, schoolName }) => {
  useAnalyticsTracker({ session, schoolName });
  return null; // Non-rendering component
};

export default AnalyticsTrackerProvider;
