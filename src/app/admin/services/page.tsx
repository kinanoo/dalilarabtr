'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DataTable } from '@/components/admin/DataTable';
import { Briefcase, ArrowRight, Loader2, Save, Trash2, X, CheckCircle2, Clock, MapPin, PhoneCall, Star } from 'lucide-react';
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
import {
    isGeneratedServiceDescription,
    isValidExplicitWhatsApp,
    serviceProviderQualityIssues,
    hasQualityServiceDescription,
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
    weakDescriptions: number;
    featured: number;
}

// Copied SaveBar for independence
const SaveBar = ({ onSave, onDelete, onCancel, loading, isNew }: { onSave: () => void, onDelete: () => void, onCancel: () => void, loading: boolean, isNew: boolean }) => (
    <div className="p-3 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {!isNew && (
            <button
                onClick={onDelete}
                disabled={loading}
                className="flex min-h-11 items-center justify-center gap-2 px-4 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold transition-all disabled:opacity-50"
            >
                <Trash2 size={18} /> حذف
            </button>
        )}
        <div className="flex gap-2 sm:gap-3 mr-auto w-full sm:w-auto justify-end">
            <button
                onClick={onCancel}
                disabled={loading}
                className="min-h-11 px-4 sm:px-6 py-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-all"
            >
                إلغاء
            </button>
            <button
                onClick={onSave}
                disabled={loading}
                className="flex-1 sm:flex-none flex min-h-11 items-center justify-center gap-2 px-6 sm:px-10 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-base sm:text-lg shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-70 active:scale-95"
            >
                {loading ? <Loader2 className="animate-spin" size={22} /> : <Save size={22} />}
                {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
        </div>
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

    const issueLabels: Record<string, string> = {
        missing_whatsapp: 'خدمات بلا واتساب صالح',
        weak_description: 'أوصاف آلية أو ضعيفة',
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
                    client.from('service_providers').select('whatsapp, description').limit(2000),
                ]);
                if (qualityResult.error) throw qualityResult.error;
                const qualityRows = qualityResult.data || [];
                const missingWhatsapp = qualityRows.filter((row) => !isValidExplicitWhatsApp(row.whatsapp)).length;
                const weakDescriptions = qualityRows.filter((row) =>
                    !String(row.description || '').trim() || isGeneratedServiceDescription(row.description),
                ).length;
                if (mounted) {
                    setStats({ total, approved, pending, missingWhatsapp, missingCity, weakDescriptions, featured });
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

    const customFilter = useMemo<((query: any) => any) | undefined>(() => {
        if (issueType === 'missing_whatsapp') {
            return (q: { or: (filter: string) => unknown }) => q.or('whatsapp.is.null,whatsapp.eq.""');
        }
        if (issueType === 'weak_description') {
            return (q: { or: (filter: string) => unknown }) => q.or('description.is.null,description.eq."",description.ilike.%يعرّف عن%,description.ilike.%ويتيح التواصل%');
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
    }, [issueType]);

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
            if (!clean.description) { toast.error("يرجى إدخال الوصف"); throw new Error("الوصف مطلوب"); }
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

    const statCards = [
        { label: 'كل الخدمات', value: stats?.total ?? 0, icon: Briefcase, href: '/admin/services', tone: 'slate' },
        { label: 'منشورة', value: stats?.approved ?? 0, icon: CheckCircle2, href: '/admin/services?issue=approved', tone: 'emerald' },
        { label: 'بانتظار المراجعة', value: stats?.pending ?? 0, icon: Clock, href: '/admin/services?issue=pending', tone: 'amber' },
        { label: 'واتساب ناقص', value: stats?.missingWhatsapp ?? 0, icon: PhoneCall, href: '/admin/services?issue=missing_whatsapp', tone: 'rose' },
        { label: 'وصف آلي أو فارغ', value: stats?.weakDescriptions ?? 0, icon: Clock, href: '/admin/services?issue=weak_description', tone: 'amber' },
        { label: 'بدون مدينة', value: stats?.missingCity ?? 0, icon: MapPin, href: '/admin/services?issue=missing_city', tone: 'sky' },
        { label: 'مميزة', value: stats?.featured ?? 0, icon: Star, href: '/admin/services?issue=featured', tone: 'violet' },
    ];

    return (
        <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
            <AdminPageHeader
                icon={Briefcase}
                theme="blue"
                title="الخدمات والمهن"
                subtitle="إدارة مقدمي الخدمات والأطباء والمحامين"
                eyebrow="دليل"
            />

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
                {statCards.map((item) => {
                    const Icon = item.icon;
                    const active = item.href.includes(`issue=${issueType}`) || (!issueType && item.href === '/admin/services');
                    return (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => router.push(item.href)}
                            className={`min-h-24 rounded-2xl border bg-white p-3 text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 ${active ? 'border-emerald-300 ring-2 ring-emerald-100 dark:border-emerald-700 dark:ring-emerald-900/40' : 'border-slate-200 dark:border-slate-800'}`}
                        >
                            <span className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl ${item.tone === 'emerald' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : item.tone === 'amber' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' : item.tone === 'rose' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300' : item.tone === 'sky' ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300' : item.tone === 'violet' ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                                <Icon size={18} />
                            </span>
                            <span className="block text-xs font-bold text-slate-500 dark:text-slate-400">{item.label}</span>
                            <span className="mt-1 block text-2xl font-black tabular-nums text-slate-950 dark:text-white">
                                {statsLoading && !stats ? '...' : item.value}
                            </span>
                        </button>
                    );
                })}
            </div>

            {issueType && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
                        <ArrowRight className="rotate-180" size={20} />
                        <span className="font-bold">
                            وضع الإصلاح: {issueLabels[issueType] || 'فلتر مخصص'}
                        </span>
                    </div>
                    <button
                        onClick={() => router.push('/admin/services')}
                        className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 rounded-lg text-sm font-bold shadow-sm"
                    >
                        إلغاء الفلتر
                    </button>
                </div>
            )}

            <details className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <summary className="list-none cursor-pointer p-4 sm:px-6 flex items-center justify-between gap-3">
                    <span className="font-black text-slate-900 dark:text-white">دفعات البحث والاستيراد</span>
                    <span className="text-xs font-bold text-slate-400 group-open:hidden">فتح</span>
                    <span className="text-xs font-bold text-slate-400 hidden group-open:inline">إغلاق</span>
                </summary>
                <div className="border-t border-slate-100 dark:border-slate-800 p-4 sm:p-6">
                    <ServiceResearchQueue />
                </div>
            </details>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-6 shadow-sm">
                <DataTable
                    tableName="service_providers"
                    title="قائمة الخدمات"
                    type="service"
                    customFilter={customFilter}
                    refreshKey={refreshKey}
                    columns={[
                        { key: 'name', label: 'الاسم' },
                        { key: 'category', label: 'التصنيف' },
                        { key: 'profession', label: 'الخدمة' },
                        {
                            key: 'description',
                            label: 'جودة الوصف',
                            render: (value) => hasQualityServiceDescription(value) ? (
                                <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">مكتمل</span>
                            ) : (
                                <span className="inline-flex rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">يحتاج كتابة</span>
                            ),
                        },
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
                    onCreate={() => openEditor({ id: 'new', data: { profession: '', status: 'pending', verification_level: 'listed' } })}
                />
            </div>

            {/* Editor Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex justify-center items-end md:items-center overflow-hidden md:py-10" onClick={() => setSelectedItem(null)}>
                    <div className="w-full max-w-5xl bg-white dark:bg-slate-900 shadow-2xl md:rounded-2xl border-t md:border border-slate-200 dark:border-slate-800 flex flex-col relative h-[90vh] md:h-auto md:max-h-[85vh]" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div>
                                <h3 className="font-bold text-xl">{selectedItem.id === 'new' ? 'إضافة خدمة جديدة' : 'تعديل خدمة'}</h3>
                                <p className="text-xs text-slate-400 font-mono mt-1">{selectedItem.id === 'new' ? 'New Entry' : selectedItem.id}</p>
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full" aria-label="إغلاق"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 max-h-[70vh]">
                            <ServiceEditor form={form} setForm={setForm} />
                        </div>

                        <SaveBar onSave={handleSave} onDelete={handleDelete} onCancel={() => setSelectedItem(null)} loading={saving} isNew={selectedItem.id === 'new'} />
                    </div>
                </div>
            )}
        </div>
    );
}
