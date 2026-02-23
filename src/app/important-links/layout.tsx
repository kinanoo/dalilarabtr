import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الروابط المهمة | دليل العرب في تركيا',
  description: 'روابط مهمة ومباشرة للمواقع الحكومية التركية والخدمات الإلكترونية التي يحتاجها الأجانب في تركيا.',
  alternates: { canonical: '/important-links' },
};

export default function ImportantLinksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
