'use client';

/**
 * BodyImageGallery — a single, site-wide, world-class image lightbox.
 *
 * Mounted ONCE in the root layout. It listens (event-delegation) for clicks
 * on any content image — every <img> inside a `.prose-content` container
 * (article bodies, service descriptions, static pages, anything rendered
 * through HtmlContent). On click it gathers all sibling images in that same
 * content block and opens a full-screen lightbox holding the whole set.
 *
 * Navigation: on-screen arrows · touch swipe · ← → keys · thumbnail strip.
 * Plus a live LTR counter (never reversed on the RTL page), the caption
 * (from <figcaption> or alt), a download button, Esc / backdrop to close,
 * body-scroll lock, and portal mounting above every stacking context.
 *
 * Images that are links (<a><img>) or tiny icons (<80px) are left alone.
 * The article hero image keeps its own dedicated zoom (it lives outside
 * .prose-content), so there is no double-handling.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
    src: string;
    alt: string;
    caption: string;
}

function captionFor(img: HTMLImageElement): string {
    const cap = img.closest('figure')?.querySelector('figcaption');
    return cap?.textContent?.trim() || img.getAttribute('alt')?.trim() || '';
}

function isGalleryImage(img: HTMLImageElement): boolean {
    if (img.closest('a') || img.closest('button')) return false;
    const w = img.naturalWidth || img.width || 0;
    return w === 0 || w >= 80;
}

export default function BodyImageGallery() {
    const [slides, setSlides] = useState<Slide[]>([]);
    const [index, setIndex] = useState<number | null>(null);
    const closeBtnRef = useRef<HTMLButtonElement>(null);
    const touchStart = useRef<{ x: number; y: number } | null>(null);

    // Site-wide delegated opener.
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            const t = e.target as HTMLElement | null;
            if (!t || t.tagName !== 'IMG') return;
            const img = t as HTMLImageElement;
            const scope = img.closest('.prose-content');
            if (!scope || !isGalleryImage(img)) return;

            const imgs = (Array.from(scope.querySelectorAll('img')) as HTMLImageElement[])
                .filter(isGalleryImage);
            if (!imgs.length) return;

            e.preventDefault();
            const i = imgs.indexOf(img);
            setSlides(imgs.map((im) => ({
                src: im.currentSrc || im.src,
                alt: im.getAttribute('alt') || '',
                caption: captionFor(im),
            })));
            setIndex(i < 0 ? 0 : i);
        };
        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, []);

    const open = index !== null;
    const close = useCallback(() => setIndex(null), []);
    const go = useCallback(
        (dir: 1 | -1) =>
            setIndex((i) => (i === null ? i : (i + dir + slides.length) % slides.length)),
        [slides.length],
    );

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowLeft') go(1);   // RTL: left advances
            else if (e.key === 'ArrowRight') go(-1);  // RTL: right goes back
        };
        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const tm = setTimeout(() => closeBtnRef.current?.focus(), 50);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
            clearTimeout(tm);
        };
    }, [open, close, go]);

    if (!open || index === null || typeof document === 'undefined') return null;
    const cur = slides[index];
    if (!cur) return null;
    const many = slides.length > 1;

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label="معرض صور المقال"
            className="fixed inset-0 z-[9999] flex flex-col bg-black/92 backdrop-blur-md animate-in fade-in duration-200"
            onClick={(e) => { if (e.target === e.currentTarget) close(); }}
            onTouchStart={(e) => {
                touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }}
            onTouchEnd={(e) => {
                const s = touchStart.current;
                if (!s) return;
                const dx = e.changedTouches[0].clientX - s.x;
                const dy = e.changedTouches[0].clientY - s.y;
                if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
                touchStart.current = null;
            }}
        >
            {/* Top bar: close · counter · download */}
            <div className="flex items-center justify-between gap-3 p-4 sm:p-6 shrink-0">
                <button
                    ref={closeBtnRef}
                    type="button"
                    onClick={close}
                    aria-label="إغلاق المعرض"
                    className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                    <X size={22} />
                </button>

                {many && (
                    <span dir="ltr" className="text-white/90 text-sm font-bold bg-white/10 px-3 py-1.5 rounded-full tabular-nums">
                        {index + 1} / {slides.length}
                    </span>
                )}

                <a
                    href={cur.src}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="تنزيل الصورة"
                    className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold px-3 py-2 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                    <Download size={16} />
                    <span className="hidden sm:inline">تنزيل</span>
                </a>
            </div>

            {/* Image stage with arrows */}
            <div
                className="relative flex-1 flex items-center justify-center px-2 sm:px-20 min-h-0"
                onClick={(e) => { if (e.target === e.currentTarget) close(); }}
            >
                {many && (
                    <>
                        <button
                            type="button"
                            onClick={() => go(-1)}
                            aria-label="الصورة السابقة"
                            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white p-2 sm:p-3 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            <ChevronRight size={28} />
                        </button>
                        <button
                            type="button"
                            onClick={() => go(1)}
                            aria-label="الصورة التالية"
                            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white p-2 sm:p-3 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            <ChevronLeft size={28} />
                        </button>
                    </>
                )}

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    key={cur.src}
                    src={cur.src}
                    alt={cur.alt}
                    draggable={false}
                    onClick={(e) => e.stopPropagation()}
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl select-none animate-in fade-in zoom-in-95 duration-200"
                />
            </div>

            {/* Caption + thumbnails + hint */}
            <div className="shrink-0 p-3 sm:p-5 space-y-3">
                {cur.caption && (
                    <p className="text-center text-white/90 text-sm sm:text-base font-semibold leading-relaxed max-w-2xl mx-auto px-3">
                        {cur.caption}
                    </p>
                )}
                {many && (
                    <div dir="rtl" className="flex gap-2 overflow-x-auto justify-start sm:justify-center pb-1">
                        {slides.map((s, i) => (
                            <button
                                key={s.src + i}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                                aria-label={`الصورة ${i + 1}`}
                                className={`relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border-2 transition ${
                                    i === index
                                        ? 'border-emerald-400 ring-2 ring-emerald-400/40'
                                        : 'border-white/20 opacity-60 hover:opacity-100'
                                }`}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={s.src} alt="" className="w-full h-full object-cover" draggable={false} />
                            </button>
                        ))}
                    </div>
                )}
                <div className="text-center text-white/55 text-xs font-medium">
                    اسحب أو استخدم الأسهم للتنقّل · اضغط خارج الصورة أو Esc للإغلاق
                </div>
            </div>
        </div>,
        document.body,
    );
}
