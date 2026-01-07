'use client';

import { Database, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import DataMigration from '@/components/admin/DataMigration';

export default function AdminMigrationPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors w-fit">
                <Link href="/admin" className="flex items-center gap-2">
                    <ArrowRight size={20} />
                    <span className="font-bold">العودة للرئيسية</span>
                </Link>
            </div>

            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                    <Database size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">أدوات البيانات</h1>
                    <p className="text-slate-500 mt-1">أدوات الترحيل والصيانة المتقدمة</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <DataMigration />
            </div>
        </div>
    );
}
