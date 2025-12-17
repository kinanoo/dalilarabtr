'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import Link from 'next/link';
import { GraduationCap, ArrowLeft, Loader2, Sparkles, Calendar } from 'lucide-react';
import { useAdminArticles, isNewContent } from '@/lib/useAdminData';
import { useMemo } from 'react';

export default function EducationPage() {
  const { articles: allArticles, loading } = useAdminArticles();

  const articles = useMemo(() => {
    return allArticles.filter(a => a.category === 'الدراسة والتعليم');
  }, [allArticles]);

  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />
      <PageHero
        title="الدراسة والتعليم"
        description="المدارس، الجامعات، المنح الدراسية، ومعادلة الشهادات."
        icon={<GraduationCap className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      />

      <div className="max-w-screen-2xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={40} className="animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.length > 0 ? (
              articles.map((article) => (
                <Link 
                  key={article.id} 
                  href={`/article/${article.id}`} 
                  className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-accent-500 hover:shadow-md transition group h-full flex flex-col overflow-hidden"
                >
                  {article.image && (
                    <div className="h-40 overflow-hidden">
                      <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {isNewContent(article.createdAt) && (
                        <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                          <Sparkles size={10} /> جديد
                        </span>
                      )}
                      <span className="text-xs text-slate-400 flex items-center gap-1 mr-auto"><Calendar size={12} />{article.lastUpdate}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3 group-hover:text-primary-600 transition">{article.title}</h3>
                    <p className="text-slate-500 dark:text-slate-300 text-sm mb-6 flex-grow line-clamp-3">{article.intro}</p>
                    <div className="flex items-center text-accent-600 font-bold text-sm mt-auto">اقرأ الدليل الكامل <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" /></div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                لا توجد مقالات مضافة في هذا القسم حالياً.
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
