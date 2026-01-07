'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useBookmarks } from '@/hooks/useBookmarks';

interface BookmarkButtonProps {
    id: string;
    mini?: boolean;
    className?: string;
}

export default function BookmarkButton({ id, mini = false, className = '' }: BookmarkButtonProps) {
    const { toggleBookmark, isBookmarked, isLoaded } = useBookmarks();
    const [active, setActive] = useState(false);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        if (isLoaded) {
            setActive(isBookmarked(id));
        }
    }, [id, isBookmarked, isLoaded]);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const newState = toggleBookmark(id);
        setActive(newState);

        // Animation effect
        setAnimating(true);
        setTimeout(() => setAnimating(false), 300);
    };

    if (!isLoaded) return null; // Hydration match

    const baseClasses = mini
        ? "p-2 rounded-full transition shadow-sm border"
        : "flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-xl transition w-full shadow-md";

    const activeClasses = active
        ? (mini ? "bg-amber-100 text-amber-500 border-amber-200" : "bg-amber-500 text-white hover:bg-amber-600")
        : (mini ? "bg-white/50 hover:bg-white text-slate-400 hover:text-amber-500 border-transparent" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-700");

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`${baseClasses} ${activeClasses} ${className} ${animating ? 'scale-125' : 'scale-100'}`}
            title={active ? "إزالة من المفضلة" : "حفظ في المفضلة"}
        >
            <Star size={mini ? 20 : 20} fill={active ? "currentColor" : "none"} className={`transition-all ${animating ? 'rotate-12' : ''}`} />
            {!mini && <span>{active ? "تم الحفظ" : "حفظ"}</span>}
        </button>
    );
}
