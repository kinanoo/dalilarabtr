'use client';

import { SourcesManager } from '@/components/admin/SourcesManager';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminCard from '@/components/admin/AdminCard';
import { Database } from 'lucide-react';

export default function SourcesAdminPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <AdminPageHeader
                icon={Database}
                theme="blue"
                title="إدارة المصادر الرسمية"
                subtitle="أضف الروابط الحكومية والرسمية التي تظهر في قسم المصادر المعتمدة."
                eyebrow="مراجع"
            />

            <AdminCard theme="blue">
                <SourcesManager />
            </AdminCard>
        </div>
    );
}
