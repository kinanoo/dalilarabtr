'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { voteContent } from '@/lib/api/comments';
import { toast } from 'sonner';

interface ContentHelpfulWidgetProps {
    entityType: string;
    entityId: string;
    className?: string;
}

export default function ContentHelpfulWidget({ entityType, entityId, className }: ContentHelpfulWidgetProps) {
    const [voted, setVoted] = useState<'up' | 'down' | null>(null);

    const handleVote = async (type: 'up' | 'down') => {
        if (voted) return;
        setVoted(type);

        const { error } = await voteContent(entityType, entityId, type);

        if (error) {
            // Revert if error (optional, but keep it simple)
            console.error(error);
        } else {
            toast.success(type === 'up' ? 'شكراً لك! يسعدنا أنك استفدت.' : 'شكراً لملاحظتك، سنعمل على التحسين.');
        }
    };

    if (voted) {
        return (
            <div className={`flex items-center gap-2 text-sm font-bold text-slate-500 animate-in fade-in ${className}`}>
                {voted === 'up' ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                        <ThumbsUp size={16} /> شكراً لتفاعلك!
                    </span>
                ) : (
                    <span className="text-slate-500 flex items-center gap-1">
                        <ThumbsDown size={16} /> شكراً لملاحظتك.
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 ${className}`}>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                هل كان هذا المحتوى مفيداً؟
            </span>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => handleVote('up')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 transition-colors text-sm font-bold text-slate-600 dark:text-slate-400"
                >
                    <ThumbsUp size={14} />
                    نعم
                </button>
                <button
                    onClick={() => handleVote('down')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-500 hover:text-red-600 transition-colors text-sm font-bold text-slate-600 dark:text-slate-400"
                >
                    <ThumbsDown size={14} />
                    لا
                </button>
            </div>
        </div>
    );
}
