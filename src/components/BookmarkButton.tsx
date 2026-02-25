'use client';

import { useState, useEffect } from 'react';
import { Star, LogIn, X, Bookmark } from 'lucide-react';
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
    const [showLoginModal, setShowLoginModal] = useState(false);

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
            setShowLoginModal(true);
            return;
        }

        const newState = toggleBookmark(id);
        setActive(newState);

        setAnimating(true);
        setTimeout(() => setAnimating(false), 300);
    };

    if (!isLoaded) return null;

    // Login prompt modal overlay
    const loginModal = showLoginModal && (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => { e.stopPropagation(); setShowLoginModal(false); }}
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full text-center animate-in zoom-in-95 slide-in-from-bottom-2 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={() => setShowLoginModal(false)}
                    className="absolute top-3 left-3 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-400"
                >
                    <X size={16} />
                </button>

                <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bookmark size={28} className="text-amber-500" />
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    حفظ المحتوى
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
                    قم بتسجيل الدخول للسماح لك بحفظ المقالات والروابط للعودة لها لاحقاً من خلال صفحة المحفوظات
                </p>

                <div className="flex flex-col gap-2">
                    <Link
                        href="/login"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-emerald-600/20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <LogIn size={18} />
                        تسجيل الدخول
                    </Link>
                    <button
                        onClick={() => setShowLoginModal(false)}
                        className="w-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold py-2 px-4 rounded-xl transition-colors text-sm"
                    >
                        ليس الآن
                    </button>
                </div>
            </div>
        </div>
    );

    // Glass Variant
    if (variant === 'glass') {
        return (
            <>
                <div className="relative inline-flex">
                    <button
                        type="button"
                        onClick={handleClick}
                        className={`bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-md border border-white/10 ${active ? 'text-amber-400' : 'text-white'} ${className} ${animating ? 'scale-125' : 'scale-100'}`}
                        title={active ? "إزالة من المفضلة" : "حفظ في المفضلة"}
                    >
                        <Star size={14} fill={active ? "currentColor" : "none"} className={`transition-all ${animating ? 'rotate-12' : ''}`} />
                        <span>{active ? "تم الحفظ" : "حفظ"}</span>
                    </button>
                </div>
                {loginModal}
            </>
        );
    }

    // Subtle Variant
    if (variant === 'subtle') {
        return (
            <>
                <div className="relative inline-flex">
                    <button
                        type="button"
                        onClick={handleClick}
                        className={`bg-slate-900/5 hover:bg-slate-900/10 dark:bg-white/10 dark:hover:bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-md border border-slate-900/5 dark:border-white/10 ${active ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-200'} ${className} ${animating ? 'scale-125' : 'scale-100'}`}
                        title={active ? "إزالة من المفضلة" : "حفظ في المفضلة"}
                    >
                        <Star size={14} fill={active ? "currentColor" : "none"} className={`transition-all ${animating ? 'rotate-12' : ''}`} />
                        <span>{active ? "تم الحفظ" : "حفظ"}</span>
                    </button>
                </div>
                {loginModal}
            </>
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
        <>
            <div className="relative inline-flex">
                <button
                    type="button"
                    onClick={handleClick}
                    className={`${baseClasses} ${activeClasses} ${className} ${animating ? 'scale-125' : 'scale-100'}`}
                    title={active ? "إزالة من المفضلة" : "حفظ في المفضلة"}
                >
                    <Star size={mini ? 20 : 20} fill={active ? "currentColor" : "none"} className={`transition-all ${animating ? 'rotate-12' : ''}`} />
                    {!mini && <span>{active ? "تم الحفظ" : "حفظ"}</span>}
                </button>
            </div>
            {loginModal}
        </>
    );
}
