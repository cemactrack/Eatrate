import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for client-side usage
// This uses the public anon key which has limited permissions
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Validate that we have the required configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase URL or Anon Key is missing. Please check your environment variables.'
  );
}

// Create the client with the public anon key
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!supabase;
};

// Helper function to get the current user
export const getCurrentUser = async () => {
  if (!supabase) return null;
  
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error.message);
    return null;
  }
  
  return data?.user || null;
};

// Helper function to get the current session
export const getCurrentSession = async () => {
  if (!supabase) return null;
  
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting current session:', error.message);
    return null;
  }
  
  return data?.session || null;
};