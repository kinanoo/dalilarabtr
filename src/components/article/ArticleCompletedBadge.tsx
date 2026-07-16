'use client';

/**
 * ArticleCompletedBadge — the "مكتمل" chip in the article hero badge row.
 *
 * Historical behavior preserved from the client-era ArticleViewPremium: the
 * old document checklist stored checked indices under `progress-<slug>` in
 * localStorage, and the badge showed once every document was checked. The
 * checklist UI itself is gone, but returning readers who completed one still
 * had the badge — so it lives on as a client island that reads only
 * localStorage (never article content).
 */

import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

export default function ArticleCompletedBadge({ slug, documentsCount }: { slug: string; documentsCount: number }) {
    const [complete, setComplete] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(`progress-${slug}`);
            if (!saved) return;
            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) return;
            const progress = documentsCount ? Math.round((parsed.length / documentsCount) * 100) : 0;
            setComplete(progress === 100);
        } catch {
            // ignore
        }
    }, [slug, documentsCount]);

    if (!complete) return null;

    return (
        <span className="bg-green-500 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 animate-in fade-in zoom-in uppercase tracking-wide shadow-md shadow-green-900/40">
            <CheckCircle size={12} /> مكتمل
        </span>
    );
}
