'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DataTable } from '@/components/admin/DataTable';
import { Briefcase, ArrowRight, Loader2, Save, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { ServiceEditor } from '@/components/admin/editors/ServiceEditor';
import { toast } from 'sonner';

// Copied SaveBar for independence
const SaveBar = ({ onSave, onDelete, onCancel, loading, isNew }: { onSave: () => void, onDelete: () => void, onCancel: () => void, loading: boolean, isNew: boolean }) => (
    <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center gap-4 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {!isNew && (
            <button
                onClick={onDelete}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold transition-all disabled:opacity-50"
            >
                <Trash2 size={18} /> حذف العنصر
            </button>
        )}
        <div className="flex gap-3 mr-auto w-full md:w-auto justify-end">
            <button
                onClick={onCancel}
                disabled={loading}
                className="px-6 py-3 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-all"
            >
                إلغاء
            </button>
            <button
                onClick={onSave}
                disabled={loading}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-10 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-70 active:scale-95"
            >
                {loading ? <Loader2 className="animate-spin" size={22} /> : <Save size={22} />}
                {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
        </div>
    </div>
);

export default function AdminServicesPage() {
    const [selectedItem, setSelectedItem] = useState<{ id: string; data?: any } | null>(null);
    const [form, setForm] = useState<any>({});
    const [saving, setSaving] = useState(false);

    // Load Data into Form when selected
    useEffect(() => {
        if (selectedItem) {
            setForm(selectedItem.data || {});
        } else {
            setForm({});
        }
    }, [selectedItem]);

    const handleSave = async () => {
        if (!selectedItem) return;
        if (!supabase) return toast.error('❌ خطأ: لا يوجد اتصال بقاعدة البيانات');

        setSaving(true);
        try {
            // 1. Sanitization (Strict Mock of GlobalSearchAdmin logic)
            const clean = { ...form };

            // Remove 'active', 'whatsapp', and 'rating' (schema mismatch fix)
            delete clean.active;
            delete clean.whatsapp;
            delete clean.rating;

            // Clean nulls/undefined/empty
            Object.keys(clean).forEach(key => {
                if (clean[key] === undefined || clean[key] === null) delete clean[key];
            });

            // Validation
            if (!clean.name) { alert("يرجى إدخال اسم الخدمة"); throw new Error("اسم الخدمة مطلوب"); }
            if (!clean.city) { alert("يرجى إدخال المدينة"); throw new Error("المدينة مطلوبة"); }
            if (!clean.description) { alert("يرجى إدخال الوصف"); throw new Error("الوصف مطلوب"); }

            // Auto-fill category if missing (DB constraint)
            if (!clean.category) {
                clean.category = clean.profession || 'عام';
            }

            // Prepare Payload
            const payload = selectedItem.id === 'new' ? { ...clean } : { id: selectedItem.id, ...clean };
            if (selectedItem.id === 'new') delete payload.id;



            // Execute Upsert to 'service_providers'
            const { error } = await supabase.from('service_providers').upsert(payload);
            if (error) throw error;

            toast.success('✅ تم حفظ الخدمة بنجاح');
            setSelectedItem(null);
            // We need to trigger refresh on DataTable. Simple way: reload page or use a refresh key if DataTable accepted it.
            // For now, reloading is safest to ensure consistency.
            window.location.reload();

        } catch (err: any) {
            console.error("Supabase Error:", JSON.stringify(err, null, 2));
            alert('❌ حدث خطأ: ' + (err.message || 'خطأ غير معروف'));
            toast.error('❌ حدث خطأ: ' + (err.message || 'خطأ غير معروف'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        // ... (unchanged)
        if (!selectedItem || selectedItem.id === 'new') return;
        if (!confirm('هل أنت متأكد من الحذف؟')) return;
        if (!supabase) return toast.error('❌ خطأ: لا يوجد اتصال بقاعدة البيانات');

        setSaving(true);
        try {
            const { error } = await supabase.from('service_providers').delete().eq('id', selectedItem.id);
            if (error) throw error;
            toast.success('🗑️ تم الحذف');
            setSelectedItem(null);
            window.location.reload();
        } catch (err: any) {
            toast.error('❌ خطأ: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Headers ... */}
            <div className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors w-fit">
                <Link href="/admin" className="flex items-center gap-2">
                    <ArrowRight size={20} />
                    <span className="font-bold">العودة للرئيسية</span>
                </Link>
            </div>

            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <Briefcase size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">الخدمات والمهن</h1>
                    <p className="text-slate-500 mt-1">إدارة مقدمي الخدمات والأطباء والمحامين</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <DataTable
                    tableName="service_providers"
                    title="قائمة الخدمات"
                    type="service"
                    columns={[
                        { key: 'name', label: 'الاسم' },
                        { key: 'profession', label: 'التخصص' },
                        { key: 'phone', label: 'الهاتف' },
                        { key: 'city', label: 'المدينة' }
                    ]}
                    searchFields={['name', 'profession', 'description', 'city']}
                    onEdit={(item) => setSelectedItem({ id: item.id, data: item })}
                    onCreate={() => setSelectedItem({ id: 'new', data: { profession: '' } })} // Removed rating: 5
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
                            <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>
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
