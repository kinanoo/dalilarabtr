'use client';

import { useState } from 'react';
import { Send, Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

export default function AdminPushPanel() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [url, setUrl] = useState('/');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);

        try {
            if (!supabase) throw new Error('Supabase client not initialized');

            // 1. Get all subscriptions
            const { data: subscriptions, error: fetchError } = await supabase
                .from('push_subscriptions')
                .select('*');

            if (fetchError) throw fetchError;

            if (!subscriptions || subscriptions.length === 0) {
                toast.error('لا يوجد مشتركين في الإشعارات');
                setIsSending(false);
                return;
            }

            // 2. Send via Edge Function (or API route)
            // Since we don't have an Edge Function set up yet, we'll simulate the call
            // In a real app, you'd POST to /api/send-push

            const payload = {
                title,
                message,
                url,
                subscriptions // In production, don't send all to client, send ID
            };

            // Call the API route we are about to create
            const response = await fetch('/api/admin/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to send notifications');

            const result = await response.json();

            toast.success(`تم إرسال الإشعار إلى ${result.successCount} مشترك!`);
            setTitle('');
            setMessage('');
        } catch (error) {
            console.error('Send error:', error);
            toast.error('حدث خطأ أثناء الإرسال');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                    <Bell className="text-emerald-600 dark:text-emerald-400" size={24} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">إرسال إشعار عام</h2>
                    <p className="text-sm text-slate-500">إرسال تنبيه لجميع المشتركين</p>
                </div>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        عنوان الإشعار
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="مثال: تحديث هام بخصوص الإقامة"
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        نص الرسالة
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="اكتب تفاصيل الإشعار هنا..."
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all h-24 resize-none"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        رابط التوجيه (اختياري)
                    </label>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="/"
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSending}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSending ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            جاري الإرسال...
                        </>
                    ) : (
                        <>
                            <Send size={18} />
                            إرسال الآن
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
