'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useBookmarks } from '@/hooks/useBookmarks';
// import { ARTICLES } from '@/lib/articles'; // REMOVED
import { Bookmark, FileText } from 'lucide-react';
import BookmarkButton from '@/components/BookmarkButton';
import PageHero from '@/components/PageHero';
import EmptyState from '@/components/EmptyState';
import { supabase } from '@/lib/supabaseClient';

export default function BookmarksPage() {
    const { bookmarks, isLoaded } = useBookmarks();
    interface BookmarkedArticle {
        id: string;
        slug: string;
        title: string;
        intro: string | null;
        category: string;
        last_update: string | null;
        lastUpdate: string | null;
    }

    const [savedArticles, setSavedArticles] = useState<BookmarkedArticle[]>([]);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        const fetchBookmarks = async () => {
            if (isLoaded && bookmarks.length > 0 && supabase) {
                setFetching(true);
                const { data } = await supabase
                    .from('articles')
                    .select('id, slug, title, intro, category, last_update')
                    .in('id', bookmarks);

                if (data) {
                    setSavedArticles(data.map(d => ({
                        ...d,
                        lastUpdate: d.last_update // Map snake_case to camelCase
                    })));
                }
                setFetching(false);
            } else if (isLoaded && bookmarks.length === 0) {
                setSavedArticles([]);
            }
        };

        fetchBookmarks();
    }, [bookmarks, isLoaded]);

    return (
        <main className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
            <PageHero
                title="مفضلاتي"
                description="المقالات التي قمت بحفظها للعودة إليها لاحقاً"
                icon={<Bookmark className="w-9 h-9 text-emerald-300" />}
            />

            <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 pb-20">
                {!isLoaded || fetching ? (
                    <div className="text-center py-20 opacity-50">جاري التحميل...</div>
                ) : savedArticles.length === 0 ? (
                    <EmptyState
                        type="bookmarks"
                        message="لم تقم بحفظ أي مقالات بعد. اضغط على أيقونة النجمة بجانب أي مقال لحفظه هنا."
                        actionLabel="تصفح المقالات"
                        actionHref="/"
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {savedArticles.map((article) => (
                            <div
                                key={article.id}
                                className="group relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/20 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-400 hover:-translate-y-1 transition-all duration-300 flex gap-4 items-start"
                            >
                                {/* Accent stripe — right edge in RTL */}
                                <span className="absolute top-0 right-0 w-1 h-full bg-emerald-500 opacity-70 group-hover:opacity-100 transition-opacity" />

                                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
                                    <FileText size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                        <Link href={`/article/${article.slug || article.id}`}>
                                            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                                                {article.title}
                                            </h3>
                                        </Link>
                                        <BookmarkButton id={article.id} mini className="shrink-0 relative z-10" />
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">{article.intro?.replace(/<[^>]*>/g, '')}</p>
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg font-black uppercase tracking-wider text-[10px]">
                                            {article.category}
                                        </span>
                                        <span className="text-slate-400 tabular-nums" dir="ltr">{article.lastUpdate}</span>
                                    </div>
                                </div>
                                <Link href={`/article/${article.slug || article.id}`} className="absolute inset-0 z-0" aria-label={article.title}></Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
