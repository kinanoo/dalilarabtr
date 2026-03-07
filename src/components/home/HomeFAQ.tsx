'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { TOP_FAQS } from '@/lib/home-faq-data';

export default function HomeFAQ() {
    const [openId, setOpenId] = useState<string | null>(null);

    const toggle = (id: string) => {
        setOpenId(prev => prev === id ? null : id);
    };

    return (
        <section className="px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <HelpCircle className="text-emerald-500" size={24} />
                        أكثر الأسئلة شيوعاً
                    </h2>
                    <Link
                        href="/faq"
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
                    >
                        كل الأسئلة
                        <ArrowLeft size={14} />
                    </Link>
                </div>

                {/* FAQ List */}
                <div className="space-y-2">
                    {TOP_FAQS.map((faq, index) => {
                        const isOpen = openId === faq.id;
                        return (
                            <div
                                key={faq.id}
                                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-emerald-400 dark:hover:border-emerald-600 hover:-translate-y-0.5"
                            >
                                <button
                                    onClick={() => toggle(faq.id)}
                                    className="w-full flex items-start gap-3 p-4 text-right"
                                    aria-expanded={isOpen}
                                >
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center mt-0.5">
                                        {index + 1}
                                    </span>
                                    <span className="flex-1 text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                                        {faq.question}
                                    </span>
                                    <ChevronDown
                                        size={18}
                                        className={`flex-shrink-0 text-slate-400 mt-0.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                    <div className="overflow-hidden">
                                        <div className="px-4 pb-4 pr-13">
                                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-loose">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
