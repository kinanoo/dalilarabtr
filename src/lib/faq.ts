/**
 * =====================================================
 * 📚 ملف قراءة الأسئلة الشائعة
 * =====================================================
 * 
 * هذا الملف يقرأ الأسئلة من faq-data.ts
 * لتعديل الأسئلة، عدّل ملف faq-data.ts مباشرة
 * 
 * =====================================================
 */

// import { FAQ_DATA } from '@/lib/faq-data'; // REMOVED
// import { canonicalizeFaqCategories } from '@/lib/faqCanonical'; 
import type { FAQCategory, FAQQuestion } from '@/lib/faq-types';

// Empty data for static consumers
export const FAQ_DATA: FAQCategory[] = [];
export const FAQ_FALLBACK_DATA = FAQ_DATA;

/**
 * دالة جلب بيانات الأسئلة الشائعة
 * يجب استبدال استخدامها بـ useAdminFAQ أو الجلب من Supabase
 */
export function getFAQData(): FAQCategory[] {
  return [];
}

// تصدير الأنواع للاستخدام الخارجي
export type { FAQCategory, FAQQuestion };
