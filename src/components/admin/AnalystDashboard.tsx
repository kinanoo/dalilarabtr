'use client';

import { useState, useEffect, useRef } from 'react';
import { AnalystEngine, Insight } from '@/lib/AnalystEngine';
import { Play, CheckCircle, AlertTriangle, MapPin, ArrowRight, Loader2, Sparkles, BrainCircuit, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { adminUpdate } from '@/lib/adminApi';
import { motion, AnimatePresence } from 'framer-motion';

import { useRouter } from 'next/navigation';
import logger from '@/lib/logger';

export function AnalystDashboard() {
    const router = useRouter();
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [logs, setLogs] = useState<{ message: string; time: string }[]>([]);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    // Auto-scroll to bottom of logs
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    // Auto-fetch REMOVED as per user request (start fresh on every visit)
    // useEffect(() => {
    //     fetchInsights();
    // }, []);

    async function fetchInsights(silent = false) {
        if (!supabase) return;
        if (!silent) setLoading(true);
        // Only fetch unresolved insights
        const { data, error } = await supabase
            .from('analyst_insights')
            .select('*')
            .eq('is_resolved', false)
            .order('created_at', { ascending: false });

        if (error) logger.error('fetchInsights error:', error.message);
        if (data) setInsights(data as Insight[]);
        if (!silent) setLoading(false);
    }

    async function handleIgnore(id?: string) {
        if (!id) return;

        // Optimistic update
        setInsights(prev => prev.filter(i => i.id !== id));

        // Update DB — log error but don't revert (optimistic is fine for UX)
        const { error } = await adminUpdate('analyst_insights', { is_resolved: true }, id);
        if (error) logger.error('handleIgnore error:', error.message);
    }

    async function runAnalysis() {
        setAnalyzing(true);
        setLogs([]); // Clear previous logs (each entry is { message, time })
        setInsights([]); // Clear old results to start fresh stream

        // Callback to update logs live — capture timestamp at creation time
        const onLog = (msg: string) => {
            const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setLogs(prev => [...prev, { message: msg, time }]);
        };

        // Callback for streaming insights live
        const onInsight = (item: Insight) => {
            setInsights(prev => [item, ...prev]);
        };

        try {
            // Run analysis with streaming
            await AnalystEngine.runFullAnalysis(onLog, onInsight);
            // Final sync (silent) to get IDs or updates
            await fetchInsights(true);
        } catch (err) {
            logger.error('runAnalysis error:', err instanceof Error ? err.message : err);
            onLog('❌ خطأ في التحليل: ' + (err instanceof Error ? err.message : 'خطأ غير معروف'));
        } finally {
            setAnalyzing(false);
        }
    }

    function handleAction(insight: Insight) {
        if (!insight) return;

        switch (insight.type) {
            case 'gap':
                // Ideally, gap analysis should provide a link to "Create New Service" with pre-filled city/category
                // For now, we go to services list filtered by city
                const gapParams = new URLSearchParams();
                if (insight.metadata?.city) gapParams.set('search', insight.metadata.city);
                router.push(`/admin/services?${gapParams.toString()}`);
                break;

            case 'logic':
            case 'conflict':
            case 'structure':
            case 'quality':
                // Check for direct IDs first for immediate deep linking
                if (insight.metadata?.articleId) {
                    router.push(`/admin/articles/${insight.metadata.articleId}`);
                } else if (insight.metadata?.serviceId) {
                    router.push(`/admin/services?id=${insight.metadata.serviceId}`);
                } else if (insight.metadata?.context) {
                    // Fallback to search
                    const searchParams = new URLSearchParams();
                    searchParams.set('search', insight.metadata.context);
                    router.push(`/admin/articles?${searchParams.toString()}`);
                } else {
                    // Generic fallback
                    router.push(insight.type === 'logic' ? '/admin/articles' : '/admin/services');
                }
                break;

            case 'review_mismatch':
                router.push(`/admin/reviews`);
                break;

            case 'duplication':
                // If we have IDs, maybe go to the first one?
                // Duplication usually involves multiple items.
                // Best to search by phone to show them all together.
                const dupeParams = new URLSearchParams();
                if (insight.metadata?.phone) dupeParams.set('search', insight.metadata.phone);
                router.push(`/admin/services?${dupeParams.toString()}`);
                break;

            default:
                break;
        }
    }

    return (
        <div className="space-y-6">
            {/* Control Panel — accent stripe + gradient + premium CTA */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white to-violet-50/40 dark:from-slate-900 dark:to-violet-950/15 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <span className="absolute top-0 right-0 h-full w-1.5 bg-gradient-to-b from-violet-500 to-purple-500 opacity-80 pointer-events-none" />
                {/* Soft glow blob to give the panel some editorial depth */}
                <span className="absolute -left-12 -bottom-12 w-56 h-56 bg-violet-300/20 dark:bg-violet-700/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-[10px] font-black tracking-wider uppercase mb-2">
                        <BrainCircuit size={12} />
                        تحليل ذكي
                    </span>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white">بدء التحليل الشامل</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        سيقوم المحلل بفحص 3 طبقات: الفجوات، المنطق، والتناقضات.
                    </p>
                </div>

                <div className="relative flex flex-col gap-3 items-center md:items-end">
                    <button
                        onClick={runAnalysis}
                        disabled={analyzing}
                        className="group/run relative overflow-hidden bg-gradient-to-l from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-violet-600/30 hover:shadow-xl hover:shadow-violet-600/40 hover:-translate-y-0.5 active:scale-95"
                    >
                        {analyzing ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                جاري التحليل...
                            </>
                        ) : (
                            <>
                                <Sparkles className="group-hover/run:rotate-12 transition-transform" />
                                تشغيل المحلل الآن
                            </>
                        )}
                    </button>
                    {analyzing && (
                        <div className="text-xs font-mono text-violet-500 dark:text-violet-300 animate-pulse">
                            جاري فحص البيانات... يرجى الانتظار
                        </div>
                    )}
                </div>
            </div>

            {/* Live Analysis Log — terminal style w/ accent stripe */}
            {logs.length > 0 && (
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 to-slate-900 font-mono text-sm p-4 rounded-2xl border border-slate-800 shadow-inner h-96 overflow-y-auto custom-scrollbar flex flex-col-reverse" dir="ltr">
                    <span className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-violet-500 to-purple-500 opacity-70 pointer-events-none z-10" />
                    <div ref={messagesEndRef} />
                    {logs.slice().reverse().map((log, i) => {
                        const msg = log.message;
                        let className = "text-slate-300";
                        if (msg.includes('⚠️')) className = "text-amber-400 border-l-2 border-amber-500/30 pl-2 bg-amber-500/5";
                        else if (msg.includes('❌')) className = "text-red-400 font-bold bg-red-500/10 p-1 rounded";
                        else if (msg.includes('✅')) className = "text-emerald-400 font-bold text-lg py-2 border-y border-emerald-500/20";
                        else if (msg.includes('💾')) className = "text-blue-400";
                        else if (msg.includes('♻️')) className = "text-slate-500 italic";
                        else if (msg.includes('1/7') || msg.includes('2/7') || msg.includes('7/7')) className = "text-white font-bold mt-2 pt-2 border-t border-slate-800";

                        return (
                            <div key={i} className={`mb-1 py-0.5 ${className}`}>
                                <span className="opacity-30 text-xs mr-2 select-none font-sans">
                                    {log.time}
                                </span>
                                {msg}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Results Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                    {insights.map((insight, idx) => {
                        // Per-type theme: gap (missing service) = amber, everything
                        // else (logic/conflict/quality) reads blue. Surfaces +
                        // chip + icon tile + accent stripe all share the colour
                        // so the admin can scan the wall at a glance.
                        const isGap = insight.type === 'gap';
                        const theme = isGap
                            ? { accent: 'bg-amber-500', surface: 'from-white to-amber-50/40 dark:from-slate-900 dark:to-amber-950/15', chip: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', icon: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', shadow: 'hover:shadow-amber-500/10', border: 'hover:border-amber-300' }
                            : { accent: 'bg-blue-500',  surface: 'from-white to-blue-50/40 dark:from-slate-900 dark:to-blue-950/15',   chip: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',         icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',         shadow: 'hover:shadow-blue-500/10',  border: 'hover:border-blue-300' };

                        return (
                            <motion.div
                                key={insight.id || idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`group relative overflow-hidden bg-gradient-to-br ${theme.surface} p-5 rounded-2xl border border-slate-200 dark:border-slate-800 ${theme.border} shadow-sm hover:shadow-md ${theme.shadow} hover:-translate-y-0.5 transition-all`}
                            >
                                <span className={`absolute top-0 right-0 h-full w-1 ${theme.accent} opacity-70 group-hover:opacity-100 transition-opacity`} />

                                <div className="flex items-start justify-between mb-3 relative">
                                    <div className={`p-2.5 rounded-2xl ${theme.icon} shadow-sm group-hover:rotate-3 group-hover:scale-110 transition-transform`}>
                                        {isGap ? <MapPin size={20} /> : <AlertTriangle size={20} />}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-wider ${theme.chip} px-2 py-0.5 rounded-lg`}>
                                        {insight.type}
                                    </span>
                                </div>

                                <h4 className="font-black text-lg text-slate-800 dark:text-white mb-2 line-clamp-2 leading-snug relative">
                                    {insight.title}
                                </h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-3 leading-relaxed relative">
                                    {insight.description}
                                </p>

                                <div className="flex gap-2 relative">
                                    <button
                                        onClick={() => handleAction(insight)}
                                        className="group/act flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-black text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95"
                                    >
                                        اتخاذ إجراء
                                        <ArrowRight size={14} className="rotate-180 group-hover/act:-translate-x-0.5 transition-transform" />
                                    </button>
                                    <button
                                        onClick={() => handleIgnore(insight.id)}
                                        className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-red-500 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/15 transition-all hover:scale-110 active:scale-95"
                                        title="تجاهل هذه الملاحظة (لن تظهر مرة أخرى)"
                                    >
                                        <EyeOff size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {!loading && insights.length === 0 && (
                <div className="relative overflow-hidden text-center py-20 bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/15 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-900/40">
                    <span className="absolute top-0 right-0 h-full w-1 bg-emerald-500 opacity-50" />
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200/60 dark:from-emerald-900/40 dark:to-emerald-800/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <CheckCircle size={36} />
                    </div>
                    <h4 className="text-xl font-black text-slate-800 dark:text-white">لا توجد ملاحظات حالياً</h4>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-bold">النظام يبدو بحالة ممتازة! أو لم تقم بالتحليل بعد.</p>
                </div>
            )}
        </div>
    );
}
