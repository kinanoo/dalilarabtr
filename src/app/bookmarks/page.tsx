'use client';

import { useEffect, useState } from 'react';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useBookmarks } from '@/hooks/useBookmarks';
import { ARTICLES } from '@/lib/articles';
import { Bookmark, FileText } from 'lucide-react';
import BookmarkButton from '@/components/BookmarkButton';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/EmptyState';

export default function BookmarksPage() {
    const { bookmarks, isLoaded } = useBookmarks();
    const [savedArticles, setSavedArticles] = useState<any[]>([]);

    useEffect(() => {
        if (isLoaded) {
            const list = bookmarks
                .map(id => {
                    const art = ARTICLES[id];
                    if (!art) return null;
                    return { id, ...art };
                })
                .filter(Boolean);
            setSavedArticles(list);
        }
    }, [bookmarks, isLoaded]);

    return (
        <main className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
            <PageHeader
                title="مفضلاتي"
                description="المقالات التي قمت بحفظها للعودة إليها لاحقاً"
                icon={<Bookmark size={48} />}
                breadcrumbs={[{ label: 'المفضلة', href: '/bookmarks' }]}
                gradient={true}
            />

            <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 pb-20">
                {!isLoaded ? (
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
                            <div key={article.id} className="group bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition flex gap-4 items-start relative card-hover">
                                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <FileText size={24} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <Link href={`/article/${article.id}`}>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition mb-1">
                                                {article.title}
                                            </h3>
                                        </Link>
                                        <BookmarkButton id={article.id} mini className="shrink-0 relative z-10" />
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{article.intro}</p>
                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">{article.category}</span>
                                        <span>{article.lastUpdate}</span>
                                    </div>
                                </div>
                                <Link href={`/article/${article.id}`} className="absolute inset-0 z-0" aria-label={article.title}></Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </main>
    );
}
