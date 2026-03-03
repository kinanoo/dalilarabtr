import PageHero from '@/components/PageHero';
import { supabase } from '@/lib/supabaseClient';
import { Bell } from 'lucide-react';
import UpdatesClient from './UpdatesClient';

export const revalidate = 300; // ISR: cache for 5 minutes

const PUBLIC_EVENT_TYPES = ['new_article', 'new_scenario', 'new_faq', 'new_code', 'new_zone', 'new_update', 'new_service', 'new_tool', 'new_source'];

const EVENT_TYPE_MAP: Record<string, { type: string; href: (id: string) => string }> = {
  new_article:  { type: 'مقال',      href: (id) => `/article/${id}` },
  new_scenario: { type: 'سيناريو',   href: (id) => `/consultant?scenario=${id}` },
  new_faq:      { type: 'سؤال',      href: () => `/faq` },
  new_code:     { type: 'كود أمني',   href: () => `/security-codes` },
  new_zone:     { type: 'منطقة',     href: () => `/zones` },
  new_update:   { type: 'خبر',       href: (id) => `/updates/${id}` },
  new_service:  { type: 'خدمة',      href: (id) => `/services/${id}` },
  new_tool:     { type: 'أداة',      href: () => `/tools` },
  new_source:   { type: 'مصدر رسمي', href: () => `/sources` },
};

async function getUpdatesData() {
  if (!supabase) return [];

  const [manualRes, autoRes] = await Promise.all([
    supabase
      .from('updates')
      .select('id, title, date, type, content, image, created_at')
      .eq('active', true)
      .eq('type', 'news')
      .order('date', { ascending: false })
      .limit(20),
    supabase
      .from('admin_activity_log')
      .select('id, event_type, title, detail, entity_id, created_at')
      .in('event_type', PUBLIC_EVENT_TYPES)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const manualUpdates = (manualRes.data || []).map(u => ({
    id: u.id,
    title: u.title,
    date: u.date || (u.created_at ? u.created_at.split('T')[0] : ''),
    sortDate: u.date || u.created_at,
    type: u.type,
    content: u.content,
    image: u.image,
    source: 'manual' as const,
    event_type: null,
    href: `/updates/${u.id}`,
  }));

  const autoItems = (autoRes.data || []).map(e => {
    const cfg = EVENT_TYPE_MAP[e.event_type];
    return {
      id: e.id,
      title: e.title,
      date: e.created_at?.split('T')[0] || '',
      sortDate: e.created_at?.split('T')[0] || '',
      type: cfg?.type || 'تحديث',
      content: null,
      image: null,
      detail: e.detail,
      source: 'auto' as const,
      event_type: e.event_type,
      href: cfg?.href(e.entity_id || '') || '/updates',
    };
  });

  return [...manualUpdates, ...autoItems]
    .sort((a, b) => (b.sortDate || '').localeCompare(a.sortDate || ''))
    .slice(0, 30);
}

export default async function UpdatesPage() {
  const items = await getUpdatesData();

  return (
    <main className="flex flex-col min-h-screen font-cairo bg-slate-50 dark:bg-slate-950">
      <PageHero
        title="آخر التحديثات"
        description="كل ما يُضاف للموقع من مقالات وسيناريوهات وأخبار — تلقائياً."
        icon={<Bell className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
        titleClassName="md:text-5xl"
      />

      <UpdatesClient items={items} />
    </main>
  );
}
