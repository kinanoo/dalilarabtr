import PageHero from '@/components/PageHero';
import { Bell } from 'lucide-react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import UpdatesClient from './UpdatesClient';

export const revalidate = 60;

// Fetch the raw `updates` rows on the server so the primary list is present in
// the first HTML (crawlers/no-JS see real content). These rows are passed to
// the client list as SWR fallbackData — the client keeps revalidating and all
// existing interactivity (search, filters, auto-events) stays untouched.
async function getInitialUpdates() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data } = await supabase
    .from('updates')
    .select('id, type, title, content, date, link, image, active, created_at')
    .eq('active', true)
    .order('date', { ascending: false });

  return data ?? [];
}

export default async function UpdatesPage() {
  const initialUpdates = await getInitialUpdates();

  return (
    <main className="flex flex-col min-h-screen font-cairo bg-slate-50 dark:bg-slate-950">
      <PageHero
        title="آخر التحديثات"
        description="كل ما يُضاف للموقع من مقالات وسيناريوهات وأخبار — تلقائياً."
        icon={<Bell className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
        titleClassName="md:text-5xl"
      />

      <UpdatesClient initialUpdates={initialUpdates} />
    </main>
  );
}
