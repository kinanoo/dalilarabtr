'use client';

import { DataTable } from '@/components/admin/DataTable';
import { MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminZonesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const issueType = searchParams.get('issue');

    const getCustomFilter = () => {
        if (issueType === 'missing_notes') {
            return (q: any) => q.or('notes.is.null,notes.eq.""');
        }
        return undefined;
    };

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
                    <MapPin size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">المناطق المحظورة</h1>
                    <p className="text-slate-500 mt-1">إدارة قائمة الأحياء المحظورة من النفوس</p>
                </div>
            </div>

            {issueType && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
                        <span className="font-bold">وضع الإصلاح: عرض مناطق بدون ملاحظات</span>
                    </div>
                    <button
                        onClick={() => router.push('/admin/zones')}
                        className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 rounded-lg text-sm font-bold shadow-sm"
                    >
                        إلغاء الفلتر
                    </button>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <DataTable
                    tableName="zones"
                    title="قائمة المناطق"
                    customFilter={getCustomFilter()}
                    columns={[
                        // Fix incorrect column name in column definition too if needed (it was 'district' etc, notes usually not shown in table but searched? 
                        // I will update columns to include notes if beneficial, but keeping existing is fine)
                        { key: 'city', label: 'المدينة' },
                        { key: 'district', label: 'المنطقة' },
                        { key: 'neighborhood', label: 'الحي' },
                        { key: 'status', label: 'الحالة', render: (v: any) => v === 'closed' ? <span className="text-red-600 font-bold">🔴 مغلق</span> : <span className="text-green-600 font-bold">🟢 مفتوح</span> }
                    ]}
                    searchFields={['city', 'district', 'neighborhood']}
                    onEdit={(item: any) => router.push(`/admin/zones/${item.id}`)}
                    onCreate={() => router.push('/admin/zones/new')}
                />
            </div>
        </div>
    );
}
