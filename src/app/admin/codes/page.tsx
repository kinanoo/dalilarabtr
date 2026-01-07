'use client';

import { DataTable } from '@/components/admin/DataTable';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminCodesPage() {
    const router = useRouter();

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors w-fit">
                <Link href="/admin" className="flex items-center gap-2">
                    <ArrowRight size={20} />
                    <span className="font-bold">العودة للرئيسية</span>
                </Link>
            </div>

            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                    <ShieldAlert size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">الأكواد الأمنية</h1>
                    <p className="text-slate-500 mt-1">إدارة رموز المنع (V-Codes / G-Codes)</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
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
            </div>
        </div>
    );
}
