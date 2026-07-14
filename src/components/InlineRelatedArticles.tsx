'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { getSupabase } from '@/lib/supabaseLazy';

export default function InlineRelatedArticles({ currentArticleId, category }: { currentArticleId: string; category: string }) {
    const [articles, setArticles] = useState<any[]>([]);

    useEffect(() => {
        async function fetch() {
            if (!category) return;
            // Lazy client — keeps supabase-js out of the article first load.
            const supabase = await getSupabase();
            if (!supabase) return;
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
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-amber-50/40 dark:from-slate-800/30 dark:to-amber-950/15 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40">
            {/* Accent stripe — right edge in RTL */}
            <span className="absolute top-0 right-0 h-full w-0.5 bg-amber-400 opacity-70" />

            <h3 className="font-black text-sm text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shadow-sm">
                    <Sparkles size={14} />
                </span>
                قد يهمك أيضاً
            </h3>
            <div className="space-y-2">
                {articles.map((a) => (
                    <Link
                        key={a.id}
                        href={`/article/${a.slug || a.id}`}
                        className="group relative overflow-hidden flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/30 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-0.5 transition-all"
                    >
                        <span className="absolute top-0 right-0 h-full w-0.5 bg-emerald-500 opacity-0 group-hover:opacity-70 transition-opacity" />
                        <div className="min-w-0">
                            <span className="font-black text-sm text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                                {a.title}
                            </span>
                            {a.intro && (
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                                    {a.intro.replace(/<[^>]*>/g, '')}
                                </p>
                            )}
                        </div>
                        <ArrowLeft size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors shrink-0 group-hover:-translate-x-1" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
