'use client';

import { useState, useEffect } from 'react';
import { getAuthClient } from '@/lib/supabaseClient';
import { Loader2, Briefcase, FileText, BrainCircuit, UserCircle, Activity, Star, MessageCircle, Sparkles, ArrowLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMyActivityStats } from '@/lib/api/profile';

interface UserProfile {
    full_name: string;
    role: string;
}

// Static color map — interpolated Tailwind class names get purged by JIT,
// so map each color key to literal class strings the scanner can see.
const COLOR_THEME: Record<string, {
    accent: string;       // vertical stripe + dot
    surface: string;      // gradient card bg
    iconBg: string;       // icon tile bg
    iconBgDark: string;   // icon tile bg dark
    iconText: string;     // icon color
    iconTextDark: string; // icon color dark
    borderHover: string;  // hover border tint
    shadowHover: string;  // hover shadow tint
    text: string;         // accent text for hover
}> = {
    emerald: {
        accent: 'bg-emerald-500',
        surface: 'from-white to-emerald-50/60 dark:from-slate-900 dark:to-emerald-950/30',
        iconBg: 'bg-emerald-100',
        iconBgDark: 'dark:bg-emerald-900/30',
        iconText: 'text-emerald-600',
        iconTextDark: 'dark:text-emerald-400',
        borderHover: 'hover:border-emerald-400',
        shadowHover: 'hover:shadow-emerald-500/15',
        text: 'group-hover:text-emerald-600',
    },
    blue: {
        accent: 'bg-blue-500',
        surface: 'from-white to-blue-50/60 dark:from-slate-900 dark:to-blue-950/30',
        iconBg: 'bg-blue-100',
        iconBgDark: 'dark:bg-blue-900/30',
        iconText: 'text-blue-600',
        iconTextDark: 'dark:text-blue-400',
        borderHover: 'hover:border-blue-400',
        shadowHover: 'hover:shadow-blue-500/15',
        text: 'group-hover:text-blue-600',
    },
    violet: {
        accent: 'bg-violet-500',
        surface: 'from-white to-violet-50/60 dark:from-slate-900 dark:to-violet-950/30',
        iconBg: 'bg-violet-100',
        iconBgDark: 'dark:bg-violet-900/30',
        iconText: 'text-violet-600',
        iconTextDark: 'dark:text-violet-400',
        borderHover: 'hover:border-violet-400',
        shadowHover: 'hover:shadow-violet-500/15',
        text: 'group-hover:text-violet-600',
    },
    amber: {
        accent: 'bg-amber-500',
        surface: 'from-white to-amber-50/60 dark:from-slate-900 dark:to-amber-950/30',
        iconBg: 'bg-amber-100',
        iconBgDark: 'dark:bg-amber-900/30',
        iconText: 'text-amber-600',
        iconTextDark: 'dark:text-amber-400',
        borderHover: 'hover:border-amber-400',
        shadowHover: 'hover:shadow-amber-500/15',
        text: 'group-hover:text-amber-600',
    },
    rose: {
        accent: 'bg-rose-500',
        surface: 'from-white to-rose-50/60 dark:from-slate-900 dark:to-rose-950/30',
        iconBg: 'bg-rose-100',
        iconBgDark: 'dark:bg-rose-900/30',
        iconText: 'text-rose-600',
        iconTextDark: 'dark:text-rose-400',
        borderHover: 'hover:border-rose-400',
        shadowHover: 'hover:shadow-rose-500/15',
        text: 'group-hover:text-rose-600',
    },
};

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState({ reviews_count: 0, comments_count: 0, services_count: 0, articles_count: 0 });
    const router = useRouter();

    const supabase = getAuthClient();

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        if (!supabase) { router.push('/login'); return; }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        const { data } = await supabase
            .from('member_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        setProfile(data || { full_name: user?.user_metadata?.full_name || 'عضو', role: 'member' });

        // Fetch activity stats
        const { data: statsData } = await getMyActivityStats();
        setStats(statsData);

        setLoading(false);
    };

    const handleLogout = async () => {
        // Use server-side signout to properly clear HTTP-only session cookies
        await fetch('/api/auth/signout', { method: 'POST' });
        router.push('/login');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;

    interface ActionCardProps {
        title: string;
        desc: string;
        icon: LucideIcon;
        href: string;
        color: string;
        pending?: boolean;
    }

    const ActionCard = ({ title, desc, icon: Icon, href, color, pending }: ActionCardProps) => {
        const theme = COLOR_THEME[color] || COLOR_THEME.emerald;
        return (
            <Link
                href={href}
                className={`group relative overflow-hidden bg-gradient-to-br ${theme.surface} p-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-xl ${theme.shadowHover} hover:-translate-y-1 ${theme.borderHover} transition-all duration-300`}
            >
                {/* Accent stripe — right edge in RTL */}
                <span className={`absolute top-0 right-0 h-full w-1 ${theme.accent} opacity-70 group-hover:opacity-100 transition-opacity`} />

                <div className={`w-14 h-14 rounded-2xl ${theme.iconBg} ${theme.iconBgDark} ${theme.iconText} ${theme.iconTextDark} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm`}>
                    <Icon size={28} />
                </div>
                <h3 className={`text-lg font-black text-slate-800 dark:text-white mb-2 ${theme.text} transition-colors`}>{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{desc}</p>

                <span className={`inline-flex items-center gap-1 text-xs font-bold ${theme.iconText} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    ابدأ الآن
                    <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
                </span>

                {pending && (
                    <div className="absolute top-4 left-4 bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        قريباً
                    </div>
                )}
            </Link>
        );
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">


            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="mb-10 text-center space-y-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-[11px] font-black tracking-wider uppercase">
                        <Sparkles size={12} />
                        لوحة العضو
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white">
                        مرحباً <span className="text-emerald-600">{profile?.full_name?.split(' ')[0] || 'بك'}</span> — ماذا تريد أن تشارك اليوم؟
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                        ساهم في بناء أكبر دليل عربي في تركيا بمعلوماتك وخبراتك
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ActionCard
                        title="أضف خدمة جديدة"
                        desc="هل أنت طبيب، محامي، أو تقدم خدمة؟ أضف تفاصيل عملك ليجده العملاء."
                        icon={Briefcase}
                        color="emerald"
                        href="/dashboard/services/new"
                    />

                    <ActionCard
                        title="أضف خبر أو مقال"
                        desc="شارك أخباراً تهم الجالية أو مقالاً تعريفياً بمعلومة قانونية أو عامة."
                        icon={FileText}
                        color="blue"
                        href="/dashboard/articles/new"
                    />

                    <ActionCard
                        title="شارك فكرة أو سيناريو"
                        desc="لديك اقتراح أو سيناريو أو نصيحة؟ شاركه معنا لنطوره."
                        icon={BrainCircuit}
                        color="violet"
                        href="/dashboard/scenarios/new"
                    />

                    <ActionCard
                        title="الملف الشخصي"
                        desc="عدّل اسمك وصورتك ومعلوماتك الشخصية."
                        icon={UserCircle}
                        color="amber"
                        href="/dashboard/profile"
                    />

                    <ActionCard
                        title="نشاطي"
                        desc="تصفح تقييماتك وتعليقاتك وخدماتك ومقالاتك."
                        icon={Activity}
                        color="rose"
                        href="/dashboard/activity"
                    />
                </div>

                {/* Activity Stats */}
                <div className="mt-12">
                    <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                        <span className="w-1.5 h-8 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full"></span>
                        إحصائيات نشاطك
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-black tracking-wider uppercase rounded-full">
                            مباشر
                        </span>
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'تقييمات', count: stats.reviews_count, icon: Star, color: 'amber' },
                            { label: 'تعليقات', count: stats.comments_count, icon: MessageCircle, color: 'blue' },
                            { label: 'خدمات', count: stats.services_count, icon: Briefcase, color: 'emerald' },
                            { label: 'مقالات', count: stats.articles_count, icon: FileText, color: 'violet' },
                        ].map((s) => {
                            const Icon = s.icon;
                            const theme = COLOR_THEME[s.color] || COLOR_THEME.emerald;
                            return (
                                <Link
                                    key={s.label}
                                    href="/dashboard/activity"
                                    className={`group relative overflow-hidden bg-gradient-to-br ${theme.surface} rounded-2xl border border-slate-200 dark:border-slate-700 p-5 text-center hover:shadow-lg ${theme.shadowHover} hover:-translate-y-1 ${theme.borderHover} transition-all`}
                                >
                                    <span className={`absolute top-0 right-0 h-full w-0.5 ${theme.accent} opacity-60 group-hover:opacity-100 transition-opacity`} />
                                    <div className={`w-12 h-12 mx-auto mb-3 rounded-xl ${theme.iconBg} ${theme.iconBgDark} ${theme.iconText} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <Icon size={22} />
                                    </div>
                                    <div className="text-3xl font-black text-slate-800 dark:text-white tabular-nums" dir="ltr">{s.count}</div>
                                    <div className="text-xs text-slate-500 mt-1 font-bold">{s.label}</div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
