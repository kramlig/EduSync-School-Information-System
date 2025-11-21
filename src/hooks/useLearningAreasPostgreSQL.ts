import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Query result cache
const queryCache = new Map<string, { data: LearningArea[]; timestamp: number }>();
const CACHE_TTL = 60000; // 60 seconds - learning areas change rarely

interface LearningArea {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  gradeLevel?: number[];
  isComposite?: boolean;
  components?: string[];
  subSubjects?: string[];
  order?: number;
}

export function useLearningAreasPostgreSQL(schoolId?: string) {
  const [learningAreas, setLearningAreas] = useState<LearningArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchLearningAreas = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check cache first
        const cacheKey = schoolId || 'all';
        const cached = queryCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          setLearningAreas(cached.data);
          setLoading(false);
          return;
        }

        // Fetching learning areas

        let query = supabase
          .from('learning_areas')
          .select('*');

        // Only filter by schoolId if it's a valid UUID (not "default")
        if (schoolId && schoolId !== 'default') {
          query = query.eq('school_id', schoolId);
        }
        
        // Order by name if 'order' column doesn't exist
        query = query.order('name', { ascending: true });

        const { data, error: fetchError } = await query;

        // Query executed

        if (fetchError) throw fetchError;

        const transformed: LearningArea[] = (data || []).map(row => ({
          id: row.id,
          schoolId: row.school_id,
          name: row.name,
          code: row.code,
          gradeLevel: row.grade_levels,
          isComposite: row.is_composite,
          components: row.components,
          subSubjects: row.components, // Alias for compatibility
          order: row.order
        }));

        setLearningAreas(transformed);
        
        // Update cache
        queryCache.set(cacheKey, { data: transformed, timestamp: Date.now() });
        
      } catch (err) {
        console.error('[useLearningAreasPostgreSQL] Error:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchLearningAreas();
  }, [schoolId]);

  return { learningAreas, loading, error };
}
