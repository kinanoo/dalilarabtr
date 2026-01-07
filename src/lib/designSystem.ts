/**
 * 🎨 نظام التصميم الموحد (Design System)
 * ===================================
 * 
 * مكونات وأنماط موحدة للحفاظ على consistency
 */

// ============================================
// 🎭 Shadows - 3 مستويات فقط
// ============================================

export const SHADOWS = {
    sm: 'shadow-sm',      // للبطاقات الصغيرة، inputs
    DEFAULT: 'shadow',     // للبطاقات العادية
    lg: 'shadow-lg',      // للمودالات، dropdowns، overlays
} as const;

// ============================================
// 📏 Typography Scale - Tailwind Native
// ============================================

export const TEXT_SIZES = {
    xs: 'text-xs',        // 0.75rem (12px)
    sm: 'text-sm',        // 0.875rem (14px)
    base: 'text-base',    // 1rem (16px)
    lg: 'text-lg',        // 1.125rem (18px)
    xl: 'text-xl',        // 1.25rem (20px)
    '2xl': 'text-2xl',    // 1.5rem (24px)
    '3xl': 'text-3xl',    // 1.875rem (30px)
    '4xl': 'text-4xl',    // 2.25rem (36px)
    '5xl': 'text-5xl',    // 3rem (48px)
    '6xl': 'text-6xl',    // 3.75rem (60px)
} as const;

// ============================================
// 🎨 Card Sizes - توحيد أحجام البطاقات
// ============================================

export const CARD_PADDING = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
} as const;

export const CARD_GAP = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
} as const;

// ============================================
// 🔄 Transitions - موحدة
// ============================================

export const TRANSITIONS = {
    fast: 'transition-all duration-200',
    normal: 'transition-all duration-300',
    slow: 'transition-all duration-500',
} as const;

// ============================================
// 📦 Card Component Props
// ============================================

export type CardSize = 'sm' | 'md' | 'lg';
export type ShadowLevel = keyof typeof SHADOWS;
