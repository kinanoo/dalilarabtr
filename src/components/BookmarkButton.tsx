'use client';

import { useState, useEffect } from 'react';
import { Star, LogIn } from 'lucide-react';
import { useBookmarks } from '@/hooks/useBookmarks';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

interface BookmarkButtonProps {
    id: string;
    mini?: boolean;
    variant?: 'default' | 'glass' | 'subtle';
    className?: string;
}

export default function BookmarkButton({ id, mini = false, variant = 'default', className = '' }: BookmarkButtonProps) {
    const { toggleBookmark, isBookmarked, isLoaded } = useBookmarks();
    const [active, setActive] = useState(false);
    const [animating, setAnimating] = useState(false);
    const [isGuest, setIsGuest] = useState(true);
    const [showLoginHint, setShowLoginHint] = useState(false);

    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        supabase.auth.getUser().then(({ data }) => {
            setIsGuest(!data.user);
        });
    }, []);

    useEffect(() => {
        if (isLoaded) {
            setActive(isBookmarked(id));
        }
    }, [id, isBookmarked, isLoaded]);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isGuest) {
            setShowLoginHint(true);
            setTimeout(() => setShowLoginHint(false), 3000);
            return;
        }

        const newState = toggleBookmark(id);
        setActive(newState);

        setAnimating(true);
        setTimeout(() => setAnimating(false), 300);
    };

    if (!isLoaded) return null;

    // Login hint tooltip
    const loginHint = showLoginHint && (
        <Link
            href="/login"
            onClick={(e) => e.stopPropagation()}
            className="absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold px-3 py-2 rounded-lg shadow-xl flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200"
        >
            <LogIn size={12} />
            سجّل دخول للحفظ
        </Link>
    );

    // Glass Variant
    if (variant === 'glass') {
        return (
            <div className="relative inline-flex">
                <button
                    type="button"
                    onClick={handleClick}
                    className={`bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-md border border-white/10 ${active ? 'text-amber-400' : 'text-white'} ${className} ${animating ? 'scale-125' : 'scale-100'}`}
                    title={isGuest ? "سجّل دخول للحفظ" : active ? "إزالة من المفضلة" : "حفظ في المفضلة"}
                >
                    <Star size={14} fill={active ? "currentColor" : "none"} className={`transition-all ${animating ? 'rotate-12' : ''}`} />
                    <span>{active ? "تم الحفظ" : "حفظ"}</span>
                </button>
                {loginHint}
            </div>
        );
    }

    // Subtle Variant
    if (variant === 'subtle') {
        return (
            <div className="relative inline-flex">
                <button
                    type="button"
                    onClick={handleClick}
                    className={`bg-slate-900/5 hover:bg-slate-900/10 dark:bg-white/10 dark:hover:bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-md border border-slate-900/5 dark:border-white/10 ${active ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-200'} ${className} ${animating ? 'scale-125' : 'scale-100'}`}
                    title={isGuest ? "سجّل دخول للحفظ" : active ? "إزالة من المفضلة" : "حفظ في المفضلة"}
                >
                    <Star size={14} fill={active ? "currentColor" : "none"} className={`transition-all ${animating ? 'rotate-12' : ''}`} />
                    <span>{active ? "تم الحفظ" : "حفظ"}</span>
                </button>
                {loginHint}
            </div>
        );
    }

    // Default Variant
    const baseClasses = mini
        ? "p-2 rounded-full transition shadow-sm border"
        : "flex items-center justify-start gap-2 font-medium transition-colors";

    const activeClasses = active
        ? (mini ? "bg-amber-100 text-amber-500 border-amber-200" : "text-amber-500")
        : (mini ? "bg-white/50 hover:bg-white text-slate-400 hover:text-amber-500 border-transparent" : "text-slate-500 dark:text-slate-400 hover:text-amber-500");

    return (
        <div className="relative inline-flex">
            <button
                type="button"
                onClick={handleClick}
                className={`${baseClasses} ${activeClasses} ${className} ${animating ? 'scale-125' : 'scale-100'}`}
                title={isGuest ? "سجّل دخول للحفظ" : active ? "إزالة من المفضلة" : "حفظ في المفضلة"}
            >
                <Star size={mini ? 20 : 20} fill={active ? "currentColor" : "none"} className={`transition-all ${animating ? 'rotate-12' : ''}`} />
                {!mini && <span>{active ? "تم الحفظ" : "حفظ"}</span>}
            </button>
            {loginHint}
        </div>
    );
}
