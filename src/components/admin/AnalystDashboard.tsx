'use client';

import { useState, useEffect, useRef } from 'react';
import { AnalystEngine, Insight } from '@/lib/AnalystEngine';
import { Play, CheckCircle, AlertTriangle, MapPin, ArrowRight, Loader2, Sparkles, BrainCircuit, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

import { useRouter } from 'next/navigation';

export function AnalystDashboard() {
    const router = useRouter();
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
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
        const { data } = await supabase
            .from('analyst_insights')
            .select('*')
            .eq('is_resolved', false)
            .order('created_at', { ascending: false });

        if (data) setInsights(data as Insight[]);
        if (!silent) setLoading(false);
    }

    async function handleIgnore(id?: string) {
        if (!id || !supabase) return;

        // Optimistic update
        setInsights(prev => prev.filter(i => i.id !== id));

        // Update DB
        await supabase.from('analyst_insights').update({ is_resolved: true }).eq('id', id);
    }

    async function runAnalysis() {
        setAnalyzing(true);
        setLogs([]); // Clear previous logs
        setInsights([]); // Clear old results to start fresh stream

        // Callback to update logs live
        const onLog = (msg: string) => {
            setLogs(prev => [...prev, msg]);
        };

        // Callback for streaming insights live
        const onInsight = (item: Insight) => {
            setInsights(prev => [item, ...prev]);
        };

        // Run analysis with streaming
        await AnalystEngine.runFullAnalysis(onLog, onInsight);

        // Final sync (silent) to get IDs or updates
        await fetchInsights(true);
        setAnalyzing(false);
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
        <div className="space-y-8">
            {/* Control Panel */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-lg font-bold">بدء التحليل الشامل</h3>
                    <p className="text-sm text-slate-500">سيقوم المحلل بفحص 3 طبقات: الفجوات، المنطق، والتناقضات.</p>
                </div>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={runAnalysis}
                        disabled={analyzing}
                        className="relative overflow-hidden bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {analyzing ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                جاري التحليل...
                            </>
                        ) : (
                            <>
                                <Sparkles className="group-hover:rotate-12 transition-transform" />
                                تشغيل المحلل الآن
                            </>
                        )}
                    </button>
                    {analyzing && (
                        <div className="text-xs font-mono text-slate-500 animate-pulse">
                            جاري فحص البيانات... يرجى الانتظار
                        </div>
                    )}
                </div>
            </div>

            {/* Live Analysis Log */}
            {logs.length > 0 && (
                <div className="bg-slate-950 font-mono text-sm p-4 rounded-xl border border-slate-800 shadow-inner h-96 overflow-y-auto custom-scrollbar flex flex-col-reverse" dir="ltr">
                    <div ref={messagesEndRef} />
                    {logs.slice().reverse().map((log, i) => {
                        let className = "text-slate-300";
                        if (log.includes('⚠️')) className = "text-amber-400 border-l-2 border-amber-500/30 pl-2 bg-amber-500/5";
                        else if (log.includes('❌')) className = "text-red-400 font-bold bg-red-500/10 p-1 rounded";
                        else if (log.includes('✅')) className = "text-emerald-400 font-bold text-lg py-2 border-y border-emerald-500/20";
                        else if (log.includes('💾')) className = "text-blue-400";
                        else if (log.includes('♻️')) className = "text-slate-500 italic";
                        else if (log.includes('1/7') || log.includes('2/7') || log.includes('7/7')) className = "text-white font-bold mt-2 pt-2 border-t border-slate-800";

                        return (
                            <div key={i} className={`mb-1 py-0.5 ${className}`}>
                                <span className="opacity-30 text-xs mr-2 select-none font-sans">
                                    {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                                {log}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Results Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                    {insights.map((insight, idx) => (
                        <motion.div
                            key={insight.id || idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
                        >
                            {/* Decorative side bar */}
                            <div className={`absolute top-0 right-0 bottom-0 w-1 ${insight.type === 'gap' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>

                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-2 rounded-lg ${insight.type === 'gap' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {insight.type === 'gap' ? <MapPin size={20} /> : <AlertTriangle size={20} />}
                                </div>
                                <span className="text-xs font-bold uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                    {insight.type}
                                </span>
                            </div>

                            <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-2 line-clamp-2">
                                {insight.title}
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-3">
                                {insight.description}
                            </p>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAction(insight)}
                                    className="flex-1 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    اتخاذ إجراء <ArrowRight size={14} className="rotate-180" />
                                </button>
                                <button
                                    onClick={() => handleIgnore(insight.id)}
                                    className="px-3 py-2 bg-transparent border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 hover:text-red-500 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                    title="تجاهل هذه الملاحظة (لن تظهر مرة أخرى)"
                                >
                                    <EyeOff size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {!loading && insights.length === 0 && (
                <div className="text-center py-20 opacity-50">
                    <BrainCircuit size={64} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-xl font-medium text-slate-500">لا توجد ملاحظات حالياً. النظام يبدو بحالة ممتازة! أو لم تقم بالتحليل بعد.</p>
                </div>
            )}
        </div>
    );
}
