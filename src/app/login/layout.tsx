import type { Metadata } from 'next';

import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
    title: `تسجيل الدخول | ${SITE_CONFIG.name}`,
    description:
        'سجّل الدخول إلى حسابك في دليل العرب في تركيا لإدارة مفضلاتك ومتابعة الخدمات والفعاليات والوصول إلى لوحة التحكم الخاصة بك بسهولة وأمان.',
    robots: {
        index: false,
        follow: true
    },
    alternates: {
        canonical: `${SITE_CONFIG.siteUrl}/login`
    }
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
