'use client';

import Image from 'next/image';
import { Download, X, ZoomIn } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface ZoomableImageProps {
    src: string;
    alt: string;
    sizes: string;
    priority?: boolean;
    containerClassName?: string;
    imageClassName?: string;
    hint?: 'label' | 'icon' | 'none';
}

export default function ZoomableImage({
    src,
    alt,
    sizes,
    priority = false,
    containerClassName = '',
    imageClassName = 'object-cover',
    hint = 'icon',
}: ZoomableImageProps) {
    const [open, setOpen] = useState(false);
    const [errored, setErrored] = useState(false);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const imageSrc = src.startsWith('https://dalilarabtr.com/')
        ? src.slice('https://dalilarabtr.com'.length)
        : src.startsWith('https://www.dalilarabtr.com/')
            ? src.slice('https://www.dalilarabtr.com'.length)
            : src;

    useEffect(() => {
        if (!open) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeyDown);
        const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 50);

        return () => {
            window.clearTimeout(focusTimer);
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    if (errored) return null;

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={`عرض الصورة كاملة: ${alt}`}
                className={`group/image relative block overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${containerClassName}`}
            >
                <Image
                    src={imageSrc}
                    alt={alt}
                    fill
                    sizes={sizes}
                    priority={priority}
                    className={`${imageClassName} transition-transform duration-300 group-hover/image:scale-[1.02]`}
                    onError={() => setErrored(true)}
                />
                {hint !== 'none' && (
                    <span
                        aria-hidden="true"
                        className={`absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-lg bg-slate-950/75 text-white shadow-sm backdrop-blur-sm ${
                            hint === 'label' ? 'px-2.5 py-1.5 text-[11px] font-bold' : 'p-1.5'
                        }`}
                    >
                        <ZoomIn size={hint === 'label' ? 14 : 13} />
                        {hint === 'label' && <span>عرض الصورة كاملة</span>}
                    </span>
                )}
            </button>

            {open && typeof document !== 'undefined' && createPortal(
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="عرض الصورة بحجم كامل"
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-3 backdrop-blur-md sm:p-8"
                    onClick={(event) => {
                        if (event.target === event.currentTarget) setOpen(false);
                    }}
                >
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={() => setOpen(false)}
                        aria-label="إغلاق الصورة"
                        className="absolute left-4 top-4 z-10 rounded-full bg-white/15 p-2.5 text-white transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-6 sm:top-6"
                    >
                        <X size={22} />
                    </button>
                    <a
                        href={imageSrc}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="تنزيل الصورة الأصلية"
                        onClick={(event) => event.stopPropagation()}
                        className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-6 sm:top-6 sm:text-sm"
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">تنزيل</span>
                    </a>
                    {/* Keep the original image available for pinch zoom and fine text. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imageSrc}
                        alt={alt}
                        draggable={false}
                        onClick={(event) => event.stopPropagation()}
                        className="max-h-full max-w-full select-none object-contain shadow-2xl"
                    />
                    <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium text-white/70 sm:bottom-5 sm:text-sm">
                        اضغط خارج الصورة للإغلاق
                    </p>
                </div>,
                document.body,
            )}
        </>
    );
}
