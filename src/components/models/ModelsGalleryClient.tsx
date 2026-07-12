'use client';

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { PublicGalleryAsset, PublicGalleryCollection } from '@/lib/models/server';
import {
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Image as ImageIcon,
  LayoutGrid,
  ListFilter,
  LockKeyhole,
  Maximize2,
  Search,
  X,
} from 'lucide-react';

type FilterMode = 'all' | 'open' | 'locked';

type Props = {
  collections: PublicGalleryCollection[];
};

type GalleryItem = PublicGalleryAsset & {
  watermarkText: string;
};

function flattenCollections(collections: PublicGalleryCollection[]): GalleryItem[] {
  return collections.flatMap((collection) => (
    collection.assets.map((asset) => ({
      ...asset,
      watermarkText: (collection.watermark_text || '').trim(),
    }))
  ));
}

function Watermark({ text }: { text: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <div className="absolute inset-0 grid grid-cols-2 place-items-center gap-5 opacity-20">
        {Array.from({ length: 6 }).map((_, index) => (
          <span
            key={index}
            className="-rotate-12 select-none whitespace-nowrap text-2xl font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

function nextIndex(index: number | null, length: number) {
  if (!length) return null;
  return index === null ? 0 : (index + 1) % length;
}

function prevIndex(index: number | null, length: number) {
  if (!length) return null;
  return index === null ? 0 : (index - 1 + length) % length;
}

export default function ModelsGalleryClient({ collections }: Props) {
  const allItems = useMemo(() => flattenCollections(collections), [collections]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return allItems.filter((item) => {
      if (filter === 'open' && item.isLocked) return false;
      if (filter === 'locked' && !item.isLocked) return false;
      if (!needle) return true;
      return [
        item.title,
        item.caption,
        item.collectionTitle,
        item.collectionDescription,
      ].some((value) => (value || '').toLowerCase().includes(needle));
    });
  }, [allItems, filter, query]);

  const openItems = useMemo(() => filteredItems.filter((item) => item.imageUrl), [filteredItems]);
  const activeItem = activeIndex === null ? null : openItems[activeIndex] || null;

  function openFullscreen(itemId: string) {
    const index = openItems.findIndex((item) => item.id === itemId);
    if (index >= 0) setActiveIndex(index);
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#f3f7fa] text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-slate-200 bg-white/75 dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-900">
              <ImageIcon size={22} />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase text-slate-400">Model Gallery</p>
              <h1 className="text-xl font-black leading-none text-slate-950 dark:text-white">معرض النماذج</h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-slate-100 p-1 text-xs font-black text-slate-500 dark:bg-slate-900 sm:flex">
            <Link href="/" className="rounded-full px-4 py-2 hover:bg-white hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">الرئيسية</Link>
            <span className="rounded-full bg-white px-4 py-2 text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white">المعرض</span>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-[#d9c27b]/60">
          <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-black text-amber-600">المعرض</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950 dark:text-white sm:text-6xl">معرض القوالب</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-300">
                استعرض مجموعة مختارة من النماذج الجاهزة والأعمال السابقة.
              </p>
            </div>
            <div className="text-sm font-bold text-slate-400">
              {filteredItems.length} نتيجة
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xs">
              <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="بحث..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-3 pr-10 text-sm font-bold outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                <ListFilter size={15} />
                فلترة
              </span>
              {([
                ['all', 'الكل', LayoutGrid],
                ['open', 'مفتوحة', Grid3X3],
                ['locked', 'مقفولة', LockKeyhole],
              ] as const).map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black transition ${
                    filter === value
                      ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                      : 'bg-white text-slate-500 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 pt-5 sm:px-6">
          {filteredItems.length === 0 ? (
            <div className="grid min-h-[260px] place-items-center rounded-3xl border border-dashed border-slate-300 bg-white/70 text-center dark:border-slate-800 dark:bg-slate-900/70">
              <div>
                <ImageIcon className="mx-auto text-slate-300" size={42} />
                <p className="mt-3 text-sm font-black text-slate-500">لا توجد نماذج مطابقة حالياً</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item, index) => (
                <figure
                  key={item.id}
                  className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-200 dark:bg-slate-800">
                    {item.imageUrl ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openFullscreen(item.id)}
                          className="absolute left-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-xl bg-slate-950/70 text-white opacity-0 transition group-hover:opacity-100"
                          aria-label="عرض كامل"
                        >
                          <Maximize2 size={17} />
                        </button>
                        <img
                          src={item.imageUrl}
                          alt={item.title || item.collectionTitle}
                          className="h-full w-full cursor-zoom-in object-contain transition duration-500 group-hover:scale-[1.02]"
                          loading={index < 8 ? 'eager' : 'lazy'}
                          onClick={() => openFullscreen(item.id)}
                        />
                        {item.watermarkText && <Watermark text={item.watermarkText} />}
                      </>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-900/90 p-5 text-center text-white">
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-amber-300 ring-1 ring-white/15">
                          <LockKeyhole size={26} />
                        </div>
                        <p className="text-sm font-black">محمي برمز PIN</p>
                        {item.pinHint && <p className="text-xs leading-5 text-white/70">{item.pinHint}</p>}
                      </div>
                    )}
                  </div>
                  <figcaption className="space-y-1 p-4">
                    <h3 className="line-clamp-1 text-sm font-black text-slate-950 dark:text-white">
                      {item.title || item.collectionTitle}
                    </h3>
                    <p className="line-clamp-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                      {item.caption || item.collectionDescription || item.collectionTitle}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </section>
      </main>

      {activeItem?.imageUrl && activeIndex !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 p-3" dir="rtl">
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="إغلاق"
          >
            <X size={22} />
          </button>
          {openItems.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setActiveIndex((index) => prevIndex(index, openItems.length))}
                className="absolute right-4 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="السابق"
              >
                <ChevronRight size={26} />
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex((index) => nextIndex(index, openItems.length))}
                className="absolute left-4 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="التالي"
              >
                <ChevronLeft size={26} />
              </button>
            </>
          )}
          <div className="relative h-full max-h-[94vh] w-full max-w-7xl overflow-hidden rounded-2xl">
            <img
              src={activeItem.imageUrl}
              alt={activeItem.title || activeItem.collectionTitle}
              className="h-full w-full object-contain"
            />
            {activeItem.watermarkText && <Watermark text={activeItem.watermarkText} />}
          </div>
          <div className="absolute bottom-4 left-1/2 max-w-[92vw] -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-center text-xs font-bold text-white">
            {activeItem.title || activeItem.collectionTitle} - {activeIndex + 1} / {openItems.length}
          </div>
        </div>
      )}
    </div>
  );
}
