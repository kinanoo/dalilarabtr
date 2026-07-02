'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Images } from 'lucide-react';

/**
 * ArticleHeroGallery — when an article has several images (an illustrated
 * step-by-step guide), show them ALL at the top as a swipeable carousel
 * instead of a single hero, so a visitor sees the whole set immediately
 * (the old single hero made people think there was only one picture).
 *
 * The carousel lives inside a `.prose-content` wrapper, so the site-wide
 * BodyImageGallery lightbox automatically handles a click on any slide and
 * opens the full set with arrows / thumbnails — no separate lightbox needed.
 */
// Arabic counted-noun agreement: 2 = dual, 3-10 = plural, 11+ = singular.
function countLabel(n: number): string {
    if (n === 2) return 'صورتان';
    if (n >= 3 && n <= 10) return `${n} صور`;
    return `${n} صورة`;
}

export default function ArticleHeroGallery({ images }: { images: { src: string; caption: string }[] }) {
    const scroller = useRef<HTMLDivElement>(null);
    const [idx, setIdx] = useState(0);

    const goTo = (i: number) => {
        const next = Math.max(0, Math.min(images.length - 1, i));
        setIdx(next);
        (scroller.current?.children[next] as HTMLElement | undefined)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    };

    const onScroll = () => {
        const el = scroller.current;
        if (!el) return;
        const center = el.scrollLeft + el.clientWidth / 2;
        let best = 0, bestD = Infinity;
        Array.from(el.children).forEach((c, i) => {
            const h = c as HTMLElement;
            const cc = h.offsetLeft + h.clientWidth / 2;
            const d = Math.abs(cc - center);
            if (d < bestD) { bestD = d; best = i; }
        });
        setIdx(best);
    };

    return (
        <div className="relative group">
            <div
                ref={scroller}
                onScroll={onScroll}
                className="prose-content flex overflow-x-auto snap-x snap-mandatory rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {images.map((im, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        key={im.src + i}
                        src={im.src}
                        alt={im.caption || `صورة ${i + 1}`}
                        className="snap-center shrink-0 w-full h-auto max-h-[72vh] object-contain cursor-zoom-in !m-0"
                    />
                ))}
            </div>

            {/* Count badge */}
            <span dir="ltr" className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-black/60 text-white text-xs font-black px-2.5 py-1 rounded-full tabular-nums backdrop-blur-sm pointer-events-none">
                <Images size={13} /> {idx + 1} / {images.length}
            </span>

            {/* Arrows — RTL: right goes back, left advances */}
            <button type="button" onClick={() => goTo(idx - 1)} disabled={idx === 0} aria-label="الصورة السابقة" className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 p-2 rounded-full shadow-md hover:bg-white dark:hover:bg-slate-800 disabled:opacity-0 transition-all">
                <ChevronRight size={22} />
            </button>
            <button type="button" onClick={() => goTo(idx + 1)} disabled={idx === images.length - 1} aria-label="الصورة التالية" className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 p-2 rounded-full shadow-md hover:bg-white dark:hover:bg-slate-800 disabled:opacity-0 transition-all">
                <ChevronLeft size={22} />
            </button>

            {/* Dots */}
            <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
                {images.map((_, i) => (
                    <button key={i} type="button" onClick={() => goTo(i)} aria-label={`الصورة ${i + 1}`} className={`h-2 rounded-full transition-all ${i === idx ? 'w-6 bg-emerald-600' : 'w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'}`} />
                ))}
            </div>

            {/* Current slide's caption (the admin-authored step text) */}
            {images[idx]?.caption && (
                <p className="mt-2 px-3 text-center text-sm font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
                    {images[idx].caption}
                </p>
            )}

            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                {countLabel(images.length)} — اسحب، أو اضغط الصورة لعرضها بالحجم الكامل
            </p>
        </div>
    );
}
