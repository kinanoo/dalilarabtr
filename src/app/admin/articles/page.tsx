'use client';

import { useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminCard from '@/components/admin/AdminCard';
import { FileText, Eye, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * The reads column is the point of this page's sort toggle.
 *
 * articles.views has been counting all along and nothing in the admin ever
 * showed it — the number existed only in the chip readers saw, and that chip is
 * now hidden from them by the show_view_counts setting. So the owner had no way
 * at all to see which articles people actually read.
 *
 * These are the recorded counts, with no padding: the API used to add a fixed
 * 25–48 per article before returning a number, and that was removed with the
 * setting. A figure here is people, and it is the same figure whether the
 * public chip is on or off.
 */
export default function AdminArticlesPage() {
    const router = useRouter();
    const [orderBy, setOrderBy] = useState<'created_at' | 'views'>('created_at');

    const tab = (key: 'created_at' | 'views', label: string, Icon: typeof Eye) => (
        <button
            type="button"
            onClick={() => setOrderBy(key)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                orderBy === key
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
        >
            <Icon size={13} />
            {label}
        </button>
    );

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
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-bold text-slate-400">ترتيب:</span>
                    {tab('created_at', 'الأحدث', Clock)}
                    {tab('views', 'الأكثر قراءة', Eye)}
                </div>

                <DataTable
                    tableName="articles"
                    title="قائمة المقالات"
                    orderBy={orderBy}
                    columns={[
                        { key: 'title', label: 'العنوان' },
                        { key: 'category', label: 'القسم' },
                        {
                            key: 'views',
                            label: 'قراءات',
                            // A never-read article stores null, not 0 — show the
                            // zero rather than a dash, because "nobody has opened
                            // this yet" is information the owner wants.
                            render: (val) => Number(val || 0).toLocaleString('en-US'),
                        },
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
