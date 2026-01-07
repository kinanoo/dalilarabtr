import React from 'react';

interface FieldProps {
    label: string;
    icon?: any;
    note?: string;
    children: React.ReactNode;
}

export const Field = ({ label, icon: Icon, note, children }: FieldProps) => (
    <div className="w-full flex flex-col items-stretch space-y-3 mb-8 text-right group" dir="rtl">
        <label className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors">
            {Icon && <Icon size={20} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />}
            {label}
            {note && <span className="text-xs font-normal text-slate-400 dark:text-slate-500 mr-2 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">({note})</span>}
        </label>
        <div className="w-full relative flex flex-col items-stretch">
            {children}
        </div>
    </div>
);
