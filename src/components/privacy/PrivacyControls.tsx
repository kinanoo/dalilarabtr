'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Check, ShieldCheck } from 'lucide-react';
import {
    ANALYTICS_CONSENT_EVENT,
    type AnalyticsConsent,
    getAnalyticsConsent,
    setAnalyticsConsent,
} from '@/lib/consent';

export default function PrivacyControls() {
    const [choice, setChoice] = useState<AnalyticsConsent>('unknown');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const sync = () => setChoice(getAnalyticsConsent());
        sync();
        window.addEventListener(ANALYTICS_CONSENT_EVENT, sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener(ANALYTICS_CONSENT_EVENT, sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    const choose = (nextChoice: Exclude<AnalyticsConsent, 'unknown'>) => {
        setAnalyticsConsent(nextChoice);
        setChoice(nextChoice);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2200);
    };

    return (
        <section
            id="privacy-controls"
            className="scroll-mt-24 border border-emerald-200 bg-white p-5 dark:border-emerald-900/60 dark:bg-slate-900 sm:p-6"
            aria-labelledby="privacy-controls-title"
        >
            <div className="mb-4 flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300">
                    <ShieldCheck size={18} />
                </span>
                <div>
                    <h2 id="privacy-controls-title" className="font-bold text-slate-900 dark:text-slate-50">
                        إعدادات الخصوصية
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        الملفات الضرورية تعمل لتشغيل الموقع. التحليلات اختيارية ويمكنك تغيير قرارك في أي وقت.
                    </p>
                </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="اختيار استخدام التحليلات">
                <button
                    type="button"
                    role="radio"
                    aria-checked={choice === 'denied'}
                    onClick={() => choose('denied')}
                    className={`flex min-h-12 items-center justify-between border px-4 py-3 text-sm font-bold transition-colors ${
                        choice === 'denied'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
                            : 'border-slate-200 text-slate-700 hover:border-emerald-300 dark:border-slate-700 dark:text-slate-200'
                    }`}
                >
                    <span className="flex items-center gap-2"><ShieldCheck size={17} /> الضرورية فقط</span>
                    {choice === 'denied' && <Check size={17} aria-hidden="true" />}
                </button>
                <button
                    type="button"
                    role="radio"
                    aria-checked={choice === 'granted'}
                    onClick={() => choose('granted')}
                    className={`flex min-h-12 items-center justify-between border px-4 py-3 text-sm font-bold transition-colors ${
                        choice === 'granted'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
                            : 'border-slate-200 text-slate-700 hover:border-emerald-300 dark:border-slate-700 dark:text-slate-200'
                    }`}
                >
                    <span className="flex items-center gap-2"><BarChart3 size={17} /> السماح بالتحليلات</span>
                    {choice === 'granted' && <Check size={17} aria-hidden="true" />}
                </button>
            </div>

            <p className="mt-3 min-h-5 text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
                {saved
                    ? 'تم حفظ اختيارك.'
                    : choice === 'unknown'
                        ? 'لم تحدد اختيارك بعد، لذلك تبقى التحليلات متوقفة.'
                        : choice === 'granted'
                            ? 'التحليلات الاختيارية مسموحة حالياً.'
                            : 'التحليلات الاختيارية متوقفة حالياً.'}
            </p>
        </section>
    );
}
