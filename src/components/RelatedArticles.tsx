// src/components/RelatedArticles.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
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
                <h2 className="text-2xl font-bold mb-8 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-1.5 h-8 bg-emerald-500 rounded-full"></span>
                    مقالات ذات صلة
                </h2>

                <div className="grid md:grid-cols-3 gap-6">
                    {related.map((article) => (
                        <Link
                            key={article.id}
                            href={`/article/${article.slug || article.id}`}
                            className="group block bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all hover:shadow-lg flex flex-col h-full"
                        >
                            <h3 className="font-bold text-lg mb-3 text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 transition-colors line-clamp-2">
                                {article.title}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 mb-4 leading-relaxed flex-grow">
                                {article.intro}
                            </p>
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-200 dark:border-slate-700/50">
                                <div className="flex items-center gap-1 text-slate-400 text-xs">
                                    <Clock size={14} />
                                    <span>{new Date(article.created_at || Date.now()).toLocaleDateString('ar-EG')}</span>
                                </div>
                                <span className="text-emerald-600 text-sm font-bold flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform">
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
