'use client';

import { ModernMobileMenu } from '@/components/admin/demo/ModernMobileMenu';

export default function MobileTestPage() {
    return (
        <div className="min-h-screen bg-slate-200 dark:bg-slate-950 flex items-center justify-center p-8 font-cairo dir-rtl">

            {/* Mobile Simulator Frame */}
            <div className="w-[375px] h-[812px] bg-white dark:bg-black rounded-[40px] shadow-2xl border-[8px] border-slate-800 relative overflow-hidden ring-4 ring-slate-300 dark:ring-slate-700">
                {/* Status Bar Fake */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-slate-800 rounded-b-xl z-[100]"></div>

                <div className="h-full overflow-y-auto relative bg-slate-50 dark:bg-slate-950 no-scrollbar">
                    {/* The New Mobile Menu Component */}
                    <ModernMobileMenu />

                    {/* Dummy Content */}
                    <div className="p-4 pt-28 space-y-4">
                        <div className="text-center space-y-2 mb-8">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white">تجربة الموبايل</h2>
                            <p className="text-sm text-slate-500">
                                هذا محاكي لشكل التطبيق على الجوال.
                                <br />
                                جرب القائمة العلوية الآن 👇
                            </p>
                        </div>

                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-center">
                                <span className="text-slate-300 font-bold text-xl">بطاقة محتوى {i}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Helper Text for Desktop User */}
            <div className="fixed bottom-8 text-slate-500 text-sm hidden md:block">
                هذا نموذج محاكاة. في الجوال الحقيقي سيملأ الشاشة بالكامل.
            </div>
        </div>
    );
}
