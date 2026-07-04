import type { Metadata } from 'next';

import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
    title: `إنشاء حساب جديد | ${SITE_CONFIG.name}`,
    description:
        'أنشئ حسابك المجاني في دليل العرب في تركيا للوصول إلى الأدلة والخدمات والفعاليات، وحفظ مفضلاتك، والتواصل مع مقدمي الخدمات العرب في تركيا بسهولة.',
    alternates: {
        canonical: `${SITE_CONFIG.siteUrl}/join`
    }
};

export default function JoinLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
