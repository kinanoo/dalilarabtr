// src/components/RelatedArticles.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function RelatedArticles({ currentArticleId, category }: { currentArticleId: string; category: string }) {
    // Dynamic State
    const [related, setRelated] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRelated() {
            if (!supabase) return;
            // Fetch items in same category, exclude current, limit 3
            const { data } = await supabase
                .from('articles')
                .select('id, slug, title, intro, created_at, category')
                .eq('category', category)
                .neq('id', currentArticleId)
                .limit(3);

            if (data) setRelated(data);
            setLoading(false);
        }

        if (category) {
            fetchRelated();
        } else {
            setLoading(false);
        }
    }, [category, currentArticleId]);


    if (loading || related.length === 0) return null;

    return (
        <section className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12">
            <div className="container mx-auto px-4">
                {/* Eyebrow + heading */}
                <div className="mb-8">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-[11px] font-black tracking-wider uppercase mb-3">
                        <Sparkles size={12} />
                        مزيد
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                        <span className="w-1.5 h-9 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></span>
                        مقالات ذات صلة
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {related.map((article) => (
                        <Link
                            key={article.id}
                            href={`/article/${article.slug || article.id}`}
                            className="group relative overflow-hidden block bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-800/50 dark:to-emerald-950/15 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 flex flex-col h-full"
                        >
                            {/* Accent stripe — right edge in RTL */}
                            <span className="absolute top-0 right-0 h-full w-1 bg-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />

                            <h3 className="font-black text-lg mb-3 text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-snug">
                                {article.title}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 mb-4 leading-relaxed flex-grow">
                                {article.intro?.replace(/<[^>]*>/g, '')}
                            </p>
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-200 dark:border-slate-700/50">
                                <div className="flex items-center gap-1 text-slate-400 text-xs tabular-nums" dir="ltr">
                                    <Clock size={14} />
                                    <span>{new Date(article.created_at || Date.now()).toLocaleDateString('ar-EG')}</span>
                                </div>
                                <span className="text-emerald-600 text-sm font-black flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform">
                                    اقرأ المزيد <ArrowLeft size={16} />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
