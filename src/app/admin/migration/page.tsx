'use client';

import { Database } from 'lucide-react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminCard from '@/components/admin/AdminCard';
import DataMigration from '@/components/admin/DataMigration';

export default function AdminMigrationPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <AdminPageHeader
                icon={Database}
                theme="indigo"
                title="أدوات البيانات"
                subtitle="أدوات الترحيل والصيانة المتقدمة"
                eyebrow="بيانات"
            />

            <AdminCard theme="indigo">
                <DataMigration />
            </AdminCard>
        </div>
    );
}
