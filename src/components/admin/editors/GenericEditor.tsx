import React from 'react';
import { AlertCircle, Edit3 } from 'lucide-react';
import { Field } from '../ui/Field';
import { inputStyles } from '../ui/styles';

interface GenericEditorProps {
    form: any;
    setForm: (data: any) => void;
    type: string;
}

export const GenericEditor = ({ form, setForm, type }: GenericEditorProps) => {
    return (
        <div className="flex flex-col items-stretch w-full space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-full bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm border-r-4 border-r-amber-500 mb-2 text-right dir-rtl">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                    <AlertCircle size={28} className="text-amber-500" />
                    محرر العناصر السريعة ({type})
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-base">تعديل البيانات الأساسية لهذا العنصر.</p>
            </div>
            {Object.keys(form).map(key => {
                if (['id', 'created_at', 'updated_at'].includes(key)) return null;
                if (typeof form[key] === 'object') return null; // Skip arrays/objs
                return (
                    <Field key={key} label={key} icon={Edit3}>
                        <input className={inputStyles} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                    </Field>
                )
            })}
        </div>
    );
};
