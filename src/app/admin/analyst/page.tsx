'use client';

import { AnalystDashboard } from '@/components/admin/AnalystDashboard';
import { BrainCircuit } from 'lucide-react';

export default function AnalystPage() {
    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2 flex items-center gap-3">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-2xl">
                        <BrainCircuit size={32} />
                    </div>
                    المحلل الاستراتيجي
                    <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full">BETA</span>
                </h1>
                <p className="text-slate-500 max-w-2xl">
                    محرك ذكاء اصطناعي يقوم بتحليل المحتوى واكتشاف الفجوات، الروابط المكسورة، وتعارض المعلومات لمساعدتك في اتخاذ قرارات صائبة.
                </p>
            </div>

            <AnalystDashboard />
        </div>
    );
}
