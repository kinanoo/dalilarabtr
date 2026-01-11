'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ShieldCheck, AlertTriangle, CheckCircle, RefreshCw, AlertOctagon, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function IntegrityMonitor() {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<any>(null);
    const [lastScan, setLastScan] = useState<string | null>(null);

    const runClientSideScan = async () => {
        if (!supabase) return;
        try {
            // Parallel requests for speed - Client Side Fallback
            const [
                { count: servicesNoPhone },
                { count: servicesNoCity },
                { count: zonesCount }
            ] = await Promise.all([
                supabase.from('service_providers').select('*', { count: 'exact', head: true }).or('phone.is.null,phone.eq.""'),
                supabase.from('service_providers').select('*', { count: 'exact', head: true }).or('city.is.null,city.eq.""'),
                supabase.from('restricted_zones').select('*', { count: 'exact', head: true }).or('notes.is.null,notes.eq.""')
            ]);

            const fallbackReport = {
                timestamp: new Date().toISOString(),
                issues: [
                    { type: 'service_contact', severity: 'critical', label: 'خدمات بدون رقم هاتف', count: servicesNoPhone || 0, table: 'service_providers' },
                    { type: 'service_location', severity: 'high', label: 'خدمات بدون مدينة', count: servicesNoCity || 0, table: 'service_providers' },
                    { type: 'zone_info', severity: 'medium', label: 'مناطق بدون ملاحظات', count: zonesCount || 0, table: 'restricted_zones' }
                ]
            };
            setReport(fallbackReport);
            setLastScan(new Date().toLocaleTimeString('ar-SA'));
        } catch (e) {
            console.error('Fallback scan failed', e);
            alert('فشل الفحص تماماً. يرجى التحقق من اتصال الإنترنت.');
        }
    };

    const runScan = async () => {
        setLoading(true);
        if (!supabase) return;

        try {
            // Try standard RPC first
            const { data, error } = await supabase.rpc('check_data_integrity');
            if (error) throw error;
            setReport(data);
            setLastScan(new Date().toLocaleTimeString('ar-SA'));
        } catch (err: any) {
            console.warn('RPC Scan failed, attempting client-side fallback...', err.message);
            // Switch to client-side fallback silently
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

    const totalIssues = report?.issues?.reduce((acc: number, curr: any) => acc + (curr.count || 0), 0) || 0;
    const healthScore = report ? Math.max(0, 100 - (totalIssues * 5)) : 0; // Fixed null score issue

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
                                        'النظام بحاجة لعناية فورية.'}
                            </p>
                        </div>

                        {/* Summary Stats */}
                        <div className="flex gap-4 md:gap-8 z-10">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-slate-800 dark:text-white">{totalIssues}</div>
                                <div className="text-xs text-slate-500 font-bold uppercase mt-1">مشكلة مكتشفة</div>
                            </div>
                            <div className="w-px bg-slate-200 dark:bg-slate-700 h-12"></div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-slate-800 dark:text-white">{report.issues.length}</div>
                                <div className="text-xs text-slate-500 font-bold uppercase mt-1">معايير الفحص</div>
                            </div>
                        </div>

                        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-slate-50 dark:bg-slate-800 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                    </div>

                    {/* Detailed Issues Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        {report.issues.filter((i: any) => i.count > 0).length === 0 ? (
                            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                <CheckCircle className="mx-auto text-emerald-500 mb-4" size={48} />
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">نتيجة نظيفة!</h3>
                                <p className="text-slate-500">لم يتم العثور على أي مشاكل تطابق معايير الفحص الحالية.</p>
                            </div>
                        ) : (
                            report.issues.filter((i: any) => i.count > 0).map((issue: any, idx: number) => {
                                const Icon = getSeverityIcon(issue.severity);
                                return (
                                    <motion.div
                                        key={idx}
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

                                        <div className="flex items-center gap-4 self-end md:self-auto">
                                            <div className="text-2xl font-black bg-white dark:bg-slate-900 px-4 py-2 rounded-lg min-w-[3rem] text-center shadow-sm">
                                                {issue.count}
                                            </div>

                                            {/* Fix Button Logic */}
                                            {getFixLink(issue.type) && (
                                                <Link
                                                    href={getFixLink(issue.type)!}
                                                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold hover:opacity-90 transition-opacity shadow-lg shadow-slate-900/10"
                                                >
                                                    <span>إصلاح</span>
                                                    <ArrowRight className="rotate-180" size={16} />
                                                </Link>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })
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

// Helper to map issue types to fix URLs
function getFixLink(type: string): string | null {
    switch (type) {
        case 'service_contact': return '/admin/services?issue=missing_phone';
        case 'service_location': return '/admin/services?issue=missing_city';
        case 'zone_info': return '/admin/zones?issue=missing_notes';
        default: return null;
    }
}
