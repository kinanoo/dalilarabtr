'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ARTICLES } from '@/lib/articles';
import type { ArticleData } from '@/lib/articles';
import { SERVICES_LIST, OFFICIAL_SOURCES } from '@/lib/data';
import Link from 'next/link';
import { 
  FileText, FolderOpen, ArrowLeft, BrainCircuit, 
  Briefcase, ShieldAlert, Zap, Building2, Map 
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { minTokenMatches, normalizeArabic, tokenizeArabicQuery } from '@/lib/arabicSearch';
import PageHero from '@/components/PageHero';
import HeroSearchInput from '@/components/HeroSearchInput';

export default function DirectoryPage() {
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const q = new URLSearchParams(window.location.search).get('q');
      if (q) setFilter(q);
    } catch {
      // ignore
    }
  }, []);

  // 1. تجميع المقالات حسب الفئة
  const groupedArticles = useMemo(() => {
    const normalizedFilter = normalizeArabic(filter);
    const tokens = tokenizeArabicQuery(filter);
    const minMatched = minTokenMatches(tokens);

    return Object.entries(ARTICLES).reduce((acc, [slug, data]) => {
      if (!acc[data.category]) acc[data.category] = [];

      if (!normalizedFilter) {
        acc[data.category].push({ slug, ...data });
        return acc;
      }

      const haystack = normalizeArabic(`${data.title} ${data.category} ${data.intro ?? ''}`);

      const matches =
        tokens.length === 0
          ? haystack.includes(normalizedFilter)
          : (() => {
              let matched = 0;
              for (const token of tokens) {
                if (haystack.includes(token)) matched += 1;
              }
              return matched >= minMatched;
            })();

      if (matches) {
        acc[data.category].push({ slug, ...data });
      }
      return acc;
    }, {} as Record<string, Array<{ slug: string } & ArticleData>>);
  }, [filter]);

  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />
      
      <PageHero
        title="خريطة الموقع الشاملة"
        description="كل ما في الموقع من أدوات، خدمات، ومعلومات في مكان واحد."
        icon={<FolderOpen className="w-10 h-10 md:w-12 md:h-12 text-emerald-400" />}
      >
        <HeroSearchInput value={filter} onChange={setFilter} placeholder="ابحث داخل الدليل الكامل..." />
      </PageHero>

  <div className="max-w-screen-2xl mx-auto px-4 py-12 space-y-16">

        {/* القسم 1: الأدوات الذكية (الأهم) */}
        {!filter && (
          <section>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-slate-700">
              <Zap className="text-amber-500" /> الأدوات الذكية والحصرية
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/consultant" className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl"><BrainCircuit size={32} /></div>
                <div>
                  <h3 className="font-bold text-lg">المستشار القانوني</h3>
                  <p className="text-emerald-100 text-sm">تشخيص آلي لوضعك.</p>
                </div>
              </Link>
              <Link href="/codes" className="bg-gradient-to-br from-red-600 to-rose-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl"><ShieldAlert size={32} /></div>
                <div>
                  <h3 className="font-bold text-lg">كاشف الأكواد</h3>
                  <p className="text-red-100 text-sm">شرح أكواد المنع (V87..).</p>
                </div>
              </Link>
              <Link href="/map" className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl"><Map size={32} /></div>
                <div>
                  <h3 className="font-bold text-lg">الخريطة التفاعلية</h3>
                  <p className="text-blue-100 text-sm">مواقع القنصلية والهجرة.</p>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* القسم 2: الخدمات الخاصة (المدفوعة) */}
        {!filter && (
          <section>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-slate-700">
              <Briefcase className="text-blue-500" /> خدماتنا الخاصة (ننجزها لك)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {SERVICES_LIST.map((service, idx) => (
                <Link key={idx} href={`/request?service=${service.id}`} className="group bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:shadow-md transition text-center">
                  <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center text-white mb-3 ${service.color}`}>
                    <service.icon size={20} />
                  </div>
                  <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm group-hover:text-blue-600">{service.title}</h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* القسم 3: الموسوعة المعرفية (المقالات) */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText className="text-slate-500" /> دليل المعاملات والإجراءات
            </h2>
          </div>

          {Object.keys(groupedArticles).length > 0 ? (
            <div className="space-y-12">
              {Object.entries(groupedArticles).map(([category, articles], idx) => (
                articles.length > 0 && (
                  <div key={idx} className="relative">
                    <h3 className="text-xl font-bold text-primary-900 dark:text-primary-200 mb-4 bg-primary-50 dark:bg-primary-900/20 w-fit px-4 py-2 rounded-lg border border-primary-100 dark:border-primary-900/30">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {articles.map((article) => (
                        <Link 
                          key={article.slug} 
                          href={`/article/${article.slug}`}
                          className="group bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition flex items-start gap-4"
                        >
                          <div className="mt-1">
                            <FileText size={20} className="text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 transition-colors" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 transition-colors">
                              {article.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 line-clamp-1">{article.intro}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              <p className="text-xl text-slate-500 dark:text-slate-300">لا توجد نتائج مطابقة لـ &quot;{filter}&quot;</p>
            </div>
          )}
        </section>

        {/* القسم 4: المصادر الرسمية */}
        {!filter && (
          <section>
             <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-slate-700">
              <Building2 className="text-slate-500" /> روابط حكومية مباشرة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {OFFICIAL_SOURCES.map((source, idx) => (
                <a key={idx} href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                  <span className="font-bold text-slate-700 dark:text-slate-200">{source.name}</span>
                  <ArrowLeft size={16} className="text-slate-400 dark:text-slate-500" />
                </a>
              ))}
            </div>
          </section>
        )}

      </div>
      <Footer />
    </main>
  );
}