'use client';

import { AIAssistant } from '@/components/admin/AIAssistant';
import { Bot } from 'lucide-react';

export default function AIAssistantPage() {
    return (
        <div className="p-4 sm:p-8 max-w-5xl mx-auto min-h-screen">
            <div className="mb-6">
                <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2 flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl">
                        <Bot size={32} />
                    </div>
                    المساعد الذكي
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">AI</span>
                </h1>
                <p className="text-slate-500 max-w-2xl">
                    أعطِ أوامر بالعربي لإدارة المحتوى — بحث، إنشاء، تعديل، حذف، نشر.
                </p>
            </div>

            <AIAssistant />
        </div>
    );
}
