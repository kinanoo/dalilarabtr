'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { getUnreadCount, getUnreadNotifications, markAsRead, markAllAsRead, getUserIdentifier, type Notification } from '@/lib/api/notifications';
import NotificationItem from '@/components/notifications/NotificationItem';

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUnreadCount();

        // تحديث كل دقيقة
        const interval = setInterval(loadUnreadCount, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadNotifications();
        }
    }, [isOpen]);

    const loadUnreadCount = async () => {
        const userId = getUserIdentifier();
        const { count } = await getUnreadCount(userId);
        setUnreadCount(count);
    };

    const loadNotifications = async () => {
        setLoading(true);
        const userId = getUserIdentifier();
        const { data } = await getUnreadNotifications(userId);
        setNotifications(data);
        setLoading(false);
    };

    const handleMarkAsRead = async (notificationId: string) => {
        const userId = getUserIdentifier();
        await markAsRead(notificationId, userId);

        // تحديث القائمة
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleMarkAllAsRead = async () => {
        const userId = getUserIdentifier();
        await markAllAsRead(userId);

        setNotifications([]);
        setUnreadCount(0);
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="الإشعارات"
            >
                <Bell size={20} className="text-slate-700 dark:text-slate-300" />

                {/* Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div className="absolute left-0 mt-2 w-80 max-w-[90vw] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 max-h-[80vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Bell size={18} />
                                الإشعارات
                                {unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Notifications List */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center text-slate-500">
                                    جاري التحميل...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="text-4xl mb-2">🔕</div>
                                    <div className="text-slate-500 dark:text-slate-400">
                                        لا توجد إشعارات جديدة
                                    </div>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {notifications.map((notification) => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
                                            onMarkAsRead={() => handleMarkAsRead(notification.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="w-full py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition"
                                >
                                    تحديد الكل كمقروء
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
