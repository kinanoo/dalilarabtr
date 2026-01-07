'use client';

import { DataTable } from '@/components/admin/DataTable';
import { HelpCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminFaqsPage() {
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
                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                    <HelpCircle size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">الأسئلة الشائعة</h1>
                    <p className="text-slate-500 mt-1">أسئلة وأجوبة تظهر في قسم المساعدة</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <DataTable
                    tableName="faqs"
                    title="قائمة الأسئلة"
                    columns={[
                        { key: 'question', label: 'السؤال' },
                        { key: 'category', label: 'التصنيف' },
                        { key: 'active', label: 'الحالة', render: (v) => v ? '✅ نشط' : '❌ غير نشط' }
                    ]}
                    searchFields={['question', 'answer']}
                    onEdit={(item) => router.push(`/admin/faqs/${item.id}`)}
                    onCreate={() => router.push('/admin/faqs/new')}
                />
            </div>
        </div>
    );
}
