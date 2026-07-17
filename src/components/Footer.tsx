// SERVER COMPONENT — deliberately no 'use client'.
//
// The footer is ~160 lines of static links and trust badges; it was a client
// component only for usePathname() (hide on /admin) and useSiteConfig() (the
// DB footer-menu override). Both concerns moved into tiny islands —
// FooterGate and FooterMenuSection — so the bulk of this tree ships as HTML
// with zero hydration cost. The fallback link lists below render on the
// server and are passed to FooterMenuSection as children: they appear in the
// initial HTML exactly as before and never enter the client bundle.
//
// Every footer Link is prefetch={false}: footer links are below the fold and
// low-intent, so speculative route prefetching is pure waste for them.
// NOTE (2026-07-17): under Lighthouse mobile emulation the /consultant route's
// chunks (~110KB: framer + the scenarios dataset) still get fetched on article
// views even with this flag — the trigger is somewhere in Next 16's
// touch/mobile-conditional prefetching, not this link specifically (desktop-UA
// Chrome never fetches them, before or after). The durable fix is making the
// consultant route itself thin (lazy-import consultant-scenarios, drop framer
// from ConsultantClient) — tracked as a follow-up.
import React from 'react';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/config';
import { Wrench, Shield, Scale } from 'lucide-react';
import FooterGate from './footer/FooterGate';
import FooterMenuSection from './footer/FooterMenuSection';

export default function Footer() {
  return (
    <FooterGate>
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
              <h2 className="font-black text-2xl mb-3 leading-tight">
                <Link prefetch={false} href="/" className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent hover:from-emerald-300 hover:to-cyan-300 transition-all">
                  {SITE_CONFIG.name}
                </Link>
              </h2>
              <p className="text-sm leading-relaxed mb-6 text-slate-400">
                {SITE_CONFIG.slogan}. منصتك الموثوقة للمعلومات القانونية والخدمية في تركيا.
              </p>
            </div>

            {/* القسم 2: أقسام تهمك (Dynamic) */}
            <div>
              <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2 before:content-[''] before:w-1.5 before:h-5 before:bg-emerald-500 before:rounded-full">أقسام تهمك</h2>
              <ul className="space-y-2.5 text-sm">
                <FooterMenuSection section="section1">
                  {/* Default Fallback — includes the 5 section hubs so they're
                      always reachable from this persistent footer surface.
                      Residence points to /residence (NOT /category/residence)
                      to match CrossLinks and the standalone residence hub's
                      canonical, so link equity isn't split across two URLs. */}
                  <li><Link prefetch={false} href="/articles" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">📰 أحدث المقالات</Link></li>
                  <li><Link prefetch={false} href="/directory" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">📂 الدليل الشامل</Link></li>
                  <li><Link prefetch={false} href="/city" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">🏙️ دليل المدن</Link></li>
                  <li><Link prefetch={false} href="/residence" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">📄 دليل الإقامات</Link></li>
                  <li><Link prefetch={false} href="/work" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">💼 دليل العمل</Link></li>
                  <li><Link prefetch={false} href="/education" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">🎓 دليل التعليم</Link></li>
                  <li><Link prefetch={false} href="/housing" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">🏠 دليل السكن</Link></li>
                  <li><Link prefetch={false} href="/health" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">🩺 دليل الصحة والتأمين</Link></li>
                  <li><Link prefetch={false} href="/e-devlet-services" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">📱 خدمات e-Devlet</Link></li>
                  <li><Link prefetch={false} href="/category/syrians" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">🏢 خدمات السوريين</Link></li>
                  <li><Link prefetch={false} href="/forms" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">📝 نماذج وعقود جاهزة</Link></li>
                </FooterMenuSection>
              </ul>
            </div>

            {/* القسم 3: أدوات ذكية (Dynamic) */}
            <div>
              <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2 before:content-[''] before:w-1.5 before:h-5 before:bg-cyan-400 before:rounded-full">
                <Wrench size={18} className="text-cyan-400" />
                أدوات ذكية
              </h2>
              <ul className="space-y-2.5 text-sm">
                <FooterMenuSection section="section2">
                  {/* Default Fallback */}
                  <li key="f1"><Link prefetch={false} href="/consultant" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">🧭 دليل المواقف</Link></li>
                  <li key="f2"><Link prefetch={false} href="/ban-calculator" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">🧮 حاسبة منع الدخول</Link></li>
                  <li key="f3"><Link prefetch={false} href="/codes" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">🛡️ فحص الأكواد الأمنية</Link></li>
                  <li key="f4"><Link prefetch={false} href="/tools/kimlik-check" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">🆔 فحص قيد الكملك</Link></li>
                  <li key="f4b"><Link prefetch={false} href="/tools/residence-calculator" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">📅 حاسبة أيام الإقامة والغياب</Link></li>
                  <li key="f4a"><Link prefetch={false} href="/tools/currency" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">💱 أسعار الصرف ومحوّل العملات</Link></li>
                  <li key="f4c"><Link prefetch={false} href="/tools/salary-calculator" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">💵 حاسبة الراتب الصافي والإجمالي</Link></li>
                  <li key="f4d"><Link prefetch={false} href="/tools/severance-calculator" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">🪙 حاسبة تعويض نهاية الخدمة</Link></li>
                  <li key="f4e"><Link prefetch={false} href="/tools/rent-increase-calculator" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">🏠 حاسبة زيادة الإيجار القانونية</Link></li>
                  <li key="f5"><Link prefetch={false} href="/calculator" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">💰 حاسبة تكاليف الإقامة</Link></li>
                  <li key="f6"><Link prefetch={false} href="/zones" className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">🗺️ خريطة المناطق المحظورة</Link></li>
                </FooterMenuSection>
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
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
              <p>
                © {new Date().getFullYear()} <span className="text-slate-300 font-bold">{SITE_CONFIG.name}</span> — جميع الحقوق محفوظة.
              </p>

              <div className="flex flex-wrap justify-center md:justify-start gap-x-5 gap-y-2">
                <Link prefetch={false} href="/about" className="hover:text-emerald-400 transition-colors font-bold text-slate-300 py-1">
                  من نحن
                </Link>
                <Link prefetch={false} href="/privacy#privacy-controls" className="hover:text-emerald-400 transition-colors">
                  الخصوصية وإعداداتها
                </Link>
                <Link prefetch={false} href="/disclaimer" className="hover:text-emerald-400 transition-colors">
                  إخلاء المسؤولية
                </Link>
                <Link prefetch={false} href="/copyright" className="hover:text-emerald-400 transition-colors">
                  حقوق النشر
                </Link>
                <Link prefetch={false} href="/newsletter/unsubscribe" className="hover:text-emerald-400 transition-colors">
                  إلغاء النشرة
                </Link>
                <Link prefetch={false} href="/contact" className="hover:text-emerald-400 transition-colors">
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
    </FooterGate>
  );
}
