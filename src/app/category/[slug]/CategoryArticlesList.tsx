'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, ArrowLeft, AlertCircle, Sparkles, Calendar, Loader2, FolderOpen, Search, X, Clock, RefreshCw } from 'lucide-react';
import { useAdminArticles, isNewContent, isRecentlyUpdated, estimateReadingTime } from '@/lib/useAdminData';
import type { AdminArticle } from '@/lib/types';
import { TAG_LABELS } from '@/lib/config';
import PageHero from '@/components/PageHero';
import Breadcrumb from '@/components/ui/Breadcrumb';

type ArticlePreview = {
  slug: string;
  title: string;
  intro: string;
  lastUpdate: string;
  category: string;
  createdAt?: string;
  image?: string;
  tags?: string[];
};

export default function CategoryArticlesList({
  categoryName,
  categorySlug,
  initialArticles,
  activeTag,
}: {
  categoryName: string;
  categorySlug?: string;
  initialArticles: ArticlePreview[];
  activeTag?: string;
}) {
  const { articles, loading } = useAdminArticles();
  const [searchQuery, setSearchQuery] = useState('');

  // فلترة المقالات حسب التصنيف والبحث والتاغ
  const categoryArticles = useMemo(() => {
    let list = initialArticles;

    // 1. Merge with Remote if available
    if (articles.length > 0) {
      list = articles
        .filter((a) => a.category === categoryName)
        .map((a: AdminArticle) => ({
          slug: a.slug || a.id,
          title: a.title,
          intro: a.intro,
          lastUpdate: a.lastUpdate,
          category: a.category,
          createdAt: a.created_at,
          image: a.image,
          tags: a.tags || [],
        }));
    }

    // 2. Tag Filter (client-side fallback for SWR data)
    if (activeTag) {
      list = list.filter((a) => a.tags?.includes(activeTag));
    }

    // 3. Client-side Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.intro?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [articles, categoryName, initialArticles, searchQuery, activeTag]);

  // Only block the whole page on the spinner when we have NOTHING to show.
  // When the server passed `initialArticles`, render them immediately so the
  // <h1> (PageHero), the intro, and every article link are in the initial
  // server HTML — crawlable by Google instead of hidden behind a client-side
  // loading spinner. Remote data merges in silently once it arrives.
  if (loading && initialArticles.length === 0) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 py-16">
        <div className="flex items-center justify-center py-20">
          <Loader2 size={40} className="animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="max-w-7xl mx-auto w-full px-4">
        <Breadcrumb items={[
          { label: 'الدليل الشامل', href: '/directory' },
          { label: categoryName },
        ]} />
      </div>
      <PageHero
        title={categoryName}
        description={`دليل شامل لكل ما يتعلق بـ ${categoryName} في تركيا لعام 2026.`}
        icon={
          <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
            <FolderOpen size={32} className="text-accent-400" />
          </div>
        }
      >
        {/* Search Input In Hero */}
        <div className="relative max-w-xl mx-auto mt-6">
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <Search className="text-slate-400" size={20} />
          </div>
          <input
            type="text"
            placeholder={`بحث في ${categoryName}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-accent-400/50 transition-all font-medium"
          />
        </div>
      </PageHero>

      <div className="max-w-screen-2xl mx-auto px-4 py-16 w-full">
        {/* Active filter pill — premium chip with icon + clear button */}
        {activeTag && (
          <div className="mb-8 inline-flex items-center gap-3 bg-gradient-to-l from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/60 rounded-full pl-2 pr-4 py-1.5 shadow-sm">
            <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-700 dark:text-emerald-200 font-black text-sm tracking-wide">
              {TAG_LABELS[activeTag] || activeTag}
            </span>
            <Link
              href={`/category/${categorySlug}`}
              className="flex items-center justify-center w-6 h-6 rounded-full bg-white/70 dark:bg-slate-800 text-slate-500 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-300 transition-colors"
              aria-label="إزالة الفلتر"
            >
              <X size={12} />
            </Link>
          </div>
        )}

        {categoryArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryArticles.map((article) => {
              const isNew = article.createdAt && isNewContent(article.createdAt);
              const isUpdated = article.lastUpdate && isRecentlyUpdated(article.lastUpdate) && !isNew;
              return (
              <Link
                key={article.slug}
                href={`/article/${article.slug}`}
                className="group relative bg-gradient-to-br from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Top accent stripe — emerald gradient by default,
                    or amber for "updated recently" so the eye spots
                    fresh content first while scanning the grid */}
                <div
                  aria-hidden="true"
                  className={`absolute top-0 inset-x-0 h-1 z-10 ${
                    isNew
                      ? 'bg-gradient-to-l from-emerald-400 via-teal-400 to-emerald-500'
                      : isUpdated
                        ? 'bg-gradient-to-l from-blue-400 via-cyan-400 to-blue-500'
                        : 'bg-slate-200/70 dark:bg-slate-800/40'
                  }`}
                />

                {article.image && article.image.startsWith('http') && (
                  <div className="relative w-full h-40 overflow-hidden">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      onError={(e) => {
                        (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                      }}
                    />
                    {/* Subtle bottom gradient over image so the corner
                        badges stay legible regardless of image content */}
                    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>
                )}

                <div className="p-6 flex flex-col flex-grow relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-900 text-emerald-600 dark:text-emerald-300 group-hover:from-emerald-100 group-hover:to-teal-100 dark:group-hover:from-emerald-900/30 dark:group-hover:to-teal-900/20 group-hover:scale-105 group-hover:rotate-[-4deg] transition-all duration-300 shadow-sm">
                      <FileText size={22} />
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {isNew && (
                        <span className="bg-gradient-to-l from-emerald-500 to-teal-500 text-white text-[10px] font-black tracking-wide uppercase px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1 shadow-sm shadow-emerald-500/40">
                          <Sparkles size={10} /> جديد
                        </span>
                      )}
                      {isUpdated && (
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 text-[10px] font-black tracking-wide uppercase px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-200/60 dark:border-blue-800/40">
                          <RefreshCw size={9} /> محدّث
                        </span>
                      )}
                      <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1 tabular-nums">
                        <Clock size={10} />
                        {estimateReadingTime(article)} د
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-50 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-6 flex-grow leading-relaxed">
                    {article.intro?.replace(/<[^>]*>/g, '')}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                      قراءة الدليل
                      <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            );})}
          </div>
        ) : (
          <div className="text-center py-20 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/20 mb-4 shadow-sm">
              <AlertCircle size={32} className="text-emerald-500/70 dark:text-emerald-400/60" />
            </div>
            <p className="text-xl font-black text-slate-700 dark:text-slate-200 mb-1">
              قريباً
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              نعمل على إضافة مقالات لهذا القسم. تابعنا للحصول على آخر التحديثات أولاً بأول.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
