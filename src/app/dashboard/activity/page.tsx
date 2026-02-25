'use client';

import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowRight, Star, MessageCircle, Briefcase, FileText, Bookmark, Loader2, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';
import EmptyState from '@/components/EmptyState';
import { useBookmarks } from '@/hooks/useBookmarks';
import { getMyActivityStats, getMyReviews, getMyComments, getMyServices, getMyArticles } from '@/lib/api/profile';

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
    approved: { label: 'منشور', color: 'emerald', icon: CheckCircle2 },
    published: { label: 'منشور', color: 'emerald', icon: CheckCircle2 },
    pending: { label: 'قيد المراجعة', color: 'amber', icon: Clock },
    rejected: { label: 'مرفوض', color: 'red', icon: XCircle },
    draft: { label: 'مسودة', color: 'slate', icon: AlertCircle },
};

function StatusBadge({ status }: { status: string }) {
    const config = STATUS_MAP[status] || STATUS_MAP.pending;
    const Icon = config.icon;
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-${config.color}-50 dark:bg-${config.color}-900/20 text-${config.color}-600 dark:text-${config.color}-400`}>
            <Icon size={12} />
            {config.label}
        </span>
    );
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}

function StarDisplay({ rating }: { rating: number }) {
    return (
        <span className="text-amber-400 text-sm tracking-wide">
            {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
        </span>
    );
}

export default function ActivityPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ reviews_count: 0, comments_count: 0, services_count: 0, articles_count: 0 });
    const [reviews, setReviews] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [articles, setArticles] = useState<any[]>([]);
    const [bookmarkedArticles, setBookmarkedArticles] = useState<any[]>([]);
    const { bookmarks, isLoaded: bookmarksLoaded } = useBookmarks();
    const router = useRouter();

    const supabase = useMemo(() => createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), []);

    useEffect(() => {
        loadData();
    }, []);

    // Load bookmarked articles when bookmarks change
    useEffect(() => {
        if (bookmarksLoaded && bookmarks.length > 0) {
            loadBookmarkedArticles();
        } else if (bookmarksLoaded) {
            setBookmarkedArticles([]);
        }
    }, [bookmarks, bookmarksLoaded]);

    const loadData = async () => {
        // Dev bypass
        if (process.env.NODE_ENV === 'development' && document.cookie.includes('dev_member_bypass=true')) {
            setLoading(false);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        const [statsRes, reviewsRes, commentsRes, servicesRes, articlesRes] = await Promise.all([
            getMyActivityStats(),
            getMyReviews(),
            getMyComments(),
            getMyServices(),
            getMyArticles(),
        ]);

        setStats(statsRes.data);
        setReviews(reviewsRes.data);
        setComments(commentsRes.data);
        setServices(servicesRes.data);
        setArticles(articlesRes.data);
        setLoading(false);
    };

    const loadBookmarkedArticles = async () => {
        const { data } = await supabase
            .from('articles')
            .select('id, title, category, created_at')
            .in('id', bookmarks);
        setBookmarkedArticles(data || []);
    };

    if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;

    const statCards = [
        { label: 'تقييمات', count: stats.reviews_count, icon: Star, color: 'amber' },
        { label: 'تعليقات', count: stats.comments_count, icon: MessageCircle, color: 'blue' },
        { label: 'خدمات', count: stats.services_count, icon: Briefcase, color: 'emerald' },
        { label: 'مقالات', count: stats.articles_count, icon: FileText, color: 'violet' },
    ];

    const tabs = [
        {
            label: 'التقييمات',
            icon: <Star size={16} />,
            badge: stats.reviews_count,
            content: reviews.length === 0 ? (
                <EmptyState type="list" title="لا توجد تقييمات" message="لم تقم بتقييم أي خدمة بعد." actionLabel="تصفح الخدمات" actionHref="/services" />
            ) : (
                <div className="space-y-3">
                    {reviews.map((r) => (
                        <div key={r.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <StarDisplay rating={r.rating} />
                                <StatusBadge status={r.status || 'approved'} />
                            </div>
                            {r.comment && <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{r.comment}</p>}
                            <div className="text-xs text-slate-400">{formatDate(r.created_at)}</div>
                        </div>
                    ))}
                </div>
            ),
        },
        {
            label: 'التعليقات',
            icon: <MessageCircle size={16} />,
            badge: stats.comments_count,
            content: comments.length === 0 ? (
                <EmptyState type="list" title="لا توجد تعليقات" message="لم تكتب أي تعليق بعد." />
            ) : (
                <div className="space-y-3">
                    {comments.map((c) => (
                        <div key={c.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{c.content}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">{formatDate(c.created_at)}</span>
                                <StatusBadge status={c.status || 'approved'} />
                            </div>
                        </div>
                    ))}
                </div>
            ),
        },
        {
            label: 'الخدمات',
            icon: <Briefcase size={16} />,
            badge: stats.services_count,
            content: services.length === 0 ? (
                <EmptyState type="list" title="لا توجد خدمات" message="لم تقم بإضافة أي خدمة بعد." actionLabel="أضف خدمة" actionHref="/dashboard/services/new" />
            ) : (
                <div className="space-y-3">
                    {services.map((s) => (
                        <Link key={s.id} href={`/services/${s.id}`} className="block bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-slate-800 dark:text-white">{s.name}</h4>
                                <StatusBadge status={s.status || 'pending'} />
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                {s.profession && <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg">{s.profession}</span>}
                                {s.city && <span>{s.city}</span>}
                                <span>{formatDate(s.created_at)}</span>
                            </div>
                            {s.rating && (
                                <div className="mt-2 flex items-center gap-2">
                                    <StarDisplay rating={Math.round(s.rating)} />
                                    <span className="text-xs text-slate-400">({s.review_count || 0})</span>
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            ),
        },
        {
            label: 'المقالات',
            icon: <FileText size={16} />,
            badge: stats.articles_count,
            content: articles.length === 0 ? (
                <EmptyState type="list" title="لا توجد مقالات" message="لم تكتب أي مقال بعد." actionLabel="اكتب مقال" actionHref="/dashboard/articles/new" />
            ) : (
                <div className="space-y-3">
                    {articles.map((a) => (
                        <Link key={a.id} href={`/article/${a.slug || a.id}`} className="block bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-slate-800 dark:text-white">{a.title}</h4>
                                <StatusBadge status={a.status || 'pending'} />
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                {a.category && <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg">{a.category}</span>}
                                <span>{formatDate(a.created_at)}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            ),
        },
        {
            label: 'المفضلة',
            icon: <Bookmark size={16} />,
            badge: bookmarks.length,
            content: bookmarkedArticles.length === 0 ? (
                <EmptyState type="bookmarks" message="لم تحفظ أي مقال بعد. اضغط على أيقونة الحفظ بجانب أي مقال." actionLabel="تصفح المقالات" actionHref="/" />
            ) : (
                <div className="space-y-3">
                    {bookmarkedArticles.map((a) => (
                        <Link key={a.id} href={`/article/${a.slug || a.id}`} className="block bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
                            <h4 className="font-bold text-slate-800 dark:text-white mb-1">{a.title}</h4>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                {a.category && <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg">{a.category}</span>}
                                {a.created_at && <span>{formatDate(a.created_at)}</span>}
                            </div>
                        </Link>
                    ))}
                </div>
            ),
        },
    ];

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-8">
                <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors mb-4">
                    <ArrowRight size={16} />
                    العودة للوحة
                </Link>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white">نشاطي</h1>
                <p className="text-sm text-slate-500 mt-1">تقييماتك، تعليقاتك، خدماتك، ومقالاتك في مكان واحد</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {statCards.map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 text-center">
                            <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-${s.color}-50 dark:bg-${s.color}-900/20 text-${s.color}-600 flex items-center justify-center`}>
                                <Icon size={20} />
                            </div>
                            <div className="text-2xl font-black text-slate-800 dark:text-white">{s.count}</div>
                            <div className="text-xs text-slate-500">{s.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Tabs */}
            <Tabs tabs={tabs} variant="underline" />
        </div>
    );
}
