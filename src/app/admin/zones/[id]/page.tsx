'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ZoneEditor } from '@/components/admin/editors/ZoneEditor';
import { Loader2, ArrowRight, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/errors';

interface ZoneFormData {
    id?: string;
    city: string;
    district?: string;
    neighborhood?: string;
    status: string;
    notes?: string;
    [key: string]: string | undefined;
}

export default function ZoneEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const isNew = id === 'new';
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);

    // Initial Form State
    const [form, setForm] = useState<ZoneFormData>({
        city: 'Istanbul',
        status: 'closed'
    });

    // Fetch Data
    useEffect(() => {
        if (!isNew && supabase) {
            const fetchData = async () => {
                if (!supabase) return;
                const { data, error } = await supabase
                    .from('zones')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) {
                    toast.error('فشل تحميل المنطقة: ' + error.message);
                    router.push('/admin/zones');
                } else if (data) {
                    setForm(data);
                }
                setLoading(false);
            };
            fetchData();
        }
    }, [id, isNew, router]);

    // Save
    const handleSave = async () => {
        setSaving(true);
        try {
            // Validation (server re-validates + whitelists columns)
            if (!form.city) throw new Error("اسم المدينة مطلوب (City is required)");

            const res = await fetch('/api/admin/zones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: isNew ? 'new' : form.id, data: form }),
            });
            const result = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(result.error || 'فشل الحفظ');

            toast.success(isNew ? 'تم إضافة المنطقة بنجاح' : 'تم حفظ التعديلات');
            router.refresh();
            router.push('/admin/zones');
        } catch (err) {
            toast.error('خطأ في الحفظ: ' + (extractErrorMessage(err)));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>;

    return (
        <div className="p-4 sm:p-5 max-w-5xl mx-auto pb-32">
            <div className="mb-4">
                <Link href="/admin/zones" className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 w-fit mb-3 text-sm">
                    <ArrowRight size={18} />
                    <span className="font-bold">العودة للقائمة</span>
                </Link>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white">
                        {isNew ? 'إضافة منطقة جديدة' : 'تعديل المنطقة'}
                    </h1>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <ZoneEditor form={form} setForm={setForm} />
            </div>

            {/* Sticky Save Bar — below xl it sits ABOVE the admin MobileBottomNav
                (h-16 + safe-area, z-[70]); bottom-0 would hide it under the nav. */}
            <div className="fixed bottom-[calc(4rem_+_env(safe-area-inset-bottom))] xl:bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-4 z-50 xl:pr-72 shadow-lg">
                <button
                    onClick={() => router.back()}
                    className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                    إلغاء
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {saving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
            </div>
        </div>
    );
}
