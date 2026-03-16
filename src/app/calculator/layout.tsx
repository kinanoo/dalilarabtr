import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: 'حاسبة تكاليف الإقامة في تركيا 2026 | ضريبة، تأمين، رسوم',
  description: 'احسب التكلفة التقريبية لاستخراج أو تجديد الإقامة في تركيا — الضريبة، التأمين الصحي حسب العمر، ورسوم البطاقة.',
  keywords: 'تكاليف الإقامة تركيا, رسوم الإقامة 2026, ضريبة الإقامة, تأمين صحي تركيا, حاسبة الإقامة',
  openGraph: {
    title: 'حاسبة تكاليف الإقامة في تركيا | دليل العرب في تركيا',
    description: 'احسب التكلفة التقريبية لإقامتك في تركيا — ضريبة + تأمين + رسوم البطاقة',
    url: `${SITE_CONFIG.siteUrl}/calculator`,
    type: 'website',
    images: [{ url: `${SITE_CONFIG.siteUrl}/og-image.jpg`, width: 1200, height: 630 }],
  },
  alternates: { canonical: '/calculator' },
};

export default function CostCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
