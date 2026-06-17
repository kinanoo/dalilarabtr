'use client';

import { DataTable } from '@/components/admin/DataTable';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminCard from '@/components/admin/AdminCard';
import { ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminCodesPage() {
    const router = useRouter();

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <AdminPageHeader
                icon={ShieldAlert}
                theme="red"
                title="الأكواد الأمنية"
                subtitle="إدارة رموز المنع (V-Codes / G-Codes)"
                eyebrow="أمن"
            />

            <AdminCard theme="red">
                <DataTable
                    tableName="security_codes"
                    title="قائمة الأكواد"
                    idField="code"
                    type="code"
                    columns={[
                        { key: 'code', label: 'الكود' },
                        { key: 'title', label: 'الوصف المختصر' },
                        { key: 'severity', label: 'الخطورة' }
                    ]}
                    searchFields={['code', 'title', 'description']}
                    onEdit={(item) => router.push(`/admin/codes/${item.code}`)}
                    onCreate={() => router.push('/admin/codes/new')}
                />
            </AdminCard>
        </div>
    );
}
