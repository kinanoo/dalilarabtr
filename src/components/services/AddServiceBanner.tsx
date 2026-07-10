'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Briefcase, MessageCircle, Search, BadgeCheck, ArrowLeft, Users } from 'lucide-react';

/**
 * AddServiceBanner — the primary "list your business free" conversion CTA on
 * the services directory. Shown to EVERYONE (guests and members), not just
 * guests, so a professional who's already logged in still gets a one-tap path
 * to add their listing. Light, on-brand (gov-red stripe + emerald), with a
 * real value proposition and live social proof (count of listed professionals)
 * so a professional understands the platform's reach before signing up.
 */
export default function AddServiceBanner() {
    const [isGuest, setIsGuest] = useState<boolean | null>(null);
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        if (!supabase) return;
        // getSession (local, instant) — not getUser (network, can false-null and
        // wrongly send a logged-in member to /join). See getClientUser().
        supabase.auth.getSession().then(({ data }) => setIsGuest(!data.session?.user));
        supabase
            .from('service_providers')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'approved')
            .then(({ count }) => setCount(count ?? null));
    }, []);

    // Guests sign up first; logged-in members go straight to the add form.
    // IMPORTANT: only route to /join when we KNOW the user is a guest
    // (isGuest === true). While auth is still resolving (isGuest === null) OR the
    // user is a member (false), point at the add form — so a logged-in member is
    // never wrongly sent to sign-up during the brief load. The form itself guards
    // guests who slip through.
    const href = isGuest === true ? '/join' : '/dashboard/services/new';
    const ctaLabel = isGuest === true ? 'سجّل وأضف خدمتك مجاناً' : 'أضف خدمتك الآن';

    const VALUE = [
        { icon: Search, text: 'تظهر في بحث جوجل ويجدك الناس' },
        { icon: MessageCircle, text: 'العملاء يراسلونك على واتساب مباشرة' },
        { icon: BadgeCheck, text: 'مجّاني تماماً — بلا رسوم ولا عمولة' },
    ];

    return (
        <div className="container mx-auto px-4 max-w-6xl mt-6">
            <div className="relative overflow-hidden rounded-2xl border border-emerald-200/70 dark:border-emerald-900/50 bg-gradient-to-l from-emerald-50 via-white to-teal-50/60 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 p-6 sm:p-8 shadow-sm">
                {/* Official colour stripe */}
                <div aria-hidden="true" className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-gov-red via-brand-orange to-brand-blue" />

                <div className="relative flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
                    {/* Text + value props */}
                    <div className="flex-1 text-center lg:text-right">
                        <div className="inline-flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white shadow-sm">
                                <Briefcase size={16} />
                            </span>
                            <span className="text-[11px] font-black tracking-[0.18em] uppercase text-emerald-700 dark:text-emerald-400">
                                للمهنيّين وأصحاب الحرف والمشاريع
                            </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black leading-snug text-slate-900 dark:text-white mb-2">
                            عندك مهنة أو خدمة؟ <span className="text-emerald-600 dark:text-emerald-400">أضف رقمك مجاناً</span> ووصلك العملاء
                        </h3>
                        {count && count > 0 ? (
                            <p className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 mb-4">
                                <Users size={15} className="text-emerald-600 dark:text-emerald-400" />
                                انضمّ إلى <span className="text-emerald-700 dark:text-emerald-300 tabular-nums">+{count.toLocaleString('en-US')}</span> مهنيّ معروض على دليل العرب
                            </p>
                        ) : (
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-4">كن أوّل من يضيف خدمته في مدينتك على دليل العرب.</p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {VALUE.map(({ icon: Icon, text }) => (
                                <div key={text} className="flex items-center gap-2 bg-white/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                                        <Icon size={14} />
                                    </span>
                                    <span className="text-slate-700 dark:text-slate-200 text-xs font-bold leading-tight text-right">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="shrink-0 w-full lg:w-auto">
                        <Link
                            href={href}
                            className="w-full lg:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-600/25 text-sm"
                        >
                            <Briefcase size={18} />
                            {ctaLabel}
                            <ArrowLeft size={16} />
                        </Link>
                        {isGuest && (
                            <Link href="/login" className="mt-2 block text-center text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                لديّ حساب — تسجيل الدخول
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
