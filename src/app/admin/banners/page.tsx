'use client';

import BannersManager from '@/components/admin/BannersManager';
import { ShieldAlert } from 'lucide-react';

export default function BannersAdminPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg text-red-600">
                        <ShieldAlert size={24} />
                    </div>
                    إدارة البنرات والتنبيهات
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    تحكم في الشرائط الاعلانية والتنبيهات التي تظهر في أعلى الموقع.
                </p>
            </div>

            <BannersManager />
        </div>
    );
}
