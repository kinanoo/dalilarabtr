import { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import ConsultantClient from './ConsultantClient';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: 'المستشار الشامل | دليل العرب في تركيا',
  description: 'نظام تشخيص قانوني ذكي يساعدك في تحديد الإجراءات المطلوبة لأكثر من 200 حالة (إقامة، جنسية، عمل، تعليم) بدقة.',
  openGraph: {
    title: 'المستشار الشامل | دليل العرب في تركيا',
    description: 'نظام تشخيص قانوني ذكي يساعدك في تحديد الإجراءات المطلوبة.',
    url: `${SITE_CONFIG.siteUrl}/consultant`,
  },
};

import UniversalComments from '@/components/community/UniversalComments';
import ContentHelpfulWidget from '@/components/community/ContentHelpfulWidget';

export default function ConsultantPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <ConsultantClient initialComments={[]} />

      <div className="max-w-4xl mx-auto px-4 mt-12 space-y-8">
        <ContentHelpfulWidget entityType="scenario" entityId="consultant-main" />
        <UniversalComments entityType="scenario" entityId="consultant-main" title="مجتمع المستشار القانوني" />
      </div>
    </main>
  );
}
