import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export const envOk = Boolean(supabaseUrl && supabaseAnonKey);

if (!envOk) {
  // Provide a clear signal in console for missing envs in dev
  // eslint-disable-next-line no-console
  console.error('Missing Supabase env: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
}

export const supabase = createClient(supabaseUrl || 'http://localhost', supabaseAnonKey || 'anon', {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});


