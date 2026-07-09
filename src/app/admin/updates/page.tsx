'use client';

import NewsManager from '@/components/admin/NewsManager';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminCard from '@/components/admin/AdminCard';
import { Newspaper } from 'lucide-react';

export default function UpdatesAdminPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <AdminPageHeader
        icon={Newspaper}
        theme="amber"
        title="غرفة الأخبار"
        subtitle="انشر خبراً أو قراراً جديداً — يصل فوراً للموقع والتلغرام والإشعارات"
        eyebrow="أخبار"
      />

      <AdminCard theme="amber">
        <NewsManager />
      </AdminCard>
    </div>
  );
}
