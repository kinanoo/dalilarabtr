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

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Send, Loader2, AlertTriangle, CheckCircle2, Megaphone, Sparkles, Radio, History, Bell, ExternalLink, Newspaper } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface LastArticle {
    slug: string;
    title: string;
}

interface PushResult {
    // Field names must match the /api/admin/push JSON exactly, or the summary
    // renders 0/0/0 regardless of the real result.
    successCount?: number;
    failCount?: number;
    cleaned?: number;
    totalSubscribers?: number;
    telegramSent?: number;
    tgError?: string | null;
    error?: string;
}

// A row from the `notifications` table — what every past broadcast/push
// was saved as. This is the history the owner couldn't see before.
interface SentNotification {
    id: string;
    type: string | null;
    title: string | null;
    message: string | null;
    link: string | null;
    icon: string | null;
    created_at: string | null;
    target_audience: string | null;
    is_active: boolean | null;
}

function timeAgo(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} د`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `منذ ${hrs} س`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `منذ ${days} يوم`;
    return d.toLocaleDateString('en-GB');
}

function isRowActive(r: Record<string, unknown>): boolean {
    const v = (r.is_active ?? r.active);
    return v === true || v === 'active' || v === 1 || v === '1';
}

export default function PushBroadcastPage() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [url, setUrl] = useState('/updates');
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<PushResult | null>(null);
    const [lastArticle, setLastArticle] = useState<LastArticle | null>(null);
    const [subscriberCount, setSubscriberCount] = useState<number | null>(null);

    // Broadcast overview — what's live right now + the full history of what
    // was sent. This is the fix for "notifications get lost": everything the
    // owner broadcasts is now visible in one place.
    const [history, setHistory] = useState<SentNotification[]>([]);
    const [liveBanner, setLiveBanner] = useState<Record<string, unknown> | null>(null);
    const [tickerActive, setTickerActive] = useState(0);
    const [recentUpdates, setRecentUpdates] = useState<{ id: string; title: string }[]>([]);
    const [overviewLoading, setOverviewLoading] = useState(true);

    const loadOverview = useCallback(async () => {
        if (!supabase) { setOverviewLoading(false); return; }
        // allSettled so one table with an unexpected column never blanks the
        // whole panel — each section degrades independently.
        const [notifs, banners, ticker, updates] = await Promise.allSettled([
            supabase.from('notifications')
                .select('id, type, title, message, link, icon, created_at, target_audience, is_active')
                .order('created_at', { ascending: false }).limit(40),
            supabase.from('site_banners').select('*').limit(25),
            supabase.from('news_ticker').select('*').limit(60),
            supabase.from('updates').select('id, title').order('created_at', { ascending: false }).limit(5),
        ]);
        if (notifs.status === 'fulfilled' && notifs.value.data) setHistory(notifs.value.data as SentNotification[]);
        if (banners.status === 'fulfilled' && banners.value.data) {
            setLiveBanner((banners.value.data as Record<string, unknown>[]).find(isRowActive) || null);
        }
        if (ticker.status === 'fulfilled' && ticker.value.data) {
            setTickerActive((ticker.value.data as Record<string, unknown>[]).filter(isRowActive).length);
        }
        if (updates.status === 'fulfilled' && updates.value.data) {
            setRecentUpdates(updates.value.data as { id: string; title: string }[]);
        }
        setOverviewLoading(false);
    }, []);

    useEffect(() => { void loadOverview(); }, [loadOverview]);

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
                void loadOverview(); // refresh the history with the just-sent push
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
                    الإشعار يُحفظ أيضاً في جرس الإشعارات داخل الموقع ويُنشر في قناة
                    تلغرام. استخدم هذا للأخبار العاجلة فقط — لا تُفرط لكي لا يتراجع
                    المشتركون.
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
                                <strong>{result.successCount ?? 0}</strong> ناجح،&nbsp;
                                <strong>{result.failCount ?? 0}</strong> فشل،&nbsp;
                                <strong>{result.cleaned ?? 0}</strong> منتهي الصلاحية (نُظِّفت).
                                {result.telegramSent ? (
                                    <span className="block mt-1">📣 نُشر أيضاً في قناة تلغرام.</span>
                                ) : null}
                                {result.tgError ? (
                                    <span className="block mt-1 text-amber-700 dark:text-amber-300">تعذّر النشر في تلغرام.</span>
                                ) : null}
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

            {/* ───────── ما هو حيّ الآن — current live state of every channel ───────── */}
            <div className="mt-10">
                <h2 className="flex items-center gap-2 text-lg font-black text-slate-800 dark:text-slate-100 mb-3">
                    <Radio size={18} className="text-emerald-600 dark:text-emerald-400" /> ما هو حيّ الآن
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">البنر العلوي</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${liveBanner ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{liveBanner ? 'فعّال' : 'لا يوجد'}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 min-h-[2.5rem]">{liveBanner ? String(liveBanner.title || liveBanner.text || liveBanner.message || 'بنر فعّال') : '—'}</p>
                        <Link href="/admin/banners" className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">إدارة البنرات <ExternalLink size={12} /></Link>
                    </div>
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">شريط الأخبار</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${tickerActive > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{tickerActive > 0 ? `${tickerActive} فعّال` : 'لا يوجد'}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 min-h-[2.5rem] flex items-center"><Radio size={16} className="text-slate-400 ml-1.5" /> {tickerActive} عنوان يجري الآن</p>
                        <Link href="/admin/news-ticker" className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">إدارة الشريط <ExternalLink size={12} /></Link>
                    </div>
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">آخر تحديث</span>
                            <Newspaper size={14} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 min-h-[2.5rem]">{recentUpdates[0]?.title || '—'}</p>
                        <Link href="/admin/updates" className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">إدارة التحديثات <ExternalLink size={12} /></Link>
                    </div>
                </div>
            </div>

            {/* ───────── سجلّ الإشعارات — the history the owner could never see ───────── */}
            <div className="mt-8">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <h2 className="flex items-center gap-2 text-lg font-black text-slate-800 dark:text-slate-100">
                        <History size={18} className="text-emerald-600 dark:text-emerald-400" /> سجلّ الإشعارات المُرسلة
                        <span className="text-xs font-bold text-slate-400">({history.length})</span>
                    </h2>
                    <button onClick={() => { setOverviewLoading(true); void loadOverview(); }} className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors">تحديث</button>
                </div>
                {overviewLoading ? (
                    <div className="text-sm text-slate-400 py-8 text-center">… جاري التحميل</div>
                ) : history.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 text-sm text-slate-400 py-10 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <Bell size={28} className="text-slate-300" />
                        لم يُرسل أي إشعار بعد — سيظهر هنا كلّ ما تبثّه.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {history.map((n) => (
                            <div key={n.id} className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                                <span className="text-lg shrink-0 leading-none mt-0.5">{n.icon || '🔔'}</span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{n.title || '—'}</p>
                                        <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">{timeAgo(n.created_at)}</span>
                                    </div>
                                    {n.message && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{n.message}</p>}
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                        {n.type && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{n.type}</span>}
                                        {n.target_audience && <span className="text-[10px] text-slate-400">→ {n.target_audience}</span>}
                                        {n.link && <Link href={n.link} className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5 truncate max-w-[180px]" dir="ltr">{n.link}</Link>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
