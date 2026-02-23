'use client';

import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, PlusCircle, Briefcase, FileText, BrainCircuit, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface UserProfile {
    full_name: string;
    role: string;
}

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);
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
                </div>

                {/* Status Section */}
                <div className="mt-12">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
                        مساهماتك السابقة
                    </h2>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <PlusCircle size={32} />
                        </div>
                        <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-1">لا توجد مساهمات بعد</h3>
                        <p className="text-sm text-slate-500">ابدأ بإضافة خدمتك أو أول مقال لك!</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
