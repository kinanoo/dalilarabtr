'use client';

/**
 * ArticleHeroImage — the featured image at the top of every article page.
 *
 * Why this exists: the prior implementation forced every hero image
 * into a 16:9 (aspect-video) container with object-cover. That works
 * for landscape screenshots and product photos but mangles the use
 * case the user actually has: tall portrait documents (official
 * letters, screenshots of government PDFs, decree pages) where the
 * meaningful content is in the top and bottom thirds. With 16:9 cover
 * cropping, both ends got chopped off and the reader saw a middle
 * slice of a document with the title text invisible.
 *
 * What this component does:
 *
 *   1. Renders the image at its natural aspect ratio (capped to a
 *      sensible max height so a 4:1 super-tall image doesn't take
 *      over the page).
 *
 *   2. Uses object-contain so NOTHING gets cropped — the entire image
 *      is always visible. The card background fills any letterboxing
 *      space with a soft slate color, not jarring white bands.
 *
 *   3. On click (or Enter/Space when focused), opens a full-screen
 *      lightbox showing the image at full resolution. Reader can
 *      examine fine print on the document.
 *
 *   4. Lightbox closes on:
 *        - ESC key
 *        - Click outside the image
 *        - Click of the X button top-right
 *
 *   5. Keyboard accessible: the image is a focusable button
 *      (role="button", tabIndex 0), and the lightbox close button is
 *      auto-focused on open so ESC and Tab work naturally.
 *
 *   6. Body scroll is locked while the lightbox is open so background
 *      content doesn't drift behind.
 *
 *   7. SSR-safe: the lightbox portal lazy-mounts only when open. The
 *      inline thumbnail is rendered in the initial HTML for LCP.
 */

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, Download } from 'lucide-react';

interface Props {
    src: string;
    alt: string;
    /** When true, set <Image priority />. Used for the article hero
        (above-the-fold), false for body inline images. */
    priority?: boolean;
}

export default function ArticleHeroImage({ src, alt, priority = true }: Props) {
    const [open, setOpen] = useState(false);
    const [errored, setErrored] = useState(false);
    const closeBtnRef = useRef<HTMLButtonElement>(null);

    // ESC to close + lock body scroll while open
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        // Focus the close button so ESC has an obvious affordance
        const t = setTimeout(() => closeBtnRef.current?.focus(), 50);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
            clearTimeout(t);
        };
    }, [open]);

    const handleOpen = useCallback(() => setOpen(true), []);
    const handleKeyOpen = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(true);
        }
    }, []);

    if (errored) return null;

    return (
        <>
            {/* ── Inline thumbnail ──────────────────────────────────────
                Natural aspect ratio (the image fills width, height
                derives from its intrinsic ratio via Image's auto-sizing
                with width/height props). max-h caps the absolute giants.
                The wrapper is the click target so the entire frame is
                tappable, not just the pixels of the image itself. */}
            <div
                data-image-wrapper
                role="button"
                tabIndex={0}
                aria-label={`عرض الصورة بحجم كامل: ${alt}`}
                onClick={handleOpen}
                onKeyDown={handleKeyOpen}
                className="group relative w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-800 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
                {/* Image — width/height let Next.js compute aspect ratio
                    automatically. object-contain ensures NO cropping; if
                    the image is taller than wide, the container grows
                    vertically up to max-h, otherwise it stays compact. */}
                <Image
                    src={src}
                    alt={alt}
                    width={1200}
                    height={800}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
                    priority={priority}
                    className="w-full h-auto max-h-[80vh] object-contain"
                    onError={() => setErrored(true)}
                />

                {/* Hover affordance — small badge in the top-left that
                    says "click to zoom" on desktop hover */}
                <div className="hidden md:flex absolute top-3 left-3 items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <ZoomIn size={14} />
                    <span>اضغط للتكبير</span>
                </div>

                {/* Persistent zoom badge on touch devices — desktop users
                    discover via hover, mobile users see a permanent hint
                    in the bottom-left so they know the image is tappable.
                    Hidden on md+ to keep desktop clean. */}
                <div className="md:hidden flex absolute bottom-3 left-3 items-center gap-1 bg-black/55 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-1 rounded-md pointer-events-none">
                    <ZoomIn size={12} />
                    <span>تكبير</span>
                </div>
            </div>

            {/* ── Lightbox ───────────────────────────────────────────────
                Portal-mounted to <body> so it sits above EVERY layout
                stacking context — navbars, sticky bars, sidebars, etc.
                Only mounted while open to save tree weight. */}
            {open && typeof document !== 'undefined' && createPortal(
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="عرض الصورة بحجم كامل"
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={(e) => {
                        // Close only when clicking the backdrop, not the
                        // image itself. The image stops propagation below.
                        if (e.target === e.currentTarget) setOpen(false);
                    }}
                >
                    {/* Close button — top-left in RTL (visually "top-end"
                        of the reading direction). Auto-focused on open. */}
                    <button
                        ref={closeBtnRef}
                        type="button"
                        onClick={() => setOpen(false)}
                        aria-label="إغلاق الصورة"
                        className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                        <X size={22} />
                    </button>

                    {/* Download button — opposite corner from close.
                        Critical UX for official-document screenshots:
                        readers want to save the official Turkish letter
                        as proof, share via WhatsApp later, etc. Uses
                        the native <a download> so the browser handles
                        the save dialog and the user picks the location. */}
                    <a
                        href={src}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="تنزيل الصورة"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold px-3 py-2 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">تنزيل</span>
                    </a>

                    {/* Hint text — bottom center, fades the message that
                        clicking outside closes. Helps first-time users. */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs sm:text-sm font-medium pointer-events-none">
                        اضغط خارج الصورة أو زر Esc للإغلاق
                    </div>

                    {/* The blown-up image — uses <img> not next/image
                        because we want the browser's natural max-w/max-h
                        sizing with no quality reductions, and we already
                        downloaded this image once for the thumbnail so
                        re-using the src reuses the HTTP cache. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={src}
                        alt={alt}
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl cursor-zoom-out select-none"
                        draggable={false}
                    />
                </div>,
                document.body,
            )}
        </>
    );
}
