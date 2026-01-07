'use client';

import { UpdatesManager } from '@/components/admin/ContentParsers';
import { Bell } from 'lucide-react';

export default function UpdatesAdminPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-amber-600">
                        <Bell size={24} />
                    </div>
                    إدارة التحديثات والأخبار
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    أضف آخر الأخبار، القوانين الجديدة، والتنبيهات العاجلة للمستخدمين.
                </p>
            </div>

            <UpdatesManager />
        </div>
    );
}
