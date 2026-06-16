import Link from 'next/link';
import { FileText, Briefcase, BookOpen, ExternalLink } from 'lucide-react';
import EmptyState from '../EmptyState';

interface SearchResult {
    id: string;
    title: string;
    description?: string;
    category?: string;
    url: string;
}

interface SearchResultsProps {
    results: SearchResult[];
    query: string;
    isLoading?: boolean;
    onResultClick?: (result: SearchResult) => void;
}

// Highlight matched text
function highlightText(text: string, query: string) {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
        <>
            {parts.map((part, index) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <mark
                        key={index}
                        className="bg-amber-100 dark:bg-amber-500/25 text-amber-900 dark:text-amber-200 px-1 py-0.5 rounded-md font-black border-b-2 border-amber-400 dark:border-amber-500/60"
                    >
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </>
    );
}

// Per-category visual treatment.
// Stripe = the top accent stripe on the card (matches the family
// pattern used across the site: UpdateCard, ToolCard, CategoryTile,
// service cards, zones cards, article hero, consultant tiles).
// Icon tints + badge colours are kept in the same record so the
// header chip / icon / stripe read as a single design unit.
function getCategoryTheme(category?: string) {
    switch (category?.toLowerCase()) {
        case 'article':
        case 'مقال':
            return {
                Icon: FileText,
                iconClass: 'text-blue-500',
                iconBg: 'bg-blue-50 dark:bg-blue-900/30',
                stripe: 'bg-gradient-to-l from-blue-400 via-blue-500 to-indigo-500',
                pill: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border-blue-200/60 dark:border-blue-800/40',
                hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-600',
                shadow: 'hover:shadow-blue-500/10',
                hoverText: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
            };
        case 'service':
        case 'خدمة':
            return {
                Icon: Briefcase,
                iconClass: 'text-emerald-500',
                iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
                stripe: 'bg-gradient-to-l from-emerald-400 via-teal-400 to-emerald-500',
                pill: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200/60 dark:border-emerald-800/40',
                hoverBorder: 'hover:border-emerald-400 dark:hover:border-emerald-600',
                shadow: 'hover:shadow-emerald-500/10',
                hoverText: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
            };
        default:
            return {
                Icon: BookOpen,
                iconClass: 'text-slate-500',
                iconBg: 'bg-slate-50 dark:bg-slate-800',
                stripe: 'bg-slate-200/70 dark:bg-slate-800/40',
                pill: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
                hoverBorder: 'hover:border-emerald-400 dark:hover:border-emerald-600',
                shadow: 'hover:shadow-emerald-500/10',
                hoverText: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
            };
    }
}

export default function SearchResults({
    results,
    query,
    isLoading = false,
    onResultClick,
}: SearchResultsProps) {
    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!query.trim()) {
        return null;
    }

    if (results.length === 0) {
        return (
            <EmptyState
                type="search"
                message={`لم نتمكن من العثور على نتائج لـ "${query}"`}
            />
        );
    }

    return (
        <div className="space-y-3">
            {/* Results count — pill chip instead of inline text. Eye
                lands on "X نتيجة" instantly without parsing prose. */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-full">
                    <span className="font-black text-emerald-700 dark:text-emerald-300 tabular-nums text-sm">
                        {results.length.toLocaleString('en-US')}
                    </span>
                    <span className="text-xs text-emerald-700/80 dark:text-emerald-300/80 font-bold">
                        نتيجة لـ
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                        &quot;{query}&quot;
                    </span>
                </div>
            </div>

            {/* Results list — each card themed by category */}
            {results.map((result, index) => {
                const theme = getCategoryTheme(result.category);
                const { Icon } = theme;
                return (
                    <Link
                        key={result.id}
                        href={result.url}
                        onClick={() => onResultClick?.(result)}
                        className={`group relative block p-4 bg-gradient-to-br from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-700 ${theme.hoverBorder} rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${theme.shadow} stagger-item overflow-hidden`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        {/* Top accent stripe — themed per category. Same
                            family pattern as UpdateCard, ToolCard,
                            CategoryTile, service cards, zones cards,
                            article hero, consultant tiles. Lets the
                            reader scan the result list and read each
                            row's TYPE at a glance from stripe colour
                            before reading the title. */}
                        <div
                            aria-hidden="true"
                            className={`absolute top-0 inset-x-0 h-1 ${theme.stripe}`}
                        />

                        <div className="relative flex items-start gap-3">
                            {/* Icon container — coloured box matching the
                                stripe instead of bare icon */}
                            <div className={`shrink-0 w-10 h-10 rounded-xl ${theme.iconBg} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                                <Icon size={18} className={theme.iconClass} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                {/* Category pill — bordered chip matching
                                    the family pattern */}
                                {result.category && (
                                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase tracking-wide border rounded-full mb-2 ${theme.pill}`}>
                                        {result.category}
                                    </span>
                                )}

                                {/* Title */}
                                <h3 className={`text-base sm:text-lg font-black text-slate-900 dark:text-slate-50 mb-1 ${theme.hoverText} transition-colors leading-snug`}>
                                    {highlightText(result.title, query)}
                                </h3>

                                {/* Description */}
                                {result.description && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                        {highlightText(result.description, query)}
                                    </p>
                                )}
                            </div>

                            {/* External-link affordance — fades in + slides
                                a couple of px on hover so the action
                                reads as "going somewhere" */}
                            <ExternalLink size={16} className="shrink-0 mt-1 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all duration-300" />
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
