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
import { CheckCircle2, Users, Loader2 } from 'lucide-react';

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

    async function handleReport() {
        if (reported || sending) return;
        setSending(true);
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
        <div className="mt-2 flex items-center gap-2 flex-wrap">
            {/* Report button */}
            <button
                type="button"
                onClick={handleReport}
                disabled={reported || sending}
                className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full transition-all ${
                    reported
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 cursor-default'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300 active:scale-95'
                }`}
                title={reported ? 'أبلغت سابقاً — شكراً لمساهمتك' : 'اضغط إن سجّلت عنوانك هنا بنجاح — يساعد الآخرين'}
            >
                {sending ? (
                    <Loader2 size={12} className="animate-spin" />
                ) : reported ? (
                    <CheckCircle2 size={12} />
                ) : (
                    <Users size={12} />
                )}
                {reported ? 'أبلغت — شكراً' : 'سجّلت هنا بنجاح؟'}
            </button>

            {/* Community count badge — only shows when ≥1 report exists */}
            {hasReports && (
                <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        nearThreshold
                            ? 'bg-emerald-500 text-white animate-pulse'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                    title={nearThreshold
                        ? `${count} أشخاص أبلّغوا — يُراجع الأدمن قريباً`
                        : `${count} شخص أبلّغ`
                    }
                >
                    <Users size={10} />
                    {count}
                    {nearThreshold && ' ← قيد المراجعة'}
                </span>
            )}
        </div>
    );
}
