import {
    FileText, AlertCircle, HelpCircle, Shield,
    MapPin, Newspaper, Briefcase, Wrench, ExternalLink,
} from 'lucide-react';

// ============================================
// 📅 Date Utilities
// ============================================

/** Convert a date string to Arabic relative format (اليوم، أمس، قبل يومين...) */
export function getRelativeDate(dateStr: string, sortDate?: string): string {
    const raw = sortDate || dateStr;
    if (!raw) return dateStr;
    const date = new Date(raw);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays === 2) return 'قبل يومين';
    if (diffDays <= 7) return `قبل ${diffDays} أيام`;
    return dateStr;
}

/** Format date for display with full Arabic month names */
export function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays === 2) return 'قبل يومين';
    if (diffDays <= 7) return `قبل ${diffDays} أيام`;
    return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Check if content was published within the last 7 days */
export function isNewContent(dateStr: string): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)) <= 7;
}

// ============================================
// 🎨 Event Type Config (icons, colors, labels, links)
// ============================================

export const PUBLIC_EVENT_TYPES = [
    'new_article', 'new_scenario', 'new_faq', 'new_code',
    'new_zone', 'new_update', 'new_service', 'new_tool', 'new_source',
] as const;

export type EventType = (typeof PUBLIC_EVENT_TYPES)[number];

export interface EventConfig {
    type: string;
    label: string;
    icon: typeof FileText;
    color: string;
    /** Full literal class — Tailwind cannot generate interpolated `text-${color}-600` */
    textColor: string;
    /** Full literal badge text classes (light + dark) */
    badgeText: string;
    bgLight: string;
    bgDark: string;
    href: (id: string) => string;
}

/**
 * ONE ink, not nine hues. Each content type used to carry its own colour
 * (emerald/blue/violet/red/orange/amber/cyan/pink/teal), so a single news list
 * could show seven unrelated hues at once and the reader learned nothing from
 * any of them — colour that means everything means nothing.
 *
 * The type is now told by its ICON and its Arabic label; colour is reserved
 * site-wide for meaning (red = danger, amber = caution, brand = interactive).
 * These stay per-type fields rather than one shared constant so a future type
 * that genuinely IS a warning can opt into a semantic hue without a refactor.
 */
const INK = {
    textColor: 'text-slate-700 dark:text-slate-200',
    badgeText: 'text-slate-700 dark:text-slate-300',
    bgLight: 'bg-slate-100',
    bgDark: 'dark:bg-slate-800',
    color: 'slate',
} as const;

export const AUTO_EVENT_CONFIG: Record<string, EventConfig> = {
    new_article:  { type: 'مقال',      label: 'مقالات',       icon: FileText,     ...INK, href: (id) => `/article/${id}` },
    new_scenario: { type: 'سيناريو',   label: 'سيناريوهات',   icon: AlertCircle,  ...INK, href: (id) => `/consultant?scenario=${id}` },
    new_faq:      { type: 'سؤال',      label: 'أسئلة',        icon: HelpCircle,   ...INK, href: () => `/faq` },
    new_code:     { type: 'كود أمني',  label: 'أكواد أمنية',  icon: Shield,       ...INK, href: (id) => `/codes/${id}` },
    new_zone:     { type: 'منطقة',     label: 'مناطق',        icon: MapPin,       ...INK, href: () => `/zones` },
    new_update:   { type: 'خبر',       label: 'أخبار',        icon: Newspaper,    ...INK, href: (id) => `/updates/${id}` },
    new_service:  { type: 'خدمة',      label: 'خدمات',        icon: Briefcase,    ...INK, href: (id) => `/services/${id}` },
    new_tool:     { type: 'أداة',      label: 'أدوات',        icon: Wrench,       ...INK, href: () => `/tools` },
    new_source:   { type: 'مصدر رسمي', label: 'مصادر رسمية',  icon: ExternalLink, ...INK, href: () => `/sources` },
};

/** Get icon config for an event type (subset without href/label) */
export function getEventIcon(eventType: string) {
    const config = AUTO_EVENT_CONFIG[eventType];
    if (!config) return null;
    return { icon: config.icon, color: config.color, textColor: config.textColor, bgLight: config.bgLight, bgDark: config.bgDark };
}
