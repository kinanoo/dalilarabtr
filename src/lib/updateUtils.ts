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
    bgLight: string;
    bgDark: string;
    href: (id: string) => string;
}

export const AUTO_EVENT_CONFIG: Record<string, EventConfig> = {
    new_article:  { type: 'مقال',      label: 'مقالات',       icon: FileText,     color: 'emerald', bgLight: 'bg-emerald-50',  bgDark: 'dark:bg-emerald-950/30', href: (id) => `/article/${id}` },
    new_scenario: { type: 'سيناريو',   label: 'سيناريوهات',   icon: AlertCircle,  color: 'blue',    bgLight: 'bg-blue-50',     bgDark: 'dark:bg-blue-950/30',    href: (id) => `/consultant?scenario=${id}` },
    new_faq:      { type: 'سؤال',      label: 'أسئلة',        icon: HelpCircle,   color: 'violet',  bgLight: 'bg-violet-50',   bgDark: 'dark:bg-violet-950/30',  href: () => `/faq` },
    new_code:     { type: 'كود أمني',  label: 'أكواد أمنية',  icon: Shield,       color: 'red',     bgLight: 'bg-red-50',      bgDark: 'dark:bg-red-950/30',     href: (id) => `/codes/${id}` },
    new_zone:     { type: 'منطقة',     label: 'مناطق',        icon: MapPin,       color: 'orange',  bgLight: 'bg-orange-50',   bgDark: 'dark:bg-orange-950/30',  href: () => `/zones` },
    new_update:   { type: 'خبر',       label: 'أخبار',        icon: Newspaper,    color: 'amber',   bgLight: 'bg-amber-50',    bgDark: 'dark:bg-amber-950/30',   href: (id) => `/updates/${id}` },
    new_service:  { type: 'خدمة',      label: 'خدمات',        icon: Briefcase,    color: 'cyan',    bgLight: 'bg-cyan-50',     bgDark: 'dark:bg-cyan-950/30',    href: (id) => `/services/${id}` },
    new_tool:     { type: 'أداة',      label: 'أدوات',        icon: Wrench,       color: 'pink',    bgLight: 'bg-pink-50',     bgDark: 'dark:bg-pink-950/30',    href: () => `/tools` },
    new_source:   { type: 'مصدر رسمي', label: 'مصادر رسمية',  icon: ExternalLink, color: 'teal',    bgLight: 'bg-teal-50',     bgDark: 'dark:bg-teal-950/30',    href: () => `/sources` },
};

/** Get icon config for an event type (subset without href/label) */
export function getEventIcon(eventType: string) {
    const config = AUTO_EVENT_CONFIG[eventType];
    if (!config) return null;
    return { icon: config.icon, color: config.color, bgLight: config.bgLight, bgDark: config.bgDark };
}
