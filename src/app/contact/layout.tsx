import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: `اتصل بنا — ${SITE_CONFIG.name}`,
  description: 'تواصل معنا مباشرة عبر واتساب أو نموذج الاتصال. نردّ عادةً خلال 24 ساعة. استفسار عام، اقتراح تحسين، مشكلة تقنية، أو طلب خدمة.',
  alternates: {
    canonical: `${SITE_CONFIG.siteUrl}/contact`,
  },
  openGraph: {
    title: `اتصل بنا — ${SITE_CONFIG.name}`,
    description: 'تواصل معنا مباشرة عبر واتساب. نردّ عادةً خلال 24 ساعة.',
    url: `${SITE_CONFIG.siteUrl}/contact`,
    type: 'website',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
