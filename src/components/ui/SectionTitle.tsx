/**
 * SectionTitle — single visual rhythm for "this is a new section" headings.
 *
 * Recipe: eyebrow + accent bar + bold title (optional gradient last word)
 * + optional subtitle. Server-renderable, no client hooks.
 */

import type { ReactNode } from 'react';

interface Props {
    eyebrow?: string;
    title: ReactNode;
    subtitle?: string;
    accent?: string;
    level?: 1 | 2 | 3;
    centered?: boolean;
    className?: string;
}

export default function SectionTitle({
    eyebrow,
    title,
    subtitle,
    accent,
    level = 2,
    centered = false,
    className = '',
}: Props) {
    const Heading: 'h1' | 'h2' | 'h3' = `h${level}` as 'h1' | 'h2' | 'h3';

    const sizeClass =
        level === 1
            ? 'text-3xl sm:text-4xl md:text-5xl'
            : level === 2
              ? 'text-2xl sm:text-3xl md:text-4xl'
              : 'text-xl sm:text-2xl';

    return (
        <div className={`${centered ? 'text-center mx-auto' : ''} max-w-3xl ${className}`} dir="rtl">
            {(eyebrow || !centered) && (
                <div className={`flex items-center gap-2.5 mb-3 ${centered ? 'justify-center' : ''}`}>
                    <span aria-hidden="true" className="h-1 w-10 rounded-full bg-gradient-to-l from-emerald-500 to-emerald-400" />
                    {eyebrow && (
                        <span className="text-[11px] sm:text-xs font-black tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
                            {eyebrow}
                        </span>
                    )}
                </div>
            )}

            <Heading className={`${sizeClass} font-black leading-tight text-slate-900 dark:text-slate-50`}>
                {title}
                {accent && (
                    <>
                        {' '}
                        <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                            {accent}
                        </span>
                    </>
                )}
            </Heading>

            {subtitle && (
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-500 dark:text-slate-400">
                    {subtitle}
                </p>
            )}
        </div>
    );
}
