import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'فاحص الأكواد الأمنية التركية | اعرف سبب الرفض V-87 G-87',
  description: 'أداة مجانية للتعرف على معاني الأكواد الأمنية في تركيا مثل V-87, G-87, N-82 وغيرها. اعرف سبب رفض طلبك أو منعك من الدخول والحلول المتاحة.',
  keywords: 'أكواد أمنية تركيا, V-87, G-87, N-82, سبب الرفض, كود الترحيل, أكواد الهجرة التركية, منع الدخول لتركيا',
  openGraph: {
    title: 'فاحص الأكواد الأمنية التركية | دليل العرب في تركيا',
    description: 'اعرف معنى الكود الأمني وسبب رفض طلبك في تركيا - V-87, G-87, N-82 والمزيد',
    url: 'https://dalilarabtr.com/codes',
    type: 'website',
    images: [{ url: 'https://dalilarabtr.com/og-image.jpg', width: 1200, height: 630 }],
  },
  alternates: { canonical: '/codes' },
};

export default function CodesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
