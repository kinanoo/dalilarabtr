'use client';

import { AnalystDashboard } from '@/components/admin/AnalystDashboard';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { BrainCircuit } from 'lucide-react';

export default function AnalystPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen space-y-6">
            <AdminPageHeader
                icon={BrainCircuit}
                theme="violet"
                title="المحلل الاستراتيجي"
                subtitle="محرك ذكاء اصطناعي يحلل المحتوى ويكشف الفجوات والروابط المكسورة وتعارض المعلومات."
                eyebrow="BETA"
                actions={
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-l from-purple-600 to-violet-600 text-white rounded-full text-[10px] font-black tracking-wider uppercase shadow-sm">
                        AI
                    </span>
                }
            />

            <AnalystDashboard />
        </div>
    );
}
