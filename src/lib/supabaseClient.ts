import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Server client — plain anon key, no auth session (for server components / API routes)
// Guarded: only create on the server to avoid a second GoTrueClient in the browser
const serverClient: SupabaseClient | null =
  typeof window === 'undefined' && supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

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

// Plain anon client for public reads (no auth session — bypasses RLS user-specific policies)
const ANON_KEY = '__daleel_supabase_anon' as const;
declare global {
  interface Window {
    [ANON_KEY]?: SupabaseClient;
  }
}
export function getAnonClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return serverClient;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!window[ANON_KEY]) {
    window[ANON_KEY] = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false, storageKey: 'sb-anon-public' },
    });
  }
  return window[ANON_KEY];
}

/**
 * Race a promise against a timeout. Returns fallback value on timeout.
 * Use for server-side Supabase queries to prevent pages from hanging.
 */
export function withTimeout<T>(promise: PromiseLike<T> | Promise<T>, ms = 8000): Promise<T | null> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<null>(resolve => setTimeout(() => {
      console.warn(`Supabase query timed out after ${ms}ms`);
      return resolve(null);
    }, ms)),
  ]);
}
