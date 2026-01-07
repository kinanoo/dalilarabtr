'use client';

import { useState } from 'react';
import {
    ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle,
    ExternalLink, Info, Copy, ArrowRight, UserCheck
} from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';

import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'فاحص الكملك التركي 2025 | التأكد من صلاحية القيد (TC)',
    description: 'أداة مجانية للتحقق من صحة رقم الكملك (TC) وخوارزميته، مع رابط مباشر لبوابة النفوس التركية للتأكد من صلاحية القيد وتفعيله.',
    keywords: 'فحص الكملك, رابط الكملك, التي جي, TC Kimlik, نفوس, دائرة الهجرة, صلاحية الكملك',
};

export default function KimlikCheckPage() {
    const [tcNumber, setTcNumber] = useState('');
    const [result, setResult] = useState<'valid' | 'invalid' | null>(null);

    // خوارزمية التحقق من صحة رقم الكملك (TC Algorithm)
    const validateTC = (value: string) => {
        if (!value) {
            setResult(null);
            return;
        }

        if (value.length !== 11 || isNaN(Number(value))) {
            setResult('invalid');
            return;
        }

        if (value[0] === '0') {
            setResult('invalid');
            return;
        }

        const digits = value.split('').map(Number);
        const d10 = ((digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7 -
            (digits[1] + digits[3] + digits[5] + digits[7])) % 10;
        const d11 = (digits.slice(0, 10).reduce((a, b) => a + b, 0)) % 10;

        if (digits[9] === d10 && digits[10] === d11) {
            setResult('valid');
        } else {
            setResult('invalid');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val.length <= 11) {
            setTcNumber(val);
            if (val.length === 11) {
                validateTC(val);
            } else {
                setResult(null);
            }
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(tcNumber);
        alert('تم نسخ الرقم: ' + tcNumber);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo flex flex-col">

            {/* Hero Section - Matching Main Site Theme */}
            <section className="relative bg-primary-900 dark:bg-primary-950 text-white pt-24 pb-16 px-4 overflow-hidden rounded-b-[60px] shadow-lg">
                <div className="absolute inset-0 opacity-10" />
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-sm rounded-full mb-4">
                        <UserCheck className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
                        فاحص الكملك <span className="text-emerald-400">(TURKISH ID)</span>
                    </h1>
                    <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                        تحقق من صحة بنية الرقم (Algorithm) وانتقل للرابط الرسمي لمعرفة حالة القيد.
                    </p>
                </div>
            </section>

            <main className="flex-grow pt-10 pb-16 px-4 -mt-10 relative z-20">
                <div className="container mx-auto max-w-3xl">

                    {/* Main Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 overflow-hidden">

                        <div className="mb-8">
                            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-3 text-lg">
                                أدخل رقم التي جي (99...) للتحقق:
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={tcNumber}
                                    onChange={handleChange}
                                    placeholder="99XXXXXXXXX"
                                    className="w-full px-6 py-5 text-2xl font-mono tracking-widest text-center border-2 border-slate-300 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all dark:bg-slate-950 dark:text-white placeholder:text-slate-400"
                                    maxLength={11}
                                />
                                {tcNumber && (
                                    <button
                                        onClick={copyToClipboard}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                        title="نسخ الرقم"
                                    >
                                        <Copy className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Validation Result */}
                        {result === 'valid' && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 mb-8 animate-in fade-in slide-in-from-top-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-green-100 dark:bg-green-800/50 rounded-full shrink-0">
                                        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">
                                            الرقم صحيح خوارزمياً
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-300 mb-4">
                                            هذا الرقم يطابق معادلة أرقام الهوية التركية الصحيحة.
                                            <strong className="text-slate-900 dark:text-white mx-1">
                                                الخطوة التالية هي التأكد من أن القيد فعال (Active).
                                            </strong>
                                        </p>

                                        <a
                                            href="https://tckimlik.nvi.gov.tr/Modul/YabanciKimlikNoDogrula"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center gap-2 w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-green-600/20"
                                        >
                                            <span>فحص الصلاحية في موقع النفوس (NVI)</span>
                                            <ExternalLink className="w-5 h-5" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {result === 'invalid' && tcNumber.length === 11 && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 mb-8 animate-in fade-in slide-in-from-top-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-red-100 dark:bg-red-800/50 rounded-full">
                                        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-red-700 dark:text-red-400">
                                            الرقم غير صالح
                                        </h3>
                                        <p className="text-red-600/80 dark:text-red-300/80 mt-1">
                                            هذا الرقم لا يتبع خوارزمية الأرقام التركية. تأكد من كتابته بشكل صحيح.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Educational Content */}
                        <div className="grid md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl">
                                <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5" />
                                    كيف أعرف أن الكملك توقف؟
                                </h4>
                                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside">
                                    <li>رسالة <span className="font-bold text-red-600 dark:text-red-400">Kayıt Bulunamadı</span> تعني أن القيد غير موجود أو مبطل.</li>
                                    <li>الأفضل دائماً التحقق عبر <span className="font-bold">e-Devlet</span> للتفاصيل الكاملة.</li>
                                </ul>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl">
                                <h4 className="font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5" />
                                    تحذير هام
                                </h4>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                    لا تعطي معلومات الكملك الكاملة (اسم الأب، المواليد) لأي موقع غير رسمي. هذا الموقع يفحص "خوارزمية الرقم" فقط ولا يخزن أي بيانات.
                                </p>
                            </div>
                        </div>

                    </div>

                    <div className="mt-8 text-center">
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

            <Footer />
        </div>
    );
}
