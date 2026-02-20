'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import InstallPrompt from './InstallPrompt';
import SocialLinks from './SocialLinks';
import { SITE_CONFIG } from '@/lib/config';
import { supabase } from '@/lib/supabaseClient';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const [footerMenus, setFooterMenus] = useState<{ section1: any[], section2: any[] }>({ section1: [], section2: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFooterMenus() {
      if (!supabase) return;
      const { data } = await supabase.from('site_menus').select('*').in('location', ['footer_section_1', 'footer_section_2']).order('sort_order');
      if (data) {
        setFooterMenus({
          section1: data.filter(m => m.location === 'footer_section_1'),
          section2: data.filter(m => m.location === 'footer_section_2')
        });
      }
      setLoading(false);
    }
    fetchFooterMenus();
  }, []);

  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 py-12 mt-auto border-t border-slate-800">
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

            {/* القسم 1: عن الموقع */}
            <div className="md:col-span-1">
              <h3 className="text-white font-bold text-lg mb-4">
                <Link href="/" className="hover:text-emerald-400 transition-colors">
                  {SITE_CONFIG.name}
                </Link>
              </h3>
              <p className="text-sm leading-relaxed mb-6 text-slate-400">
                {SITE_CONFIG.slogan}. منصتك الأولى للمعلومات القانونية والخدمية في تركيا.
              </p>
              <SocialLinks />
            </div>

            {/* القسم 2: أقسام تهمك (Dynamic) */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">أقسام تهمك</h3>
              <ul className="space-y-2.5 text-sm">
                {footerMenus.section1.length > 0 ? footerMenus.section1.map((item) => (
                  <li key={item.id}><Link href={item.href} className="hover:text-emerald-400 transition-colors flex items-center gap-2">{item.label}</Link></li>
                )) : (
                  // Default Fallback
                  <>
                    <li><Link href="/directory" className="hover:text-emerald-400 transition-colors flex items-center gap-2">📂 الدليل الشامل</Link></li>
                    <li><Link href="/category/residence" className="hover:text-emerald-400 transition-colors flex items-center gap-2">📄 الإقامات في تركيا</Link></li>
                    <li><Link href="/e-devlet-services" className="hover:text-emerald-400 transition-colors flex items-center gap-2">📱 خدمات e-Devlet</Link></li>
                    <li><Link href="/category/syrians" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🏢 خدمات السوريين</Link></li>
                    <li><Link href="/forms" className="hover:text-emerald-400 transition-colors flex items-center gap-2">📝 نماذج وعقود جاهزة</Link></li>
                  </>
                )}
              </ul>
            </div>

            {/* القسم 3: أدوات ذكية (Dynamic) */}
            <div>
              <h3 className="text-emerald-400 font-bold text-lg mb-4 flex items-center gap-2">
                🚀 أدوات ذكية
              </h3>
              <ul className="space-y-2.5 text-sm">
                {footerMenus.section2.length > 0 ? footerMenus.section2.map((item) => (
                  <li key={item.id}><Link href={item.href} className="hover:text-emerald-400 transition-colors flex items-center gap-2">{item.label}</Link></li>
                )) : (
                  // Default Fallback
                  <>
                    <li key="f1"><Link href="/consultant" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🤖 المستشار الذكي</Link></li>
                    <li key="f2"><Link href="/ban-calculator" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🧮 حاسبة منع الدخول</Link></li>
                    <li key="f3"><Link href="/codes" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🛡️ فحص الأكواد الأمنية</Link></li>
                    <li key="f4"><Link href="/tools/kimlik-check" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🆔 فحص قيد الكملك</Link></li>
                    <li key="f5"><Link href="/calculator" className="hover:text-emerald-400 transition-colors flex items-center gap-2">💰 حاسبة تكاليف الإقامة</Link></li>
                    <li key="f6"><Link href="/zones" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🗺️ خريطة المناطق المحظورة</Link></li>
                  </>
                )}
              </ul>
            </div>

            {/* القسم 4: CTA بدلاً من النشرة */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <h3 className="text-white font-bold text-lg mb-2">تحتاج مساعدة خاصة؟</h3>
              <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                لا تضيع وقتك في البحث. المستشار الذكي يحلل وضعك القانوني ويعطيك الحل فوراً.
              </p>
              <Link
                href="/consultant"
                className="block w-full text-center bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20"
              >
                استشر الآن مجاناً
              </Link>
            </div>
          </div>

          {/* 🌟 Trust Badges (شارات الثقة) */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 py-8 border-t border-slate-800/50 mb-0">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-sm">تحديث يومي للبيانات</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-emerald-500">🛡️</span>
              <span className="font-medium text-sm">خصوصية مشفرة 100%</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-emerald-500">⚖️</span>
              <span className="font-medium text-sm">مراجع قانونية رسمية</span>
            </div>
          </div>

          {/* الحقوق - Bottom */}
          <div className="border-t border-slate-800 pt-8 mt-0">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
              <p>
                © {new Date().getFullYear()} {SITE_CONFIG.name}. جميع الحقوق محفوظة.
              </p>

              <div className="flex gap-4">
                <Link href="/about" className="hover:text-emerald-400 transition-colors font-bold text-slate-300">
                  من نحن؟
                </Link>
                <Link href="/privacy" className="hover:text-emerald-400 transition-colors">
                  سياسة الخصوصية
                </Link>
                <Link href="/disclaimer" className="hover:text-emerald-400 transition-colors">
                  إخلاء المسؤولية
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <InstallPrompt />
    </>
  );
}