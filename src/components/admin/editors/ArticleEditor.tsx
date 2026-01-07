import { Image as ImageIcon, Tags, FileText, Link as LinkIcon, AlertCircle, Clock } from 'lucide-react';
import { Field } from '../ui/Field';
import { inputStyles, textareaStyles, ltrInputStyles } from '../ui/styles';
import { ArrayInput } from '../ui/ArrayInput';
import { ArticleForm } from '@/lib/schemas';
import { ImageUploader } from '../ui/ImageUploader';

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
                        className={inputStyles}
                        value={form.category || ''}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                    >
                        <option value="">اختر القسم...</option>
                        <option value="إقامة">إقامة وقوانين</option>
                        <option value="صحة">صحة وتأمين</option>
                        <option value="تعليم">تعليم وجامعات</option>
                        <option value="سياحة">سياحة وترفيه</option>
                        <option value="عمل">عمل واستثمار</option>
                        <option value="الجنسية">الجنسية التركية</option>
                        <option value="عقارات">عقارات</option>
                        <option value="عام">تنبيهات عامة</option>
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
                <Field label="مقدمة قصيرة (Summary)" icon={AlertCircle} note="تظهر في بطاقات العرض">
                    <textarea
                        className={`${textareaStyles} h-24`}
                        value={form.intro || ''}
                        onChange={e => setForm({ ...form, intro: e.target.value })}
                        placeholder="ملخص سريع للمقال..."
                    />
                </Field>

                <Field label="تفاصيل المقال (Details)" icon={FileText}>
                    <textarea
                        className={`${textareaStyles} h-64 font-mono text-sm`}
                        value={form.details || ''}
                        onChange={e => setForm({ ...form, details: e.target.value })}
                        placeholder="اكتب تفاصيل المقال هنا..."
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
