'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BellRing, MessageCircle, AlertCircle, FileWarning, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export function ActionCenter() {
    const [counts, setCounts] = useState({
        pendingComments: 0,
        negativeFeedback: 0,
        pendingReviews: 0,
        totalIssues: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCounts = async () => {
            if (!supabase) return;

            const [comments, feedback, reviews] = await Promise.all([
                supabase.from('comments').select('id', { count: 'exact' }).eq('status', 'pending'),
                supabase.from('content_votes').select('id', { count: 'exact' }).eq('vote_type', 'down'),
                supabase.from('service_reviews').select('id', { count: 'exact' }).eq('is_approved', false) // If you use approval system
            ]);

            const cCount = comments.count || 0;
            const fCount = feedback.count || 0;
            const rCount = reviews.count || 0;

            setCounts({
                pendingComments: cCount,
                negativeFeedback: fCount,
                pendingReviews: rCount,
                totalIssues: cCount + fCount + rCount
            });
            setLoading(false);
        };
        fetchCounts();
    }, []);

    if (loading) return <div className="animate-pulse h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full"></div>;

    if (counts.totalIssues === 0) {
        return (
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-6">
                    <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full">
                        <CheckCircle size={40} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black mb-1">كل شيء هادئ!</h2>
                        <p className="opacity-90 font-medium">لا توجد مهام معلقة تتطلب انتباهك حالياً.</p>
                    </div>
                </div>
                {/* Decoration */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <BellRing className="text-red-500" />
                مركز الإشعارات والمهام
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{counts.totalIssues}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {counts.negativeFeedback > 0 && (
                    <Link href="/admin/reviews" className="bg-white dark:bg-slate-900 border-l-4 border-l-amber-500 p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <FileWarning size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800 dark:text-white">{counts.negativeFeedback}</div>
                            <div className="text-xs font-bold text-slate-500">ملاحظات سلبية تحتاج مراجعة</div>
                        </div>
                    </Link>
                )}

                {counts.pendingComments > 0 && (
                    <Link href="/admin/community" className="bg-white dark:bg-slate-900 border-l-4 border-l-indigo-500 p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                            <MessageCircle size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800 dark:text-white">{counts.pendingComments}</div>
                            <div className="text-xs font-bold text-slate-500">تعليقات جديدة بانتظار الموافقة</div>
                        </div>
                    </Link>
                )}

                {/* You can add more cards here */}

            </div>
        </div>
    );
}
