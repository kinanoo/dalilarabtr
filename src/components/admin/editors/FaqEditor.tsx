import { HelpCircle, Tag, CheckCircle } from 'lucide-react';
import { Field } from '../ui/Field';
import { inputStyles, textareaStyles } from '../ui/styles';

interface FaqEditorProps {
    form: any;
    setForm: (data: any) => void;
}

export const FaqEditor = ({ form, setForm }: FaqEditorProps) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="السؤال (Question)" icon={HelpCircle}>
                    <input
                        className={`${inputStyles} font-bold`}
                        value={form.question || ''}
                        onChange={e => setForm({ ...form, question: e.target.value })}
                        placeholder="اكتب السؤال هنا..."
                    />
                </Field>

                <Field label="التصنيف (Category)" icon={Tag}>
                    <select
                        className={inputStyles}
                        value={form.category || 'عام'}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                    >
                        <option value="عام">عام</option>
                        <option value="إقامة">إقامة</option>
                        <option value="شؤون الكملك (الحماية المؤقتة)">شؤون "الكملك" (الحماية المؤقتة)</option>
                        <option value="قانوني">قانوني</option>
                        <option value="صحة">صحة</option>
                        <option value="تعليم">تعليم</option>
                        <option value="سياحة">سياحة</option>
                        <option value="عمل واستثمار">عمل واستثمار</option>
                        <option value="جنسية">جنسية</option>
                        <option value="عقارات">عقارات</option>
                        <option value="مواصلات">مواصلات</option>
                        <option value="بنوك">بنوك ومصارف</option>
                        <option value="أسرة">أسرة وزواج</option>
                        <option value="ثقافة">ثقافة واندماج</option>
                    </select>
                </Field>
            </div>

            <Field label="الإجابة (Answer)" icon={CheckCircle}>
                <textarea
                    className={`${textareaStyles} h-40`}
                    value={form.answer || ''}
                    onChange={e => setForm({ ...form, answer: e.target.value })}
                    placeholder="اكتب الإجابة التفصيلية هنا..."
                />
            </Field>

            <div className="flex items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                    type="checkbox"
                    checked={form.active !== false}
                    onChange={e => setForm({ ...form, active: e.target.checked })}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label className="font-bold text-slate-700 dark:text-slate-300">نشط (Active)</label>
            </div>
        </div>
    );
};
