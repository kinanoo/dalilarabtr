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
import { stripHtml } from '@/lib/stripHtml';

export type HubTheme = 'emerald' | 'blue' | 'rose' | 'amber' | 'violet' | 'cyan' | 'indigo';

/**
 * ONE system, not one costume per hub. The five hubs used to differ only by
 * hue (blue / rose / amber / violet / emerald), which read as five sites
 * rather than five sections of one. Colour now carries meaning instead of
 * decoration: ink for structure, the brand accent for what responds to a
 * click. The map is kept keyed by HubTheme so callers stay unchanged and a
 * theme that one day means something real can diverge deliberately.
 */
const HUB_CARD = {
    accent: 'bg-slate-900 dark:bg-slate-300',
    surface: 'from-white to-slate-50/70 dark:from-slate-900 dark:to-slate-950',
    borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-600',
    shadowHover: 'hover:shadow-slate-900/10',
    eyebrowBg: 'bg-slate-100 dark:bg-slate-800',
    eyebrowText: 'text-slate-700 dark:text-slate-300',
    titleHover: 'group-hover:text-emerald-700 dark:group-hover:text-emerald-400',
    readMore: 'text-emerald-700 dark:text-emerald-400',
} as const;

const THEME: Record<HubTheme, typeof HUB_CARD> = {
    emerald: HUB_CARD,
    blue: HUB_CARD,
    rose: HUB_CARD,
    amber: HUB_CARD,
    violet: HUB_CARD,
    cyan: HUB_CARD,
    indigo: HUB_CARD,
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
                <p dir="auto" className="text-slate-500 dark:text-slate-300 text-sm mb-6 flex-grow line-clamp-3 leading-relaxed [unicode-bidi:plaintext]">
                    {stripHtml(article.intro)}
                </p>
                <div className={`flex items-center ${t.readMore} font-black text-sm mt-auto`}>
                    اقرأ الدليل الكامل
                    <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
            </div>
        </Link>
    );
}
