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

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="text-blue-500" />
                اقتراحات المجتمع (Wiki-Style)
            </h2>

            <div className="grid grid-cols-1 gap-4">
                {suggestions.map(suggestion => (
                    <div key={suggestion.id} className={`bg-white dark:bg-slate-900 p-4 rounded-xl border ${suggestion.status === 'pending' ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200'}`}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${suggestion.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                        suggestion.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            'bg-slate-100 text-slate-500'
                                    }`}>
                                    {suggestion.status === 'pending' ? 'انتظار' : suggestion.status === 'approved' ? 'تم الاعتماد' : suggestion.status}
                                </span>
                                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                                    <Clock size={12} />
                                    {new Date(suggestion.created_at).toLocaleDateString('ar-TR')}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => updateStatus(suggestion.id, 'approved')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="اعتماد">
                                    <CheckCircle size={18} />
                                </button>
                                <button onClick={() => updateStatus(suggestion.id, 'rejected')} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg" title="تجاهل">
                                    <XCircle size={18} />
                                </button>
                                <button onClick={() => handleDelete(suggestion.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="حذف">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <p className="text-slate-800 dark:text-slate-200 font-medium mb-3 whitespace-pre-wrap">
                            {suggestion.suggestion_text}
                        </p>

                        <div className="flex flex-wrap gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
                            <span>بواسطة: {suggestion.user_name || 'زائر'}</span>
                            {suggestion.contact_info && (
                                <span className="flex items-center gap-1 text-blue-600">
                                    <Mail size={12} />
                                    {suggestion.contact_info}
                                </span>
                            )}
                            {suggestion.article_id && <span className="bg-slate-100 px-2 rounded">Article ID: {suggestion.article_id.substring(0, 8)}...</span>}
                        </div>
                    </div>
                ))}

                {suggestions.length === 0 && !loading && (
                    <div className="text-center py-10 text-slate-400">
                        لا توجد اقتراحات جديدة حتى الآن.
                    </div>
                )}
            </div>
        </div>
    );
}
