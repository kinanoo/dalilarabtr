'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ArrowLeft, BriefcaseBusiness, Sparkles, X } from 'lucide-react';
import {
  isInviteSuppressed,
  SERVICE_PROVIDER_INVITE_COOLDOWN_MS,
  SERVICE_PROVIDER_INVITE_STORAGE_KEY,
} from '@/lib/serviceProviderInvite';

const SHOW_DELAY_MS = 5000;

export default function ServiceProviderInvite() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    window.setTimeout(() => setMounted(false), 260);
  }, []);

  useEffect(() => {
    try {
      if (isInviteSuppressed(localStorage.getItem(SERVICE_PROVIDER_INVITE_STORAGE_KEY))) return;
    } catch {
      // Locked-down browsers can disable storage; the server claim remains authoritative.
    }

    let frame = 0;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      let show = true;
      let suppressUntil = Date.now() + SERVICE_PROVIDER_INVITE_COOLDOWN_MS;

      try {
        const result = await fetch('/api/services/provider-invite', {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
          signal: controller.signal,
        });
        if (result.ok) {
          const data = await result.json() as { show?: boolean; suppressUntil?: number };
          show = data.show === true;
          if (Number.isFinite(data.suppressUntil)) suppressUntil = Number(data.suppressUntil);
        }
      } catch {
        if (controller.signal.aborted) return;
      }

      try {
        localStorage.setItem(SERVICE_PROVIDER_INVITE_STORAGE_KEY, String(suppressUntil));
      } catch {
        // The server-side claim still prevents repeated display.
      }

      if (!show || controller.signal.aborted) return;
      setMounted(true);
      frame = window.requestAnimationFrame(() => setVisible(true));
    }, SHOW_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!visible) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [dismiss, visible]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[88] grid place-items-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-[2px] transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <div
        className={`w-full max-w-[560px] transition duration-300 ${
          visible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-3 opacity-0'
        }`}
      >
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-provider-invite-title"
          className={`relative max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-amber-300/60 bg-[#073f4a] p-6 text-white shadow-2xl shadow-slate-950/45 sm:p-8 ${
            visible ? 'service-provider-invite-pulse' : ''
          }`}
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={dismiss}
            aria-label="إغلاق"
            className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200/30 bg-white/10 px-3 py-1.5 text-xs font-black text-amber-100">
              <Sparkles size={14} />
              انضم إلى دليل الخدمات
            </span>
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-300 text-slate-950 shadow-lg shadow-amber-950/20 sm:h-20 sm:w-20">
              <BriefcaseBusiness size={34} strokeWidth={2.2} />
            </span>
            <h2 id="service-provider-invite-title" className="mt-5 text-2xl font-black leading-tight sm:text-3xl">
              هل تقدم مهنة أو خدمة؟
            </h2>
            <p className="mt-3 max-w-md text-sm font-bold leading-7 text-cyan-50/90 sm:text-base">
              أضف عملك إلى دليل العرب ليتمكن العملاء من العثور عليك والتواصل معك مباشرة.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/services/add"
              onClick={dismiss}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 py-3.5 text-base font-black text-slate-950 shadow-lg shadow-slate-950/20 transition hover:bg-amber-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white"
            >
              أضف خدمتك
              <ArrowLeft size={19} />
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="min-h-12 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-black text-white/85 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              ليس الآن
            </button>
          </div>
        </aside>
      </div>
    </div>,
    document.body,
  );
}
