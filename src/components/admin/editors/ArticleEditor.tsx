import { Image as ImageIcon, Tags, FileText, Link as LinkIcon, AlertCircle, Clock } from 'lucide-react';
import { Field } from '../ui/Field';
import { inputStyles, textareaStyles, ltrInputStyles } from '../ui/styles';
import { ArrayInput } from '../ui/ArrayInput';
import { ArticleForm } from '@/lib/schemas';
import { ImageUploader } from '../ui/ImageUploader';
import { CATEGORY_SLUGS } from '@/lib/config';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('../ui/RichTextEditor'), { ssr: false });

interface ArticleEditorProps {
    form: Partial<ArticleForm>;
    setForm: (data: any) => void;
}

export const ArticleEditor = ({ form, setForm }: ArticleEditorProps) => {
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
            </div>
        </div>
    );
};
