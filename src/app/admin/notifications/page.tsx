'use client';

import NotificationsManager from '@/components/admin/NotificationsManager';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminCard from '@/components/admin/AdminCard';
import { Bell } from 'lucide-react';

export default function NotificationsAdminPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <AdminPageHeader
                icon={Bell}
                theme="amber"
                title="إدارة الإشعارات"
                subtitle="كل ما يظهر في جرس الإشعارات — أخفِ أي إشعار عن المستخدمين فوراً أو احذفه نهائياً."
                eyebrow="مباشر"
            />

            <AdminCard theme="amber">
                <NotificationsManager />
            </AdminCard>
        </div>
    );
}
