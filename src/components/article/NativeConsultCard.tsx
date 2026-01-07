'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

type NativeConsultCardProps = {
    className?: string;
    topic?: string;
};

export default function NativeConsultCard({ className = '', topic }: NativeConsultCardProps) {
    return (
        <div className={`group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-1 pr-1 shadow-sm transition-all hover:shadow-md ${className}`}>
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 sm:p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                    <Sparkles size={20} className="fill-emerald-100 dark:fill-emerald-900/40" />
                </div>

                <div className="flex-1 text-center sm:text-right">
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                        هل تحتاج مساعدة في هذا الإجراء؟
                    </h4>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {topic ? `مستشارونا جاهزون للمساعدة في "${topic}"` : 'تواصل مع مستشار مختص لاختصار الوقت والجهد.'}
                    </p>
                </div>

                <Link
                    href="/contact"
                    className="whitespace-nowrap rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2"
                >
                    <span>استشارة سريعة</span>
                    <ArrowRight size={16} className="transition-transform group-hover:-translate-x-1" />
                </Link>
            </div>

            {/* Decorative gradient */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}
