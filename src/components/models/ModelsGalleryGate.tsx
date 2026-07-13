'use client';

import { FormEvent, useState } from 'react';
import { KeyRound, Loader2, LockKeyhole } from 'lucide-react';

export default function ModelsGalleryGate() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password || busy) return;

    setBusy(true);
    setError('');

    try {
      const response = await fetch('/api/models/gallery-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(body.error || 'تعذر فتح المعرض. حاول مرة أخرى.');
        return;
      }

      window.location.reload();
    } catch {
      setError('تعذر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main dir="rtl" className="grid min-h-dvh place-items-center bg-slate-950 px-4 py-10 text-white">
      <section className="w-full max-w-sm rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-2xl sm:p-7">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20">
          <LockKeyhole size={27} />
        </div>
        <div className="mt-4 text-center">
          <h1 className="text-xl font-black">معرض محمي</h1>
          <p className="mt-2 text-sm leading-6 text-white/60">أدخل كلمة السر للمتابعة</p>
        </div>

        <form onSubmit={unlock} className="mt-6 space-y-3">
          <label className="block">
            <span className="sr-only">كلمة السر</span>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                inputMode="numeric"
                maxLength={64}
                autoFocus
                placeholder="كلمة السر"
                className="h-12 w-full rounded-lg border border-white/10 bg-black/25 px-11 text-center text-lg font-black tracking-widest text-white outline-none transition placeholder:text-sm placeholder:font-bold placeholder:tracking-normal placeholder:text-white/35 focus:border-emerald-400"
              />
            </div>
          </label>

          {error && (
            <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-center text-xs font-bold leading-5 text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!password || busy}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Loader2 className="animate-spin" size={18} /> : <LockKeyhole size={18} />}
            فتح المعرض
          </button>
        </form>
      </section>
    </main>
  );
}

