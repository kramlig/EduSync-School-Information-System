/**
 * Supabase Client Configuration
 * 
 * This module initializes the Supabase client for PostgreSQL database access.
 * Replaces direct Firestore access while keeping Firebase Auth.
 * 
 * Environment Variables Required:
 * - VITE_SUPABASE_URL: Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Supabase anonymous key (public)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check .env.local file.'
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // We're using Firebase Auth, so disable Supabase Auth
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
  realtime: {
    // Throttle realtime events to reduce bandwidth
    params: {
      eventsPerSecond: 2,
    },
  },
});

/**
 * Database Types (Auto-generated from Supabase schema)
 * TODO: Generate types using: npx supabase gen types typescript --project-id <project-id>
 */
export type Database = {
  public: {
    Tables: {
      schools: any;
      users: any;
      teachers: any;
      students: any;
      sections: any;
      learning_areas: any;
      grades: any;
      core_values: any;
      core_value_grades: any;
      parents: any;
      parent_students: any;
      class_schedules: any;
      attendance_records: any;
      assignments: any;
    };
  };
};

export default supabase;
