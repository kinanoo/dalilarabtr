import type { ReactNode } from 'react';

// ============================================
// 🎨 PageHero — light, airy, government-portal styling (matches the homepage
//    hero). LIGHT MODE: soft brand-tinted gradient + dark text + the official
//    colour stripe (a hint of government red). DARK MODE: deep emerald gradient.
//
//    PERF (2026-07 LCP fix): this used to animate the title block with
//    framer-motion (initial="hidden" → SSR'd `opacity:0`), so the H1 — the
//    LCP element on every inner page — stayed INVISIBLE until all JS loaded
//    and hydrated (~5-6s render delay on throttled mobile; Lighthouse-proven
//    on /codes). Now a pure-CSS, transform-only entrance
//    (.animate-hero-entrance) paints the title with the first HTML+CSS frame
//    and still gives the gentle slide-in. No hooks → server component → zero
//    client JS for the 27 importing pages.
// ============================================

type PageHeroProps = {
  title: ReactNode;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export default function PageHero({
  title,
  description,
  icon,
  children,
  className,
  titleClassName,
  descriptionClassName,
}: PageHeroProps) {
  return (
    <section
      className={`relative overflow-hidden bg-gradient-to-b from-emerald-50 via-surface-light to-sky-50 dark:from-slate-900 dark:via-emerald-950 dark:to-slate-950 text-slate-900 dark:text-white py-14 px-4 ${className || ''}`.trim()}
    >
      {/* Official colour stripe — a hint of government red */}
      <div aria-hidden="true" className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-gov-red via-brand-orange to-brand-blue z-20" />

      {/* Soft brand blobs (no animation) */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-24 w-72 h-72 bg-emerald-300/25 dark:bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-24 w-72 h-72 bg-sky-300/25 dark:bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="animate-hero-entrance">
          {icon ? (
            <div className="flex items-center justify-center gap-3 mb-3 text-emerald-600 dark:text-emerald-300">
              {icon}
              <h1 className={`text-3xl md:text-4xl font-black text-slate-900 dark:text-white ${titleClassName || ''}`.trim()}>{title}</h1>
            </div>
          ) : (
            <h1 className={`text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-3 ${titleClassName || ''}`.trim()}>{title}</h1>
          )}

          {description ? (
            <p className={`text-base md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto ${descriptionClassName || ''}`.trim()}>
              {description}
            </p>
          ) : null}
        </div>

        {children ? <div className="mt-8 max-w-2xl mx-auto">{children}</div> : null}
      </div>
    </section>
  );
}
