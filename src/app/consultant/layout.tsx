import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'المستشار القانوني الذكي | تحليل وضعك في تركيا مجاناً',
  description: 'أداة ذكية مجانية لتحليل وضعك القانوني في تركيا. أجب على أسئلة بسيطة واحصل على تشخيص شامل لأكثر من 200 حالة قانونية مع توصيات مخصصة لحالتك.',
  keywords: 'مستشار قانوني تركيا, وضع الإقامة, استشارة مجانية, تحليل قانوني, إقامة تركيا, الأجانب في تركيا, تشخيص قانوني',
  openGraph: {
    title: 'المستشار القانوني الذكي | دليل العرب في تركيا',
    description: 'حلل وضعك القانوني في تركيا مجاناً واحصل على توصيات مخصصة لأكثر من 200 حالة',
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
