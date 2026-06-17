'use client';

import { useState } from 'react';
import { AIAssistant } from '@/components/admin/AIAssistant';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Bot, Sparkles } from 'lucide-react';

export default function AIAssistantPage() {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="p-6 max-w-3xl mx-auto min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6">
            <AdminPageHeader
                icon={Bot}
                theme="blue"
                title="المساعد الذكي"
                subtitle="أعطِ أوامر بالعربي لإدارة المحتوى — بحث، إنشاء، تعديل، حذف، نشر."
                eyebrow="AI"
                actions={
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-l from-blue-600 to-indigo-600 text-white rounded-full text-[10px] font-black tracking-wider uppercase shadow-sm">
                        <Sparkles size={10} />
                        مباشر
                    </span>
                }
            />

            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="group/btn px-8 py-3.5 rounded-xl bg-gradient-to-l from-blue-600 to-indigo-700 text-white font-black shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2"
            >
                <Sparkles size={18} className="group-hover/btn:rotate-12 transition-transform" />
                فتح المحادثة
            </button>

            <AIAssistant isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </div>
    );
}
