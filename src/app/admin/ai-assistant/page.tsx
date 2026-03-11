'use client';

import { useState } from 'react';
import { AIAssistant } from '@/components/admin/AIAssistant';
import { Bot, Sparkles } from 'lucide-react';

export default function AIAssistantPage() {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="p-4 sm:p-8 max-w-3xl mx-auto min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles size={40} className="text-white" />
            </div>
            <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mb-2 flex items-center justify-center gap-3">
                    <Bot size={28} className="text-blue-600" />
                    المساعد الذكي
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">AI</span>
                </h1>
                <p className="text-slate-500 max-w-md mx-auto text-sm">
                    أعطِ أوامر بالعربي لإدارة المحتوى — بحث، إنشاء، تعديل، حذف، نشر.
                </p>
            </div>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="px-8 py-3 rounded-xl bg-gradient-to-l from-blue-600 to-indigo-700 text-white font-bold shadow-lg shadow-blue-600/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
                فتح المحادثة
            </button>

            <AIAssistant isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </div>
    );
}
