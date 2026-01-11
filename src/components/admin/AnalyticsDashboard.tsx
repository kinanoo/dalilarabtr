'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BarChart3, Users, Clock, MessageCircle, Eye, TrendingUp, Map, FileText, Briefcase, BrainCircuit, MapPin, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export function AnalyticsDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [dailyVisits, setDailyVisits] = useState<any[]>([]);
    const [topPages, setTopPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!supabase) return;
            setLoading(true);

            // Fetch General Stats
            const { data: general } = await supabase.rpc('get_dashboard_stats');
            // Fetch Daily Visits
            const { data: visits } = await supabase.rpc('get_daily_visits');
            // Fetch Top Pages
            const { data: pages } = await supabase.rpc('get_top_pages');

            setStats(general);
            setDailyVisits(visits || []);
            setTopPages(pages || []);
            setLoading(false);
        };

        fetchData();
    }, []);

    if (loading) return <div className="animate-pulse h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full"></div>;
    if (!stats) return null;

    const maxVisits = Math.max(...dailyVisits.map((v: any) => v.count), 10);

    return (
        <div className="space-y-8">
            {/* 1. Live Traffic & Engagement */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Active Users - Special Card */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl relative overflow-hidden shadow-xl">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <Users size={18} />
                            <span className="text-xs font-bold uppercase">الزوار الآن (Active)</span>
                        </div>
                        <div className="text-4xl font-black">{stats.active_users_now || 0}</div>
                        <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1 font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            النظام يعمل بكفاءة
                        </div>
                    </div>
                </div>

                {/* Visits */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <Eye size={18} />
                            <span className="text-xs font-bold uppercase">إجمالي الزوار</span>
                        </div>
                        <div className="text-3xl font-black text-slate-800 dark:text-white">{stats.total_visitors_all_time || 0}</div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div className="h-full bg-blue-500 w-[70%] rounded-full"></div>
                    </div>
                </div>

                {/* Engagement */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <MessageCircle size={18} />
                            <span className="text-xs font-bold uppercase">التفاعل المجتمعي</span>
                        </div>
                        <div className="text-3xl font-black text-slate-800 dark:text-white">{stats.total_comments || 0}</div>
                    </div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded w-fit">
                        + {stats.total_reviews || 0} تقييم خدمة
                    </div>
                </div>

                {/* Avg Time (Placeholder) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between opacity-60 grayscale">
                    <div>
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <Clock size={18} />
                            <span className="text-xs font-bold uppercase">متوسط البقاء</span>
                        </div>
                        <div className="text-3xl font-black text-slate-800 dark:text-white">--</div>
                    </div>
                    <div className="text-xs text-slate-400">سيتاح قريباً</div>
                </div>
            </div>

            {/* 2. Content Overview (Unified Live Stats) */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Activity className="text-emerald-500" size={20} />
                    نظرة عامة على المحتوى (محدث فورياً)
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <ContentStatCard title="المقالات" count={stats.total_articles} icon={FileText} color="emerald" label="مقال منشور" />
                    <ContentStatCard title="الخدمات" count={stats.total_services} icon={Briefcase} color="blue" label="مزود خدمة" />
                    <ContentStatCard title="السيناريوهات" count={stats.total_scenarios} icon={BrainCircuit} color="violet" label="سيناريو ذكي" />
                    <ContentStatCard title="المناطق المحظورة" count={stats.total_zones} icon={MapPin} color="red" label="منطقة مسجلة" />
                </div>
            </div>

            {/* 3. Charts & Top Pages */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Traffic Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <BarChart3 className="text-slate-400" size={20} />
                        زيارات آخر 30 يوم
                    </h3>

                    {dailyVisits.length > 0 ? (
                        <div className="flex items-end justify-between h-48 gap-2">
                            {dailyVisits.map((day: any, i: number) => (
                                <div key={day.date} className="flex-1 flex flex-col justify-end items-center group relative">
                                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-20 pointer-events-none">
                                        {day.count} زيارة - {day.date}
                                    </div>
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(day.count / maxVisits) * 100}%` }}
                                        transition={{ duration: 0.5, delay: i * 0.03 }}
                                        className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 dark:from-blue-600 dark:to-cyan-500 rounded-t-sm min-h-[4px] opacity-80 hover:opacity-100 transition-opacity"
                                    ></motion.div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                            لا توجد بيانات زيارات كافية للعرض
                        </div>
                    )}
                </div>

                {/* Top Pages */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">الأكثر زيارة</h3>
                    <div className="space-y-4">
                        {topPages.map((page: any, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <span className="font-mono text-xs font-bold text-slate-400 w-4">#{idx + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate dir-ltr text-left" title={page.page_path}>
                                        {page.page_path === '/' ? 'الرئيسية' : page.page_path}
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                                        <div
                                            style={{ width: `${(page.views / (topPages[0]?.views || 1)) * 100}%` }}
                                            className="h-full bg-emerald-500 rounded-full"
                                        ></div>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">{page.views}</span>
                            </div>
                        ))}
                        {topPages.length === 0 && (
                            <p className="text-slate-400 text-sm text-center py-4">جاري جمع البيانات...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ContentStatCard({ title, count, icon: Icon, color, label }: any) {
    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-lg transition-all duration-300 group">
            <div className={`p-3 rounded-xl bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400 group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">{count || 0}</h3>
                <p className="text-[10px] text-slate-400">{label}</p>
            </div>
        </div>
    );
}
