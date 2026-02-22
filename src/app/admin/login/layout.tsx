import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'بوابة الإدارة',
    robots: { index: false, follow: false, noarchive: true },
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
