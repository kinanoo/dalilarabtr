'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ShieldCheck, AlertTriangle, CheckCircle, RefreshCw, AlertOctagon, ArrowRight, EyeOff, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Link from 'next/link';
import logger from '@/lib/logger';

// === Type Definitions ===
interface IntegrityIssue {
    type: string;
    severity: string;
    label: string;
    count: number;
    table: string;
}

interface IntegrityReport {
    timestamp: string;
    issues: IntegrityIssue[];
}

const IGNORED_KEY = 'integrity_ignored_types';

function getIgnored(): Record<string, boolean> {
    try { return JSON.parse(localStorage.getItem(IGNORED_KEY) || '{}'); } catch { return {}; }
}
function saveIgnored(d: Record<string, boolean>) {
    localStorage.setItem(IGNORED_KEY, JSON.stringify(d));
}

export default function IntegrityMonitor() {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<IntegrityReport | null>(null);
    const [lastScan, setLastScan] = useState<string | null>(null);
    const [ignored, setIgnored] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setIgnored(getIgnored());
    }, []);

    const toggleIgnore = (type: string) => {
        const next = { ...ignored, [type]: !ignored[type] };
        if (!next[type]) delete next[type];
        setIgnored(next);
        saveIgnored(next);
    };

    const runClientSideScan = async () => {
        if (!supabase) return;
        try {
            const [
                { count: servicesNoPhone },
                { count: servicesNoCity },
                { count: zonesCount }
            ] = await Promise.all([
                supabase.from('service_providers').select('*', { count: 'exact', head: true }).or('phone.is.null,phone.eq.""'),
                supabase.from('service_providers').select('*', { count: 'exact', head: true }).or('city.is.null,city.eq.""'),
                supabase.from('zones').select('*', { count: 'exact', head: true }).or('notes.is.null,notes.eq.""')
            ]);

            const fallbackReport = {
                timestamp: new Date().toISOString(),
                issues: [
                    { type: 'service_contact', severity: 'critical', label: 'خدمات بدون رقم هاتف', count: servicesNoPhone || 0, table: 'service_providers' },
                    { type: 'service_location', severity: 'high', label: 'خدمات بدون مدينة', count: servicesNoCity || 0, table: 'service_providers' },
                    { type: 'zone_info', severity: 'medium', label: 'مناطق بدون ملاحظات', count: zonesCount || 0, table: 'zones' }
                ]
            };
            setReport(fallbackReport);
            setLastScan(new Date().toLocaleTimeString('ar-SA'));
        } catch (e) {
            logger.error('Fallback scan failed', e);
            toast.error('فشل الفحص تماماً. يرجى التحقق من اتصال الإنترنت.');
        }
    };

    const runScan = async () => {
        setLoading(true);
        if (!supabase) return;

        try {
            const { data, error } = await supabase.rpc('check_data_integrity');
            if (error) throw error;
            setReport(data);
            setLastScan(new Date().toLocaleTimeString('ar-SA'));
        } catch (err) {
            logger.warn('RPC Scan failed, attempting client-side fallback...', (err instanceof Error ? err.message : String(err)));
            await runClientSideScan();
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (s: string) => {
        switch (s) {
            case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200';
            case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200';
            default: return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200';
        }
    };

    const getSeverityIcon = (s: string) => {
        switch (s) {
            case 'critical': return AlertOctagon;
            case 'high': return AlertTriangle;
            default: return ShieldCheck;
        }
    };

    // Only count non-ignored issues
    const activeIssues = report?.issues?.filter((i: IntegrityIssue) => !ignored[i.type]) || [];
    const ignoredIssues = report?.issues?.filter((i: IntegrityIssue) => ignored[i.type]) || [];
    const totalIssues = activeIssues.reduce((acc: number, curr: IntegrityIssue) => acc + (curr.count || 0), 0);

    // Severity-weighted score with diminishing returns (log scale)
    const severityWeight: Record<string, number> = { critical: 3, high: 2, medium: 1 };
    const totalPenalty = activeIssues.reduce((acc: number, issue: IntegrityIssue) => {
        if (!issue.count || issue.count === 0) return acc;
        const weight = severityWeight[issue.severity] || 1;
        return acc + weight * Math.min(10, Math.ceil(Math.log2(issue.count + 1)));
    }, 0);
    const healthScore = report ? Math.max(0, 100 - totalPenalty) : 0;

    const activeWithIssues = activeIssues.filter((i: IntegrityIssue) => i.count > 0);
    const ignoredWithIssues = ignoredIssues.filter((i: IntegrityIssue) => i.count > 0);

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="text-emerald-500" size={32} />
                        فحص النزاهة الذكي
                    </h2>
                    <p className="text-slate-500 mt-1">نظام مسح آلي للكشف عن أي خلل في جودة البيانات (Data Integrity)</p>
                </div>

                <button
                    onClick={runScan}
                    disabled={loading}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg shadow-emerald-500/20 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'جاري الفحص المخبري...' : 'بدء الفحص الشامل'}
                </button>
            </div>

            {/* Results Area */}
            {report && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Score Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>

                        <div className="flex-1 text-center md:text-right z-10">
                            <h3 className="text-lg font-bold text-slate-500 uppercase tracking-widest mb-2">مؤشر جودة النظام</h3>
                            <div className="flex items-baseline gap-2 justify-center md:justify-start">
                                <span className={`text-6xl font-black ${healthScore > 80 ? 'text-emerald-500' : healthScore > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                    {healthScore}%
                                </span>
                                <span className="text-slate-400 font-bold">/ 100</span>
                            </div>
                            <p className="text-slate-400 mt-2 text-sm">
                                {healthScore === 100 ? 'النظام مثالي! لا توجد مشاكل.' :
                                    healthScore > 80 ? 'حالة النظام ممتازة، بعض الملاحظات البسيطة.' :
                                        healthScore > 50 ? 'بعض المشاكل تحتاج مراجعة عند التوفر.' :
                                            'النظام بحاجة لعناية — راجع التفاصيل أدناه.'}
                            </p>
                        </div>

                        {/* Summary Stats */}
                        <div className="flex gap-4 md:gap-8 z-10">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-slate-800 dark:text-white">{totalIssues}</div>
                                <div className="text-xs text-slate-500 font-bold uppercase mt-1">مشكلة نشطة</div>
                            </div>
                            <div className="w-px bg-slate-200 dark:bg-slate-700 h-12"></div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-slate-800 dark:text-white">{ignoredWithIssues.length}</div>
                                <div className="text-xs text-slate-500 font-bold uppercase mt-1">فئة متجاهَلة</div>
                            </div>
                        </div>

                        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-slate-50 dark:bg-slate-800 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                    </div>

                    {/* Active Issues */}
                    <div className="grid grid-cols-1 gap-4">
                        {activeWithIssues.length === 0 && ignoredWithIssues.length === 0 ? (
                            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                <CheckCircle className="mx-auto text-emerald-500 mb-4" size={48} />
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">نتيجة نظيفة!</h3>
                                <p className="text-slate-500">لم يتم العثور على أي مشاكل تطابق معايير الفحص الحالية.</p>
                            </div>
                        ) : (
                            <>
                                {activeWithIssues.map((issue: IntegrityIssue, idx: number) => {
                                    const Icon = getSeverityIcon(issue.severity);
                                    return (
                                        <motion.div
                                            key={issue.type}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center gap-4 ${getSeverityColor(issue.severity)} bg-opacity-50`}
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="p-3 bg-white dark:bg-slate-900 rounded-full shadow-sm">
                                                    <Icon size={24} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-lg">{issue.label}</h4>
                                                    <p className="opacity-80 text-sm">الجدول المتأثر: <span className="font-mono uppercase">{issue.table}</span></p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 self-end md:self-auto">
                                                <div className="text-2xl font-black bg-white dark:bg-slate-900 px-4 py-2 rounded-lg min-w-[3rem] text-center shadow-sm">
                                                    {issue.count}
                                                </div>

                                                {getFixLink(issue.type) && (
                                                    <Link
                                                        href={getFixLink(issue.type)!}
                                                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold hover:opacity-90 transition-opacity shadow-lg shadow-slate-900/10"
                                                    >
                                                        <span>إصلاح</span>
                                                        <ArrowRight className="rotate-180" size={16} />
                                                    </Link>
                                                )}

                                                <button
                                                    onClick={() => toggleIgnore(issue.type)}
                                                    title="تجاهل هذه الفئة"
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                                                >
                                                    <EyeOff size={14} />
                                                    تجاهل
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}

                                {/* Ignored Issues — collapsed section */}
                                {ignoredWithIssues.length > 0 && (
                                    <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <EyeOff size={13} />
                                            فئات متجاهَلة ({ignoredWithIssues.length}) — لا تؤثر على النتيجة
                                        </p>
                                        <div className="space-y-2">
                                            {ignoredWithIssues.map((issue: IntegrityIssue) => (
                                                <div key={issue.type} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 opacity-60 hover:opacity-100 transition-opacity">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-slate-400 font-bold text-sm">{issue.label}</span>
                                                        <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-mono">{issue.count}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => toggleIgnore(issue.type)}
                                                        title="إعادة تفعيل هذه الفئة"
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                                                    >
                                                        <Eye size={13} />
                                                        إعادة تفعيل
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            )}

            {!report && !loading && (
                <div className="text-center py-20 opacity-50">
                    <ShieldCheck size={64} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-xl font-medium text-slate-500">جاهز للفحص. اضغط الزر أعلاه للبدء.</p>
                </div>
            )}
        </div>
    );
}

function getFixLink(type: string): string | null {
    switch (type) {
        case 'service_contact': return '/admin/services?issue=missing_phone';
        case 'service_location': return '/admin/services?issue=missing_city';
        case 'zone_info': return '/admin/zones?issue=missing_notes';
        default: return null;
    }
}
