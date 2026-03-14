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

const TILE_COLORS = [
    'bg-cyan-500 dark:bg-cyan-600',
    'bg-blue-500 dark:bg-blue-600',
    'bg-purple-500 dark:bg-purple-600',
    'bg-amber-500 dark:bg-amber-600',
    'bg-rose-500 dark:bg-rose-600',
    'bg-indigo-500 dark:bg-indigo-600',
    'bg-teal-500 dark:bg-teal-600',
    'bg-pink-500 dark:bg-pink-600',
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
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-5">
                    {categories.map((tile, idx) => {
                        const Icon = IconMap[tile.icon] || FileText;
                        const colorClass = TILE_COLORS[idx % TILE_COLORS.length];
                        return (
                            <Link
                                key={tile.id || `cat-${idx}`}
                                href={`/category/${tile.slug}`}
                                className="group flex flex-col items-center justify-center gap-3 p-4 md:p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-emerald-400 dark:hover:border-emerald-500 hover:-translate-y-1 transition-all duration-300 active:scale-95"
                                aria-label={`قسم ${tile.title}`}
                            >
                                <div className={`p-3.5 md:p-4 rounded-xl text-white ${colorClass} shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                                    <Icon size={24} className="md:w-7 md:h-7" />
                                </div>
                                <span className="font-bold text-sm md:text-base text-center text-slate-800 dark:text-slate-100 leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
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
