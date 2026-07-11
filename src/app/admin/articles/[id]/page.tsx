'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { adminUpsert } from '@/lib/adminApi';
import { useRouter } from 'next/navigation';
import { ArticleEditor } from '@/components/admin/editors/ArticleEditor';
import { Loader2, ArrowRight, Save, Send, Globe, FileEdit } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { normalizeId } from '@/lib/useAdminData';
import { extractErrorMessage } from '@/lib/errors';

interface ArticleFormData {
    id?: string;
    title: string;
    category: string;
    intro: string;
    details: string;
    documents: string[];
    steps: string[];
    tips: string[];
    tags: string[];
    image?: string;
    fees?: string;
    source?: string;
    warning?: string;
    lastUpdate?: string;
    published_at?: string;
    active?: boolean;
    status?: string;
    // SEO meta fields — populated separately from body content so editors can
    // tune the Google / social card preview without touching the article copy.
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string[];
    [key: string]: string | string[] | boolean | undefined;
}

export default function ArticleEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const isNew = id === 'new';
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [sendPush, setSendPush] = useState(false);

    // Initial Form State — a brand-new admin article defaults to `approved`
    // (live) EXPLICITLY. The workflow <select> only *displayed* "approved" via
    // `|| 'approved'` while form.status stayed undefined, so on save the value
    // fell back to the DB column default (which could be pending → a silently
    // hidden "published" article) AND the push-notify block never fired (its
    // guard is status === 'approved'). Setting it here makes displayed = saved.
    const [form, setForm] = useState<ArticleFormData>({
        title: '',
        category: 'e-Devlet',
        intro: '',
        details: '',
        documents: [],
        steps: [],
        tips: [],
        tags: [],
        status: 'approved',
    });

    // Fetch Data
    useEffect(() => {
        if (!isNew && supabase) {
            const fetchData = async () => {
                if (!supabase) return;
                const { data, error } = await supabase
                    .from('articles')
                    .select('*')
                    .eq('id', decodeURIComponent(id))
                    .single();

                if (error) {
                    toast.error('فشل تحميل المقال: ' + error.message);
                    router.push('/admin/articles');
                } else if (data) {
                    setForm(data);
                }
                setLoading(false);
            };
            fetchData();
        }
    }, [id, isNew, router]);

    // Save
    const handleSave = async () => {
        if (!supabase) return;
        setSaving(true);
        try {
            const payload: Record<string, unknown> = { ...form };

            // Sanitization
            delete payload.active; // Hard remove just in case
            ['steps', 'documents', 'tips', 'tags'].forEach(k => {
                if (!Array.isArray(payload[k])) payload[k] = [];
            });

            // Map camelCase form fields to the actual snake_case columns.
            // The form state historically used camelCase for date fields
            // (lastUpdate) while the DB column is `last_update`. Sending
            // the camelCase key trips PostgREST schema-cache validation
            // with PGRST204 "Could not find the 'lastUpdate' column".
            // Always drop the camelCase key — even if value is undefined,
            // the property still appears in `{ ...form }` and the upsert
            // serializer can still ship it as null which trips PGRST204.
            const KEY_REMAP: Record<string, string> = {
                lastUpdate: 'last_update',
            };
            for (const [from, to] of Object.entries(KEY_REMAP)) {
                if (Object.prototype.hasOwnProperty.call(payload, from)) {
                    const fromVal = payload[from];
                    if (fromVal !== undefined && fromVal !== null && fromVal !== '') {
                        if (payload[to] === undefined || payload[to] === null || payload[to] === '') {
                            payload[to] = fromVal;
                        }
                    }
                    delete payload[from];
                }
            }

            // Also strip any other known non-DB keys the form may carry
            // (interface flex-fields that shouldn't reach the DB).
            ['active'].forEach(k => { delete payload[k]; });

            // Generate ID if new
            if (isNew && !payload.id) {
                const titleVal = typeof payload.title === 'string' ? payload.title : '';
                if (!titleVal.trim()) throw new Error('عنوان المقال مطلوب قبل الحفظ');
                payload.id = normalizeId(titleVal);
            }

            // Mirror id into slug when slug is empty. The carousel + tag
            // pages + RelatedArticles all build their links from `slug`
            // and fall back to `id`. Populating `slug` here keeps the
            // canonical URL stable even if the title is edited later,
            // and stops fresh rows from rendering /article/null when
            // older code paths read only `slug`. Keep an existing slug
            // untouched — admins sometimes set a short English slug
            // for SEO that we must not overwrite with the Arabic id.
            if (!payload.slug && payload.id) {
                payload.slug = payload.id;
            }

            const { error } = await adminUpsert('articles', payload);

            if (error) throw error;

            // Bust ISR cache so the homepage carousel, articles list, tag
            // pages, and the article URL itself pick up the change on the
            // VERY NEXT request — not after the 5-minute revalidate window.
            // User complaint: edited article title in admin, carousel kept
            // showing the old title for minutes. The carousel reads from a
            // server component (FeaturedNewsHero) cached by `export const
            // revalidate = 300` on the homepage. revalidatePath('/') flips
            // that to "stale" so the next visitor triggers a fresh fetch.
            //
            // Fire-and-forget — the toast + redirect should not wait. If
            // the call fails (401 in non-admin context, network blip, etc.)
            // the worst case is the old 5-min cache window — same as
            // before this fix.
            try {
                const slugForPath = (payload.slug as string) || (payload.id as string);
                const tagPaths: string[] = Array.isArray(payload.tags)
                    ? (payload.tags as string[])
                          .filter(t => typeof t === 'string' && t.length < 60)
                          .slice(0, 6)
                          .map(t => `/tag/${encodeURIComponent(t)}`)
                    : [];
                const paths = [
                    '/',
                    '/articles',
                    '/updates',
                    slugForPath ? `/article/${slugForPath}` : '',
                    ...tagPaths,
                ].filter(Boolean);
                void fetch('/api/admin/revalidate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paths }),
                }).catch(() => { /* non-critical */ });
            } catch { /* non-critical */ }

            // Notify when saving an APPROVED article with the toggle on — whether
            // it's a brand-new article OR an existing pending draft being approved
            // (isNew was too narrow: approving a pending draft never fired). We pass
            // the specific articleId so it notifies THIS article regardless of its
            // created_at (the 30-min cron's time window would miss an old draft).
            // Deduped by link server-side, so re-saving never double-posts.
            if (sendPush && payload.title && payload.status === 'approved') {
                try {
                    const res = await fetch('/api/admin/notify-now', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ articleId: payload.id }),
                    });
                    const r = await res.json();
                    if (res.ok) {
                        const bits: string[] = [];
                        if (typeof r.pushSuccess === 'number' && r.pushSuccess > 0) bits.push(`${r.pushSuccess} جهاز`);
                        if (r.telegramSent > 0) bits.push('تلغرام');
                        if (r.sent === 0) toast.success(isNew ? 'تم إنشاء المقال' : 'تم حفظ التعديلات');
                        else toast.success(bits.length ? `تم النشر + إشعار (${bits.join(' + ')})` : 'تم النشر + إشعار');
                    } else {
                        toast.success(isNew ? 'تم إنشاء المقال بنجاح' : 'تم حفظ التعديلات');
                        toast.error('فشل إرسال الإشعار: ' + (r.error || ''));
                    }
                } catch {
                    toast.success(isNew ? 'تم إنشاء المقال بنجاح' : 'تم حفظ التعديلات');
                    toast.error('فشل إرسال الإشعار');
                }
            } else {
                toast.success(isNew ? 'تم إنشاء المقال بنجاح' : 'تم حفظ التعديلات');
            }
            router.refresh();
            router.push('/admin/articles');
        } catch (err) {
            // Supabase PostgrestError is a plain object, not an Error instance.
            // The old `err instanceof Error ? err.message : String(err)` check
            // fell through to String(err) and rendered "[object Object]" — the
            // admin couldn't tell whether it was an RLS denial, a unique-key
            // violation, or a missing column. extractErrorMessage pulls the
            // readable bits (message + details + hint + code) so the toast
            // actually points at the cause.
            toast.error('خطأ في الحفظ: ' + extractErrorMessage(err));
            // Dev-only raw dump to help debug save failures locally; the admin
            // toast above is the production-facing message.
            if (process.env.NODE_ENV !== 'production') {
                // eslint-disable-next-line no-console
                console.error('[articles save] raw error:', err);
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>;

    const isPublished = (form.status || 'approved') === 'approved';
    const setStatus = (status: string) => {
        setForm((f: ArticleFormData) => ({ ...f, status }));
        // A draft never pushes — clear the toggle when leaving "published".
        if (status !== 'approved') setSendPush(false);
    };
    const saveLabel = saving
        ? 'جاري الحفظ...'
        : isPublished
            ? (sendPush ? 'نشر + إشعار' : 'نشر الآن')
            : 'حفظ كمسودة';

    return (
        <div className="p-4 sm:p-5 max-w-5xl mx-auto pb-32">
            <div className="mb-4">
                <Link href="/admin/articles" className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 w-fit mb-3 text-sm">
                    <ArrowRight size={18} />
                    <span className="font-bold">العودة للقائمة</span>
                </Link>
                <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white">
                        {isNew ? 'كتابة مقال جديد' : 'تعديل المقال'}
                    </h1>
                    {/* Live status pill — always visible so the admin knows at a
                        glance whether this article is public or a hidden draft. */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black ${
                        isPublished
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                            : form.status === 'rejected'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                    }`}>
                        {isPublished ? <Globe size={12} /> : <FileEdit size={12} />}
                        {isPublished ? 'ظاهر للزوّار' : form.status === 'rejected' ? 'مرفوض' : 'مسودة — غير ظاهر'}
                    </span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
                <ArticleEditor form={form} setForm={setForm} />
            </div>

            {/* Sticky Save Bar — publish state is front-and-center: a segmented
                توgle picks live-vs-draft in one tap, the push option only shows
                for a published article, and the button label states what will
                actually happen. No more digging into a collapsed panel to know
                if the article is live.
                Below xl the bar sits ABOVE the admin MobileBottomNav (h-16 +
                safe-area, z-[70]) — anchoring at bottom-0 put it UNDER the nav,
                which completely hid the save button on phones. */}
            <div className="fixed bottom-[calc(4rem_+_env(safe-area-inset-bottom))] xl:bottom-0 left-0 right-0 px-3 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 sm:gap-3 z-50 md:pl-64 shadow-lg">
                {/* Live / draft segmented control */}
                <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mr-0 sm:mr-1">
                    <button
                        type="button"
                        onClick={() => setStatus('approved')}
                        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                            isPublished ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <Globe size={14} /> منشور
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatus('pending')}
                        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                            !isPublished ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <FileEdit size={14} /> مسودة
                    </button>
                </div>

                {/* Push option — only meaningful for a live article. Visible on
                    ALL breakpoints (the admin often publishes from a phone); on
                    narrow screens the label text collapses to just the checkbox
                    + icon so it stays toggleable without overflowing the bar. */}
                {isPublished && (
                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                        <input
                            type="checkbox"
                            checked={sendPush}
                            onChange={e => setSendPush(e.target.checked)}
                            className="w-4 h-4 rounded accent-emerald-600"
                        />
                        <Send size={14} className="text-emerald-600" />
                        <span className="hidden sm:inline text-xs font-bold text-slate-600 dark:text-slate-300">إشعار للمتابعين</span>
                    </label>
                )}

                <button
                    onClick={() => router.back()}
                    className="mr-auto px-4 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm"
                >
                    إلغاء
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-5 sm:px-7 py-2 text-white rounded-xl font-black shadow-lg flex items-center gap-2 text-sm disabled:opacity-60 ${
                        isPublished
                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                            : 'bg-slate-600 hover:bg-slate-700 shadow-slate-600/20'
                    }`}
                >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {saveLabel}
                </button>
            </div>
        </div>
    );
}
