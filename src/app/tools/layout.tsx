import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'أدوات مجانية للأجانب في تركيا 2026 | حاسبات وفاحصات قانونية',
  description: 'مجموعة أدوات مجانية لمساعدة الأجانب في تركيا: حاسبة مدة الحظر، فاحص الأكواد الأمنية V-87، المناطق المحظورة، المستشار القانوني الذكي، والمزيد.',
  keywords: 'أدوات تركيا مجانية, حاسبة الحظر, أكواد أمنية, مناطق محظورة, مستشار قانوني, كملك, إقامة تركيا, أدوات الأجانب',
  openGraph: {
    title: 'أدوات مجانية للأجانب في تركيا | دليل العرب في تركيا',
    description: 'حاسبات وأدوات ذكية لمساعدتك في فهم وضعك القانوني في تركيا - مجانية 100%',
    type: 'website',
  },
};

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
