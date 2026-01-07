'use client';

import { HeartPulse, ExternalLink, ShieldCheck, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';

import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'الصيدليات المناوبة في تركيا 2025 | رابط E-Devlet الرسمي',
    description: 'رابط مباشر وفوري لمعرفة الصيدلية المناوبة في منطقتك (إسطنبول، غازي عنتاب، مرسين، وكل المدن) عبر بوابة الحكومة التركية الرسمية E-Devlet.',
    keywords: 'صيدليات مناوبة تركيا, نوبتشي اجزاني, صيدلية مناوبة اسطنبول, صيدلية مناوبة غازي عنتاب, E-Devlet pharmacy, Nöbetçi Eczane',
};

export default function PharmacyPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo flex flex-col">

            {/* Hero Section - Matching Main Site Theme */}
            <section className="relative bg-primary-900 dark:bg-primary-950 text-white pt-24 pb-16 px-4 overflow-hidden rounded-b-[60px] shadow-lg">
                <div className="absolute inset-0 opacity-10" />
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-sm rounded-full mb-4">
                        <HeartPulse className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
                        الصيدليات المناوبة <span className="text-red-500">(Nöbetçi)</span>
                    </h1>
                    <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                        البوابة الحكومية الرسمية للوصول لأقرب صيدلية في جميع الولايات التركية.
                    </p>
                </div>
            </section>

            <main className="flex-grow pt-10 pb-16 px-4 -mt-10 relative z-20">
                <div className="container mx-auto max-w-2xl">

                    {/* Main Action Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center relative overflow-hidden group">

                        {/* Background Decoration */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-red-600 to-red-500" />
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 relative z-10">
                            اضغط أدناه للبحث عن الصيدلية المناوبة في منطقتك
                        </h2>

                        <a
                            href="https://www.turkiye.gov.tr/saglik-titck-nobetci-eczane-sorgulama"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative z-10 inline-flex items-center justify-center gap-3 w-full py-5 px-6 bg-red-600 hover:bg-red-700 text-white text-xl font-bold rounded-2xl shadow-lg shadow-red-600/30 hover:scale-[1.02] hover:shadow-xl hover:shadow-red-600/40 transition-all duration-300"
                        >
                            <span>الانتقال لبحث e-Devlet الرسمي</span>
                            <ExternalLink className="w-6 h-6" />
                        </a>

                        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-slate-500 dark:text-slate-400 relative z-10">
                            <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                مصدر حكومي موثوق 100%
                            </span>
                            <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                <MapPin className="w-4 h-4 text-blue-500" />
                                يغطي كل الولايات
                            </span>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors py-2 px-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <span>العودة للرئيسية</span>
                            <ArrowRight className="w-4 h-4 rotate-180" />
                        </Link>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
