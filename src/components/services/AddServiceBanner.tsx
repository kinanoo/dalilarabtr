'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { PlusCircle, Briefcase, ArrowLeft, Sparkles } from 'lucide-react';

export default function AddServiceBanner() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        supabase.auth.getUser().then(({ data }) => {
            setIsLoggedIn(!!data.user);
            setReady(true);
        });
    }, []);

    // Only render for logged-in users — invisible to guests
    if (!ready || !isLoggedIn) return null;

    return (
        <div className="container mx-auto px-4 max-w-6xl mt-6 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="relative overflow-hidden bg-gradient-to-l from-emerald-600 to-teal-700 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-emerald-900/20">
                {/* Background decoration */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
                    <div className="absolute -bottom-10 right-20 w-32 h-32 bg-teal-400/10 rounded-full blur-xl" />
                </div>

                {/* Text */}
                <div className="flex items-center gap-4 text-white relative z-10">
                    <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
                        <Briefcase size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <Sparkles size={14} className="text-emerald-200" />
                            <span className="text-emerald-200 text-xs font-bold uppercase tracking-wide">مجاناً للأعضاء</span>
                        </div>
                        <p className="font-black text-lg sm:text-xl leading-tight">
                            هل تقدم خدمة للعرب في تركيا؟
                        </p>
                        <p className="text-emerald-100/80 text-sm mt-0.5">
                            أضف خدمتك وتواصل مع آلاف الباحثين عبر الدليل
                        </p>
                    </div>
                </div>

                {/* CTA Button */}
                <Link
                    href="/dashboard/services/new"
                    className="relative z-10 bg-white text-emerald-700 font-black px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-emerald-50 active:scale-95 transition-all shrink-0 shadow-lg text-sm"
                >
                    <PlusCircle size={18} />
                    أضف خدمتك الآن
                    <ArrowLeft size={15} />
                </Link>
            </div>
        </div>
    );
}
