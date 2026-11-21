import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || '';

export const isSupabaseConfigured: boolean = Boolean(supabaseUrl && supabasePublishableKey);

export const supabaseConfigError: string | null = isSupabaseConfigured
  ? null
  : `Missing Supabase environment variable(s): ${[
      !supabaseUrl && 'VITE_SUPABASE_URL',
      !supabasePublishableKey && 'VITE_SUPABASE_PUBLISHABLE_KEY',
    ]
      .filter(Boolean)
      .join(', ')}. Configure them in .env.local for local development or in your hosting environment settings.`;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null;

export function requireSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(supabaseConfigError || 'Supabase client is not configured.');
  }
  return supabase;
}

