import { useState } from 'react';
import { Tags, FileText, Link as LinkIcon, AlertCircle, Clock, Search, Settings2, ExternalLink, Sparkles, Flame } from 'lucide-react';
import { Field } from '../ui/Field';
import { inputStyles, ltrInputStyles } from '../ui/styles';
import { ArrayInput } from '../ui/ArrayInput';
import { ArticleForm } from '@/lib/schemas';
import { ImageUploader } from '../ui/ImageUploader';
import { CATEGORY_SLUGS, SITE_CONFIG } from '@/lib/config';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('../ui/RichTextEditor'), { ssr: false });

// Extended form shape — adds the SEO + workflow fields that live on the
// articles row but weren't surfaced in the older editor. Kept as a
// permissive intersection so ArticleEditor can still accept the bare
// ArticleForm shape from callers that haven't migrated yet.
interface ExtendedArticleForm extends Partial<ArticleForm> {
    id?: string;
    slug?: string;
    status?: string;
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string[];
    // Date column in DB is snake_case. The form may also carry the
    // legacy camelCase `lastUpdate` from older callers — both are
    // accepted; the editor prefers `last_update` on read and writes
    // to that key so upsert() can pass it through unchanged.
    last_update?: string;
}

interface ArticleEditorProps {
    form: ExtendedArticleForm;
    // setForm is loosely-typed on purpose: existing callers use a mix of
    // useState<ArticleFormData> and useState<Record<string, unknown>>,
    // both of which need to be compatible with this prop. A narrow
    // ExtendedArticleForm parameter would fail to match either. The runtime
    // shape is whatever the editor merges via {...form, …} — same as before.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setForm: (data: any) => void;
}

// News template — pre-fills the body with a journalistic skeleton.
// Saves the editor from typing the boilerplate H2 sections on every
// breaking-news article. Keep this OUTSIDE the component so the
// reference is stable and React doesn't re-parse it on every render.
const NEWS_TEMPLATE_HTML = `
<p>اكتب الفقرة الافتتاحية هنا — من (الجهة) ماذا (الحدث) متى (التاريخ) أين (الولاية/الموقع).</p>

<h2>تفاصيل القرار</h2>
<p>اشرح التفاصيل الموثّقة بشكل مختصر — أرقام، تواريخ، نقاط حاسمة.</p>

<h2>السياق</h2>
<p>الخلفية التي جعلت هذا الخبر يحدث الآن — قرارات سابقة، اتجاهات إدارية، أرقام مقارنة.</p>

<h2>الفئات المخاطَبة</h2>
<ul>
  <li>الفئة الأولى التي تتأثّر بالقرار.</li>
  <li>الفئة الثانية.</li>
</ul>

<h2>المرجعية الإدارية</h2>
<p>الجهة المعنيّة الرسمية للاستفسار والتأكيد.</p>
`.trim();

export const ArticleEditor = ({ form, setForm }: ArticleEditorProps) => {
    // Independent disclosure state for the SEO + workflow panels — collapsed
    // by default so the editor sees a clean form, but one click reveals the
    // power-user knobs without taking the user to a separate page.
    const [seoOpen, setSeoOpen] = useState<boolean>(false);
    const [workflowOpen, setWorkflowOpen] = useState<boolean>(false);

    // Convenience derived values
    const slug = (form.slug as string) || (form.id as string) || '';
    const liveUrl = slug ? `${SITE_CONFIG.siteUrl}/article/${slug}` : '';
    const seoTitleLen = (form.seo_title || '').length;
    const seoDescLen = (form.seo_description || '').length;

    function insertNewsTemplate() {
        // Only fill if the body is essentially empty — never clobber existing
        // content. Empty = no characters or just the default <p></p> shell.
        const current = (form.details || '').replace(/<[^>]*>/g, '').trim();
        if (current.length > 0) {
            if (!confirm('سيتمّ استبدال محتوى التفاصيل الحالي بقالب الخبر. متابعة؟')) return;
        }
        setForm({ ...form, details: NEWS_TEMPLATE_HTML });
    }

    // Fallback UI if form is undefined (Prevent Crash)
    if (!form) {
        return (
            <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-200">
                <AlertCircle size={32} className="mx-auto mb-2" />
                <h3 className="font-bold">خطأ في تحميل البيانات</h3>
                <p>لا توجد بيانات لعرضها في المحرر.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">

            {/* Quick actions header — news template + live preview link. Kept
                close to the title so editors see both before they start typing. */}
            <div className="flex flex-wrap items-center gap-2 -mb-2">
                <button
                    type="button"
                    onClick={insertNewsTemplate}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                    title="املأ التفاصيل بهيكل خبر صحفي"
                >
                    <Sparkles size={14} /> قالب خبر سريع
                </button>
                {liveUrl && (
                    <a
                        href={liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                        <ExternalLink size={14} /> معاينة على الموقع
                    </a>
                )}
            </div>

            {/* Basic Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="عنوان المقال" icon={FileText}>
                    <input
                        required
                        className={`${inputStyles} text-lg font-bold`}
                        value={form.title || ''}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        placeholder="عنوان جذاب للمقال..."
                    />
                </Field>

                <Field label="تاريخ النشر" icon={Clock}>
                    <input
                        type="date"
                        className={ltrInputStyles}
                        value={form.published_at ? form.published_at.split('T')[0] : ''}
                        onChange={e => setForm({ ...form, published_at: e.target.value })}
                    />
                </Field>

                <Field label="القسم" icon={Tags}>
                    <select
                        required
                        className={inputStyles}
                        value={form.category || ''}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                    >
                        <option value="">اختر القسم...</option>
                        {Object.entries(CATEGORY_SLUGS).map(([slug, title]) => (
                            <option key={slug} value={slug}>{title}</option>
                        ))}
                    </select>
                </Field>

                <div className="md:col-span-2">
                    <ImageUploader
                        label="الصورة البارزة لمقال"
                        value={form.image || undefined}
                        onChange={(url) => setForm({ ...form, image: url })}
                        bucket="images"
                    />
                </div>

                <div className="md:col-span-2">
                    <ArrayInput
                        label="التصنيفات الفرعية (Tags)"
                        icon={Tags}
                        values={form.tags || []}
                        onChange={v => setForm({ ...form, tags: v })}
                        placeholder="مثال: kizilay, consulate, renewal..."
                    />
                </div>

                <Field label="رابط المصدر / الأصلي" icon={LinkIcon}>
                    <input
                        className={`${ltrInputStyles} text-blue-600 underline`}
                        value={form.source || ''}
                        onChange={e => setForm({ ...form, source: e.target.value })}
                        placeholder="https://example.com/original-article"
                    />
                </Field>
            </div>

            {/* Intro & Details */}
            <div className="grid grid-cols-1 gap-6">
                <Field label="مقدمة قصيرة (Summary)" icon={AlertCircle} note="تظهر في بطاقات العرض وملخص الإجراء">
                    <RichTextEditor
                        value={form.intro || ''}
                        onChange={(html) => setForm({ ...form, intro: html })}
                        placeholder="ملخص سريع للمقال..."
                        minHeight="120px"
                    />
                </Field>

                <Field label="تفاصيل المقال (Details)" icon={FileText}>
                    <RichTextEditor
                        value={form.details || ''}
                        onChange={(html) => setForm({ ...form, details: html })}
                        placeholder="اكتب تفاصيل المقال هنا..."
                        minHeight="350px"
                    />
                </Field>
            </div>

            {/* Lists Section */}
            <div className="space-y-8 pt-8 border-t border-slate-200 dark:border-slate-800">
                <ArrayInput
                    label="خطوات عملية (Steps)"
                    icon={FileText}
                    values={form.steps || []}
                    onChange={v => setForm({ ...form, steps: v })}
                    placeholder="مثال: قم بزيارة الموقع الرسمي..."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ArrayInput
                        label="المستندات المطلوبة"
                        icon={Tags}
                        values={form.documents || []}
                        onChange={v => setForm({ ...form, documents: v })}
                        placeholder="مثال: جواز السفر..."
                    />
                    <ArrayInput
                        label="نصائح هامة"
                        icon={AlertCircle}
                        values={form.tips || []}
                        onChange={v => setForm({ ...form, tips: v })}
                        placeholder="مثال: تأكد من ترجمة الأوراق..."
                    />
                </div>

                <Field label="رسوم/كلفة" icon={LinkIcon} note="اختياري — تظهر في كرت سياق المقال">
                    <input
                        className={inputStyles}
                        value={form.fees || ''}
                        onChange={e => setForm({ ...form, fees: e.target.value })}
                        placeholder="مثال: 964 ليرة تركية"
                    />
                </Field>

                <Field label="تنبيه" icon={AlertCircle} note="نصّ تحذير قصير يبرز للقارئ">
                    <textarea
                        className={`${inputStyles} min-h-[80px]`}
                        value={form.warning || ''}
                        onChange={e => setForm({ ...form, warning: e.target.value })}
                        placeholder="مثال: لا توقّع عقداً قبل التحقّق من المختار"
                    />
                </Field>
            </div>

            {/* SEO meta — collapsible. These are what Google + WhatsApp /
                Facebook / Twitter cards display when the article is shared.
                Editors who write the body can ignore this; editors who care
                about distribution open it and tune. */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                <button
                    type="button"
                    onClick={() => setSeoOpen(o => !o)}
                    className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100 hover:text-emerald-600 transition-colors"
                    aria-expanded={seoOpen}
                >
                    <Search size={16} className="text-emerald-600" />
                    إعدادات SEO + المشاركة على السوشيال
                    <span className="text-xs font-normal text-slate-400">
                        ({seoOpen ? 'إخفاء' : 'عرض'})
                    </span>
                </button>

                {seoOpen && (
                    <div className="mt-4 grid grid-cols-1 gap-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                        <Field
                            label="عنوان SEO (يظهر في نتائج Google)"
                            icon={Search}
                            note={`${seoTitleLen}/60 حرفاً — الأمثل بين 50 و60`}
                        >
                            <input
                                className={inputStyles}
                                value={form.seo_title || ''}
                                onChange={e => setForm({ ...form, seo_title: e.target.value })}
                                placeholder="مثال: قائمة الأحياء المغلقة في أورفا 2026 — 26 حياً فقط"
                                maxLength={120}
                            />
                        </Field>

                        <Field
                            label="وصف SEO (يظهر تحت العنوان في Google + سناب WhatsApp/Facebook)"
                            icon={Search}
                            note={`${seoDescLen}/160 حرفاً — الأمثل بين 120 و160`}
                        >
                            <textarea
                                className={`${inputStyles} min-h-[80px]`}
                                value={form.seo_description || ''}
                                onChange={e => setForm({ ...form, seo_description: e.target.value })}
                                placeholder="ملخّص قصير يُحفّز النقر — يصف ما سيجده القارئ في المقال."
                                maxLength={300}
                            />
                        </Field>

                        <ArrayInput
                            label="كلمات مفتاحية SEO"
                            icon={Tags}
                            values={form.seo_keywords || []}
                            onChange={v => setForm({ ...form, seo_keywords: v })}
                            placeholder="مثال: أحياء أورفا المغلقة 2026"
                        />

                        <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            💡 إن تركت هذه الحقول فارغة، يستعمل الموقع <strong>عنوان المقال</strong> + <strong>المقدّمة</strong> تلقائياً. ملؤها يدوياً يُعطيك تحكّماً أكبر بنتيجة Google وكرت المشاركة.
                        </div>
                    </div>
                )}
            </div>

            {/* ── Featured-news toggle ──────────────────────────────────
                The dark/rose "BREAKING" banner on the homepage queries
                articles whose `tags` array contains the sentinel string
                `خبر_رئيسي`. The user kept asking how to make/unmake one
                — without a labelled control they had to remember the
                exact Arabic tag text and add it manually via the Tags
                array input above. This dedicated toggle reads/writes the
                same field with one click.

                Adding the tag here also keeps the underlying schema
                untouched (no DB migration, no new column) — articles
                that are already tagged or tagged elsewhere stay live
                through the same path. */}
            {(() => {
                const FEATURED_TAG = 'خبر_رئيسي';
                const isFeatured = (form.tags || []).includes(FEATURED_TAG);
                const toggleFeatured = () => {
                    const tags = form.tags || [];
                    if (isFeatured) {
                        setForm({ ...form, tags: tags.filter((t) => t !== FEATURED_TAG) });
                    } else {
                        setForm({ ...form, tags: [...tags, FEATURED_TAG] });
                    }
                };
                return (
                    <div
                        className={`border-t pt-6 ${
                            isFeatured
                                ? 'border-rose-200 dark:border-rose-900/50'
                                : 'border-slate-200 dark:border-slate-800'
                        }`}
                    >
                        <button
                            type="button"
                            onClick={toggleFeatured}
                            className={`w-full text-right rounded-2xl p-4 sm:p-5 transition-all flex items-start gap-4 ${
                                isFeatured
                                    ? 'bg-gradient-to-l from-rose-50 via-rose-100 to-rose-50 dark:from-rose-950/40 dark:via-rose-900/30 dark:to-rose-950/40 border-2 border-rose-300 dark:border-rose-700 shadow-md shadow-rose-200/40 dark:shadow-rose-900/30'
                                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/70 border-2 border-dashed border-slate-300 dark:border-slate-700'
                            }`}
                        >
                            <div
                                className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                                    isFeatured
                                        ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-400/40'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                }`}
                            >
                                <Flame size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                        className={`font-bold ${
                                            isFeatured
                                                ? 'text-rose-700 dark:text-rose-300 text-base'
                                                : 'text-slate-800 dark:text-slate-100 text-sm'
                                        }`}
                                    >
                                        {isFeatured
                                            ? 'خبر عاجل — يظهر بشكل بارز بالصفحة الرئيسية'
                                            : 'اعرض هذا المقال كخبر عاجل بالصفحة الرئيسية'}
                                    </span>
                                    {isFeatured && (
                                        <span className="inline-flex items-center gap-1 bg-rose-600 text-white text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full">
                                            <span className="relative flex w-1.5 h-1.5">
                                                <span className="absolute inline-flex w-full h-full rounded-full bg-white opacity-75 animate-ping" />
                                                <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-white" />
                                            </span>
                                            Breaking
                                        </span>
                                    )}
                                </div>
                                <p className={`text-xs mt-1 ${isFeatured ? 'text-rose-600 dark:text-rose-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {isFeatured
                                        ? 'سيُعرض هذا الخبر في الكرت الأحمر العاجل أعلى الصفحة الرئيسية. اضغط مرة أخرى لإلغاء التمييز.'
                                        : 'يُظهره في كرت الخبر العاجل المتحرّك (الأحمر) أعلى الصفحة الرئيسية. إن وُجد أكثر من خبر مميّز، يُعرض الأحدث منها.'}
                                </p>
                            </div>
                            <div className="shrink-0 self-center">
                                {/* Visual toggle pill */}
                                <div
                                    className={`relative w-12 h-6 rounded-full transition-colors ${
                                        isFeatured ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-600'
                                    }`}
                                >
                                    <span
                                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                                            isFeatured ? 'right-0.5' : 'right-[26px]'
                                        }`}
                                    />
                                </div>
                            </div>
                        </button>
                    </div>
                );
            })()}

            {/* Workflow — status + last update date. Status changes are common
                enough (pending → approved) that putting them in the same form
                avoids a round-trip to the table view just to publish. */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                <button
                    type="button"
                    onClick={() => setWorkflowOpen(o => !o)}
                    className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100 hover:text-emerald-600 transition-colors"
                    aria-expanded={workflowOpen}
                >
                    <Settings2 size={16} className="text-emerald-600" />
                    حالة النشر + تاريخ آخر تعديل
                    <span className="text-xs font-normal text-slate-400">
                        ({workflowOpen ? 'إخفاء' : 'عرض'})
                    </span>
                </button>

                {workflowOpen && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                        <Field label="الحالة" icon={Settings2} note="approved = ظاهر للزوّار">
                            <select
                                className={inputStyles}
                                value={form.status || 'approved'}
                                onChange={e => setForm({ ...form, status: e.target.value })}
                            >
                                <option value="approved">منشور (approved)</option>
                                <option value="pending">قيد المراجعة (pending)</option>
                                <option value="rejected">مرفوض (rejected)</option>
                            </select>
                        </Field>

                        <Field label="تاريخ آخر تحديث" icon={Clock} note="يُظهَر للقارئ ويُساعد Google">
                            <input
                                type="date"
                                className={ltrInputStyles}
                                // Read from either key — old form state used
                                // camelCase `lastUpdate`; rows fetched from
                                // Supabase land as snake_case `last_update`.
                                // Write back to the snake_case column name
                                // so upsert() matches the DB schema directly.
                                value={(form.last_update || form.lastUpdate || '').split('T')[0]}
                                onChange={e => setForm({ ...form, last_update: e.target.value, lastUpdate: undefined })}
                            />
                        </Field>
                    </div>
                )}
            </div>
        </div>
    );
};
