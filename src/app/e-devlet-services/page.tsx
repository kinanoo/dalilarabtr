import { supabase } from '@/lib/supabaseClient';
import EDevletServicesHub from '@/components/EDevletServicesHub';
import type { Article } from '@/lib/types';
import { Metadata } from 'next';
import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: 'خدمات e-Devlet للأجانب | دليل العرب في تركيا',
  description: 'روابط مباشرة لأهم خدمات بوابة الحكومة التركية الإلكترونية e-Devlet: نفوس، طابو، محكمة، ضريبة، وأكثر.',
  alternates: { canonical: '/e-devlet-services' },
};

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export default async function EDevletServicesPage() {
  if (!supabase) return null;

  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, intro, last_update, source, slug')
    .eq('category', 'خدمات e-Devlet')
    .eq('status', 'approved');

  const services = (articles || [])
    .map((a: any) => ({
      id: a.id,
      title: a.title,
      intro: a.intro,
      lastUpdate: a.last_update,
      source: a.source ?? undefined,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'ar'));

  return (
    <main className="min-h-screen flex flex-col">
      <EDevletServicesHub services={services} />
      <div className="flex justify-center py-6">
        <ShareMenu
          title="خدمات e-Devlet للأجانب"
          text="روابط مباشرة لأهم خدمات بوابة الحكومة التركية الإلكترونية e-Devlet."
          url={`${SITE_CONFIG.siteUrl}/e-devlet-services`}
          variant="subtle"
        />
      </div>
    </main>
  );
}
