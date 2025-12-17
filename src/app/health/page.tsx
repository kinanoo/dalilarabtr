import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import Link from 'next/link';
import { HeartPulse, ArrowLeft } from 'lucide-react';
import { ARTICLES } from '@/lib/articles';

export default function HealthPage() {
  const articles = Object.entries(ARTICLES).filter(([key, data]) => data.category === 'الصحة والتأمين');

  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />
      <PageHero
        title="الصحة والتأمين"
        description="نظام المشافي، أنواع التأمين الصحي، وأرقام الطوارئ."
        icon={<HeartPulse className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      />

      <div className="max-w-screen-2xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.length > 0 ? (
            articles.map(([slug, article]) => (
              <Link key={slug} href={`/article/${slug}`} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-accent-500 hover:shadow-md transition group h-full flex flex-col">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3 group-hover:text-primary-600 transition">
                  {article.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-300 text-sm mb-6 flex-grow line-clamp-3">
                  {article.intro}
                </p>
                <div className="flex items-center text-accent-600 font-bold text-sm mt-auto">
                  اقرأ الدليل الكامل <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-3 text-center py-12 text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
              لا توجد مقالات مضافة في هذا القسم حالياً.
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}