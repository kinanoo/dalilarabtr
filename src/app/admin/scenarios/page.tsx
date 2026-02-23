'use client';

import { DataTable } from '@/components/admin/DataTable';
import { BrainCircuit, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminScenariosPage() {
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
                <div className="p-3 bg-violet-100 text-violet-600 rounded-xl">
                    <BrainCircuit size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">سيناريوهات المستشار</h1>
                    <p className="text-slate-500 mt-1">تعديل منطق وبيانات المستشار الذكي</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
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
            </div>
        </div>
    );
}
