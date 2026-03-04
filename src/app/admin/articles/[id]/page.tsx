'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ArticleEditor } from '@/components/admin/editors/ArticleEditor';
import { Loader2, ArrowRight, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { normalizeId } from '@/lib/useAdminData';

export default function ArticleEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const isNew = id === 'new';
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);

    // Initial Form State
    const [form, setForm] = useState<any>({
        title: '',
        category: 'e-Devlet',
        intro: '',
        details: '',
        documents: [],
        steps: [],
        tips: [],
        tags: []
    });

    // Fetch Data
    useEffect(() => {
        if (!isNew && supabase) {
            const fetchData = async () => {
                if (!supabase) return;
                const { data, error } = await supabase
                    .from('articles')
                    .select('*')
                    .eq('id', decodeURIComponent(id))
                    .single();

                if (error) {
                    toast.error('فشل تحميل المقال: ' + error.message);
                    router.push('/admin/articles');
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
        if (!supabase) return;
        setSaving(true);
        try {
            const payload = { ...form };

            // Sanitization
            delete payload.active; // Hard remove just in case
            ['steps', 'documents', 'tips', 'tags'].forEach(k => {
                if (!Array.isArray(payload[k])) payload[k] = [];
            });

            // Generate ID if new
            if (isNew && !payload.id) {
                if (!payload.title?.trim()) throw new Error('عنوان المقال مطلوب قبل الحفظ');
                payload.id = normalizeId(payload.title);
            }

            const { error } = await supabase
                .from('articles')
                .upsert(payload);

            if (error) throw error;

            toast.success(isNew ? 'تم إنشاء المقال بنجاح' : 'تم حفظ التعديلات');
            router.refresh();
            router.push('/admin/articles');
        } catch (err: any) {
            toast.error('خطأ في الحفظ: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>;

    return (
        <div className="p-6 max-w-5xl mx-auto pb-32">
            <div className="mb-6">
                <Link href="/admin/articles" className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 w-fit mb-4">
                    <ArrowRight size={20} />
                    <span className="font-bold">العودة للقائمة</span>
                </Link>
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                        {isNew ? 'كتابة مقال جديد' : 'تعديل المقال'}
                    </h1>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <ArticleEditor form={form} setForm={setForm} />
            </div>

            {/* Sticky Save Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-4 z-50 md:pl-64 shadow-lg">
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
                    {saving ? 'جاري الحفظ...' : 'حفظ ونشر'}
                </button>
            </div>
        </div>
    );
}
