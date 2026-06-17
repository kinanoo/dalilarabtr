'use client';

import NewsTickerManager from '@/components/admin/NewsTickerManager';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminCard from '@/components/admin/AdminCard';
import { Newspaper } from 'lucide-react';

export default function NewsTickerAdminPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <AdminPageHeader
                icon={Newspaper}
                theme="blue"
                title="إدارة شريط الأخبار"
                subtitle="أضف وتحكم في الأخبار المتحركة التي تظهر أسفل شريط التنقل."
                eyebrow="مباشر"
            />

            <AdminCard theme="blue">
                <NewsTickerManager />
            </AdminCard>
        </div>
    );
}
