import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'المناطق المحظورة على الأجانب في تركيا 2025 | فاحص الأحياء المغلقة',
  description: 'أداة مجانية للتحقق من المناطق والأحياء المغلقة أمام تسجيل الأجانب في تركيا. ابحث عن أي حي قبل استئجار سكن جديد واعرف إذا كان مفتوحاً أم محظوراً.',
  keywords: 'مناطق محظورة تركيا, أحياء مغلقة للأجانب, تسجيل النفوس تركيا, سكن الأجانب, Kapalı mahalle, المناطق المغلقة 2025',
  openGraph: {
    title: 'فاحص المناطق المحظورة للأجانب | دليل العرب في تركيا',
    description: 'تحقق إذا كانت المنطقة مفتوحة لتسجيل الأجانب في تركيا - قائمة محدثة 2025',
    type: 'website',
  },
};

export default function ZonesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
