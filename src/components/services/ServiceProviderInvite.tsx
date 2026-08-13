'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ArrowLeft, BriefcaseBusiness, X } from 'lucide-react';

const SESSION_KEY = 'services_provider_invite_seen';

export default function ServiceProviderInvite() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    let frame = 0;
    const timer = window.setTimeout(() => {
      setMounted(true);
      frame = window.requestAnimationFrame(() => setVisible(true));
    }, 5000);

    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(false);
    window.setTimeout(() => setMounted(false), 220);
  };

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="service-provider-invite-title"
      className={`fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-[88] overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-950/20 transition duration-200 dark:border-slate-700 dark:bg-slate-900 md:bottom-6 md:left-auto md:right-6 md:w-[390px] ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="إغلاق"
        className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <X size={17} />
      </button>

      <div className="flex items-start gap-3 pl-8">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900">
          <BriefcaseBusiness size={21} />
        </span>
        <div className="min-w-0">
          <h2 id="service-provider-invite-title" className="text-base font-black text-slate-950 dark:text-white">
            هل تقدم مهنة أو خدمة؟
          </h2>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-600 dark:text-slate-300">
            أضف عملك إلى دليل العرب ليتمكن العملاء من العثور عليك والتواصل معك مباشرة.
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {/* White on emerald-600 is 3.8:1 — under AA for this 14px label. Dark
            mode keeps the bright button and takes an ink label instead (7.9:1),
            matching ProviderCard / ProviderRow. */}
        <Link
          href="/services/add"
          onClick={dismiss}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-emerald-700 active:scale-[0.98] dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
        >
          أضف خدمتك
          <ArrowLeft size={16} />
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="h-11 rounded-xl px-4 text-xs font-black text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          ليس الآن
        </button>
      </div>
    </aside>,
    document.body,
  );
}
