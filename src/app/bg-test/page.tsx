'use client';

import { useState } from 'react';

export default function BgTestPage() {
    const [activeBg, setActiveBg] = useState<'glow' | 'dots' | 'grain'>('glow');

    return (
        <div className={`min-h-screen relative font-cairo transition-colors duration-500
      ${activeBg === 'glow' ? 'bg-white dark:bg-[#020617]' : ''}
      ${activeBg === 'dots' ? 'bg-slate-50 dark:bg-[#0b1120]' : ''}
      ${activeBg === 'grain' ? 'bg-[#fafaf9] dark:bg-[#1c1917]' : ''}
    `}>

            {/* 
        ====================================================================
        BACKGROUND LAYERS (MINIMALIST)
        ====================================================================
      */}

            {/* OPTION 1: TOP GLOW (Clean & Modern) 💡 */}
            {/* Just a soft light at the top, fading to white */}
            {activeBg === 'glow' && (
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-emerald-50 to-transparent dark:from-emerald-900/20 dark:to-transparent opacity-70" />
                    <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-teal-100/40 dark:bg-teal-900/10 blur-[100px] rounded-full" />
                </div>
            )}

            {/* OPTION 2: MICRO DOTS (Structured) 📏 */}
            {/* Extremely faint dots for subtle texture */}
            {activeBg === 'dots' && (
                <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.3]">
                    <div className="absolute inset-0"
                        style={{
                            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                            backgroundSize: '32px 32px'
                        }}
                    />
                </div>
            )}

            {/* OPTION 3: PAPER GRAIN (Warm & Matte) 📄 */}
            {/* Static noise to kill the glossiness of white */}
            {activeBg === 'grain' && (
                <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.4] mix-blend-multiply dark:mix-blend-overlay">
                    <div className="absolute inset-0" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")', filter: 'contrast(150%)' }} />
                </div>
            )}

            {/* 
        ====================================================================
        CONTROLS
        ====================================================================
      */}

            <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-24 text-center">

                {/* Simple Switcher */}
                <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-16">
                    {[
                        { id: 'glow', label: '1. إضاءة علوية (Glow)' },
                        { id: 'dots', label: '2. نقاط خفيفة (Dots)' },
                        { id: 'grain', label: '3. ملمس ورق (Grain)' }
                    ].map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setActiveBg(opt.id as any)}
                            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeBg === opt.id
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
                    {activeBg === 'glow' && 'نظافة مع لمسة لون'}
                    {activeBg === 'dots' && 'هندسة خفية'}
                    {activeBg === 'grain' && 'مات (غير لامع)'}
                </h1>

                <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12">
                    {activeBg === 'glow' && 'الأرضية بيضاء، ولكن أضفنا ضوءاً خافتاً جداً من الأعلى ليعطي عمقاً للصفحة دون أي رسومات.'}
                    {activeBg === 'dots' && 'نقاط رمادية صغيرة جداً ومتباعدة. تكسر المساحة البيضاء وتجعل الموقع يبدو مرتباً.'}
                    {activeBg === 'grain' && 'بدل اللون الأبيض الصريح، نستخدم لوناً "قشر البيض" مع ملمس خشن بسيط لراحة العين.'}
                </p>

                {/* Content Example */}
                <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-2xl shadow-sm">
                    <div className="h-4 w-24 bg-emerald-100 text-emerald-700 rounded text-xs font-bold flex items-center justify-center mb-4">مثال محتوى</div>
                    <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">بساطة مطلقة</h3>
                    <p className="text-slate-500 leading-relaxed">
                        هنا لا يوجد أي شيء يشتت الانتباه. الخلفية هادئة تماماً وتؤدي دورها فقط: إبراز ما هو مكتوب.
                    </p>
                </div>

            </div>
        </div>
    );
}
