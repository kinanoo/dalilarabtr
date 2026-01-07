'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GUIDES_MENU, SITE_CONFIG, LATEST_UPDATES_VERSION, UPDATES_STORAGE_KEY } from '@/lib/data';
import { fetchRemoteUpdatesVersion } from '@/lib/remoteData';
import { Menu, X, BrainCircuit, Search, Bell, Sparkles, ChevronDown, Home, Briefcase, FileText, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import TopBar from './TopBar';
import NavDropdown from './NavDropdown';
import { supabase } from '@/lib/supabaseClient';
import NotificationBell from './notifications/NotificationBell';

// Helper to map icon names to components
export const IconMap: any = { Home, Briefcase, FileText, BrainCircuit, Info };

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [currentUpdatesVersion, setCurrentUpdatesVersion] = useState(LATEST_UPDATES_VERSION);
  const [headerMenus, setHeaderMenus] = useState<any[]>([]); // Dynamic Menus
  const [tools, setTools] = useState<any[]>([]); // Dynamic Tools
  const navRef = useRef<HTMLElement>(null);
  const portalTarget = typeof document !== 'undefined' ? document.body : null;

  // Don't render on Admin pages
  if (pathname?.startsWith('/admin')) return null;

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
      if (menus) setHeaderMenus(menus);

      // Tools
      const { data: dbTools } = await supabase
        .from('tools_registry')
        .select('*')
        .eq('is_active', true);
      if (dbTools) setTools(dbTools);
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
              className="fixed inset-0 z-[1150] lg:hidden bg-black/20 dark:bg-black/60 backdrop-blur-md"
            />

            {/* Drawer - Smooth Slide from Right */}
            <motion.div
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
              className="fixed top-0 right-0 z-[1200] h-full w-[85vw] max-w-md bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col"
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

              {/* Items - with Stagger */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <nav className="space-y-1">
                  {headerMenus.map((item, index) => {
                    const Icon = IconMap[item.icon] || Info;
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{
                          x: 0,
                          opacity: 1,
                          transition: {
                            delay: 0.15 + (index * 0.06),
                            duration: 0.25,
                            ease: 'easeOut'
                          }
                        }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === item.href
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 font-bold'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                            }`}
                        >
                          <Icon size={20} />
                          {item.label}
                        </Link>
                      </motion.div>
                    )
                  })}
                  <hr className="my-2 border-slate-100 dark:border-slate-800" />
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{
                      x: 0,
                      opacity: 1,
                      transition: {
                        delay: 0.15 + (headerMenus.length * 0.06),
                        duration: 0.25,
                        ease: 'easeOut'
                      }
                    }}
                    className="px-4 py-2"
                  >
                    <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">الأدوات</p>
                    {tools.map((item) => (
                      <Link
                        key={item.route}
                        href={item.route}
                        onClick={() => setIsOpen(false)}
                        className="block py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </motion.div>

                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{
                      x: 0,
                      opacity: 1,
                      transition: {
                        delay: 0.15 + ((headerMenus.length + 1) * 0.06),
                        duration: 0.25,
                        ease: 'easeOut'
                      }
                    }}
                    className="px-4 py-2"
                  >
                    <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">أدلة شاملة</p>
                    {GUIDES_MENU.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="block py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </motion.div>
                </nav>
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
    <div className="sticky top-0 z-[1000] w-full transition-transform duration-300 shadow-sm shadow-slate-200/50 dark:shadow-slate-900/50">
      <TopBar />
      <header
        ref={navRef}
        className="w-full bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800"
      >
        <div className="max-w-screen-2xl mx-auto px-4 h-12 flex items-center justify-between">

          {/* Logo & Desktop Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-12 h-12 shrink-0">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg leading-tight text-slate-800 dark:text-white">
                  {SITE_CONFIG.name}
                </h1>
                <p className="text-[10px] text-slate-500 font-medium">دليلك الأول في تركيا</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {headerMenus.map((item) => {
                const Icon = IconMap[item.icon] || Info;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${pathname === item.href
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                )
              })}

              {/* Dropdowns */}
              <NavDropdown title="أدلة وخدمات" items={GUIDES_MENU} icon={<Sparkles size={16} />} />
              <NavDropdown
                title="أدوات ذكية"
                items={tools.map(t => ({ name: t.name, href: t.route, icon: Sparkles }))} // Adapter 
                icon={<Sparkles size={16} />}
              />

            </nav>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">

            {/* Search Removed as requested */}

            <Link href="/updates" className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-300">
              <Bell size={20} />
              {hasNewUpdates && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse ring-2 ring-white dark:ring-slate-950" />}
            </Link>

            <div className="hidden md:block">
              <ThemeToggle />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              onClick={() => setIsOpen(true)}
              aria-label="القائمة"
            >
              <Menu size={24} />
            </button>
          </div>

        </div>
      </header>
      {mobileDrawer}
    </div>
  );
}
