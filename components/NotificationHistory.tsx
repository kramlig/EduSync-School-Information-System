/**
 * NotificationHistory - View notification history for parent
 * 
 * Displays all notifications sent to the parent:
 * - Type (grade, absence, announcement)
 * - Channel (email only for now)
 * - Status (queued, sent, failed)
 * - Timestamp
 * - Details and links
 */

import React, { useState, useEffect } from 'react';
import { getFirestoreInstance } from '../src/services/firestoreService';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useSchoolContext } from '../src/contexts/SchoolContext';
import type { ParentUser } from '../types';
import { BellIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from './icons';

interface Notification {
  id: string;
  type: 'grade_alert' | 'absence_alert' | 'announcement_alert';
  channel: 'email' | 'sms';
  status: 'queued' | 'sent' | 'failed';
  parentEmail: string;
  timestamp: Date;
  metadata?: {
    emailDocId?: string;
    studentName?: string;
    announcementTitle?: string;
  };
  studentName?: string;
  announcementTitle?: string;
  date?: string;
  reason?: string;
}

interface NotificationHistoryProps {
  parent: ParentUser;
}

const NotificationHistory: React.FC<NotificationHistoryProps> = ({ parent }) => {
  const { schoolId } = useSchoolContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'email' | 'sms'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'grade_alert' | 'absence_alert' | 'announcement_alert'>('all');

  useEffect(() => {
    loadNotifications();
  }, [parent.email, schoolId]);

  const loadNotifications = async () => {
    if (!schoolId) {
      console.warn('[NotificationHistory] No schoolId - skipping loadNotifications');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const db = getFirestoreInstance();
      const notificationsRef = collection(db, 'notifications');
      
      // Query notifications for this parent and school
      const q = query(
        notificationsRef,
        where('schoolId', '==', schoolId),
        where('parentEmail', '==', parent.email),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      
      const notificationsList: Notification[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type,
          channel: data.channel,
          status: data.status || 'queued',
          parentEmail: data.parentEmail,
          timestamp: data.timestamp?.toDate() || new Date(),
          metadata: data.metadata,
          studentName: data.studentName,
          announcementTitle: data.announcementTitle,
          date: data.date,
          reason: data.reason,
        };
      });

      setNotifications(notificationsList);
    } catch (err) {
      console.error('[NotificationHistory] Error loading notifications:', err);
      setError('Failed to load notification history');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter !== 'all' && n.channel !== filter) return false;
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    return true;
  });

  // Format notification type for display
  const formatType = (type: string) => {
    switch (type) {
      case 'grade_alert': return '📊 Grade Alert';
      case 'absence_alert': return '⚠️ Absence Alert';
      case 'announcement_alert': return '📢 Announcement';
      default: return type;
    }
  };

  // Format channel for display
  const formatChannel = (channel: string) => {
    switch (channel) {
      case 'email': return '📧 Email';
      case 'sms': return '📱 SMS';
      default: return channel;
    }
  };

  // Status badge component
  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    switch (status) {
      case 'sent':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Sent
          </span>
        );
      case 'queued':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <ClockIcon className="w-4 h-4 mr-1" />
            Queued
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <span className="w-4 h-4 mr-1"><XCircleIcon /></span>
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6 flex items-center">
        <BellIcon className="w-6 h-6 mr-2" />
        Notification History
      </h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
            Channel
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('email')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                filter === 'email'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              📧 Email
            </button>
            <button
              onClick={() => setFilter('sms')}
              className={`px-3 py-1 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed ${
                filter === 'sms'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}
              disabled
            >
              📱 SMS
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
            Type
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                typeFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('grade_alert')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                typeFilter === 'grade_alert'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              📊 Grades
            </button>
            <button
              onClick={() => setTypeFilter('absence_alert')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                typeFilter === 'absence_alert'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              ⚠️ Absence
            </button>
            <button
              onClick={() => setTypeFilter('announcement_alert')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                typeFilter === 'announcement_alert'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              📢 Announcements
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Loading notifications...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300">{error}</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-8">
          <BellIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-600 dark:text-slate-400">No notifications found</p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
            Notifications will appear here when you receive alerts
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-slate-800 dark:text-white">
                      {formatType(notification.type)}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">•</span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {formatChannel(notification.channel)}
                    </span>
                  </div>
                  
                  {notification.studentName && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      <strong>Student:</strong> {notification.studentName}
                    </p>
                  )}
                  
                  {notification.announcementTitle && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      <strong>Subject:</strong> {notification.announcementTitle}
                    </p>
                  )}
                  
                  {notification.reason && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 italic">
                      "{notification.reason}"
                    </p>
                  )}
                  
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                    {notification.timestamp.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </p>
                </div>
                
                <div className="ml-4">
                  <StatusBadge status={notification.status} />
                  
                  {notification.metadata?.emailDocId && (
                    <a
                      href={`https://console.firebase.google.com/project/${process.env.VITE_FIREBASE_PROJECT_ID}/firestore/data/mail/${notification.metadata.emailDocId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View Details →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {!isLoading && notifications.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {notifications.filter(n => n.status === 'sent').length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Sent</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {notifications.filter(n => n.status === 'queued').length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Queued</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {notifications.filter(n => n.status === 'failed').length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Failed</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationHistory;
