'use client';

import React from 'react';
import Link from 'next/link';
import SocialLinks from './SocialLinks';
import { SITE_CONFIG } from '@/lib/config';
import { usePathname } from 'next/navigation';
import { useSiteConfig } from '@/lib/hooks/useSiteConfig';
import { Wrench, Shield, Scale } from 'lucide-react';

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

        <div className="relative max-w-screen-2xl mx-auto px-4 py-10">
          {/* Brand spans a full row (sm) / half (lg) so the two link columns
              always sit SIDE BY SIDE with aligned tops — the old md:2-col
              grid paired the short brand block with the tall links column
              and pushed «أدوات ذكية» onto a ragged lonely row. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 mb-8">

            {/* القسم 1: عن الموقع */}
            <div className="sm:col-span-2 lg:pe-10">
              <h3 className="font-black text-2xl mb-3 leading-tight">
                <Link href="/" className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent hover:from-emerald-300 hover:to-cyan-300 transition-all">
                  {SITE_CONFIG.name}
                </Link>
              </h3>
              <p className="text-sm leading-relaxed mb-6 text-slate-400">
                {SITE_CONFIG.slogan}. منصتك الموثوقة للمعلومات القانونية والخدمية في تركيا.
              </p>
              <SocialLinks />
            </div>

            {/* القسم 2: أقسام تهمك (Dynamic) */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2 before:content-[''] before:w-1.5 before:h-5 before:bg-emerald-500 before:rounded-full">أقسام تهمك</h3>
              <ul className="space-y-2.5 text-sm">
                {footerMenus.section1.length > 0 ? footerMenus.section1.map((item) => (
                  <li key={item.id}><Link href={item.href} className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">{item.label}</Link></li>
                )) : (
                  // Default Fallback — includes the 5 section hubs so they're
                  // always reachable from this persistent footer surface.
                  // Residence points to /residence (NOT /category/residence)
                  // to match CrossLinks and the standalone residence hub's
                  // canonical, so link equity isn't split across two URLs.
                  <>
                    <li><Link href="/directory" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">📂 الدليل الشامل</Link></li>
                    <li><Link href="/city" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">🏙️ دليل المدن</Link></li>
                    <li><Link href="/residence" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">📄 دليل الإقامات</Link></li>
                    <li><Link href="/work" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">💼 دليل العمل</Link></li>
                    <li><Link href="/education" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">🎓 دليل التعليم</Link></li>
                    <li><Link href="/housing" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">🏠 دليل السكن</Link></li>
                    <li><Link href="/health" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">🩺 دليل الصحة والتأمين</Link></li>
                    <li><Link href="/e-devlet-services" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">📱 خدمات e-Devlet</Link></li>
                    <li><Link href="/category/syrians" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">🏢 خدمات السوريين</Link></li>
                    <li><Link href="/forms" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">📝 نماذج وعقود جاهزة</Link></li>
                  </>
                )}
              </ul>
            </div>

            {/* القسم 3: أدوات ذكية (Dynamic) */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2 before:content-[''] before:w-1.5 before:h-5 before:bg-cyan-400 before:rounded-full">
                <Wrench size={18} className="text-cyan-400" />
                أدوات ذكية
              </h3>
              <ul className="space-y-2.5 text-sm">
                {footerMenus.section2.length > 0 ? footerMenus.section2.map((item) => (
                  <li key={item.id}><Link href={item.href} className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">{item.label}</Link></li>
                )) : (
                  // Default Fallback
                  <>
                    <li key="f1"><Link href="/consultant" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">🧭 دليل المواقف</Link></li>
                    <li key="f2"><Link href="/ban-calculator" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">🧮 حاسبة منع الدخول</Link></li>
                    <li key="f3"><Link href="/codes" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">🛡️ فحص الأكواد الأمنية</Link></li>
                    <li key="f4"><Link href="/tools/kimlik-check" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">🆔 فحص قيد الكملك</Link></li>
                    <li key="f4b"><Link href="/tools/residence-calculator" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">📅 حاسبة أيام الإقامة والغياب</Link></li>
                    <li key="f5"><Link href="/calculator" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">💰 حاسبة تكاليف الإقامة</Link></li>
                    <li key="f6"><Link href="/zones" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">🗺️ خريطة المناطق المحظورة</Link></li>
                  </>
                )}
              </ul>
            </div>

          </div>

          {/* شارات الثقة — شريط أنيق بكروت بدل النصّ المسطّح. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-6 border-t border-slate-800/60">
            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-bold text-sm text-slate-200">مراجعة دورية للمحتوى</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
              <Shield size={18} className="text-emerald-400 shrink-0" />
              <span className="font-bold text-sm text-slate-200">اتصال مشفّر (HTTPS)</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
              <Scale size={18} className="text-emerald-400 shrink-0" />
              <span className="font-bold text-sm text-slate-200">مراجع قانونية رسمية</span>
            </div>
          </div>

          {/* الحقوق - Bottom */}
          <div className="border-t border-slate-800/60 pt-6 mt-0">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
              <p>
                © {new Date().getFullYear()} <span className="text-slate-300 font-bold">{SITE_CONFIG.name}</span> — جميع الحقوق محفوظة.
              </p>

              <div className="flex flex-wrap justify-center md:justify-start gap-x-5 gap-y-2">
                <Link href="/about" className="hover:text-emerald-400 transition-colors font-bold text-slate-300 py-1">
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
            <p className="text-center text-xs text-slate-600 mt-4">
              صُنع بـ <span className="text-rose-400">♥</span> للسوريين والعرب في تركيا
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}