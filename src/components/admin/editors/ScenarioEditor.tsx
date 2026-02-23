'use client';

import { Plus, Trash2, HelpCircle, GripVertical } from 'lucide-react';
import { Fragment, useEffect } from 'react';

// Converts text to a URL-safe slug (for auto-ID generation)
function toSlug(text: string): string {
    return text
        .toLowerCase()
        .replace(/[\u0600-\u06FF\s]+/g, '-') // Arabic chars + spaces → dash
        .replace(/[^a-z0-9-]+/g, '')          // remove anything else
        .replace(/-+/g, '-')                   // collapse multiple dashes
        .replace(/^-+|-+$/g, '')               // trim edge dashes
        .slice(0, 60);
}

const SUBCATEGORIES: Record<string, { value: string; label: string }[]> = {
    syrian: [
        { value: 'docs', label: 'أوراق (كملك/فقدان)' },
        { value: 'travel', label: 'سفر (إذن/خروج)' },
        { value: 'status', label: 'وضع قانوني (جنسية)' },
        { value: 'civil', label: 'أحوال مدنية (زواج)' },
        { value: 'education', label: 'تعليم ومدارس' },
        { value: 'bank', label: 'بنوك وحسابات' },
        { value: 'housing', label: 'عنوان وسكن' },
        { value: 'work', label: 'عمل وإذن عل' },
        { value: 'property', label: 'عقار وتملك' },
    ],
    tourist: [
        { value: 'res', label: 'إقامة (تقديم/تجديد)' },
        { value: 'prob', label: 'مخالفات (رفض/كسر)' },
        { value: 'life', label: 'بنوك وحياة يومية' },
        { value: 'address', label: 'عنوان ونفوس' },
        { value: 'goc', label: 'مواعيد الهجرة' },
        { value: 'health', label: 'صحة ومشافي' },
        { value: 'housing', label: 'سكن وإيجار' },
        { value: 'official', label: 'تبليغات وشكاوى' },
    ],
    investor: [
        { value: 'cit', label: 'الجنسية التركية' },
        { value: 'res', label: 'الإقامة العقارية' },
        { value: 'comp', label: 'تأسيس شركات' },
        { value: 'fin', label: 'بنوك وديون' },
        { value: 'legal', label: 'تبليغات وقضايا' },
    ],
    student: [
        { value: 'res', label: 'إقامة الطالب' },
        { value: 'study', label: 'الدراسة والشهادات' },
        { value: 'address', label: 'عنوان ونفوس' },
        { value: 'health', label: 'صحة ومشافي' },
        { value: 'fin', label: 'بنوك وديون' },
        { value: 'official', label: 'تبليغات وشكاوى' },
    ],
    worker: [
        { value: 'permit', label: 'إذن العمل' },
        { value: 'company', label: 'تأسيس شركة' },
        { value: 'tax', label: 'ضرائب ومحاسبة' },
        { value: 'legal', label: 'قضايا وتبليغات' },
    ],
    daily: [
        { value: 'gov', label: 'حكومي (إي دولات)' },
        { value: 'fin', label: 'مالي (بنوك/نوتير)' },
        { value: 'prob', label: 'مشاكل قانونية' },
        { value: 'health', label: 'صحة ومشافي' },
        { value: 'debt', label: 'ديون وقضايا' },
    ],
    general: [
        { value: 'general', label: 'عام' },
    ]
};

interface ScenarioEditorProps {
    form: any;
    setForm: (form: any) => void;
}

export function ScenarioEditor({ form, setForm }: ScenarioEditorProps) {

    const handleChange = (field: string, value: any) => {
        setForm({ ...form, [field]: value });
    };

    // Auto-generate slug ID from title when creating a new scenario (id is still empty)
    useEffect(() => {
        if (!form.id && form.title) {
            const slug = toSlug(form.title);
            if (slug) setForm({ ...form, id: slug });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.title]);

    // Auto-reset subcategory when category changes
    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCat = e.target.value;
        setForm({
            ...form,
            category: newCat,
            subcategory: SUBCATEGORIES[newCat]?.[0]?.value || 'general'
        });
    };

    // Helper for List Fields (Steps, Docs, Sources)
    const handleListChange = (field: string, index: number, value: string) => {
        const list = [...(form[field] || [])];
        list[index] = value;
        handleChange(field, list);
    };

    const addListItem = (field: string) => {
        const list = [...(form[field] || [])];
        list.push('');
        handleChange(field, list);
    };

    const removeListItem = (field: string, index: number) => {
        const list = [...(form[field] || [])];
        list.splice(index, 1);
        handleChange(field, list);
    };

    return (
        <div className="space-y-8">
            {/* 1. Basic Info */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b pb-2 flex items-center gap-2">
                    📄 البيانات الأساسية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="المعرف الفريد (ID/Slug)" help="هام: يجب أن يكون بالإنجليزية فقط (أحرف، أرقام، شرطة). لا تستخدم العربية. مثال: work-permit-cost">
                        <input
                            type="text"
                            value={form.id || ''}
                            onChange={e => handleChange('id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 font-bold font-mono text-left"
                            placeholder="example-id-english-only"
                            dir="ltr"
                        />
                    </Field>
                    <Field label="التصنيف (Category)" help="يساعد في تنظيم السيناريوهات في لوحة التحكم (لا يؤثر حالياً على شجرة المستشار).">
                        <select
                            value={form.category || 'general'}
                            onChange={handleCategoryChange}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 font-bold"
                        >
                            <option value="general">عام (General)</option>
                            <option value="syrian">سوريين (Syrian)</option>
                            <option value="tourist">سياحة/إقامة (Tourist)</option>
                            <option value="investor">مستثمر (Investor)</option>
                            <option value="student">طالب (Student)</option>
                            <option value="worker">عمل (Worker)</option>
                            <option value="daily">خدمات يومية (Daily)</option>
                        </select>
                    </Field>
                    <Field label="الفئة الفرعية (Subcategory)" help="تحدد أين سيظهر الزر في المستشار الشامل (مثلاً: تحت 'أوراق' أو 'سفر').">
                        <select
                            value={form.subcategory || ''}
                            onChange={e => handleChange('subcategory', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 font-bold"
                        >
                            {(SUBCATEGORIES[form.category || 'general'] || []).map(sub => (
                                <option key={sub.value} value={sub.value}>
                                    {sub.label}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="عنوان السيناريو (Title)" help="مثال: استخراج إذن سفر">
                        <input
                            type="text"
                            value={form.title || ''}
                            onChange={e => handleChange('title', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 font-bold"
                            placeholder="العنوان الرئيسي..."
                        />
                    </Field>
                    <Field label="مستوى الخطورة (Risk)" help="يحدد لون البطاقة">
                        <select
                            value={form.risk || 'medium'}
                            onChange={e => handleChange('risk', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 font-bold"
                        >
                            <option value="safe">✅ إجراء روتيني (Safe)</option>
                            <option value="medium">⚠️ يتطلب انتباهاً (Medium)</option>
                            <option value="high">⛔ خطورة عالية (High)</option>
                            <option value="critical">🔥 وضع حرج (Critical)</option>
                        </select>
                    </Field>
                    <div className="col-span-1 md:col-span-2">
                        <Field label="الوصف المختصر (Description)">
                            <textarea
                                value={form.description || form.desc || ''}
                                onChange={e => handleChange('description', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 font-medium min-h-[80px]"
                                placeholder="شرح مبسط عن الحالة..."
                            />
                        </Field>
                    </div>
                </div>
            </div>

            {/* 2. Steps (Dynamic List) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        👣 خطوات الحل (Steps)
                    </h3>
                    <button
                        onClick={() => addListItem('steps')}
                        className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                    >
                        <Plus size={16} /> إضافة خطوة
                    </button>
                </div>

                <div className="space-y-2">
                    {(form.steps || []).map((step: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 group">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 w-8 h-10 flex items-center justify-center rounded-lg font-bold text-sm shrink-0">
                                {idx + 1}
                            </span>
                            <textarea
                                value={step}
                                onChange={e => handleListChange('steps', idx, e.target.value)}
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 min-h-[50px] text-sm font-medium resize-y"
                                placeholder={`الخطوة رقم ${idx + 1}...`}
                            />
                            <button
                                onClick={() => removeListItem('steps', idx)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                    {(form.steps || []).length === 0 && (
                        <p className="text-center text-slate-400 text-sm py-4 italic">لا توجد خطوات مضافة بعد.</p>
                    )}
                </div>
            </div>

            {/* 3. Documents (Dynamic List) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        📂 الأوراق المطلوبة (Documents)
                    </h3>
                    <button
                        onClick={() => addListItem('docs')}
                        className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                    >
                        <Plus size={16} /> إضافة ورقة
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {(form.docs || []).map((doc: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-xl group hover:border-blue-300 transition">
                            <input
                                type="text"
                                value={doc}
                                onChange={e => handleListChange('docs', idx, e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-sm font-bold w-40 text-slate-700 dark:text-slate-200"
                                placeholder="اسم المستند..."
                            />
                            <button
                                onClick={() => removeListItem('docs', idx)}
                                className="text-slate-400 hover:text-red-500 transition opacity-50 group-hover:opacity-100"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => addListItem('docs')}
                        className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 px-3 py-1 rounded-xl text-xs font-bold text-slate-500 hover:text-blue-600 hover:border-blue-400 transition"
                    >
                        <Plus size={14} /> جديد
                    </button>
                </div>
            </div>

            {/* 4. Extra Info */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b pb-2 flex items-center gap-2">
                    ℹ️ معلومات إضافية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="التكلفة التقديرية (Cost)" help="مثال: 500 ليرة - مجاني">
                        <input
                            type="text"
                            value={form.cost || ''}
                            onChange={e => handleChange('cost', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 font-bold"
                        />
                    </Field>
                    <Field label="السند القانوني (Legal)" help="رقم القانون أو المصدر">
                        <input
                            type="text"
                            value={form.legal || ''}
                            onChange={e => handleChange('legal', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 font-bold"
                        />
                    </Field>
                    <div className="col-span-1 md:col-span-2">
                        <Field label="نصيحة الخبير (Expert Tip)" help="نصيحة تظهر بلون مميز">
                            <textarea
                                value={form.tip || ''}
                                onChange={e => handleChange('tip', e.target.value)}
                                className="w-full bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 font-medium min-h-[80px]"
                                placeholder="نصيحة ذهبية..."
                            />
                        </Field>
                    </div>
                </div>
            </div>

            {/* 5. Status */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${form.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                        {form.is_active ? '✓' : '✕'}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">حالة الظهور</h4>
                        <p className="text-xs text-slate-500">تفعيل أو إخفاء هذا السيناريو من الموقع</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={form.is_active}
                        onChange={e => handleChange('is_active', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                </label>
            </div>
        </div>
    );
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>{label}</span>
                {help && <span className="text-[10px] font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{help}</span>}
            </label>
            {children}
        </div>
    );
}
