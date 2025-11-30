/**
 * useSchoolSettingsPostgreSQL - PostgreSQL hook for school settings
 * 
 * Loads school profile and configuration from the schools table
 * Replaces hardcoded MOCK_SETTINGS with real database data
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { SchoolSettings } from '../../types';

interface UseSchoolSettingsOptions {
  schoolId?: string;
  enableRealtime?: boolean;
}

interface UseSchoolSettingsReturn {
  settings: SchoolSettings | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSchoolSettingsPostgreSQL(
  options: UseSchoolSettingsOptions = {}
): UseSchoolSettingsReturn {
  const { schoolId, enableRealtime = true } = options;
  
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!schoolId) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('schools')
        .select('*')
        .eq('id', schoolId)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        // Map PostgreSQL columns to SchoolSettings interface
        const mappedSettings: SchoolSettings = {
          schoolName: data.school_name || '',
          region: data.region || '',
          division: data.division || '',
          district: data.district || '',
          schoolYear: data.current_school_year || '2024-2025'
        };

        setSettings(mappedSettings);
      } else {
        setSettings(null);
      }
    } catch (err) {
      console.error('[useSchoolSettingsPostgreSQL] Error fetching settings:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  // Initial fetch
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Real-time subscription
  useEffect(() => {
    if (!enableRealtime || !schoolId) return;

    const channel = supabase
      .channel('school-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schools',
          filter: `id=eq.${schoolId}`
        },
        (payload: any) => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enableRealtime, schoolId, fetchSettings]);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings
  };
}
