'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Database, Loader2, Upload, AlertTriangle } from 'lucide-react';
import {
    NAVIGATION,
    PRIMARY_NAV,
    TOOLS_MENU,
    OFFICIAL_SOURCES,
    LATEST_UPDATES
} from '@/lib/constants';
import { CATEGORY_SLUGS } from '@/lib/config';

const CONFIRM_WORD = 'MIGRATE';

export default function DataMigration() {
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmInput, setConfirmInput] = useState('');

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, msg]);
    };

    const migrateCodes = async () => {
        addLog('🚀 تخطي نقل الأكواد (تمت إزالة البيانات الثابتة).');
    };

    const migrateSources = async () => {
        addLog('🚀 البدء بنقل المصادر الرسمية (Official Sources)...');
        if (!supabase) return;

        const sources = OFFICIAL_SOURCES.map(s => ({
            name: s.name,
            url: s.url,
            description: s.desc,
            is_official: true,
            active: true
        }));

        const { error } = await supabase.from('official_sources').insert(sources);

        if (error) addLog(`❌ فشل نقل المصادر: ${error.message}`);
        else addLog(`✅ تم نقل ${sources.length} مصدر رسمي بنجاح.`);
    };

    const migrateUpdates = async () => {
        addLog('🚀 البدء بنقل التحديثات (Updates)...');
        if (!supabase) return;

        const updates = LATEST_UPDATES.map(u => ({
            title: u.title,
            type: u.type,
            content: u.content,
            date: u.date,
            active: true
        }));

        const { error } = await supabase.from('updates').insert(updates);
        if (error) addLog(`❌ فشل نقل التحديثات: ${error.message}`);
        else addLog(`✅ تم نقل ${updates.length} تحديث بنجاح.`);
    };

    const migrateFAQs = async () => {
        addLog('🚀 تخطي نقل الأسئلة الشائعة (تمت الهجرة مسبقاً).');
    };

    const migrateMenus = async () => {
        addLog('🚀 تخطي نقل القوائم (تمت الهجرة مسبقاً).');
    };

    const migrateCategories = async () => {
        addLog('🚀 تخطي نقل التصنيفات (تمت الهجرة مسبقاً).');
    };

    const migrateTools = async () => {
        addLog('🚀 تخطي نقل الأدوات (تمت الهجرة مسبقاً).');
    };

    const migrateArticles = async () => {
        addLog('🚀 تخطي نقل المقالات (تمت الهجرة مسبقاً).');
    };

    const migrateServiceProviders = async () => {
        addLog('🚀 تخطي نقل مزودي الخدمات (تمت الهجرة مسبقاً).');
    };

    const runFullMigration = async () => {
        setLoading(true);
        setLogs([]);
        try {
            await migrateMenus();
            await migrateCategories();
            await migrateTools();
            await migrateArticles();
            await migrateServiceProviders();
            await migrateCodes();
            await migrateSources();
            await migrateUpdates();
            await migrateFAQs();
            addLog('🎉 تمت العملية بالكامل! كل شيء الآن في قاعدة البيانات.');
        } catch (e: any) {
            console.error(e);
            addLog(`❌ حدث خطأ غير متوقع: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl border border-slate-800 font-mono text-sm" dir="ltr">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Database className="text-emerald-500" />
                System Data Migration
            </h3>

            <div className="mb-6 p-4 bg-slate-950 rounded-xl border border-dashed border-slate-800">
                <p className="mb-4 text-slate-400">
                    Current Static Data to Migrate:<br />
                    - {PRIMARY_NAV.length + NAVIGATION.length} Menu Items<br />
                    - {Object.keys(CATEGORY_SLUGS).length} Categories<br />
                    - {TOOLS_MENU.length} Tools<br />
                    - <strong>All Articles (Heavy Load)</strong>
                </p>

                {!showConfirm ? (
                    <button
                        onClick={() => setShowConfirm(true)}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                    >
                        <Upload size={18} />
                        Start Full Migration (Including Articles)
                    </button>
                ) : (
                    <div className="bg-red-950/40 border border-red-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 text-red-400 font-bold">
                            <AlertTriangle size={18} />
                            تأكيد عملية الترحيل — هذه العملية لا يمكن التراجع عنها
                        </div>
                        <p className="text-slate-400 text-xs">
                            اكتب <code className="bg-slate-800 px-1.5 py-0.5 rounded text-red-300 font-bold">{CONFIRM_WORD}</code> ثم اضغط تأكيد:
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={confirmInput}
                                onChange={(e) => setConfirmInput(e.target.value.toUpperCase())}
                                placeholder={CONFIRM_WORD}
                                className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg font-mono text-sm w-40 focus:outline-none focus:border-red-500"
                                autoFocus
                            />
                            <button
                                onClick={() => {
                                    setShowConfirm(false);
                                    setConfirmInput('');
                                    runFullMigration();
                                }}
                                disabled={confirmInput !== CONFIRM_WORD || loading}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                تأكيد الترحيل
                            </button>
                            <button
                                onClick={() => { setShowConfirm(false); setConfirmInput(''); }}
                                className="text-slate-400 hover:text-white px-3 py-2 rounded-lg transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-black/50 p-4 rounded-xl h-48 overflow-y-auto border border-slate-800">
                {logs.length === 0 ? (
                    <span className="text-slate-600 italic">Waiting to start...</span>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className="mb-1 font-mono">
                            {log.startsWith('❌') ? <span className="text-red-400">{log}</span> :
                                log.startsWith('✅') ? <span className="text-emerald-400">{log}</span> :
                                    log.startsWith('🚀') ? <span className="text-blue-400 border-t border-slate-800 pt-2 mt-2 block">{log}</span> :
                                        <span className="text-slate-300">{log}</span>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
