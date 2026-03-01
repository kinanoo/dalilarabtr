'use client';


// import { ARTICLES } from '@/lib/articles'; // REMOVED

import { CATEGORY_SLUGS } from '@/lib/config';
import { useAdminArticles, useAdminServices, useAdminScenarios, isNewContent } from '@/lib/useAdminData';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, FolderOpen, ArrowLeft, Sparkles, Calendar, Loader2, ChevronDown, ChevronUp, IdCard, Plane, Briefcase, HeartPulse, GraduationCap, Link2, ShieldAlert, Calculator, BookOpen, Bell, Smartphone, MapPin, BrainCircuit, Home, Scale, Coffee, Zap, Building2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { minTokenMatches, normalizeArabic, tokenizeArabicQuery } from '@/lib/arabicSearch';
import { intelligentTokenize } from '@/lib/intelligentSearch';
import PageHero from '@/components/PageHero';
import HeroSearchInput from '@/components/HeroSearchInput';
import { getFAQData, type FAQCategory } from '@/lib/faq';
import { SERVICES_LIST, OFFICIAL_SOURCES } from '@/lib/constants';

type DirectoryArticle = {
  slug: string;
  title: string;
  intro: string;
  category: string;
  lastUpdate: string;
  createdAt?: string;
  image?: string;
  type?: 'article' | 'scenario'; // To distinguish
  risk?: string; // For scenarios
};

// الأقسام الرئيسية للمقالات
const PRIMARY_SECTIONS: Array<{ key: string; title: string; icon: any; color: string; categoryName?: string; isScenario?: boolean }> = [
  { key: 'kimlik', title: 'خدمات الكملك', icon: IdCard, color: 'bg-cyan-500 dark:bg-cyan-600', categoryName: CATEGORY_SLUGS.kimlik },
  { key: 'residence', title: 'الإقامة', icon: FileText, color: 'bg-blue-500 dark:bg-blue-600', categoryName: CATEGORY_SLUGS.residence },
  { key: 'scenarios', title: 'دليل الإجراءات والحلول', icon: BrainCircuit, color: 'bg-emerald-500 dark:bg-emerald-600', isScenario: true },
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
  // If it's a known scenario category or we just dump them all in 'scenarios' bucket for now
  if (categoryName === 'scenarios' || categoryName === 'general') return 'scenarios';

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
      // Fallback: If it looks like a scenario but not caught above, maybe put in scenarios? 
      // For now, default to residence or let the main loop handle logic.
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
  const { scenarios: adminScenarios, loading: loadingScenarios } = useAdminScenarios();

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

  // تحويل المقالات والسيناريوهات للصيغة المطلوبة
  const allArticles = useMemo((): DirectoryArticle[] => {
    const articles: DirectoryArticle[] = adminArticles.map((a) => ({
      slug: a.id,
      title: a.title,
      intro: a.intro,
      category: a.category,
      lastUpdate: a.lastUpdate,
      createdAt: a.created_at,
      image: a.image,
      type: 'article'
    }));

    const scenarios: DirectoryArticle[] = adminScenarios.map((s) => ({
      slug: s.id,
      title: s.title,
      intro: s.desc,
      category: (s as any).category || 'scenarios', // Use 'scenarios' if no category
      lastUpdate: s.lastUpdate || new Date().toISOString().split('T')[0],
      type: 'scenario',
      risk: s.risk
    }));

    return [...articles, ...scenarios];
  }, [adminArticles, adminScenarios]);

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
        // 🧠 البحث الذكي
        const searchText = `${data.title} ${categoryName} ${data.intro ?? ''}`;
        const { originalTokens, expandedTokens } = intelligentTokenize(filter);
        const textNorm = normalizeArabic(searchText);

        let score = 0;
        let hasOriginalKeyword = false;

        originalTokens.forEach(token => {
          if (textNorm.includes(normalizeArabic(token))) {
            hasOriginalKeyword = true;
            score += 20;
          }
        });

        if (!hasOriginalKeyword) continue;

        expandedTokens.forEach(term => {
          if (!originalTokens.includes(term) && textNorm.includes(normalizeArabic(term))) {
            score += 8;
          }
        });

        if (score < 12) continue;
      }

      const primaryKey = data.type === 'scenario' ? 'scenarios' : categoryToPrimaryKey(categoryName);
      const bucket = bucketed.get(primaryKey);

      // If no strict bucket found, try fallback or skip
      if (!bucket) continue;

      // Grouping: For scenarios, maybe group by 'Risk' or just 'General'? 
      // Let's keep original category name grouping for now.
      const groupName = data.type === 'scenario' ? 'إجراءات وحلول' : categoryName;

      if (!bucket.groups[groupName]) bucket.groups[groupName] = [];
      bucket.groups[groupName].push(data);
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
                  <Zap className="text-amber-500" size={28} /> الأدوات والخدمات الذكية
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                  <Link href="/consultant" className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex flex-col items-center gap-2 text-center group">
                    <div className="p-2.5 bg-white/20 rounded-lg group-hover:scale-110 transition"><BrainCircuit size={32} /></div>
                    <div>
                      <h3 className="font-bold text-base md:text-lg">المستشار الذكي</h3>
                      <p className="text-emerald-100 text-xs md:text-sm mt-1">تشخيص قانوني آلي</p>
                    </div>
                  </Link>
                  <Link href="/codes" className="bg-gradient-to-br from-red-600 to-rose-700 text-white p-5 md:p-6 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex flex-col items-center gap-3 text-center group">
                    <div className="p-2.5 bg-white/20 rounded-lg group-hover:scale-110 transition"><ShieldAlert size={32} /></div>
                    <div>
                      <h3 className="font-bold text-base md:text-lg">كاشف الأكواد</h3>
                      <p className="text-red-100 text-xs md:text-sm mt-1">شرح أكواد المنع</p>
                    </div>
                  </Link>
                  <Link href="/ban-calculator" className="bg-gradient-to-br from-orange-600 to-red-700 text-white p-5 md:p-6 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex flex-col items-center gap-3 text-center group">
                    <div className="p-2.5 bg-white/20 rounded-lg group-hover:scale-110 transition"><Calculator size={32} /></div>
                    <div>
                      <h3 className="font-bold text-base md:text-lg">حاسبة المنع</h3>
                      <p className="text-orange-100 text-xs md:text-sm mt-1">احسب مدة المنع</p>
                    </div>
                  </Link>
                  <Link href="/zones" className="bg-gradient-to-br from-pink-600 to-rose-700 text-white p-5 md:p-6 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex flex-col items-center gap-3 text-center group">
                    <div className="p-2.5 bg-white/20 rounded-lg group-hover:scale-110 transition"><MapPin size={32} /></div>
                    <div>
                      <h3 className="font-bold text-base md:text-lg">المناطق المحظورة</h3>
                      <p className="text-pink-100 text-xs md:text-sm mt-1">الأحياء المغلقة</p>
                    </div>
                  </Link>
                  <Link href="/tools/kimlik-check" className="bg-gradient-to-br from-cyan-600 to-blue-700 text-white p-5 md:p-6 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex flex-col items-center gap-3 text-center group">
                    <div className="p-2.5 bg-white/20 rounded-lg group-hover:scale-110 transition"><IdCard size={32} /></div>
                    <div>
                      <h3 className="font-bold text-base md:text-lg">فحص الكملك</h3>
                      <p className="text-cyan-100 text-xs md:text-sm mt-1">تحقق من TC</p>
                    </div>
                  </Link>
                  <Link href="/tools/pharmacy" className="bg-gradient-to-br from-green-600 to-emerald-700 text-white p-5 md:p-6 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex flex-col items-center gap-3 text-center group">
                    <div className="p-2.5 bg-white/20 rounded-lg group-hover:scale-110 transition"><HeartPulse size={32} /></div>
                    <div>
                      <h3 className="font-bold text-base md:text-lg">الصيدليات المناوبة</h3>
                      <p className="text-green-100 text-xs md:text-sm mt-1">صيدليات إسطنبول</p>
                    </div>
                  </Link>
                  <Link href="/calculator" className="bg-gradient-to-br from-amber-600 to-orange-700 text-white p-5 md:p-6 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex flex-col items-center gap-3 text-center group">
                    <div className="p-2.5 bg-white/20 rounded-lg group-hover:scale-110 transition"><Calculator size={32} /></div>
                    <div>
                      <h3 className="font-bold text-base md:text-lg">حاسبة التكاليف</h3>
                      <p className="text-amber-100 text-xs md:text-sm mt-1">تكاليف الإقامة</p>
                    </div>
                  </Link>
                  <Link href="/faq" className="bg-gradient-to-br from-teal-600 to-cyan-700 text-white p-5 md:p-6 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex flex-col items-center gap-3 text-center group">
                    <div className="p-2.5 bg-white/20 rounded-lg group-hover:scale-110 transition"><BookOpen size={32} /></div>
                    <div>
                      <h3 className="font-bold text-base md:text-lg">الأسئلة الشائعة</h3>
                      <p className="text-teal-100 text-xs md:text-sm mt-1">+471 سؤال</p>
                    </div>
                  </Link>
                  <Link href="/forms" className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-5 md:p-6 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex flex-col items-center gap-3 text-center group">
                    <div className="p-2.5 bg-white/20 rounded-lg group-hover:scale-110 transition"><FileText size={32} /></div>
                    <div>
                      <h3 className="font-bold text-base md:text-lg">النماذج الجاهزة</h3>
                      <p className="text-indigo-100 text-xs md:text-sm mt-1">عقود واستمارات</p>
                    </div>
                  </Link>
                  <Link href="/important-links" className="bg-gradient-to-br from-sky-600 to-blue-700 text-white p-5 md:p-6 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex flex-col items-center gap-3 text-center group">
                    <div className="p-2.5 bg-white/20 rounded-lg group-hover:scale-110 transition"><Link2 size={32} /></div>
                    <div>
                      <h3 className="font-bold text-base md:text-lg">الروابط الهامة</h3>
                      <p className="text-sky-100 text-xs md:text-sm mt-1">مواقع حكومية</p>
                    </div>
                  </Link>
                  <Link href="/e-devlet-services" className="bg-gradient-to-br from-purple-600 to-violet-700 text-white p-5 md:p-6 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex flex-col items-center gap-3 text-center group">
                    <div className="p-2.5 bg-white/20 rounded-lg group-hover:scale-110 transition"><Smartphone size={32} /></div>
                    <div>
                      <h3 className="font-bold text-base md:text-lg">خدمات e-Devlet</h3>
                      <p className="text-purple-100 text-xs md:text-sm mt-1">البوابة الحكومية</p>
                    </div>
                  </Link>
                  <Link href="/tools" className="bg-gradient-to-br from-slate-600 to-gray-700 text-white p-5 md:p-6 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex flex-col items-center gap-3 text-center group">
                    <div className="p-2.5 bg-white/20 rounded-lg group-hover:scale-110 transition"><Zap size={32} /></div>
                    <div>
                      <h3 className="font-bold text-base md:text-lg">كل الأدوات</h3>
                      <p className="text-slate-100 text-xs md:text-sm mt-1">جميع الأدوات</p>
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
                                  href={article.type === 'scenario' ? `/consultant?scenario=${article.slug}` : `/article/${article.slug}`}
                                  className={`group rounded-lg sm:rounded-xl border transition-all duration-300 flex flex-col overflow-hidden
                                      ${article.type === 'scenario'
                                      ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:shadow-lg hover:ring-1 hover:ring-emerald-500/20'
                                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-accent-500 hover:shadow-lg hover:bg-white dark:hover:bg-slate-800'
                                    }`}
                                >
                                  {/* صورة المقال (فقط للمقالات) */}
                                  {article.type !== 'scenario' && article.image && article.image.startsWith('http') && (
                                    <div className="h-28 sm:h-32 md:h-36 lg:h-40 xl:h-44 overflow-hidden relative">
                                      <Image
                                        src={article.image}
                                        alt={article.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        onError={(e) => {
                                          (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                                        }}
                                      />
                                    </div>
                                  )}

                                  <div className="p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col flex-grow">
                                    <div className="flex items-start justify-between mb-2 sm:mb-3 md:mb-4">
                                      <div className={`p-1.5 sm:p-2 md:p-3 rounded-md sm:rounded-lg md:rounded-xl text-slate-600 dark:text-slate-300 transition-colors
                                          ${article.type === 'scenario'
                                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50'
                                          : 'bg-slate-50 dark:bg-slate-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600'
                                        }`}>
                                        {article.type === 'scenario' ? <BrainCircuit size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" /> : <FileText size={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />}
                                      </div>

                                      <div className="flex items-center gap-1.5 sm:gap-2">
                                        {/* Risk Badge for Scenarios */}
                                        {article.type === 'scenario' && article.risk && (
                                          <span className={`text-[9px] sm:text-[10px] md:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-0.5 sm:gap-1 border
                                              ${article.risk === 'high' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30' :
                                              article.risk === 'medium' ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30' :
                                                'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30'
                                            }`}>
                                            {article.risk === 'high' ? '⚠️ حساس' : article.risk === 'medium' ? '⚡ متوسط' : '✅ روتيني'}
                                          </span>
                                        )}

                                        {/* New Badge for Articles */}
                                        {article.type !== 'scenario' && article.createdAt && isNewContent(article.createdAt) && (
                                          <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] sm:text-[10px] md:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full animate-pulse flex items-center gap-0.5 sm:gap-1">
                                            <Sparkles size={8} className="sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" /> جديد
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <h4 className={`text-sm sm:text-base md:text-lg lg:text-xl font-bold mb-1.5 sm:mb-2 transition-colors line-clamp-2
                                        ${article.type === 'scenario' ? 'text-slate-900 dark:text-white group-hover:text-emerald-600' : 'text-slate-800 dark:text-slate-100 group-hover:text-primary-700'}`}>
                                      {article.title}
                                    </h4>

                                    <p className="text-xs sm:text-sm md:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 md:line-clamp-3 mb-2 sm:mb-3 md:mb-4 flex-grow leading-relaxed">
                                      {article.intro}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto pt-2 sm:pt-2.5 md:pt-3 border-t border-slate-100 dark:border-slate-800">
                                      <span className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1">
                                        <Calendar size={10} className="sm:w-3 sm:h-3" />
                                        <span className="hidden sm:inline">{article.lastUpdate}</span>
                                        <span className="sm:hidden text-[9px]">...</span>
                                      </span>
                                      <span className={`flex items-center font-bold text-[10px] sm:text-xs md:text-sm group-hover:gap-2 transition-all
                                          ${article.type === 'scenario' ? 'text-emerald-600' : 'text-accent-600'}`}>
                                        <span className="hidden sm:inline">{article.type === 'scenario' ? 'تشخيص الحالة' : 'عرض التفاصيل'}</span>
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


    </main>
  );
}
