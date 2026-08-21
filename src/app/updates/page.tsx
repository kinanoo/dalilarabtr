import { supabase } from '@/lib/supabaseClient';
import { retrySupabaseQuery, throwSupabaseQueryError } from '@/lib/supabaseQuery';
import UpdatesClient from './UpdatesClient';

// 10 minutes, not 1: this page pulls up to 120 full news rows on every ISR
// tick, so a 60-second window meant ~1,440 heavy Supabase reads a day for a
// page whose content changes a few times a week. Publishing or hiding an item
// in /admin/updates purges this path on demand (see NewsManager →
// /api/admin/revalidate), so editors still see changes immediately.
export const revalidate = 600;

// Fetch only archive fields so the primary list is present in the first HTML
// without transferring every full HTML body. The detail route owns `content`.
// Uses the plain anon client, NOT a cookie-bound server client. This query is a
// public read (`active = true`) with no per-user component, and reading
// `cookies()` forces Next to render the whole route dynamically — verified
// live, this page answered `Cache-Control: private, no-cache, no-store`, so the
// declared `revalidate` never engaged and every visit re-queried Supabase.
async function getInitialUpdates() {
  if (!supabase) return [];
  const client = supabase;

  const { data, error } = await retrySupabaseQuery('updates archive', () =>
    client
      .from('updates')
      .select('id,title,type,date,active,link,image,created_at,category,summary,source_url,source_name,pinned')
      .eq('active', true)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(120),
  );

  if (error) throwSupabaseQueryError('updates archive', error);

  return data ?? [];
}

export default async function UpdatesPage() {
  const initialUpdates = await getInitialUpdates();

  return (
    <main className="flex flex-col min-h-screen font-cairo bg-slate-50 dark:bg-slate-950">
      <UpdatesClient initialUpdates={initialUpdates} />
    </main>
  );
}
