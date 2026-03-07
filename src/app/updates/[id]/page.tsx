import { Metadata } from 'next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Calendar, Newspaper } from 'lucide-react';
import UniversalComments from '@/components/community/UniversalComments';

import ShareMenu from '@/components/ShareMenu';
import HtmlContent from '@/components/ui/HtmlContent';
import { stripHtml } from '@/lib/stripHtml';
import { SITE_CONFIG } from '@/lib/config';

export const revalidate = 60;

async function getSupabase() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );
}

export async function generateMetadata(
    props: { params: Promise<{ id: string }> }
): Promise<Metadata> {
    const { id } = await props.params;
    const supabase = await getSupabase();

    const { data } = await supabase
        .from('updates')
        .select('title, content, type')
        .eq('id', id)
        .eq('active', true)
        .single();

    if (!data) return { title: 'التحديث غير موجود' };

    return {
        title: `${data.title} | دليل العرب`,
        description: stripHtml(data.content).substring(0, 160) || data.title,
        alternates: { canonical: `/updates/${id}` },
        openGraph: {
            title: data.title,
            description: stripHtml(data.content).substring(0, 200),
            images: [{
                url: `${SITE_CONFIG.siteUrl}/api/og?${new URLSearchParams({ title: data.title, category: data.type === 'alert' ? 'تنبيه' : 'تحديث' })}`,
                width: 1200, height: 630, alt: data.title,
            }],
        },
    };
}

export default async function UpdateDetailPage(
    props: { params: Promise<{ id: string }> }
) {
    const { id } = await props.params;
    const supabase = await getSupabase();

    const { data: update, error } = await supabase
        .from('updates')
        .select('id, type, title, content, date, link, image, created_at')
        .eq('id', id)
        .eq('active', true)
        .single();

    if (error || !update) {
        notFound();
    }

    const typeLabel = update.type === 'news' ? 'خبر' : update.type === 'alert' ? 'تنبيه' : 'تحديث';
    const typeColor = update.type === 'alert'
        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo pb-20" dir="rtl">
            {/* Header */}
            <div className="bg-slate-900 text-white pt-8 pb-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/30 via-slate-900 to-blue-900/20" />
                <div className="container mx-auto px-4 relative z-10">
                    <Link
                        href="/updates"
                        className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors mb-6 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-sm"
                    >
                        <ArrowRight size={18} />
                        <span className="text-sm font-bold">العودة للتحديثات</span>
                    </Link>
                </div>
            </div>

            {/* Content Card */}
            <div className="container mx-auto px-4 relative z-20 -mt-16 max-w-3xl">
                <article className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    {/* Image */}
                    {update.image && (
                        <div className="relative w-full h-48 sm:h-64">
                            <Image
                                src={update.image}
                                alt={update.title || 'صورة التحديث'}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 768px"
                            />
                        </div>
                    )}

                    <div className="p-6 sm:p-10">
                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${typeColor}`}>
                                {typeLabel}
                            </span>
                            {update.date && (
                                <time dateTime={update.date} className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <Calendar size={12} />
                                    {update.date}
                                </time>
                            )}
                            <div className="mr-auto">
                                <ShareMenu
                                    mini
                                    variant="subtle"
                                    title={update.title}
                                    text={stripHtml(update.content).slice(0, 200)}
                                    url={`${SITE_CONFIG.siteUrl}/updates/${id}`}
                                />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                            {update.title}
                        </h1>

                        {/* Content */}
                        {update.content && (
                            <HtmlContent
                                html={update.content}
                                className="text-slate-700 dark:text-slate-300 text-base sm:text-lg"
                            />
                        )}
                    </div>
                </article>

                {/* Community Interaction */}
                <div className="mt-8 space-y-6">
                    <UniversalComments
                        entityType="update"
                        entityId={id}
                        title="التعليقات والمناقشة"
                    />
                </div>
            </div>
        </div>
    );
}
