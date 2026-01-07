import Link from 'next/link';
import { Sparkles, Search, FileText, Inbox, Bookmark } from 'lucide-react';

interface EmptyStateProps {
    type?: 'search' | 'list' | 'notifications' | 'bookmarks' | 'general';
    title?: string;
    message?: string;
    actionLabel?: string;
    actionHref?: string;
    icon?: React.ReactNode;
}

const emptyConfig = {
    search: {
        icon: <Search size={64} className="text-slate-300 dark:text-slate-700" />,
        title: 'لا توجد نتائج',
        message: 'لم نتمكن من العثور على ما تبحث عنه. جرّب كلمات مفتاحية مختلفة.',
        actionLabel: 'تصفح المواضيع',
        actionHref: '/',
    },
    list: {
        icon: <Inbox size={64} className="text-slate-300 dark:text-slate-700" />,
        title: 'القائمة فارغة',
        message: 'لا توجد عناصر هنا بعد. ابدأ بإضافة المحتوى!',
    },
    notifications: {
        icon: <Sparkles size={64} className="text-slate-300 dark:text-slate-700" />,
        title: 'لا توجد إشعارات',
        message: 'أنت على اطلاع بكل شيء! لا توجد إشعارات جديدة.',
    },
    bookmarks: {
        icon: <Bookmark size={64} className="text-slate-300 dark:text-slate-700" />,
        title: 'لا توجد إشارات مرجعية',
        message: 'احفظ المقالات والخدمات المفضلة لديك للوصول إليها بسهولة.',
        actionLabel: 'تصفح المحتوى',
        actionHref: '/',
    },
    general: {
        icon: <FileText size={64} className="text-slate-300 dark:text-slate-700" />,
        title: 'لا يوجد محتوى',
        message: 'لا يوجد محتوى متاح حالياً.',
    },
};

export default function EmptyState({
    type = 'general',
    title,
    message,
    actionLabel,
    actionHref,
    icon,
}: EmptyStateProps) {
    const config = emptyConfig[type];
    const displayTitle = title || config.title;
    const displayMessage = message || config.message;
    const displayActionLabel = actionLabel || (config as any).actionLabel || '';
    const displayActionHref = actionHref || (config as any).actionHref || '';
    const displayIcon = icon || config.icon;

    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center animate-fadeInUp">
            {/* Icon */}
            <div className="mb-6 animate-pulse">
                {displayIcon}
            </div>

            {/* Title */}
            <h3 className="text-xl md:text-2xl font-bold text-slate-700 dark:text-slate-300 mb-3">
                {displayTitle}
            </h3>

            {/* Message */}
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                {displayMessage}
            </p>

            {/* Action */}
            {displayActionHref && displayActionLabel && (
                <Link
                    href={displayActionHref}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-lg transition-all btn-hover-lift"
                >
                    <Sparkles size={18} />
                    {displayActionLabel}
                </Link>
            )}
        </div>
    );
}
