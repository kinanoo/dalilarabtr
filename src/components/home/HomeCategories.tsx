import Link from 'next/link';
import {
    FileText, Plane, Briefcase, HeartPulse, GraduationCap,
    UserCheck, ShieldCheck, Sparkles, BrainCircuit, IdCard,
    type LucideIcon
} from 'lucide-react';

const IconMap: Record<string, LucideIcon> = {
    IdCard, FileText, Plane, Briefcase, HeartPulse, GraduationCap,
    UserCheck, ShieldCheck, Sparkles, BrainCircuit
};

// Tile colors — each entry is a triple:
//   icon = bg classes for the rounded icon container
//   stripe = gradient classes for the top accent stripe (consistent
//            with UpdateCard / ToolCard / article-hero pattern)
//   glow = blur orb tint shown on hover (very faint, atmosphere only)
//
// dark-mode variants kept at -700 (audit fix — -600 blew out the
// white icon stroke against slate-950).
const TILE_THEMES: ReadonlyArray<{ icon: string; stripe: string; glow: string }> = [
    { icon: 'bg-cyan-500 dark:bg-cyan-700',    stripe: 'from-cyan-400 to-cyan-600',     glow: 'bg-cyan-400/15' },
    { icon: 'bg-blue-500 dark:bg-blue-700',    stripe: 'from-blue-400 to-blue-600',     glow: 'bg-blue-400/15' },
    { icon: 'bg-purple-500 dark:bg-purple-700', stripe: 'from-purple-400 to-purple-600', glow: 'bg-purple-400/15' },
    { icon: 'bg-amber-500 dark:bg-amber-700',  stripe: 'from-amber-400 to-amber-600',   glow: 'bg-amber-400/15' },
    { icon: 'bg-rose-500 dark:bg-rose-700',    stripe: 'from-rose-400 to-rose-600',     glow: 'bg-rose-400/15' },
    { icon: 'bg-indigo-500 dark:bg-indigo-700', stripe: 'from-indigo-400 to-indigo-600', glow: 'bg-indigo-400/15' },
    { icon: 'bg-teal-500 dark:bg-teal-700',    stripe: 'from-teal-400 to-teal-600',     glow: 'bg-teal-400/15' },
    { icon: 'bg-pink-500 dark:bg-pink-700',    stripe: 'from-pink-400 to-pink-600',     glow: 'bg-pink-400/15' },
];

interface Category {
    id?: string;
    slug: string;
    title: string;
    icon: string;
}

export default function HomeCategories({ categories }: { categories: Category[] }) {
    if (!categories || categories.length === 0) return null;

    return (
        <section className="relative z-20 mt-[50px] px-4" aria-labelledby="home-categories-heading">
            <h2 id="home-categories-heading" className="sr-only">أقسام الدليل الرئيسية</h2>
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                    {categories.map((tile, idx) => {
                        const Icon = IconMap[tile.icon] || FileText;
                        const theme = TILE_THEMES[idx % TILE_THEMES.length];
                        return (
                            <Link
                                key={tile.id || `cat-${idx}`}
                                href={`/category/${tile.slug}`}
                                className="group relative flex flex-col items-center justify-center gap-3 p-4 md:p-5 bg-gradient-to-br from-white to-slate-50/70 dark:from-slate-900 dark:to-slate-950 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-emerald-400 dark:hover:border-emerald-500 hover:-translate-y-1 transition-all duration-300 active:scale-95 overflow-hidden"
                                aria-label={`قسم ${tile.title}`}
                            >
                                {/* Top accent stripe — same pattern family as
                                    UpdateCard, ToolCard, article-hero. Reader
                                    sees coloured strips first; the grid reads
                                    as "categorized" not "rainbow." */}
                                <div
                                    aria-hidden="true"
                                    className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-l ${theme.stripe}`}
                                />

                                {/* Soft corner glow — shows on hover only.
                                    Tints the card faintly with the category's
                                    accent so each hover feels themed. */}
                                <div
                                    aria-hidden="true"
                                    className={`absolute -top-10 -right-10 w-24 h-24 ${theme.glow} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}
                                />

                                <div className={`relative p-3.5 md:p-4 rounded-xl text-white ${theme.icon} shadow-lg shadow-black/15 group-hover:shadow-xl group-hover:scale-110 group-hover:rotate-[-4deg] transition-all duration-300`}>
                                    <Icon size={24} className="md:w-7 md:h-7" />
                                </div>
                                <span className="relative font-black text-sm md:text-base text-center text-slate-800 dark:text-slate-100 leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    {tile.title}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
