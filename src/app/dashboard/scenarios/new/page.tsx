'use client';

import { useState } from 'react';
import { getAuthClient, getClientUser } from '@/lib/supabaseClient';
import { Loader2, Save, ArrowRight, Info, BrainCircuit, Lightbulb, Newspaper, Wrench, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

const TYPES = [
    { value: 'اقتراح سيناريو', label: 'اقتراح سيناريو', icon: BrainCircuit, desc: 'سيناريو جديد للمساعد الذكي' },
    { value: 'نصيحة', label: 'نصيحة للمجتمع', icon: Lightbulb, desc: 'نصيحة أو تجربة شخصية مفيدة' },
    { value: 'خبر أو تصريح', label: 'خبر أو تصريح', icon: Newspaper, desc: 'خبر أو تصريح رسمي لم ينشر بعد' },
    { value: 'طلب تصحيح', label: 'طلب تصحيح معلومة', icon: Wrench, desc: 'معلومة خاطئة في الموقع تحتاج تصحيح' },
];

export default function AddScenarioPage() {
    const [loading, setLoading] = useState(false);
    const [selectedType, setSelectedType] = useState('اقتراح سيناريو');
    const router = useRouter();

    const supabase = getAuthClient();

    const [formData, setFormData] = useState({
        title: '',
        intro: '',
        details: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;
        setLoading(true);

        const user = await getClientUser();
        if (!user) {
            toast.error('يرجى تسجيل الدخول أولاً');
            router.push('/login');
            return;
        }

        try {
            const { error } = await supabase
                .from('articles')
                .insert([{
                    user_id: user.id,
                    title: formData.title,
                    category: selectedType,
                    intro: formData.intro,
                    details: formData.details,
                    image: '',
                    status: 'pending',
                    is_active: false,
                    last_update: new Date().toISOString(),
                }]);

            if (error) throw error;

            toast.success('تم إرسال مقترحك بنجاح!', {
                description: 'سيراجعه فريق الإدارة قريباً والرد عليك.',
                duration: 5000,
            });

            router.push('/dashboard');

        } catch (error) {
            toast.error('حدث خطأ أثناء الإرسال: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
        } finally {
            setLoading(false);
        }
    };

    const currentType = TYPES.find(t => t.value === selectedType)!;

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 hover:scale-110 transition-all">
                    <ArrowRight size={20} />
                </Link>
                <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-[10px] font-black tracking-wider uppercase mb-1">
                        <Sparkles size={10} />
                        فكرة جديدة
                    </span>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white">شارك فكرة أو مقترح</h1>
                    <p className="text-slate-500 text-sm">مساهمتك تساعد الجالية العربية في تركيا</p>
                </div>
            </div>

            {/* Type Selection — premium tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.value;
                    return (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() => setSelectedType(type.value)}
                            className={`group/tile relative overflow-hidden p-4 rounded-2xl border-2 text-right transition-all duration-300 ${
                                isSelected
                                    ? 'border-violet-500 bg-gradient-to-br from-violet-50 to-violet-100/60 dark:from-violet-900/30 dark:to-violet-800/20 shadow-lg shadow-violet-500/20 -translate-y-0.5'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-300 hover:-translate-y-0.5 hover:shadow-md'
                            }`}
                        >
                            {isSelected && <span className="absolute top-0 right-0 h-full w-1 bg-violet-500 opacity-80" />}
                            <Icon size={22} className={`mb-2 transition-transform ${isSelected ? 'text-violet-600 dark:text-violet-400 group-hover/tile:rotate-12' : 'text-slate-400'}`} />
                            <p className={`text-xs font-black ${isSelected ? 'text-violet-700 dark:text-violet-300' : 'text-slate-600 dark:text-slate-300'}`}>
                                {type.label}
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* Form card — accent stripe + gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white to-violet-50/30 dark:from-slate-900 dark:to-violet-950/15 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
                <span className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-violet-500 to-purple-500 opacity-70" />

                <div className="relative overflow-hidden bg-gradient-to-br from-violet-50 to-violet-100/40 dark:from-violet-900/15 dark:to-violet-900/5 border border-violet-200 dark:border-violet-900/30 rounded-xl p-4 mb-8 flex items-start gap-3">
                    <span className="absolute top-0 right-0 h-full w-1 bg-violet-500 opacity-70" />
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 shrink-0 shadow-sm">
                        <Info size={18} />
                    </span>
                    <div className="text-sm text-violet-800 dark:text-violet-200">
                        <p className="font-black mb-1">{currentType.label}</p>
                        <p className="leading-relaxed">{currentType.desc} — سيراجعه الفريق ويضيفه للموقع إذا كان مناسباً.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block font-bold text-sm mb-2 text-slate-700 dark:text-slate-300">
                            العنوان *
                        </label>
                        <input
                            type="text"
                            name="title"
                            required
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="عنوان واضح ومختصر..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-500 transition-all font-bold text-lg"
                        />
                    </div>

                    <div>
                        <label className="block font-bold text-sm mb-2 text-slate-700 dark:text-slate-300">
                            ملخص مختصر *
                        </label>
                        <textarea
                            name="intro"
                            required
                            rows={3}
                            value={formData.intro}
                            onChange={handleChange}
                            placeholder="وصف مختصر في جملة أو جملتين..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none"
                        />
                    </div>

                    <div>
                        <label className="block font-bold text-sm mb-2 text-slate-700 dark:text-slate-300">
                            التفاصيل الكاملة *
                        </label>
                        <textarea
                            name="details"
                            required
                            rows={8}
                            value={formData.details}
                            onChange={handleChange}
                            placeholder={
                                selectedType === 'اقتراح سيناريو'
                                    ? 'صف السيناريو: ما المشكلة التي يحلها؟ ما الخطوات؟...'
                                    : selectedType === 'طلب تصحيح'
                                    ? 'اذكر المعلومة الخاطئة وصفحتها، وما المعلومة الصحيحة مع المصدر...'
                                    : 'اكتب تفاصيل كاملة هنا...'
                            }
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none"
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="group/btn bg-gradient-to-l from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-60 text-white font-black py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-violet-600/30 hover:shadow-xl hover:shadow-violet-600/40 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="group-hover/btn:rotate-12 transition-transform" />}
                            إرسال المقترح
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
