'use client';

import React from 'react';
import Link from 'next/link';
import SocialLinks from './SocialLinks';
import { SITE_CONFIG } from '@/lib/config';
import { usePathname } from 'next/navigation';
import { useSiteConfig } from '@/lib/hooks/useSiteConfig';

export default function Footer() {
  const pathname = usePathname();
  const { data: siteConfig } = useSiteConfig();
  const footerMenus = siteConfig?.footerMenus ?? { section1: [], section2: [] };

  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      <footer className="relative bg-slate-950 text-slate-300 mt-auto overflow-hidden">
        {/* Decorative top accent — gradient line that anchors the footer
            visually to the page above it. Replaces the flat border-slate-800
            from the previous design with something that signals "brand". */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

        {/* Subtle emerald glow in corners — adds atmosphere without
            distracting from the dense info block in the middle. */}
        <div aria-hidden="true" className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/[0.05] rounded-full blur-3xl pointer-events-none" />
        <div aria-hidden="true" className="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-500/[0.04] rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-screen-2xl mx-auto px-4 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

            {/* القسم 1: عن الموقع */}
            <div className="md:col-span-1">
              <h3 className="font-black text-2xl mb-3 leading-tight">
                <Link href="/" className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent hover:from-emerald-300 hover:to-cyan-300 transition-all">
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
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2 before:content-[''] before:w-1.5 before:h-5 before:bg-emerald-500 before:rounded-full">أقسام تهمك</h3>
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
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2 before:content-[''] before:w-1.5 before:h-5 before:bg-cyan-400 before:rounded-full">
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

            {/* القسم 4: CTA — كرت متدرّج مع توهّج خفيف يجعل نقطة الاتّصال
                الأبرز بصرياً في الفوتر، بدلاً من المربّع المسطّح القديم. */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900/40 via-slate-900 to-slate-900 p-6 rounded-2xl border border-emerald-500/20 shadow-xl shadow-emerald-900/20">
              <div aria-hidden="true" className="absolute -top-10 -left-10 w-32 h-32 bg-emerald-500/[0.12] rounded-full blur-2xl pointer-events-none" />
              <div className="relative">
                <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  تحتاج مساعدة خاصة؟
                </h3>
                <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                  المستشار الذكي يحلّل وضعك القانوني ويعطيك الحلّ فوراً — مجاناً.
                </p>
                <Link
                  href="/consultant"
                  className="block w-full text-center bg-white text-emerald-700 hover:bg-emerald-50 font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:scale-[1.01]"
                >
                  استشر الآن
                </Link>
              </div>
            </div>
          </div>

          {/* شارات الثقة — شريط أنيق بكروت بدل النصّ المسطّح. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-8 border-t border-slate-800/60">
            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-bold text-sm text-slate-200">آخر مراجعة: يونيو ٢٠٢٦</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
              <span className="text-emerald-400 text-lg shrink-0">🛡️</span>
              <span className="font-bold text-sm text-slate-200">خصوصية مشفّرة ١٠٠٪</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
              <span className="text-emerald-400 text-lg shrink-0">⚖️</span>
              <span className="font-bold text-sm text-slate-200">مراجع قانونية رسمية</span>
            </div>
          </div>

          {/* الحقوق - Bottom */}
          <div className="border-t border-slate-800/60 pt-6 mt-0">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
              <p>
                © {new Date().getFullYear()} <span className="text-slate-300 font-bold">{SITE_CONFIG.name}</span> — جميع الحقوق محفوظة.
              </p>

              <div className="flex gap-5">
                <Link href="/about" className="hover:text-emerald-400 transition-colors font-bold text-slate-300">
                  من نحن
                </Link>
                <Link href="/privacy" className="hover:text-emerald-400 transition-colors">
                  الخصوصية
                </Link>
                <Link href="/disclaimer" className="hover:text-emerald-400 transition-colors">
                  إخلاء المسؤولية
                </Link>
                <Link href="/contact" className="hover:text-emerald-400 transition-colors">
                  تواصل
                </Link>
              </div>
            </div>
            <p className="text-center text-xs text-slate-600 mt-6">
              صُنع بـ <span className="text-rose-400">♥</span> للسوريين والعرب في تركيا
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}