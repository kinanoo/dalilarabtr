'use client';

import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, Briefcase, FileText, BrainCircuit, UserCircle, Activity, Star, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMyActivityStats } from '@/lib/api/profile';

interface UserProfile {
    full_name: string;
    role: string;
}

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState({ reviews_count: 0, comments_count: 0, services_count: 0, articles_count: 0 });
    const router = useRouter();

    // useMemo ensures a single client instance across re-renders (prevents Multiple GoTrueClient warning)
    const supabase = useMemo(() => createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), []);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        // Development Member Bypass Check
        if (process.env.NODE_ENV === 'development' && document.cookie.includes('dev_member_bypass=true')) {
            setProfile({ full_name: 'عضو تجريبي', role: 'member' });
            setLoading(false);
            return;
        }

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

    const ActionCard = ({ title, desc, icon: Icon, href, color, pending }: any) => (
        <Link href={href} className="group relative bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className={`w-14 h-14 rounded-2xl bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{desc}</p>
            {pending && (
                <div className="absolute top-4 left-4 bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    قريباً
                </div>
            )}
        </Link>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">


            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="mb-10 text-center space-y-2">
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white">ماذا تريد أن تشارك اليوم؟</h1>
                    <p className="text-slate-500 dark:text-slate-400">ساهم في بناء أكبر دليل عربي في تركيا بمعلوماتك وخبراتك</p>
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
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
                        إحصائيات نشاطك
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'تقييمات', count: stats.reviews_count, icon: Star, color: 'amber' },
                            { label: 'تعليقات', count: stats.comments_count, icon: MessageCircle, color: 'blue' },
                            { label: 'خدمات', count: stats.services_count, icon: Briefcase, color: 'emerald' },
                            { label: 'مقالات', count: stats.articles_count, icon: FileText, color: 'violet' },
                        ].map((s) => {
                            const Icon = s.icon;
                            return (
                                <Link key={s.label} href="/dashboard/activity" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                    <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-${s.color}-50 dark:bg-${s.color}-900/20 text-${s.color}-600 flex items-center justify-center`}>
                                        <Icon size={22} />
                                    </div>
                                    <div className="text-3xl font-black text-slate-800 dark:text-white">{s.count}</div>
                                    <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
