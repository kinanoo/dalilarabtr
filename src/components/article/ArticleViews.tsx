'use client';

/**
 * ArticleViews — the eye + view-count chip in the article hero meta row,
 * plus the view-tracking POST (60s localStorage cooldown per article).
 *
 * A tiny client island on purpose: the article view itself is a SERVER
 * component (the whole point of that split is keeping the big article HTML
 * out of the RSC payload), and this is one of the few genuinely dynamic
 * bits. It receives only the slug — never article content.
 *
 * Renders nothing until the count arrives, exactly like the old inline
 * version (views started as null and the span appeared after the fetch).
 */

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { formatViewCount } from '@/lib/articleMeta';

export default function ArticleViews({ slug }: { slug: string }) {
    const [views, setViews] = useState<number | null>(null);

    useEffect(() => {
        const key = `article_viewed_${slug}`;
        const lastViewed = localStorage.getItem(key);
        const now = Date.now();
        const shouldTrack = !lastViewed || (now - Number(lastViewed)) > 60 * 1000; // 60 sec cooldown

        fetch(`/api/articles/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ articleId: slug, track: shouldTrack }),
        })
            .then(r => r.json())
            .then(d => { if (d.views != null) setViews(d.views); })
            .catch(() => { /* view tracking is non-critical — silent fail is intentional */ });

        if (shouldTrack) localStorage.setItem(key, String(now));
    }, [slug]);

    if (views == null || views <= 0) return null;

    return (
        <span className="flex items-center gap-2"><Eye size={14} /> {formatViewCount(views)}</span>
    );
}
