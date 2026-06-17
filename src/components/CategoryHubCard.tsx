/**
 * CategoryHubCard — shared card used by content-hub pages
 * (/education /health /housing /work /residence). Renders one
 * approved article as a magazine-style card with a colored accent
 * stripe on the right edge in RTL, gradient surface, eyebrow pill,
 * and hover lift. The `theme` prop picks the color family so each
 * hub page can carry its own identity while sharing the layout.
 *
 * The theme map uses literal class strings — Tailwind's JIT scanner
 * can't see interpolated `bg-${color}-50` strings, so listing each
 * literal here is the only way to keep all variants in the final
 * CSS bundle.
 */
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Sparkles, Calendar } from 'lucide-react';

export type HubTheme = 'emerald' | 'blue' | 'rose' | 'amber' | 'violet' | 'cyan' | 'indigo';

const THEME: Record<HubTheme, {
    accent: string;
    surface: string;
    borderHover: string;
    shadowHover: string;
    eyebrowBg: string;
    eyebrowText: string;
    titleHover: string;
    readMore: string;
}> = {
    emerald: {
        accent: 'bg-emerald-500',
        surface: 'from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/20',
        borderHover: 'hover:border-emerald-400',
        shadowHover: 'hover:shadow-emerald-500/10',
        eyebrowBg: 'bg-emerald-100 dark:bg-emerald-900/30',
        eyebrowText: 'text-emerald-700 dark:text-emerald-300',
        titleHover: 'group-hover:text-emerald-600',
        readMore: 'text-emerald-600',
    },
    blue: {
        accent: 'bg-blue-500',
        surface: 'from-white to-blue-50/40 dark:from-slate-900 dark:to-blue-950/20',
        borderHover: 'hover:border-blue-400',
        shadowHover: 'hover:shadow-blue-500/10',
        eyebrowBg: 'bg-blue-100 dark:bg-blue-900/30',
        eyebrowText: 'text-blue-700 dark:text-blue-300',
        titleHover: 'group-hover:text-blue-600',
        readMore: 'text-blue-600',
    },
    rose: {
        accent: 'bg-rose-500',
        surface: 'from-white to-rose-50/40 dark:from-slate-900 dark:to-rose-950/20',
        borderHover: 'hover:border-rose-400',
        shadowHover: 'hover:shadow-rose-500/10',
        eyebrowBg: 'bg-rose-100 dark:bg-rose-900/30',
        eyebrowText: 'text-rose-700 dark:text-rose-300',
        titleHover: 'group-hover:text-rose-600',
        readMore: 'text-rose-600',
    },
    amber: {
        accent: 'bg-amber-500',
        surface: 'from-white to-amber-50/40 dark:from-slate-900 dark:to-amber-950/20',
        borderHover: 'hover:border-amber-400',
        shadowHover: 'hover:shadow-amber-500/10',
        eyebrowBg: 'bg-amber-100 dark:bg-amber-900/30',
        eyebrowText: 'text-amber-700 dark:text-amber-300',
        titleHover: 'group-hover:text-amber-600',
        readMore: 'text-amber-600',
    },
    violet: {
        accent: 'bg-violet-500',
        surface: 'from-white to-violet-50/40 dark:from-slate-900 dark:to-violet-950/20',
        borderHover: 'hover:border-violet-400',
        shadowHover: 'hover:shadow-violet-500/10',
        eyebrowBg: 'bg-violet-100 dark:bg-violet-900/30',
        eyebrowText: 'text-violet-700 dark:text-violet-300',
        titleHover: 'group-hover:text-violet-600',
        readMore: 'text-violet-600',
    },
    cyan: {
        accent: 'bg-cyan-500',
        surface: 'from-white to-cyan-50/40 dark:from-slate-900 dark:to-cyan-950/20',
        borderHover: 'hover:border-cyan-400',
        shadowHover: 'hover:shadow-cyan-500/10',
        eyebrowBg: 'bg-cyan-100 dark:bg-cyan-900/30',
        eyebrowText: 'text-cyan-700 dark:text-cyan-300',
        titleHover: 'group-hover:text-cyan-600',
        readMore: 'text-cyan-600',
    },
    indigo: {
        accent: 'bg-indigo-500',
        surface: 'from-white to-indigo-50/40 dark:from-slate-900 dark:to-indigo-950/20',
        borderHover: 'hover:border-indigo-400',
        shadowHover: 'hover:shadow-indigo-500/10',
        eyebrowBg: 'bg-indigo-100 dark:bg-indigo-900/30',
        eyebrowText: 'text-indigo-700 dark:text-indigo-300',
        titleHover: 'group-hover:text-indigo-600',
        readMore: 'text-indigo-600',
    },
};

function isNewContent(dateStr: string): boolean {
    if (!dateStr) return false;
    const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    return diffDays <= 7;
}

export default function CategoryHubCard({
    article,
    theme,
}: {
    article: {
        id: string;
        slug: string;
        title: string;
        intro?: string | null;
        image?: string | null;
        created_at?: string;
        lastUpdate?: string;
    };
    theme: HubTheme;
}) {
    const t = THEME[theme];
    const isNew = isNewContent(article.created_at || '');

    return (
        <Link
            href={`/article/${article.slug || article.id}`}
            className={`group relative overflow-hidden bg-gradient-to-br ${t.surface} rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl ${t.shadowHover} ${t.borderHover} hover:-translate-y-1 transition-all duration-300 h-full flex flex-col`}
        >
            {/* Accent stripe — right edge in RTL */}
            <span className={`absolute top-0 right-0 h-full w-1 ${t.accent} opacity-70 group-hover:opacity-100 transition-opacity z-10`} />

            {article.image && article.image.startsWith('http') && (
                <div className="h-44 overflow-hidden relative">
                    <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {/* Subtle bottom fade so the title bleeds into the image */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/95 dark:from-slate-900/95 to-transparent pointer-events-none" />
                </div>
            )}
            <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center justify-between gap-2 mb-3">
                    {isNew ? (
                        <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                            <Sparkles size={10} />
                            جديد
                        </span>
                    ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${t.eyebrowBg} ${t.eyebrowText} rounded-full text-[10px] font-black uppercase tracking-wider`}>
                            دليل
                        </span>
                    )}
                    {article.lastUpdate && (
                        <span className="text-xs text-slate-400 flex items-center gap-1 mr-auto tabular-nums" dir="ltr">
                            <Calendar size={12} />
                            {article.lastUpdate}
                        </span>
                    )}
                </div>
                <h3 className={`text-xl font-black text-slate-800 dark:text-slate-100 mb-3 ${t.titleHover} transition-colors leading-snug`}>
                    {article.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-300 text-sm mb-6 flex-grow line-clamp-3 leading-relaxed">
                    {article.intro?.replace(/<[^>]*>/g, '')}
                </p>
                <div className={`flex items-center ${t.readMore} font-black text-sm mt-auto`}>
                    اقرأ الدليل الكامل
                    <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
            </div>
        </Link>
    );
}
