'use client';

import { useState, useEffect } from 'react';
import { getAuthClient, getClientUser } from '@/lib/supabaseClient';
import { ArrowRight, Save, Loader2, Mail, Calendar, Shield, UserCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getMyProfile, updateProfile } from '@/lib/api/profile';
import { ImageUploader } from '@/components/admin/ui/ImageUploader';

const CITIES = [
    'إسطنبول', 'أنقرة', 'إزمير', 'بورصة', 'أنطاليا',
    'غازي عنتاب', 'مرسين', 'قونية', 'طرابزون', 'أضنة',
    'أنطاكيا', 'قيصري', 'إسكي شهير', 'صقاريا', 'أخرى',
];

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [bio, setBio] = useState('');
    const [city, setCity] = useState('');
    const [email, setEmail] = useState('');
    const [createdAt, setCreatedAt] = useState('');
    const [role, setRole] = useState('member');
    const router = useRouter();

    const supabase = getAuthClient();

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        if (!supabase) { router.push('/login'); return; }
        const user = await getClientUser();
        if (!user) { router.push('/login'); return; }

        setEmail(user.email || '');

        const { data } = await getMyProfile();
        if (data) {
            setFullName(data.full_name || '');
            setAvatarUrl(data.avatar_url || '');
            setBio(data.bio || '');
            setCity(data.city || '');
            setRole(data.role || 'member');
            setCreatedAt(data.created_at || '');
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!fullName.trim() || fullName.trim().length < 2) {
            toast.error('الاسم يجب أن يكون حرفين على الأقل');
            return;
        }
        setSaving(true);
        const { success, error } = await updateProfile({
            full_name: fullName.trim(),
            avatar_url: avatarUrl || undefined,
            bio: bio.trim() || undefined,
            city: city || undefined,
        });
        setSaving(false);

        if (success) {
            toast.success('تم حفظ التغييرات بنجاح');
        } else {
            toast.error(`خطأ: ${error instanceof Error ? error.message : 'فشل الحفظ'}`);
        }
    };

    if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-8">
                <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors mb-4">
                    <ArrowRight size={16} />
                    العودة للوحة
                </Link>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-200/60 dark:from-amber-900/40 dark:to-amber-800/30 text-amber-600 dark:text-amber-400 rounded-2xl shadow-sm">
                        <UserCircle size={28} />
                    </div>
                    <div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-[10px] font-black tracking-wider uppercase mb-1">
                            <Sparkles size={10} />
                            ملفّك
                        </span>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white">الملف الشخصي</h1>
                        <p className="text-sm text-slate-500">عدّل معلوماتك الشخصية</p>
                    </div>
                </div>
            </div>

            {/* Form Card — accent stripe + gradient */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-white to-amber-50/30 dark:from-slate-800 dark:to-amber-950/20 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-sm space-y-6">
                <span className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-amber-400 to-amber-500 opacity-70" />
                {/* Avatar */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">الصورة الشخصية</label>
                    <div className="flex items-center gap-5">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-emerald-200 dark:border-emerald-800" />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                <UserCircle size={40} />
                            </div>
                        )}
                        <div className="flex-1">
                            <ImageUploader
                                value={avatarUrl}
                                onChange={(url) => setAvatarUrl(url)}
                                bucket="public"
                                path="avatars"
                                label="تغيير الصورة"
                                maxWidth={300}
                                quality={0.6}
                            />
                        </div>
                    </div>
                </div>

                {/* Full Name */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الاسم الكامل *</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="اسمك الكامل"
                        required
                    />
                </div>

                {/* City */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">المدينة</label>
                    <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    >
                        <option value="">اختر مدينتك (اختياري)</option>
                        {CITIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                {/* Bio */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        نبذة شخصية
                        <span className="text-xs text-slate-400 font-normal mr-2">({bio.length}/200)</span>
                    </label>
                    <textarea
                        value={bio}
                        onChange={(e) => e.target.value.length <= 200 && setBio(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all"
                        rows={3}
                        placeholder="عرّف عن نفسك بكلمات قليلة... (اختياري)"
                    />
                </div>

                {/* Save Button — premium gradient */}
                <button
                    onClick={handleSave}
                    disabled={saving || !fullName.trim()}
                    className="group/btn w-full bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:bg-none text-white font-black py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] hover:-translate-y-0.5 shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 disabled:shadow-none disabled:hover:translate-y-0"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} className="group-hover/btn:rotate-12 transition-transform" />}
                    {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
            </div>

            {/* Account Info — accent stripe */}
            <div className="relative overflow-hidden mt-6 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
                <span className="absolute top-0 right-0 h-full w-1 bg-slate-300 dark:bg-slate-600 opacity-70" />
                <h3 className="text-sm font-black text-slate-600 dark:text-slate-300 mb-3 uppercase tracking-wider">معلومات الحساب</h3>
                <div className="flex items-center gap-3 text-sm">
                    <Mail size={16} className="text-slate-400 shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">{email || '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <Calendar size={16} className="text-slate-400 shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">
                        عضو منذ {createdAt ? new Date(createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                    </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <Shield size={16} className="text-slate-400 shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">
                        {role === 'admin' ? 'مدير' : role === 'moderator' ? 'مشرف' : 'عضو'}
                    </span>
                </div>
            </div>
        </div>
    );
}
