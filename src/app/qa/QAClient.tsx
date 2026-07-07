'use client';

/**
 * QAClient — public Q&A page (interactive parts).
 *
 * Shows answered questions + a CTA that opens an "Ask a question" modal.
 * On submit: optimistic toast, no immediate listing (question is pending
 * until admin answers it).
 *
 * 2026-07 redesign — brought in line with the site's new design language
 * (codes/faq/services): shared light PageHero + hero search instead of the
 * hand-rolled gradient icon hero, flat white cards instead of colour-washed
 * gradient panels, and RTL logical classes throughout.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    HelpCircle,
    Plus,
    Send,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    X,
    ChevronDown,
} from 'lucide-react';
import PageHero from '@/components/PageHero';
import HeroSearchInput from '@/components/HeroSearchInput';

interface QAItem {
    id: string;
    question: string;
    context: string | null;
    category: string | null;
    asker_name: string | null;
    answer: string;
    answered_at: string;
    upvotes: number;
    views: number;
    is_featured: boolean;
}

interface AskResult {
    state: 'idle' | 'sending' | 'success' | 'error';
    message?: string;
}

/** Arabic counted noun for answered questions — Latin digits. */
function answeredCount(n: number): string {
    if (n === 1) return 'سؤال واحد مُجاب';
    if (n === 2) return 'سؤالان مُجابان';
    if (n <= 10) return `${n} أسئلة مُجابة`;
    return `${n} سؤالاً مُجاباً`;
}

export default function QAClient({
    initialItems = [],
    initialTotal = 0,
}: {
    initialItems?: QAItem[];
    initialTotal?: number;
}) {
    // Seed from server-fetched props so the answered questions are present on
    // first paint (SEO + no spinner). We still re-fetch on mount to pick up
    // freshly-answered questions between ISR revalidations.
    const [items, setItems] = useState<QAItem[]>(initialItems);
    const [total, setTotal] = useState(initialTotal);
    const [loading, setLoading] = useState(initialItems.length === 0);
    const [query, setQuery] = useState('');
    const [openId, setOpenId] = useState<string | null>(null);
    const [showAsk, setShowAsk] = useState(false);

    useEffect(() => {
        void (async () => {
            try {
                const res = await fetch('/api/questions?limit=50&featured=1');
                const data = await res.json();
                if (Array.isArray(data?.items)) setItems(data.items);
                if (typeof data?.total === 'number') setTotal(data.total);
            } catch {
                // Keep the server-provided items on network failure.
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Client-side filter for the search box. Cheap given the page only loads
    // ~50 items at a time; if it grows past a few hundred we'd switch to a
    // server-side search endpoint.
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter(
            (it) =>
                it.question.toLowerCase().includes(q) ||
                (it.answer && it.answer.toLowerCase().includes(q)) ||
                (it.category && it.category.toLowerCase().includes(q))
        );
    }, [items, query]);

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <PageHero
                title="اسأل واحصل على إجابة موثّقة"
                description={`منصّة سؤال وجواب للسوريين والعرب في تركيا. اطرح سؤالك وسيُجيبك فريقنا بمصادر رسمية.${
                    total > 0 ? ` جاهز للاطّلاع: ${answeredCount(total)}.` : ''
                }`}
                icon={<HelpCircle className="w-10 h-10 md:w-12 md:h-12 text-emerald-600 dark:text-emerald-300" />}
            >
                <HeroSearchInput
                    value={query}
                    onChange={setQuery}
                    placeholder="ابحث في الأسئلة المُجابة…"
                />
                <button
                    type="button"
                    onClick={() => setShowAsk(true)}
                    className="mt-4 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
                >
                    <Plus size={18} /> اطرح سؤالك الآن
                </button>
            </PageHero>

            <div className="max-w-4xl mx-auto px-4 py-10">
                {/* List */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={28} className="animate-spin text-emerald-600" />
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState query={query} onAsk={() => setShowAsk(true)} />
                ) : (
                    <ul className="space-y-3">
                        {filtered.map((q) => (
                            <QACard
                                key={q.id}
                                item={q}
                                isOpen={openId === q.id}
                                onToggle={() => setOpenId(openId === q.id ? null : q.id)}
                            />
                        ))}
                    </ul>
                )}
            </div>

            {/* Floating ask CTA (mobile-only — desktop has the hero button) */}
            <button
                type="button"
                onClick={() => setShowAsk(true)}
                aria-label="اطرح سؤالاً جديداً"
                className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-emerald-600 text-white font-bold px-5 py-3 rounded-full shadow-2xl shadow-emerald-600/40 border-2 border-white/40"
            >
                <Plus size={18} /> سؤال جديد
            </button>

            {/* Modal */}
            {showAsk && <AskModal onClose={() => setShowAsk(false)} />}
        </main>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────────

function QACard({
    item,
    isOpen,
    onToggle,
}: {
    item: QAItem;
    isOpen: boolean;
    onToggle: () => void;
}) {
    const date = useMemo(() => {
        try {
            // 'ar-u-nu-latn': Arabic month names, Latin digits (site standard).
            return new Date(item.answered_at).toLocaleDateString('ar-u-nu-latn', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return '';
        }
    }, [item.answered_at]);

    return (
        <li
            className={`group bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 ${
                isOpen
                    ? 'border-emerald-400 dark:border-emerald-600 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md hover:-translate-y-0.5'
            }`}
        >
            <button
                type="button"
                onClick={onToggle}
                className="w-full text-start p-4 sm:p-5 flex items-start gap-3"
                aria-expanded={isOpen}
            >
                <span className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-black text-sm">
                    س
                </span>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 dark:text-slate-50 leading-relaxed group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                        {item.question}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {item.category && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/40 font-bold">
                                {item.category}
                            </span>
                        )}
                        {item.is_featured && (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                                <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                مميّز
                            </span>
                        )}
                        {date && (
                            <span className="font-medium tabular-nums">{date}</span>
                        )}
                    </div>
                </div>
                {/* Toggle chevron — rotates when expanded */}
                <ChevronDown
                    size={18}
                    aria-hidden="true"
                    className={`shrink-0 mt-1 transition-transform duration-300 ${
                        isOpen
                            ? 'rotate-180 text-emerald-500'
                            : 'text-slate-400 dark:text-slate-500 group-hover:text-emerald-500'
                    }`}
                />
            </button>
            {isOpen && (
                <div className="px-4 sm:px-5 pb-5 pt-1 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-4">
                        <div className="flex items-start gap-2.5">
                            <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-xs">
                                ج
                            </span>
                            <div
                                className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap"
                                dir="rtl"
                            >
                                {item.answer}
                            </div>
                        </div>
                    </div>
                    {item.context && (
                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 italic flex items-start gap-1.5">
                            <strong className="text-slate-600 dark:text-slate-300 not-italic">سياق السؤال:</strong>
                            <span>{item.context}</span>
                        </p>
                    )}
                </div>
            )}
        </li>
    );
}

function EmptyState({ query, onAsk }: { query: string; onAsk: () => void }) {
    return (
        <div className="text-center py-12 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800">
            <HelpCircle size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-slate-600 dark:text-slate-400 font-bold mb-1">
                {query ? `لا أسئلة مُجابة تطابق «${query}»` : 'لا أسئلة مُجابة بعد'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
                كن أوّل من يسأل — وسنجيبك بأسرع وقت.
            </p>
            <button
                type="button"
                onClick={onAsk}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl"
            >
                <Plus size={16} /> اطرح سؤالك
            </button>
        </div>
    );
}

function AskModal({ onClose }: { onClose: () => void }) {
    const [question, setQuestion] = useState('');
    const [context, setContext] = useState('');
    const [category, setCategory] = useState('');
    const [askerName, setAskerName] = useState('');
    const [askerEmail, setAskerEmail] = useState('');
    const [emailProvided, setEmailProvided] = useState(false);
    const [result, setResult] = useState<AskResult>({ state: 'idle' });

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (result.state === 'sending') return;
        setResult({ state: 'sending' });
        setEmailProvided(askerEmail.trim().length > 0);

        try {
            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    context,
                    category,
                    askerName,
                    askerEmail,
                }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
                setResult({ state: 'error', message: payload?.error || 'فشل الإرسال' });
                return;
            }
            setResult({ state: 'success' });
            if ('vibrate' in navigator) navigator.vibrate?.([50]);
        } catch {
            setResult({ state: 'error', message: 'خطأ في الشبكة' });
        }
    }

    return (
        <div
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 flex items-center gap-2">
                            <HelpCircle size={22} className="text-emerald-600" />
                            اطرح سؤالك
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">سنجيبك خلال أيام بمصادر موثّقة.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                        aria-label="إغلاق"
                    >
                        <X size={18} />
                    </button>
                </div>

                {result.state === 'success' ? (
                    <div className="text-center py-8">
                        <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
                        <p className="font-bold text-slate-900 dark:text-slate-50 text-lg mb-1">
                            تمّ استلام سؤالك
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                            {emailProvided
                                ? 'سنجيبك فور مراجعته، ونُعلِمك على بريدك عند نشر الإجابة.'
                                : 'سنجيبك فور مراجعته — تابِع صفحة الأسئلة للاطّلاع على الإجابة.'}
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl"
                        >
                            تمام
                        </button>
                    </div>
                ) : (
                    <form onSubmit={onSubmit} className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                سؤالك <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                maxLength={1000}
                                rows={3}
                                required
                                placeholder="مثال: كيف أجدّد إقامتي في شانلي أورفا؟"
                                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                سياق إضافي (اختياري)
                            </label>
                            <textarea
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                maxLength={2000}
                                rows={2}
                                placeholder="حالتك الخاصّة، تفاصيل تساعدنا للإجابة بدقّة…"
                                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    التصنيف
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                >
                                    <option value="">— اختر —</option>
                                    <option>الإقامة والكيمليك</option>
                                    <option>العمل والإذن</option>
                                    <option>الصحة والتأمين</option>
                                    <option>التعليم والجامعات</option>
                                    <option>السفر والمعابر</option>
                                    <option>قانون وقضايا</option>
                                    <option>السكن والإيجار</option>
                                    <option>أخرى</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    اسمك (اختياري)
                                </label>
                                <input
                                    type="text"
                                    value={askerName}
                                    onChange={(e) => setAskerName(e.target.value)}
                                    maxLength={80}
                                    placeholder="أبو محمد"
                                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                بريدك الإلكتروني (اختياري) — لنُعلِمك عند نشر الإجابة
                            </label>
                            <input
                                type="email"
                                value={askerEmail}
                                onChange={(e) => setAskerEmail(e.target.value)}
                                maxLength={200}
                                inputMode="email"
                                autoComplete="email"
                                dir="ltr"
                                placeholder="you@example.com"
                                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-start"
                            />
                        </div>

                        {result.state === 'error' && (
                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs">
                                <AlertTriangle size={14} className="shrink-0" />
                                {result.message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={result.state === 'sending'}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                        >
                            {result.state === 'sending' ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" /> جاري الإرسال…
                                </>
                            ) : (
                                <>
                                    <Send size={18} /> أرسل السؤال
                                </>
                            )}
                        </button>

                        <p className="text-[11px] text-slate-400 text-center mt-1">
                            بإرسال السؤال، توافق على{' '}
                            <Link href="/privacy" className="underline hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                شروط الاستخدام وسياسة الخصوصية
                            </Link>
                            .
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
