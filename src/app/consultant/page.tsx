import { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import ConsultantClient from './ConsultantClient';
import ToolFooter from '@/components/tools/ToolFooter';
import { SITE_CONFIG, getOgImage } from '@/lib/config';

export const metadata: Metadata = {
  title: 'دليل المواقف | تحديد إجراءاتك القانونية في تركيا',
  description: 'دليل تفاعلي يساعدك في تحديد الإجراءات المطلوبة لأكثر من 80 حالة (إقامة، جنسية، عمل، تعليم) خطوة بخطوة.',
  openGraph: {
    title: 'دليل المواقف',
    description: 'دليل تفاعلي يساعدك في تحديد الإجراءات المطلوبة لحالتك.',
    url: `${SITE_CONFIG.siteUrl}/consultant`,
    images: [{ url: getOgImage(undefined, { title: 'دليل المواقف — حدّد إجراءك القانوني في تركيا' }), width: 1200, height: 630, alt: 'دليل المواقف' }],
  },
  alternates: { canonical: '/consultant' },
};



// ISR: server-fetch the scenario catalogue once (cached) so the browser stops
// re-pulling the whole consultant_scenarios table on every visit via the anon
// key. Same shape as the client hook (useResource → select('*')), so seeding
// is transparent; the on-demand single-row fetch when a scenario is opened is
// untouched.
export const revalidate = 600;

async function getInitialScenarios() {
  if (!supabase) return [];
  try {
    const { data } = await supabase.from('consultant_scenarios').select('*');
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function ConsultantPage() {
  const initialScenarios = await getInitialScenarios();
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <ConsultantClient initialComments={[]} initialScenarios={initialScenarios} />
      <ToolFooter toolId="consultant" />
    </main>
  );
}
