import Link from 'next/link';
import { User } from 'lucide-react';
import type { Notification } from '@/lib/api/notifications';

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: () => void;
    onClose?: () => void;
}

export default function NotificationItem({ notification, onMarkAsRead, onClose }: NotificationItemProps) {
    const getTypeIcon = () => {
        if (notification.icon) return notification.icon;

        switch (notification.type) {
            case 'article': return '📄';
            case 'law': return '⚖️';
            case 'service': return '💼';
            case 'update': return '🔄';
            case 'alert': return '⚠️';
            case 'announcement': return '📢';
            case 'reply': return '💬';
            case 'review': return '⭐';
            case 'comment': return '🗨️';
            default: return '🔔';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays === 1) return 'أمس';
        if (diffDays < 7) return `منذ ${diffDays} أيام`;
        return date.toLocaleDateString('ar-SA');
    };

    const isUnread = !notification.is_read;
    const isGrouped = (notification.group_count ?? 1) > 1;

    // Always provide a useful link — fallback by type if DB link is missing
    const effectiveLink = notification.link || (() => {
        switch (notification.type) {
            case 'article': return '/';
            case 'update': return '/updates';
            case 'alert': return '/security-codes';
            case 'service': return '/services';
            case 'announcement': return '/updates';
            default: return '/updates';
        }
    })();

    const inner = (
        <div
            className={`group relative p-4 transition-colors cursor-pointer overflow-hidden border-r-[3px] ${
                notification.is_personal
                    ? isUnread
                        ? 'bg-blue-50/70 dark:bg-blue-950/15 hover:bg-blue-100/80 dark:hover:bg-blue-950/25 border-r-blue-500'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-r-blue-300/50 dark:border-r-blue-700/30 opacity-60'
                    : isUnread
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/15 hover:bg-emerald-100/80 dark:hover:bg-emerald-950/25 border-r-emerald-500'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-r-transparent opacity-60'
            }`}
        >
            {/* Neon glow line on hover */}
            <span className={`absolute bottom-0 right-0 h-[2px] w-0 transition-all duration-300 ease-out group-hover:w-full ${
                notification.is_personal
                    ? 'bg-gradient-to-l from-blue-400 to-blue-600 shadow-[0_0_8px_rgba(96,165,250,0.8)]'
                    : 'bg-gradient-to-l from-emerald-400 to-emerald-600 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
            }`} />

            <div className="flex gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5 relative">
                    {isGrouped ? (
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <span className="text-lg">{getTypeIcon()}</span>
                            <span className="absolute -bottom-1 -left-1 bg-emerald-600 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5">
                                {notification.group_count}
                            </span>
                        </div>
                    ) : (
                        <div className="text-2xl">
                            {getTypeIcon()}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className={`text-sm mb-1 flex items-center gap-1.5 ${
                        isUnread
                            ? 'font-bold text-slate-900 dark:text-white'
                            : 'font-medium text-slate-500 dark:text-slate-400'
                    }`}>
                        {notification.title}
                        {isUnread && (
                            <span className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${
                                notification.is_personal ? 'bg-blue-500' : 'bg-emerald-500'
                            }`} />
                        )}
                    </div>

                    <div className={`text-xs mb-2 line-clamp-2 leading-relaxed ${
                        isUnread
                            ? 'text-slate-600 dark:text-slate-300'
                            : 'text-slate-400 dark:text-slate-500'
                    }`}>
                        {notification.message}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">
                            {formatDate(notification.created_at)}
                        </span>

                        <div className="flex items-center gap-1.5">
                            {/* Personal badge */}
                            {notification.is_personal && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded-full">
                                    <User size={9} />
                                    شخصي
                                </span>
                            )}

                            {/* Grouped "view all" */}
                            {isGrouped && (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                    عرض الكل &larr;
                                </span>
                            )}

                            {/* Priority badges */}
                            {notification.priority === 'urgent' && (
                                <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full">
                                    عاجل
                                </span>
                            )}
                            {notification.priority === 'high' && (
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
                                    مهم
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Always wrap in Link — effectiveLink always has a value
    return (
        <Link href={effectiveLink} onClick={() => { onMarkAsRead(); onClose?.(); }}>
            {inner}
        </Link>
    );
}
