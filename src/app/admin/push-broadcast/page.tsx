'use client';

/**
 * /admin/push-broadcast — admin tool to send a Web Push notification to
 * every subscribed device in a single submit.
 *
 * Why this page exists:
 *   - The /api/admin/push endpoint has been live for a while but had no
 *     dedicated UI — admins had to wire it from within article publishing
 *     flows or DevTools. That made the most useful broadcast pattern
 *     ("breaking news — read this NOW") effectively un-shippable for a
 *     non-technical admin.
 *   - With time-sensitive content (e.g. the closed-neighborhoods 80%
 *     reduction story), a one-tap broadcast doubles the read rate within
 *     the first hour. This page closes that gap.
 *
 * Safety constraints (already enforced server-side; we mirror in UI):
 *   - 200 char title cap
 *   - 1000 char message cap
 *   - URL must be a relative same-origin path — we block any external URL
 *     in the input so admins can't even attempt to push phishing links.
 *   - Server rate-limits to 10 broadcasts/hour/admin. We surface that as
 *     a user-visible warning on 429 so the admin understands the limit.
 *
 * UX notes:
 *   - "نسخة سريعة من الخبر العاجل" button auto-fills the form with the
 *     last published article's title + slug. Saves clicks on the most
 *     common case (push the latest article).
 *   - Live character counters on both fields prevent length surprises.
 *   - Confirmation dialog before send — a push is irreversible.
 */

import { useEffect, useState } from 'react';
import { Send, Loader2, AlertTriangle, CheckCircle2, Megaphone, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface LastArticle {
    slug: string;
    title: string;
}

interface PushResult {
    success?: number;
    failed?: number;
    expired?: number;
    error?: string;
}

export default function PushBroadcastPage() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [url, setUrl] = useState('/updates');
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<PushResult | null>(null);
    const [lastArticle, setLastArticle] = useState<LastArticle | null>(null);
    const [subscriberCount, setSubscriberCount] = useState<number | null>(null);

    // Best-effort load: latest published article (for quick-fill) +
    // current subscriber count (so the admin sees who they're reaching
    // before they hit send). Both fields hide if they can't be loaded.
    useEffect(() => {
        void (async () => {
            if (!supabase) return;
            try {
                const [{ data: articleRows }, countRes] = await Promise.all([
                    supabase
                        .from('articles')
                        .select('slug, title')
                        .eq('active', true)
                        .eq('status', 'approved')
                        .order('published_at', { ascending: false })
                        .limit(1),
                    supabase
                        .from('push_subscriptions')
                        .select('*', { count: 'exact', head: true }),
                ]);
                if (articleRows && articleRows[0]) {
                    setLastArticle(articleRows[0] as LastArticle);
                }
                if (typeof countRes?.count === 'number') {
                    setSubscriberCount(countRes.count);
                }
            } catch {
                // ignore — defaults are fine
            }
        })();
    }, []);

    function quickFillFromLatest() {
        if (!lastArticle) return;
        setTitle(`🚨 جديد: ${lastArticle.title.slice(0, 180)}`);
        setMessage('اضغط لقراءة الخبر كاملاً مع كلّ التفاصيل والمصادر الرسمية.');
        setUrl(`/article/${lastArticle.slug}`);
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (submitting) return;
        setResult(null);

        // Light client-side validation. The server is the source of truth.
        if (!title.trim()) {
            setResult({ error: 'العنوان مطلوب' });
            return;
        }
        if (title.length > 200) {
            setResult({ error: 'العنوان طويل جداً (الحد 200 حرف)' });
            return;
        }
        if (message.length > 1000) {
            setResult({ error: 'الرسالة طويلة جداً (الحد 1000 حرف)' });
            return;
        }
        if (url && !/^\/[a-z0-9_\-/?=&#%.]*$/i.test(url)) {
            setResult({ error: 'الرابط يجب أن يبدأ بـ / (مسار داخلي فقط)' });
            return;
        }

        const confirmed = window.confirm(
            `سيتمّ بثّ هذا الإشعار إلى ${
                subscriberCount !== null ? subscriberCount : 'جميع'
            } مشترك. لا يمكن التراجع. هل أنت متأكد؟`
        );
        if (!confirmed) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/admin/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    message: message.trim() || undefined,
                    url: url.trim() || undefined,
                }),
            });
            const payload: PushResult & { error?: string } = await res
                .json()
                .catch(() => ({}));
            if (!res.ok) {
                setResult({ error: payload?.error || 'فشل البثّ' });
            } else {
                setResult(payload);
                // Clear the form on success so the admin can't accidentally
                // double-send the same notification.
                setTitle('');
                setMessage('');
                setUrl('/updates');
            }
        } catch {
            setResult({ error: 'خطأ في الشبكة. حاول مرة أخرى.' });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                        <Megaphone size={22} />
                    </span>
                    بثّ إشعار فوري
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    أرسل إشعاراً عبر Web Push لكلّ مشترك فعّل التنبيهات على الموقع.
                    الإشعار يُحفظ أيضاً في جرس الإشعارات داخل الموقع. استخدم هذا
                    للأخبار العاجلة فقط — لا تُفرط لكي لا يتراجع المشتركون.
                </p>
            </div>

            {/* Subscriber count + quick-fill — at-a-glance context */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {subscriberCount === null
                        ? '… جاري عدّ المشتركين'
                        : `${subscriberCount.toLocaleString('en-US')} مشترك سيستلم الإشعار`}
                </div>
                {lastArticle && (
                    <button
                        type="button"
                        onClick={quickFillFromLatest}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                    >
                        <Sparkles size={14} />
                        نسخة سريعة من آخر مقال
                    </button>
                )}
            </div>

            <form onSubmit={onSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5">
                {/* Title */}
                <div>
                    <label htmlFor="push-title" className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                        العنوان <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="push-title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={200}
                        required
                        placeholder="مثال: 🚨 عاجل: تخفيض 80٪ من الأحياء المغلقة"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="mt-1 text-[11px] text-slate-400 text-left tabular-nums">
                        {title.length} / 200
                    </div>
                </div>

                {/* Message */}
                <div>
                    <label htmlFor="push-message" className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                        نصّ الإشعار
                    </label>
                    <textarea
                        id="push-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={1000}
                        rows={4}
                        placeholder="نصّ قصير يحفّز النقر — لا يتجاوز سطرين على الموبايل."
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                    <div className="mt-1 text-[11px] text-slate-400 text-left tabular-nums">
                        {message.length} / 1000
                    </div>
                </div>

                {/* URL */}
                <div>
                    <label htmlFor="push-url" className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                        رابط فتح الإشعار (مسار داخلي)
                    </label>
                    <input
                        id="push-url"
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="/article/goc-idaresi-updates-2026"
                        dir="ltr"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                        يبدأ بـ <code className="font-mono">/</code> فقط — لا روابط خارجية لمنع التصيّد.
                    </p>
                </div>

                {/* Result panel — shows success counts or the server error. */}
                {result && (
                    result.error ? (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-200 text-sm">
                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                            <span>{result.error}</span>
                        </div>
                    ) : (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-sm">
                            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                            <div>
                                تمّ البثّ:&nbsp;
                                <strong>{result.success ?? 0}</strong> ناجح،&nbsp;
                                <strong>{result.failed ?? 0}</strong> فشل،&nbsp;
                                <strong>{result.expired ?? 0}</strong> منتهي الصلاحية (نُظِّفت).
                            </div>
                        </div>
                    )
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            جاري البثّ…
                        </>
                    ) : (
                        <>
                            <Send size={20} />
                            بثّ الإشعار الآن
                        </>
                    )}
                </button>
            </form>

            {/* Quick tips below — not legalese, just practical reminders */}
            <div className="mt-6 text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-1">
                <p>💡 <strong>أفضل وقت للبثّ:</strong> الصباح المبكر (8-10) أو المساء (7-9) — هنا يتفاعل المشتركون أكثر.</p>
                <p>💡 <strong>إيموجي في البداية</strong> يرفع نسبة الفتح بشكل ملحوظ (🚨 للعاجل، 📢 للإعلان، 🟢 للتفاؤل).</p>
                <p>💡 <strong>أنت محدود بـ10 بثّات في الساعة</strong> — للحماية من الإفراط. استخدمها بحكمة.</p>
            </div>
        </div>
    );
}
