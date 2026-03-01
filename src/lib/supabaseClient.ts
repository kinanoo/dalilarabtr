import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Server client — plain anon key, no auth session (for server components / API routes)
const serverClient: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Browser client singleton — reads auth cookies → RLS admin policies work
let _browserClient: SupabaseClient | null = null;
function getBrowserClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!_browserClient) {
    _browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return _browserClient;
}

// Smart export: auth-aware in browser (reads cookies), plain on server
// - Server components: anon key → public reads only (correct)
// - Client components: auth cookies → admin RLS policies work (correct)
export const supabase: SupabaseClient | null =
  typeof window !== 'undefined' ? getBrowserClient() : serverClient;

// Explicit function (kept for backward compatibility)
export function getAuthClient() {
  if (typeof window === 'undefined') return serverClient;
  return getBrowserClient();
}
