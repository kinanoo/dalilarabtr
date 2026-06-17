'use client';

import IntegrityMonitor from '@/components/admin/IntegrityMonitor';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminCard from '@/components/admin/AdminCard';
import { ShieldCheck } from 'lucide-react';

export default function IntegrityPage() {
    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <AdminPageHeader
                icon={ShieldCheck}
                theme="rose"
                title="فحص نزاهة البيانات"
                subtitle="مسح متكامل لاكتشاف الفجوات والأخطاء البنيوية في المحتوى."
                eyebrow="نزاهة"
            />

            <AdminCard theme="rose">
                <IntegrityMonitor />
            </AdminCard>
        </div>
    );
}
