import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'حاسبة مدة الحظر من تركيا 2025 | احسب متى يُرفع المنع',
  description: 'أداة مجانية لحساب مدة الحظر من دخول تركيا بناءً على نوع المخالفة وتاريخ الترحيل. اعرف متى يُرفع المنع عنك وهل يمكن إلغاؤه مبكراً.',
  keywords: 'حاسبة الحظر تركيا, مدة المنع من تركيا, الترحيل من تركيا, رفع الحظر, متى أدخل تركيا, حظر الدخول, V-87',
  openGraph: {
    title: 'حاسبة مدة الحظر من تركيا | دليل العرب في تركيا',
    description: 'احسب متى يُرفع الحظر عنك من دخول تركيا - أداة مجانية ودقيقة',
    type: 'website',
  },
};

export default function BanCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
