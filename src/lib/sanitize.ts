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

// ============================================
// 🛡️ تعقيم HTML الكامل (rich-text bodies)
// ============================================

/**
 * sanitizeHtmlContent — full HTML sanitizer for article/page bodies.
 *
 * Replaces the previous isomorphic-dompurify path. We swapped during the
 * Cloudflare runtime note: DOMPurify needs a DOM (window or jsdom),
 * which Cloudflare Workers does not provide. sanitize-html is pure JS over
 * htmlparser2 and runs on Node + Edge + Cloudflare + browser — same security
 * guarantees, no runtime dependency on a DOM.
 *
 * The whitelist mirrors what TipTap actually produces in admin/editor:
 * headings, paragraphs, formatting, lists, links, images, tables, plus the
 * style="text-align: ..." and style="color: ..." emitted by the TextAlign +
 * Color extensions. New TipTap extensions need an entry here or their output
 * will be silently stripped.
 *
 * Defense in depth, not primary trust boundary: article HTML is written by
 * admin (a trusted user). This sanitizer exists to (a) protect if comments
 * or user-submitted content ever flows through this code path, and (b) close
 * the door on a stored XSS via a poisoned WYSIWYG paste (TipTap strips most
 * tags but not all).
 *
 * Returns a fresh string — caller should pass into dangerouslySetInnerHTML.
 */
import sanitizeHtmlLib from 'sanitize-html';

// A permissive-but-safe CSS value matcher. Allows the characters real layout +
// colour values use (digits, units, %, #hex, rgb()/rgba()/linear-gradient(),
// spaces, commas, dots, hyphens) while a negative look-ahead rejects the only
// values that are actually dangerous inside a style attribute: url(...) (data
// exfiltration / legacy `javascript:` backgrounds), expression(...) (old IE
// script), javascript:, @import, behaviour:, and stray angle brackets.
const SAFE_CSS_VALUE = /^(?!.*(?:url\(|expression|javascript:|@import|behaviou?r:|<|>))[#0-9a-z%.,()/\s_+-]+$/i;

// Layout / visual CSS properties that article + page bodies legitimately use:
// designed info-boxes (padding / border / background gradients), tables, and the
// step-by-step image carousel (flex + scroll-snap). Without these whitelisted,
// sanitize-html silently strips them and every styled box renders as bare text —
// a site-wide visual regression. Each maps to SAFE_CSS_VALUE.
const SAFE_LAYOUT_PROPS = [
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'width', 'max-width', 'min-width', 'height', 'max-height', 'min-height', 'box-sizing',
    'display', 'flex', 'flex-direction', 'flex-wrap', 'flex-flow', 'flex-basis', 'flex-grow', 'flex-shrink',
    'gap', 'row-gap', 'column-gap', 'align-items', 'align-self', 'justify-content', 'justify-items', 'order',
    'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
    'border-width', 'border-style', 'border-color',
    'border-radius', 'border-top-left-radius', 'border-top-right-radius',
    'border-bottom-left-radius', 'border-bottom-right-radius',
    'background', 'background-image', 'background-position', 'background-size', 'background-repeat',
    'overflow', 'overflow-x', 'overflow-y', 'scroll-snap-type', 'scroll-snap-align', '-webkit-overflow-scrolling',
    'position', 'top', 'right', 'bottom', 'left', 'inset', 'inset-inline-start', 'inset-inline-end', 'z-index',
    'box-shadow', 'opacity', 'line-height', 'font-size', 'font-style', 'letter-spacing',
    'white-space', 'word-break', 'overflow-wrap', 'text-overflow', 'list-style', 'list-style-type',
    'border-collapse', 'border-spacing', 'vertical-align', 'table-layout', 'caption-side',
];
const SAFE_LAYOUT_STYLES: Record<string, RegExp[]> = Object.fromEntries(
    SAFE_LAYOUT_PROPS.map((p) => [p, [SAFE_CSS_VALUE]]),
);

const HTML_SANITIZE_OPTIONS: sanitizeHtmlLib.IOptions = {
    allowedTags: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'div', 'span', 'br', 'hr',
        'ul', 'ol', 'li',
        'strong', 'b', 'em', 'i', 'u', 's', 'strike',
        'blockquote', 'q', 'cite',
        'code', 'pre', 'kbd', 'samp',
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
        'a', 'img',
        'sub', 'sup',
        'article', 'section', 'aside',
        'figure', 'figcaption',
        // <details>/<summary> are used in 13 article bodies as collapsible
        // sections (FAQ-style). Confirmed from the 2026-06-20 DB backup.
        'details', 'summary',
    ],
    allowedAttributes: {
        // class is whitelisted on every tag — Tailwind class strings on
        // pasted content + the `prose-content` wrapper rely on this.
        '*': ['class', 'dir', 'lang', 'id', 'style'],
        a: ['href', 'name', 'target', 'rel', 'title'],
        img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
        td: ['colspan', 'rowspan', 'align'],
        th: ['colspan', 'rowspan', 'align', 'scope'],
        blockquote: ['cite'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    // data: only allowed for <img> — data: in <a href> is the XSS-vector case.
    allowedSchemesByTag: {
        img: ['http', 'https', 'data'],
    },
    allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
    // Style attribute is allowed (TextAlign + Color extensions emit it), but
    // only known-safe properties — blocks legacy IE `expression(...)` and
    // `url(javascript:...)` background-image tricks.
    allowedStyles: {
        '*': {
            'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/, /^start$/, /^end$/],
            'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*\d+%?(\s*,\s*\d+%?){2}\s*\)$/, /^[a-z]+$/i],
            'background-color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*\d+%?(\s*,\s*\d+%?){2}\s*\)$/, /^[a-z]+$/i],
            'font-weight': [/^(normal|bold|bolder|lighter|\d{3})$/],
            'text-decoration': [/^(underline|line-through|none|overline)$/],
            // Safe layout + visual properties (designed boxes, tables, the
            // image carousel) — values constrained by SAFE_CSS_VALUE.
            ...SAFE_LAYOUT_STYLES,
        },
    },
    transformTags: {
        a: (tagName, attribs) => {
            // Add rel=noopener if target=_blank is present without rel (safety net;
            // TipTap link extension sets both, but pasted/imported HTML may not).
            if (attribs.target === '_blank' && !attribs.rel) {
                attribs.rel = 'noopener noreferrer';
            }
            return { tagName, attribs };
        },
    },
    parser: { decodeEntities: true },
};

export function sanitizeHtmlContent(html: string): string {
    if (!html) return '';
    return sanitizeHtmlLib(html, HTML_SANITIZE_OPTIONS);
}

/**
 * DOMPurify-compatible shim — same shape as the old `import DOMPurify from
 * 'isomorphic-dompurify'`. Lets call-sites do a one-line import swap:
 *
 *   - import DOMPurify from 'isomorphic-dompurify';
 *   + import DOMPurify from '@/lib/sanitize';
 *
 * `.sanitize(html)` works identically. Keeps the migration diff small.
 */
const DOMPurifyShim = {
    sanitize: sanitizeHtmlContent,
};
export default DOMPurifyShim;

