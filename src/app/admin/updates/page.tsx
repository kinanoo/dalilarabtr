'use client';

import { UpdatesManager } from '@/components/admin/ContentParsers';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminCard from '@/components/admin/AdminCard';
import { Bell } from 'lucide-react';

export default function UpdatesAdminPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <AdminPageHeader
                icon={Bell}
                theme="amber"
                title="إدارة التحديثات والأخبار"
                subtitle="أضف آخر الأخبار، القوانين الجديدة، والتنبيهات العاجلة للمستخدمين."
                eyebrow="أخبار"
            />

            <AdminCard theme="amber">
                <UpdatesManager />
            </AdminCard>
        </div>
    );
}
