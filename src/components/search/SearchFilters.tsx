import { SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';

interface FilterOption {
    label: string;
    value: string;
}

interface SearchFiltersProps {
    categories?: FilterOption[];
    selectedCategory?: string;
    onCategoryChange?: (category: string) => void;
    sortOptions?: FilterOption[];
    selectedSort?: string;
    onSortChange?: (sort: string) => void;
    onClear?: () => void;
}

const DEFAULT_CATEGORIES: FilterOption[] = [
    { label: 'الكل', value: 'all' },
    { label: 'مقالات', value: 'articles' },
    { label: 'خدمات', value: 'services' },
    { label: 'قوانين', value: 'laws' },
    { label: 'أسئلة', value: 'faq' },
];

const DEFAULT_SORT: FilterOption[] = [
    { label: 'الأحدث', value: 'newest' },
    { label: 'الأكثر صلة', value: 'relevant' },
    { label: 'الأكثر مشاهدة', value: 'popular' },
];

export default function SearchFilters({
    categories = DEFAULT_CATEGORIES,
    selectedCategory = 'all',
    onCategoryChange,
    sortOptions = DEFAULT_SORT,
    selectedSort = 'relevant',
    onSortChange,
    onClear,
}: SearchFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);

    const hasActiveFilters = selectedCategory !== 'all' || selectedSort !== 'relevant';

    return (
        <div className="relative">
            {/* Filter Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-emerald-500 dark:hover:border-emerald-500 transition-all btn-hover-lift"
            >
                <SlidersHorizontal size={18} />
                <span className="text-sm font-bold">فلترة</span>
                {hasActiveFilters && (
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                )}
            </button>

            {/* Filters Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
                        onClick={() => setIsOpen(false)}
                    ></div>

                    {/* Panel */}
                    <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 animate-fadeInDown">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">الفلاتر</h3>
                            <div className="flex items-center gap-2">
                                {hasActiveFilters && onClear && (
                                    <button
                                        onClick={() => {
                                            onClear();
                                            setIsOpen(false);
                                        }}
                                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                                    >
                                        مسح الكل
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="p-4 space-y-6">
                            {/* Categories */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    الفئة
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.value}
                                            onClick={() => onCategoryChange?.(cat.value)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === cat.value
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sort */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    الترتيب
                                </label>
                                <div className="space-y-2">
                                    {sortOptions.map((sort) => (
                                        <button
                                            key={sort.value}
                                            onClick={() => onSortChange?.(sort.value)}
                                            className={`w-full text-right px-4 py-2 rounded-lg text-sm transition-all ${selectedSort === sort.value
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold'
                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                }`}
                                        >
                                            {sort.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Apply Button */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg transition-all btn-hover-lift"
                            >
                                تطبيق الفلاتر
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
