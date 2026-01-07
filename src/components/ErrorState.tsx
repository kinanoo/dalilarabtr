import Link from 'next/link';
import { AlertCircle, Home, ArrowLeft, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
    type?: '404' | '500' | 'network' | 'permission' | 'general';
    title?: string;
    message?: string;
    actionLabel?: string;
    actionHref?: string;
    onRetry?: () => void;
}

const errorConfig = {
    '404': {
        emoji: '🔍',
        title: 'الصفحة غير موجودة',
        message: 'عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. ربما تم نقلها أو حذفها.',
        actionLabel: 'العودة للرئيسية',
        actionHref: '/',
    },
    '500': {
        emoji: '⚠️',
        title: 'خطأ في الخادم',
        message: 'حدث خطأ غير متوقع. نعمل على إصلاحه. الرجاء المحاولة مرة أخرى لاحقاً.',
        actionLabel: 'إعادة المحاولة',
    },
    network: {
        emoji: '📡',
        title: 'خطأ في الاتصال',
        message: 'يبدو أن هناك مشكلة في اتصالك بالإنترنت. تحقق من الاتصال وحاول مرة أخرى.',
        actionLabel: 'إعادة المحاولة',
    },
    permission: {
        emoji: '🔒',
        title: 'غير مصرح',
        message: 'عذراً، ليس لديك صلاحية للوصول إلى هذه الصفحة.',
        actionLabel: 'العودة للرئيسية',
        actionHref: '/',
    },
    general: {
        emoji: '❌',
        title: 'حدث خطأ',
        message: 'حدث خطأ ما. الرجاء المحاولة مرة أخرى.',
        actionLabel: 'إعادة المحاولة',
    },
};

export default function ErrorState({
    type = 'general',
    title,
    message,
    actionLabel,
    actionHref,
    onRetry,
}: ErrorStateProps) {
    const config = errorConfig[type];
    const displayTitle = title || config.title;
    const displayMessage = message || config.message;
    const displayActionLabel = actionLabel || config.actionLabel;
    const displayActionHref = actionHref || (config as any).actionHref || '';

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-fadeInUp">
            {/* Icon/Emoji */}
            <div className="text-8xl mb-6 animate-bounce">
                {config.emoji}
            </div>

            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                {displayTitle}
            </h2>

            {/* Message */}
            <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8 leading-relaxed">
                {displayMessage}
            </p>

            {/* Actions */}
            <div className="flex gap-4">
                {displayActionHref && (
                    <Link
                        href={displayActionHref}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all btn-hover-lift"
                    >
                        <Home size={20} />
                        {displayActionLabel}
                    </Link>
                )}

                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold py-3 px-6 rounded-lg transition-all btn-hover-lift"
                    >
                        <RefreshCw size={20} />
                        {displayActionLabel}
                    </button>
                )}

                {!displayActionHref && !onRetry && (
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold"
                    >
                        <ArrowLeft size={20} />
                        العودة
                    </Link>
                )}
            </div>
        </div>
    );
}
