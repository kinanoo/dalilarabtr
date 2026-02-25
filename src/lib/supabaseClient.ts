import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// General client — works on server & client (no auth session)
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Authenticated browser client — has auth session via cookies
// Use for operations that need auth.uid() (update, delete own content)
export function getAuthClient() {
  if (typeof window === 'undefined' || !supabaseUrl || !supabaseAnonKey) return supabase;
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
