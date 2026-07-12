'use client';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import type { PublicModelAsset, PublicModelBundle } from '@/lib/models/server';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  Maximize2,
  Unlock,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  token: string;
  bundle: PublicModelBundle;
  initialAssetId?: string | null;
};

function Watermark({ text }: { text: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <div className="absolute inset-0 grid grid-cols-2 place-items-center gap-8 opacity-25">
        {Array.from({ length: 6 }).map((_, index) => (
          <span
            key={index}
            className="-rotate-12 select-none whitespace-nowrap text-3xl font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

function prioritizeAsset(items: PublicModelAsset[], assetId?: string | null) {
  if (!assetId) return items;
  const index = items.findIndex((asset) => asset.id === assetId);
  if (index <= 0) return items;
  return [items[index], ...items.slice(0, index), ...items.slice(index + 1)];
}

export default function PublicModelViewer({ token, bundle, initialAssetId }: Props) {
  const [assets, setAssets] = useState<PublicModelAsset[]>(() => prioritizeAsset(bundle.assets, initialAssetId));
  const [collectionPin, setCollectionPin] = useState('');
  const [assetPins, setAssetPins] = useState<Record<string, string>>({});
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const openAssets = useMemo(() => assets.filter((asset) => Boolean(asset.signedUrl)), [assets]);
  const activeAsset = activeIndex === null ? null : openAssets[activeIndex] || null;
  const watermark = (bundle.collection.watermark_text || '').trim();

  useEffect(() => {
    if (activeIndex === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setActiveIndex(null);
      if (event.key === 'ArrowLeft') setActiveIndex((index) => nextIndex(index, openAssets.length));
      if (event.key === 'ArrowRight') setActiveIndex((index) => prevIndex(index, openAssets.length));
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, openAssets.length]);

  function replaceAsset(updated: Partial<PublicModelAsset> & { id: string }) {
    setAssets((current) => current.map((asset) => (
      asset.id === updated.id ? { ...asset, ...updated } : asset
    )));
  }

  async function unlockCollection() {
    if (!collectionPin.trim()) return;
    setUnlocking('collection');
    try {
      const res = await fetch(`/api/models/${encodeURIComponent(token)}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: collectionPin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'PIN غير صحيح');
      setAssets(Array.isArray(data.assets) ? prioritizeAsset(data.assets, initialAssetId) : assets);
      setCollectionPin('');
      toast.success('تم فتح النماذج المتاحة');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذر فتح النموذج');
    } finally {
      setUnlocking(null);
    }
  }

  async function unlockAsset(assetId: string) {
    const pin = assetPins[assetId]?.trim();
    if (!pin) return;
    setUnlocking(assetId);
    try {
      const res = await fetch(`/api/models/${encodeURIComponent(token)}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, pin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'PIN غير صحيح');
      replaceAsset(data.asset);
      setAssetPins((current) => ({ ...current, [assetId]: '' }));
      toast.success('تم فتح الصورة');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذر فتح الصورة');
    } finally {
      setUnlocking(null);
    }
  }

  function openFullscreen(assetId: string) {
    const index = openAssets.findIndex((asset) => asset.id === assetId);
    if (index >= 0) setActiveIndex(index);
  }

  return (
    <>
      {bundle.collection.requiresPin && assets.every((asset) => !asset.signedUrl) && (
        <div className="mb-5 rounded-3xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20">
          <div className="mb-3 flex items-start gap-2 text-sm font-bold text-amber-900 dark:text-amber-100">
            <LockKeyhole size={18} className="mt-0.5 shrink-0" />
            <span>
              هذا النموذج محمي بكلمة سر.
              {bundle.collection.pinHint ? ` التلميح: ${bundle.collection.pinHint}` : ''}
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={collectionPin}
              onChange={(event) => setCollectionPin(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') void unlockCollection(); }}
              placeholder="أدخل كلمة السر"
              className="min-w-0 flex-1 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-amber-500 dark:border-amber-900/50 dark:bg-slate-950"
            />
            <button
              type="button"
              onClick={() => void unlockCollection()}
              disabled={unlocking === 'collection'}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-black text-white hover:bg-amber-600 disabled:opacity-60"
            >
              <Unlock size={16} />
              فتح النموذج
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-white/80 px-4 py-3 text-xs font-bold text-slate-500 shadow-sm dark:bg-slate-900/80 dark:text-slate-300">
        <AlertCircle size={15} />
        الصور المفتوحة يمكن عرضها بكامل الشاشة. الصور المقفولة تُفتح فقط بالـ PIN الصحيح.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset, index) => (
          <figure
            key={asset.id}
            className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-900/10 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
              {asset.signedUrl ? (
                <>
                  <button
                    type="button"
                    onClick={() => openFullscreen(asset.id)}
                    className="absolute left-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-xl bg-slate-950/70 text-white opacity-0 transition group-hover:opacity-100"
                    aria-label="عرض كامل"
                  >
                    <Maximize2 size={17} />
                  </button>
                  <img
                    src={asset.signedUrl}
                    alt={asset.title || `نموذج ${index + 1}`}
                    className="h-full w-full cursor-zoom-in object-cover transition duration-500 group-hover:scale-[1.03]"
                    loading={index < 3 ? 'eager' : 'lazy'}
                    onClick={() => openFullscreen(asset.id)}
                  />
                  {watermark && <Watermark text={watermark} />}
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-5 text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                    <LockKeyhole size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 dark:text-white">صورة مقفولة</p>
                    {asset.pinHint && (
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">{asset.pinHint}</p>
                    )}
                  </div>
                  <div className="flex w-full max-w-xs gap-2">
                    <input
                      value={assetPins[asset.id] || ''}
                      onChange={(event) => setAssetPins((current) => ({ ...current, [asset.id]: event.target.value }))}
                      onKeyDown={(event) => { if (event.key === 'Enter') void unlockAsset(asset.id); }}
                      placeholder="PIN"
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                    />
                    <button
                      type="button"
                      onClick={() => void unlockAsset(asset.id)}
                      disabled={unlocking === asset.id}
                      className="rounded-xl bg-emerald-600 px-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      فتح
                    </button>
                  </div>
                </div>
              )}
            </div>
            {(asset.title || asset.caption) && (
              <figcaption className="space-y-1 p-4">
                {asset.title && (
                  <h2 className="text-sm font-black text-slate-900 dark:text-white">{asset.title}</h2>
                )}
                {asset.caption && (
                  <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">{asset.caption}</p>
                )}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {activeAsset?.signedUrl && activeIndex !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 p-3" dir="rtl">
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="إغلاق"
          >
            <X size={22} />
          </button>
          {openAssets.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setActiveIndex((index) => prevIndex(index, openAssets.length))}
                className="absolute right-4 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="السابق"
              >
                <ChevronRight size={26} />
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex((index) => nextIndex(index, openAssets.length))}
                className="absolute left-4 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="التالي"
              >
                <ChevronLeft size={26} />
              </button>
            </>
          )}
          <div className="relative h-full max-h-[94vh] w-full max-w-7xl overflow-hidden rounded-2xl">
            <img
              src={activeAsset.signedUrl}
              alt={activeAsset.title || 'نموذج'}
              className="h-full w-full object-contain"
            />
            {watermark && <Watermark text={watermark} />}
          </div>
          <div className="absolute bottom-4 left-1/2 max-w-[92vw] -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-center text-xs font-bold text-white">
            {activeAsset.title || `صورة ${activeIndex + 1}`} - {activeIndex + 1} / {openAssets.length}
          </div>
        </div>
      )}
    </>
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
