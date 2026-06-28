'use client';

/**
 * LiveActivityFeed — a compact, always-live "what's happening on the site
 * right now" stream embedded directly on the admin dashboard home, so the
 * owner can lead from it without opening the bell dropdown.
 *
 * Reads the last ~10 rows of admin_activity_log and stays current via a
 * Supabase realtime subscription (INSERTs) plus a 45s safety poll. Each row
 * deep-links to the relevant admin section when the entity is known.
 *
 * Admin audit item #2 (command-center liveness). Read-only; no DB change.
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
    Activity, FileText, MessageCircle, UserPlus, Star, Megaphone,
    Briefcase, ShieldAlert, MapPin, Newspaper, Radio,
} from 'lucide-react';

interface ActivityEvent {
    id: string;
    event_type: string | null;
    title: string | null;
    detail: string | null;
    created_at: string | null;
    entity_table: string | null;
    entity_id: string | null;
}

const CONFIG: Record<string, { icon: typeof Activity; cls: string; label: string }> = {
    new_article: { icon: FileText, cls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'مقال جديد' },
    new_comment: { icon: MessageCircle, cls: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', label: 'تعليق جديد' },
    new_member: { icon: UserPlus, cls: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', label: 'عضو جديد' },
    new_review: { icon: Star, cls: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400', label: 'تقييم جديد' },
    new_service: { icon: Briefcase, cls: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400', label: 'خدمة جديدة' },
    new_update: { icon: Megaphone, cls: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400', label: 'تحديث جديد' },
    new_question: { icon: MessageCircle, cls: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400', label: 'سؤال جديد' },
    new_request: { icon: ShieldAlert, cls: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', label: 'طلب جديد' },
    new_zone_report: { icon: MapPin, cls: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400', label: 'بلاغ منطقة' },
    push_broadcast: { icon: Radio, cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', label: 'بثّ إشعار' },
    ticker: { icon: Newspaper, cls: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', label: 'شريط الأخبار' },
};
const FALLBACK = { icon: Activity, cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400', label: 'نشاط' };

// Only INBOUND events that may need the admin to act — NOT the admin's own
// publishing (new_article / new_update / push_broadcast / ticker), which is
// noise to the person who just did it. Keeps the home short + useful.
const ACTIONABLE = new Set([
    'new_member', 'new_comment', 'new_review', 'new_question',
    'new_request', 'new_zone_report', 'new_service',
]);

const TABLE_ROUTE: Record<string, string> = {
    articles: '/admin/articles',
    comments: '/admin/community',
    member_profiles: '/admin/members',
    reviews: '/admin/reviews',
    content_votes: '/admin/reviews',
    service_providers: '/admin/services',
    services: '/admin/services',
    updates: '/admin/updates',
    questions: '/admin/questions',
    service_requests: '/admin/requests',
    notifications: '/admin/push-broadcast',
    zone_reports: '/admin/zones',
};

function timeAgo(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} د`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `منذ ${hrs} س`;
    return `منذ ${Math.floor(hrs / 24)} يوم`;
}

export default function LiveActivityFeed() {
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!supabase) { setLoading(false); return; }
        try {
            const { data } = await supabase
                .from('admin_activity_log')
                .select('id, event_type, title, detail, created_at, entity_table, entity_id')
                .order('created_at', { ascending: false })
                .limit(40);
            const rows = ((data as ActivityEvent[]) || []).filter((e) => e.event_type && ACTIONABLE.has(e.event_type));
            setEvents(rows.slice(0, 6));
        } catch { /* best-effort */ }
        setLoading(false);
    }, []);

    useEffect(() => {
        void load();
        // Stay live: realtime INSERTs + a 45s safety poll (in case the
        // realtime channel drops). Both just re-pull the latest 10.
        const channel = supabase
            ?.channel('admin_live_feed')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_activity_log' }, () => void load())
            .subscribe();
        const id = setInterval(() => void load(), 45000);
        return () => {
            if (channel) supabase?.removeChannel(channel);
            clearInterval(id);
        };
    }, [load]);

    return (
        <div>
            <h2 className="text-[11px] font-black text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1.5 tracking-[0.2em] uppercase">
                <span className="relative inline-flex items-center justify-center w-2 h-2">
                    <span className="absolute inline-flex w-2 h-2 rounded-full bg-rose-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex w-2 h-2 rounded-full bg-rose-500" />
                </span>
                جديد يحتاج متابعتك
            </h2>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-sm text-slate-400">… جاري التحميل</div>
                ) : events.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
                        <Activity size={24} className="text-emerald-300" />
                        كل شيء تحت السيطرة — لا جديد يحتاج متابعتك.
                    </div>
                ) : (
                    events.map((e) => {
                        const c = (e.event_type && CONFIG[e.event_type]) || FALLBACK;
                        const route = e.entity_table ? TABLE_ROUTE[e.entity_table] : undefined;
                        const Icon = c.icon;
                        const Row = (
                            <div className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <span className={`shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg ${c.cls}`}>
                                    <Icon size={15} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{e.title || c.label}</p>
                                        <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">{timeAgo(e.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-bold text-slate-400">{c.label}</span>
                                        {e.detail && <span className="text-xs text-slate-500 dark:text-slate-400 truncate">— {e.detail}</span>}
                                    </div>
                                </div>
                            </div>
                        );
                        return route ? (
                            <Link key={e.id} href={route} className="block">{Row}</Link>
                        ) : (
                            <div key={e.id}>{Row}</div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
