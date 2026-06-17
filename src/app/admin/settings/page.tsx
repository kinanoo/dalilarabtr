'use client';

import { Settings } from 'lucide-react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminCard from '@/components/admin/AdminCard';
import ConfigManager from '@/components/admin/ConfigManager';

export default function AdminSettingsPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <AdminPageHeader
                icon={Settings}
                theme="slate"
                title="الإعدادات العامة"
                subtitle="إعدادات الموقع والنظام"
                eyebrow="نظام"
            />

            <AdminCard theme="slate">
                <ConfigManager />
            </AdminCard>
        </div>
    );
}
