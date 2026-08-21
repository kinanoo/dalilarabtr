'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';

export default function ProviderClaimForm({ providerId }: { providerId: string }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loginRequired, setLoginRequired] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError('');
    setLoginRequired(false);
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/services/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId,
        claimantName: form.get('claimantName'),
        whatsapp: form.get('whatsapp'),
        note: form.get('note'),
        website: form.get('website'),
      }),
    });
    setSending(false);
    if (response.ok) setDone(true);
    else if (response.status === 401) setLoginRequired(true);
    else setError(response.status === 429 ? 'حاول مرة أخرى لاحقاً.' : 'تحقق من الاسم ورقم واتساب ثم أعد المحاولة.');
  }

  if (done) return (
    <p className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
      <CheckCircle2 size={17} /> وصل الطلب. بعد اعتماده ستظهر الصفحة ضمن حسابك لإدارتها.
    </p>
  );

  return (
    <div className="mt-6 border-t border-slate-100 pt-5 text-center dark:border-slate-800">
      <button type="button" onClick={() => setOpen(value => !value)} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-emerald-700 dark:text-slate-300">
        <ShieldCheck size={16} /> هل هذه صفحتك؟ اطلب إدارتها
      </button>
      {open && (
        <form onSubmit={submit} className="mx-auto mt-4 grid max-w-xl gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-right dark:border-slate-700 dark:bg-slate-950/50">
          <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />
          <input required name="claimantName" maxLength={120} className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="اسم صاحب العمل" />
          <input required name="whatsapp" inputMode="tel" dir="ltr" maxLength={40} className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-left text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="رقم واتساب للتأكد" />
          <textarea name="note" maxLength={500} className="min-h-20 rounded-lg border border-slate-300 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="ملاحظة اختيارية تثبت علاقتك بالخدمة" />
          {loginRequired && (
            <p className="rounded-lg bg-amber-50 p-3 text-xs font-bold leading-6 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              يلزم تسجيل الدخول حتى نستطيع ربط الصفحة بحسابك بعد الاعتماد.{' '}
              <Link href={`/login?next=${encodeURIComponent(`/services/${providerId}`)}`} className="underline underline-offset-4">سجّل الدخول ثم أعد الإرسال</Link>
            </p>
          )}
          {error && <p className="text-xs font-bold text-red-600">{error}</p>}
          <button disabled={sending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-black text-white disabled:opacity-60 dark:bg-white dark:text-slate-950">
            {sending && <Loader2 size={16} className="animate-spin" />}{sending ? 'جارٍ الإرسال' : 'إرسال للمراجعة'}
          </button>
        </form>
      )}
    </div>
  );
}
