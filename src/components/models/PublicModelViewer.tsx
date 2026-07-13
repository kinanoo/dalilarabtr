'use client';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import type { PublicModelAsset, PublicModelBundle } from '@/lib/models/server';
import {
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
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

function pinErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  if (message === 'invalid_pin') return 'PIN غير صحيح';
  if (message === 'too_many_pin_attempts') return 'محاولات كثيرة. انتظر قليلاً ثم جرّب مرة أخرى.';
  return message || fallback;
}

function LockedPanel({
  title,
  hint,
  value,
  onChange,
  onUnlock,
  unlocking,
}: {
  title: string;
  hint?: string | null;
  value: string;
  onChange: (value: string) => void;
  onUnlock: () => void;
  unlocking: boolean;
}) {
  return (
    <section className="flex min-h-dvh items-center justify-center bg-black px-4 py-10 text-white">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/10 p-5 text-center shadow-2xl backdrop-blur">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-amber-300">
          <LockKeyhole size={24} />
        </div>
        <h2 className="text-lg font-black">{title}</h2>
        {hint && <p className="mt-2 text-sm leading-6 text-white/65">{hint}</p>}
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') onUnlock(); }}
            placeholder="PIN"
            className="min-w-0 rounded-xl border border-white/10 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none focus:border-emerald-400"
          />
          <button
            type="button"
            onClick={onUnlock}
            disabled={unlocking}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            <Unlock size={16} />
            فتح
          </button>
        </div>
      </div>
    </section>
  );
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
      toast.error(pinErrorMessage(err, 'تعذر فتح النموذج'));
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
      toast.error(pinErrorMessage(err, 'تعذر فتح الصورة'));
    } finally {
      setUnlocking(null);
    }
  }

  function openFullscreen(assetId: string) {
    const index = openAssets.findIndex((asset) => asset.id === assetId);
    if (index >= 0) setActiveIndex(index);
  }

  const collectionLocked = bundle.collection.requiresPin && assets.every((asset) => !asset.signedUrl);

  return (
    <>
      {collectionLocked ? (
        <LockedPanel
          title="النموذج محمي"
          hint={bundle.collection.pinHint}
          value={collectionPin}
          onChange={setCollectionPin}
          onUnlock={() => void unlockCollection()}
          unlocking={unlocking === 'collection'}
        />
      ) : (
        <div className="bg-black">
          {assets.map((asset, index) => (
            asset.signedUrl ? (
              <section
                key={asset.id}
                className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-black"
              >
                <img
                  src={asset.signedUrl}
                  alt={asset.title || `نموذج ${index + 1}`}
                  className="max-h-dvh w-full max-w-full cursor-zoom-in object-contain"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  onClick={() => openFullscreen(asset.id)}
                />
                {watermark && <Watermark text={watermark} />}
                {assets.length > 1 && (
                  <div dir="ltr" className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-xs font-black text-white/90 backdrop-blur">
                    {index + 1} / {assets.length}
                  </div>
                )}
              </section>
            ) : (
              <LockedPanel
                key={asset.id}
                title="صورة مقفولة"
                hint={asset.pinHint}
                value={assetPins[asset.id] || ''}
                onChange={(value) => setAssetPins((current) => ({ ...current, [asset.id]: value }))}
                onUnlock={() => void unlockAsset(asset.id)}
                unlocking={unlocking === asset.id}
              />
            )
          ))}
        </div>
      )}

      {activeAsset?.signedUrl && activeIndex !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black p-0" dir="rtl">
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-black/45 text-white backdrop-blur hover:bg-black/65"
            aria-label="إغلاق"
          >
            <X size={22} />
          </button>
          {openAssets.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setActiveIndex((index) => prevIndex(index, openAssets.length))}
                className="absolute right-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur hover:bg-black/65"
                aria-label="السابق"
              >
                <ChevronRight size={26} />
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex((index) => nextIndex(index, openAssets.length))}
                className="absolute left-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur hover:bg-black/65"
                aria-label="التالي"
              >
                <ChevronLeft size={26} />
              </button>
            </>
          )}
          <div className="relative h-dvh w-screen overflow-hidden">
            <img
              src={activeAsset.signedUrl}
              alt={activeAsset.title || 'نموذج'}
              className="h-full w-full object-contain"
            />
            {watermark && <Watermark text={watermark} />}
          </div>
          {openAssets.length > 1 && (
            <div dir="ltr" className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-xs font-black text-white/90 backdrop-blur">
              {activeIndex + 1} / {openAssets.length}
            </div>
          )}
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
