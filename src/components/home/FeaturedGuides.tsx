'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ListChecks, ArrowLeft } from 'lucide-react';

export interface FeaturedGuide {
    id: string;
    title: string;
    slug: string;
    category: string;
    image: string | null;
    stepCount: number;
}

/**
 * FeaturedGuides — homepage section for the illustrated step-by-step guides
 * (articles carrying a HowTo `steps` array). Renders nothing when empty.
 *
 * v2 (owner-approved preview): compact horizontal rows instead of big vertical
 * cards — 88px thumb on the right, title + category beside it, 2-col grid on
 * desktop (no orphan card), 1-col on mobile. ~65% less vertical space.
 * Motion: staggered fade-up on first scroll into view (IntersectionObserver),
 * hover lift + thumb zoom + sliding arrow + growing underline, and a tactile
 * press-down on tap. All entrance motion is motion-safe: gated so readers with
 * "reduce motion" never get hidden or animated content.
 */
export default function FeaturedGuides({ guides }: { guides: FeaturedGuide[] }) {
    const gridRef = useRef<HTMLDivElement>(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const el = gridRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') {
            setShown(true);
            return;
        }
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    setShown(true);
                    io.disconnect();
                }
            },
            { rootMargin: '0px 0px -10% 0px' }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    if (!guides?.length) return null;

    return (
        <section className="relative bg-gradient-to-b from-emerald-50/45 via-surface-light to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 pt-4 pb-12" dir="rtl">
            <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 leading-tight tracking-tight">
                    شروحات مصوّرة <span className="bg-gradient-to-l from-emerald-500 to-teal-500 bg-clip-text text-transparent">خطوة بخطوة</span>
                </h2>
                <p className="mt-2 mb-6 text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                    لأهمّ المعاملات والإجراءات الرسمية في تركيا.
                </p>

                <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {guides.map((g, i) => (
                        // Outer wrapper owns the staggered reveal so its
                        // transition-delay never slows the card's own hover
                        // and press transitions.
                        <div
                            key={g.id}
                            className={`transition-all duration-500 ease-out ${shown ? 'opacity-100 translate-y-0' : 'motion-safe:opacity-0 motion-safe:translate-y-3'}`}
                            style={{ transitionDelay: `${Math.min(i, 7) * 90}ms` }}
                        >
                            <Link
                                href={`/article/${g.slug}`}
                                className="group relative flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 overflow-hidden shadow-sm transition-all duration-200 hover:-translate-y-[3px] hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-[0_10px_26px_-12px_rgba(16,150,100,0.3)] active:translate-y-0 active:scale-[0.98] after:absolute after:bottom-0 after:right-0 after:h-[2px] after:w-0 after:bg-gradient-to-l after:from-emerald-500 after:to-teal-500 after:transition-[width] after:duration-300 hover:after:w-full"
                            >
                                {/* Thumb — 88px square; image zooms softly on hover */}
                                <span className="relative w-[88px] h-[88px] shrink-0 rounded-xl overflow-hidden">
                                    {g.image ? (
                                        <Image
                                            src={g.image}
                                            alt={g.title}
                                            fill
                                            sizes="88px"
                                            className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.07]"
                                        />
                                    ) : (
                                        <span className="absolute inset-0 grid place-items-center bg-emerald-600/10 dark:bg-emerald-400/[0.13] text-emerald-700 dark:text-teal-300">
                                            <ListChecks size={30} className="transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                                        </span>
                                    )}
                                    <span className="absolute top-1 right-1 z-10 bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                                        {g.stepCount} خطوات
                                    </span>
                                </span>

                                {/* Text */}
                                <span className="flex-1 min-w-0">
                                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 mb-1.5">
                                        {g.category}
                                    </span>
                                    <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-slate-50 leading-relaxed line-clamp-2 transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                                        {g.title}
                                    </h3>
                                    <span className="mt-1.5 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                        اقرأ الشرح
                                        <ArrowLeft size={13} className="transition-transform duration-200 group-hover:-translate-x-1" />
                                    </span>
                                </span>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
