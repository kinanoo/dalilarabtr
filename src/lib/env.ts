/**
 * 🔒 التحقق من متغيرات البيئة (Environment Variables Validation)
 * ================================================================
 * 
 * هذا الملف يتحقق من وجود متغيرات البيئة المطلوبة
 * ويعطي قيم افتراضية آمنة إذا لم تكن موجودة
 * 
 * الفائدة:
 * - منع أخطاء runtime عند عدم وجود متغيرات البيئة
 * - توفير قيم افتراضية آمنة
 * - تحسين الأمان
 */

// ============================================
// 🔍 التحقق من متغيرات البيئة
// ============================================

/**
 * يحصل على متغير بيئة مع قيمة افتراضية
 */
function getEnv(key: string, defaultValue: string): string {
  if (typeof window !== 'undefined') {
    // في المتصفح، متغيرات البيئة متاحة فقط في build time
    return defaultValue;
  }
  return process.env[key] || defaultValue;
}

/**
 * يحصل على متغير بيئة مطلوب (يرمي خطأ إذا لم يكن موجوداً)
 */
function getRequiredEnv(key: string): string {
  const value = typeof window !== 'undefined'
    ? undefined
    : process.env[key];

  if (!value) {
    console.warn(`⚠️ متغير البيئة ${key} غير موجود. استخدم قيمة افتراضية.`);
    throw new Error(`متغير البيئة المطلوب ${key} غير موجود`);
  }

  return value;
}

// ============================================
// 📦 تصدير متغيرات البيئة المُتحقق منها
// ============================================

export const ENV = {
  // الموقع
  SITE_URL: getEnv('NEXT_PUBLIC_SITE_URL', 'https://dalilarabtr.com'),

  // واتساب
  WHATSAPP_PHONE: getEnv('NEXT_PUBLIC_WHATSAPP_PHONE', '966580757487'),

  // Supabase (اختياري)
  SUPABASE_URL: getEnv('NEXT_PUBLIC_SUPABASE_URL', ''),
  SUPABASE_ANON_KEY: getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', ''),

  // Google Analytics (اختياري)
  GOOGLE_ANALYTICS_ID: getEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID', ''),

  // Admin Demo Mode
  ADMIN_DEMO: getEnv('NEXT_PUBLIC_ADMIN_DEMO', '0') === '1',

  // Node Environment
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  IS_PRODUCTION: getEnv('NODE_ENV', 'development') === 'production',
  IS_DEVELOPMENT: getEnv('NODE_ENV', 'development') === 'development',
} as const;

// ============================================
// ✅ التحقق من صحة القيم
// ============================================

/**
 * يتحقق من صحة URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * يتحقق من صحة رقم الهاتف (صيغة بسيطة)
 */
function isValidPhone(phone: string): boolean {
  // يتحقق من أن الرقم يحتوي على أرقام فقط (مع + في البداية)
  return /^\+?[0-9]{8,15}$/.test(phone.replace(/\s/g, ''));
}

// التحقق من القيم
if (ENV.SITE_URL && !isValidUrl(ENV.SITE_URL)) {
  console.warn(`⚠️ SITE_URL غير صحيح: ${ENV.SITE_URL}`);
}

if (ENV.WHATSAPP_PHONE && !isValidPhone(ENV.WHATSAPP_PHONE)) {
  console.warn(`⚠️ WHATSAPP_PHONE غير صحيح: ${ENV.WHATSAPP_PHONE}`);
}

// ============================================
// 📝 معلومات للتصحيح
// ============================================



