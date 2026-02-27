'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Users, Briefcase, MessageCircle, Star, Activity, Clock, ChevronDown, FileText, HelpCircle, Shield, Wrench, Megaphone, MapPin, BrainCircuit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

const LAST_VISIT_KEY = 'admin_last_visit_ts';
const COLLAPSED_KEY = 'admin_activity_collapsed';

const EVENT_CONFIG: Record<string, { icon: typeof Users; bg: string; text: string; label: string }> = {
    new_member:   { icon: Users,         bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', label: 'عضو جديد' },
    new_service:  { icon: Briefcase,     bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-600 dark:text-blue-400',       label: 'خدمة جديدة' },
    new_comment:  { icon: MessageCircle, bg: 'bg-indigo-100 dark:bg-indigo-900/30',   text: 'text-indigo-600 dark:text-indigo-400',   label: 'تعليق جديد' },
    new_review:   { icon: Star,          bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-600 dark:text-amber-400',     label: 'تقييم جديد' },
    new_scenario: { icon: BrainCircuit,  bg: 'bg-violet-100 dark:bg-violet-900/30',   text: 'text-violet-600 dark:text-violet-400',   label: 'سيناريو' },
    new_article:  { icon: FileText,      bg: 'bg-sky-100 dark:bg-sky-900/30',         text: 'text-sky-600 dark:text-sky-400',         label: 'مقال' },
    new_faq:      { icon: HelpCircle,    bg: 'bg-orange-100 dark:bg-orange-900/30',   text: 'text-orange-600 dark:text-orange-400',   label: 'سؤال شائع' },
    new_code:     { icon: Shield,        bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-600 dark:text-red-400',         label: 'كود أمان' },
    new_tool:     { icon: Wrench,        bg: 'bg-teal-100 dark:bg-teal-900/30',       text: 'text-teal-600 dark:text-teal-400',       label: 'أداة' },
    new_update:   { icon: Megaphone,     bg: 'bg-pink-100 dark:bg-pink-900/30',       text: 'text-pink-600 dark:text-pink-400',       label: 'تحديث' },
    new_zone:     { icon: MapPin,        bg: 'bg-cyan-100 dark:bg-cyan-900/30',       text: 'text-cyan-600 dark:text-cyan-400',       label: 'منطقة' },
};

// Map entity_table to admin route
function getActivityLink(event: ActivityEvent): string | null {
    switch (event.entity_table) {
        case 'member_profiles': return '/admin/members';
        case 'service_providers': return '/admin/requests';
        case 'comments': return '/admin/community';
        case 'service_reviews': return '/admin/reviews';
        case 'consultant_scenarios': return '/admin/scenarios';
        case 'articles': return '/admin/articles';
        case 'faqs': return '/admin/faqs';
        case 'security_codes': return '/admin/codes';
        case 'tools_registry': return '/admin/settings';
        case 'admin_updates': return '/admin/updates';
        case 'zones': return '/admin/zones';
        case 'banners': return '/admin/banners';
        default: return null;
    }
}

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
    const [collapsed, setCollapsed] = useState(false);
    const lastVisitRef = useRef<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Restore collapsed state
        const saved = localStorage.getItem(COLLAPSED_KEY);
        if (saved === 'true') setCollapsed(true);

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

    function toggleCollapsed() {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem(COLLAPSED_KEY, String(next));
    }

    function handleClick(event: ActivityEvent) {
        const link = getActivityLink(event);
        if (link) router.push(link);
    }

    const lastVisit = lastVisitRef.current;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Header — clickable to toggle */}
            <button
                onClick={toggleCollapsed}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                        <Activity size={16} className="text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="text-right">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">سجل النشاط</h3>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {newCount > 0 && (
                        <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                            {newCount} جديد
                        </span>
                    )}
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`} />
                </div>
            </button>

            {/* Timeline — collapsible */}
            {!collapsed && (
                <div className="max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-8 text-slate-400">
                            <Clock size={18} className="mx-auto mb-1 animate-spin" />
                            <span className="text-xs">جاري التحميل...</span>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <Activity size={24} className="mx-auto mb-1 opacity-30" />
                            <p className="text-xs">لا يوجد نشاط مسجّل بعد</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {events.map((event, i) => {
                                const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.new_comment;
                                const Icon = config.icon;
                                const isNew = lastVisit && event.created_at > lastVisit;
                                const link = getActivityLink(event);

                                // Show "new since last visit" divider
                                const showDivider = lastVisit
                                    && i > 0
                                    && events[i - 1].created_at > lastVisit
                                    && event.created_at <= lastVisit;

                                return (
                                    <div key={event.id}>
                                        {showDivider && (
                                            <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 dark:bg-slate-800/50">
                                                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">آخر زيارة</span>
                                                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                            </div>
                                        )}
                                        <div
                                            onClick={() => handleClick(event)}
                                            className={`flex items-center gap-2.5 px-4 py-2.5 transition-colors ${link ? 'cursor-pointer' : ''} ${
                                                isNew
                                                    ? 'bg-emerald-50/50 dark:bg-emerald-950/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                                            }`}
                                        >
                                            <div className={`w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                                                <Icon size={14} className={config.text} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                                                        {event.title}
                                                    </p>
                                                    {isNew && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                    )}
                                                </div>
                                                {event.detail && (
                                                    <p className="text-[11px] text-slate-400 truncate">{event.detail}</p>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-slate-300 dark:text-slate-600 whitespace-nowrap shrink-0">
                                                {relativeTime(event.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
