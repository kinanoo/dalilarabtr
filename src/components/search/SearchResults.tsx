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
                    <mark key={index} className="bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 px-1 rounded">
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </>
    );
}

// Get icon based on category
function getCategoryIcon(category?: string) {
    switch (category?.toLowerCase()) {
        case 'article':
        case 'مقال':
            return <FileText size={20} className="text-blue-500" />;
        case 'service':
        case 'خدمة':
            return <Briefcase size={20} className="text-emerald-500" />;
        default:
            return <BookOpen size={20} className="text-slate-500" />;
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
            {/* Results Count */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{results.length}</span>
                    {' نتيجة لـ "'}
                    <span className="font-bold">{query}</span>
                    {'"'}
                </p>
            </div>

            {/* Results List */}
            {results.map((result, index) => (
                <Link
                    key={result.id}
                    href={result.url}
                    onClick={() => onResultClick?.(result)}
                    className="block p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl transition-all card-hover stagger-item"
                    style={{ animationDelay: `${index * 0.05}s` }}
                >
                    <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                            {getCategoryIcon(result.category)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            {/* Category Badge */}
                            {result.category && (
                                <span className="inline-block px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-2">
                                    {result.category}
                                </span>
                            )}

                            {/* Title */}
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {highlightText(result.title, query)}
                            </h3>

                            {/* Description */}
                            {result.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                    {highlightText(result.description, query)}
                                </p>
                            )}
                        </div>

                        {/* External Link Icon */}
                        <ExternalLink size={16} className="flex-shrink-0 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </Link>
            ))}
        </div>
    );
}
