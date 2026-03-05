'use client';

import { useState } from 'react';
import {
    ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle,
    ExternalLink, Copy, ArrowRight, UserCheck, Hash, ArrowDown
} from 'lucide-react';
import Link from 'next/link';
import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG } from '@/lib/config';
import RelatedArticles from '@/components/RelatedArticles';

export default function KimlikCheckPage() {
    const [tcNumber, setTcNumber] = useState('');
    const [result, setResult] = useState<'valid' | 'invalid' | null>(null);

    const validateTC = (value: string) => {
        if (!value) { setResult(null); return; }
        if (value.length !== 11 || isNaN(Number(value))) { setResult('invalid'); return; }
        if (value[0] === '0') { setResult('invalid'); return; }

        const digits = value.split('').map(Number);
        const d10 = ((digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7 -
            (digits[1] + digits[3] + digits[5] + digits[7])) % 10;
        const d11 = (digits.slice(0, 10).reduce((a, b) => a + b, 0)) % 10;

        setResult(digits[9] === d10 && digits[10] === d11 ? 'valid' : 'invalid');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '');
        if (val.length <= 11) {
            setTcNumber(val);
            if (val.length === 11) validateTC(val);
            else setResult(null);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(tcNumber);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo flex flex-col">

            {/* Hero */}
            <section className="relative bg-primary-900 dark:bg-primary-950 text-white pt-24 pb-16 px-4 overflow-hidden rounded-b-[60px] shadow-lg">
                <div className="absolute inset-0 opacity-10" />
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-sm rounded-full mb-4">
                        <UserCheck className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
                        فاحص الكملك التركي
                    </h1>
                    <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                        دليل مصوّر لفحص صلاحية الكملك عبر موقع النفوس الرسمي، مع أداة التحقق من صحة الرقم.
                    </p>
                </div>
            </section>

            <main className="flex-grow pt-10 pb-16 px-4 -mt-10 relative z-20">
                <div className="container mx-auto max-w-3xl space-y-6">

                    {/* ========================================= */}
                    {/* Section 1: Visual Guide — NVI Form Fields */}
                    {/* ========================================= */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">

                        {/* Header */}
                        <div className="px-6 py-5 bg-gradient-to-l from-blue-900 to-blue-950 text-white">
                            <div className="flex items-center gap-2 text-sm text-blue-200 mb-1">
                                <ShieldCheck size={16} />
                                <span>T.C. Nüfus ve Vatandaşlık İşleri Genel Müdürlüğü</span>
                            </div>
                            <h2 className="text-lg font-bold">
                                Yabancı/Mavi Kartlı Kimlik No Doğrulama
                            </h2>
                        </div>

                        {/* Visual Form Recreation with Arabic Annotations */}
                        <div className="p-6 md:p-8">
                            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-bold mb-6 bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl text-center">
                                هذه صورة توضيحية لنموذج الفحص في موقع النفوس الرسمي — اتبع الخطوات أدناه
                            </p>

                            <div className="space-y-4">
                                {/* Field 1 */}
                                <FormFieldGuide
                                    label="Yabancı/Mavi Kartlı Kimlik No"
                                    arabic="رقم الكملك (11 خانة تبدأ بـ 99)"
                                    placeholder="99xxxxxxxxx"
                                    step={1}
                                />

                                {/* Field 2 */}
                                <FormFieldGuide
                                    label="Ad"
                                    arabic="الاسم الأول (كما في الكملك بالتركية)"
                                    placeholder="AHMAD"
                                    step={2}
                                />

                                {/* Field 3 */}
                                <FormFieldGuide
                                    label="Soyad"
                                    arabic="الكنية / اسم العائلة"
                                    placeholder="MOHAMMAD"
                                    step={3}
                                />

                                {/* Field 4 */}
                                <FormFieldGuide
                                    label="Doğum Gün"
                                    arabic="يوم الميلاد (رقم)"
                                    placeholder="15"
                                    step={4}
                                />

                                {/* Field 5 */}
                                <FormFieldGuide
                                    label="Doğum Ay"
                                    arabic="شهر الميلاد (رقم)"
                                    placeholder="03"
                                    step={5}
                                />

                                {/* Field 6 */}
                                <FormFieldGuide
                                    label="Doğum Yılı"
                                    arabic="سنة الميلاد"
                                    placeholder="1990"
                                    step={6}
                                />

                                {/* reCAPTCHA */}
                                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3">
                                        <div className="w-5 h-5 border-2 border-slate-400 rounded" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Ben robot değilim</span>
                                    </div>
                                    <div className="flex-1 text-right">
                                        <span className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full">
                                            <span className="text-base">7</span>
                                            علّم على &quot;أنا لست روبوت&quot;
                                        </span>
                                    </div>
                                </div>

                                {/* Doğrula Button */}
                                <div className="flex items-center gap-4 pt-2">
                                    <div className="bg-blue-800 text-white px-6 py-2.5 rounded text-sm font-bold">
                                        Doğrula
                                    </div>
                                    <div className="flex-1 text-right">
                                        <span className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-full">
                                            <span className="text-base">8</span>
                                            اضغط &quot;Doğrula&quot; للتحقق
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Result explanation */}
                            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                <h4 className="font-bold text-blue-800 dark:text-blue-300 text-sm mb-3">النتيجة:</h4>
                                <ul className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                                        <span>إذا ظهرت <strong>بياناتك أسفل حقول الإدخال</strong> = القيد <strong className="text-green-700 dark:text-green-400">فعّال وشغّال</strong></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                                        <span>إذا ظهرت رسالة <strong className="text-red-600 dark:text-red-400">Kayıt Bulunamadı</strong> = القيد غير موجود أو مُبطل</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* ========================================= */}
                    {/* Section 2: CTA — Go to Official NVI Site  */}
                    {/* ========================================= */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />

                        <ArrowDown className="mx-auto w-6 h-6 text-emerald-500 mb-3 animate-bounce" />

                        <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-3">
                            جاهز للفحص؟ انتقل للموقع الرسمي
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                            اضغط الزر أدناه للانتقال مباشرة لصفحة فحص الكملك في موقع النفوس التركي الرسمي (NVI)
                        </p>

                        <a
                            href="https://tckimlik.nvi.gov.tr/Modul/YabanciKimlikNoDogrula"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-3 w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 hover:scale-[1.02] hover:shadow-xl"
                        >
                            <span>فتح موقع النفوس الرسمي (NVI)</span>
                            <ExternalLink className="w-5 h-5" />
                        </a>

                        <div className="mt-4 flex justify-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                            <span className="flex items-center gap-1">
                                <ShieldCheck size={12} className="text-emerald-500" />
                                موقع حكومي رسمي
                            </span>
                            <span>tckimlik.nvi.gov.tr</span>
                        </div>
                    </div>

                    {/* ========================================= */}
                    {/* Section 3: Algorithm Checker               */}
                    {/* ========================================= */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 overflow-hidden">

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                                <Hash className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                                    فحص الخوارزمية (بدون إنترنت)
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    تحقق سريع من بنية الرقم — لا يحتاج بيانات شخصية
                                </p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label htmlFor="kimlik-number" className="block text-slate-700 dark:text-slate-300 font-bold mb-2 text-sm">
                                أدخل رقم الكملك (11 خانة):
                            </label>
                            <div className="relative">
                                <input
                                    id="kimlik-number"
                                    name="kimlikNumber"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]{11}"
                                    autoComplete="off"
                                    aria-label="أدخل رقم الكملك المكون من 11 رقم"
                                    value={tcNumber}
                                    onChange={handleChange}
                                    placeholder="99XXXXXXXXX"
                                    className="w-full px-6 py-4 text-2xl font-mono tracking-widest text-center border-2 border-slate-300 dark:border-slate-700 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 outline-none transition-all dark:bg-slate-950 dark:text-white placeholder:text-slate-400"
                                    maxLength={11}
                                />
                                {tcNumber && (
                                    <button
                                        onClick={copyToClipboard}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                                        title="نسخ الرقم"
                                    >
                                        <Copy className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                                يبدأ بـ 99 للأجانب — هذا الفحص لا يخزّن أي بيانات
                            </p>
                        </div>

                        {/* Validation Result */}
                        {result === 'valid' && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5 mb-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-800/50 rounded-full shrink-0">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-green-700 dark:text-green-400">
                                            الرقم صحيح خوارزمياً
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                            بنية الرقم سليمة. لكن لمعرفة إن كان القيد <strong>فعّال</strong> أم لا، يجب الفحص في موقع النفوس أعلاه.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {result === 'invalid' && tcNumber.length === 11 && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 dark:bg-red-800/50 rounded-full">
                                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-red-700 dark:text-red-400">
                                            الرقم غير صالح
                                        </h3>
                                        <p className="text-sm text-red-600/80 dark:text-red-300/80 mt-1">
                                            هذا الرقم لا يتبع خوارزمية الأرقام التركية. تأكد من كتابته بشكل صحيح.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Educational Content */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                            <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2 text-sm">
                                <ShieldCheck className="w-5 h-5" />
                                كيف أعرف أن الكملك توقف؟
                            </h4>
                            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside">
                                <li>رسالة <span className="font-bold text-red-600 dark:text-red-400">Kayıt Bulunamadı</span> تعني أن القيد غير موجود أو مبطل.</li>
                                <li>الأفضل دائماً التحقق عبر <span className="font-bold">e-Devlet</span> للتفاصيل الكاملة.</li>
                            </ul>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                            <h4 className="font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2 text-sm">
                                <ShieldAlert className="w-5 h-5" />
                                تحذير هام
                            </h4>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                لا تعطي معلومات الكملك الكاملة (اسم الأب، المواليد) لأي موقع غير رسمي. هذا الموقع يفحص &quot;خوارزمية الرقم&quot; فقط ولا يخزن أي بيانات.
                            </p>
                        </div>
                    </div>

                    {/* Share + Back */}
                    <div className="flex justify-center">
                        <ShareMenu
                            title="فاحص الكملك التركي"
                            text="تحقق من صحة رقم الكملك (TC) وصلاحية القيد — أداة مجانية من دليل العرب."
                            url={`${SITE_CONFIG.siteUrl}/tools/kimlik-check`}
                            variant="subtle"
                        />
                    </div>

                    <RelatedArticles currentArticleId="" category="الكملك والحماية المؤقتة" />

                    <div className="text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors py-2 px-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <span>العودة للصفحة الرئيسية</span>
                            <ArrowRight className="w-4 h-4 rotate-180" />
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}

/** Visual guide for a single NVI form field */
function FormFieldGuide({ label, arabic, placeholder, step }: {
    label: string;
    arabic: string;
    placeholder: string;
    step: number;
}) {
    return (
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            {/* Turkish field label + placeholder */}
            <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{label}</div>
                <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-400 font-mono">
                    {placeholder}
                </div>
            </div>

            {/* Arabic annotation */}
            <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-bold px-3 py-1.5 rounded-full">
                    <span className="text-base">{step}</span>
                    {arabic}
                </span>
            </div>
        </div>
    );
}
