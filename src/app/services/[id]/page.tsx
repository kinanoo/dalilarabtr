import { Metadata } from 'next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone, Briefcase, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import InlineStarRating from '@/components/services/InlineStarRating';
import UniversalComments from '@/components/community/UniversalComments';

import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG } from '@/lib/config';

export const revalidate = 60;

// ─── Shared helper ────────────────────────────────────────────────────────────
async function getSupabase() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata(
    props: { params: Promise<{ id: string }> }
): Promise<Metadata> {
    const { id } = await props.params;
    const supabase = await getSupabase();

    const { data } = await supabase
        .from('service_providers')
        .select('name, profession, city, category, description, image')
        .eq('id', id)
        .eq('status', 'approved')
        .single();

    if (!data) return { title: 'الخدمة غير موجودة' };

    const title = `${data.name} - ${data.profession} في ${data.city} | دليل العرب`;
    const description = data.description?.substring(0, 160) ||
        `تواصل مع ${data.name} للحصول على خدمات ${data.category} في ${data.city}.`;
    const ogImage = data.image || `${SITE_CONFIG.siteUrl}/api/og?${new URLSearchParams({ title: `${data.name} — ${data.profession}`, category: data.category || 'خدمات' })}`;

    return {
        title,
        description,
        alternates: { canonical: `/services/${id}` },
        openGraph: {
            title,
            description,
            images: [{ url: ogImage, width: 1200, height: 630, alt: data.name }],
        },
    };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ServiceDetailsPage(
    props: { params: Promise<{ id: string }> }
) {
    const { id } = await props.params;
    const supabase = await getSupabase();

    const { data: provider, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('id', id)
        .eq('status', 'approved')
        .single();

    if (error || !provider) {
        notFound();
    }

    const cleanPhone = (provider.phone || '').replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `مرحباً أستاذ ${provider.name}، رأيت خدمتك "${provider.profession}" على منصة دليل العرب في تركيا وأود الاستفسار.`
    )}`;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo pb-20" dir="rtl">
            {/* Header / Cover */}
            <div className="bg-slate-900 text-white pt-8 pb-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-emerald-900/20" />
                <div className="container mx-auto px-4 relative z-10">
                    <Link
                        href="/services"
                        className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors mb-8 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-sm"
                    >
                        <ArrowRight size={18} />
                        <span className="text-sm font-bold">العودة للخدمات</span>
                    </Link>
                </div>
            </div>

            {/* Profile Card */}
            <div className="container mx-auto px-4 relative z-20 -mt-24 max-w-4xl">
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 mb-8">
                    <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
                        {/* Avatar */}
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-xl shrink-0 overflow-hidden relative flex items-center justify-center -mt-16 sm:-mt-20 z-30">
                            {provider.image ? (
                                <Image src={provider.image} alt={provider.name} fill className="object-cover" />
                            ) : (
                                <Briefcase size={48} className="text-slate-300" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 w-full text-center sm:text-right">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                                        {provider.name}
                                        {provider.is_verified && (
                                            <CheckCircle className="text-blue-500 shrink-0" size={24} />
                                        )}
                                    </h1>
                                    <p className="text-emerald-600 dark:text-emerald-400 font-bold text-lg mt-1">
                                        {provider.profession}
                                    </p>
                                </div>
                                <InlineStarRating
                                    serviceId={id}
                                    serviceName={provider.name}
                                    currentRating={provider.rating ? Number(provider.rating) : 5.0}
                                    reviewCount={provider.review_count || 0}
                                />
                            </div>

                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-6 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={18} className="text-slate-400" />
                                    <span>{provider.city}{provider.district && `، ${provider.district}`}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Briefcase size={18} className="text-slate-400" />
                                    <span>{provider.category}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">نبذة عن الخدمة</h2>
                        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {provider.description || 'لم يتم إضافة نبذة تفصيلية بعد.'}
                        </div>
                    </div>

                    {/* Contact + Share */}
                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 text-lg"
                        >
                            <Phone size={24} />
                            تواصل عبر الواتساب
                        </a>

                        {provider.is_verified && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-300 py-4 rounded-xl font-bold flex items-center justify-center gap-3">
                                <ShieldCheck size={24} />
                                عضو موثق ومرخص
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex justify-center">
                        <ShareMenu
                            title={`${provider.name} — ${provider.profession}`}
                            text={`${provider.name} — ${provider.profession} في ${provider.city}. تواصل عبر دليل العرب.`}
                            url={`${SITE_CONFIG.siteUrl}/services/${id}`}
                        />
                    </div>
                </div>
            </div>

            {/* Reviews + Comments */}
            <div className="container mx-auto px-4 max-w-4xl pb-12 space-y-8">
                <UniversalComments
                    entityType="service"
                    entityId={id}
                    title="التعليقات والمناقشة"
                />
            </div>
        </div>
    );
}
