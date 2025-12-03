/**
 * useSchoolsPostgreSQL.ts
 * 
 * Hook for fetching schools list (used in enrollment school selection)
 * Public read-only hook - no authentication required
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface School {
  id: string;
  name: string; // Match component expectation
  schoolName?: string; // Keep for backwards compatibility
  schoolCode?: string;
  address?: string;
  barangay?: string;
  city?: string;
  province?: string;
  region?: string;
  zipCode?: string;
  contactEmail?: string;
  contactPhone?: string;
  principalName?: string;
  schoolType?: 'elementary' | 'high_school' | 'senior_high' | 'integrated';
  isActive: boolean;
  settings?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

interface UseSchoolsResult {
  schools: School[];
  loading: boolean;
  error: Error | null;
}

export function useSchoolsPostgreSQL(): UseSchoolsResult {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('schools')
          .select('*')
          .order('name', { ascending: true });

        if (fetchError) throw fetchError;

        const transformed = (data || []).map(row => ({
          id: row.id,
          name: row.name, // Primary property for component
          schoolName: row.name, // Backwards compatibility
          schoolCode: row.school_id_number,
          address: row.address,
          barangay: row.barangay,
          city: row.city,
          province: row.province,
          region: row.region,
          zipCode: row.zip_code,
          contactEmail: row.contact_email,
          contactPhone: row.contact_phone,
          principalName: row.principal_name,
          schoolType: row.school_type,
          isActive: true, // All schools in table are active for enrollment
          settings: row.settings,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));

        setSchools(transformed);
      } catch (err) {
        console.error('[useSchoolsPostgreSQL] Fetch error:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        
        // Check if it's a table not found error (400)
        if (errorMessage.includes('relation "public.schools" does not exist') || 
            errorMessage.includes('does not exist')) {
          setError(new Error('Schools table not found. Please run the database migration: 009_create_schools_table.sql'));
        } else {
          setError(err instanceof Error ? err : new Error('Failed to fetch schools'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  return { schools, loading, error };
}
