import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import UpdatesClient from './UpdatesClient';

export const revalidate = 60;

// Fetch the raw `updates` rows on the server so the primary list is present in
// the first HTML (crawlers/no-JS see real content). select('*') keeps the
// query tolerant: the optional editorial columns (category, summary,
// source_url, source_name, pinned) come through once the migration has run,
// and the query still succeeds while they don't exist yet.
async function getInitialUpdates() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

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
