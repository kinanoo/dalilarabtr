'use client';

import dynamic from 'next/dynamic';

const GlobalSearch = dynamic(() => import('@/components/GlobalSearch'), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-xl mx-auto">
      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur opacity-30" />
        <input
          disabled
          placeholder="ماذا تريد أن تعرف اليوم؟ (إقامة، قانون...)"
          className="w-full py-4 ps-12 pe-24 rounded-full bg-slate-900/80 backdrop-blur-2xl text-white placeholder:text-slate-500 text-lg shadow-2xl ring-1 ring-white/10 relative z-10 border-0 outline-none"
        />
      </div>
    </div>
  ),
});

export default function LazyGlobalSearch() {
  return <GlobalSearch variant="hero" />;
}
