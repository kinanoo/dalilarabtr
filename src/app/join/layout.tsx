import type { Metadata } from 'next';

const SITE_CONFIG = {
    name: 'Daleel Arab Turkiye'
};

export const metadata: Metadata = {
    title: `إنشاء حساب جديد | ${SITE_CONFIG.name}`,
    alternates: {
        canonical: 'https://dalilarab.vercel.app/join'
    }
};

export default function JoinLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
