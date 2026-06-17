'use client';

/**
 * /admin/zones — live zone editor with crowdsourced reports queue.
 *
 * Three things this page does:
 *   1. Surfaces zones that need attention FIRST — community_reopened_count ≥ 3
 *      pinned at top with a flame badge. The admin sees "12 people reported
 *      this is open" and can flip with one click after verifying.
 *   2. Lets the admin search + filter the entire ~1000-row table by city,
 *      status, and free text. No SQL editor needed.
 *   3. One-click status flip — POST to /api/admin/zone-flip, optimistic UI,
 *      audit-logged server-side.
 *
 * Replaces the older ZonesManager that talked to a 'restricted_zones'
 * table that no longer matches the schema we evolved into.
 */

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    MapPin,
    Loader2,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    Flame,
    Users,
    Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

type ZoneStatus = 'closed' | 'reopened' | 'pending';

interface ZoneRow {
    id: string;
    city: string;
    district: string;
    neighborhood: string;
    status: ZoneStatus | string;
    reopened_at: string | null;
    community_reopened_count: number;
    community_closed_count: number;
}

const REPORT_THRESHOLD = 3;

export default function AdminZonesPage() {
    const [zones, setZones] = useState<ZoneRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCity, setFilterCity] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<'all' | ZoneStatus>('all');
    const [search, setSearch] = useState('');
    const [busyId, setBusyId] = useState<string | null>(null);

    async function fetchZones() {
        if (!supabase) return;
        setLoading(true);
        // Fetch in chunks because the table has 1000+ rows and the default
        // PostgREST limit is 1000.
        const ZONE_COLS =
            'id, city, district, neighborhood, status, reopened_at, community_reopened_count, community_closed_count';
        let all: ZoneRow[] = [];
        const step = 1000;
        let from = 0;
        while (true) {
            const { data, error } = await supabase
                .from('zones')
                .select(ZONE_COLS)
                .order('community_reopened_count', { ascending: false })
                .order('city', { ascending: true })
                .range(from, from + step - 1);
            if (error) {
                toast.error('فشل التحميل: ' + error.message);
                break;
            }
            if (!data || data.length === 0) break;
            all = [...all, ...(data as unknown as ZoneRow[])];
            if (data.length < step) break;
            from += step;
        }
        setZones(all);
        setLoading(false);
    }

    useEffect(() => {
        void fetchZones();
    }, []);

    // List of cities for the dropdown — derived from the loaded data so we
    // always show only cities that actually have rows.
    const cityOptions = useMemo(() => {
        const set = new Set(zones.map((z) => z.city));
        return Array.from(set).sort();
    }, [zones]);

    // Stats for the top counter strip.
    const stats = useMemo(() => {
        let closed = 0, reopened = 0, pending = 0, flagged = 0;
        for (const z of zones) {
            if (z.status === 'closed') closed++;
            else if (z.status === 'reopened') reopened++;
            else if (z.status === 'pending') pending++;
            if (z.community_reopened_count >= REPORT_THRESHOLD) flagged++;
        }
        return { closed, reopened, pending, flagged, total: zones.length };
    }, [zones]);

    // Apply filters + put flagged-for-review rows at the top.
    const visible = useMemo(() => {
        const q = search.trim().toLocaleLowerCase('tr');
        let rows = zones.filter((z) => {
            if (filterCity && z.city !== filterCity) return false;
            if (filterStatus !== 'all' && z.status !== filterStatus) return false;
            if (q) {
                const text = `${z.neighborhood} ${z.district} ${z.city}`.toLocaleLowerCase('tr');
                if (!text.includes(q)) return false;
            }
            return true;
        });
        rows = rows.sort((a, b) => {
            const aFlag = a.community_reopened_count >= REPORT_THRESHOLD ? 1 : 0;
            const bFlag = b.community_reopened_count >= REPORT_THRESHOLD ? 1 : 0;
            if (aFlag !== bFlag) return bFlag - aFlag;
            return b.community_reopened_count - a.community_reopened_count;
        });
        return rows;
    }, [zones, filterCity, filterStatus, search]);

    async function flip(zoneId: string, newStatus: ZoneStatus) {
        if (busyId) return;
        setBusyId(zoneId);
        try {
            const res = await fetch('/api/admin/zone-flip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ zoneId, newStatus }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error('فشل: ' + (payload?.error || 'unknown'));
                return;
            }
            toast.success(
                newStatus === 'reopened'
                    ? 'تمّ فتح المنطقة'
                    : newStatus === 'pending'
                        ? 'تمّ وضع المنطقة قيد التحديث'
                        : 'تمّ إغلاق المنطقة'
            );
            setZones((prev) =>
                prev.map((z) =>
                    z.id === zoneId
                        ? {
                            ...z,
                            status: newStatus,
                            reopened_at: newStatus === 'reopened' ? new Date().toISOString() : null,
                            community_reopened_count: 0,
                            community_closed_count: 0,
                        }
                        : z
                )
            );
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className="p-6 max-w-7xl mx-auto pb-32 space-y-6">
            <AdminPageHeader
                icon={MapPin}
                theme="emerald"
                title="إدارة المناطق"
                subtitle="ابحث، فلتر، وحدّث حالة الأحياء المغلقة والمفتوحة بنقرة. البلاغات المجتمعية تظهر أعلى القائمة."
                eyebrow="خرائط"
                actions={
                    stats.flagged > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-l from-orange-500 to-amber-500 text-white rounded-full text-xs font-black shadow-md shadow-orange-500/30 animate-pulse">
                            <Flame size={12} />
                            <span className="tabular-nums" dir="ltr">{stats.flagged}</span>
                            <span>للمراجعة</span>
                        </span>
                    ) : null
                }
            />

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                <StatCard label="الإجمالي" value={stats.total} accent="slate" />
                <StatCard label="مغلقة" value={stats.closed} accent="rose" icon={XCircle} />
                <StatCard label="فُتحت حديثاً" value={stats.reopened} accent="emerald" icon={CheckCircle2} />
                <StatCard label="قيد التحديث" value={stats.pending} accent="amber" icon={Clock} />
                <StatCard label="بلاغات للمراجعة" value={stats.flagged} accent="orange" icon={Flame} pulse={stats.flagged > 0} />
            </div>

            {stats.flagged > 0 && (
                <div className="mb-6 relative overflow-hidden rounded-2xl border-2 border-orange-300 dark:border-orange-700 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/10 p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-500 text-white rounded-xl shrink-0 animate-pulse">
                            <Flame size={20} />
                        </div>
                        <div>
                            <h2 className="font-black text-orange-900 dark:text-orange-200 text-lg leading-tight">
                                {stats.flagged} منطقة بحاجة لمراجعة
                            </h2>
                            <p className="text-sm text-orange-800 dark:text-orange-300 mt-1 leading-relaxed">
                                {REPORT_THRESHOLD}+ مستخدمين أبلّغوا أنّ هذه المناطق فُتحت فعلياً. راجع وقرّر الفتح أو الإبقاء.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ابحث: حي / منطقة / ولاية..."
                        className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <select
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="">كل الولايات</option>
                    {cityOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-1">
                    <Filter size={14} className="text-slate-400 mx-2" />
                    {(['all', 'closed', 'reopened', 'pending'] as const).map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setFilterStatus(s)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                filterStatus === s
                                    ? 'bg-emerald-600 text-white'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {s === 'all' ? 'الكلّ' : s === 'closed' ? 'مغلقة' : s === 'reopened' ? 'مفتوحة' : 'قيد التحديث'}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                    <Loader2 size={28} className="animate-spin" />
                </div>
            ) : visible.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800">
                    <MapPin size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-500 dark:text-slate-400">لا توجد مناطق تطابق الفلاتر.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    <p className="text-xs text-slate-400 mb-3 tabular-nums">
                        عرض {Math.min(visible.length, 200).toLocaleString('en-US')} من أصل {visible.length.toLocaleString('en-US')} نتيجة (من {zones.length.toLocaleString('en-US')} منطقة كلّياً)
                    </p>
                    {visible.slice(0, 200).map((z) => (
                        <ZoneRowItem
                            key={z.id}
                            z={z}
                            busy={busyId === z.id}
                            onFlip={(s) => flip(z.id, s)}
                        />
                    ))}
                    {visible.length > 200 && (
                        <div className="text-center text-xs text-slate-400 py-4">
                            ... و{(visible.length - 200).toLocaleString('en-US')} منطقة أخرى. ضيّق البحث.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    accent,
    icon: Icon,
    pulse,
}: {
    label: string;
    value: number;
    accent: 'slate' | 'rose' | 'emerald' | 'amber' | 'orange';
    icon?: typeof CheckCircle2;
    pulse?: boolean;
}) {
    const accentClasses = {
        slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200',
        rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
        emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
        amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
        orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    }[accent];
    return (
        <div className={`rounded-xl p-3 flex items-center gap-2.5 ${pulse ? 'animate-pulse' : ''} ${accentClasses}`}>
            {Icon && <Icon size={20} className="shrink-0" />}
            <div className="min-w-0">
                <div className="text-xl font-black tabular-nums leading-none">{value.toLocaleString('en-US')}</div>
                <div className="text-[10px] font-bold mt-1 leading-none">{label}</div>
            </div>
        </div>
    );
}

function ZoneRowItem({
    z,
    busy,
    onFlip,
}: {
    z: ZoneRow;
    busy: boolean;
    onFlip: (status: ZoneStatus) => void;
}) {
    const isFlagged = z.community_reopened_count >= REPORT_THRESHOLD;
    const tone = z.status === 'reopened' ? 'emerald' : z.status === 'pending' ? 'amber' : 'rose';
    const Icon = tone === 'emerald' ? CheckCircle2 : tone === 'amber' ? Clock : XCircle;
    const toneText =
        tone === 'emerald' ? 'text-emerald-700 dark:text-emerald-400'
        : tone === 'amber' ? 'text-amber-700 dark:text-amber-400'
        : 'text-rose-700 dark:text-rose-400';

    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-xl border bg-white dark:bg-slate-900 ${
                isFlagged
                    ? 'border-orange-300 dark:border-orange-700 ring-2 ring-orange-200 dark:ring-orange-900/40'
                    : 'border-slate-200 dark:border-slate-800'
            }`}
        >
            <Icon size={18} className={`shrink-0 ${toneText}`} />
            <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {z.neighborhood}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {z.city} · {z.district}
                </div>
            </div>
            {z.community_reopened_count > 0 && (
                <span
                    className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full whitespace-nowrap ${
                        isFlagged
                            ? 'bg-orange-500 text-white animate-pulse'
                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                    }`}
                    title={`${z.community_reopened_count} مستخدم أبلّغ أنّها فُتحت`}
                >
                    <Users size={10} />
                    {z.community_reopened_count}
                    {isFlagged && ' للمراجعة'}
                </span>
            )}
            <div className="flex items-center gap-1 shrink-0">
                {z.status !== 'reopened' && (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => onFlip('reopened')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg disabled:opacity-50 transition-colors"
                        title="افتح هذه المنطقة"
                    >
                        {busy ? <Loader2 size={10} className="animate-spin" /> : 'افتح'}
                    </button>
                )}
                {z.status !== 'closed' && (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => onFlip('closed')}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg disabled:opacity-50 transition-colors"
                        title="أغلق هذه المنطقة"
                    >
                        أغلق
                    </button>
                )}
                {z.status !== 'pending' && (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => onFlip('pending')}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg disabled:opacity-50 transition-colors"
                        title="ضع تحت المراجعة"
                    >
                        مراجعة
                    </button>
                )}
            </div>
        </div>
    );
}
