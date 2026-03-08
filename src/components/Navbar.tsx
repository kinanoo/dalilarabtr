'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { SITE_CONFIG } from '@/lib/config';
import { GUIDES_MENU, LATEST_UPDATES_VERSION, UPDATES_STORAGE_KEY, PRIMARY_NAV, TOOLS_MENU } from '@/lib/constants';
import { fetchRemoteUpdatesVersion } from '@/lib/remoteData';
import {
  Menu, X, BrainCircuit, Search, Bell, Sparkles, ChevronDown, ChevronLeft,
  Home, Briefcase, FileText, Info, Building2, Smartphone,
  ShieldAlert, FolderOpen, MapPin, BookOpen, Calculator,
  UserCheck, HeartPulse, Link as LinkIcon, ScrollText
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import PrayerPopover from './PrayerPopover';
import NavDropdown from './NavDropdown';
import NotificationBell from './notifications/NotificationBell';
import { useSiteConfig } from '@/lib/hooks/useSiteConfig';
import { useAuth } from '@/lib/hooks/useAuth';

// Helper to map icon names to components
export const IconMap: any = {
  Home, Briefcase, FileText, BrainCircuit, Info, Building2, Smartphone,
  ShieldAlert, FolderOpen, MapPin, BookOpen, Calculator,
  UserCheck, HeartPulse, Link: LinkIcon, ScrollText
};


function AuthButton({ mobile = false }: { mobile?: boolean }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="hidden sm:block w-[90px] h-[32px] rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />;

  const displayClass = mobile ? 'flex' : 'hidden sm:flex';

  if (user) {
    return (
      <Link
        href="/dashboard"
        className={`${displayClass} items-center justify-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors border border-emerald-100 dark:border-emerald-800 w-full sm:w-auto`}
      >
        <UserCheck size={14} />
        <span>حسابي</span>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className={`${displayClass} items-center justify-center gap-2 px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-xs font-bold hover:scale-105 transition-transform shadow-lg shadow-slate-900/20 w-full sm:w-auto`}
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
  // Initialize with Static Data (Fallback)
  const [headerMenus, setHeaderMenus] = useState<any[]>(PRIMARY_NAV.map(item => ({
    href: item.href,
    label: item.name,
    icon: item.icon // Component
  })));
  // Tools Fallback
  const [tools, setTools] = useState<any[]>(TOOLS_MENU.map((t: any) => ({
    name: t.name,
    route: t.href // Map href to route
  })));
  const navRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const portalTarget = mounted ? document.body : null;

  // Hide navbar on scroll down, show on scroll up
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;

      if (diff > 8 && currentY > 80) {
        // Scrolling down past threshold — hide
        setNavHidden(true);
      } else if (diff < -3) {
        // Any small scroll up — show immediately
        setNavHidden(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Shared site config (menus + tools) — deduplicated with Footer via SWR
  const { data: siteConfig } = useSiteConfig();

  useEffect(() => {
    if (!siteConfig?.tools?.length) return;
    const uniqueTools = Array.from(new Map(siteConfig.tools.map((item: any) => [item.route, item])).values())
      .filter((t: any) => t.route !== '/forms' && t.route !== '/directory' && t.route !== '/consultant');
    setTools(uniqueTools);
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
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 dark:from-emerald-950/30 dark:via-cyan-950/30 dark:to-blue-950/30">
                <span className="font-bold text-lg text-slate-800 dark:text-slate-100">القائمة</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2.5 min-w-11 min-h-11 flex items-center justify-center bg-white dark:bg-slate-900 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
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
                    { name: 'المستشار الذكي', href: '/consultant', icon: BrainCircuit },
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
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">6</span>
                    </span>
                    <ChevronLeft size={16} className={`text-slate-400 transition-transform duration-300 ${openSection === 'guide' ? '-rotate-90' : ''}`} />
                  </button>
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSection === 'guide' ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-2 pb-2 space-y-1">
                      {[
                        { name: 'الدليل الشامل', href: '/directory', icon: FolderOpen },
                        { name: 'خدمات السوريين', href: '/category/syrians', icon: Building2 },
                        { name: 'الأسئلة الشائعة', href: '/faq', icon: BookOpen },
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
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">5</span>
                    </span>
                    <ChevronLeft size={16} className={`text-slate-400 transition-transform duration-300 ${openSection === 'tools' ? '-rotate-90' : ''}`} />
                  </button>
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSection === 'tools' ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-2 pb-2 space-y-1">
                      {[
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
      <header
        ref={navRef}
        className={`sticky top-0 z-[100] w-full bg-gradient-to-r from-emerald-50/90 via-teal-50/90 to-emerald-50/90 dark:from-[#020617]/95 dark:via-[#0f172a]/95 dark:to-[#020617]/95 backdrop-blur-md backdrop-saturate-150 border-b border-emerald-100/50 dark:border-emerald-500/20 shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,185,129,0.15)] transition-transform duration-300 ease-out ${navHidden ? '-translate-y-full' : 'translate-y-0'}`}
      >
        {/* Rich Gradient Line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] dark:h-[3px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-80 dark:opacity-100 dark:shadow-[0_0_12px_2px_rgba(16,185,129,0.4)]" />

        {/* Main Container - Flex Row */}
        <div className="max-w-screen-2xl mx-auto px-4 h-12 flex items-center justify-between relative">

          {/* 1. Logo Section (Left) */}
          <div className="flex items-center shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-9 h-9 shrink-0">
                <Image src="/logo.png" alt="شعار دليل العرب" width={36} height={36} priority className="w-full h-full object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all" />
              </div>
              <div className="hidden sm:block">
                <div className="font-extrabold text-lg leading-tight text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  {SITE_CONFIG.name}
                </div>
                <p className="text-[9px] text-slate-500 font-bold">دليلك الأول في تركيا</p>
              </div>
            </Link>
          </div>

          {/* 2. Middle Navigation (Takes available space and centers content) */}
          <nav
            tabIndex={-1}
            className="hidden lg:flex flex-1 justify-center items-center gap-1 mx-4 bg-transparent border-none ring-0 outline-none shadow-none isolate"
            style={{ background: 'transparent', boxShadow: 'none', border: 'none' }}
          >
            {headerMenus.map((item) => {
              const Icon = typeof item.icon === 'string' ? (IconMap[item.icon] || Info) : item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold transition-all duration-300 outline-none focus:ring-0 border-none relative overflow-hidden group/link
                    ${pathname === item.href
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 translate-y-0'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-gradient-to-tr hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/40 dark:hover:to-teal-900/40 hover:text-emerald-800 dark:hover:text-emerald-300 hover:shadow-md hover:shadow-emerald-200/50 dark:hover:shadow-none hover:-translate-y-0.5'
                    }`}
                >
                  <Icon size={16} className={`relative z-10 transition-transform duration-300 ${pathname === item.href ? 'stroke-[2.5px]' : 'group-hover:scale-110 stroke-2'}`} />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              )
            })}

            {/* Dropdowns */}
            <NavDropdown title="الدليل" items={GUIDES_MENU} />
            <NavDropdown
              title="أدوات ذكية"
              items={tools.map(t => {
                const staticTool = TOOLS_MENU.find(tm => tm.href === t.route);
                return {
                  name: t.name,
                  href: t.route,
                  icon: staticTool?.icon || Sparkles
                };
              })}
            />
          </nav>

          {/* 3. Actions Section (Right) */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Search Removed */}

            <NotificationBell />

            <PrayerPopover />

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="lg:hidden p-2.5 min-w-11 min-h-11 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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
