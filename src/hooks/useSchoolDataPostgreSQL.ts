/**
 * useSchoolDataPostgreSQL Hook
 * 
 * Provides school settings and metadata from PostgreSQL via Supabase.
 * Replaces Firestore-based school data fetching during migration.
 * 
 * Features:
 * - Fetch school settings from PostgreSQL
 * - Real-time updates via Supabase subscriptions
 * - Automatic column name mapping (PostgreSQL snake_case to camelCase)
 * - Fallback to mock data during development
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { SchoolSettings } from '../../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Mock settings for development/fallback
const MOCK_SETTINGS: SchoolSettings = {
    schoolName: 'ENRIQUE URENCIA ELEMENTARY SCHOOL',
    region: 'Region XI',
    division: 'Division of the City of Mati',
    district: 'Governor Generoso North District',
    schoolYear: '2023-2024'
};

interface UseSchoolDataPostgreSQLOptions {
    schoolId: string | null; // null = fetch first/default school
    enableRealtime?: boolean; // Enable real-time subscriptions
}

interface UseSchoolDataPostgreSQLReturn {
    settings: SchoolSettings | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Hook to fetch school data from PostgreSQL
 * 
 * @param options - Configuration options
 * @returns School settings, loading state, error, and refetch function
 */
export function useSchoolDataPostgreSQL(
    options: UseSchoolDataPostgreSQLOptions
): UseSchoolDataPostgreSQLReturn {
    const { schoolId, enableRealtime = false } = options;
    
    const [settings, setSettings] = useState<SchoolSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    /**
     * Fetch school data from PostgreSQL
     */
    const fetchSchoolData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Query schools table
            let query = supabase
                .from('schools')
                .select('id, name, school_id_number, division, region, current_school_year, settings');
            
            // If schoolId provided, filter by it; otherwise get first school
            if (schoolId) {
                query = query.eq('id', schoolId);
            } else {
                query = query.limit(1);
            }
            
            const { data, error: fetchError } = await query.single();

            if (fetchError) {
                throw fetchError;
            }

            if (!data) {
                // Fallback to mock data if no school found
                setSettings(MOCK_SETTINGS);
                setLoading(false);
                return;
            }

            // Transform PostgreSQL data to SchoolSettings interface
            const transformedSettings: SchoolSettings = {
                schoolName: data.name || MOCK_SETTINGS.schoolName,
                region: data.region || MOCK_SETTINGS.region,
                division: data.division || MOCK_SETTINGS.division,
                district: (data.settings as any)?.district || MOCK_SETTINGS.district,
                schoolYear: data.current_school_year || MOCK_SETTINGS.schoolYear,
                schoolIdNumber: data.school_id_number, // Add school ID number
                
                // Optional fields from JSONB settings
                schoolType: (data.settings as any)?.schoolType,
                financialConfig: (data.settings as any)?.financialConfig,
                enrollmentConfig: (data.settings as any)?.enrollmentConfig,
            };

            setSettings(transformedSettings);
            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
            // Fallback to mock data on error
            setSettings(MOCK_SETTINGS);
            setLoading(false);
        }
    }, [schoolId]);

    // Initial fetch on mount
    useEffect(() => {
        if (!schoolId) {
            setSettings(MOCK_SETTINGS);
            setLoading(false);
            return;
        }

        fetchSchoolData();
    }, [schoolId, fetchSchoolData]);

    // Real-time subscription (optional)
    useEffect(() => {
        if (!enableRealtime || !schoolId) {
            return;
        }

        let channel: RealtimeChannel;

        const setupRealtimeSubscription = async () => {
            channel = supabase
                .channel(`school-${schoolId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'schools',
                        filter: `id=eq.${schoolId}`,
                    },
                    () => {
                        // Refetch on any change
                        fetchSchoolData();
                    }
                )
                .subscribe();
        };

        setupRealtimeSubscription();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [enableRealtime, schoolId, fetchSchoolData]);

    return {
        settings,
        loading,
        error,
        refetch: fetchSchoolData,
    };
}
