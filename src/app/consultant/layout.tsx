import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'دليل المواقف | تحديد إجراءاتك القانونية في تركيا مجاناً',
  description: 'دليل تفاعلي مجاني يساعدك على تحديد الإجراءات المطلوبة لأكثر من 80 حالة قانونية في تركيا خطوة بخطوة حسب حالتك.',
  keywords: 'دليل المواقف, مستشار قانوني تركيا, وضع الإقامة, إجراءات قانونية, إقامة تركيا, الأجانب في تركيا',
  openGraph: {
    title: 'دليل المواقف',
    description: 'حدّد إجراءاتك القانونية في تركيا مجاناً خطوة بخطوة لأكثر من 80 حالة',
    type: 'website',
  },
};

export default function ConsultantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
