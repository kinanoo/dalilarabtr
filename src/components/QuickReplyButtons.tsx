'use client';

import { useState } from 'react';
import { X, MessageCircle, Send } from 'lucide-react';

// Note: WhatsApp number is handled in WhatsAppAssistant component

const QUICK_REPLIES = [
    { id: 'residence', label: '📋 سؤال عن الإقامة', message: 'مرحباً، لدي سؤال عن الإقامة في تركيا' },
    { id: 'codes', label: '🔍 شرح كود أمني', message: 'أريد شرح كود أمني محدد' },
    { id: 'services', label: '💼 البحث عن خدمة', message: 'أبحث عن خدمة معينة' },
    { id: 'legal', label: '⚖️ استشارة قانونية', message: 'أحتاج استشارة قانونية' },
    { id: 'general', label: '💬 سؤال عام', message: 'لدي سؤال عام' },
];

interface QuickReplyButtonsProps {
    onSelect: (message: string) => void;
    currentPage?: string;
}

export default function QuickReplyButtons({ onSelect, currentPage }: QuickReplyButtonsProps) {
    const handleQuickReply = (message: string) => {
        let contextMessage = message;

        // إضافة سياق ذكي حسب الصفحة الحالية
        if (currentPage) {
            contextMessage += `\n\n[الصفحة الحالية: ${currentPage}]`;
        }

        onSelect(contextMessage);
    };

    return (
        <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                ⚡ ردود سريعة:
            </div>
            <div className="grid grid-cols-1 gap-2">
                {QUICK_REPLIES.map((reply) => (
                    <button
                        key={reply.id}
                        onClick={() => handleQuickReply(reply.message)}
                        className="text-right px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-white dark:bg-slate-950 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-sm transition"
                    >
                        {reply.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
