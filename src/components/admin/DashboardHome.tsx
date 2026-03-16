'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Briefcase, FileText, Bell, Users, TrendingUp, Clock, Plus, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import logger from '@/lib/logger';

export default function DashboardHome({ onNavigate }: { onNavigate: (tab: string) => void }) {
    const { showToast } = useToast();
    const [stats, setStats] = useState({
        services: 0,
        articles: 0,
        updates: 0,
        pendingReviews: 0
    });
    const [recentServices, setRecentServices] = useState<any[]>([]);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                if (!supabase) return;

                // 1. Counts
                const { count: sCount } = await supabase.from('service_providers').select('*', { count: 'exact', head: true });
                const { count: aCount } = await supabase.from('articles').select('*', { count: 'exact', head: true });
                const { count: uCount } = await supabase.from('updates').select('*', { count: 'exact', head: true });

                setStats({
                    services: sCount || 0,
                    articles: aCount || 0,
                    updates: uCount || 0,
                    pendingReviews: 0 // Future
                });

                // 2. Recent Services
                const { data: recent } = await supabase
                    .from('service_providers')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (recent) setRecentServices(recent);

            } catch (err) {
                logger.error(err);
                showToast('فشل تحميل بيانات اللوحة', 'error');
            }
        }

        fetchDashboardData();
    }, []);

    const StatCard = ({ title, count, icon: Icon, color, onClick }: any) => (
        <div
            onClick={onClick}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
                    <Icon size={24} className={color.replace('bg-', 'text-')} />
                </div>
                <span className="text-3xl font-bold text-slate-800 dark:text-slate-100 group-hover:scale-110 transition-transform">
                    {count}
                </span>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 font-bold text-sm">{title}</h3>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">مرحباً بك، المدير 👋</h2>
                    <p className="text-slate-500 text-sm">إليك نظرة عامة على أداء المنصة اليوم.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/" target="_blank" className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition">
                        <ExternalLink size={18} />
                        زيارة الموقع
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="إجمالي الخدمات"
                    count={stats.services}
                    icon={Briefcase}
                    color="bg-emerald-500"
                    onClick={() => onNavigate('services')}
                />
                <StatCard
                    title="المقالات المنشورة"
                    count={stats.articles}
                    icon={FileText}
                    color="bg-blue-500"
                    onClick={() => onNavigate('articles')}
                />
                <StatCard
                    title="التحديثات والأخبار"
                    count={stats.updates}
                    icon={Bell}
                    color="bg-amber-500"
                    onClick={() => onNavigate('updates')}
                />
                <StatCard
                    title="زوار اليوم"
                    count={Math.floor(Math.random() * 50) + 120} // Mock for now
                    icon={Users}
                    color="bg-purple-500 text-purple-600"
                    onClick={() => { }}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Clock className="text-slate-400" size={20} />
                            أحدث الخدمات المضافة
                        </h3>
                        <button onClick={() => onNavigate('services')} className="text-sm text-emerald-600 font-bold hover:underline">عرض الكل</button>
                    </div>

                    <div className="space-y-4">
                        {recentServices.map((service) => (
                            <div key={service.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 transition">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-bold">
                                        {service.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{service.name}</h4>
                                        <p className="text-xs text-slate-500">{service.profession} • {service.city}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400 font-mono">
                                    {new Date(service.created_at).toLocaleDateString('ar-TR')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <TrendingUp className="text-emerald-400" />
                        إجراءات سريعة
                    </h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => onNavigate('services')}
                            className="w-full flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition backdrop-blur-sm"
                        >
                            <div className="p-2 bg-emerald-500 rounded-lg"><Plus size={16} /></div>
                            <span className="font-bold text-sm">إضافة خدمة جديدة</span>
                        </button>

                        <button
                            onClick={() => onNavigate('updates')}
                            className="w-full flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition backdrop-blur-sm"
                        >
                            <div className="p-2 bg-amber-500 rounded-lg"><Bell size={16} /></div>
                            <span className="font-bold text-sm">نشر تحديث عاجل</span>
                        </button>

                        <button
                            onClick={() => onNavigate('articles')}
                            className="w-full flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition backdrop-blur-sm"
                        >
                            <div className="p-2 bg-blue-500 rounded-lg"><FileText size={16} /></div>
                            <span className="font-bold text-sm">كتابة مقال جديد</span>
                        </button>

                        <button
                            onClick={() => onNavigate('home_manager')}
                            className="w-full flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition backdrop-blur-sm"
                        >
                            <div className="p-2 bg-purple-500 rounded-lg"><FileText size={16} /></div>
                            <span className="font-bold text-sm">إدارة الصفحة الرئيسية</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
