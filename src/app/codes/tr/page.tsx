import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';
import CodesIndex from '../CodesIndex';

// Turkish edition. A static segment beats the sibling [code] route in Next's
// matcher, so /codes/tr resolves here and never as a security code named "tr".
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Türkiye Tahdit ve Giriş Yasağı Kodları Rehberi (V-87, G-87, Ç...) | Dalil';
  const description = 'Tüm Türkiye tahdit / giriş yasağı kodlarının anlamı, konma nedenleri ve nasıl kaldırılacağı — koda veya açıklamaya göre aranabilir kapsamlı rehber.';
  return {
    title,
    description,
    alternates: { canonical: '/codes/tr', languages: { ar: '/codes', tr: '/codes/tr' } },
    openGraph: {
      type: 'website',
      locale: 'tr_TR',
      url: `${SITE_CONFIG.siteUrl}/codes/tr`,
      title,
      description,
    },
  };
}

export default async function CodesTrPage() {
  return <CodesIndex lang="tr" />;
}
