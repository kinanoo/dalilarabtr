'use client';

import { Settings, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import ConfigManager from '@/components/admin/ConfigManager'; // Ensure this reuses the existing component

export default function AdminSettingsPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors w-fit">
                <Link href="/admin" className="flex items-center gap-2">
                    <ArrowRight size={20} />
                    <span className="font-bold">العودة للرئيسية</span>
                </Link>
            </div>

            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
                    <Settings size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">الإعدادات العامة</h1>
                    <p className="text-slate-500 mt-1">إعدادات الموقع والنظام</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <ConfigManager />
            </div>
        </div>
    );
}
