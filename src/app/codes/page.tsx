import { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import type { AdminCode } from '@/lib/types';
import CodesClient from './CodesClient';
import { SITE_CONFIG } from '@/lib/config';
import { normalizeLang, type Lang } from '@/lib/codesI18n';

export const revalidate = 3600; // refresh the server-rendered list hourly

type Props = { searchParams: Promise<{ lang?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = normalizeLang((await searchParams).lang);
  if (lang === 'tr') {
    const trTitle = 'Türkiye Tahdit ve Giriş Yasağı Kodları Rehberi (V-87, G-87, Ç...) | Dalil';
    const trDesc = 'Tüm Türkiye tahdit / giriş yasağı kodlarının anlamı, konma nedenleri ve nasıl kaldırılacağı — koda veya açıklamaya göre aranabilir kapsamlı rehber.';
    return {
      title: trTitle,
      description: trDesc,
      alternates: { canonical: '/codes?lang=tr', languages: { ar: '/codes', tr: '/codes?lang=tr' } },
      openGraph: {
        type: 'website',
        locale: 'tr_TR',
        url: `${SITE_CONFIG.siteUrl}/codes?lang=tr`,
        title: trTitle,
        description: trDesc,
      },
    };
  }
  return {
    title: 'كاشف ومحلل الأكواد الأمنية في تركيا (V-87، G-87، Ç...) | دليل العرب',
    description: 'افهم كل أكواد المنع والحظر الأمنية التركية وأسباب وضعها وكيفية إزالتها — كاشف شامل قابل للبحث بالكود أو بالوصف.',
    alternates: { canonical: '/codes', languages: { ar: '/codes', tr: '/codes?lang=tr' } },
  };
}

export default async function CodesPage({ searchParams }: Props) {
  const lang: Lang = normalizeLang((await searchParams).lang);

  // Fetch the codes on the SERVER so the full, searchable list is in the first
  // HTML response — no client-side spinner wall, and crawlable by Google.
  // select('*') carries the Turkish (*_tr) columns through once they exist.
  let initialCodes: AdminCode[] = [];
  if (supabase) {
    const { data } = await supabase
      .from('security_codes')
      .select('*')
      .order('code');
    initialCodes = (data || [])
      .filter((d: { active?: boolean }) => d.active !== false)
      .map((d: { code: string; title: string; description: string; category: string; severity: string; duration?: string | null; title_tr?: string | null; description_tr?: string | null; duration_tr?: string | null }) => ({
        id: d.code,
        code: d.code,
        title: d.title,
        desc: d.description,
        category: d.category,
        severity: d.severity as AdminCode['severity'],
        active: true,
        duration: d.duration ?? null,
        title_tr: d.title_tr ?? null,
        description_tr: d.description_tr ?? null,
        duration_tr: d.duration_tr ?? null,
      }));
  }

  // DefinedTermSet JSON-LD — the codes glossary, so Google understands each
  // code as a defined term within one named set (crawlable from the list page).
  const definedTermSet = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'الأكواد الأمنية التركية',
    url: `${SITE_CONFIG.siteUrl}/codes`,
    hasDefinedTerm: initialCodes.slice(0, 100).map((c) => ({
      '@type': 'DefinedTerm',
      name: c.code,
      description: c.title,
      url: `${SITE_CONFIG.siteUrl}/codes/${encodeURIComponent(c.code)}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermSet) }} />
      <CodesClient initialCodes={initialCodes} lang={lang} />
    </>
  );
}
