/**
 * useAnnouncementsPostgreSQL Hook
 * 
 * React hook for managing school announcements with PostgreSQL backend.
 * Provides real-time updates via Supabase subscriptions.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Type definitions (matching Firestore Announcement type)
export interface Announcement {
  id: string;
  schoolId: string;
  title: string;
  content: string;
  date: string; // ISO date string
  target: 'all' | 'staff' | 'students' | 'parents';
  authorId?: string;
  authorName?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface UseAnnouncementsOptions {
  schoolId?: string;
  target?: 'all' | 'staff' | 'students' | 'parents';
  limit?: number;
}

interface UseAnnouncementsReturn {
  announcements: Announcement[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Announcement>;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
}

export function useAnnouncementsPostgreSQL(options: UseAnnouncementsOptions = {}): UseAnnouncementsReturn {
  const { schoolId, target, limit } = options;
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    if (!schoolId) {
      console.log('[useAnnouncementsPostgreSQL] No schoolId provided, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[useAnnouncementsPostgreSQL] Fetching announcements for schoolId:', schoolId);

      // Build query
      let query = supabase
        .from('announcements')
        .select('*')
        .eq('school_id', schoolId)
        .order('date', { ascending: false });

      // Apply filters
      if (target && target !== 'all') {
        query = query.or(`target.eq.all,target.eq.${target}`);
      }
      
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      console.log('[useAnnouncementsPostgreSQL] Raw data fetched:', data?.length, 'announcements');

      // Transform snake_case to camelCase
      const transformedData = (data || []).map((row: any) => ({
        id: row.id,
        schoolId: row.school_id,
        title: row.title,
        content: row.content,
        date: row.date,
        target: row.target,
        authorId: row.author_id,
        authorName: row.author_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      console.log('[useAnnouncementsPostgreSQL] Transformed data:', transformedData.length, 'announcements');
      console.log('[useAnnouncementsPostgreSQL] Sample announcement:', transformedData[0]);
      
      setAnnouncements(transformedData);
    } catch (err) {
      console.error('[useAnnouncementsPostgreSQL] Error fetching announcements:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [schoolId, target, limit]);

  // Initial fetch
  useEffect(() => {
    console.log('[useAnnouncementsPostgreSQL] useEffect triggered - calling fetchAnnouncements', { schoolId });
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Real-time subscription
  useEffect(() => {
    if (!schoolId) return;

    const channel: RealtimeChannel = supabase
      .channel(`announcements_${schoolId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
          filter: `school_id=eq.${schoolId}`
        },
        (payload) => {
          console.log('[useAnnouncementsPostgreSQL] Real-time update:', payload);
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [schoolId, fetchAnnouncements]);

  // CRUD operations
  const addAnnouncement = useCallback(async (announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          school_id: announcement.schoolId,
          title: announcement.title,
          content: announcement.content,
          date: announcement.date,
          target: announcement.target,
          author_id: announcement.authorId,
          author_name: announcement.authorName
        })
        .select()
        .single();

      if (error) throw error;

      const newAnnouncement: Announcement = {
        id: data.id,
        schoolId: data.school_id,
        title: data.title,
        content: data.content,
        date: data.date,
        target: data.target,
        authorId: data.author_id,
        authorName: data.author_name,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setAnnouncements(prev => [newAnnouncement, ...prev]);
      return newAnnouncement;
    } catch (err) {
      console.error('[useAnnouncementsPostgreSQL] Error adding announcement:', err);
      throw err;
    }
  }, []);

  const updateAnnouncement = useCallback(async (id: string, updates: Partial<Announcement>) => {
    try {
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.date !== undefined) updateData.date = updates.date;
      if (updates.target !== undefined) updateData.target = updates.target;
      if (updates.authorId !== undefined) updateData.author_id = updates.authorId;
      if (updates.authorName !== undefined) updateData.author_name = updates.authorName;

      const { error } = await supabase
        .from('announcements')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setAnnouncements(prev =>
        prev.map(a => (a.id === id ? { ...a, ...updates } : a))
      );
    } catch (err) {
      console.error('[useAnnouncementsPostgreSQL] Error updating announcement:', err);
      throw err;
    }
  }, []);

  const deleteAnnouncement = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('[useAnnouncementsPostgreSQL] Error deleting announcement:', err);
      throw err;
    }
  }, []);

  return {
    announcements,
    loading,
    error,
    refetch: fetchAnnouncements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
  };
}
