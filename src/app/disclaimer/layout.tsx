import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'إخلاء المسؤولية | دليل العرب في تركيا',
  description: 'إخلاء مسؤولية قانوني — المعلومات المنشورة للتثقيف فقط ولا تُعدّ استشارة قانونية رسمية. تحقق دائماً من الجهات الحكومية.',
  alternates: { canonical: '/disclaimer' },
  openGraph: {
    title: 'إخلاء المسؤولية | دليل العرب في تركيا',
    description: 'إخلاء مسؤولية قانوني — المعلومات المنشورة للتثقيف فقط ولا تُعدّ استشارة قانونية رسمية.',
    url: 'https://dalilarabtr.com/disclaimer',
    type: 'website',
  },
};

export default function DisclaimerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
