'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
    BadgeCheck,
    Check,
    Database,
    FileJson,
    Loader2,
    SearchCheck,
    Upload,
    X,
} from 'lucide-react';
import { toast } from 'sonner';

type CandidateRow = {
    id: string;
    candidate_data: {
        name?: string;
        profession?: string;
        category?: string;
        city?: string;
        phone?: string;
        languages?: string[];
    };
    sources: Array<{ type?: string; url?: string }>;
    status: string;
    confidence: number;
    duplicate_provider_id?: string | null;
    created_at: string;
};

export default function ServiceResearchQueue() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [rows, setRows] = useState<CandidateRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [setupRequired, setSetupRequired] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);

    const load = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/services/candidates', {
                headers: { Accept: 'application/json' },
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error || 'تعذّر التحميل');
            setRows(Array.isArray(payload.rows) ? payload.rows : []);
            setSetupRequired(Boolean(payload.setupRequired));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'تعذّر تحميل دفعات البحث');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = window.setTimeout(() => void load(), 0);
        return () => window.clearTimeout(timer);
    }, []);

    const readyRows = useMemo(
        () => rows.filter((row) => row.status === 'ready'),
        [rows],
    );

    const post = async (body: Record<string, unknown>) => {
        const response = await fetch('/api/admin/services/candidates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'فشلت العملية');
        return payload;
    };

    const importFile = async (file: File) => {
        setBusy(true);
        try {
            const raw = JSON.parse(await file.text());
            const candidates = Array.isArray(raw) ? raw : raw.candidates;
            if (!Array.isArray(candidates)) throw new Error('الملف لا يحتوي مصفوفة candidates');
            const result = await post({
                action: 'stage',
                label: raw.label || file.name.replace(/\.json$/i, ''),
                candidates,
            });
            toast.success(`تم إدخال ${result.staged} سجل للمراجعة، منها ${result.ready} جاهز`);
            await load();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'ملف غير صالح');
        } finally {
            setBusy(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const setStatus = async (id: string, status: 'ready' | 'rejected') => {
        setBusy(true);
        try {
            await post({ action: 'set_status', id, status });
            await load();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'فشلت المراجعة');
        } finally {
            setBusy(false);
        }
    };

    const publishSelected = async () => {
        if (selected.length === 0) return;
        setBusy(true);
        try {
            const result = await post({ action: 'publish', ids: selected });
            toast.success(`نُشر ${result.published}، وتوقف ${result.duplicates} بسبب التكرار`);
            setSelected([]);
            await load();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'فشل النشر');
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 className="animate-spin" size={22} />
            </div>
        );
    }

    if (setupRequired) {
        return (
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 text-sm">
                <Database className="text-amber-600 shrink-0" size={20} />
                <div>
                    <p className="font-black text-amber-900 dark:text-amber-200">يلزم تفعيل جداول البحث مرة واحدة</p>
                    <p className="mt-1 text-amber-800/80 dark:text-amber-300/80">
                        ملف التهيئة جاهز باسم service_directory_scale.sql. بعد تشغيله تظهر دفعات البحث هنا.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="font-black text-slate-900 dark:text-white inline-flex items-center gap-2">
                        <SearchCheck size={19} className="text-emerald-600" />
                        دفعات البحث والمراجعة
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        السجل يبقى داخلياً حتى اعتماده ونشره.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void importFile(file);
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-4 py-2.5 text-sm font-black text-white dark:text-slate-900 disabled:opacity-50"
                    >
                        {busy ? <Loader2 size={17} className="animate-spin" /> : <Upload size={17} />}
                        استيراد دفعة JSON
                    </button>
                    <button
                        type="button"
                        onClick={publishSelected}
                        disabled={busy || selected.length === 0}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-black text-white disabled:opacity-40"
                    >
                        <BadgeCheck size={17} />
                        نشر المحدد ({selected.length})
                    </button>
                </div>
            </div>

            {rows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 py-10 text-center text-sm text-slate-500">
                    <FileJson className="mx-auto mb-2" size={26} />
                    لا توجد دفعات بحث بعد.
                </div>
            ) : (
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                    {rows.map((row) => {
                        const data = row.candidate_data || {};
                        const isReady = row.status === 'ready';
                        const checked = selected.includes(row.id);
                        const servesInArabic = data.languages?.some((language) =>
                            language.includes('العربية'),
                        );
                        return (
                            <div
                                key={row.id}
                                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-3"
                            >
                                <input
                                    type="checkbox"
                                    aria-label={`تحديد ${data.name || 'السجل'}`}
                                    checked={checked}
                                    disabled={!isReady}
                                    onChange={(event) => setSelected((current) =>
                                        event.target.checked
                                            ? [...current, row.id]
                                            : current.filter((id) => id !== row.id),
                                    )}
                                />
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-black text-sm text-slate-900 dark:text-white truncate">
                                            {data.name || 'بدون اسم'}
                                        </p>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                            isReady
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                                                : row.status === 'rejected'
                                                    ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
                                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                                        }`}>
                                            {isReady ? 'جاهز' : row.status === 'rejected' ? 'مرفوض' : 'يحتاج مراجعة'}
                                        </span>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                            servesInArabic
                                                ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300'
                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                                        }`}>
                                            {servesInArabic ? 'يقدّم الخدمة بالعربية' : 'راجع توفر العربية'}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500 truncate">
                                        {data.profession} · {data.city} · ثقة {row.confidence}% · {row.sources?.length || 0} مصدر
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    {!isReady && row.status !== 'rejected' && (
                                        <button
                                            type="button"
                                            onClick={() => void setStatus(row.id, 'ready')}
                                            disabled={busy}
                                            title="اعتماد للمراجعة النهائية"
                                            className="p-2 rounded-lg text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30"
                                        >
                                            <Check size={16} />
                                        </button>
                                    )}
                                    {row.status !== 'rejected' && (
                                        <button
                                            type="button"
                                            onClick={() => void setStatus(row.id, 'rejected')}
                                            disabled={busy}
                                            title="رفض"
                                            className="p-2 rounded-lg text-red-600 bg-red-50 dark:bg-red-950/30"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {readyRows.length > 0 && (
                <button
                    type="button"
                    onClick={() => setSelected(readyRows.map((row) => row.id))}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
                >
                    تحديد كل الجاهز ({readyRows.length})
                </button>
            )}
        </div>
    );
}
