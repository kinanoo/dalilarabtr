'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { UserPlus, Briefcase, MessageSquare, Star, ArrowLeft } from 'lucide-react';

export default function AddServiceBanner() {
    const [isGuest, setIsGuest] = useState(false);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!supabase) return;
        supabase.auth.getUser().then(({ data }) => {
            setIsGuest(!data.user);
            setReady(true);
        });
    }, []);

    // Only show to guests — hidden for logged-in members
    if (!ready || !isGuest) return null;

    return (
        <div className="container mx-auto px-4 max-w-6xl mt-6 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="relative overflow-hidden bg-gradient-to-l from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl">
                {/* Background glow */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
                    {/* Left: Text */}
                    <div className="flex-1 text-center md:text-right">
                        <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">
                            للأعضاء فقط
                        </p>
                        <h3 className="text-white text-xl sm:text-2xl font-black leading-snug mb-3">
                            سجّل كعضو وافتح مزايا حصرية
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
                            انضم لمجتمع دليل العرب وتمتع بمزايا لا تتوفر للزوار العاديين.
                        </p>

                        {/* Benefits */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5">
                                <div className="w-7 h-7 bg-emerald-900/50 rounded-lg flex items-center justify-center shrink-0">
                                    <Briefcase size={14} className="text-emerald-400" />
                                </div>
                                <span className="text-slate-300 text-xs font-bold">أضف خدمتك مجاناً</span>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5">
                                <div className="w-7 h-7 bg-blue-900/50 rounded-lg flex items-center justify-center shrink-0">
                                    <MessageSquare size={14} className="text-blue-400" />
                                </div>
                                <span className="text-slate-300 text-xs font-bold">شارك وعلّق بهويتك</span>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5">
                                <div className="w-7 h-7 bg-amber-900/50 rounded-lg flex items-center justify-center shrink-0">
                                    <Star size={14} className="text-amber-400" />
                                </div>
                                <span className="text-slate-300 text-xs font-bold">قيّم الخدمات والمحتوى</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: CTA buttons */}
                    <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
                        <Link
                            href="/join"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-900/30 text-sm"
                        >
                            <UserPlus size={18} />
                            إنشاء حساب مجاناً
                            <ArrowLeft size={15} />
                        </Link>
                        <Link
                            href="/login"
                            className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold px-8 py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm border border-slate-600"
                        >
                            لديّ حساب — تسجيل الدخول
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
