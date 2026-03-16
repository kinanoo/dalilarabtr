import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الروابط المهمة | دليل العرب في تركيا',
  description: 'روابط مهمة ومباشرة للمواقع الحكومية التركية والخدمات الإلكترونية التي يحتاجها الأجانب في تركيا.',
  alternates: { canonical: '/important-links' },
  openGraph: {
    title: 'روابط مهمة للأجانب في تركيا',
    description: 'روابط مباشرة للمواقع الحكومية التركية والخدمات الإلكترونية الأساسية.',
    url: 'https://dalilarabtr.com/important-links',
    type: 'website',
  },
};

export default function ImportantLinksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
