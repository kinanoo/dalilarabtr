'use client';

import Footer from '@/components/Footer';
import { ARTICLES } from '@/lib/articles';
import type { ArticleData } from '@/lib/articles';
import { CATEGORY_SLUGS } from '@/lib/data';
import { useAdminArticles, useAdminServices, isNewContent } from '@/lib/useAdminData';
import Link from 'next/link';
import { FileText, FolderOpen, ArrowLeft, Sparkles, Calendar, Loader2, ChevronDown, ChevronUp, IdCard, Plane, Briefcase, HeartPulse, GraduationCap, Link2, ShieldAlert, Calculator, BookOpen, Bell, Smartphone, MapPin, BrainCircuit, Home, Scale, Coffee, Users, Zap, Map as MapIcon, Building2 } from 'lucide-react';
import { useEffect, useMemo, useState, useRef } from 'react';
import { minTokenMatches, normalizeArabic, tokenizeArabicQuery } from '@/lib/arabicSearch';
import PageHero from '@/components/PageHero';
import HeroSearchInput from '@/components/HeroSearchInput';
import { getFAQData, type FAQCategory } from '@/lib/faq';
import { SERVICES_LIST, OFFICIAL_SOURCES } from '@/lib/data';

type DirectoryArticle = {
  slug: string;
  title: string;
  intro: string;
  category: string;
  lastUpdate: string;
  createdAt?: string;
  image?: string;
};

// الأقسام الرئيسية للمقالات
const PRIMARY_SECTIONS: Array<{ key: string; title: string; icon: any; color: string; categoryName?: string }> = [
  { key: 'kimlik', title: 'خدمات الكملك', icon: IdCard, color: 'bg-cyan-500 dark:bg-cyan-600', categoryName: CATEGORY_SLUGS.kimlik },
  { key: 'residence', title: 'الإقامة', icon: FileText, color: 'bg-blue-500 dark:bg-blue-600', categoryName: CATEGORY_SLUGS.residence },
  { key: 'official', title: 'معاملات رسمية', icon: Scale, color: 'bg-slate-500 dark:bg-slate-600' },
  { key: 'edevlet', title: 'خدمات e-Devlet', icon: Smartphone, color: 'bg-red-500 dark:bg-red-600' },
  { key: 'housing', title: 'السكن والحياة', icon: Home, color: 'bg-orange-500 dark:bg-orange-600' },
  { key: 'daily', title: 'الحياة اليومية', icon: Coffee, color: 'bg-emerald-500 dark:bg-emerald-600' },
  { key: 'visa', title: 'الفيزا', icon: Plane, color: 'bg-purple-500 dark:bg-purple-600', categoryName: CATEGORY_SLUGS.visa },
  { key: 'work', title: 'العمل', icon: Briefcase, color: 'bg-amber-500 dark:bg-amber-600', categoryName: CATEGORY_SLUGS.work },
  { key: 'health', title: 'الصحة', icon: HeartPulse, color: 'bg-rose-500 dark:bg-rose-600', categoryName: CATEGORY_SLUGS.health },
  { key: 'education', title: 'الدراسة', icon: GraduationCap, color: 'bg-indigo-500 dark:bg-indigo-600', categoryName: CATEGORY_SLUGS.education },
];

// أقسام إضافية لصفحات الموقع
const ADDITIONAL_SECTIONS: Array<{ key: string; title: string; description: string; href: string; icon: any; color: string }> = [
  { key: 'consultant', title: 'المستشار الذكي', description: 'حلل وضعك القانوني واحصل على توصيات مخصصة', href: '/consultant', icon: BrainCircuit, color: 'bg-emerald-500 dark:bg-emerald-600' },
  { key: 'codes', title: 'دليل الأكواد', description: 'معرفة معنى الكود الأمني وسبب الرفض أو المنع', href: '/codes', icon: ShieldAlert, color: 'bg-red-500 dark:bg-red-600' },
  { key: 'ban-calculator', title: 'حاسبة مدة المنع', description: 'احسب المدة القانونية لمنع الدخول إلى تركيا', href: '/ban-calculator', icon: Calculator, color: 'bg-orange-500 dark:bg-orange-600' },
  { key: 'zones', title: 'المناطق المحظورة', description: 'التحقق من المناطق المفتوحة لتسجيل الأجانب', href: '/zones', icon: MapPin, color: 'bg-pink-500 dark:bg-pink-600' },
  { key: 'faq', title: 'الأسئلة الشائعة', description: 'أكثر من 471 سؤال وجواب حول القوانين والإجراءات', href: '/faq', icon: BookOpen, color: 'bg-green-500 dark:bg-green-600' },
  { key: 'updates', title: 'الأخبار والتحديثات', description: 'آخر الأخبار والتغييرات في قوانين تركيا', href: '/updates', icon: Bell, color: 'bg-yellow-500 dark:bg-yellow-600' },
  { key: 'e-devlet', title: 'دليل خدمات اي دولات', description: 'شرح مفصل لخدمات البوابة الإلكترونية الحكومية', href: '/e-devlet-services', icon: Smartphone, color: 'bg-teal-500 dark:bg-teal-600' },
  { key: 'important-links', title: 'الروابط الهامة', description: 'روابط مباشرة وموثوقة للخدمات الحكومية والمنظمات', href: '/important-links', icon: Link2, color: 'bg-sky-500 dark:bg-sky-600' },
  { key: 'services', title: 'اطلب خدمة', description: 'خدماتنا الخاصة لإنجاز معاملاتك', href: '/services', icon: Briefcase, color: 'bg-violet-500 dark:bg-violet-600' },
];

function categoryToPrimaryKey(categoryName: string): string {
  switch (categoryName) {
    case 'الكملك والحماية المؤقتة':
    case 'خدمات السوريين':
      return 'kimlik';

    case 'أنواع الإقامات':
    case 'الإقامة والأوراق':
      return 'residence';

    case 'السكن والحياة':
      return 'housing';

    case 'الحياة اليومية':
      return 'daily';

    case 'معاملات رسمية':
      return 'official';

    case 'خدمات e-Devlet':
      return 'edevlet';

    case 'الفيزا والتأشيرات':
      return 'visa';

    case 'العمل والاستثمار':
    case 'العمل والدخل':
      return 'work';

    case 'الصحة والتأمين':
      return 'health';

    case 'الدراسة والتعليم':
      return 'education';

    default:
      return 'residence';
  }
}

export default function DirectoryPage() {
  const [filter, setFilter] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    // جميع الأقسام مطوية افتراضياً
    const initial: Record<string, boolean> = {};
    PRIMARY_SECTIONS.forEach(s => { initial[s.key] = false; });
    ADDITIONAL_SECTIONS.forEach(s => { initial[s.key] = false; });
    return initial;
  });


  // 🆕 استخدام بيانات لوحة التحكم
  const { articles: adminArticles, loading: loadingArticles } = useAdminArticles();
  const { services: adminServices, loading: loadingServices } = useAdminServices();

  // بيانات المناطق المحظورة
  const [zones, setZones] = useState<any[]>([]);

  // بيانات الأسئلة الشائعة (ثابتة)
  const faqData = useMemo(() => getFAQData(), []);

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const q = new URLSearchParams(window.location.search).get('q');
      if (q) setFilter(q);

      // تحميل بيانات المناطق المحظورة
      fetch('/data/closed-areas.json')
        .then(res => res.json())
        .then(data => {
          if (data && data.items) {
            setZones(data.items);
          }
        })
        .catch(err => console.error('Failed to load zones:', err));

    } catch {
      // ignore
    }
  }, []);

  // تحويل المقالات للصيغة المطلوبة
  const allArticles = useMemo((): DirectoryArticle[] => {
    return adminArticles.map((a) => ({
      slug: a.id,
      title: a.title,
      intro: a.intro,
      category: a.category,
      lastUpdate: a.lastUpdate,
      createdAt: a.createdAt,
      image: a.image,
    }));
  }, [adminArticles]);

  const sections = useMemo(() => {
    const normalizedFilter = normalizeArabic(filter);
    const tokens = tokenizeArabicQuery(filter);
    const minMatched = minTokenMatches(tokens);

    const bucketed = new Map<
      string,
      {
        key: string;
        title: string;
        icon: any;
        color: string;
        groups: Record<string, DirectoryArticle[]>;
      }
    >();

    for (const s of PRIMARY_SECTIONS) {
      bucketed.set(s.key, { key: s.key, title: s.title, icon: s.icon, color: s.color, groups: {} });
    }

    for (const data of allArticles) {
      const categoryName = data.category || 'غير مصنف';

      if (normalizedFilter) {
        const haystack = normalizeArabic(`${data.title} ${categoryName} ${data.intro ?? ''}`);
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
        if (!matches) continue;
      }

      const primaryKey = categoryToPrimaryKey(categoryName);
      const bucket = bucketed.get(primaryKey);
      if (!bucket) continue;
      if (!bucket.groups[categoryName]) bucket.groups[categoryName] = [];
      bucket.groups[categoryName].push(data);
    }

    const ordered = PRIMARY_SECTIONS.map((s) => {
      const bucket = bucketed.get(s.key);
      if (!bucket) return { key: s.key, title: s.title, icon: s.icon, color: s.color, groups: {} as Record<string, DirectoryArticle[]> };

      const sortedGroups: Record<string, DirectoryArticle[]> = {};
      const keys = Object.keys(bucket.groups).sort((a, b) => a.localeCompare(b, 'ar'));
      for (const k of keys) sortedGroups[k] = bucket.groups[k];
      return { ...bucket, groups: sortedGroups };
    });

    return ordered;
  }, [filter, allArticles]);

  return (
    <main className="flex flex-col min-h-screen">
      <PageHero
        title="الدليل الشامل"
        description="كل ما في الموقع من مقالات، أدوات، خدمات، ومعلومات في مكان واحد."
        icon={<FolderOpen className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      >
        <HeroSearchInput value={filter} onChange={setFilter} placeholder="ابحث داخل الدليل..." />
      </PageHero>

      <div className="max-w-screen-2xl 2xl:max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-8 sm:py-12 lg:py-16">
        {loadingArticles || loadingServices ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={40} className="animate-spin text-emerald-600" />
          </div>
        ) : (
          <>
            {/* 🔧 الأدوات الذكية والحصرية */}
            {!filter && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-slate-700">
                  <Zap className="text-amber-500" size={28} /> الأدوات الذكية والحصرية
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
                      <p className="text-red-100 text-sm">شرح أكواد المنع (V87...).</p>
                    </div>
                  </Link>
                  <Link href="/map" className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl"><MapIcon size={32} /></div>
                    <div>
                      <h3 className="font-bold text-lg">الخريطة التفاعلية</h3>
                      <p className="text-blue-100 text-sm">مواقع القنصلية والهجرة.</p>
                    </div>
                  </Link>
                </div>
              </section>
            )}


            {/* البطاقات الرئيسية */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {/* الأقسام الرئيسية (المقالات) */}
              {sections.map((section) => {
                const SectionIcon = section.icon;
                const articleCount = Object.values(section.groups).reduce((sum, articles) => sum + articles.length, 0);
                const isExpanded = expandedSections[section.key];
                return Object.keys(section.groups).length > 0 && (
                  <div
                    key={section.key}
                    className={`bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden ${isExpanded ? 'sm:col-span-2 lg:col-span-2 xl:col-span-3 2xl:col-span-4' : ''
                      }`}
                  >
                    <button
                      onClick={() => toggleSection(section.key)}
                      className="w-full p-3 sm:p-4 md:p-5 lg:p-6 flex items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <div className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/20 transition-colors flex-shrink-0 ${isExpanded ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600' : ''}`}>
                        {isExpanded ? (
                          <ChevronUp size={20} className="sm:w-6 sm:h-6" />
                        ) : (
                          <ChevronDown size={20} className="sm:w-6 sm:h-6" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 justify-end">
                        <div className="flex-1 min-w-0 text-right">
                          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-0.5 sm:mb-1">
                            {section.title}
                          </h2>
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            {articleCount} {articleCount === 1 ? 'مقال' : 'مقال'}
                          </p>
                        </div>
                        <div className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl ${section.color} text-white shadow-sm flex-shrink-0`}>
                          <SectionIcon size={24} className="sm:w-7 sm:h-7 md:w-8 md:h-8" />
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 sm:px-4 md:px-5 lg:px-6 pb-3 sm:pb-4 md:pb-5 lg:pb-6 space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 border-t border-slate-100 dark:border-slate-800 pt-3 sm:pt-4 md:pt-5 lg:pt-6">
                        {Object.entries(section.groups).map(([categoryName, articles]) => (
                          <div key={`${section.key}:${categoryName}`} className="space-y-3 sm:space-y-4 md:space-y-5">
                            <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-700 dark:text-slate-200 pb-2 border-b border-slate-200 dark:border-slate-700">
                              {categoryName}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                              {articles.map((article) => (
                                <Link
                                  key={article.slug}
                                  href={`/article/${article.slug}`}
                                  className="group bg-slate-50 dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 hover:border-accent-500 hover:shadow-lg hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 flex flex-col overflow-hidden"
                                >
                                  {/* صورة المقال */}
                                  {article.image && (
                                    <div className="h-28 sm:h-32 md:h-36 lg:h-40 xl:h-44 overflow-hidden">
                                      <img
                                        src={article.image}
                                        alt={article.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      />
                                    </div>
                                  )}

                                  <div className="p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col flex-grow">
                                    <div className="flex items-start justify-between mb-2 sm:mb-3 md:mb-4">
                                      <div className="p-1.5 sm:p-2 md:p-3 rounded-md sm:rounded-lg md:rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600 transition-colors">
                                        <FileText size={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
                                      </div>

                                      <div className="flex items-center gap-1.5 sm:gap-2">
                                        {/* علامة جديد */}
                                        {article.createdAt && isNewContent(article.createdAt) && (
                                          <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] sm:text-[10px] md:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full animate-pulse flex items-center gap-0.5 sm:gap-1">
                                            <Sparkles size={8} className="sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" /> جديد
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <h4 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-800 dark:text-slate-100 mb-1.5 sm:mb-2 group-hover:text-primary-700 transition-colors line-clamp-2">
                                      {article.title}
                                    </h4>

                                    <p className="text-xs sm:text-sm md:text-sm text-slate-500 dark:text-slate-300 line-clamp-2 md:line-clamp-3 mb-2 sm:mb-3 md:mb-4 flex-grow leading-relaxed">
                                      {article.intro}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto pt-2 sm:pt-2.5 md:pt-3 border-t border-slate-100 dark:border-slate-800">
                                      <span className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1">
                                        <Calendar size={10} className="sm:w-3 sm:h-3" />
                                        <span className="hidden sm:inline">{article.lastUpdate}</span>
                                        <span className="sm:hidden text-[9px]">...</span>
                                      </span>
                                      <span className="flex items-center text-accent-600 font-bold text-[10px] sm:text-xs md:text-sm group-hover:gap-2 transition-all">
                                        <span className="hidden sm:inline">عرض التفاصيل</span>
                                        <span className="sm:hidden">عرض</span>
                                        <ArrowLeft size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-0.5 sm:mr-1" />
                                      </span>
                                    </div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* الأقسام الإضافية (صفحات الموقع) */}
              {ADDITIONAL_SECTIONS.filter(section => {
                const normalizedFilter = normalizeArabic(filter);
                if (!normalizedFilter) return true;

                // البحث الأساسي في العنوان والوصف
                const basicMatch = normalizeArabic(`${section.title} ${section.description}`).includes(normalizedFilter);
                if (basicMatch) return true;

                // البحث العميق حسب القسم
                if (section.key === 'faq') {
                  // البحث في الأسئلة والأجوبة
                  return faqData.some(cat =>
                    cat.questions.some(q =>
                      normalizeArabic(q.q).includes(normalizedFilter) ||
                      normalizeArabic(q.a).includes(normalizedFilter)
                    )
                  );
                }

                if (section.key === 'zones') {
                  // البحث في المناطق المحظورة
                  return zones.some(zone =>
                    normalizeArabic(zone.n || '').includes(normalizedFilter) ||
                    normalizeArabic(zone.d || '').includes(normalizedFilter) ||
                    normalizeArabic(zone.c || '').includes(normalizedFilter)
                  );
                }

                if (section.key === 'services') {
                  // البحث في الخدمات
                  return adminServices.some(s =>
                    normalizeArabic(s.title).includes(normalizedFilter) ||
                    normalizeArabic(s.desc).includes(normalizedFilter)
                  );
                }

                return false;
              }).map((section) => {
                const SectionIcon = section.icon;
                return (
                  <div
                    key={section.key}
                    className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    <Link
                      href={section.href}
                      className="block w-full p-3 sm:p-4 md:p-5 lg:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl ${section.color} text-white shadow-sm flex-shrink-0`}>
                          <SectionIcon size={24} className="sm:w-7 sm:h-7 md:w-8 md:h-8" />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-0.5 sm:mb-1 group-hover:text-primary-700 transition-colors">
                            {section.title}
                          </h2>
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                            {section.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 🏛️ الروابط الرسمية */}
      {!filter && (
        <div className="max-w-screen-2xl mx-auto px-4 py-12">
          <section>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-slate-700">
              <Building2 className="text-slate-500" size={28} /> روابط حكومية مباشرة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {OFFICIAL_SOURCES.map((source, idx) => (
                <a key={idx} href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{source.name}</span>
                  <ArrowLeft size={16} className="text-slate-400 dark:text-slate-500" />
                </a>
              ))}
            </div>
          </section>
        </div>
      )}

      <Footer />
    </main>
  );
}
