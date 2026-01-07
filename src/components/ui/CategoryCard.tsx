/**
 * 🎨 Glassmorphism Category Card Component
 * Modern card design for directory categories
 */

import Link from 'next/link';
import { ArrowLeft, LucideIcon } from 'lucide-react';

interface CategoryCardProps {
    title: string;
    href: string;
    icon: LucideIcon;
    count?: number;
    description?: string;
}

export default function CategoryCard({ title, href, icon: Icon, count, description }: CategoryCardProps) {
    return (
        <Link href={href} className="group relative block">
            {/* Gradient glow background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-blue-500/10 dark:from-emerald-500/5 dark:via-cyan-500/5 dark:to-blue-500/5 rounded-3xl blur-xl transition-all duration-500 group-hover:blur-2xl group-hover:from-emerald-500/20 group-hover:via-cyan-500/20 group-hover:to-blue-500/20" />

            {/* Card */}
            <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-2xl">

                {/* Icon with gradient */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-500 flex items-center justify-center mb-4 shadow-lg group-hover:shadow-emerald-500/50 transition-all duration-300 group-hover:scale-110">
                    <Icon className="text-white" size={28} />
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {title}
                </h3>

                {/* Count badge */}
                {count !== undefined && count > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
                            {count} {count === 1 ? 'مقال' : 'مقالات'}
                        </span>
                    </div>
                )}

                {/* Description */}
                {description ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                        {description}
                    </p>
                ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        استكشف جميع المقالات
                    </p>
                )}

                {/* Arrow indicator */}
                <div className="flex items-center text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    <span>{description ? 'استكشف الآن' : 'اقرأ المزيد'}</span>
                    <ArrowLeft size={16} className="mr-2 opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all duration-300" />
                </div>
            </div>
        </Link>
    );
}
