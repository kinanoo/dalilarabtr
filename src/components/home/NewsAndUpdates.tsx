'use client';

/**
 * NewsAndUpdates — the unified "أخبار وإعلانات" hub as a 3D coverflow
 * carousel (randevu.goc.gov.tr style), themed to the site's emerald/cream
 * identity:
 *   - The centred card is crisp + raised; cards behind it recede in depth
 *     AND get a cream "scrim" overlay that strengthens with distance, so the
 *     text behind never bleeds through — only the front card reads.
 *   - Continuous drag (mouse + finger): the whole rail follows your hand
 *     smoothly and snaps to the nearest card on release. Click a side card
 *     to bring it forward; click the centred card to open it. Arrows + dots
 *     too. Wraps infinitely.
 *
 * Plain React + CSS 3D transforms — no carousel dependency (keeps the
 * Cloudflare/OpenNext build safe).
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles, Flame } from 'lucide-react';

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

// How many cards fan out on each side scales with the stage width (see the
// `visible` computation in the component) so wide screens fill with more
// cards instead of empty side margins.

export default function NewsAndUpdates({ items }: { items: NewsItem[] }) {
  const n = items.length;
  const [active, setActive] = useState(0);
  const [dragFrac, setDragFrac] = useState(0); // live fractional shift while dragging
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ startX: 0, frac: 0, on: false, moved: false, captured: false, pid: -1 });
  const pausedUntil = useRef(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  // Pause autoplay for 20s after any manual move so the rail never yanks out
  // from under the reader's hand.
  const bump = useCallback(() => { pausedUntil.current = Date.now() + 20000; }, []);

  // Card size + how many cards fan out each side scale with the stage so big
  // screens fill with more cards (3 per side on desktop, 4 on very wide)
  // instead of empty margins; mobile keeps 2 with heavier overlap.
  // Fixed coverflow geometry — runtime width measurement (effects / RO / ref)
  // proved unreliable on this ISR-cached page, so we use constants tuned to
  // fill a wide desktop: 4 cards fan each side with a spread that fills ~1500px.
  // On narrower screens the outer cards simply clip under the section's
  // overflow-hidden, leaving the centre + nearest neighbours peeking.
  const cardW = 280;
  const visible = 4;
  const step = 182;

  const go = useCallback((dir: number) => {
    bump();
    setActive((a) => ((a + dir) % n + n) % n);
  }, [n, bump]);

  // Auto-advance newest -> oldest every 5s — a "the site is live" heartbeat.
  // Owner request (2026-07-17): the rail must sit COMPLETELY STILL right
  // after a page load/refresh — the old on-load sway hint is gone, and the
  // FIRST visible motion is the first card advance at ~4.5s. After that,
  // one advance every 5s. Skips while hovered, just after a manual move, or
  // when the visitor prefers reduced motion.
  useEffect(() => {
    if (n <= 1) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
    let id: ReturnType<typeof setInterval> | undefined;
    const advance = () => {
      if (hoverPaused || Date.now() < pausedUntil.current) return;
      setActive((a) => (a + 1) % n);
    };
    const start = setTimeout(() => {
      advance(); // first motion, ~4.5s after load
      id = setInterval(advance, 5000);
    }, 4500);
    return () => { clearTimeout(start); if (id) clearInterval(id); };
  }, [n, hoverPaused]);

  // shortest signed distance, wrapped — works with fractional values too
  const wrap = (x: number) => {
    let o = x;
    while (o > n / 2) o -= n;
    while (o < -n / 2) o += n;
    return o;
  };

  // --- continuous drag ---
  const onDown = (e: React.PointerEvent) => {
    // Do NOT capture the pointer or enter "dragging" on mouse-down — wait for
    // real movement (onMove). A clean click therefore never captures the
    // pointer, so the centred card's <Link> receives the click + navigates.
    drag.current = { startX: e.clientX, frac: 0, on: true, moved: false, captured: false, pid: e.pointerId };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current.on) return;
    const dx = e.clientX - drag.current.startX;
    if (!drag.current.moved && Math.abs(dx) < 6) return; // ignore click jitter
    if (!drag.current.moved) {
      drag.current.moved = true;
      setDragging(true);
      try { (e.currentTarget as Element).setPointerCapture?.(e.pointerId); drag.current.captured = true; } catch { /* noop */ }
    }
    // clamp so one gesture moves at most ~2.2 cards, keeps it controllable
    const f = Math.max(-2.2, Math.min(2.2, dx / step));
    drag.current.frac = f;
    setDragFrac(f);
  };
  const onUp = (e: React.PointerEvent) => {
    if (!drag.current.on) return;
    bump();
    const f = drag.current.frac;
    const moved = drag.current.moved;
    drag.current.on = false;
    drag.current.frac = 0;
    if (drag.current.captured) {
      try { (e.currentTarget as Element).releasePointerCapture?.(drag.current.pid); } catch { /* noop */ }
      drag.current.captured = false;
    }
    setDragging(false);
    setDragFrac(0);
    if (moved && Math.abs(f) >= 0.3) setActive((a) => ((a - Math.round(f)) % n + n) % n);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(-1);
    else if (e.key === 'ArrowLeft') go(1);
  };

  if (!items || n === 0) return null;

  return (
    <section
      className="isolate relative overflow-hidden bg-gradient-to-b from-emerald-50/45 via-surface-light to-teal-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 pt-5 sm:pt-7 pb-12 sm:pb-16"
      dir="rtl"
      aria-labelledby="news-hub-heading"
    >
      {/* Official colour stripe — a hint of government red */}
      <div aria-hidden="true" className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-gov-red via-brand-orange to-brand-blue z-20" />

      <SkylineDecor />

      <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-4 sm:mb-6">
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
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-600 via-teal-500 to-emerald-600 dark:from-emerald-300 dark:to-teal-300">
                وإعلانات
              </span>
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              أحدث القرارات والإعلانات الرسمية التي تخصّ السوريين والعرب في تركيا — مصدر واحد موثوق.
            </p>
          </div>
          <Link
            href="/updates"
            className="hidden sm:flex shrink-0 text-xs font-bold text-white bg-gradient-to-l from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 items-center gap-1.5 px-4 py-2.5 rounded-xl shadow-sm shadow-emerald-500/20 transition-all"
          >
            عرض الكل
            <ArrowLeft size={14} />
          </Link>
        </div>

        {/* 3D coverflow stage */}
        <div
          className="relative h-[290px] sm:h-[310px] select-none cursor-grab active:cursor-grabbing"
          style={{ perspective: '1500px', touchAction: 'pan-y' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onKeyDown={onKey}
          onMouseEnter={() => setHoverPaused(true)}
          onMouseLeave={() => setHoverPaused(false)}
          tabIndex={0}
          role="region"
          aria-label="بطاقات الأخبار والإعلانات — اسحب للتنقّل"
        >
          {/* news-sway (the one-time on-load sway hint) was REMOVED on owner
              request 2026-07-17: any motion right after page load reads as
              "the site is jumping around". The rail now sits perfectly still
              until the first auto-advance (~4.5s — see the effect above). */}
          <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
            {items.map((it, i) => {
              const eo = wrap(i - active + dragFrac); // live effective offset
              const abs = Math.abs(eo);
              const hidden = abs > visible + 0.5;
              const isCenter = abs < 0.5;
              const scale = Math.max(0.72, 1 - abs * 0.14);
              const scrim = Math.min(0.55, abs * 0.26); // hides text behind
              return (
                <div
                  key={it.id}
                  className="absolute top-0 left-1/2"
                  style={{
                    width: cardW,
                    marginLeft: -cardW / 2,
                    transform: `translateX(${eo * step}px) translateZ(${-abs * 150}px) scale(${scale})`,
                    zIndex: 100 - Math.round(abs * 10),
                    opacity: hidden ? 0 : 1,
                    pointerEvents: hidden ? 'none' : 'auto',
                    transition: dragging ? 'none' : 'transform 0.5s cubic-bezier(0.22,0.8,0.3,1), opacity 0.5s',
                  }}
                  onClickCapture={(e) => {
                    // A real drag just happened — swallow the trailing click
                    // so it doesn't navigate.
                    if (drag.current.moved) {
                      e.preventDefault();
                      e.stopPropagation();
                      drag.current.moved = false;
                      return;
                    }
                    // Tapping a side card brings it to centre; the centred
                    // card's click falls through to its <Link> and navigates.
                    if (!isCenter) {
                      e.preventDefault();
                      e.stopPropagation();
                      bump();
                      setActive(i);
                    }
                  }}
                >
                  <div className="relative">
                    <NewsCard item={it} active={isCenter} />
                    {/* Depth scrim — fades the card into the surface as it
                        recedes so its text never competes with the front. */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 rounded-2xl bg-surface-light dark:bg-slate-950 pointer-events-none"
                      style={{ opacity: scrim, transition: dragging ? 'none' : 'opacity 0.5s' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button type="button" onClick={() => go(-1)} aria-label="السابق" className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-400 transition-all">
            <ChevronRight size={20} />
          </button>
          <div className="flex items-center gap-1.5" dir="ltr">
            {items.slice(0, Math.min(n, 9)).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { bump(); setActive(i); }}
                aria-label={`بطاقة ${i + 1}`}
                aria-current={i === active ? 'true' : undefined}
                className={`group relative h-8 w-8 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 ${i === active ? '-mx-1' : '-mx-3'}`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute left-1/2 top-1/2 rounded-full transition-all -translate-x-1/2 -translate-y-1/2 ${i === active ? 'w-6 h-2 bg-emerald-500' : 'w-2 h-2 bg-emerald-200 dark:bg-slate-700 group-hover:bg-emerald-300'}`}
                />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => go(1)} aria-label="التالي" className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-400 transition-all">
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="flex sm:hidden justify-center mt-5">
          <Link href="/updates" className="text-xs font-bold text-white bg-gradient-to-l from-emerald-500 to-teal-500 flex items-center gap-1.5 px-5 py-2.5 rounded-xl shadow-sm">
            عرض كل الأخبار <ArrowLeft size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function NewsCard({ item, active }: { item: NewsItem; active: boolean }) {
  const { featured, urgent } = item;
  const intro = stripHtml(item.intro);

  return (
    <Link
      href={item.href}
      dir="rtl"
      draggable={false}
      tabIndex={active ? 0 : -1}
      className={`flex flex-col h-[260px] sm:h-[280px] rounded-2xl border p-5 pt-8 relative overflow-hidden transition-shadow duration-300 ${
        active
          ? 'bg-white dark:bg-slate-800 shadow-2xl shadow-emerald-600/15 ' +
            (urgent ? 'border-red-300 dark:border-red-800/60 ring-2 ring-red-200/80' : 'border-emerald-300 dark:border-emerald-700/60 ring-2 ring-emerald-200/80')
          : 'bg-white dark:bg-slate-900 shadow-lg border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Date pill */}
      <div className="absolute top-0 left-0">
        <div
          dir="ltr"
          className="bg-gradient-to-bl from-emerald-100 to-teal-100 dark:from-slate-700 dark:to-slate-700 text-emerald-800 dark:text-emerald-300 text-[11px] font-black px-3 py-1.5 rounded-br-2xl tabular-nums shadow-sm"
        >
          {item.dateLabel}
        </div>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-1.5 mb-3">
        {urgent ? (
          <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm shadow-red-500/40 uppercase tracking-wide">
            <Flame size={10} /> عاجل
          </span>
        ) : featured ? (
          <span className="bg-gradient-to-l from-emerald-500 to-teal-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wide">
            <Sparkles size={10} /> خبر رئيسي
          </span>
        ) : (
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide">
            {item.type}
          </span>
        )}
      </div>

      <h3
        className={`font-black text-base sm:text-lg leading-snug line-clamp-2 mb-2 ${
          urgent ? 'text-red-800 dark:text-red-200' : 'text-slate-800 dark:text-slate-100'
        }`}
      >
        {item.title}
      </h3>

      <p className="text-[13px] text-slate-600 dark:text-slate-400 line-clamp-4 leading-relaxed flex-grow">
        {intro || item.title}
      </p>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/70 dark:border-white/5">
        <span className="text-[11px] text-slate-400 dark:text-slate-500">{item.type}</span>
        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          اقرأ المزيد
          <ArrowLeft size={13} />
        </span>
      </div>
    </Link>
  );
}

/* Faint Istanbul skyline, emerald-tinted to match the section. */
function SkylineDecor() {
  return (
    <svg
      aria-hidden="true"
      className="absolute bottom-0 inset-x-0 w-full h-24 text-emerald-600/[0.06] dark:text-emerald-400/[0.05] pointer-events-none"
      viewBox="0 0 1200 120"
      preserveAspectRatio="xMidYMax slice"
      fill="currentColor"
    >
      <rect x="180" y="20" width="6" height="100" />
      <path d="M183 8 l8 16 h-16 z" />
      <rect x="250" y="35" width="6" height="85" />
      <path d="M253 24 l7 13 h-14 z" />
      <rect x="940" y="28" width="6" height="92" />
      <path d="M943 16 l8 14 h-16 z" />
      <rect x="1010" y="42" width="6" height="78" />
      <path d="M1013 31 l7 12 h-14 z" />
      <path d="M560 120 V70 a60 60 0 0 1 120 0 v50 z" />
      <rect x="617" y="40" width="6" height="20" />
      <path d="M620 30 l6 12 h-12 z" />
      <path d="M300 120 V92 a36 36 0 0 1 72 0 v28 z" />
      <path d="M820 120 V96 a30 30 0 0 1 60 0 v24 z" />
      <path d="M120 120 V100 a26 26 0 0 1 52 0 v20 z" />
      <rect x="0" y="116" width="1200" height="4" />
    </svg>
  );
}
