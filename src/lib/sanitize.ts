/**
 * 🛡️ تنظيف المدخلات (Input Sanitization)
 * ==========================================
 * 
 * هذا الملف يحتوي على دوال لتنظيف وتعقيم المدخلات من المستخدم
 * لمنع هجمات XSS و Injection
 * 
 * الفائدة:
 * - منع هجمات XSS (Cross-Site Scripting)
 * - منع SQL Injection (إذا كان هناك قاعدة بيانات)
 * - منع Code Injection
 * - تحسين الأمان العام
 */

// ============================================
// 🧹 تنظيف النصوص
// ============================================

/**
 * ينظف نص من HTML tags الخطيرة
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    // إزالة HTML tags
    .replace(/<[^>]*>/g, '')
    // إزالة JavaScript events
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // إزالة script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // إزالة style tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // تنظيف المسافات الزائدة
    .trim();
}

/**
 * ينظف نص للاستخدام في HTML (escape HTML entities)
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

/**
 * ينظف نص للاستخدام في attributes
 */
export function sanitizeAttribute(text: string): string {
  return escapeHtml(text).replace(/['"]/g, '');
}

// ============================================
// 📧 تنظيف الإيميل
// ============================================

/**
 * يتحقق من صحة الإيميل
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * ينظف الإيميل
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  
  return email.trim().toLowerCase();
}

// ============================================
// 📱 تنظيف أرقام الهواتف
// ============================================

/**
 * يتحقق من صحة رقم الهاتف
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  
  // يسمح بأرقام مع + في البداية ومسافات
  const phoneRegex = /^\+?[0-9\s\-()]{8,20}$/;
  return phoneRegex.test(phone);
}

/**
 * ينظف رقم الهاتف (يزيل المسافات والأحرف غير الضرورية)
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  
  // يزيل المسافات والأحرف غير الضرورية
  return phone.replace(/[^\d+]/g, '');
}

// ============================================
// 🔗 تنظيف URLs
// ============================================

/**
 * يتحقق من صحة URL
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsed = new URL(url);
    // يسمح فقط بـ http و https
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * ينظف URL
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  const trimmed = url.trim();
  
  // إذا لم يكن يبدأ بـ http أو https، أضف https
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  
  return trimmed;
}

// ============================================
// 🔢 تنظيف الأرقام
// ============================================

/**
 * يتحقق من أن القيمة رقم
 */
export function isValidNumber(value: string | number): boolean {
  if (typeof value === 'number') return !isNaN(value) && isFinite(value);
  if (typeof value !== 'string') return false;
  
  const num = parseFloat(value);
  return !isNaN(num) && isFinite(num);
}

/**
 * ينظف رقم (يزيل الأحرف غير الرقمية)
 */
export function sanitizeNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  
  const cleaned = value.replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? 0 : num;
}

// ============================================
// 📝 تنظيف النماذج
// ============================================

/**
 * ينظف بيانات نموذج كاملة
 */
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data } as T;
  
  for (const key in sanitized) {
    const value = sanitized[key];
    
    if (typeof value === 'string') {
      // تنظيف النصوص
      sanitized[key] = sanitizeText(value) as T[Extract<keyof T, string>];
    } else if (typeof value === 'number') {
      // التحقق من الأرقام
      if (!isValidNumber(value)) {
        sanitized[key] = 0 as T[Extract<keyof T, string>];
      }
    }
  }
  
  return sanitized;
}

// ============================================
// 🔍 تنظيف البحث
// ============================================

/**
 * ينظف استعلام البحث
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') return '';
  
  return sanitizeText(query)
    // إزالة الأحرف الخاصة الخطيرة
    .replace(/[<>{}[\]\\]/g, '')
    // تنظيف المسافات الزائدة
    .replace(/\s+/g, ' ')
    .trim()
    // تحديد الطول الأقصى
    .slice(0, 200);
}

