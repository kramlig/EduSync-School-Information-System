/**
 * useAnalyticsDashboard Hook
 * 
 * Fetches and aggregates analytics events for the dashboard.
 * Computes: active users, page popularity, user distribution, login trends, etc.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, limit, Timestamp } from 'firebase/firestore';
import { getFirestoreInstance } from '../services/firestoreService';
import type { AnalyticsEvent } from '../services/analyticsService';

export interface AnalyticsSummary {
  // Current state
  activeUsersNow: number;
  totalEventsToday: number;
  totalPageViewsToday: number;
  totalLoginsToday: number;
  totalErrorsToday: number;
  uniqueUsersToday: number;

  // User distribution
  usersByRole: Record<string, number>;
  usersByType: Record<string, number>;
  usersByTier: Record<string, number>;

  // Page analytics
  topPages: { page: string; views: number; uniqueUsers: number }[];
  
  // Time series (hourly for today)
  hourlyActivity: { hour: number; pageViews: number; logins: number; uniqueUsers: number }[];

  // User sessions
  averageSessionPages: number;
  recentSessions: { userId: string; userName: string; userEmail: string; userRole: string; schoolName: string; lastPage: string; lastSeen: Date; pageCount: number }[];

  // Errors
  recentErrors: { page: string; error: string; userName: string; timestamp: Date }[];

  // Schools
  schoolActivity: { schoolId: string; schoolName: string; events: number; uniqueUsers: number }[];

  // Raw events for detail view
  events: AnalyticsEvent[];
}

interface UseAnalyticsDashboardOptions {
  schoolId?: string; // undefined = superadmin sees all
  dateRange: { start: Date; end: Date };
}

export function useAnalyticsDashboard({ schoolId, dateRange }: UseAnalyticsDashboardOptions) {
  const [events, setEvents] = useState<(AnalyticsEvent & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const constraints: any[] = [
        where('timestamp', '>=', Timestamp.fromDate(dateRange.start)),
        where('timestamp', '<=', Timestamp.fromDate(dateRange.end)),
        orderBy('timestamp', 'desc'),
        limit(10000),
      ];

      if (schoolId) {
        constraints.unshift(where('schoolId', '==', schoolId));
      }

      const db = getFirestoreInstance();
      const q = query(collection(db, 'analyticsEvents'), ...constraints);
      const snapshot = await getDocs(q);
      
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as (AnalyticsEvent & { id: string })[];
      
      setEvents(data);
    } catch (err: any) {
      console.error('[AnalyticsDashboard] Failed to fetch events:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [schoolId, dateRange.start.getTime(), dateRange.end.getTime()]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Compute summary
  const summary: AnalyticsSummary = useMemo(() => {
    const now = new Date();
    const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000);
    
    // Events with parsed timestamps
    const parsed = events.map(e => ({
      ...e,
      ts: e.timestamp && typeof (e.timestamp as any).toDate === 'function' 
        ? (e.timestamp as any).toDate() as Date 
        : new Date(),
    }));

    // Active users (page_view in last 15 min)
    const recentEvents = parsed.filter(e => e.ts >= fifteenMinAgo);
    const activeUsersNow = new Set(recentEvents.map(e => e.userId)).size;

    // Today's numbers
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEvents = parsed.filter(e => e.ts >= todayStart);
    const totalEventsToday = todayEvents.length;
    const totalPageViewsToday = todayEvents.filter(e => e.eventType === 'page_view').length;
    const totalLoginsToday = todayEvents.filter(e => e.eventType === 'login').length;
    const totalErrorsToday = todayEvents.filter(e => e.eventType === 'error').length;
    const uniqueUsersToday = new Set(todayEvents.map(e => e.userId)).size;

    // User distribution (from unique users in the period)
    const userMap = new Map<string, AnalyticsEvent>();
    for (const e of parsed) {
      if (!userMap.has(e.userId)) {
        userMap.set(e.userId, e);
      }
    }
    const uniqueUsers = Array.from(userMap.values());

    const usersByRole: Record<string, number> = {};
    const usersByType: Record<string, number> = {};
    const usersByTier: Record<string, number> = {};
    for (const u of uniqueUsers) {
      usersByRole[u.userRole || 'unknown'] = (usersByRole[u.userRole || 'unknown'] || 0) + 1;
      usersByType[u.userType || 'unknown'] = (usersByType[u.userType || 'unknown'] || 0) + 1;
      usersByTier[u.tier || 'school'] = (usersByTier[u.tier || 'school'] || 0) + 1;
    }

    // Top pages
    const pageMap = new Map<string, { views: number; users: Set<string> }>();
    for (const e of parsed.filter(e => e.eventType === 'page_view')) {
      if (!pageMap.has(e.page)) {
        pageMap.set(e.page, { views: 0, users: new Set() });
      }
      const p = pageMap.get(e.page)!;
      p.views++;
      p.users.add(e.userId);
    }
    const topPages = Array.from(pageMap.entries())
      .map(([page, { views, users }]) => ({ page, views, uniqueUsers: users.size }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 20);

    // Hourly activity for today
    const hourlyActivity: AnalyticsSummary['hourlyActivity'] = [];
    for (let h = 0; h < 24; h++) {
      const hourEvents = todayEvents.filter(e => e.ts.getHours() === h);
      hourlyActivity.push({
        hour: h,
        pageViews: hourEvents.filter(e => e.eventType === 'page_view').length,
        logins: hourEvents.filter(e => e.eventType === 'login').length,
        uniqueUsers: new Set(hourEvents.map(e => e.userId)).size,
      });
    }

    // Average session pages
    const sessionGroups = new Map<string, number>();
    for (const e of parsed.filter(e => e.eventType === 'page_view')) {
      sessionGroups.set(e.sessionId, (sessionGroups.get(e.sessionId) || 0) + 1);
    }
    const sessionCounts = Array.from(sessionGroups.values());
    const averageSessionPages = sessionCounts.length > 0
      ? Math.round((sessionCounts.reduce((a, b) => a + b, 0) / sessionCounts.length) * 10) / 10
      : 0;

    // Recent sessions (last activity per user)
    const userSessionMap = new Map<string, { userName: string; userEmail: string; userRole: string; schoolName: string; lastPage: string; lastSeen: Date; pageCount: number }>();
    for (const e of parsed) {
      const existing = userSessionMap.get(e.userId);
      if (!existing || e.ts > existing.lastSeen) {
        userSessionMap.set(e.userId, {
          userName: e.userName || e.userEmail || e.userId,
          userEmail: e.userEmail || '',
          userRole: e.userRole || 'unknown',
          schoolName: e.schoolName || e.schoolId || '',
          lastPage: e.page,
          lastSeen: e.ts,
          pageCount: (existing?.pageCount || 0) + (e.eventType === 'page_view' ? 1 : 0),
        });
      } else if (e.eventType === 'page_view') {
        existing.pageCount++;
      }
    }
    const recentSessions = Array.from(userSessionMap.entries())
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
      .slice(0, 50);

    // Recent errors
    const recentErrors = parsed
      .filter(e => e.eventType === 'error')
      .slice(0, 20)
      .map(e => ({
        page: e.page,
        error: (e.metadata?.error as string) || 'Unknown error',
        userName: e.userName || e.userEmail || e.userId,
        timestamp: e.ts,
      }));

    // School activity
    const schoolMap = new Map<string, { schoolName: string; events: number; users: Set<string> }>();
    for (const e of parsed) {
      if (!e.schoolId) continue;
      if (!schoolMap.has(e.schoolId)) {
        schoolMap.set(e.schoolId, { schoolName: e.schoolName || e.schoolId, events: 0, users: new Set() });
      }
      const s = schoolMap.get(e.schoolId)!;
      s.events++;
      s.users.add(e.userId);
    }
    const schoolActivity = Array.from(schoolMap.entries())
      .map(([schoolId, { schoolName, events, users }]) => ({ schoolId, schoolName, events, uniqueUsers: users.size }))
      .sort((a, b) => b.events - a.events);

    return {
      activeUsersNow,
      totalEventsToday,
      totalPageViewsToday,
      totalLoginsToday,
      totalErrorsToday,
      uniqueUsersToday,
      usersByRole,
      usersByType,
      usersByTier,
      topPages,
      hourlyActivity,
      averageSessionPages,
      recentSessions,
      recentErrors,
      schoolActivity,
      events: parsed,
    };
  }, [events]);

  return { summary, loading, error, refetch: fetchEvents };
}
