import { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import type { AdminCode } from '@/lib/types';
import CodesClient from './CodesClient';
import { normalizeLang, type Lang } from '@/lib/codesI18n';

export const revalidate = 3600; // refresh the server-rendered list hourly

type Props = { searchParams: Promise<{ lang?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = normalizeLang((await searchParams).lang);
  if (lang === 'tr') {
    return {
      title: 'Türkiye Tahdit ve Giriş Yasağı Kodları Rehberi (V-87, G-87, Ç...) | Dalil',
      description: 'Tüm Türkiye tahdit / giriş yasağı kodlarının anlamı, konma nedenleri ve nasıl kaldırılacağı — koda veya açıklamaya göre aranabilir kapsamlı rehber.',
      alternates: { canonical: '/codes?lang=tr', languages: { ar: '/codes', tr: '/codes?lang=tr' } },
      openGraph: { locale: 'tr_TR' },
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
      .map((d: { code: string; title: string; description: string; category: string; severity: string; title_tr?: string | null; description_tr?: string | null }) => ({
        id: d.code,
        code: d.code,
        title: d.title,
        desc: d.description,
        category: d.category,
        severity: d.severity as AdminCode['severity'],
        active: true,
        title_tr: d.title_tr ?? null,
        description_tr: d.description_tr ?? null,
      }));
  }

  return <CodesClient initialCodes={initialCodes} lang={lang} />;
}
