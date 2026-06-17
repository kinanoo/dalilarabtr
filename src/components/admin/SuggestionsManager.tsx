'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MessageSquare, CheckCircle, XCircle, Trash2, Clock, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

type Suggestion = {
    id: string;
    suggestion_text: string;
    user_name: string;
    contact_info: string;
    status: string;
    created_at: string;
    article_id?: string;
    service_id?: string;
};

export default function SuggestionsManager() {
    const { showToast } = useToast();
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSuggestions();
    }, []);

    const fetchSuggestions = async () => {
        setLoading(true);
        if (!supabase) return;
        const { data, error } = await supabase
            .from('content_suggestions')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setSuggestions(data);
        setLoading(false);
    };

    const updateStatus = async (id: string, status: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('content_suggestions').update({ status }).eq('id', id);
        if (!error) {
            showToast('تم تحديث الحالة', 'success');
            setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
        } else {
            showToast('حدث خطأ', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('حذف هذا الاقتراح؟')) return;
        if (!supabase) return;
        const { error } = await supabase.from('content_suggestions').delete().eq('id', id);
        if (!error) {
            showToast('تم الحذف بنجاح', 'success');
            setSuggestions(prev => prev.filter(s => s.id !== id));
        }
    };

    // Visual mapping per status — chip + accent stripe + gradient surface
    const statusStyle = (s: string) => s === 'pending'
        ? { chip: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', label: 'انتظار', accent: 'bg-amber-500', surface: 'from-white to-amber-50/40 dark:from-slate-900 dark:to-amber-950/15' }
        : s === 'approved'
        ? { chip: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300', label: 'مُعتمَد', accent: 'bg-emerald-500', surface: 'from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/15' }
        : { chip: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400', label: s, accent: 'bg-slate-400', surface: 'from-white to-slate-50/40 dark:from-slate-900 dark:to-slate-800/30' };

    const pendingCount = suggestions.filter(s => s.status === 'pending').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-xl font-black flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm">
                        <MessageSquare size={18} />
                    </span>
                    اقتراحات المجتمع
                </h2>
                {pendingCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-[11px] font-black tracking-wider uppercase">
                        <Clock size={12} />
                        <span className="tabular-nums" dir="ltr">{pendingCount}</span>
                        قيد المراجعة
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4">
                {suggestions.map(suggestion => {
                    const meta = statusStyle(suggestion.status);
                    return (
                        <div
                            key={suggestion.id}
                            className={`group relative overflow-hidden bg-gradient-to-br ${meta.surface} p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all`}
                        >
                            <span className={`absolute top-0 right-0 h-full w-1 ${meta.accent} opacity-70 group-hover:opacity-100 transition-opacity`} />

                            <div className="flex justify-between items-start mb-3 gap-2 flex-wrap">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${meta.chip}`}>
                                        {meta.label}
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1 tabular-nums" dir="ltr">
                                        <Clock size={12} />
                                        {new Date(suggestion.created_at).toLocaleDateString('ar-TR')}
                                    </span>
                                </div>
                                <div className="flex gap-1.5">
                                    <button
                                        onClick={() => updateStatus(suggestion.id, 'approved')}
                                        className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:scale-110 active:scale-95 transition-all"
                                        title="اعتماد"
                                        aria-label="اعتماد"
                                    >
                                        <CheckCircle size={18} />
                                    </button>
                                    <button
                                        onClick={() => updateStatus(suggestion.id, 'rejected')}
                                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-110 active:scale-95 transition-all"
                                        title="تجاهل"
                                        aria-label="تجاهل"
                                    >
                                        <XCircle size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(suggestion.id)}
                                        className="p-2 rounded-xl bg-red-50 dark:bg-red-900/15 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:scale-110 active:scale-95 transition-all"
                                        title="حذف"
                                        aria-label="حذف"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <p className="text-slate-800 dark:text-slate-100 font-medium mb-3 whitespace-pre-wrap leading-relaxed">
                                {suggestion.suggestion_text}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 text-xs border-t border-slate-200 dark:border-slate-700/60 pt-3">
                                <span className="text-slate-600 dark:text-slate-300 font-bold">
                                    بواسطة: {suggestion.user_name || 'زائر'}
                                </span>
                                {suggestion.contact_info && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-black">
                                        <Mail size={11} />
                                        {suggestion.contact_info}
                                    </span>
                                )}
                                {suggestion.article_id && (
                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-lg font-mono" dir="ltr">
                                        Article: {suggestion.article_id.substring(0, 8)}…
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}

                {suggestions.length === 0 && !loading && (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <MessageSquare size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <p className="text-slate-500 dark:text-slate-400 font-bold">لا توجد اقتراحات جديدة حتى الآن.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
