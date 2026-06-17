'use client';

import { DataTable } from '@/components/admin/DataTable';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminCard from '@/components/admin/AdminCard';
import { FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';


export default function AdminArticlesPage() {
    const router = useRouter();

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <AdminPageHeader
                icon={FileText}
                theme="emerald"
                title="إدارة المقالات"
                subtitle="عرض وإدارة جميع المقالات في النظام"
                eyebrow="محتوى"
            />

            <AdminCard theme="emerald">
                <DataTable
                    tableName="articles"
                    title="قائمة المقالات"
                    columns={[
                        { key: 'title', label: 'العنوان' },
                        { key: 'category', label: 'القسم' },
                        { key: 'created_at', label: 'تاريخ الإضافة', render: (val) => new Date(val).toLocaleDateString('ar-EG') }
                    ]}
                    searchFields={['title', 'intro']}
                    onEdit={(item) => router.push(`/admin/articles/${item.id}`)}
                    onCreate={() => router.push('/admin/articles/new')}
                />
            </AdminCard>
        </div>
    );
}
