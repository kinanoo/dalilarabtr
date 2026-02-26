import { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import ConsultantClient from './ConsultantClient';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: 'المستشار الشامل | دليل العرب في تركيا',
  description: 'نظام تشخيص قانوني ذكي يساعدك في تحديد الإجراءات المطلوبة لأكثر من 80 حالة (إقامة، جنسية، عمل، تعليم) بدقة.',
  openGraph: {
    title: 'المستشار الشامل | دليل العرب في تركيا',
    description: 'نظام تشخيص قانوني ذكي يساعدك في تحديد الإجراءات المطلوبة.',
    url: `${SITE_CONFIG.siteUrl}/consultant`,
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
