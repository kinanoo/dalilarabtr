import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { ARTICLES } from '@/lib/articles'; // استيراد المقالات

export default function HousingPage() {
  // تصفية المقالات الخاصة بالسكن فقط
  const housingArticles = Object.entries(ARTICLES).filter(([key, data]) => data.category === 'السكن والحياة');

  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />
      <PageHero
        title="السكن والحياة اليومية"
        description="كل ما يخص الإيجار، الفواتير، ونقل السكن."
        icon={<Home className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      />

      <div className="max-w-screen-2xl mx-auto px-4 py-12">
        {/* شبكة المقالات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {housingArticles.map(([slug, article]) => (
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
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}