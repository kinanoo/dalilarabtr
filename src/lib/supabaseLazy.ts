import type { SupabaseClient } from '@supabase/supabase-js';

// Lazy accessor for the shared Supabase client.
//
// Modules that live in the ROOT LAYOUT's client graph (Navbar, Footer and the
// hooks/components they render on every page) must NOT import
// '@/lib/supabaseClient' statically: a static import drags ~63KB gz of
// supabase-js into the first-load JS of EVERY page. Awaiting getSupabase()
// instead puts the library in an async chunk the browser fetches after
// hydration, off the critical path. It resolves to the exact same singleton —
// supabaseClient.ts keeps the instance on a window global, so mixed static
// and lazy consumers still share one client (one GoTrueClient, one session).
let clientPromise: Promise<SupabaseClient | null> | null = null;

export function getSupabase(): Promise<SupabaseClient | null> {
  if (!clientPromise) {
    clientPromise = import('@/lib/supabaseClient').then((m) => m.supabase);
  }
  return clientPromise;
}
