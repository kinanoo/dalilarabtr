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
    .select('*')
    .eq('category', 'خدمات e-Devlet')
    .eq('active', true); // Ensure we only get active services

  const services = (articles || [])
    .map((article: any) => ({
      id: article.id, // slug
      article: article as Article
    }))
    .sort((a, b) => a.article.title.localeCompare(b.article.title, 'ar'));

  return (
    <main className="min-h-screen flex flex-col">
      <EDevletServicesHub
        services={services.map(({ id, article }) => ({
          id,
          title: article.title,
          intro: article.intro,
          lastUpdate: article.lastUpdate,
          source: article.source ?? undefined,
        }))}
      />
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
