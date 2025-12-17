/**
 * 🔍 فهرس البحث الموحد (Unified Search Index)
 * ============================================
 * 
 * هذا الملف يجمع كل فهارس البحث في مكان واحد بدلاً من تكرارها
 * في كل مكون (GlobalSearch, WhatsAppAssistant, etc.)
 * 
 * الفوائد:
 * - تحسين الأداء على الأجهزة الضعيفة
 * - تقليل استهلاك الذاكرة
 * - سهولة الصيانة والتحديث
 * 
 * @author Claude AI
 * @lastUpdate 2025-12-20
 */

import type { LucideIcon } from 'lucide-react';
import { FileText, Bell, File, Briefcase, BrainCircuit } from 'lucide-react';
import { ARTICLES } from '@/lib/articles';
import { SERVICES_LIST, FORMS, LATEST_UPDATES } from '@/lib/data';
import { CONSULTANT_SCENARIOS } from '@/lib/consultant-data';
import { normalizeArabic } from '@/lib/arabicSearch';

// ============================================
// 📦 أنواع البيانات (Types)
// ============================================

export type SearchIndexItem = {
  id: string;
  title: string;
  type: string;
  typeKey: 'article' | 'service' | 'consultant' | 'form' | 'update';
  url: string;
  icon: LucideIcon;
  desc?: string;
  haystack: string;
};

export type SearchResult = {
  id: string | number;
  title: string;
  type: string;
  url: string;
  icon: LucideIcon;
  desc?: string;
};

// ============================================
// 🛠️ دوال مساعدة (Helper Functions)
// ============================================

/**
 * استخراج معرف المقال من الرابط
 */
function extractArticleIdFromLink(link?: string): string {
  const raw = (link || '').trim();
  if (!raw.startsWith('/article/')) return '';
  const after = raw.slice('/article/'.length);
  const clean = after.split(/[?#]/)[0] || '';
  try {
    return decodeURIComponent(clean).trim();
  } catch {
    return clean.trim();
  }
}

// ============================================
// 📚 بناء الفهارس (Index Builders)
// ============================================

/**
 * فهرس المقالات
 */
function buildArticleIndex(): SearchIndexItem[] {
  return Object.entries(ARTICLES).map(([slug, data]) => {
    const raw = [
      data.title,
      data.intro,
      data.details,
      ...(data.documents || []),
      ...(data.steps || []),
      ...(data.tips || []),
      data.fees || '',
      data.warning || '',
    ]
      .filter(Boolean)
      .join(' ');

    return {
      id: `art-${slug}`,
      title: data.title,
      type: 'مقال',
      typeKey: 'article' as const,
      url: `/article/${slug}`,
      icon: FileText,
      haystack: normalizeArabic(raw),
    };
  });
}

/**
 * فهرس الخدمات
 */
function buildServiceIndex(): SearchIndexItem[] {
  return SERVICES_LIST.map((service) => ({
    id: `srv-${service.id}`,
    title: service.title,
    type: 'خدمة',
    typeKey: 'service' as const,
    url: `/request?service=${service.id}`,
    icon: Briefcase,
    desc: service.desc,
    haystack: normalizeArabic(`${service.title} ${service.desc}`),
  }));
}

/**
 * فهرس الاستشارات الذكية
 */
function buildConsultantIndex(): SearchIndexItem[] {
  return Object.entries(CONSULTANT_SCENARIOS).map(([key, value]) => {
    const articleId = (value.articleId || '').trim() || extractArticleIdFromLink(value.link);
    const article = articleId ? ARTICLES[articleId] : undefined;

    const desc = article?.intro?.trim() ? article.intro : value.desc;
    const articleText = article
      ? [
          article.title,
          article.intro,
          article.details,
          ...(article.documents || []),
          ...(article.steps || []),
          ...(article.tips || []),
          article.fees || '',
          article.warning || '',
        ]
          .filter(Boolean)
          .join(' ')
      : '';

    return {
      id: `consult-${key}`,
      title: value.title,
      type: 'استشارة ذكية',
      typeKey: 'consultant' as const,
      url: `/consultant?scenario=${encodeURIComponent(key)}`,
      icon: BrainCircuit,
      desc,
      haystack: normalizeArabic(`${value.title} ${desc || ''} ${value.legal || ''} ${articleText}`),
    };
  });
}

/**
 * فهرس النماذج
 */
function buildFormsIndex(): SearchIndexItem[] {
  return FORMS.map((form, idx) => ({
    id: `form-${idx}`,
    title: form.name,
    type: 'نموذج',
    typeKey: 'form' as const,
    url: '/forms',
    icon: File,
    haystack: normalizeArabic(form.name),
  }));
}

/**
 * فهرس التحديثات/الأخبار
 */
function buildUpdatesIndex(): SearchIndexItem[] {
  return LATEST_UPDATES.map((update) => ({
    id: `upd-${update.id}`,
    title: update.title,
    type: 'خبر',
    typeKey: 'update' as const,
    url: `/updates#upd-${update.id}`,
    icon: Bell,
    haystack: normalizeArabic(update.title),
  }));
}

// ============================================
// 🎯 الفهرس الموحد (Unified Index)
// ============================================

/**
 * الفهرس الموحد - يُبنى مرة واحدة فقط عند تحميل الوحدة
 * هذا يوفر الذاكرة ويحسن الأداء بشكل كبير
 */
let _unifiedIndex: SearchIndexItem[] | null = null;

/**
 * الحصول على الفهرس الموحد (Lazy initialization)
 * يُبنى مرة واحدة فقط ويُعاد استخدامه
 */
export function getUnifiedSearchIndex(): SearchIndexItem[] {
  if (_unifiedIndex === null) {
    _unifiedIndex = [
      ...buildConsultantIndex(),  // الاستشارات أولاً (الأهم)
      ...buildArticleIndex(),     // ثم المقالات
      ...buildServiceIndex(),     // ثم الخدمات
      ...buildFormsIndex(),       // ثم النماذج
      ...buildUpdatesIndex(),     // ثم الأخبار
    ];
  }
  return _unifiedIndex;
}

/**
 * الحصول على فهرس حسب النوع
 */
export function getIndexByType(typeKey: SearchIndexItem['typeKey']): SearchIndexItem[] {
  return getUnifiedSearchIndex().filter(item => item.typeKey === typeKey);
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
