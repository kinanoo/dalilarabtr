import { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import ConsultantClient from './ConsultantClient';
import { SITE_CONFIG, getOgImage } from '@/lib/config';

export const metadata: Metadata = {
  title: 'دليل المواقف | تحديد إجراءاتك القانونية في تركيا',
  description: 'دليل تفاعلي يساعدك في تحديد الإجراءات المطلوبة لأكثر من 80 حالة (إقامة، جنسية، عمل، تعليم) خطوة بخطوة.',
  openGraph: {
    title: 'دليل المواقف | دليل العرب في تركيا',
    description: 'دليل تفاعلي يساعدك في تحديد الإجراءات المطلوبة لحالتك.',
    url: `${SITE_CONFIG.siteUrl}/consultant`,
    images: [{ url: getOgImage(undefined, { title: 'دليل المواقف — حدّد إجراءك القانوني في تركيا' }), width: 1200, height: 630, alt: 'دليل المواقف' }],
  },
  alternates: { canonical: '/consultant' },
};



export default function ConsultantPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <ConsultantClient initialComments={[]} />
    </main>
  );
}
