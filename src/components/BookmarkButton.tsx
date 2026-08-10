'use client';

import { useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { useBookmarks } from '@/hooks/useBookmarks';

interface BookmarkButtonProps {
    id: string;
    mini?: boolean;
    variant?: 'default' | 'glass' | 'subtle';
    className?: string;
}

export default function BookmarkButton({ id, mini = false, variant = 'default', className = '' }: BookmarkButtonProps) {
    const { toggleBookmark, isBookmarked, isLoaded } = useBookmarks();
    const [animating, setAnimating] = useState(false);
    const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const active = isLoaded && isBookmarked(id);

    useEffect(() => () => {
        if (animationTimer.current) clearTimeout(animationTimer.current);
    }, []);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        toggleBookmark(id);
        setAnimating(true);
        if (animationTimer.current) clearTimeout(animationTimer.current);
        animationTimer.current = setTimeout(() => setAnimating(false), 300);
    };

    if (!isLoaded) return null;

    const commonProps = {
        type: 'button' as const,
        onClick: handleClick,
        'aria-pressed': active,
        'aria-label': active ? 'إزالة من المحفوظات' : 'حفظ على هذا الجهاز',
        title: active ? 'إزالة من المحفوظات' : 'حفظ على هذا الجهاز',
    };

    if (variant === 'glass') {
        return (
            <button
                {...commonProps}
                className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur-md transition-all hover:bg-white/20 ${active ? 'text-amber-400' : 'text-white'} ${className} ${animating ? 'scale-125' : 'scale-100'}`}
            >
                <Star size={14} fill={active ? 'currentColor' : 'none'} className={`transition-transform ${animating ? 'rotate-12' : ''}`} />
                <span>{active ? 'تم الحفظ' : 'حفظ'}</span>
            </button>
        );
    }

    if (variant === 'subtle') {
        return (
            <button
                {...commonProps}
                className={`inline-flex items-center gap-1.5 rounded-full border border-slate-900/5 bg-slate-900/5 px-3 py-1.5 text-xs font-bold backdrop-blur-md transition-all hover:bg-slate-900/10 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/20 ${active ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-200'} ${className} ${animating ? 'scale-125' : 'scale-100'}`}
            >
                <Star size={14} fill={active ? 'currentColor' : 'none'} className={`transition-transform ${animating ? 'rotate-12' : ''}`} />
                <span>{active ? 'تم الحفظ' : 'حفظ'}</span>
            </button>
        );
    }

    const baseClasses = mini
        ? 'inline-flex rounded-full border p-2 shadow-sm transition'
        : 'inline-flex items-center justify-start gap-2 font-medium transition-colors';
    const activeClasses = active
        ? (mini ? 'border-amber-200 bg-amber-100 text-amber-500' : 'text-amber-500')
        : (mini ? 'border-transparent bg-white/50 text-slate-400 hover:bg-white hover:text-amber-500' : 'text-slate-500 hover:text-amber-500 dark:text-slate-400');

    return (
        <button
            {...commonProps}
            className={`${baseClasses} ${activeClasses} ${className} ${animating ? 'scale-125' : 'scale-100'}`}
        >
            <Star size={20} fill={active ? 'currentColor' : 'none'} className={`transition-transform ${animating ? 'rotate-12' : ''}`} />
            {!mini && <span>{active ? 'تم الحفظ' : 'حفظ'}</span>}
        </button>
    );
}
