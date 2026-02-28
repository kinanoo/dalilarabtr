'use client';

import NewsTickerManager from '@/components/admin/NewsTickerManager';
import { Newspaper } from 'lucide-react';

export default function NewsTickerAdminPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600">
                        <Newspaper size={24} />
                    </div>
                    إدارة شريط الأخبار
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    أضف وتحكم في الأخبار المتحركة التي تظهر أسفل شريط التنقل.
                </p>
            </div>

            <NewsTickerManager />
        </div>
    );
}
