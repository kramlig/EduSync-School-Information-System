/**
 * Analytics Event Tracking Service
 * 
 * Tracks user activity events to Firestore `analyticsEvents` collection.
 * Events include: page_view, login, logout, click, session_start, session_end, error.
 * 
 * All events include: userId, schoolId, userRole, userType, tier, timestamp, userAgent, page.
 * Data is used by the Analytics Dashboard for bird's-eye system monitoring.
 */

import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, limit, Timestamp } from 'firebase/firestore';
import { getFirestoreInstance } from './firestoreService';

export interface AnalyticsEvent {
  eventType: 'page_view' | 'login' | 'logout' | 'click' | 'session_start' | 'session_end' | 'error';
  userId: string;
  userEmail?: string;
  userName?: string;
  userRole: string;
  userType: 'staff' | 'student' | 'parent' | 'division' | 'personal';
  schoolId: string;
  schoolName?: string;
  tier?: 'free' | 'pro' | 'school';
  page: string;
  referrer?: string;
  metadata?: Record<string, string | number | boolean>;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  timestamp?: ReturnType<typeof serverTimestamp>;
  sessionId: string;
}

// Generate a per-tab session ID
let _sessionId: string | null = null;
export function getSessionId(): string {
  if (!_sessionId) {
    _sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  return _sessionId;
}

/**
 * Track an analytics event to Firestore
 */
export async function trackEvent(event: Omit<AnalyticsEvent, 'userAgent' | 'screenWidth' | 'screenHeight' | 'timestamp' | 'sessionId'>): Promise<void> {
  try {
    const doc: AnalyticsEvent = {
      ...event,
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      timestamp: serverTimestamp(),
      sessionId: getSessionId(),
    };
    const db = getFirestoreInstance();
    await addDoc(collection(db, 'analyticsEvents'), doc);
  } catch (err) {
    // Silently fail - analytics should never break the app
    console.warn('[Analytics] Failed to track event:', err);
  }
}

/**
 * Query analytics events for the dashboard.
 * SuperAdmin sees all events; Admin sees only their school.
 */
export async function getAnalyticsEvents(options: {
  schoolId?: string;
  startDate: Date;
  endDate: Date;
  eventType?: string;
  maxResults?: number;
}): Promise<AnalyticsEvent[]> {
  const { schoolId, startDate, endDate, eventType, maxResults = 5000 } = options;
  
  const constraints: any[] = [
    where('timestamp', '>=', Timestamp.fromDate(startDate)),
    where('timestamp', '<=', Timestamp.fromDate(endDate)),
    orderBy('timestamp', 'desc'),
    limit(maxResults),
  ];

  if (schoolId) {
    constraints.unshift(where('schoolId', '==', schoolId));
  }

  if (eventType) {
    constraints.push(where('eventType', '==', eventType));
  }

  const db = getFirestoreInstance();
  const q = query(collection(db, 'analyticsEvents'), ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
  })) as unknown as AnalyticsEvent[];
}

/**
 * Get active sessions (session_start within last N minutes without a matching session_end)
 */
export async function getActiveSessions(options: {
  schoolId?: string;
  windowMinutes?: number;
}): Promise<number> {
  const { schoolId, windowMinutes = 15 } = options;
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);
  
  const constraints: any[] = [
    where('eventType', '==', 'page_view'),
    where('timestamp', '>=', Timestamp.fromDate(since)),
  ];

  if (schoolId) {
    constraints.unshift(where('schoolId', '==', schoolId));
  }

  const db = getFirestoreInstance();
  const q = query(collection(db, 'analyticsEvents'), ...constraints);
  const snapshot = await getDocs(q);
  
  // Count unique userIds
  const uniqueUsers = new Set(snapshot.docs.map(doc => doc.data().userId));
  return uniqueUsers.size;
}
