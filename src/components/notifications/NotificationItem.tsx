import Link from 'next/link';
import type { Notification } from '@/lib/api/notifications';

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: () => void;
}

export default function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
    const getPriorityColor = () => {
        switch (notification.priority) {
            case 'urgent':
                return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900';
            case 'high':
                return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900';
            case 'medium':
                return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900';
            default:
                return 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800';
        }
    };

    const getTypeIcon = () => {
        if (notification.icon) return notification.icon;

        switch (notification.type) {
            case 'article':
                return '📄';
            case 'law':
                return '⚖️';
            case 'service':
                return '💼';
            case 'update':
                return '🔄';
            case 'alert':
                return '⚠️';
            case 'announcement':
                return '📢';
            default:
                return '🔔';
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

    const content = (
        <div
            className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer ${!notification.is_read ? 'border-l-4 border-l-emerald-500' : ''
                }`}
            onClick={onMarkAsRead}
        >
            <div className="flex gap-3">
                {/* Icon */}
                <div className="text-2xl flex-shrink-0">
                    {getTypeIcon()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Title */}
                    <div className="font-bold text-slate-800 dark:text-slate-100 mb-1">
                        {notification.title}
                    </div>

                    {/* Message */}
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                        {notification.message}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-500">
                            {formatDate(notification.created_at)}
                        </span>

                        {notification.priority === 'urgent' && (
                            <span className="text-xs font-bold text-red-600 dark:text-red-400">
                                عاجل
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    if (notification.link) {
        return (
            <Link href={notification.link} onClick={onMarkAsRead}>
                {content}
            </Link>
        );
    }

    return content;
}
