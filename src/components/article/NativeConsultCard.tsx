'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

type NativeConsultCardProps = {
    className?: string;
    topic?: string;
};

export default function NativeConsultCard({ className = '', topic }: NativeConsultCardProps) {
    return (
        <div className={`group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-900/50 dark:to-emerald-950/20 shadow-sm transition-all hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-400 hover:-translate-y-0.5 ${className}`}>
            {/* Accent stripe — right edge in RTL */}
            <span className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-emerald-500 to-teal-500 opacity-70 group-hover:opacity-100 transition-opacity" />

            <div className="flex flex-col sm:flex-row items-center gap-4 p-5 sm:p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform">
                    <Sparkles size={20} className="fill-emerald-200 dark:fill-emerald-900/40" />
                </div>

                <div className="flex-1 text-center sm:text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-black tracking-wider uppercase mb-1.5">
                        استشارة
                    </span>
                    <h4 className="text-base font-black text-slate-800 dark:text-slate-100">
                        هل تحتاج مساعدة في هذا الإجراء؟
                    </h4>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {topic ? `مستشارونا جاهزون للمساعدة في "${topic}"` : 'تواصل مع مستشار مختص لاختصار الوقت والجهد.'}
                    </p>
                </div>

                <Link
                    href="/contact"
                    className="group/btn whitespace-nowrap rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-5 py-2.5 text-sm font-black text-white transition-all shadow-md shadow-emerald-600/30 hover:shadow-lg hover:shadow-emerald-600/40 hover:-translate-y-0.5 flex items-center gap-2"
                >
                    <span>استشارة سريعة</span>
                    <ArrowRight size={16} className="transition-transform group-hover/btn:-translate-x-1" />
                </Link>
            </div>
        </div>
    );
}
