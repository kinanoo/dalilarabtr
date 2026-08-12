'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Briefcase, Check, Search, X } from 'lucide-react';
import { catIcon } from '@/lib/serviceCategoryIcons';

export interface CategoryFilterOption {
    id: string;
    slug: string;
    label: string;
    count: number;
}

interface CategoryFilterDialogProps {
    open: boolean;
    value: string;
    options: CategoryFilterOption[];
    onChange: (category: string) => void;
    onClose: () => void;
}

const normalize = (value: string): string => value
    .toLocaleLowerCase('ar')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .trim();

export default function CategoryFilterDialog({
    open,
    value,
    options,
    onChange,
    onClose,
}: CategoryFilterDialogProps) {
    const [query, setQuery] = useState('');
    const panelRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const filteredOptions = useMemo(() => {
        const needle = normalize(query);
        if (!needle) return options;
        return options.filter((option) => normalize(option.label).includes(needle));
    }, [options, query]);

    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const focusTimer = window.setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 80);
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
                return;
            }
            if (event.key !== 'Tab') return;
            const controls = panelRef.current?.querySelectorAll<HTMLElement>(
                'button, input, [tabindex]:not([tabindex="-1"])',
            );
            if (!controls?.length) return;
            const focusable = Array.from(controls).filter((control) => !control.hasAttribute('disabled'));
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;
            if (event.shiftKey && (active === first || !panelRef.current?.contains(active))) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && active === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.clearTimeout(focusTimer);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, open]);

    if (!open || typeof document === 'undefined') return null;

    const pick = (category: string) => {
        setQuery('');
        onChange(category);
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5" dir="rtl">
            <button
                type="button"
                aria-label="إغلاق التخصصات"
                className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-[2px]"
                onClick={() => {
                    setQuery('');
                    onClose();
                }}
            />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="service-category-dialog-title"
                className="relative flex max-h-[86vh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-w-3xl sm:rounded-2xl dark:border-slate-800 dark:bg-slate-900"
            >
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-slate-800">
                    <div>
                        <h2 id="service-category-dialog-title" className="flex items-center gap-2 text-lg font-black text-slate-950 dark:text-white">
                            <Briefcase size={19} className="text-emerald-600" />
                            اختر التخصص
                        </h2>
                        <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                            اختر مجالاً واحداً لتظهر الخدمات المطابقة مباشرة.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setQuery('');
                            onClose();
                        }}
                        aria-label="إغلاق"
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="border-b border-slate-100 p-3 sm:px-5 dark:border-slate-800">
                    <div className="relative">
                        <Search size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            ref={searchRef}
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="ابحث عن تخصص..."
                            className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pr-10 pl-3 text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                    </div>
                </div>

                <div className="grid flex-1 grid-cols-2 gap-2 overflow-y-auto overscroll-contain p-3 sm:grid-cols-3 sm:p-5">
                    {filteredOptions.map((option) => {
                        const Icon = option.id === 'all' ? Briefcase : catIcon(option.slug);
                        const active = value === option.id;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => pick(option.id)}
                                className={`flex min-h-16 items-center gap-3 rounded-lg border px-3 py-2 text-right transition active:scale-[0.98] ${active
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500/20 dark:bg-emerald-950/30 dark:text-emerald-100'
                                    : 'border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-700 dark:hover:bg-slate-800'
                                }`}
                            >
                                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>
                                    <Icon size={17} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-xs font-black sm:text-sm">{option.label}</span>
                                    <span className="mt-0.5 block text-[10px] font-bold tabular-nums text-slate-400">
                                        {option.count} نتيجة
                                    </span>
                                </span>
                                {active && <Check size={16} className="shrink-0 text-emerald-600" />}
                            </button>
                        );
                    })}
                    {filteredOptions.length === 0 && (
                        <div className="col-span-full py-12 text-center text-sm font-bold text-slate-500">
                            لا يوجد تخصص بهذا الاسم.
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}
