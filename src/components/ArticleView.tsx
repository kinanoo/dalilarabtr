'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArticleData, ARTICLES } from '@/lib/articles';
import { getOfficialSourceUrls } from '@/lib/externalLinks';
import { FileText, CheckCircle, AlertTriangle, MessageCircle, ListOrdered, Printer, ArrowLeft, Share2, Sparkles, Lightbulb, Coins, Info, ExternalLink, Check, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ShareMenu from './ShareMenu'; // 👈 استيراد المكون الجديد
import { buildWhatsAppHref } from '@/lib/whatsapp';
import { SITE_CONFIG } from '@/lib/data';

export default function ArticleView({ article, slug }: { article: ArticleData, slug: string }) {
  const [checkedItems, setCheckedItems] = useState<number[]>([]);
  const officialSources = getOfficialSourceUrls(article.source);

  const whatsAppHref = useMemo(() => {
    const url = `${SITE_CONFIG.siteUrl}/article/${slug}`;
    const text = `السلام عليكم، أحتاج مساعدة بخصوص: ${article.title}\n${url}`;
    return buildWhatsAppHref(SITE_CONFIG.whatsapp, text);
  }, [article.title, slug]);

  // مهم: لا تقرأ localStorage أثناء أول render حتى لا يحدث Hydration mismatch.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`progress-${slug}`);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCheckedItems(parsed);
      }
    } catch {
      // ignore
    }
  }, [slug]);

  // حفظ التقدم
  const toggleItem = (index: number) => {
    let newItems;
    if (checkedItems.includes(index)) {
      newItems = checkedItems.filter(i => i !== index);
    } else {
      newItems = [...checkedItems, index];
    }
    setCheckedItems(newItems);
    localStorage.setItem(`progress-${slug}`, JSON.stringify(newItems));
  };

  const relatedArticles = Object.entries(ARTICLES)
    .filter(([key, data]) => data.category === article.category && key !== slug)
    .slice(0, 3);

  const progress = article.documents.length
    ? Math.round((checkedItems.length / article.documents.length) * 100)
    : 0;

  return (
    <>
      <div className="fixed top-9 inset-x-0 w-full h-1.5 bg-slate-100 dark:bg-slate-800 z-30 pointer-events-none">
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${progress}%` }} 
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
        />
      </div>

      {/* ✅ إصلاح 1: إزالة max-w-6xl على الجوال وإضافة overflow-hidden */}
      <article className="w-full max-w-full lg:max-w-6xl mx-auto px-3 sm:px-4 py-8 overflow-hidden">
        <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300 mb-8 font-medium overflow-x-auto whitespace-nowrap pb-2">
            <Link href="/" className="hover:text-primary-600 transition">الرئيسية</Link>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <Link href="/directory" className="hover:text-primary-600 transition">الدليل</Link>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-primary-600 dark:text-primary-300 font-bold bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-md">{article.category}</span>
        </nav>
        
        {/* ✅ إصلاح 2: تقليل gap على الجوال */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 w-full max-w-full">
          <div className="lg:col-span-8 space-y-6 lg:space-y-8 min-w-0">
            {/* ✅ إصلاح 3: إزالة md:max-w-2xl على الجوال */}
            <div className="w-full max-w-full lg:max-w-2xl lg:mx-auto bg-white dark:bg-slate-900 rounded-2xl lg:rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden relative">
                    
                    {/* ✅ إصلاح 4: Header متجاوب */}
                    <div className="bg-primary-900 text-white p-4 sm:p-6 lg:p-12 relative overflow-hidden rounded-2xl lg:rounded-[2.5rem] w-full">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4 lg:mb-6 flex-wrap">
                              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full">
                                  {article.category}
                              </span>
                              {progress === 100 && (
                                <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 animate-in fade-in zoom-in">
                                  <CheckCircle size={12} /> مكتمل
                                </span>
                              )}
                            </div>
                            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-4 lg:mb-6 leading-tight">{article.title}</h1>
                            <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-slate-400 text-sm font-medium">
                                <span className="flex items-center gap-2"><Sparkles size={16} className="text-emerald-400"/> آخر تحديث: {article.lastUpdate}</span>
                            </div>
                        </div>
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-20"></div>
                    </div>
                    
                    {/* ✅ إصلاح 5: Content area متجاوب */}
                    <div className="p-4 sm:p-6 lg:p-12 space-y-8 lg:space-y-12 break-words overflow-x-hidden w-full max-w-full">
                        <div className="text-base lg:text-lg text-slate-600 dark:text-slate-200 leading-loose font-medium border-r-4 border-emerald-500 pr-4 lg:pr-6 pl-2">
                          <h3 className="flex items-center text-lg lg:text-xl font-bold text-slate-800 dark:text-slate-100 mb-3 gap-2">
                            <Info className="text-emerald-500 flex-shrink-0" size={20} /> ملخص الإجراء
                          </h3>

                          <p className="text-slate-700 dark:text-slate-100 font-bold mb-3">
                            {article.intro}
                          </p>
                          <p className="text-slate-600 dark:text-slate-200">
                            {article.details}
                          </p>

                          {/* ✅ إصلاح 6: Grid داخلي متجاوب */}
                          <div className="mt-6 grid grid-cols-1 gap-4">
                            <div className="bg-white/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-4">
                              <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">أهم الأوراق</div>
                              <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
                                {article.documents.slice(0, 5).map((doc, i) => (
                                  <li key={i} className="flex gap-2">
                                    <span className="text-emerald-500 mt-1 flex-shrink-0">•</span>
                                    <span>{doc}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-white/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-4">
                              <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">الخطة السريعة</div>
                              <ol className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
                                {article.steps.slice(0, 5).map((step, i) => (
                                  <li key={i} className="flex gap-2">
                                    <span className="text-blue-600 dark:text-blue-400 font-black flex-shrink-0">{i + 1}.</span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          </div>

                          {article.warning && (
                            <div className="mt-6 text-sm font-bold text-red-700 dark:text-red-300">
                              تنبيه مهم: {article.warning}
                            </div>
                          )}
                        </div>

            {/* 🌟 بطاقة المساعدة المباشرة */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-100 dark:border-emerald-900/30 p-4 lg:p-6 rounded-2xl flex flex-col gap-4">
                            <div>
                      <h3 className="font-bold text-emerald-900 dark:text-emerald-100 text-base lg:text-lg mb-1 flex items-center gap-2">
                                    <MessageCircle size={20} className="flex-shrink-0" /> هل الإجراء معقد؟
                                </h3>
                      <p className="text-emerald-700 dark:text-emerald-200 text-sm">فريقنا يمكنه مساعدتك في إنجاز هذه المعاملة بسرعة.</p>
                            </div>
                            {whatsAppHref ? (
                              <a
                                href={whatsAppHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto text-center bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                              >
                                تواصل معنا <ArrowLeft size={16} />
                              </a>
                            ) : (
                              <Link href="/contact" className="w-full sm:w-auto text-center bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
                                تواصل معنا <ArrowLeft size={16} />
                              </Link>
                            )}
                        </div>

                        {officialSources.length > 0 && (
                          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 p-4 lg:p-6 rounded-2xl flex flex-col gap-4">
                            <div>
                              <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-1">المصدر الرسمي</h3>
                              <p className="text-blue-800 dark:text-blue-200 text-sm">تحقق من المعلومات من المصدر الحكومي.</p>
                            </div>
                            <a href={officialSources[0]} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto text-center bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                              زيارة الموقع <ExternalLink size={16} />
                            </a>
                          </div>
                        )}

                        {article.fees && (
                          <div className="bg-gradient-to-br from-primary-800 to-primary-900 text-white p-4 lg:p-6 rounded-2xl shadow-lg relative overflow-hidden">
                            <div className="relative z-10 flex items-start gap-4">
                              <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm flex-shrink-0">
                                <Coins size={28} className="text-yellow-400" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-primary-100/80 text-sm mb-1 font-bold">التكلفة التقديرية</h3>
                                <p className="text-xl lg:text-2xl font-bold tracking-wide break-words">{article.fees}</p>
                              </div>
                            </div>
                            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                              <Coins size={120} />
                            </div>
                          </div>
                        )}

                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 sm:p-6 lg:p-8 rounded-2xl lg:rounded-[2rem]">
                            <div className="flex items-center justify-between mb-4 lg:mb-6 gap-2 flex-wrap">
                            <h3 className="flex items-center text-lg lg:text-2xl font-bold text-slate-800 dark:text-slate-100">
                                    <CheckCircle className="ml-2 text-emerald-500 flex-shrink-0" /> الأوراق المطلوبة
                                </h3>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-300 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full whitespace-nowrap">
                                    {progress}% جاهز
                                </span>
                            </div>
                            <div className="space-y-3">
                                {article.documents.map((doc, i) => (
                            <div key={i} onClick={() => toggleItem(i)} className={`group flex items-center p-3 lg:p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${checkedItems.includes(i) ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 shadow-none' : 'bg-white dark:bg-slate-950 border-transparent hover:border-emerald-200 dark:hover:border-emerald-900/40 shadow-sm'}`}>
                              <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ml-3 lg:ml-4 transition-all ${checkedItems.includes(i) ? 'bg-emerald-500 border-emerald-500 scale-110' : 'border-slate-300 dark:border-slate-600 group-hover:border-emerald-400'}`}>
                                        {checkedItems.includes(i) && <Check size={14} className="text-white" />}
                                    </div>
                              <span className={`text-sm lg:text-base font-medium transition-all ${checkedItems.includes(i) ? 'text-emerald-800 dark:text-emerald-200 line-through opacity-50' : 'text-slate-700 dark:text-slate-200'}`}>{doc}</span>
                                </div>
                                ))}
                            </div>
                        </div>

                        {article.tips && (
                          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 p-4 lg:p-6 rounded-2xl">
                            <h3 className="font-bold text-amber-900 dark:text-amber-100 text-base lg:text-lg mb-4 flex items-center gap-2">
                              <Lightbulb className="fill-amber-400 text-amber-500 flex-shrink-0" size={24} /> نصائح ذهبية
                            </h3>
                            <ul className="space-y-2">
                              {article.tips.map((tip, i) => (
                                <li key={i} className="flex gap-2 text-amber-800 dark:text-amber-200 font-medium text-sm">
                                  <span className="text-amber-500 mt-1 flex-shrink-0">•</span> {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div>
                          <h3 className="flex items-center text-lg lg:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 lg:mb-8">
                                <ListOrdered className="ml-2 text-blue-600 flex-shrink-0" /> خطوات التنفيذ
                            </h3>
                          <div className="space-y-0 relative border-r-2 border-slate-200 dark:border-slate-700 mr-4 pb-2">
                                {article.steps.map((step, i) => (
                                <div key={i} className="mb-6 lg:mb-8 relative pr-6 lg:pr-8 group">
                              <span className="absolute -right-[9px] top-0 w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-slate-300 dark:border-slate-600 group-hover:border-blue-500 transition-colors z-10"></span>
                              <div className="bg-white dark:bg-slate-950 p-4 lg:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm group-hover:shadow-md transition-all">
                                      <h4 className="text-xs font-bold text-blue-500 mb-2 uppercase tracking-wider">خطوة {i + 1}</h4>
                                <p className="text-base lg:text-lg text-slate-700 dark:text-slate-200 leading-relaxed font-medium">{step}</p>
                                    </div>
                                </div>
                                ))}
                            </div>
                        </div>

                        {article.warning && (
                            <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 p-4 lg:p-6 rounded-2xl flex gap-4 items-start">
                                <AlertTriangle className="text-red-500 flex-shrink-0 fill-red-100" size={28} />
                                <div className="min-w-0">
                                  <h3 className="font-bold text-red-900 dark:text-red-100 mb-1">تحذير قانوني</h3>
                                  <p className="text-red-700 dark:text-red-200 font-medium text-sm leading-relaxed">{article.warning}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {relatedArticles.length > 0 && (
                  <div className="mt-8 lg:mt-16 bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100/70 dark:border-emerald-900/30 rounded-2xl p-4 lg:p-5">
                    <h3 className="text-lg lg:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 lg:mb-6">قد يهمك أيضاً</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                      {relatedArticles.map(([relSlug, relData]) => (
                        <Link
                          key={relSlug}
                          href={`/article/${relSlug}`}
                          className="block bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-900/40 hover:shadow-lg transition group"
                        >
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-3 group-hover:text-emerald-700 transition-colors line-clamp-2 text-sm leading-relaxed">
                            {relData.title}
                          </h4>
                          <div className="flex items-center text-xs font-bold text-emerald-600">
                            اقرأ التفاصيل <ArrowLeft size={12} className="mr-1 group-hover:-translate-x-1 transition-transform"/>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* ✅ إصلاح 7: Sidebar - إخفاؤه على الجوال أو جعله متجاوب */}
            <div className="lg:col-span-4 space-y-6 hidden lg:block">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 sticky top-24">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 text-lg">إجراءات سريعة</h3>
                    
                    {/* 👇 زر المشاركة الجديد هنا */}
                    <div className="mb-3">
                      <ShareMenu title={article.title} />
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          window.focus();
                          window.print();
                        } catch {
                          // ignore
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition group"
                    >
                      <span className="text-sm">طباعة / PDF</span>
                      <Printer size={18} className="text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"/>
                    </button>
                    
                    <div className="mt-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white text-center shadow-lg shadow-emerald-500/20">
                        <BrainCircuit className="mx-auto mb-3 opacity-90" size={32} />
                        <h3 className="font-bold mb-2">محتار في الإجراءات؟</h3>
                        <p className="text-emerald-50 text-xs mb-4 leading-relaxed">دع المستشار الذكي يحلل وضعك ويعطيك الحل القانوني المناسب.</p>
                        <Link href="/consultant" className="block bg-white dark:bg-slate-950 text-emerald-700 dark:text-emerald-200 px-4 py-3 rounded-xl font-bold text-sm hover:bg-emerald-50 dark:hover:bg-slate-900 transition">
                            استشارة مجانية
                        </Link>
                    </div>
                </div>
            </div>
        </div>

        {/* ✅ إصلاح 8: أزرار سريعة للجوال (تظهر فقط على الشاشات الصغيرة) */}
        <div className="lg:hidden fixed bottom-20 left-4 right-4 z-40 flex gap-2">
          <ShareMenu title={article.title} customClass="flex-1" />
          <Link 
            href="/consultant" 
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 px-4 rounded-xl font-bold shadow-lg"
          >
            <BrainCircuit size={18} />
            <span className="text-sm">استشارة</span>
          </Link>
        </div>
      </article>
    </>
  );
}