'use client';

/**
 * NewsAndUpdates — the unified "أخبار وإعلانات" hub.
 *
 * Replaces the old stacked pair (FeaturedNewsHero breaking-news carousel +
 * the separate "آخر التحديثات" HomeUpdates carousel) which read as two
 * near-identical news rows. Here the featured/breaking articles and the
 * latest updates live in ONE horizontal, scroll-snap card rail — newsroom
 * style, inspired by a date-stamped announcements layout: each card carries
 * a date pill in its corner, a type badge, the headline, an optional intro
 * snippet, and a "اقرأ المزيد" link. Featured/urgent items are visually
 * elevated (accent ring + badge) so the eye still lands on breaking news
 * first, without a giant separate hero slab.
 *
 * Warm cream surface + a faded Istanbul skyline give it the site's identity.
 * Data is merged + deduped server-side in NewsHub; this component is purely
 * presentational + handles the horizontal scroll affordances.
 */

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Sparkles, Flame } from 'lucide-react';

export type NewsItem = {
  id: string;
  title: string;
  intro?: string;
  type: string;
  dateLabel: string;
  sortDate: string;
  href: string;
  image?: string;
  featured?: boolean;
  urgent?: boolean;
};

function stripHtml(s?: string): string {
  return (s || '').replace(/<[^>]*>/g, '').trim();
}

export default function NewsAndUpdates({ items }: { items: NewsItem[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (!items || items.length === 0) return null;

  // Horizontal scroll by ~one viewport of the rail. In RTL the scroll axis
  // is mirrored, so we just nudge by a signed amount — both arrows move the
  // rail; native swipe/trackpad remains the primary interaction.
  const nudge = (dir: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: 'smooth' });
  };

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-orange-50/50 via-surface-light to-amber-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 py-12 sm:py-16"
      dir="rtl"
      aria-labelledby="news-hub-heading"
    >
      {/* Official colour stripe — a hint of government red */}
      <div aria-hidden="true" className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-gov-red via-brand-orange to-brand-blue z-20" />

      {/* Faded Istanbul skyline — atmosphere, like the reference layout's
          landmark illustration but tuned to the site's audience (Turkey). */}
      <SkylineDecor />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="relative inline-flex items-center justify-center">
                <span className="absolute inline-flex w-2.5 h-2.5 rounded-full bg-red-500 opacity-75 animate-ping" />
                <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-red-500" />
              </span>
              <span className="text-[11px] font-black tracking-[0.2em] uppercase text-red-600">LIVE · مباشر</span>
            </div>
            <h2 id="news-hub-heading" className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-slate-900 dark:text-white tracking-tight">
              أخبار{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-brand-orange via-brand-warm to-brand-orange dark:from-amber-300 dark:to-orange-300">
                وإعلانات
              </span>
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              أحدث القرارات والإعلانات الرسمية التي تخصّ السوريين والعرب في تركيا — مصدر واحد موثوق.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1 bg-white/70 dark:bg-slate-800/70 backdrop-blur rounded-xl p-0.5 border border-orange-200/70 dark:border-slate-700 shadow-sm">
              <button onClick={() => nudge(-1)} aria-label="التالي" className="p-2 rounded-lg text-slate-500 hover:text-brand-orange hover:bg-white dark:hover:bg-slate-700 transition-all">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => nudge(1)} aria-label="السابق" className="p-2 rounded-lg text-slate-500 hover:text-brand-orange hover:bg-white dark:hover:bg-slate-700 transition-all">
                <ChevronRight size={18} />
              </button>
            </div>
            <Link
              href="/updates"
              className="text-xs font-bold text-white bg-gradient-to-l from-brand-orange to-brand-warm hover:opacity-90 flex items-center gap-1.5 px-4 py-2.5 rounded-xl shadow-sm shadow-orange-500/20 transition-all"
            >
              عرض الكل
              <ArrowLeft size={14} />
            </Link>
          </div>
        </div>

        {/* Horizontal scroll-snap rail */}
        <div
          ref={scrollerRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4"
          role="region"
          aria-label="بطاقات الأخبار والإعلانات"
        >
          {items.map((it, i) => (
            <NewsCard key={`${it.id}-${i}`} item={it} />
          ))}
        </div>
      </div>
    </section>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const { featured, urgent } = item;
  const intro = stripHtml(item.intro);

  return (
    <Link
      href={item.href}
      dir="rtl"
      className={`group snap-start shrink-0 w-[270px] sm:w-[300px] flex flex-col rounded-2xl border bg-white dark:bg-slate-900 p-5 pt-8 relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 ${
        urgent
          ? 'border-red-300 dark:border-red-800/60 ring-1 ring-red-200/70 dark:ring-red-900/40 hover:shadow-xl hover:shadow-red-500/15'
          : featured
            ? 'border-orange-300 dark:border-orange-800/50 ring-1 ring-orange-200/70 dark:ring-orange-900/40 hover:shadow-xl hover:shadow-orange-500/15'
            : 'border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-xl hover:shadow-orange-500/10'
      }`}
    >
      {/* Date pill — top corner, like the reference layout */}
      <div className="absolute top-0 left-0">
        <div
          dir="ltr"
          className="bg-gradient-to-bl from-orange-100 to-amber-100 dark:from-slate-800 dark:to-slate-800 text-orange-700 dark:text-amber-300 text-[11px] font-black px-3 py-1.5 rounded-br-2xl tabular-nums shadow-sm"
        >
          {item.dateLabel}
        </div>
      </div>

      {/* Type / status badge */}
      <div className="flex items-center gap-1.5 mb-3">
        {urgent ? (
          <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm shadow-red-500/40 uppercase tracking-wide">
            <Flame size={10} /> عاجل
          </span>
        ) : featured ? (
          <span className="bg-gradient-to-l from-brand-orange to-brand-warm text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wide">
            <Sparkles size={10} /> خبر رئيسي
          </span>
        ) : (
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide">
            {item.type}
          </span>
        )}
      </div>

      <h3
        className={`font-black text-base leading-snug line-clamp-3 mb-2 transition-colors ${
          urgent
            ? 'text-red-800 dark:text-red-200 group-hover:text-red-600'
            : 'text-slate-800 dark:text-slate-100 group-hover:text-brand-orange dark:group-hover:text-amber-300'
        }`}
      >
        {item.title}
      </h3>

      {intro && (
        <p className="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4 flex-grow">
          {intro}
        </p>
      )}

      <div className={`flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-white/5 ${intro ? '' : 'mt-6'}`}>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Clock size={11} /> {item.type}
        </span>
        <span className="text-xs font-black text-brand-orange dark:text-amber-300 flex items-center gap-1 group-hover:gap-2 transition-all">
          اقرأ المزيد
          <ArrowLeft size={13} />
        </span>
      </div>
    </Link>
  );
}

/* Faint Istanbul skyline (domes + minarets) anchored to the bottom — pure
   decoration, very low opacity so it never competes with the cards. */
function SkylineDecor() {
  return (
    <svg
      aria-hidden="true"
      className="absolute bottom-0 inset-x-0 w-full h-24 text-brand-orange/[0.07] dark:text-amber-400/[0.05] pointer-events-none"
      viewBox="0 0 1200 120"
      preserveAspectRatio="xMidYMax slice"
      fill="currentColor"
    >
      {/* minarets */}
      <rect x="180" y="20" width="6" height="100" />
      <path d="M183 8 l8 16 h-16 z" />
      <rect x="250" y="35" width="6" height="85" />
      <path d="M253 24 l7 13 h-14 z" />
      <rect x="940" y="28" width="6" height="92" />
      <path d="M943 16 l8 14 h-16 z" />
      <rect x="1010" y="42" width="6" height="78" />
      <path d="M1013 31 l7 12 h-14 z" />
      {/* big central dome */}
      <path d="M560 120 V70 a60 60 0 0 1 120 0 v50 z" />
      <rect x="617" y="40" width="6" height="20" />
      <path d="M620 30 l6 12 h-12 z" />
      {/* side domes */}
      <path d="M300 120 V92 a36 36 0 0 1 72 0 v28 z" />
      <path d="M820 120 V96 a30 30 0 0 1 60 0 v24 z" />
      <path d="M120 120 V100 a26 26 0 0 1 52 0 v20 z" />
      {/* ground line */}
      <rect x="0" y="116" width="1200" height="4" />
    </svg>
  );
}
