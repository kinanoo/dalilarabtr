'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Users, Briefcase, MessageCircle, Star, Activity, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const LAST_VISIT_KEY = 'admin_last_visit_ts';

const EVENT_CONFIG: Record<string, { icon: typeof Users; bg: string; text: string; label: string }> = {
    new_member:  { icon: Users,         bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', label: 'عضو جديد' },
    new_service: { icon: Briefcase,     bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-600 dark:text-blue-400',       label: 'خدمة جديدة' },
    new_comment: { icon: MessageCircle, bg: 'bg-indigo-100 dark:bg-indigo-900/30',   text: 'text-indigo-600 dark:text-indigo-400',   label: 'تعليق جديد' },
    new_review:  { icon: Star,          bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-600 dark:text-amber-400',     label: 'تقييم جديد' },
};

type ActivityEvent = {
    id: string;
    event_type: string;
    title: string;
    detail: string | null;
    entity_id: string | null;
    entity_table: string | null;
    created_at: string;
};

export function AdminActivityFeed() {
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCount, setNewCount] = useState(0);
    const lastVisitRef = useRef<string | null>(null);

    useEffect(() => {
        const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
        lastVisitRef.current = lastVisit;

        fetchEvents(lastVisit);

        // Save current visit
        localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());

        // Subscribe to Realtime for live updates
        if (!supabase) return;
        const channel = supabase
            .channel('admin-activity-feed')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'admin_activity_log',
            }, (payload) => {
                const newEvent = payload.new as ActivityEvent;
                setEvents((prev) => [newEvent, ...prev]);
            })
            .subscribe();

        return () => { supabase?.removeChannel(channel); };
    }, []);

    async function fetchEvents(lastVisit: string | null) {
        if (!supabase) { setLoading(false); return; }

        const { data } = await supabase
            .from('admin_activity_log')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) {
            setEvents(data);
            if (lastVisit) {
                setNewCount(data.filter((e) => e.created_at > lastVisit).length);
            } else {
                setNewCount(data.length);
            }
        }
        setLoading(false);
    }

    function relativeTime(dateStr: string) {
        try {
            return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ar });
        } catch {
            return '';
        }
    }

    const lastVisit = lastVisitRef.current;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                        <Activity size={20} className="text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">سجل النشاط المباشر</h3>
                        <p className="text-xs text-slate-400">كل ما يحدث في الموقع لحظة بلحظة</p>
                    </div>
                </div>
                {newCount > 0 && (
                    <span className="bg-emerald-500 text-white text-xs font-black px-3 py-1.5 rounded-full animate-pulse">
                        {newCount} جديد
                    </span>
                )}
            </div>

            {/* Timeline */}
            <div className="max-h-[500px] overflow-y-auto">
                {loading ? (
                    <div className="text-center py-12 text-slate-400">
                        <Clock size={24} className="mx-auto mb-2 animate-spin" />
                        جاري التحميل...
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <Activity size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">لا يوجد نشاط مسجّل بعد</p>
                        <p className="text-xs mt-1">الأحداث ستظهر تلقائياً عند تسجيل أعضاء أو إضافة خدمات</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {events.map((event, i) => {
                            const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.new_comment;
                            const Icon = config.icon;
                            const isNew = lastVisit && event.created_at > lastVisit;

                            // Show "new since last visit" divider
                            const showDivider = lastVisit
                                && i > 0
                                && events[i - 1].created_at > lastVisit
                                && event.created_at <= lastVisit;

                            return (
                                <div key={event.id}>
                                    {showDivider && (
                                        <div className="flex items-center gap-3 px-5 py-2 bg-slate-50 dark:bg-slate-800/50">
                                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">آخر زيارة ↑</span>
                                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                        </div>
                                    )}
                                    <div className={`flex items-start gap-3 px-5 py-3.5 transition-colors ${isNew ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                                        <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                                            <Icon size={16} className={config.text} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={`text-[10px] font-bold ${config.text} ${config.bg} px-2 py-0.5 rounded`}>
                                                    {config.label}
                                                </span>
                                                {isNew && (
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                )}
                                            </div>
                                            <p className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-snug">
                                                {event.title}
                                            </p>
                                            {event.detail && (
                                                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">
                                                    {event.detail}
                                                </p>
                                            )}
                                            <p className="text-[11px] text-slate-300 dark:text-slate-600 mt-1">
                                                {relativeTime(event.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
