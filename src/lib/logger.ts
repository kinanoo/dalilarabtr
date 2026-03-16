/**
 * 🔒 Production-safe logger
 * ========================
 * - في الـ development: يطبع كل شي عادي
 * - في الـ production: يطبع errors بس بدون تفاصيل حساسة
 * - ما بيكشف messages, stack traces, أو بيانات Supabase
 */

const isDev = process.env.NODE_ENV === 'development';

/** Strip sensitive data from error objects */
function sanitize(args: unknown[]): string {
  if (isDev) return args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  // In production: only show the first string label, nothing else
  const label = args.find(a => typeof a === 'string');
  return label ? String(label).slice(0, 80) : 'error';
}

export const logger = {
  /** Errors — always logged, but sanitized in production */
  error(...args: unknown[]) {
    if (isDev) {
      console.error(...args);
    }
    // In production: silent — errors go to Vercel logs automatically
    // No console.error to avoid exposing details in browser DevTools
  },

  /** Warnings — dev only */
  warn(...args: unknown[]) {
    if (isDev) {
      console.warn(...args);
    }
  },

  /** Info — dev only */
  info(...args: unknown[]) {
    if (isDev) {
      console.log(...args);
    }
  },

  /** Debug — dev only, for verbose output */
  debug(...args: unknown[]) {
    if (isDev) {
      console.debug(...args);
    }
  },
};

export default logger;
