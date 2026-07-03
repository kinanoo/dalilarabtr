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

export const AUTO_EVENT_CONFIG: Record<string, EventConfig> = {
    new_article:  { type: 'مقال',      label: 'مقالات',       icon: FileText,     color: 'emerald', textColor: 'text-emerald-600', badgeText: 'text-emerald-700 dark:text-emerald-300', bgLight: 'bg-emerald-50',  bgDark: 'dark:bg-emerald-950/30', href: (id) => `/article/${id}` },
    new_scenario: { type: 'سيناريو',   label: 'سيناريوهات',   icon: AlertCircle,  color: 'blue',    textColor: 'text-blue-600',    badgeText: 'text-blue-700 dark:text-blue-300',       bgLight: 'bg-blue-50',     bgDark: 'dark:bg-blue-950/30',    href: (id) => `/consultant?scenario=${id}` },
    new_faq:      { type: 'سؤال',      label: 'أسئلة',        icon: HelpCircle,   color: 'violet',  textColor: 'text-violet-600',  badgeText: 'text-violet-700 dark:text-violet-300',   bgLight: 'bg-violet-50',   bgDark: 'dark:bg-violet-950/30',  href: () => `/faq` },
    new_code:     { type: 'كود أمني',  label: 'أكواد أمنية',  icon: Shield,       color: 'red',     textColor: 'text-red-600',     badgeText: 'text-red-700 dark:text-red-300',         bgLight: 'bg-red-50',      bgDark: 'dark:bg-red-950/30',     href: (id) => `/codes/${id}` },
    new_zone:     { type: 'منطقة',     label: 'مناطق',        icon: MapPin,       color: 'orange',  textColor: 'text-orange-600',  badgeText: 'text-orange-700 dark:text-orange-300',   bgLight: 'bg-orange-50',   bgDark: 'dark:bg-orange-950/30',  href: () => `/zones` },
    new_update:   { type: 'خبر',       label: 'أخبار',        icon: Newspaper,    color: 'amber',   textColor: 'text-amber-600',   badgeText: 'text-amber-700 dark:text-amber-300',     bgLight: 'bg-amber-50',    bgDark: 'dark:bg-amber-950/30',   href: (id) => `/updates/${id}` },
    new_service:  { type: 'خدمة',      label: 'خدمات',        icon: Briefcase,    color: 'cyan',    textColor: 'text-cyan-600',    badgeText: 'text-cyan-700 dark:text-cyan-300',       bgLight: 'bg-cyan-50',     bgDark: 'dark:bg-cyan-950/30',    href: (id) => `/services/${id}` },
    new_tool:     { type: 'أداة',      label: 'أدوات',        icon: Wrench,       color: 'pink',    textColor: 'text-pink-600',    badgeText: 'text-pink-700 dark:text-pink-300',       bgLight: 'bg-pink-50',     bgDark: 'dark:bg-pink-950/30',    href: () => `/tools` },
    new_source:   { type: 'مصدر رسمي', label: 'مصادر رسمية',  icon: ExternalLink, color: 'teal',    textColor: 'text-teal-600',    badgeText: 'text-teal-700 dark:text-teal-300',       bgLight: 'bg-teal-50',     bgDark: 'dark:bg-teal-950/30',    href: () => `/sources` },
};

/** Get icon config for an event type (subset without href/label) */
export function getEventIcon(eventType: string) {
    const config = AUTO_EVENT_CONFIG[eventType];
    if (!config) return null;
    return { icon: config.icon, color: config.color, textColor: config.textColor, bgLight: config.bgLight, bgDark: config.bgDark };
}
