'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { CodeEditor } from '@/components/admin/editors/CodeEditor';
import { Loader2, ArrowRight, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface CodeFormData {
    code: string;
    title?: string;
    severity: string;
    category: string;
    description?: string;
    how_to_remove?: string;
    duration?: string;
    related_codes?: string[];
    related_codes_text?: string;
    [key: string]: string | string[] | undefined;
}

export default function CodeEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const isNew = id === 'new';
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);

    // Initial Form State
    const [form, setForm] = useState<CodeFormData>({
        code: '',
        severity: 'info',
        category: 'general'
    });

    // Fetch Data
    useEffect(() => {
        if (!isNew && supabase) {
            const fetchData = async () => {
                if (!supabase) return;
                // Determine ID column: usually 'code' for security_codes
                const { data, error } = await supabase
                    .from('security_codes')
                    .select('*')
                    .eq('code', id)
                    .single();

                if (error) {
                    toast.error('فشل تحميل الكود: ' + error.message);
                    router.push('/admin/codes');
                } else if (data) {
                    const mapped = { ...data };
                    // Convert related_codes array to comma-separated text for editing
                    if (Array.isArray(mapped.related_codes)) {
                        mapped.related_codes_text = mapped.related_codes.join(', ');
                    }
                    // Clean up legacy fields
                    delete mapped.solution;
                    delete mapped.effect;
                    setForm(mapped);
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

            // Ensure no legacy fields
            delete payload.solution;
            delete payload.effect;

            // Convert related_codes_text back to array for DB
            if (payload.related_codes_text) {
                payload.related_codes = payload.related_codes_text
                    .split(',')
                    .map((c: string) => c.trim())
                    .filter((c: string) => c.length > 0);
            }
            delete payload.related_codes_text;

            // When editing, preserve original code as PK to prevent duplicate creation
            if (!isNew) payload.code = id;

            if (!payload.code) {
                toast.error('الكود (Code) مطلوب');
                setSaving(false);
                return;
            }

            const { error } = await supabase
                .from('security_codes')
                .upsert(payload);

            if (error) throw error;

            toast.success(isNew ? 'تم إضافة الكود بنجاح' : 'تم حفظ التعديلات');
            router.refresh();
            router.push('/admin/codes');
        } catch (err) {
            toast.error('خطأ في الحفظ: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>;

    return (
        <div className="p-6 max-w-5xl mx-auto pb-32">
            <div className="mb-6">
                <Link href="/admin/codes" className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 w-fit mb-4">
                    <ArrowRight size={20} />
                    <span className="font-bold">العودة للقائمة</span>
                </Link>
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                        {isNew ? 'إضافة كود جديد' : 'تعديل الكود'}
                    </h1>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <CodeEditor form={form} setForm={setForm} />
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
                    {saving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
            </div>
        </div>
    );
}
