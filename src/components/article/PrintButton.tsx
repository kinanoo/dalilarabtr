'use client';

/**
 * PrintButton — the "طباعة" pill in the article hero action row.
 * Client island for the single window.print() call; the surrounding article
 * view is a server component and must stay free of event handlers.
 */

import { Printer } from 'lucide-react';

export default function PrintButton() {
    return (
        <button
            type="button"
            onClick={() => { try { window.print(); } catch { } }}
            className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-md border border-white/10"
        >
            <Printer size={14} /> <span className="hidden sm:inline">طباعة</span>
        </button>
    );
}
