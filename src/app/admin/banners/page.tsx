'use client';

import BannersManager from '@/components/admin/BannersManager';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminCard from '@/components/admin/AdminCard';
import { ShieldAlert } from 'lucide-react';

export default function BannersAdminPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <AdminPageHeader
                icon={ShieldAlert}
                theme="red"
                title="إدارة البنرات والتنبيهات"
                subtitle="تحكم في الشرائط الإعلانية والتنبيهات التي تظهر في أعلى الموقع."
                eyebrow="تنبيهات"
            />

            <AdminCard theme="red">
                <BannersManager />
            </AdminCard>
        </div>
    );
}
