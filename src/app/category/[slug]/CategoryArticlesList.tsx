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

  if (loading) {
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
        {/* شريط الفلتر النشط */}
        {activeTag && (
          <div className="mb-8 flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-5 py-3">
            <span className="text-emerald-700 dark:text-emerald-300 font-bold text-sm">
              تصفية: {TAG_LABELS[activeTag] || activeTag}
            </span>
            <Link
              href={`/category/${categorySlug}`}
              className="mr-auto flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors font-medium"
            >
              <X size={14} />
              إزالة الفلتر
            </Link>
          </div>
        )}

        {categoryArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/article/${article.slug}`}
                className="group bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-accent-500 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
              >
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
                  </div>
                )}

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600 transition-colors">
                      <FileText size={24} />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {article.createdAt && isNewContent(article.createdAt) && (
                        <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                          <Sparkles size={10} /> جديد
                        </span>
                      )}
                      {article.lastUpdate && isRecentlyUpdated(article.lastUpdate) && !(article.createdAt && isNewContent(article.createdAt)) && (
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <RefreshCw size={9} /> محدّث
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded flex items-center gap-1">
                        <Clock size={10} />
                        {estimateReadingTime(article)} د
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-primary-700 transition-colors">
                    {article.title}
                  </h3>

                  <p className="text-sm text-slate-500 dark:text-slate-300 line-clamp-2 mb-6 flex-grow leading-relaxed">
                    {article.intro?.replace(/<[^>]*>/g, '')}
                  </p>

                  <div className="flex items-center text-accent-600 font-bold text-sm mt-auto group-hover:gap-2 transition-all">
                    قراءة الدليل <ArrowLeft size={16} className="mr-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
            <AlertCircle size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-xl text-slate-500 dark:text-slate-300">جاري إضافة مقالات لهذا القسم قريباً...</p>
          </div>
        )}
      </div>
    </div>
  );
}
