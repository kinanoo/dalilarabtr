'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Search, X } from 'lucide-react';

/**
 * Search in the navbar — on every page, not just the homepage.
 *
 * The site had exactly one search box, on the homepage hero. But most visitors
 * arrive from Google straight onto an article, and from there the only way to
 * look for anything else was to go back to Google. The header slot for this had
 * literally been left as `{/* Search Removed *\/}`.
 *
 * Cost control: GlobalSearch pulls the search index and its suggestion UI, so
 * mounting it in the layout would put that weight on every page load for the
 * majority who never search. Instead the button is the only thing that ships
 * eagerly; the panel — and its bundle — load on first open.
 */

const GlobalSearch = dynamic(() => import('@/components/GlobalSearch'), {
    ssr: false,
    loading: () => (
        <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
    ),
});

export default function NavbarSearch() {
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Esc closes, and the panel traps nothing — the visitor can always leave.
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    // Clicking outside the panel closes it.
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
        };
        // Defer so the opening click itself does not immediately close it.
        const t = setTimeout(() => document.addEventListener('mousedown', onDown), 0);
        return () => { clearTimeout(t); document.removeEventListener('mousedown', onDown); };
    }, [open]);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? 'إغلاق البحث' : 'ابحث في الموقع'}
                aria-expanded={open}
                className="p-2.5 min-w-11 min-h-11 flex items-center justify-center text-white hover:bg-white/15 rounded-lg transition-colors"
            >
                {open ? <X size={20} /> : <Search size={20} />}
            </button>

            {open && (
                <div
                    ref={panelRef}
                    className="absolute inset-x-0 top-full z-50 border-b border-black/10 bg-white dark:bg-slate-900 shadow-xl"
                >
                    <div className="mx-auto max-w-3xl px-4 py-4">
                        <GlobalSearch autoFocus />
                    </div>
                </div>
            )}
        </>
    );
}
