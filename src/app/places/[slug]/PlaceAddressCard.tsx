'use client';

// ============================================================================
// 🏠 PlaceAddressCard — the stored address, made useful
// ============================================================================
// An address is only worth storing if the visitor can act on it: read it, copy
// it, paste it to a driver, or call ahead. That is all this does — plus it
// states WHEN we last checked it, so nobody has to trust it blindly.
// ============================================================================

import { useState } from 'react';
import { Copy, Check, MapPin, Phone, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { PlaceContact } from '@/lib/officialPlaces';

/** 2026-07-26 → 26/07/2026 (no Date parsing: the value is already ISO). */
function formatIsoDate(iso: string): string {
    const [y, m, d] = iso.split('-');
    return d && m && y ? `${d}/${m}/${y}` : iso;
}

export default function PlaceAddressCard({
    contact,
    placeName,
}: {
    contact: PlaceContact;
    placeName: string;
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(`${placeName} — ${contact.address}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard denied (insecure context / permission) — the address is
            // selectable text right above, so there is nothing to recover from.
        }
    };

    return (
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 bg-emerald-500" />

            <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <MapPin size={16} />
                </span>
                العنوان
            </h2>

            <div className="flex items-start gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
                <p
                    className="flex-1 min-w-0 text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed select-all"
                    dir="ltr"
                    lang="tr"
                >
                    {contact.address}
                </p>
                <button
                    type="button"
                    onClick={handleCopy}
                    aria-label="نسخ العنوان"
                    title="نسخ العنوان"
                    className="p-2.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
                >
                    {copied
                        ? <Check size={16} className="text-emerald-600" />
                        : <Copy size={16} className="text-slate-400" />}
                </button>
            </div>
            {copied && (
                <p role="status" className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    تم نسخ العنوان — أرسله لسائق التاكسي أو الصقه في الخرائط.
                </p>
            )}

            <div className="mt-4 space-y-2.5">
                {contact.phone && (
                    <a
                        href={`tel:${contact.phone.replace(/\s/g, '')}`}
                        className="flex items-center gap-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                    >
                        <Phone size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span dir="ltr" className="tabular-nums">{contact.phone}</span>
                        <span className="text-[11px] font-normal text-slate-400">— اتصل قبل التوجّه</span>
                    </a>
                )}
                {contact.hours && (
                    <p className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                        <Clock size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        {contact.hours}
                    </p>
                )}
            </div>

            {/* A caveat about the post itself (services suspended, etc.) sits
                above the freshness stamp — it changes whether the trip is worth
                making at all. */}
            {contact.note && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3">
                    <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">{contact.note}</p>
                </div>
            )}

            {/* Freshness, stated rather than implied. */}
            <p className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2 text-[11px] text-slate-400 dark:text-slate-400 leading-relaxed">
                <ShieldCheck size={13} className="shrink-0 mt-0.5" />
                <span>
                    تم التحقق من هذا العنوان بتاريخ {formatIsoDate(contact.verifiedOn)} ({contact.source}).
                    العناوين الرسمية نادراً ما تتغيّر، وإن تغيّرت استخدم زر البحث بالاسم في الأعلى.
                </span>
            </p>
        </div>
    );
}
