'use client';

/**
 * NewsAndUpdates — the unified "أخبار وإعلانات" hub, rendered as a 3D
 * coverflow carousel (the look of randevu.goc.gov.tr): the active card sits
 * centered + raised on a warm cream surface, neighbours recede into depth on
 * each side. Drag with the mouse or finger to flick through; click a side
 * card to bring it forward; click the centred card to open it. Wraps
 * infinitely so there's always a card peeking on both sides.
 *
 * Built with plain React + CSS 3D transforms (no carousel dependency) so it
 * stays safe on the Cloudflare/OpenNext build. Data is merged + de-duped
 * server-side in NewsHub; this component is presentation + interaction only.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
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

const VISIBLE = 3; // how many cards fan out on each side

export default function NewsAndUpdates({ items }: { items: NewsItem[] }) {
  const n = items.length;
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [stageW, setStageW] = useState(960);
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ startX: 0, moved: 0, on: false });

  // Measure the stage so card width + fan spacing scale to the viewport.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStageW(el.clientWidth));
    ro.observe(el);
    setStageW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const go = useCallback((dir: number) => {
    setActive((a) => ((a + dir) % n + n) % n);
  }, [n]);

  // --- pointer/touch drag (discrete: flick advances one card) ---
  const onDown = (e: React.PointerEvent) => {
    drag.current = { startX: e.clientX, moved: 0, on: true };
    setDragging(true);
    try { (e.target as Element).setPointerCapture?.(e.pointerId); } catch { /* noop */ }
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current.on) return;
    drag.current.moved = e.clientX - drag.current.startX;
  };
  const onUp = () => {
    if (!drag.current.on) return;
    const m = drag.current.moved;
    drag.current.on = false;
    setDragging(false);
    if (Math.abs(m) > 45) go(m > 0 ? -1 : 1); // drag right → previous, left → next
  };

  // keyboard
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(-1);
    else if (e.key === 'ArrowLeft') go(1);
  };

  if (!items || n === 0) return null;

  const cardW = Math.max(220, Math.min(300, Math.round(stageW * 0.66)));
  const step = Math.round(cardW * 0.5);

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-orange-50/60 via-surface-light to-amber-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 py-12 sm:py-16"
      dir="rtl"
      aria-labelledby="news-hub-heading"
    >
      {/* Official colour stripe — a hint of government red */}
      <div aria-hidden="true" className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-gov-red via-brand-orange to-brand-blue z-20" />

      {/* Faded Istanbul skyline */}
      <SkylineDecor />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-6 sm:mb-10">
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
          <Link
            href="/updates"
            className="hidden sm:flex shrink-0 text-xs font-bold text-white bg-gradient-to-l from-brand-orange to-brand-warm hover:opacity-90 items-center gap-1.5 px-4 py-2.5 rounded-xl shadow-sm shadow-orange-500/20 transition-all"
          >
            عرض الكل
            <ArrowLeft size={14} />
          </Link>
        </div>

        {/* 3D coverflow stage */}
        <div
          ref={stageRef}
          className="relative h-[290px] sm:h-[310px] select-none cursor-grab active:cursor-grabbing"
          style={{ perspective: '1400px', touchAction: 'pan-y' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onKeyDown={onKey}
          tabIndex={0}
          role="region"
          aria-label="بطاقات الأخبار والإعلانات — اسحب للتنقّل"
        >
          <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
            {items.map((it, i) => {
              // shortest signed distance from active, so the rail wraps
              let o = i - active;
              if (o > n / 2) o -= n;
              else if (o < -n / 2) o += n;
              const abs = Math.abs(o);
              const hidden = abs > VISIBLE;
              const isActive = o === 0;
              return (
                <div
                  key={it.id}
                  className="absolute top-0 left-1/2"
                  style={{
                    width: cardW,
                    marginLeft: -cardW / 2,
                    transform: `translateX(${o * step}px) translateZ(${-abs * 150}px) scale(${Math.max(0.72, 1 - abs * 0.12)})`,
                    zIndex: 100 - abs,
                    opacity: hidden ? 0 : abs > 2 ? 0.4 : 1,
                    pointerEvents: hidden ? 'none' : 'auto',
                    transition: dragging ? 'none' : 'transform 0.45s cubic-bezier(0.25,0.8,0.35,1), opacity 0.45s',
                  }}
                  onClickCapture={(e) => {
                    // A side card click just brings it forward; only the
                    // centred card actually follows its link.
                    if (!isActive) {
                      e.preventDefault();
                      e.stopPropagation();
                      setActive(i);
                    } else if (Math.abs(drag.current.moved) > 8) {
                      e.preventDefault(); // it was a drag, not a tap
                    }
                  }}
                >
                  <NewsCard item={it} active={isActive} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls — arrows + dots */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button onClick={() => go(-1)} aria-label="السابق" className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-orange-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-500 hover:text-brand-orange hover:border-brand-orange transition-all">
            <ChevronRight size={20} />
          </button>
          <div className="flex items-center gap-1.5" dir="ltr">
            {items.slice(0, Math.min(n, 9)).map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`بطاقة ${i + 1}`}
                className={`rounded-full transition-all ${i === active ? 'w-6 h-2 bg-brand-orange' : 'w-2 h-2 bg-orange-200 dark:bg-slate-700 hover:bg-orange-300'}`}
              />
            ))}
          </div>
          <button onClick={() => go(1)} aria-label="التالي" className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-orange-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-500 hover:text-brand-orange hover:border-brand-orange transition-all">
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Mobile "view all" */}
        <div className="flex sm:hidden justify-center mt-5">
          <Link href="/updates" className="text-xs font-bold text-white bg-gradient-to-l from-brand-orange to-brand-warm flex items-center gap-1.5 px-5 py-2.5 rounded-xl shadow-sm">
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
          ? 'bg-gradient-to-br from-amber-50 to-orange-50/70 dark:from-slate-800 dark:to-slate-900 shadow-2xl shadow-orange-500/20 ' +
            (urgent ? 'border-red-300 dark:border-red-800/60 ring-2 ring-red-200/80' : 'border-orange-300 dark:border-orange-800/50 ring-2 ring-orange-200/80')
          : 'bg-white dark:bg-slate-900 shadow-lg border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Date pill — top corner */}
      <div className="absolute top-0 left-0">
        <div
          dir="ltr"
          className="bg-gradient-to-bl from-orange-200/90 to-amber-200/90 dark:from-slate-700 dark:to-slate-700 text-orange-800 dark:text-amber-300 text-[11px] font-black px-3 py-1.5 rounded-br-2xl tabular-nums shadow-sm"
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
        <span className="text-xs font-black text-brand-orange dark:text-amber-300 flex items-center gap-1">
          اقرأ المزيد
          <ArrowLeft size={13} />
        </span>
      </div>
    </Link>
  );
}

/* Faint Istanbul skyline (domes + minarets) anchored to the bottom. */
function SkylineDecor() {
  return (
    <svg
      aria-hidden="true"
      className="absolute bottom-0 inset-x-0 w-full h-24 text-brand-orange/[0.07] dark:text-amber-400/[0.05] pointer-events-none"
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
