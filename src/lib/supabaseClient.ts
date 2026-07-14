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

/**
 * Client-side "is the user logged in?" check for UX guards.
 *
 * Reads the PERSISTED session (getSession) instead of getUser(). getUser() makes
 * a network round-trip to the Auth server to re-validate the JWT; on transient
 * network failures or access-token refresh timing it returns null even for a
 * genuinely logged-in member — which made dashboard guards and the "add service"
 * CTA bounce logged-in users to /login or /join. getSession() reads the stored
 * session instantly with no network call (the client refreshes the token in the
 * background), so it never false-negatives. This is a UX gate only; real security
 * stays enforced by RLS and by server-side getUser() in the API routes.
 */
export async function getClientUser() {
  const client = getAuthClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session?.user ?? null;
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

// Moved to '@/lib/withTimeout' so client components can use it WITHOUT
// statically importing this module (= all of supabase-js). Re-exported here
// for backward compatibility with existing (mostly server-side) importers.
export { withTimeout } from '@/lib/withTimeout';
