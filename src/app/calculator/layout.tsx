import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'حاسبة تكاليف الإقامة في تركيا 2026 | ضريبة، تأمين، رسوم',
  description: 'احسب التكلفة التقريبية لاستخراج أو تجديد الإقامة في تركيا — الضريبة، التأمين الصحي حسب العمر، ورسوم البطاقة.',
  keywords: 'تكاليف الإقامة تركيا, رسوم الإقامة 2026, ضريبة الإقامة, تأمين صحي تركيا, حاسبة الإقامة',
  openGraph: {
    title: 'حاسبة تكاليف الإقامة في تركيا | دليل العرب في تركيا',
    description: 'احسب التكلفة التقريبية لإقامتك في تركيا — ضريبة + تأمين + رسوم البطاقة',
    url: 'https://dalilarabtr.com/calculator',
    type: 'website',
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
