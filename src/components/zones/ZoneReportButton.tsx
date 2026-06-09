'use client';

/**
 * ZoneReportButton — one-tap crowdsourced verification on zone tiles.
 *
 * Placed inside each "closed" neighborhood card on the /zones/[slug] page.
 * When a visitor successfully registered their address in a neighborhood
 * that's listed as closed, they press this button. The system:
 *   1. Posts to /api/zone-report (hashed IP dedup, rate-limited).
 *   2. Optimistically increments the displayed count.
 *   3. Stores a localStorage flag so the button shows "أبلغت سابقاً" on
 *      revisit (even without auth).
 *
 * The admin sees zones where community_reopened_count ≥ 3 highlighted in
 * the /admin/zones page and can flip status → 'reopened' with one click.
 *
 * This component does NOT auto-flip the zone status — the admin stays in
 * the loop. The threshold is configurable server-side but defaults to 3.
 */

import { useState, useEffect } from 'react';
import { CheckCircle2, Users, Loader2, AlertTriangle, X } from 'lucide-react';

interface Props {
    zoneId: string;
    /** Current count from the zones.community_reopened_count column. */
    initialCount: number;
    /** Current zone status — the button only renders for 'closed' zones. */
    status: 'closed' | 'reopened' | 'pending' | string;
}

const THRESHOLD = 3;

export default function ZoneReportButton({ zoneId, initialCount, status }: Props) {
    const [count, setCount] = useState(initialCount);
    const [reported, setReported] = useState(false);
    const [sending, setSending] = useState(false);
    // Two-step confirmation: the first click on the CTA only opens the
    // confirm panel; the actual POST to /api/zone-report fires only when
    // the user clicks the green "نعم، أؤكد" button. Prevents:
    //   - Accidental fat-finger clicks while scrolling on mobile
    //   - Multi-click spam where someone hammers the same zone (the IP
    //     unique constraint already blocks the dupes, but this is the
    //     UX layer that tells the user "this is a real action")
    //   - Drive-by fake-attack attempts where N IPs click before reading
    //     the prompt — the confirm step adds friction without blocking
    //     legitimate reporters
    const [confirming, setConfirming] = useState(false);

    // Check localStorage on mount — prevents the button from resetting
    // across page navigations. The key includes the zoneId so reporting
    // one neighborhood doesn't mark all as reported.
    useEffect(() => {
        try {
            const key = `zone_report_${zoneId}`;
            if (localStorage.getItem(key) === '1') {
                setReported(true);
            }
        } catch {
            // SSR or storage unavailable — ignore
        }
    }, [zoneId]);

    // Only show on 'closed' zones — 'reopened' and 'pending' zones don't
    // need community verification.
    if (status !== 'closed') return null;

    // The CTA button only OPENS the confirm panel — does not submit.
    // Resending the same handler when the panel is already open just
    // closes it (acts as a toggle / "cancel" on the same target).
    function handleOpenConfirm() {
        if (reported || sending) return;
        setConfirming((v) => !v);
    }

    // The actual submission — wired to the green "نعم، أؤكد" button
    // inside the confirm panel. This is the only path that POSTs.
    async function handleConfirmedReport() {
        if (reported || sending) return;
        setSending(true);
        setConfirming(false);
        try {
            const res = await fetch('/api/zone-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ zoneId, reportType: 'reopened' }),
            });
            const payload = await res.json().catch(() => ({}));
            if (res.ok || payload?.alreadyReported) {
                setReported(true);
                if (!payload?.alreadyReported) {
                    setCount((c) => c + 1);
                }
                try {
                    localStorage.setItem(`zone_report_${zoneId}`, '1');
                } catch { /* ignore */ }
                if ('vibrate' in navigator) navigator.vibrate?.([30]);
            }
        } catch {
            // silent — non-critical action
        } finally {
            setSending(false);
        }
    }

    const hasReports = count > 0;
    const nearThreshold = count >= THRESHOLD;

    return (
        <div className="mt-2.5 space-y-1.5">
            {/* Two-line CTA — the headline ("هل ثبّتّ النفوس...") sells the
                ask in plain Arabic, the supporting line ("مشاركتك تساعد
                غيرك") removes the embarrassment of being the first
                reporter. Far better conversion than the previous one-liner
                "سجّلت هنا بنجاح؟" which read as a quiz, not a request. */}
            <button
                type="button"
                onClick={handleOpenConfirm}
                disabled={reported || sending}
                className={`w-full text-right p-2.5 rounded-xl border transition-all ${
                    reported
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 cursor-default'
                        : confirming
                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 active:scale-[0.99]'
                }`}
                title={reported
                    ? 'أبلغت سابقاً — شكراً لمساهمتك'
                    : 'انقر إن ثبّتّ نفوسك مؤخّراً في هذا الحيّ'}
            >
                <div className="flex items-start gap-2">
                    <span className={`shrink-0 mt-0.5 ${reported ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {sending ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : reported ? (
                            <CheckCircle2 size={14} />
                        ) : (
                            <Users size={14} />
                        )}
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className={`text-[12px] font-bold leading-snug ${
                            reported
                                ? 'text-emerald-800 dark:text-emerald-200'
                                : 'text-slate-700 dark:text-slate-200'
                        }`}>
                            {reported
                                ? 'تمّ تسجيل مشاركتك — شكراً لك'
                                : 'هل ثبّتّ النفوس مؤخّراً في هذا الحيّ؟'}
                        </div>
                        <div className={`text-[10px] mt-0.5 leading-snug ${
                            reported
                                ? 'text-emerald-700/80 dark:text-emerald-300/80'
                                : 'text-slate-500 dark:text-slate-400'
                        }`}>
                            {reported
                                ? 'سيراها الأدمن لتحديث القائمة الرسمية'
                                : 'انقر هنا — مشاركتك تساعد غيرك'}
                        </div>
                    </div>
                </div>
            </button>

            {/* Inline confirmation panel — appears between the CTA and the
                community count when the user taps the CTA. Two-step click
                is the simplest defense against accidental taps, double-
                taps, and "click before reading" behavior. We deliberately
                avoid a modal popup: modals on mobile are jarring, hide
                the underlying neighborhood name, and add a layer of
                "what was I about to do?" confusion. An inline expanding
                panel keeps the context (the neighborhood card) visible
                while the user reads the warning. */}
            {confirming && !reported && (
                <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="flex items-start gap-2 mb-2">
                        <AlertTriangle size={14} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div className="text-[11px] leading-snug text-amber-900 dark:text-amber-100">
                            <div className="font-bold mb-0.5">تأكّد قبل المتابعة</div>
                            <div className="text-amber-800/90 dark:text-amber-200/90">
                                مشاركتك تساعد غيرك من السوريين والعرب — يجب أن تكون صحيحة. أكّد فقط إن كنت قد ثبّتّ نفوسك في هذا الحيّ فعلاً خلال الأيام الأخيرة.
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleConfirmedReport}
                            disabled={sending}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                            {sending ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : (
                                <CheckCircle2 size={12} />
                            )}
                            <span>نعم، أؤكّد</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirming(false)}
                            disabled={sending}
                            className="inline-flex items-center justify-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                            <X size={12} />
                            <span>إلغاء</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Community count badge — separate row so it doesn't compete
                with the CTA. Only renders when ≥1 report exists. */}
            {hasReports && (
                <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${
                    nearThreshold
                        ? 'bg-emerald-500 text-white animate-pulse'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                    <Users size={10} />
                    <span className="tabular-nums">{count}</span>
                    <span>
                        {nearThreshold
                            ? 'شارك ← قيد المراجعة'
                            : count === 1 ? 'شخص شارك تجربته' : 'أشخاص شاركوا تجربتهم'}
                    </span>
                </div>
            )}
        </div>
    );
}
