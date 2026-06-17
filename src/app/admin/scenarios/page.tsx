'use client';

import { DataTable } from '@/components/admin/DataTable';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminCard from '@/components/admin/AdminCard';
import { BrainCircuit } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminScenariosPage() {
    const router = useRouter();

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <AdminPageHeader
                icon={BrainCircuit}
                theme="violet"
                title="سيناريوهات المستشار"
                subtitle="تعديل منطق وبيانات المستشار الذكي"
                eyebrow="ذكاء"
            />

            <AdminCard theme="violet">
                <DataTable
                    tableName="consultant_scenarios"
                    title="كافة السيناريوهات"
                    toggleField="is_active"
                    columns={[
                        { key: 'title', label: 'عنوان السيناريو' },
                        { key: 'category', label: 'التصنيف' },
                        { key: 'is_active', label: 'الحالة', render: (v) => v ? '✅ مفعّل' : '❌ معطّل' }
                    ]}
                    searchFields={['title', 'description']}
                    onEdit={(item) => router.push(`/admin/scenarios/${item.id}`)}
                    onCreate={() => router.push('/admin/scenarios/new')}
                />
            </AdminCard>
        </div>
    );
}
