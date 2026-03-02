import type { Metadata } from 'next';

import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
    title: `تسجيل الدخول | ${SITE_CONFIG.name}`,
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
