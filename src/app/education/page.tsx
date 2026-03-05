import PageHero from '@/components/PageHero';
import Link from 'next/link';
import { GraduationCap, ArrowLeft, Sparkles, Calendar } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

export const revalidate = 3600;

function isNewContent(dateStr: string): boolean {
  if (!dateStr) return false;
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  return diffDays <= 7;
}

export default async function EducationPage() {
  let articles: any[] = [];

  if (supabase) {
    const { data } = await supabase
      .from('articles')
      .select('id, slug, title, intro, image, created_at, last_update')
      .eq('status', 'approved')
      .eq('category', 'الدراسة والتعليم');

    if (data) {
      articles = data.map(a => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        intro: a.intro,
        image: a.image,
        created_at: a.created_at,
        lastUpdate: a.last_update ? new Date(a.last_update).toISOString().split('T')[0] : '',
      }));
    }
  }

  return (
    <main className="flex flex-col min-h-screen">
      <PageHero
        title="الدراسة والتعليم"
        description="المدارس، الجامعات، المنح الدراسية، ومعادلة الشهادات."
        icon={<GraduationCap className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      />

      <div className="max-w-screen-2xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.length > 0 ? (
            articles.map((article) => (
              <Link
                key={article.id}
                href={`/article/${article.slug || article.id}`}
                className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-accent-500 hover:shadow-md transition group h-full flex flex-col overflow-hidden"
              >
                {article.image && article.image.startsWith('http') && (
                  <div className="h-40 overflow-hidden relative">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {isNewContent(article.created_at || '') && (
                      <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                        <Sparkles size={10} /> جديد
                      </span>
                    )}
                    <span className="text-xs text-slate-400 flex items-center gap-1 mr-auto"><Calendar size={12} />{article.lastUpdate}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3 group-hover:text-primary-600 transition">{article.title}</h3>
                  <p className="text-slate-500 dark:text-slate-300 text-sm mb-6 flex-grow line-clamp-3">{article.intro?.replace(/<[^>]*>/g, '')}</p>
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
      </div>
    </main>
  );
}
