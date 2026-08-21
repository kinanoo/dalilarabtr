'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ExternalLink, Loader2, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';

type Claim = {
  id: string;
  provider_id: string;
  claimant_name: string;
  claimant_user_id?: string | null;
  whatsapp: string;
  note?: string | null;
  created_at: string;
  provider?: { name?: string; slug?: string | null } | null;
};

export default function ServiceClaimsPanel() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch('/api/admin/service-claims', { cache: 'no-store' });
    if (response.ok) setClaims((await response.json()).claims || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function decide(id: string, status: 'approved' | 'rejected') {
    setActing(id);
    const response = await fetch('/api/admin/service-claims', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setActing('');
    if (!response.ok) return toast.error('تعذرت معالجة الطلب');
    setClaims(rows => rows.filter(row => row.id !== id));
    toast.success(status === 'approved' ? 'تم اعتماد المطالبة' : 'تم رفض المطالبة');
  }

  if (loading) return <div className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />;
  if (claims.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-lg border border-amber-200 bg-white dark:border-amber-900/50 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-amber-100 px-4 py-3 dark:border-amber-900/40">
        <ShieldCheck size={18} className="text-amber-600" />
        <h2 className="text-sm font-black text-slate-900 dark:text-white">طلبات إدارة الصفحات</h2>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">{claims.length}</span>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {claims.map(claim => (
          <div key={claim.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0">
              <p className="font-black text-slate-900 dark:text-white">{claim.provider?.name || 'صفحة مزود خدمة'}</p>
              <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300">الطالب: {claim.claimant_name} · <span dir="ltr">{claim.whatsapp}</span>{claim.claimant_user_id ? ' · حساب مرتبط' : ' · بلا حساب'}</p>
              {claim.note && <p className="mt-1 text-xs leading-5 text-slate-500">{claim.note}</p>}
            </div>
            <div className="flex items-center gap-2">
              {claim.provider?.slug && <Link href={`/services/${claim.provider.slug}`} target="_blank" aria-label="فتح الصفحة" className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-500"><ExternalLink size={16} /></Link>}
              <button onClick={() => void decide(claim.id, 'rejected')} disabled={acting === claim.id} aria-label="رفض" className="grid h-10 w-10 place-items-center rounded-lg bg-red-50 text-red-600"><X size={17} /></button>
              <button onClick={() => void decide(claim.id, 'approved')} disabled={acting === claim.id || !claim.claimant_user_id} title={!claim.claimant_user_id ? 'لا يمكن نقل الإدارة بلا حساب مرتبط' : undefined} className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
                {acting === claim.id ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} اعتماد
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
