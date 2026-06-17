'use client';

import { DataTable } from '@/components/admin/DataTable';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminCard from '@/components/admin/AdminCard';
import { HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminFaqsPage() {
    const router = useRouter();
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <AdminPageHeader
                icon={HelpCircle}
                theme="amber"
                title="الأسئلة الشائعة"
                subtitle="أسئلة وأجوبة تظهر في قسم المساعدة"
                eyebrow="معرفة"
            />

            <AdminCard theme="amber">
                <DataTable
                    tableName="faqs"
                    title="قائمة الأسئلة"
                    toggleField="active"
                    columns={[
                        { key: 'question', label: 'السؤال' },
                        { key: 'category', label: 'التصنيف' },
                        { key: 'active', label: 'الحالة', render: (v) => v ? '✅ نشط' : '❌ معطّل' }
                    ]}
                    searchFields={['question', 'answer']}
                    onEdit={(item) => router.push(`/admin/faqs/${item.id}`)}
                    onCreate={() => router.push('/admin/faqs/new')}
                />
            </AdminCard>
        </div>
    );
}
