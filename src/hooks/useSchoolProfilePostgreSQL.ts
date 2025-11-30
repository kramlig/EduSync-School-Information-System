/**
 * useSchoolProfilePostgreSQL - PostgreSQL School Profile Hook
 * 
 * Fetches basic school information from PostgreSQL schools table
 * Used by Header/Sidebar components to display school name and year
 * 
 * PostgreSQL Migration: ✅ COMPLETE (Nov 27, 2025)
 * - Replaces Firestore settings subscription
 * - Lightweight hook for navigation components
 * - Real-time updates via polling (1 minute intervals)
 */

import { useState, useEffect } from 'react';
import { useSchoolContext } from '../contexts/SchoolContext';
import { supabase } from '../lib/supabase';

interface SchoolProfile {
  name: string;
  current_school_year: string;
  region?: string;
  division?: string;
  district?: string;
}

interface UseSchoolProfileResult {
  schoolName: string;
  schoolYear: string;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches school profile from PostgreSQL
 * Updates every 60 seconds to catch settings changes
 */
export function useSchoolProfilePostgreSQL(): UseSchoolProfileResult {
  const { schoolId } = useSchoolContext();
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (!schoolId || schoolId === 'default') {
        if (isMounted) {
          setProfile({ name: 'School', current_school_year: '2023-2024' });
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('schools')
          .select('name, current_school_year, region, division, district')
          .eq('id', schoolId)
          .single();

        if (fetchError) throw fetchError;

        if (isMounted && data) {
          setProfile({
            name: data.name || 'School',
            current_school_year: data.current_school_year || '2023-2024',
            region: data.region,
            division: data.division,
            district: data.district
          });
          setError(null);
        }
      } catch (err) {
        console.error('[useSchoolProfilePostgreSQL] Error fetching profile:', err);
        if (isMounted) {
          setError('Failed to load school profile');
          // Fallback to defaults
          setProfile({ name: 'School', current_school_year: '2023-2024' });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchProfile();

    // Poll for updates every 60 seconds
    const interval = setInterval(fetchProfile, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [schoolId]);

  return {
    schoolName: profile?.name || 'School',
    schoolYear: profile?.current_school_year || '2023-2024',
    loading,
    error
  };
}
