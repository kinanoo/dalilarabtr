'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import { Search } from 'lucide-react';

const GlobalSearch = dynamic(() => import('@/components/GlobalSearch'), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-xl mx-auto">
      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur opacity-30" />
        <input
          disabled
          placeholder="ماذا تريد أن تعرف اليوم؟ (إقامة، قانون...)"
          className="w-full py-4 ps-12 pe-24 rounded-full bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl text-slate-800 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 text-lg shadow-2xl ring-1 ring-slate-200 dark:ring-white/10 relative z-10 border-0 outline-none"
        />
      </div>
    </div>
  ),
});

export default function LazyGlobalSearch() {
  const [active, setActive] = useState(false);
  const preload = useCallback(() => {
    void import('@/components/GlobalSearch');
  }, []);

  if (active) {
    return <GlobalSearch variant="hero" autoFocus />;
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      onFocus={() => setActive(true)}
      onPointerEnter={preload}
      onTouchStart={preload}
      aria-label="فتح البحث في الموقع"
      className="group relative mx-auto flex w-full max-w-xl items-center rounded-full bg-white/90 py-4 ps-5 pe-3 text-start text-lg text-slate-500 shadow-2xl ring-1 ring-slate-200 transition-shadow hover:ring-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:bg-slate-900/80 dark:text-slate-400 dark:ring-white/10"
    >
      <Search size={22} className="me-3 shrink-0 text-slate-500 transition-colors group-hover:text-emerald-600 dark:text-slate-400" />
      <span className="min-w-0 flex-1 truncate">ماذا تريد أن تعرف اليوم؟</span>
      <span className="ms-3 shrink-0 rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white">بحث</span>
    </button>
  );
}
