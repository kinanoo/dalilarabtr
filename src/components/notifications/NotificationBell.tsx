'use client';

import { useEffect, useState, useRef } from 'react';
import { Bell, X, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';
import {
    getUnreadCount,
    getAllNotifications,
    markAsRead,
    markAllAsRead,
    getUserIdentifier,
    type Notification,
} from '@/lib/api/notifications';
import NotificationItem from '@/components/notifications/NotificationItem';

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);

    // Resolve auth user ID on mount and cache it for getUserIdentifier()
    useEffect(() => {
        const sb = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        sb.auth.getUser().then(({ data }) => {
            if (data.user) {
                sessionStorage.setItem('notification_auth_id', data.user.id);
            } else {
                sessionStorage.removeItem('notification_auth_id');
            }
            loadUnreadCount();
        });
    }, []);

    // Poll every 60 seconds
    useEffect(() => {
        const interval = setInterval(loadUnreadCount, 60000);
        return () => clearInterval(interval);
    }, []);

    // Load all notifications when dropdown opens
    useEffect(() => {
        if (isOpen) loadNotifications();
    }, [isOpen]);

    // Click outside to close
    useEffect(() => {
        if (!isOpen) return;
        function handleClickOutside(e: MouseEvent) {
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
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

    const loadUnreadCount = async () => {
        const userId = getUserIdentifier();
        const { count } = await getUnreadCount(userId);
        setUnreadCount(count);
    };

    const loadNotifications = async () => {
        setLoading(true);
        const userId = getUserIdentifier();
        const { data } = await getAllNotifications(userId, 30);
        setNotifications(data);
        setLoading(false);
    };

    // Mark a single notification as read (keep it in the list, just update its state)
    const handleMarkAsRead = async (notificationId: string) => {
        const notification = notifications.find(n => n.id === notificationId);
        if (!notification || notification.is_read) return; // Already read, skip

        const userId = getUserIdentifier();
        await markAsRead(notificationId, userId);

        // Update local state: mark as read, don't remove
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    // Mark all as read — keep items, just clear unread state
    const handleMarkAllAsRead = async () => {
        const userId = getUserIdentifier();
        await markAllAsRead(userId);

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const unreadInList = notifications.filter(n => !n.is_read).length;

    return (
        <div className="relative" ref={bellRef}>
            {/* Bell Button */}
            <button
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

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Mobile backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-40 sm:hidden bg-black/20 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
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
                            className="absolute end-0 mt-3 w-[360px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 max-h-[80vh] flex flex-col overflow-hidden"
                            style={{ transformOrigin: 'top right' }}
                        >
                            {/* Decorative arrow */}
                            <div className="absolute -top-2 right-4 w-4 h-4 bg-white dark:bg-slate-900 rotate-45 border-l border-t border-slate-200 dark:border-slate-800 z-0" />

                            {/* Header */}
                            <div className="relative z-10 flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900">
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
                            <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar">
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
                                                    transition: { delay: index * 0.04 },
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
                                <div className="relative z-10 p-3 border-t border-slate-200 dark:border-slate-800">
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
        </div>
    );
}
