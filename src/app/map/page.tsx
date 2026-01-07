'use client';

import dynamic from 'next/dynamic';
import Footer from '@/components/Footer';

// استيراد الخريطة بشكل ديناميكي (يمنع أخطاء السيرفر)
const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => <div className="h-96 w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300">جاري تحميل الخريطة...</div>
});

export default function MapPage() {
  return (
    <main className="flex flex-col min-h-screen">

      <div className="flex-grow max-w-screen-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary-900 dark:text-slate-100 mb-6">خريطة الخدمات والأماكن المهمة</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* قسم القائمة الجانبية */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-y-auto">
            <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-slate-100">تصنيف الأماكن</h3>
            <div className="space-y-3">
              <button className="w-full text-right p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-200 font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition">
                🏛️ دوائر الهجرة (Göç İdaresi)
              </button>
              <button className="w-full text-right p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200">
                🏥 المستشفيات الحكومية
              </button>
              <button className="w-full text-right p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200">
                🎓 الجامعات المعتمدة
              </button>
            </div>
          </div>

          {/* قسم الخريطة */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative z-0">
            <LeafletMap />
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}