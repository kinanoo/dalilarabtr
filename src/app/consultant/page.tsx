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

export default async function ConsultantPage() {
  if (!supabase) {
    return <ConsultantClient initialComments={[]} />;
  }

  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('page_slug', 'consultant-tool')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(50);

  return <ConsultantClient initialComments={comments || []} />;
}
