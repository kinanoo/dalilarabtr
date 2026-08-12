'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Send, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/lib/serviceCategories';
import { TR_CITIES } from '@/lib/turkishCities';
import { isValidExplicitWhatsApp } from '@/lib/serviceProviderQuality';

const FIELD = 'w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all';
const LABEL = 'block font-bold text-sm mb-1.5 text-slate-700 dark:text-slate-300';

export default function AddServiceForm() {
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '', profession: '', category: 'خدمات عامة', city: '', district: '',
        whatsapp: '', description: '', website: '', // `website` = honeypot (hidden)
    });
    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!isValidExplicitWhatsApp(form.whatsapp)) {
            setError('أدخل رقم واتساب صحيحاً مع رمز الدولة، مثال: +905551234567.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/services/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const result = await res.json().catch(() => ({}));
            if (res.ok) { setDone(true); return; }
            if (res.status === 429) setError('حاولت كثيراً خلال وقت قصير — انتظر قليلاً ثم أعد المحاولة.');
            else if (result.error === 'invalid_whatsapp') setError('رقم واتساب غير صحيح. أضف رمز الدولة وتأكد من الرقم.');
            else setError('تعذّر إرسال الطلب. تأكّد من تعبئة الحقول المطلوبة وحاول مجدداً.');
        } catch {
            setError('تعذّر الاتصال. تحقّق من الإنترنت وحاول مجدداً.');
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div className="max-w-xl mx-auto text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 animate-in fade-in zoom-in">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">تم استلام طلبك!</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                    سيراجع فريق الإدارة بياناتك وينشر خدمتك قريباً على دليل العرب. لا حاجة لأي خطوة أخرى منك.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/services" className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                        تصفّح دليل الخدمات
                    </Link>
                    <button onClick={() => { setForm({ name: '', profession: '', category: 'خدمات عامة', city: '', district: '', whatsapp: '', description: '', website: '' }); setDone(false); }} className="inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold px-6 py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        إضافة خدمة أخرى
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-5">
            {/* Trust note */}
            <div className="flex items-start gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/70 dark:border-emerald-800/40 px-4 py-3">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-[13px] leading-6 font-bold text-emerald-800 dark:text-emerald-200">
                    الإدراج مجّاني تماماً — بلا رسوم ولا عمولة. تُراجَع بياناتك يدوياً قبل النشر، فتأكّد من صحّة رقمك.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="f-name" className={LABEL}>اسم النشاط / مقدّم الخدمة *</label>
                    <input id="f-name" name="name" required value={form.name} onChange={set('name')} placeholder="مثال: مكتب النور للترجمة" className={FIELD} />
                </div>
                <div>
                    <label htmlFor="f-prof" className={LABEL}>المهنة / التخصّص *</label>
                    <input id="f-prof" name="profession" required value={form.profession} onChange={set('profession')} placeholder="مثال: مترجم محلّف، طبيب أسنان…" className={FIELD} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="f-cat" className={LABEL}>التصنيف *</label>
                    <select id="f-cat" name="category" value={form.category} onChange={set('category')} className={`${FIELD} appearance-none`}>
                        {SERVICE_CATEGORIES.map((c) => (
                            <option key={c.slug} value={c.name}>{c.labelAr}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="f-whatsapp" className={LABEL}>رقم واتساب الفعّال *</label>
                    <input id="f-whatsapp" name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" required value={form.whatsapp} onChange={set('whatsapp')} placeholder="مثال: +905551234567" className={`${FIELD} ltr text-left`} aria-describedby="whatsapp-help" />
                    <p id="whatsapp-help" className="mt-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">لن تُنشر الخدمة قبل التأكد من أن الرقم مخصص لواتساب.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="f-city" className={LABEL}>المدينة *</label>
                    <input id="f-city" name="city" list="tr-cities" required value={form.city} onChange={set('city')} placeholder="اكتب أو اختر مدينتك" className={FIELD} />
                    <datalist id="tr-cities">
                        {TR_CITIES.map((c) => <option key={c.slug} value={c.ar} />)}
                    </datalist>
                </div>
                <div>
                    <label htmlFor="f-district" className={LABEL}>المنطقة / الحي (اختياري)</label>
                    <input id="f-district" name="district" value={form.district} onChange={set('district')} placeholder="مثال: الفاتح، إسنيورت…" className={FIELD} />
                </div>
            </div>

            <div>
                <label htmlFor="f-desc" className={LABEL}>وصف مختصر (اختياري)</label>
                <textarea id="f-desc" name="description" rows={4} value={form.description} onChange={set('description')} placeholder="اكتب ما تود أن يعرفه العميل عن خدمتك، أو اتركه فارغاً وأضفه لاحقاً." className={`${FIELD} resize-y`} />
            </div>

            {/* Honeypot — hidden from humans, catches bots. Not `type=hidden` so
                bots that skip hidden inputs still fill it. */}
            <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" tabIndex={-1}>
                <label>لا تملأ هذا الحقل<input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} /></label>
            </div>

            {error && (
                <p className="flex items-start gap-2 text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 rounded-xl px-4 py-3">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
                </p>
            )}

            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black py-4 rounded-xl transition-colors shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 text-lg">
                {loading ? <Loader2 className="animate-spin" size={22} /> : <Send size={20} />}
                إرسال الطلب مجاناً
            </button>
            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                عندك حساب وتريد إدارة خدماتك؟ <Link href="/dashboard/services/new" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">أضِفها من لوحتك</Link>
            </p>
        </form>
    );
}
