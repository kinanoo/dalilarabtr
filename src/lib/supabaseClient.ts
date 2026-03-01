import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Server client — plain anon key, no auth session (for server components / API routes)
const serverClient: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Window-level global key — survives Next.js code splitting across chunks
const GLOBAL_KEY = '__daleel_supabase_browser' as const;

// Extend Window type for the global singleton
declare global {
  interface Window {
    [GLOBAL_KEY]?: SupabaseClient;
  }
}

// Browser client singleton — uses window global to ensure ONE instance across all chunks
function getBrowserClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!window[GLOBAL_KEY]) {
    window[GLOBAL_KEY] = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return window[GLOBAL_KEY];
}

// Smart export: auth-aware in browser (reads cookies), plain on server
export const supabase: SupabaseClient | null =
  typeof window !== 'undefined' ? getBrowserClient() : serverClient;

// Explicit function for client components that need auth
export function getAuthClient() {
  if (typeof window === 'undefined') return serverClient;
  return getBrowserClient();
}
