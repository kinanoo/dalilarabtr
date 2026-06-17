'use client';

import { useState } from 'react';
import { Send, Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/logger';

export default function AdminPushPanel() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [url, setUrl] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);

        try {
            // Send only the notification content — subscriptions are fetched server-side
            const response = await fetch('/api/admin/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, message, url })
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || 'فشل إرسال الإشعارات');
            }

            const result = await response.json();

            let msg = `تم الإرسال بنجاح إلى ${result.successCount} من أصل ${result.totalSubscribers} مشترك`;
            if (result.cleaned > 0) msg += ` (تم حذف ${result.cleaned} اشتراك منتهي)`;
            if (result.failCount > 0) msg += ` — ${result.failCount} فشل`;
            toast.success(msg);
            setTitle('');
            setMessage('');
            setUrl('');
        } catch (error) {
            logger.error('Send error:', error);
            toast.error('حدث خطأ أثناء الإرسال');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-800 dark:to-emerald-950/15 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <span className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-emerald-500 to-teal-500 opacity-70" />

            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200/60 dark:from-emerald-900/40 dark:to-emerald-800/30 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow-sm">
                    <Bell size={24} />
                </div>
                <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-black tracking-wider uppercase mb-1">
                        مباشر
                    </span>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">إرسال إشعار عام</h2>
                    <p className="text-sm text-slate-500">إرسال تنبيه لجميع المشتركين</p>
                </div>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
                <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5 uppercase tracking-wider">
                        عنوان الإشعار
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="مثال: تحديث هام بخصوص الإقامة"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5 uppercase tracking-wider">
                        نص الرسالة
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="اكتب تفاصيل الإشعار هنا..."
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all h-24 resize-none"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5 uppercase tracking-wider">
                        رابط التوجيه عند النقر
                    </label>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="/article/residence-1 أو /updates أو /faq"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
                        dir="ltr"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                        اتركه فارغاً ليتم التوجيه لصفحة التحديثات تلقائياً
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={isSending}
                    className="group/btn w-full flex items-center justify-center gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3.5 rounded-xl transition-all shadow-md shadow-emerald-600/30 hover:shadow-lg hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
                >
                    {isSending ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            جاري الإرسال...
                        </>
                    ) : (
                        <>
                            <Send size={18} className="group-hover/btn:rotate-12 transition-transform" />
                            إرسال الآن
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
