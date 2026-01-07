import { useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  FileText, Bell, File, Briefcase, BrainCircuit,
  MapPin, Calculator, ShieldAlert, BookOpen, UserCheck, HeartPulse, Plane
} from 'lucide-react';
import { SITE_CONFIG } from '@/lib/config';
import { supabase } from '@/lib/supabaseClient';
import { normalizeArabic } from '@/lib/arabicSearch';
// import { CONSULTANT_SCENARIOS } from '@/lib/consultant-scenarios'; // REMOVED

// ...

// ============================================
// 📦 أنواع البيانات (Types)

export type SearchIndexItem = {
  id: string;
  title: string;
  type: string;
  typeKey: 'service' | 'article' | 'tool'; // Constrained for better type safety
  desc: string;
  url: string;
  icon: any;
  haystack: string;
  keywords?: string;
};

export type SearchResult = SearchIndexItem & {
  _score?: number;
  _matchedTokens?: number;
};

// ============================================
// 🎯 الفهرس الموحد (Unified Index & Hook)
// ============================================

const STATIC_INDEX_DATA: SearchIndexItem[] = [
  // --- CONSULTANT SCENARIOS (HARDCODED) ---
  {
    id: 'scn-syrian-lost-id',
    title: 'فقدت الكملك (بدل ضائع)',
    type: 'استشارة',
    typeKey: 'tool',
    desc: 'إجراءات استخراج بدل ضائع للكملك والأوراق المطلوبة.',
    url: '/consultant?scenario=syrian-lost-id',
    icon: BrainCircuit,
    haystack: normalizeArabic('فقدت كملك ضاع بدل ضائع هوية سورية')
  },
  {
    id: 'scn-syrian-travel',
    title: 'إذن السفر (طبي/زيارة)',
    type: 'استشارة',
    typeKey: 'tool',
    desc: 'كيفية استخراج إذن سفر عبر إي دولات والشروط.',
    url: '/consultant?scenario=syrian-travel-visit',
    icon: Plane,
    haystack: normalizeArabic('اذن سفر طريقة استخراج اي دولات اجازة')
  },
  {
    id: 'scn-tourist-res',
    title: 'الإقامة السياحية',
    type: 'استشارة',
    typeKey: 'tool',
    desc: 'شروط التقديم والتجديد للإقامة السياحية.',
    url: '/consultant?scenario=tourist-new',
    icon: FileText,
    haystack: normalizeArabic('اقامة سياحية تقديم تجديد اول مرة')
  },
  {
    id: 'scn-kimlik-check',
    title: 'التحقق من الكملك',
    type: 'أداة',
    typeKey: 'tool',
    desc: 'رابط فحص قيد الكملك وصحته.',
    url: '/tools/kimlik-check',
    icon: UserCheck,
    haystack: normalizeArabic('فحص كملك قيد فعال مبطل تي جي')
  },

  // --- GUIDES ---
  {
    id: 'guide-residence',
    title: 'دليل الإقامة في تركيا',
    desc: 'أنواع الإقامات (سياحية، عقارية، طلابية، عائلية) وشروطها.',
    url: '/residence',
    type: 'خدمة',
    typeKey: 'service',
    icon: BookOpen,
    haystack: normalizeArabic('اقامة سياحية عقارية طالب عائلية تجديد موعد اوراق مطلوبة iqama residence ikamet')
  },
  {
    id: 'guide-work',
    title: 'أذونات العمل',
    desc: 'كيفية استخراج إذن العمل والشروط.',
    url: '/work',
    type: 'خدمة',
    typeKey: 'service',
    icon: Briefcase,
    haystack: normalizeArabic('اذن عمل تصريح عمل calisma izni work permit مؤسسة تامين sgk')
  },
  {
    id: 'guide-education',
    title: 'الدراسة في تركيا',
    desc: 'الجامعات، المنح التركية، وامتحان اليوس.',
    url: '/education',
    type: 'خدمة',
    typeKey: 'service',
    icon: BookOpen,
    haystack: normalizeArabic('جامعات منح دراسة يوس yos مدارس تسجيل طالب اجنبي')
  },
  {
    id: 'guide-health',
    title: 'الصحة والتأمين',
    desc: 'المستشفيات، التأمين الصحي (SGK/GSS).',
    url: '/health',
    type: 'خدمة',
    typeKey: 'service',
    icon: HeartPulse,
    haystack: normalizeArabic('صحة تامين صحي مستشفى مشفى علاج sgk gss Sigorta')
  },
  {
    id: 'guide-housing',
    title: 'السكن والعقارات',
    desc: 'نصائح استئجار وشراء العقارات، وقوانين التملك للأجانب.',
    url: '/housing',
    type: 'خدمة',
    typeKey: 'service',
    icon: BookOpen,
    haystack: normalizeArabic('سكن عقار ايجار شراء طابو تملك اجانب housing')
  },
  {
    id: 'guide-edevlet',
    title: 'خدمات الحكومة الإلكترونية',
    desc: 'شرح أهم خدمات E-Devlet وكيفية الاستفادة منها.',
    url: '/e-devlet-services',
    type: 'خدمة',
    typeKey: 'service',
    icon: FileText,
    haystack: normalizeArabic('اي دولات e-devlet خدمات رابط بوابة شيفرة')
  },

  // --- TOOLS ---
  {
    id: 'tool-consultant',
    title: 'المستشار القانوني الذكي',
    desc: 'نظام خبير يجيب عن أسئلتك القانونية.',
    url: '/consultant',
    type: 'أداة',
    typeKey: 'tool',
    icon: BrainCircuit,
    haystack: normalizeArabic('مستشار قانوني محامي ذكي استشارة مجانية سؤال وجواب اقامة لجوء كملك استثمار')
  },
  {
    id: 'tool-zones',
    title: 'فاحص المناطق المحظورة',
    desc: 'تحقق من الأحياء المحظورة لتثبيت النفوس للسوريين والأجانب.',
    url: '/zones',
    type: 'أداة',
    typeKey: 'tool',
    icon: MapPin,
    haystack: normalizeArabic('مناطق محظورة مغلقة احياء كملك سوريين نفوس تثبيت عنوان')
  },
  {
    id: 'tool-ban-calculator',
    title: 'حاسبة منع الدخول (الكودات)',
    desc: 'احسب مدة المنع التقريبية.',
    url: '/ban-calculator',
    type: 'أداة',
    typeKey: 'tool',
    icon: Calculator,
    haystack: normalizeArabic('منع دخول كود V87 ترحيل مخالفت فيزا')
  },
  {
    id: 'tool-codes',
    title: 'دليل الأكواد الأمنية',
    desc: 'شرح معاني أكواد المنع والترحيل.',
    url: '/codes',
    type: 'أداة',
    typeKey: 'tool',
    icon: ShieldAlert,
    haystack: normalizeArabic('كود اكواد ترحيل منع امني codes')
  },
  {
    id: 'tool-faq',
    title: 'الأسئلة الشائعة',
    desc: 'أجوبة سريعة عن الإقامة والكملك والعمل.',
    url: '/faq',
    type: 'أداة',
    typeKey: 'tool',
    icon: BookOpen,
    haystack: normalizeArabic('اسئلة سؤال جواب استفسار')
  },
  {
    id: 'tool-kimlik',
    title: 'فاحص الكملك (TC Check)',
    desc: 'تحقق من صحة رقم الكملك واستعلم عن حالته (فعال/مبطل) عبر الرابط الرسمي.',
    url: '/tools/kimlik-check',
    type: 'أداة',
    typeKey: 'tool',
    icon: UserCheck,
    haystack: normalizeArabic('فحص كملك صلاحية ابطال رقم تي جي TC NVI')
  },
  {
    id: 'tool-pharmacy',
    title: 'الصيدليات المناوبة',
    desc: 'ابحث عن أقرب صيدلية مناوبة في ولايتك الآن.',
    url: '/tools/pharmacy',
    type: 'أداة',
    typeKey: 'tool',
    icon: HeartPulse,
    haystack: normalizeArabic('صيدلية مناوبة دواء مفتوح eczane nöbetçi')
  },

  // --- STATIC PAGES ---
  {
    id: 'page-important-links',
    title: 'روابط هامة',
    desc: 'أهم الروابط الحكومية والخدمية (نفوس، ضرائب، هجرة).',
    url: '/important-links',
    type: 'صفحة',
    typeKey: 'service',
    icon: BookOpen,
    haystack: normalizeArabic('روابط مواقع حكومية e-devlet حجز موعد نفوس تركية nufus ضرائب gib هجرة goc idaresi unhcr asam هلال أحمر')
  },
  {
    id: 'page-about',
    title: 'من نحن',
    desc: 'تعرف على فريق دليلك القانوني الشامل',
    url: '/about-us',
    type: 'صفحة',
    typeKey: 'service',
    icon: BookOpen,
    haystack: normalizeArabic('من نحن فريق العمل اتصل بنا')
  },
  {
    id: 'page-contact',
    title: 'اتصل بنا',
    desc: 'تواصل مع فريق الدعم الفني.',
    url: '/contact',
    type: 'صفحة',
    typeKey: 'service',
    icon: BookOpen,
    haystack: normalizeArabic('تواصل دعم فني شكوى اقتراح contact')
  },
  {
    id: 'page-privacy',
    title: 'سياسة الخصوصية',
    desc: 'حماية البيانات والخصوصية',
    url: '/privacy-policy',
    type: 'صفحة',
    typeKey: 'service',
    icon: ShieldAlert,
    haystack: normalizeArabic('سياسة الخصوصية شروط الاستخدام privacy')
  },
  {
    id: 'page-sources',
    title: 'المصادر الموثوقة',
    desc: 'قائمة المصادر الحكومية والرسمية للمعلومات.',
    url: '/sources',
    type: 'صفحة',
    typeKey: 'service',
    icon: BookOpen,
    haystack: normalizeArabic('مصادر مراجع حكومية رسمية روابط sources')
  },
  {
    id: 'page-disclaimer',
    title: 'إخلاء المسؤولية',
    desc: 'شروط استخدام الموقع والمعلومات القانونية.',
    url: '/disclaimer',
    type: 'صفحة',
    typeKey: 'service',
    icon: ShieldAlert,
    haystack: normalizeArabic('شروط احكام مسؤولية قانونية')
  },
];

/**
 * فهرس النماذج
 */
function buildFormsIndex(): SearchIndexItem[] {
  return []; // Remote
}

/**
 * فهرس التحديثات/الأخبار
 */
function buildUpdatesIndex(): SearchIndexItem[] {
  return []; // Remote
}

// ============================================
// 🎯 الفهرس الموحد (Unified Index)
// ============================================



// ... (Existing Imports)

// ============================================
// 📦 أنواع البيانات (Types)
// ...

/**
 * جلب مقالات من قاعدة البيانات (Client-Side Indexing)
 * يجلب فقط البيانات الضرورية للبحث (العنوان، الوصف، الرابط)
 */
async function fetchArticlesIndex(): Promise<SearchIndexItem[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, category, intro, published_at')
      .order('published_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map((a: any) => ({
      id: `art-${a.id}`,
      title: a.title,
      type: 'مقال',
      typeKey: 'article',
      desc: a.category,
      url: `/article/${a.id}`, // or slug if available
      icon: FileText,
      haystack: normalizeArabic(`${a.title} ${a.intro || ''} ${a.category}`)
    }));
  } catch (err) {
    console.warn('Failed to fetch articles index:', err);
    return [];
  }
}

/**
 * جلب سيناريوهات الاستشار (Client-Side Indexing)
 */
async function fetchScenariosIndex(): Promise<SearchIndexItem[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('consultant_scenarios')
      .select('id, title, description, category');
    // .eq('is_active', true); // Removed as column might not exist or be different

    if (error) throw error;
    if (!data) return [];

    return data.map((s: any) => ({
      id: `scn-${s.id}`,
      title: s.title,
      type: 'استشارة ذكية',
      typeKey: 'tool', // mapped to 'tool' or 'service'
      desc: s.description ? s.description.substring(0, 100) : 'خطة عمل مخصصة',
      url: `/consultant?scenario=${s.id}`,
      icon: BrainCircuit,
      haystack: normalizeArabic(`${s.title} ${s.description || ''} ${s.category || ''}`)
    }));
  } catch (err) {
    console.warn('Failed to fetch scenarios index:', err);
    return [];
  }
}

// ... (Existing static builders: Tools, Pages)

// ============================================
// 🎯 الفهرس الموحد (Unified Index & Hook)
// ============================================

let _staticIndex: SearchIndexItem[] | null = null;

export function getStaticSearchIndex(): SearchIndexItem[] {
  if (_staticIndex === null) {
    _staticIndex = STATIC_INDEX_DATA;
  }
  return _staticIndex;
}

/**
 * Hook للبحث الموحد (يجمع بين الثابت والديناميكي)
 * هذا هو الهوك الذي يجب استخدامه في مكونات البحث
 */
export function useSearchIndex() {
  const [index, setIndex] = useState<SearchIndexItem[]>(getStaticSearchIndex());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDynamicIndex() {
      // Load Articles & Scenarios in Parallel
      const [articles, scenarios] = await Promise.all([
        fetchArticlesIndex(),
        fetchScenariosIndex()
      ]);

      // Merge with static (removing duplicates by ID)
      setIndex(prev => {
        const currentIds = new Set(prev.map(i => i.id));

        const newArticles = articles.filter(a => !currentIds.has(a.id));
        // Add articles to set to prevent cross-duplication (unlikely but safe)
        newArticles.forEach(a => currentIds.add(a.id));

        const newScenarios = scenarios.filter(s => !currentIds.has(s.id));

        return [...prev, ...newArticles, ...newScenarios];
      });

      setLoading(false);
    }

    loadDynamicIndex();
  }, []);

  return { index, loading };
}

/**
 * @deprecated Use useSearchIndex() hook instead for async data.
 */
export function getUnifiedSearchIndex(): SearchIndexItem[] {
  return getStaticSearchIndex();
}


/**
 * إحصائيات الفهرس
 */
export function getIndexStats(): Record<string, number> {
  const index = getUnifiedSearchIndex();
  const stats: Record<string, number> = { total: index.length };

  for (const item of index) {
    stats[item.typeKey] = (stats[item.typeKey] || 0) + 1;
  }

  return stats;
}

// ============================================
// ⚡ تحسينات الأداء (Performance Optimizations)
// ============================================

/**
 * كشف الأجهزة الضعيفة
 * يستخدم عدد النوى المنطقية كمؤشر على قوة الجهاز
 */
export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;

  // عدد النوى المنطقية (Logical Processors)
  const cores = navigator.hardwareConcurrency || 4;

  // أجهزة بـ 2 نواة أو أقل تعتبر ضعيفة
  if (cores <= 2) return true;

  // فحص الذاكرة إن كانت متاحة (Chrome فقط)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memory = (navigator as any).deviceMemory;
  if (memory && memory <= 2) return true;

  return false;
}

/**
 * الحصول على وقت الـ Debounce المناسب للجهاز
 * - الأجهزة الضعيفة: 300ms
 * - الأجهزة المتوسطة: 200ms
 * - الأجهزة القوية: 120ms
 */
export function getOptimalDebounceTime(): number {
  if (typeof navigator === 'undefined') return 150;

  const cores = navigator.hardwareConcurrency || 4;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memory = (navigator as any).deviceMemory;

  // جهاز ضعيف جداً
  if (cores <= 2 || (memory && memory <= 2)) {
    return 300;
  }

  // جهاز متوسط
  if (cores <= 4 || (memory && memory <= 4)) {
    return 200;
  }

  // جهاز قوي
  return 120;
}

/**
 * Hook مخصص للـ Debounce مع تحسين الأداء
 * يُستخدم في مكونات البحث
 */
export function useAdaptiveDebounce(): number {
  // يُحسب مرة واحدة على جانب العميل
  if (typeof window === 'undefined') return 150;
  return getOptimalDebounceTime();
}
