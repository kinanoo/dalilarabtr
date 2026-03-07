import React from 'react';
import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react';
import { inputStyles } from './styles';

interface ArrayInputProps {
    label: string;
    icon: any;
    values: string[];
    onChange: (values: string[]) => void;
    placeholder: string;
}

export const ArrayInput = ({ label, icon: Icon, values, onChange, placeholder }: ArrayInputProps) => {
    const add = () => onChange([...values, '']);
    const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));
    const update = (i: number, val: string) => {
        const newV = [...values];
        newV[i] = val;
        onChange(newV);
    };
    const move = (i: number, dir: -1 | 1) => {
        if ((i === 0 && dir === -1) || (i === values.length - 1 && dir === 1)) return;
        const newV = [...values];
        const temp = newV[i];
        newV[i] = newV[i + dir];
        newV[i + dir] = temp;
        onChange(newV);
    };

    return (
        <div className="space-y-3 mb-6">
            <label className="flex items-center gap-2 text-base font-bold text-slate-700 dark:text-slate-300">
                <Icon size={18} className="text-emerald-500" /> {label}
            </label>
            <div className="space-y-3">
                {values.map((val, i) => (
                    <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex flex-col gap-1 pt-2">
                            <button type="button" title="تحريك لأعلى" onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-emerald-500 disabled:opacity-30 transition-colors"><ChevronUp size={16} /></button>
                            <button type="button" title="تحريك لأسفل" onClick={() => move(i, 1)} disabled={i === values.length - 1} className="text-slate-400 hover:text-emerald-500 disabled:opacity-30 transition-colors"><ChevronDown size={16} /></button>
                        </div>
                        <input
                            id={`array-input-${i}`}
                            name={`array-input-${i}`}
                            value={val}
                            onChange={(e) => update(i, e.target.value)}
                            className={`${inputStyles} flex-1`}
                            placeholder={placeholder}
                        />
                        <button type="button" title="حذف العنصر" onClick={() => remove(i)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}
                <button type="button" onClick={add} className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 font-bold hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group">
                    <Plus size={20} className="group-hover:scale-110 transition-transform" /> إضافة عنصر جديد
                </button>
            </div>
        </div>
    );
};
