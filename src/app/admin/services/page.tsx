'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { DataTable } from '@/components/admin/DataTable';
import { Briefcase, Loader2, Save, Trash2, X, CheckCircle2, Clock, MapPin, PhoneCall, Star, Plus, ExternalLink, RefreshCw, CircleAlert } from 'lucide-react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import {
    ServiceEditor,
    type ServiceEditorForm,
} from '@/components/admin/editors/ServiceEditor';
import { toast } from 'sonner';
import { useSearchParams, useRouter } from 'next/navigation';
import logger from '@/lib/logger';
import { extractErrorMessage } from '@/lib/errors';
import ServiceResearchQueue from '@/components/admin/ServiceResearchQueue';
import ServiceClaimsPanel from '@/components/admin/ServiceClaimsPanel';
import {
    isValidExplicitWhatsApp,
    serviceProviderQualityIssues,
} from '@/lib/serviceProviderQuality';

type ServiceFormData = ServiceEditorForm &
    Record<string, string | boolean | string[] | null | undefined>;

interface SelectedItem {
    id: string;
    data?: ServiceFormData;
}

interface ServiceStats {
    total: number;
    approved: number;
    pending: number;
    missingWhatsapp: number;
    missingCity: number;
    featured: number;
}

interface QualityIssueIds {
    missingWhatsapp: string[];
}

// Copied SaveBar for independence
const SaveBar = ({ onSave, onDelete, onCancel, loading, isNew }: { onSave: () => void, onDelete: () => void, onCancel: () => void, loading: boolean, isNew: boolean }) => (
    <div className="sticky bottom-0 z-10 flex items-center gap-2 border-t border-slate-200 bg-white p-3 shadow-[0_-4px_10px_-6px_rgba(15,23,42,0.25)] sm:p-4 dark:border-slate-800 dark:bg-slate-900">
        {!isNew && (
            <button
                onClick={onDelete}
                disabled={loading}
                title="حذف الخدمة"
                aria-label="حذف الخدمة"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300"
            >
                <Trash2 size={18} />
            </button>
        )}
        <button
            onClick={onCancel}
            disabled={loading}
            className="h-11 shrink-0 rounded-lg px-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
        >
            إلغاء
        </button>
        <button
            onClick={onSave}
            disabled={loading}
            className="flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-70 active:scale-[0.98] sm:mr-auto sm:max-w-64"
        >
            {loading ? <Loader2 className="animate-spin" size={19} /> : <Save size={19} />}
            {loading ? 'جاري الحفظ...' : isNew ? 'إضافة المزوّد' : 'حفظ التعديلات'}
        </button>
    </div>
);

export default function AdminServicesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const issueType = searchParams.get('issue');
    const editId = searchParams.get('id');

    const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
    const [form, setForm] = useState<ServiceFormData>({});
    const [saving, setSaving] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [stats, setStats] = useState<ServiceStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [qualityIssueIds, setQualityIssueIds] = useState<QualityIssueIds>({
        missingWhatsapp: [],
    });

    const issueLabels: Record<string, string> = {
        missing_whatsapp: 'خدمات بلا واتساب صالح',
        missing_city: 'خدمات بدون مدينة',
        pending: 'بانتظار المراجعة',
        approved: 'الخدمات المنشورة',
        featured: 'الخدمات المميزة',
    };

    // Auto-open editor if id is passed in URL
    useEffect(() => {
        let mounted = true;
        async function loadService() {
            if (editId && supabase) {
                const { data } = await supabase.from('service_providers').select('*').eq('id', editId).single();
                if (data && mounted) {
                    setSelectedItem({ id: data.id, data });
                    setForm(data);
                }
            }
        }
        loadService();
        return () => { mounted = false; };
    }, [editId]);

    useEffect(() => {
        if (!selectedItem) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !saving) setSelectedItem(null);
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [saving, selectedItem]);

    useEffect(() => {
        let mounted = true;
        async function loadStats() {
            const client = supabase;
            if (!client) return;
            setStatsLoading(true);
            try {
                const countRows = async (filter?: (query: any) => any) => {
                    let query = client
                        .from('service_providers')
                        .select('id', { count: 'exact', head: true });
                    if (filter) query = filter(query);
                    const { count, error } = await query;
                    if (error) throw error;
                    return count || 0;
                };
                const [total, approved, pending, missingCity, featured, qualityResult] = await Promise.all([
                    countRows(),
                    countRows((q) => q.eq('status', 'approved')),
                    countRows((q) => q.eq('status', 'pending')),
                    countRows((q) => q.or('city.is.null,city.eq.""')),
                    countRows((q) => q.eq('is_featured', true)),
                    client.from('service_providers').select('id, whatsapp').limit(2000),
                ]);
                if (qualityResult.error) throw qualityResult.error;
                const qualityRows = qualityResult.data || [];
                const missingWhatsappIds = qualityRows
                    .filter((row) => !isValidExplicitWhatsApp(row.whatsapp))
                    .map((row) => String(row.id));
                if (mounted) {
                    setQualityIssueIds({
                        missingWhatsapp: missingWhatsappIds,
                    });
                    setStats({
                        total,
                        approved,
                        pending,
                        missingWhatsapp: missingWhatsappIds.length,
                        missingCity,
                        featured,
                    });
                }
            } catch (err) {
                logger.error('services stats failed:', err);
            } finally {
                if (mounted) setStatsLoading(false);
            }
        }
        loadStats();
        return () => { mounted = false; };
    }, [refreshKey]);

    const customFilter: ((query: any) => any) | undefined = (() => {
        if (issueType === 'missing_whatsapp') {
            return (q: any) => qualityIssueIds.missingWhatsapp.length > 0
                ? q.in('id', qualityIssueIds.missingWhatsapp)
                : q.eq('id', '__no_missing_whatsapp__');
        }
        if (issueType === 'missing_city') {
            return (q: { or: (filter: string) => unknown }) => q.or('city.is.null,city.eq.""');
        }
        if (issueType === 'pending') {
            return (q: { eq: (key: string, value: string) => unknown }) => q.eq('status', 'pending');
        }
        if (issueType === 'approved') {
            return (q: { eq: (key: string, value: string) => unknown }) => q.eq('status', 'approved');
        }
        if (issueType === 'featured') {
            return (q: { eq: (key: string, value: boolean) => unknown }) => q.eq('is_featured', true);
        }
        return undefined;
    })();
    const customFilterKey = `${issueType || 'all'}:${qualityIssueIds.missingWhatsapp.join(',')}`;

    const openEditor = (item: SelectedItem) => {
        setSelectedItem(item);
        setForm(item.data || {});
    };

    const handleSave = async () => {
        if (!selectedItem) return;
        if (!supabase) return toast.error('❌ خطأ: لا يوجد اتصال بقاعدة البيانات');

        setSaving(true);
        try {
            // 1. Sanitization (Strict Mock of GlobalSearchAdmin logic)
            const clean = { ...form };

            // Remove UI-only and calculated fields.
            delete clean.active;
            delete clean.rating;

            // Clean nulls/undefined/empty
            Object.keys(clean).forEach(key => {
                if (clean[key] === undefined || clean[key] === null) delete clean[key];
            });

            // Validation
            if (!clean.name) { toast.error("يرجى إدخال اسم الخدمة"); throw new Error("اسم الخدمة مطلوب"); }
            if (!clean.city) { toast.error("يرجى إدخال المدينة"); throw new Error("المدينة مطلوبة"); }
            if (clean.status === 'approved') {
                const issues = serviceProviderQualityIssues(clean);
                if (issues.length > 0) {
                    throw new Error(`لا يمكن النشر: ${issues.join('، ')}`);
                }
            }

            // Auto-fill category if missing (DB constraint)
            if (!clean.category) {
                clean.category = clean.profession || 'عام';
            }

            // Persist via the server-side admin API — column-whitelisted +
            // validated server-side (no direct client write to service_providers).
            const res = await fetch('/api/admin/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedItem.id, data: clean }),
            });
            const result = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(result.error || 'فشل الحفظ');

            toast.success('✅ تم حفظ الخدمة بنجاح');
            setSelectedItem(null);
            setRefreshKey(k => k + 1);

        } catch (err) {
            logger.error("Supabase Error:", JSON.stringify(err, null, 2));
            toast.error('❌ حدث خطأ: ' + (err instanceof Error ? err.message : 'خطأ غير معروف'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedItem || selectedItem.id === 'new') return;
        if (!confirm('هل أنت متأكد من الحذف؟')) return;

        setSaving(true);
        try {
            const res = await fetch('/api/admin/delete-record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ table: 'service_providers', id: selectedItem.id }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'فشل الحذف');
            toast.success('🗑️ تم الحذف');
            setSelectedItem(null);
            setRefreshKey(k => k + 1);
        } catch (err) {
            toast.error('❌ خطأ: ' + (extractErrorMessage(err)));
        } finally {
            setSaving(false);
        }
    };

    const summaryStats = [
        { label: 'كل السجلات', value: stats?.total ?? 0, icon: Briefcase, href: '/admin/services' },
        { label: 'منشورة', value: stats?.approved ?? 0, icon: CheckCircle2, href: '/admin/services?issue=approved' },
        { label: 'قيد المراجعة', value: stats?.pending ?? 0, icon: Clock, href: '/admin/services?issue=pending' },
    ];
    const qualityActions = [
        { label: 'واتساب غير صالح', value: stats?.missingWhatsapp ?? 0, icon: PhoneCall, href: '/admin/services?issue=missing_whatsapp' },
        { label: 'مدينة ناقصة', value: stats?.missingCity ?? 0, icon: MapPin, href: '/admin/services?issue=missing_city' },
        { label: 'خدمة مميزة', value: stats?.featured ?? 0, icon: Star, href: '/admin/services?issue=featured' },
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-4 p-3 sm:p-6">
            <AdminPageHeader
                icon={Briefcase}
                theme="emerald"
                title="الخدمات والمهن"
                subtitle="إضافة مقدمي الخدمات ومراجعة جاهزيتهم للنشر"
                eyebrow="دليل"
                actions={(
                    <div className="grid grid-cols-[auto_auto_1fr] gap-2 sm:flex sm:items-center">
                        <button
                            type="button"
                            onClick={() => setRefreshKey((key) => key + 1)}
                            aria-label="تحديث البيانات"
                            title="تحديث البيانات"
                            className="grid h-11 w-11 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        >
                            <RefreshCw size={17} className={statsLoading ? 'animate-spin' : ''} />
                        </button>
                        <Link
                            href="/services"
                            target="_blank"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <ExternalLink size={16} />
                            <span className="hidden sm:inline">فتح الدليل</span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => openEditor({ id: 'new', data: { profession: '', status: 'pending', verification_level: 'listed' } })}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.98]"
                        >
                            <Plus size={17} />
                            إضافة مزوّد
                        </button>
                    </div>
                )}
            />

            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="grid grid-cols-3 divide-x divide-x-reverse divide-slate-200 dark:divide-slate-800">
                {summaryStats.map((item) => {
                    const Icon = item.icon;
                    const active = item.href.includes(`issue=${issueType}`) || (!issueType && item.href === '/admin/services');
                    return (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => router.push(item.href)}
                            className={`flex min-h-16 items-center gap-2 px-3 py-2 text-right transition sm:px-5 ${active ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/25 dark:text-emerald-100' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
                        >
                            <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 sm:inline-flex dark:bg-slate-800 dark:text-slate-300">
                                <Icon size={17} />
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-[10px] font-bold text-slate-500 sm:text-xs dark:text-slate-400">{item.label}</span>
                                <span className="block text-lg font-black tabular-nums text-slate-950 sm:text-xl dark:text-white">
                                    {statsLoading && !stats ? '...' : item.value}
                                </span>
                            </span>
                        </button>
                    );
                })}
                </div>

                <div className="border-t border-slate-200 px-3 py-3 sm:px-5 dark:border-slate-800">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-black text-slate-900 dark:text-white">قائمة العمل</h2>
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">اختر مشكلة لعرض السجلات التي تحتاج إصلاحاً فقط.</p>
                        </div>
                        {issueType && (
                            <button type="button" onClick={() => router.push('/admin/services')} className="text-xs font-black text-emerald-700 hover:underline dark:text-emerald-300">
                                عرض الكل
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {qualityActions.map((item) => {
                            const Icon = item.icon;
                            const active = item.href.includes(`issue=${issueType}`);
                            return (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => router.push(item.href)}
                                    className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 text-right transition ${active
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/25 dark:text-emerald-100'
                                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
                                    }`}
                                >
                                    <Icon size={15} className="shrink-0 text-slate-500 dark:text-slate-400" />
                                    <span className="min-w-0 flex-1 truncate text-[11px] font-black sm:text-xs">{item.label}</span>
                                    <span className="text-sm font-black tabular-nums">{statsLoading && !stats ? '...' : item.value}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            <ServiceClaimsPanel />

            {issueType && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-100">
                    <div className="flex min-w-0 items-center gap-2">
                        <CircleAlert size={17} className="shrink-0" />
                        <span className="truncate text-sm font-black">المعروض الآن: {issueLabels[issueType] || 'فلتر مخصص'}</span>
                    </div>
                    <button
                        onClick={() => router.push('/admin/services')}
                        className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-black shadow-sm hover:bg-slate-50 dark:bg-slate-800"
                    >
                        إلغاء
                    </button>
                </div>
            )}

            <section className="rounded-lg border border-slate-200 bg-white p-3 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
                <DataTable
                    tableName="service_providers"
                    title="مقدمو الخدمات"
                    searchPlaceholder="ابحث بالاسم أو المهنة أو المدينة أو الرقم..."
                    type="service"
                    customFilter={customFilter}
                    customFilterKey={customFilterKey}
                    refreshKey={refreshKey}
                    onMutation={() => setRefreshKey((key) => key + 1)}
                    columns={[
                        { key: 'name', label: 'الاسم' },
                        { key: 'category', label: 'التصنيف' },
                        { key: 'profession', label: 'الخدمة' },
                        {
                            key: 'city',
                            label: 'المدينة',
                            render: (value) => value ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-xs font-bold text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
                                    <MapPin size={12} /> {value}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">بدون مدينة</span>
                            ),
                        },
                        {
                            key: 'phone',
                            label: 'التواصل',
                            render: (_value, row) => isValidExplicitWhatsApp(row.whatsapp) ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                                    <PhoneCall size={12} /> واتساب جاهز
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">غير منشور للعامة</span>
                            ),
                        },
                        {
                            key: 'status',
                            label: 'الحالة',
                            render: (value) => {
                                const status = String(value || 'approved');
                                const label = status === 'approved' ? 'منشور' : status === 'pending' ? 'مراجعة' : status === 'draft' ? 'مسودة' : 'موقوف';
                                const tone = status === 'approved'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                                    : status === 'pending'
                                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
                                return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-black ${tone}`}>{label}</span>;
                            },
                        },
                    ]}
                    searchFields={['name', 'category', 'profession', 'description', 'city', 'phone', 'whatsapp']}
                    onEdit={(item) => openEditor({ id: item.id, data: item })}
                />
            </section>

            <details className="group rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:px-5">
                    <span>
                        <span className="block text-sm font-black text-slate-900 dark:text-white">أدوات البحث والاستيراد</span>
                        <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">للإضافات الجماعية فقط؛ لا تحتاجها في العمل اليومي.</span>
                    </span>
                    <span className="text-xs font-bold text-slate-400 group-open:hidden">فتح</span>
                    <span className="hidden text-xs font-bold text-slate-400 group-open:inline">إغلاق</span>
                </summary>
                <div className="border-t border-slate-100 p-4 sm:p-6 dark:border-slate-800">
                    <ServiceResearchQueue />
                </div>
            </details>

            {/* Editor Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-[60] flex items-end justify-center overflow-hidden bg-slate-950/55 backdrop-blur-sm md:items-center md:p-6" onClick={() => { if (!saving) setSelectedItem(null); }}>
                    <div role="dialog" aria-modal="true" aria-labelledby="service-editor-title" className="relative flex h-[calc(100dvh-3rem)] w-full max-w-5xl flex-col rounded-t-xl border-t border-slate-200 bg-white shadow-2xl md:h-auto md:max-h-[88vh] md:rounded-xl md:border dark:border-slate-800 dark:bg-slate-900" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5 dark:border-slate-800 dark:bg-slate-900">
                            <h3 id="service-editor-title" className="text-lg font-black text-slate-950 dark:text-white">{selectedItem.id === 'new' ? 'إضافة مقدم خدمة' : 'تعديل مقدم الخدمة'}</h3>
                            <button disabled={saving} onClick={() => setSelectedItem(null)} className="grid h-10 w-10 place-items-center rounded-lg bg-white text-slate-600 transition hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300" aria-label="إغلاق"><X size={19} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            <ServiceEditor form={form} setForm={setForm} />
                        </div>

                        <SaveBar onSave={handleSave} onDelete={handleDelete} onCancel={() => setSelectedItem(null)} loading={saving} isNew={selectedItem.id === 'new'} />
                    </div>
                </div>
            )}
        </div>
    );
}
