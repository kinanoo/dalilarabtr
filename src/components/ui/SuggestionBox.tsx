'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MessageSquarePlus, Send, Loader2, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface SuggestionBoxProps {
    articleId?: string;
    serviceId?: string;
    source: 'article' | 'service' | 'general';
    title?: string;
}

export default function SuggestionBox({ articleId, serviceId, source, title }: SuggestionBoxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [text, setText] = useState('');
    const [contact, setContact] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        setLoading(true);

        try {
            if (!supabase) throw new Error('No DB');

            const { error } = await supabase.from('content_suggestions').insert([
                {
                    article_id: articleId,
                    service_id: serviceId,
                    suggestion_text: text,
                    contact_info: contact,
                    user_name: 'Visitor', // Could be from Auth if logged in
                    status: 'pending'
                }
            ]);

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                setIsOpen(false);
                setSuccess(false);
                setText('');
                setContact('');
            }, 3000);

        } catch (err) {
            console.error(err);
            alert('حدث خطأ، يرجى المحاولة لاحقاً');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="my-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">

            {/* Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                        <MessageSquarePlus size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base">
                            هل لديك إضافة أو تصحيح لهذا المحتوى؟
                        </h3>
                        <p className="text-xs text-slate-500">ساعدنا في تحسين المعلومات للجميع</p>
                    </div>
                </div>
                {isOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
            </button>

            {/* Form Body */}
            {isOpen && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                    {success ? (
                        <div className="text-center py-6 text-emerald-600">
                            <CheckCircle size={40} className="mx-auto mb-2" />
                            <p className="font-bold">شكراً لك! تم إرسال اقتراحك للإدارة.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <textarea
                                required
                                rows={4}
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                placeholder="اكتب تجربتك أو المعلومة الناقصة هنا..."
                                value={text}
                                onChange={e => setText(e.target.value)}
                            />

                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">رقم للتواصل أو إيميل (اختياري)</label>
                                <input
                                    type="text"
                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="+905..."
                                    value={contact}
                                    onChange={e => setContact(e.target.value)}
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    لن يتم نشر رقمك، فقط للتواصل معك في حال احتجنا لتفاصيل أكثر.
                                </p>
                            </div>

                            <button
                                disabled={loading || !text.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                                إرسال الاقتراح
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
