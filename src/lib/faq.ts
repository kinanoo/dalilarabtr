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

import type { FAQCategory, FAQQuestion } from '@/lib/faq-types';
import { FAQ_DATA } from '@/lib/faq-data';
import { canonicalizeFaqCategories } from '@/lib/faqCanonical';

// تصدير البيانات للاستخدام المباشر
export { FAQ_DATA };

// البيانات الاحتياطية (نفس البيانات الرئيسية)
export const FAQ_FALLBACK_DATA = FAQ_DATA;

/**
 * دالة جلب بيانات الأسئلة الشائعة
 * تعمل على السيرفر والكلاينت
 */
export function getFAQData(): FAQCategory[] {
  return canonicalizeFaqCategories(FAQ_DATA);
}

// تصدير الأنواع للاستخدام الخارجي
export type { FAQCategory, FAQQuestion };
