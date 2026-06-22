import { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import type { AdminCode } from '@/lib/types';
import CodesClient from './CodesClient';

export const revalidate = 3600; // refresh the server-rendered list hourly

export const metadata: Metadata = {
  title: 'كاشف ومحلل الأكواد الأمنية في تركيا (V-87، G-87، Ç...) | دليل العرب',
  description: 'افهم كل أكواد المنع والحظر الأمنية التركية وأسباب وضعها وكيفية إزالتها — كاشف شامل قابل للبحث بالكود أو بالوصف.',
  alternates: { canonical: '/codes' },
};

export default async function CodesPage() {
  // Fetch the codes on the SERVER so the full, searchable list is in the first
  // HTML response — no client-side spinner wall, and crawlable by Google. Mirrors
  // the exact shape that useAdminCodes produces (id = code, desc = description),
  // so the client merge is seamless once SWR resolves.
  let initialCodes: AdminCode[] = [];
  if (supabase) {
    const { data } = await supabase
      .from('security_codes')
      .select('code, title, description, category, severity, active')
      .order('code');
    initialCodes = (data || [])
      .filter((d: { active?: boolean }) => d.active !== false)
      .map((d: { code: string; title: string; description: string; category: string; severity: string }) => ({
        id: d.code,
        code: d.code,
        title: d.title,
        desc: d.description,
        category: d.category,
        severity: d.severity as AdminCode['severity'],
        active: true,
      }));
  }

  return <CodesClient initialCodes={initialCodes} />;
}
