import { supabase } from '@/lib/supabaseClient';
import UpdatesClient from './UpdatesClient';

export const revalidate = 60;

// Fetch the raw `updates` rows on the server so the primary list is present in
// the first HTML (crawlers/no-JS see real content). select('*') keeps the
// query tolerant: the optional editorial columns (category, summary,
// source_url, source_name, pinned) come through once the migration has run,
// and the query still succeeds while they don't exist yet.
// Uses the plain anon client, NOT a cookie-bound server client. This query is a
// public read (`active = true`) with no per-user component, and reading
// `cookies()` forces Next to render the whole route dynamically — verified
// live, this page answered `Cache-Control: private, no-cache, no-store`, so the
// declared `revalidate = 60` never engaged and every visit re-queried Supabase.
async function getInitialUpdates() {
  if (!supabase) return [];

  const { data } = await supabase
    .from('updates')
    .select('*')
    .eq('active', true)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(120);

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
