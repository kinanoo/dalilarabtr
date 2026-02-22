import type { Metadata } from 'next';

const SITE_CONFIG = {
    name: 'Daleel Arab Turkiye'
};

export const metadata: Metadata = {
    title: `تسجيل الدخول | ${SITE_CONFIG.name}`,
    alternates: {
        canonical: 'https://dalilarab.vercel.app/login'
    }
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
