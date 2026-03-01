'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import {
    getAllNotifications,
    markAsRead,
    markAllAsRead,
    getUserIdentifier,
    type Notification,
} from '@/lib/api/notifications';
import NotificationItem from '@/components/notifications/NotificationItem';

const READ_IDS_KEY = 'daleel_read_notifications';

/** Persist read notification IDs in localStorage as fallback */
function getLocalReadIds(): Set<string> {
    try {
        const raw = localStorage.getItem(READ_IDS_KEY);
        if (raw) return new Set(JSON.parse(raw));
    } catch { /* ignore */ }
    return new Set();
}

function addLocalReadIds(ids: string[]) {
    try {
        const existing = getLocalReadIds();
        ids.forEach(id => existing.add(id));
        // Keep only last 200 IDs to prevent unbounded growth
        const arr = [...existing].slice(-200);
        localStorage.setItem(READ_IDS_KEY, JSON.stringify(arr));
    } catch { /* ignore */ }
}

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const bellBtnRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // SSR safety — only render portal after mount
    useEffect(() => { setMounted(true); }, []);

    // Resolve auth user ID on mount and cache it for getUserIdentifier()
    useEffect(() => {
        if (!supabase) return;
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                sessionStorage.setItem('notification_auth_id', data.user.id);
            } else {
                sessionStorage.removeItem('notification_auth_id');
            }
            loadNotifications();
        });
    }, []);

    // Poll every 60 seconds
    useEffect(() => {
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Load notifications when dropdown opens (refresh)
    useEffect(() => {
        if (isOpen) loadNotifications();
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

    // Escape key to close
    useEffect(() => {
        if (!isOpen) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') setIsOpen(false);
        }
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen]);

    const loadNotifications = async () => {
        setLoading(true);
        const userId = getUserIdentifier();
        const { data } = await getAllNotifications(userId, 30);

        // Merge with localStorage read IDs as fallback
        // (in case DB reads failed previously)
        const localReadIds = getLocalReadIds();
        const merged = data.map(n => ({
            ...n,
            is_read: n.is_read || localReadIds.has(n.id),
        }));

        setNotifications(merged);
        setLoading(false);
    };

    // Mark a single notification as read
    const handleMarkAsRead = async (notificationId: string) => {
        const notification = notifications.find(n => n.id === notificationId);
        if (!notification || notification.is_read) return;

        const userId = getUserIdentifier();
        const { success } = await markAsRead(notificationId, userId);

        // Always save to localStorage as fallback
        addLocalReadIds([notificationId]);

        if (success) {
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
        }
    };

    // Mark all as read
    const handleMarkAllAsRead = async () => {
        const userId = getUserIdentifier();
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);

        if (unreadIds.length === 0) return;

        // Always save to localStorage as fallback
        addLocalReadIds(unreadIds);

        await markAllAsRead(userId, unreadIds);

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;
    const unreadInList = unreadCount;

    // Calculate dropdown position based on bell button
    const getPanelStyle = useCallback((): React.CSSProperties => {
        if (!bellBtnRef.current) return { position: 'fixed', top: 64, left: 16, right: 16 };
        const rect = bellBtnRef.current.getBoundingClientRect();
        const isDesktop = window.innerWidth >= 640;
        if (isDesktop) {
            return {
                position: 'fixed',
                top: rect.bottom + 8,
                right: Math.max(window.innerWidth - rect.right, 16),
                width: 380,
                maxWidth: 'calc(100vw - 2rem)',
            };
        }
        // Mobile: full width with margins
        return { position: 'fixed', top: rect.bottom + 8, left: 16, right: 16 };
    }, []);

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
                        className="fixed inset-0 z-[9998] sm:hidden bg-black/20 backdrop-blur-sm"
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
                        className="z-[9999] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[70vh] sm:max-h-[80vh] flex flex-col overflow-hidden"
                        style={{ ...getPanelStyle(), transformOrigin: 'top right' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Bell size={18} className="text-emerald-600" />
                                الإشعارات
                                {unreadInList > 0 && (
                                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        {unreadInList}
                                    </span>
                                )}
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X size={16} className="text-slate-500" />
                            </button>
                        </div>

                        {/* Notifications List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                    <span className="text-sm text-slate-500">جاري التحميل...</span>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="text-4xl mb-3">🔕</div>
                                    <div className="text-slate-500 dark:text-slate-400 font-medium">
                                        لا توجد إشعارات
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        سنخبرك عندما يكون هناك جديد
                                    </div>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {notifications.map((notification, index) => (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{
                                                opacity: 1,
                                                x: 0,
                                                transition: { delay: Math.min(index * 0.04, 0.5) },
                                            }}
                                        >
                                            <NotificationItem
                                                notification={notification}
                                                onMarkAsRead={() => handleMarkAsRead(notification.id)}
                                                onClose={() => setIsOpen(false)}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer — show "mark all" only when there are unread items */}
                        {unreadInList > 0 && (
                            <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                                <button
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
                {/* Bell Button */}
                <button
                    ref={bellBtnRef}
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 hover:text-emerald-700"
                    aria-label="الإشعارات"
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                >
                    <Bell size={18} />

                    {/* Animated Badge */}
                    <AnimatePresence>
                        {unreadCount > 0 && (
                            <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ring-2 ring-white dark:ring-slate-950"
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
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
