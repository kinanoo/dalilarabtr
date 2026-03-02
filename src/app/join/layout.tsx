import type { Metadata } from 'next';

import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
    title: `إنشاء حساب جديد | ${SITE_CONFIG.name}`,
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
