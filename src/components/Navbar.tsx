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
  Menu, X, BrainCircuit, Search, Bell, Sparkles, ChevronDown,
  Home, Briefcase, FileText, Info, Building2, Smartphone,
  ShieldAlert, FolderOpen, MapPin, BookOpen, Calculator,
  UserCheck, HeartPulse, Link as LinkIcon, ScrollText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import TopBar from './TopBar';
import NavDropdown from './NavDropdown';
import { createBrowserClient } from '@supabase/ssr';
import { supabase } from '@/lib/supabaseClient';
import NotificationBell from './notifications/NotificationBell';

// Helper to map icon names to components
export const IconMap: any = {
  Home, Briefcase, FileText, BrainCircuit, Info, Building2, Smartphone,
  ShieldAlert, FolderOpen, MapPin, BookOpen, Calculator,
  UserCheck, HeartPulse, Link: LinkIcon, ScrollText
};


function AuthButton({ mobile = false }: { mobile?: boolean }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Check initial user from cookies (same storage as login/dashboard)
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />;

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
  const portalTarget = typeof document !== 'undefined' ? document.body : null;

  // Hide navbar on scroll down, show on scroll up
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 200) {
        setNavHidden(true);
      } else if (currentY < lastScrollY.current) {
        setNavHidden(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch Dynamic Menus & Tools
  useEffect(() => {
    async function fetchData() {
      if (!supabase) return;

      // Menus
      const { data: menus } = await supabase
        .from('site_menus')
        .select('*')
        .eq('location', 'header')
        .eq('is_active', true)
        .order('sort_order');

      // Only override if DB has content
      if (menus && menus.length > 0) {
        // Filter out Smart Consultant as requested
        // const filteredMenus = menus.filter((m: any) => m.label !== 'المستشار الذكي' && m.href !== '/consultant');
        // setHeaderMenus(filteredMenus); // CAUTION: Disabled to keep TopBar clean (User Request)
      }

      // Tools
      const { data: dbTools } = await supabase
        .from('tools_registry')
        .select('*')
        .eq('is_active', true);

      if (dbTools && dbTools.length > 0) {
        // Deduplicate by route AND remove '/forms' and '/directory' (as they are in Services)
        const uniqueTools = Array.from(new Map(dbTools.map((item: any) => [item.route, item])).values())
          .filter((t: any) => t.route !== '/forms' && t.route !== '/directory' && t.route !== '/consultant');
        setTools(uniqueTools);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchRemoteUpdatesVersion()
      .then((v) => {
        if (!mounted) return;
        if (v) setCurrentUpdatesVersion(v);
      })
      .catch(() => {
        // ignore
      });

    try {
      const lastSeen = localStorage.getItem(UPDATES_STORAGE_KEY) || '';
      setHasNewUpdates(lastSeen !== currentUpdatesVersion);
    } catch {
      // ignore
    }
    return () => {
      mounted = false;
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
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.button
              type="button"
              aria-label="إغلاق القائمة"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { duration: 0.3 }
              }}
              exit={{
                opacity: 0,
                transition: { duration: 0.25 }
              }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[110] lg:hidden bg-black/20 dark:bg-black/60 backdrop-blur-md"
            />

            {/* Drawer - Smooth Slide from Right */}
            <motion.div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="القائمة الرئيسية"
              initial={{ x: '100%' }}
              animate={{
                x: 0,
                transition: {
                  type: 'spring',
                  stiffness: 200,
                  damping: 25,
                  mass: 0.8
                }
              }}
              exit={{
                x: '100%',
                transition: {
                  type: 'spring',
                  stiffness: 300,
                  damping: 30
                }
              }}
              className="fixed top-0 right-0 z-[120] h-full w-[85vw] max-w-md bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 dark:from-emerald-950/30 dark:via-cyan-950/30 dark:to-blue-950/30">
                <span className="font-bold text-lg text-slate-800 dark:text-slate-100">القائمة</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 bg-white dark:bg-slate-900 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Items - with Stagger & Neon Effects */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

                {/* 0. Mobile Auth Button */}
                <div className="mb-4" onClick={() => setIsOpen(false)}>
                  <AuthButton mobile={true} />
                </div>

                {/* 1. Main Navigation */}
                <nav className="space-y-2">
                  {headerMenus.map((item, index) => {
                    const Icon = typeof item.icon === 'string' ? (IconMap[item.icon] || Info) : item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{
                          x: 0,
                          opacity: 1,
                          transition: { delay: 0.1 + (index * 0.05) }
                        }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`
                            group relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 overflow-hidden
                            ${isActive
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold shadow-md'
                              : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }
                            hover:shadow-[0_4px_12px_-2px_rgba(16,185,129,0.15)]
                          `}
                        >
                          {/* Neon Glow Line (Bottom) - RTL */}
                          <span className="absolute bottom-0 right-0 h-[2px] w-0 bg-gradient-to-l from-emerald-400 to-emerald-600 shadow-[0_0_8px_rgba(52,211,153,0.8)] transition-all duration-300 ease-out group-hover:w-full" />

                          <span className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-white dark:bg-emerald-950 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-emerald-500'}`}>
                            <Icon size={20} />
                          </span>
                          <span className="text-base">{item.label}</span>
                        </Link>
                      </motion.div>
                    )
                  })}
                </nav>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* 2. Tools Section */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1, transition: { delay: 0.3 } }}
                  className="space-y-2"
                >
                  <p className="px-2 text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <BrainCircuit size={14} /> الأدوات الذكية
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {tools.map((item, idx) => {
                      // Try to find icon from static tools if missing
                      const staticTool = TOOLS_MENU.find(t => t.href === item.route);
                      const Icon = staticTool ? staticTool.icon : Calculator;
                      const isActive = pathname === item.route;

                      return (
                        <Link
                          key={item.route}
                          href={item.route}
                          onClick={() => setIsOpen(false)}
                          className={`
                            group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 overflow-hidden
                            ${isActive ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}
                          `}
                        >
                          {/* Neon Glow Line (Bottom) - RTL */}
                          <span className="absolute bottom-0 right-0 h-[2px] w-0 bg-gradient-to-l from-emerald-400 to-emerald-600 shadow-[0_0_8px_rgba(52,211,153,0.8)] transition-all duration-300 ease-out group-hover:w-full" />

                          <Icon size={18} className={`transition-colors ${isActive ? 'text-emerald-500' : 'text-slate-400 group-hover:text-emerald-500'}`} />
                          <span className="font-medium text-sm">{item.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </motion.div>

                {/* 3. Guides Section */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1, transition: { delay: 0.4 } }}
                  className="space-y-2"
                >
                  <p className="px-2 text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <FolderOpen size={14} /> أدلة شاملة
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {GUIDES_MENU.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`
                            group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 overflow-hidden
                            ${isActive ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}
                          `}
                        >
                          {/* Neon Glow Line (Bottom) - RTL */}
                          <span className="absolute bottom-0 right-0 h-[2px] w-0 bg-gradient-to-l from-emerald-400 to-emerald-600 shadow-[0_0_8px_rgba(52,211,153,0.8)] transition-all duration-300 ease-out group-hover:w-full" />

                          <item.icon size={18} className={`transition-colors ${isActive ? 'text-emerald-500' : 'text-slate-400 group-hover:text-emerald-500'}`} />
                          <span className="font-medium text-sm">{item.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </motion.div>
              </div>

              {/* Footer */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{
                  x: 0,
                  opacity: 1,
                  transition: {
                    delay: 0.4,
                    duration: 0.3,
                    ease: 'easeOut'
                  }
                }}
                className="p-4 border-t border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950"
              >
                <p className="text-xs text-center text-slate-500 mb-4">{SITE_CONFIG.slogan}</p>
                <div className="flex justify-center">
                  <ThemeToggle />
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      portalTarget
    )
    : null;

  return (
    <>
      <TopBar />
      <header
        ref={navRef}
        className={`sticky top-0 z-[100] w-full bg-gradient-to-r from-emerald-50/90 via-teal-50/90 to-emerald-50/90 dark:bg-gradient-to-r dark:from-[#020617]/90 dark:via-[#0f172a]/90 dark:to-[#020617]/90 backdrop-blur-md backdrop-saturate-150 border-b border-emerald-100/50 dark:border-emerald-900/30 shadow-sm transition-transform duration-300 ${navHidden ? '-translate-y-full' : 'translate-y-0'}`}
      >
        {/* Rich Gradient Line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-600 to-transparent opacity-80" />

        {/* Main Container - Flex Row */}
        <div className="max-w-screen-2xl mx-auto px-4 h-12 flex items-center justify-between relative">

          {/* 1. Logo Section (Left) */}
          <div className="flex items-center shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-9 h-9 shrink-0">
                <Image src="/logo.png" alt="شعار دليل العرب" width={36} height={36} className="w-full h-full object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all" />
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
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold transition-all duration-300 outline-none focus:ring-0 border-none relative overflow-hidden group/link
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
            <NavDropdown title="دليل الأجنبي" items={GUIDES_MENU} />
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

            <Link href="/updates" aria-label="الإشعارات والتحديثات" className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-700 dark:text-slate-300 hover:text-emerald-700">
              <Bell size={18} />
              {hasNewUpdates && <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full animate-pulse ring-2 ring-white dark:ring-slate-950" />}
            </Link>

            <div className="hidden md:block scale-90">
              <ThemeToggle />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="lg:hidden p-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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
