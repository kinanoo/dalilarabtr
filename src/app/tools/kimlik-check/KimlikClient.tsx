'use client';

import { useState } from 'react';
import {
    ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle,
    ExternalLink, Copy, Check, UserCheck, Hash, ChevronDown, BookOpen
} from 'lucide-react';
import Link from 'next/link';
import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG } from '@/lib/config';
import RelatedArticles from '@/components/RelatedArticles';

export default function KimlikCheckPage() {
    const [tcNumber, setTcNumber] = useState('');
    const [result, setResult] = useState<'valid' | 'invalid' | null>(null);
    const [copied, setCopied] = useState(false);
    const [guideOpen, setGuideOpen] = useState(false);

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
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Dynamic border color based on state
    const inputBorderClass = result === 'valid'
        ? 'border-green-500 ring-4 ring-green-500/20'
        : result === 'invalid' && tcNumber.length === 11
            ? 'border-red-500 ring-4 ring-red-500/20'
            : tcNumber.length > 0
                ? 'border-emerald-400 ring-4 ring-emerald-400/10'
                : 'border-slate-300 dark:border-slate-700';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo flex flex-col">

            {/* ===== Hero — Compact ===== */}
            <section className="bg-gradient-to-bl from-primary-900 via-primary-950 to-slate-900 text-white pt-16 pb-12 px-4 rounded-b-[40px]">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center p-2.5 bg-white/10 backdrop-blur-sm rounded-2xl mb-3">
                        <UserCheck className="w-7 h-7 text-emerald-400" />
                    </div>
                    <h1 className="text-2xl md:text-4xl font-extrabold mb-2">
                        فاحص الكملك التركي
                    </h1>
                    <p className="text-sm md:text-base text-slate-300 max-w-lg mx-auto">
                        تحقق من صحة رقم الكملك فوراً، أو انتقل للموقع الرسمي لفحص صلاحية القيد
                    </p>
                </div>
            </section>

            <main className="flex-grow pt-6 pb-16 px-4 -mt-6 relative z-20">
                <div className="container mx-auto max-w-2xl space-y-5">

                    {/* ===== Section 1: Algorithm Checker (FIRST!) ===== */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 md:p-8">

                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                <Hash className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                                    فحص رقم الكملك
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    فحص فوري — بدون إنترنت ولا بيانات شخصية
                                </p>
                            </div>
                        </div>

                        {/* Input */}
                        <div className="mb-4">
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
                                    placeholder="أدخل رقم الكملك هنا"
                                    className={`w-full px-5 py-4 text-xl md:text-2xl font-mono tracking-wider text-center border-2 rounded-2xl outline-none transition-all duration-300 dark:bg-slate-950 dark:text-white placeholder:text-slate-400 placeholder:text-base placeholder:font-cairo placeholder:tracking-normal ${inputBorderClass}`}
                                    maxLength={11}
                                />
                                {/* Copy button */}
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    {tcNumber ? (
                                        <button
                                            onClick={copyToClipboard}
                                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                            title="نسخ الرقم"
                                            aria-label="نسخ الرقم"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    ) : null}
                                </div>
                                {/* Counter */}
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${tcNumber.length === 11 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                        {tcNumber.length}/11
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
                                يبدأ بـ 99 للأجانب — لا نخزّن أي بيانات
                            </p>
                        </div>

                        {/* Result — Valid */}
                        {result === 'valid' && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-800/50 rounded-full shrink-0">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-green-700 dark:text-green-400">
                                            الرقم صحيح خوارزمياً ✓
                                        </h3>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                            بنية الرقم سليمة. لمعرفة إن كان القيد <strong>فعّال</strong>، افحصه بالموقع الرسمي أدناه.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Result — Invalid */}
                        {result === 'invalid' && tcNumber.length === 11 && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 dark:bg-red-800/50 rounded-full shrink-0">
                                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-red-700 dark:text-red-400">
                                            الرقم غير صالح ✕
                                        </h3>
                                        <p className="text-xs text-red-600/80 dark:text-red-300/80 mt-0.5">
                                            لا يتبع خوارزمية الأرقام التركية. تأكد من كتابته بشكل صحيح.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ===== Section 2: CTA — Official NVI Site ===== */}
                    <a
                        href="https://tckimlik.nvi.gov.tr/Modul/YabanciKimlikNoDogrula"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block bg-emerald-600 hover:bg-emerald-700 rounded-2xl p-5 text-white transition-all shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:scale-[1.01]"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-extrabold mb-1">
                                    فحص صلاحية القيد — الموقع الرسمي
                                </h2>
                                <p className="text-sm text-emerald-100 opacity-90">
                                    انتقل لموقع النفوس التركي (NVI) لمعرفة إن كان القيد فعّال أو مُبطل
                                </p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-emerald-200">
                                    <span className="flex items-center gap-1">
                                        <ShieldCheck size={12} />
                                        موقع حكومي رسمي
                                    </span>
                                    <span>tckimlik.nvi.gov.tr</span>
                                </div>
                            </div>
                            <div className="shrink-0 p-3 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                                <ExternalLink className="w-6 h-6" />
                            </div>
                        </div>
                    </a>

                    {/* ===== Section 3: Visual Guide (Collapsible) ===== */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">

                        {/* Toggle Button */}
                        <button
                            onClick={() => setGuideOpen(!guideOpen)}
                            className="w-full flex items-center justify-between gap-3 p-5 text-right hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            aria-expanded={guideOpen}
                            aria-label="عرض أو إخفاء الدليل المصوّر"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="text-right">
                                    <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                                        دليل مصوّر: كيف تفحص بالموقع الرسمي؟
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        شرح خطوة بخطوة مع ترجمة عربية لكل حقل
                                    </p>
                                </div>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${guideOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Collapsible Content */}
                        <div className={`overflow-hidden transition-all duration-300 ${guideOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="px-5 pb-6 md:px-8 md:pb-8">

                                {/* NVI Header */}
                                <div className="px-4 py-3 bg-gradient-to-l from-blue-900 to-blue-950 text-white rounded-xl mb-5">
                                    <div className="flex items-center gap-2 text-xs text-blue-200 mb-0.5">
                                        <ShieldCheck size={14} />
                                        <span>T.C. Nüfus ve Vatandaşlık İşleri Genel Müdürlüğü</span>
                                    </div>
                                    <p className="text-sm font-bold">
                                        Yabancı/Mavi Kartlı Kimlik No Doğrulama
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <FormFieldGuide label="Yabancı/Mavi Kartlı Kimlik No" arabic="رقم الكملك (11 خانة تبدأ بـ 99)" placeholder="99xxxxxxxxx" step={1} />
                                    <FormFieldGuide label="Ad" arabic="الاسم الأول بالتركية" placeholder="AHMAD" step={2} />
                                    <FormFieldGuide label="Soyad" arabic="الكنية / اسم العائلة" placeholder="MOHAMMAD" step={3} />
                                    <FormFieldGuide label="Doğum Gün" arabic="يوم الميلاد" placeholder="15" step={4} />
                                    <FormFieldGuide label="Doğum Ay" arabic="شهر الميلاد" placeholder="03" step={5} />
                                    <FormFieldGuide label="Doğum Yılı" arabic="سنة الميلاد" placeholder="1990" step={6} />

                                    {/* reCAPTCHA */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2">
                                            <div className="w-4 h-4 border-2 border-slate-400 rounded" />
                                            <span className="text-xs text-slate-700 dark:text-slate-300">Ben robot değilim</span>
                                        </div>
                                        <StepBadge step={7} text='علّم "أنا لست روبوت"' />
                                    </div>

                                    {/* Doğrula Button */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
                                        <div className="bg-blue-800 text-white px-5 py-2 rounded text-sm font-bold">
                                            Doğrula
                                        </div>
                                        <StepBadge step={8} text='اضغط "Doğrula" للتحقق' />
                                    </div>
                                </div>

                                {/* Result explanation */}
                                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                    <h4 className="font-bold text-blue-800 dark:text-blue-300 text-sm mb-2">النتيجة:</h4>
                                    <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                                        <p className="flex items-start gap-2">
                                            <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                                            <span>ظهور بياناتك = القيد <strong className="text-green-700 dark:text-green-400">فعّال</strong></span>
                                        </p>
                                        <p className="flex items-start gap-2">
                                            <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                                            <span>رسالة <strong className="text-red-600 dark:text-red-400">Kayıt Bulunamadı</strong> = القيد مُبطل</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ===== Section 4: Educational Cards ===== */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                            <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2 text-sm">
                                <ShieldCheck className="w-4 h-4 shrink-0" />
                                كيف أعرف أن الكملك توقف؟
                            </h4>
                            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                                <li className="flex items-start gap-1.5">
                                    <span className="text-red-500 mt-0.5">•</span>
                                    رسالة <strong className="text-red-600 dark:text-red-400">Kayıt Bulunamadı</strong> = القيد غير موجود أو مبطل
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <span className="text-blue-500 mt-0.5">•</span>
                                    الأفضل التحقق عبر <strong>e-Devlet</strong> للتفاصيل الكاملة
                                </li>
                            </ul>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                            <h4 className="font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2 text-sm">
                                <ShieldAlert className="w-4 h-4 shrink-0" />
                                تحذير هام
                            </h4>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                لا تعطي معلومات الكملك الكاملة (اسم الأب، المواليد) لأي موقع غير رسمي. هذا الفحص يتحقق من &quot;خوارزمية الرقم&quot; فقط.
                            </p>
                        </div>
                    </div>

                    {/* ===== Section 4.5: Visible FAQ — helps SEO + user engagement ===== */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 md:p-8">
                        <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-2">
                            <span className="text-xl">❓</span>
                            أسئلة شائعة عن فحص الكملك
                        </h2>
                        <div className="space-y-4">
                            <FaqItem
                                question="كيف أتأكد من صلاحية الكملك؟"
                                answer="ادخل رقم الكملك (11 رقم) في أداة الفحص أعلاه للتحقق الخوارزمي الفوري. ثم استخدم الرابط المباشر لموقع النفوس التركي الرسمي (NVI) لمعرفة إن كان القيد فعّال أو مُبطل."
                            />
                            <FaqItem
                                question="كيف أعرف الكملك شغال أو موقوف؟"
                                answer='ادخل موقع النفوس التركي NVI وأدخل رقم الكملك واسمك وتاريخ ميلادك. إذا ظهرت بياناتك فالقيد فعّال. إذا ظهرت رسالة "Kayıt Bulunamadı" فالقيد مُبطل أو موقوف.'
                            />
                            <FaqItem
                                question="ما هو رابط فحص الكملك 99 للأجانب؟"
                                answer="رابط فحص الكملك للأجانب (الذي يبدأ بـ 99) هو صفحة Yabancı Kimlik No Doğrulama على موقع tckimlik.nvi.gov.tr — الموقع الرسمي لمديرية النفوس والمواطنة التركية."
                            />
                            <FaqItem
                                question="هل فحص الكملك على هذا الموقع آمن؟"
                                answer="نعم، أداتنا تتحقق فقط من صحة خوارزمية الرقم محلياً على جهازك دون إرسال أي بيانات لأي سيرفر. للتحقق من حالة القيد الفعلية، نوجهك للموقع الحكومي الرسمي مباشرة."
                            />
                        </div>
                    </div>

                    {/* ===== Section 5: Share + Related ===== */}
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
                            className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors py-2 px-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
                        >
                            العودة للصفحة الرئيسية
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}

/** Step badge — numbered annotation */
function StepBadge({ step, text }: { step: number; text: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-bold px-3 py-1.5 rounded-full">
            <span className="text-sm font-extrabold">{step}</span>
            {text}
        </span>
    );
}

/** FAQ item — visible on page for SEO + UX */
function FaqItem({ question, answer }: { question: string; answer: string }) {
    return (
        <details className="group border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors list-none [&::-webkit-details-marker]:hidden">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 text-right">{question}</h3>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                {answer}
            </div>
        </details>
    );
}

/** Visual guide for a single NVI form field — mobile-optimized */
function FormFieldGuide({ label, arabic, placeholder, step }: {
    label: string;
    arabic: string;
    placeholder: string;
    step: number;
}) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            {/* Turkish field */}
            <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">{label}</div>
                <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-400 font-mono">
                    {placeholder}
                </div>
            </div>

            {/* Arabic annotation */}
            <div className="sm:text-right">
                <StepBadge step={step} text={arabic} />
            </div>
        </div>
    );
}
