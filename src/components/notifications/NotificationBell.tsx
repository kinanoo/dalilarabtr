'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    fetchAllNotifications,
    initLastSeen,
    markGlobalAsSeen,
    markGlobalAsSeenUpTo,
    markPersonalAsRead,
    markOneAsRead,
    type Notification,
} from '@/lib/api/notifications';
import { supabase } from '@/lib/supabaseClient';
import NotificationItem from '@/components/notifications/NotificationItem';

type TabKey = 'all' | 'personal';

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>('all');
    const bellBtnRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // SSR safety
    useEffect(() => { setMounted(true); }, []);

    // Get current user ID for personal notifications
    useEffect(() => {
        if (!supabase) return;
        supabase.auth.getUser().then(({ data }) => {
            setUserId(data.user?.id ?? null);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUserId(session?.user?.id ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    // Stable loader that always uses current userId
    const loadNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAllNotifications(30, userId);
            setNotifications(data);
        } catch {
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Initialize last-seen timestamp on first visit
    useEffect(() => {
        initLastSeen();
        loadNotifications();
    }, [loadNotifications]);

    // Poll every 60 seconds — only while panel is open
    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, [isOpen, loadNotifications]);

    // Refresh when dropdown opens
    useEffect(() => {
        if (isOpen) loadNotifications();
    }, [isOpen, loadNotifications]);

    // Click outside to close
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

    // Escape key to close
    useEffect(() => {
        if (!isOpen) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') setIsOpen(false);
        }
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen]);

    // ── Derived counts ──
    const unreadGlobalCount = useMemo(
        () => notifications.filter(n => !n.is_personal && !n.is_read).length,
        [notifications],
    );
    const unreadPersonalCount = useMemo(
        () => notifications.filter(n => n.is_personal && !n.is_read).length,
        [notifications],
    );
    const totalUnread = unreadGlobalCount + unreadPersonalCount;

    // ── Filtered list based on active tab ──
    const filteredNotifications = useMemo(() => {
        if (activeTab === 'personal') return notifications.filter(n => n.is_personal);
        return notifications; // 'all' tab shows everything
    }, [notifications, activeTab]);

    // ── Mark all as read ──
    const handleMarkAllAsRead = async () => {
        // Global: localStorage
        markGlobalAsSeen();
        // Personal: database
        if (userId) {
            await markPersonalAsRead(userId);
        }
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    // ── Mark single as read ──
    const handleMarkAsRead = (notification: Notification) => {
        if (notification.is_read) return;
        if (notification.is_personal) {
            // Personal: persist to DB
            markOneAsRead(notification.id);
        } else {
            // Global: persist to localStorage (advance lastSeen to this notification's time)
            markGlobalAsSeenUpTo(notification.created_at);
        }
        setNotifications(prev =>
            prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n),
        );
    };

    // Calculate dropdown position based on bell button
    const getPanelStyle = useCallback((): React.CSSProperties => {
        if (!bellBtnRef.current) return { position: 'fixed', top: 64, left: 16, right: 16 };
        const rect = bellBtnRef.current.getBoundingClientRect();
        const vw = window.innerWidth;
        const isDesktop = vw >= 640;
        if (isDesktop) {
            const panelWidth = Math.min(380, vw - 32);
            let left = rect.left + rect.width / 2 - panelWidth / 2;
            if (left + panelWidth > vw - 16) left = vw - 16 - panelWidth;
            if (left < 16) left = 16;
            return { position: 'fixed', top: rect.bottom + 8, left, width: panelWidth };
        }
        return { position: 'fixed', top: rect.bottom + 8, left: 8, right: 8 };
    }, []);

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
                        className="fixed inset-0 z-[9998] sm:hidden bg-black/20 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    <motion.div
                        ref={panelRef}
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{
                            opacity: 1, scale: 1, y: 0,
                            transition: { type: 'spring', stiffness: 300, damping: 25 },
                        }}
                        exit={{
                            opacity: 0, scale: 0.95, y: -8,
                            transition: { duration: 0.15 },
                        }}
                        className="z-[9999] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[70vh] sm:max-h-[80vh] flex flex-col overflow-hidden"
                        style={{ ...getPanelStyle(), transformOrigin: 'top right' }}
                    >
                        {/* ── Header ── */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Bell size={18} className="text-emerald-600" />
                                الإشعارات
                                {totalUnread > 0 && (
                                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        {totalUnread}
                                    </span>
                                )}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                aria-label="إغلاق الإشعارات"
                                className="p-2 min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X size={16} className="text-slate-500" />
                            </button>
                        </div>

                        {/* ── Tabs (only for logged-in users) ── */}
                        {userId && (
                            <div className="flex border-b border-slate-200 dark:border-slate-800 px-2 pt-1">
                                <TabButton
                                    label="الكل"
                                    active={activeTab === 'all'}
                                    onClick={() => setActiveTab('all')}
                                />
                                <TabButton
                                    label="شخصي"
                                    active={activeTab === 'personal'}
                                    badge={unreadPersonalCount}
                                    onClick={() => setActiveTab('personal')}
                                />
                            </div>
                        )}

                        {/* ── Notifications List ── */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {loading && notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                    <span className="text-sm text-slate-500">جاري التحميل...</span>
                                </div>
                            ) : filteredNotifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="text-4xl mb-3">
                                        {activeTab === 'personal' ? '📭' : '🔕'}
                                    </div>
                                    <div className="text-slate-500 dark:text-slate-400 font-medium">
                                        {activeTab === 'personal'
                                            ? 'لا توجد إشعارات شخصية'
                                            : 'لا توجد إشعارات'}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        سنخبرك عندما يكون هناك جديد
                                    </div>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredNotifications.map((notification, index) => (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{
                                                opacity: 1, x: 0,
                                                transition: { delay: Math.min(index * 0.04, 0.5) },
                                            }}
                                        >
                                            <NotificationItem
                                                notification={notification}
                                                onMarkAsRead={() => handleMarkAsRead(notification)}
                                                onClose={() => setIsOpen(false)}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Footer ── */}
                        {totalUnread > 0 && (
                            <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={handleMarkAllAsRead}
                                    className="w-full py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <CheckCheck size={16} />
                                    تحديد الكل كمقروء
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <div className="relative">
                <button
                    type="button"
                    ref={bellBtnRef}
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 hover:text-emerald-700"
                    aria-label="الإشعارات"
                    aria-expanded={isOpen ? 'true' : 'false'}
                    aria-haspopup="true"
                >
                    <Bell size={18} />

                    <AnimatePresence>
                        {totalUnread > 0 && (
                            <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ring-2 ring-white dark:ring-slate-950"
                            >
                                {totalUnread > 9 ? '9+' : totalUnread}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>

            {mounted && createPortal(dropdown, document.body)}
        </>
    );
}

// ── Tab Button ──
function TabButton({ label, active, badge, onClick }: {
    label: string;
    active: boolean;
    badge?: number;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold transition-colors ${
                active
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
        >
            {label}
            {!!badge && badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                    {badge > 9 ? '9+' : badge}
                </span>
            )}
            {active && (
                <motion.div
                    layoutId="notif-tab-indicator"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
            )}
        </button>
    );
}
