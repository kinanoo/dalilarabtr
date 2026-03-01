'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabaseClient';
import {
    Users, Briefcase, MessageCircle, Star, Activity, X,
    FileText, HelpCircle, Shield, Wrench, Megaphone, MapPin, BrainCircuit,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const LAST_VISIT_KEY = 'admin_last_visit_ts';

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

export function AdminActivityBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCount, setNewCount] = useState(0);
    const [mounted, setMounted] = useState(false);
    const lastVisitRef = useRef<string | null>(null);
    const bellBtnRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // SSR safety — only render portal after mount
    useEffect(() => { setMounted(true); }, []);

    // Fetch events + subscribe to realtime
    useEffect(() => {
        const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
        lastVisitRef.current = lastVisit;

        fetchEvents(lastVisit);

        if (!supabase) return;
        const channel = supabase
            .channel('admin-activity-bell')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'admin_activity_log',
            }, (payload) => {
                const newEvent = payload.new as ActivityEvent;
                setEvents((prev) => [newEvent, ...prev]);
                setNewCount((prev) => prev + 1);
            })
            .subscribe();

        return () => { supabase?.removeChannel(channel); };
    }, []);

    // When dropdown opens: mark as seen
    useEffect(() => {
        if (isOpen) {
            const now = new Date().toISOString();
            localStorage.setItem(LAST_VISIT_KEY, now);
            setNewCount(0);
        }
    }, [isOpen]);

    // Click outside to close — check both bell button and panel
    useEffect(() => {
        if (!isOpen) return;
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node;
            if (
                bellBtnRef.current && !bellBtnRef.current.contains(target) &&
                (!panelRef.current || !panelRef.current.contains(target))
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Escape to close
    useEffect(() => {
        if (!isOpen) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') setIsOpen(false);
        }
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen]);

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

    function handleEventClick(event: ActivityEvent) {
        const link = getActivityLink(event);
        if (link) router.push(link);
        setIsOpen(false);
    }

    // Calculate dropdown position based on bell button
    const getPanelStyle = useCallback((): React.CSSProperties => {
        if (!bellBtnRef.current) return { position: 'fixed', top: 64, left: 16, right: 16 };
        const rect = bellBtnRef.current.getBoundingClientRect();
        const isDesktop = window.innerWidth >= 1280;
        if (isDesktop) {
            const panelWidth = 380;
            // Position to the left of the bell (sidebar is on the right in RTL)
            let left = rect.left - panelWidth - 8;
            // If it overflows left edge, position below the bell aligned to its right edge
            if (left < 16) {
                left = 16;
            }
            return {
                position: 'fixed',
                top: Math.min(rect.bottom + 8, window.innerHeight - 500),
                left,
                width: panelWidth,
            };
        }
        // Mobile: full width with margins, below header
        return { position: 'fixed', top: 56, left: 8, right: 8 };
    }, []);

    const lastVisit = lastVisitRef.current;

    // Dropdown content rendered via Portal
    const dropdown = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Mobile backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9998] xl:hidden bg-black/30 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    <motion.div
                        ref={panelRef}
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            transition: { type: 'spring', stiffness: 300, damping: 25 },
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0.95,
                            y: -8,
                            transition: { duration: 0.15 },
                        }}
                        className="z-[9999] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[70vh] xl:max-h-[80vh] flex flex-col overflow-hidden"
                        style={{ ...getPanelStyle(), transformOrigin: 'top right' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-br from-violet-50/50 to-white dark:from-violet-950/20 dark:to-slate-900">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Activity size={18} className="text-violet-600" />
                                سجل النشاط
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X size={16} className="text-slate-500" />
                            </button>
                        </div>

                        {/* Event List */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                    <span className="text-sm text-slate-500">جاري التحميل...</span>
                                </div>
                            ) : events.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Activity size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">لا يوجد نشاط مسجّل بعد</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {events.map((event, index) => {
                                        const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.new_comment;
                                        const Icon = config.icon;
                                        const isNew = lastVisit && event.created_at > lastVisit;
                                        const link = getActivityLink(event);

                                        return (
                                            <motion.div
                                                key={event.id}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{
                                                    opacity: 1,
                                                    x: 0,
                                                    transition: { delay: Math.min(index * 0.03, 0.5) },
                                                }}
                                            >
                                                <div
                                                    onClick={() => handleEventClick(event)}
                                                    className={`flex items-center gap-2.5 px-4 py-3 transition-colors border-r-[3px] ${
                                                        link ? 'cursor-pointer' : ''
                                                    } ${
                                                        isNew
                                                            ? 'bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100/80 dark:hover:bg-blue-950/30 border-r-blue-500'
                                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/30 border-r-transparent opacity-60'
                                                    }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                                                        <Icon size={15} className={config.text} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className={`text-xs truncate ${isNew ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400'}`}>
                                                                {event.title}
                                                            </p>
                                                            {isNew && (
                                                                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
                                                            )}
                                                        </div>
                                                        {event.detail && (
                                                            <p className={`text-[11px] truncate ${isNew ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600'}`}>{event.detail}</p>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-600 whitespace-nowrap shrink-0">
                                                        {relativeTime(event.created_at)}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <div className="relative">
                {/* Bell Button */}
                <button
                    ref={bellBtnRef}
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                    aria-label="سجل النشاط"
                    title="سجل النشاط"
                >
                    <Activity size={18} />

                    <AnimatePresence>
                        {newCount > 0 && (
                            <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ring-2 ring-[#0f172a]"
                            >
                                {newCount > 9 ? '9+' : newCount}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>

            {/* Portal: render dropdown at document.body level — escapes ALL stacking contexts */}
            {mounted && createPortal(dropdown, document.body)}
        </>
    );
}
