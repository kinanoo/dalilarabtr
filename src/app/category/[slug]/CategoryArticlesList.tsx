'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, AlertCircle, Sparkles, Calendar, Loader2 } from 'lucide-react';
import { useAdminArticles, isNewContent } from '@/lib/useAdminData';

type ArticlePreview = {
  slug: string;
  title: string;
  intro: string;
  lastUpdate: string;
  category: string;
  createdAt?: string;
  image?: string;
};

export default function CategoryArticlesList({
  categoryName,
  initialArticles,
}: {
  categoryName: string;
  initialArticles: ArticlePreview[];
}) {
  const { articles, loading } = useAdminArticles();

  // فلترة المقالات حسب التصنيف
  const categoryArticles = useMemo(() => {
    if (articles.length === 0) return initialArticles;
    
    return articles
      .filter((a) => a.category === categoryName)
      .map((a) => ({
        slug: a.id,
        title: a.title,
        intro: a.intro,
        lastUpdate: a.lastUpdate,
        category: a.category,
        createdAt: a.createdAt,
        image: a.image,
      }));
  }, [articles, categoryName, initialArticles]);

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
    <div className="max-w-screen-2xl mx-auto px-4 py-16">
      {categoryArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryArticles.map((article) => (
            <Link 
              key={article.slug} 
              href={`/article/${article.slug}`} 
              className="group bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-accent-500 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
            >
              {/* صورة المقال إذا وجدت */}
              {article.image && (
                <div className="h-40 overflow-hidden">
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600 transition-colors">
                    <FileText size={24} />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* علامة جديد */}
                    {article.createdAt && isNewContent(article.createdAt) && (
                      <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                        <Sparkles size={10} /> جديد
                      </span>
                    )}
                    
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded flex items-center gap-1">
                      <Calendar size={10} />
                      {article.lastUpdate}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-primary-700 transition-colors">
                  {article.title}
                </h3>
                
                <p className="text-sm text-slate-500 dark:text-slate-300 line-clamp-2 mb-6 flex-grow leading-relaxed">
                  {article.intro}
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
  );
}
