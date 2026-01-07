/**
 * 🛡️ وحدة الحماية والأمان
 * تُستخدم لتشفير البيانات البصري (Obfuscation) لجعلها غير مقروءة للبوتات
 */

// مفتاح بسيط (سيتم دمجه في العملية)
const SECURITY_KEY = 7;

/**
 * تشفير النص (يُستخدم وقت التطوير/البناء)
 * العلية: UTF-8 -> Base64 -> Char Shift (Safe) -> Base64
 */
export function obfuscate(text: string): string {
    if (!text) return '';

    // المرحلة 1: تحويل لـ Base64
    const b1 = Buffer.from(text).toString('base64');

    // المرحلة 2: زحزحة الحروف (تجنب الرموز الخاصة)
    const shifted = b1.split('').map(c => String.fromCharCode(c.charCodeAt(0) + SECURITY_KEY)).join('');

    // المرحلة 3: تحويل لـ Base64 مرة أخرى لضمان ASCII نظيف
    return Buffer.from(shifted).toString('base64');
}

/**
 * فك تشفير النص (يُستخدم في الواجهة الأمامية)
 */
export function deobfuscate(encoded: string): string {
    if (!encoded) return '';

    try {
        // المرحلة 1: فك الـ Base64 الثاني
        const decoded1 = typeof window !== 'undefined' ? window.atob(encoded) : Buffer.from(encoded, 'base64').toString('binary');

        // المرحلة 2: عكس الزحزحة
        const unshifted = decoded1.split('').map(c => String.fromCharCode(c.charCodeAt(0) - SECURITY_KEY)).join('');

        // المرحلة 3: فك الـ Base64 الأول
        if (typeof window !== 'undefined') {
            return decodeURIComponent(escape(window.atob(unshifted)));
        } else {
            return Buffer.from(unshifted, 'base64').toString('utf8');
        }
    } catch (e) {
        // محاولة فك التشفير القديم (للتحول التدريجي)
        try {
            const oldShift = 42;
            const unshifted = encoded.split('').map(c => String.fromCharCode(c.charCodeAt(0) - oldShift)).join('');
            if (typeof window !== 'undefined') {
                return decodeURIComponent(escape(window.atob(unshifted)));
            } else {
                return Buffer.from(unshifted, 'base64').toString('utf8');
            }
        } catch {
            return encoded;
        }
    }
}

/**
 * التحقق مما إذا كان النص مشفراً
 * (بسيط: يبحث عن عدم وجود مسافات عربية مثلاً)
 */
export function isObfuscated(text: string): boolean {
    if (!text) return false;
    // النصوص المشفرة لا تحتوي عادة على مسافات أو حروف عربية في شكلها الخام
    return !text.trim().includes(' ') && !/[\u0600-\u06FF]/.test(text);
}
