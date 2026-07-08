'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { SITE_CONFIG } from '@/lib/config';
import { SECTIONS_MENU, LATEST_UPDATES_VERSION, UPDATES_STORAGE_KEY, TOOLS_MENU } from '@/lib/constants';
import { fetchRemoteUpdatesVersion } from '@/lib/remoteData';
import {
  Menu, X, BrainCircuit, Search, Bell, Sparkles, ChevronDown, ChevronLeft,
  Home, Briefcase, FileText, Info, Building2, Smartphone,
  ShieldAlert, FolderOpen, MapPin, BookOpen, Calculator,
  UserCheck, HeartPulse, Link as LinkIcon, ScrollText, Newspaper
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import PrayerPopover from './PrayerPopover';
import NavDropdown from './NavDropdown';
import NavMegaMenu from './NavMegaMenu';
import NotificationBell from './notifications/NotificationBell';
import UrgencyBanner from './UrgencyBanner';
import { useSiteConfig } from '@/lib/hooks/useSiteConfig';
import { useAuth } from '@/lib/hooks/useAuth';

// Helper to map icon names to components
export const IconMap: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  Home, Briefcase, FileText, BrainCircuit, Info, Building2, Smartphone,
  ShieldAlert, FolderOpen, MapPin, BookOpen, Calculator,
  UserCheck, HeartPulse, Link: LinkIcon, ScrollText
};


function AuthButton({ mobile = false }: { mobile?: boolean }) {
  const { user, loading } = useAuth();

  if (loading) return <div className={`hidden sm:block w-[90px] h-[32px] rounded-full animate-pulse ${mobile ? 'bg-slate-100 dark:bg-slate-800' : 'bg-white/20'}`} />;

  const displayClass = mobile ? 'flex' : 'hidden sm:flex';

  if (user) {
    // On the teal bar → gold CTA; inside the white mobile drawer → emerald chip.
    const cls = mobile
      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800'
      : 'bg-[#d8b96a] hover:bg-[#cfa94f] text-[#3a2c0c] border border-[#e6cf92] shadow-sm';
    return (
      <Link
        href="/dashboard"
        className={`${displayClass} items-center justify-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors w-full sm:w-auto ${cls}`}
      >
        <UserCheck size={14} />
        <span>حسابي</span>
      </Link>
    );
  }

  // Logged-out CTA: white pill on the teal bar; dark pill in the white drawer.
  const loginCls = mobile
    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-900/20 hover:scale-105'
    : 'bg-white text-[hsl(200,45%,26%)] hover:bg-white/90 shadow-sm';
  return (
    <Link
      href="/login"
      className={`${displayClass} items-center justify-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all w-full sm:w-auto ${loginCls}`}
    >
      <span>تسجيل الدخول</span>
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [currentUpdatesVersion, setCurrentUpdatesVersion] = useState(LATEST_UPDATES_VERSION);
  // Tools Fallback
  const [tools, setTools] = useState<any[]>(TOOLS_MENU.map((t: any) => ({
    name: t.name,
    route: t.href // Map href to route
  })));
  const navRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);
  useEffect(() => { setMounted(true); }, []);
  const portalTarget = mounted ? document.body : null;

  // Hide navbar on scroll-DOWN, show immediately on scroll-UP.
  //
  // Design choices that matter:
  //
  //   1. requestAnimationFrame throttle. The scroll event fires
  //      dozens of times per second on a modern trackpad; running
  //      setState every fire dropped frames.
  //
  //   2. Asymmetric tolerance: hide needs 8 px down, show needs
  //      only 2 px up. Hiding feels deliberate, showing feels
  //      instant — exactly the user's request.
  //
  //   3. Always visible in the first 80 px of the page so the
  //      reader at the top never sees a hidden header.
  useEffect(() => {
    let ticking = false;

    const handle = () => {
      const y = Math.max(0, window.scrollY);
      const prev = lastScrollY.current;

      if (y < 80) {
        setNavHidden(false);
      } else if (y > prev + 8) {
        setNavHidden(true);
      } else if (y < prev - 2) {
        setNavHidden(false);
      }

      lastScrollY.current = y;
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(handle);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Measure the navbar's rendered height so the spacer below it
  // (which keeps page content from jumping under the now-fixed
  // header) is always exactly the right size. Resize observer so
  // the spacer follows the navbar even when nav reflows on
  // breakpoint changes (mobile/desktop, dark/light theme switch).
  const [navHeight, setNavHeight] = useState(56);
  useEffect(() => {
    const el = navRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect?.height;
      if (h && h > 0) setNavHeight(Math.ceil(h));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Shared site config (menus + tools) — deduplicated with Footer via SWR
  const { data: siteConfig } = useSiteConfig();

  useEffect(() => {
    // MERGE the static TOOLS_MENU with the DB tools_registry (dedup by route).
    // Previously the DB list REPLACED the static one, so any tool not yet in
    // tools_registry (e.g. a newly shipped tool) was invisible in the nav.
    // Merging guarantees new static tools appear; DB entries still win on
    // name/order for shared routes.
    const staticTools = TOOLS_MENU.map((t: any) => ({ name: t.name, route: t.href }));
    const dbTools = siteConfig?.tools || [];
    const merged = Array.from(new Map([...staticTools, ...dbTools].map((item: any) => [item.route, item])).values())
      .filter((t: any) => t.route !== '/forms' && t.route !== '/directory' && t.route !== '/consultant');
    setTools(merged);
  }, [siteConfig]);

  useEffect(() => {
    let mounted = true;
    // Delay non-critical remote version check to avoid blocking initial render
    const timer = setTimeout(() => {
      fetchRemoteUpdatesVersion()
        .then((v) => {
          if (!mounted) return;
          if (v) setCurrentUpdatesVersion(v);
        })
        .catch(() => {
          // ignore
        });
    }, 3000);

    try {
      const lastSeen = localStorage.getItem(UPDATES_STORAGE_KEY) || '';
      setHasNewUpdates(lastSeen !== currentUpdatesVersion);
    } catch {
      // ignore
    }
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [currentUpdatesVersion]);

  useEffect(() => {
    if (!pathname) return;
    if (!pathname.startsWith('/updates')) return;
    try {
      localStorage.setItem(UPDATES_STORAGE_KEY, currentUpdatesVersion);
    } catch {
      // ignore
    }
    setHasNewUpdates(false);
  }, [pathname, currentUpdatesVersion]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Don't render on Admin pages (after all hooks)
  if (pathname?.startsWith('/admin')) return null;

  const mobileDrawer = portalTarget
    ? createPortal(
      <>
            {/* Backdrop */}
            <button
              type="button"
              aria-label="إغلاق القائمة"
              onClick={() => setIsOpen(false)}
              className={`fixed inset-0 z-[110] lg:hidden bg-black/20 dark:bg-black/60 backdrop-blur-md transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />

            {/* Drawer */}
            <div
              id="mobile-menu"
              role="dialog"
              aria-modal={isOpen || undefined}
              aria-label="القائمة الرئيسية"
              className={`fixed top-0 right-0 z-[120] h-full w-[85vw] max-w-md bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
              {/* Header — magazine-style eyebrow + title + close
                  button. Replaces the flat single-line "القائمة" so
                  the drawer feels like a real navigation surface, not
                  a popover. Matches the eyebrow pattern used across
                  the site (HomeUpdates, QuickActionsGrid, etc.). */}
              <div className="relative p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 dark:from-emerald-950/40 dark:via-cyan-950/40 dark:to-blue-950/40 overflow-hidden">
                {/* Top accent stripe — same family as the site nav */}
                <div
                  aria-hidden="true"
                  className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-emerald-400 via-teal-400 to-cyan-400"
                />
                {/* Soft top sheen */}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/30 to-transparent dark:from-white/[0.04] pointer-events-none"
                />
                <div className="relative flex items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 mb-1">
                      <span className="relative inline-flex items-center justify-center w-1.5 h-1.5">
                        <span className="absolute inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-75 animate-ping" />
                        <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </span>
                      <span className="text-[10px] font-black tracking-[0.2em] uppercase text-emerald-700 dark:text-emerald-300">
                        MENU · القائمة
                      </span>
                    </div>
                    <span className="block font-black text-lg sm:text-xl text-slate-900 dark:text-slate-50 leading-tight">
                      تصفّح الموقع
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-2.5 min-w-11 min-h-11 flex items-center justify-center bg-white dark:bg-slate-900 rounded-full text-slate-600 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-300 transition-all duration-200 shadow-sm border border-slate-200 dark:border-slate-700 group"
                    aria-label="إغلاق القائمة"
                  >
                    <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">

                {/* Auth Button */}
                <div className="mb-2" onClick={() => setIsOpen(false)}>
                  <AuthButton mobile={true} />
                </div>

                {/* Primary Links */}
                <nav className="space-y-2">
                  {[
                    { name: 'الرئيسية', href: '/', icon: Home },
                    { name: 'دليل المواقف', href: '/consultant', icon: BrainCircuit },
                    { name: 'الأكواد الأمنية', href: '/codes', icon: ShieldAlert },
                    { name: 'روابط حكومية رسمية', href: '/important-links', icon: LinkIcon },
                  ].map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`group relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 overflow-hidden ${isActive ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold shadow-md' : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'} hover:shadow-[0_4px_12px_-2px_rgba(16,185,129,0.15)]`}
                      >
                        <span className="absolute bottom-0 right-0 h-[2px] w-0 bg-gradient-to-l from-emerald-400 to-emerald-600 shadow-[0_0_8px_rgba(52,211,153,0.8)] transition-all duration-300 ease-out group-hover:w-full" />
                        <span className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-white dark:bg-emerald-950 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-emerald-500'}`}>
                          <item.icon size={20} />
                        </span>
                        <span className="text-base">{item.name}</span>
                      </Link>
                    );
                  })}

                  {/* Services Card */}
                  <Link
                    href="/services"
                    onClick={() => setIsOpen(false)}
                    className={`group relative flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 overflow-hidden ${pathname === '/services' ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/30' : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-500/30'}`}
                  >
                    <span className="p-2 rounded-xl bg-white/20"><Briefcase size={20} /></span>
                    <div>
                      <span className="text-base font-bold block">خدمات ومهن</span>
                      <span className="text-[11px] text-white/70">تصفّح مقدمي الخدمات والحرفيين</span>
                    </div>
                    <Sparkles size={16} className="mr-auto opacity-60" />
                  </Link>
                </nav>

                {/* ── Collapsible: الدليل والمعلومات ── */}
                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenSection(openSection === 'guide' ? null : 'guide')}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                        <FolderOpen size={16} className="text-emerald-600 dark:text-emerald-400" />
                      </span>
                      <span className="font-bold text-sm text-slate-700 dark:text-slate-200">الدليل والمعلومات</span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">7</span>
                    </span>
                    <ChevronLeft size={16} className={`text-slate-400 transition-transform duration-300 ${openSection === 'guide' ? '-rotate-90' : ''}`} />
                  </button>
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSection === 'guide' ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-2 pb-2 space-y-1">
                      {[
                        { name: 'الدليل الشامل', href: '/directory', icon: FolderOpen },
                        { name: 'دليل المدن', href: '/city', icon: MapPin },
                        { name: 'خدمات السوريين', href: '/category/syrians', icon: Building2 },
                        { name: 'الأسئلة الشائعة', href: '/faq', icon: BookOpen },
                        { name: 'أسئلة وأجوبة', href: '/qa', icon: BookOpen },
                        { name: 'خدمات e-Devlet', href: '/e-devlet-services', icon: Smartphone },
                        { name: 'الأكواد', href: '/codes', icon: ShieldAlert },
                        { name: 'روابط هامة', href: '/important-links', icon: LinkIcon },
                      ].map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 overflow-hidden ${isActive ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                          >
                            <item.icon size={16} className={`transition-colors ${isActive ? 'text-emerald-500' : 'text-slate-400 group-hover:text-emerald-500'}`} />
                            <span className="font-medium text-sm">{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Collapsible: الأدوات الذكية ── */}
                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenSection(openSection === 'tools' ? null : 'tools')}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <BrainCircuit size={16} className="text-blue-600 dark:text-blue-400" />
                      </span>
                      <span className="font-bold text-sm text-slate-700 dark:text-slate-200">الأدوات الذكية</span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">6</span>
                    </span>
                    <ChevronLeft size={16} className={`text-slate-400 transition-transform duration-300 ${openSection === 'tools' ? '-rotate-90' : ''}`} />
                  </button>
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSection === 'tools' ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-2 pb-2 space-y-1">
                      {[
                        { name: 'حاسبة أيام الإقامة والغياب', href: '/tools/residence-calculator', icon: Calculator },
                        { name: 'فحص الكملك', href: '/tools/kimlik-check', icon: UserCheck },
                        { name: 'حاسبة المنع', href: '/ban-calculator', icon: Calculator },
                        { name: 'حاسبة تكاليف الإقامة', href: '/calculator', icon: Calculator },
                        { name: 'المناطق المحظورة', href: '/zones', icon: MapPin },
                        { name: 'الصيدليات المناوبة', href: '/tools/pharmacy', icon: HeartPulse },
                      ].map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 overflow-hidden ${isActive ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                          >
                            <item.icon size={16} className={`transition-colors ${isActive ? 'text-emerald-500' : 'text-slate-400 group-hover:text-emerald-500'}`} />
                            <span className="font-medium text-sm">{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950"
              >
                <p className="text-xs text-center text-slate-500 mb-4">{SITE_CONFIG.slogan}</p>
                <div className="flex justify-center">
                  <ThemeToggle />
                </div>
              </div>
            </div>
      </>,
      portalTarget
    )
    : null;

  return (
    <>
      {/* Spacer keeps page content from jumping under the now-fixed
          header. Height tracks the navbar via ResizeObserver above so
          it always matches the rendered height across breakpoints,
          theme switches, and locale changes. */}
      <div style={{ height: navHeight }} aria-hidden="true" />

      <header
        ref={navRef}
        // position: fixed instead of sticky. Reason: globals.css sets
        // `html, body { overflow-x: hidden }` which breaks position:
        // sticky in Safari iOS and some Chrome versions — the navbar
        // would scroll out with the page instead of pinning, so the
        // hide/show logic had nothing to act on. Fixed positioning
        // bypasses the sticky containing-block / overflow ancestor
        // rules entirely and works in every browser regardless of
        // body overflow settings.
        className={`fixed top-0 left-0 right-0 z-[100] w-full bg-[hsl(200,42%,30%)] dark:bg-[hsl(200,42%,20%)] border-b border-white/10 shadow-md shadow-black/10 will-change-transform transition-transform duration-300 ease-out ${navHidden ? '-translate-y-full' : 'translate-y-0'}`}
      >
        {/* Promo / alert / sponsor banner — MUST live INSIDE this fixed header.
            The header is `position: fixed; top-0; z-[100]`; a banner rendered
            above it in normal flow (the old layout.tsx spot) sat at y=0 and was
            painted OVER by this fixed bar, so it never showed. Inside the header
            it renders above the nav row, and navRef's ResizeObserver folds its
            height into the spacer automatically. */}
        <UrgencyBanner />

        {/* Soft gold accent line — matches the CTA, sits quietly on the teal bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d8b96a]/70 to-transparent" />

        {/* Main Container - Flex Row */}
        <div className="max-w-screen-2xl mx-auto px-4 h-12 flex items-center justify-between relative">

          {/* 1. Logo Section (Left) */}
          <div className="flex items-center shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-9 h-9 shrink-0">
                <Image src="/logo.png" alt="شعار دليل العرب" width={36} height={36} priority className="w-full h-full object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all" />
              </div>
              <div className="hidden sm:block">
                <div className="font-extrabold text-lg leading-tight text-white group-hover:text-[#f0dca8] transition-colors">
                  {SITE_CONFIG.name}
                </div>
                <p className="text-[9px] text-white/70 font-bold">دليلك الشامل والموثوق</p>
              </div>
            </Link>
          </div>

          {/* 2. Middle Navigation (Takes available space and centers content) */}
          <nav
            tabIndex={-1}
            className="hidden lg:flex flex-1 justify-center items-center gap-1 mx-4 bg-transparent border-none ring-0 outline-none shadow-none isolate"
            style={{ background: 'transparent', boxShadow: 'none', border: 'none' }}
          >
            {/* الرئيسية */}
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${pathname === '/' ? 'bg-white text-[hsl(200,45%,26%)] shadow-sm' : 'text-white/90 hover:bg-white/15 hover:text-white'}`}
            >
              <Home size={16} />
              <span>الرئيسية</span>
            </Link>

            {/* الأقسام — mega-menu */}
            <NavMegaMenu title="الأقسام" items={SECTIONS_MENU} />

            {/* الأدوات — dropdown */}
            <NavDropdown
              title="الأدوات"
              items={tools.map(t => {
                const staticTool = TOOLS_MENU.find(tm => tm.href === t.route);
                return {
                  name: t.name,
                  href: t.route,
                  icon: staticTool?.icon || Sparkles
                };
              })}
            />

            {/* الخدمات */}
            <Link
              href="/services"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${pathname === '/services' ? 'bg-white text-[hsl(200,45%,26%)] shadow-sm' : 'text-white/90 hover:bg-white/15 hover:text-white'}`}
            >
              <Briefcase size={16} />
              <span>الخدمات</span>
            </Link>

            {/* الأخبار */}
            <Link
              href="/updates"
              className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${pathname?.startsWith('/updates') ? 'bg-white text-[hsl(200,45%,26%)] shadow-sm' : 'text-white/90 hover:bg-white/15 hover:text-white'}`}
            >
              <Newspaper size={16} />
              <span>الأخبار</span>
              {hasNewUpdates && !pathname?.startsWith('/updates') && (
                <span className="absolute top-1.5 left-2 w-1.5 h-1.5 rounded-full bg-[#f0dca8] ring-2 ring-[hsl(200,42%,30%)] dark:ring-[hsl(200,42%,20%)]" />
              )}
            </Link>
          </nav>

          {/* 3. Actions Section (Right) */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Search Removed */}

            <NotificationBell />

            <PrayerPopover />

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="lg:hidden p-2.5 min-w-11 min-h-11 flex items-center justify-center text-white hover:bg-white/15 rounded-lg transition-colors"
              onClick={() => setIsOpen(true)}
              aria-label="القائمة الرئيسية"
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              <Menu size={20} />
            </button>

            {/* Auth Button */}
            <AuthButton />
          </div>

        </div>
      </header>
      {mobileDrawer}
    </>
  );
}
