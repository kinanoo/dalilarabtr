import { Metadata } from 'next';
import DashboardLayoutClient from './DashboardLayoutClient';

export const metadata: Metadata = {
    title: 'لوحة الأعضاء',
    robots: { index: false, follow: false, noarchive: true },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
