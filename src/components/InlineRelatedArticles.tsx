'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function InlineRelatedArticles({ currentArticleId, category }: { currentArticleId: string; category: string }) {
    const [articles, setArticles] = useState<any[]>([]);

    useEffect(() => {
        async function fetch() {
            if (!supabase || !category) return;
            const { data } = await supabase
                .from('articles')
                .select('id, slug, title, intro')
                .eq('category', category)
                .eq('status', 'approved')
                .neq('id', currentArticleId)
                .limit(3);

            if (data && data.length > 0) setArticles(data);
        }
        fetch();
    }, [category, currentArticleId]);

    if (articles.length === 0) return null;

    return (
        <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40">
            <h3 className="font-bold text-sm text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                قد يهمك أيضاً
            </h3>
            <div className="space-y-2">
                {articles.map((a) => (
                    <Link
                        key={a.id}
                        href={`/article/${a.slug || a.id}`}
                        className="group flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/30 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all hover:shadow-sm"
                    >
                        <div className="min-w-0">
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                                {a.title}
                            </span>
                            {a.intro && (
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                                    {a.intro.replace(/<[^>]*>/g, '')}
                                </p>
                            )}
                        </div>
                        <ArrowLeft size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors shrink-0 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
