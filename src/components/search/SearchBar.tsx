import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit?: (value: string) => void;
    placeholder?: string;
    showHistory?: boolean;
    searchHistory?: string[];
    onHistoryClick?: (query: string) => void;
    onClearHistory?: () => void;
    isLoading?: boolean;
}

export default function SearchBar({
    value,
    onChange,
    onSubmit,
    placeholder = 'ابحث عن خدمات، مقالات، معلومات...',
    showHistory = false,
    searchHistory = [],
    onHistoryClick,
    onClearHistory,
    isLoading = false,
}: SearchBarProps) {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim() && onSubmit) {
            onSubmit(value.trim());
            inputRef.current?.blur();
        }
    };

    const handleClear = () => {
        onChange('');
        inputRef.current?.focus();
    };

    return (
        <div className="relative w-full">
            {/* Search Bar */}
            <form onSubmit={handleSubmit} className="relative">
                <div className="relative flex items-center">
                    {/* Search Icon */}
                    <div className="absolute right-4 text-slate-400">
                        {isLoading ? (
                            <div className="animate-rotate">
                                <Search size={20} />
                            </div>
                        ) : (
                            <Search size={20} />
                        )}
                    </div>

                    {/* Input */}
                    <input
                        ref={inputRef}
                        type="text"
                        aria-label="بحث"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        placeholder={placeholder}
                        className="w-full pr-12 pl-12 py-4 text-lg border-2 border-slate-200 dark:border-slate-700 rounded-xl 
                     bg-white dark:bg-slate-900 
                     text-slate-900 dark:text-slate-100
                     placeholder:text-slate-400 dark:placeholder:text-slate-500
                     focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                     transition-all animate-fadeIn"
                    />

                    {/* Clear Button */}
                    {value && (
                        <button
                            type="button"
                            aria-label="مسح البحث"
                            onClick={handleClear}
                            className="absolute left-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors animate-scaleIn"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </form>

            {/* Search History Dropdown */}
            {showHistory && isFocused && !value && searchHistory.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fadeInDown">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Clock size={16} />
                            <span className="text-sm font-bold">عمليات البحث الأخيرة</span>
                        </div>
                        {onClearHistory && (
                            <button
                                onClick={onClearHistory}
                                className="text-xs text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            >
                                مسح الكل
                            </button>
                        )}
                    </div>

                    {/* History Items */}
                    <div className="max-h-64 overflow-y-auto">
                        {searchHistory.map((query, index) => (
                            <button
                                key={index}
                                onClick={() => onHistoryClick?.(query)}
                                className="w-full px-4 py-3 text-right hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 group"
                            >
                                <Clock size={16} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                <span className="text-slate-700 dark:text-slate-300">{query}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Popular Searches (Optional) */}
            {showHistory && isFocused && !value && searchHistory.length === 0 && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fadeInDown">
                    <div className="p-4">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-3">
                            <TrendingUp size={16} />
                            <span className="text-sm font-bold">عمليات بحث شائعة</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['الإقامة', 'محامي', 'الجنسية', 'العمل', 'الدراسة'].map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => onHistoryClick?.(tag)}
                                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-slate-700 dark:text-slate-300 rounded-full text-sm transition-colors"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
