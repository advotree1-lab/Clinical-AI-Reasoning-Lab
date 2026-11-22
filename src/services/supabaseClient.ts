import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || '';

export const isSupabaseConfigured: boolean = Boolean(supabaseUrl && supabasePublishableKey);

export const supabaseConfigError: string | null = isSupabaseConfigured
  ? null
  : 'The research platform backend is not yet configured in this environment. Please contact the Principal Investigator or platform administrator.';

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null;

export function requireSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(supabaseConfigError || 'Research platform service is currently unavailable.');
  }
  return supabase;
}

