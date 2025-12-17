'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TOP_NAVIGATION, SITE_CONFIG, LATEST_UPDATES_VERSION, UPDATES_STORAGE_KEY } from '@/lib/data';
import { fetchRemoteUpdatesVersion } from '@/lib/remoteData';
import { Menu, X, BrainCircuit, Search, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [currentUpdatesVersion, setCurrentUpdatesVersion] = useState(LATEST_UPDATES_VERSION);
  const navRef = useRef<HTMLElement>(null);
  const navLinks = TOP_NAVIGATION;
  const portalTarget = typeof document !== 'undefined' ? document.body : null;

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
              {/* خلفية قابلة للنقر لإغلاق القائمة */}
              <motion.button
                type="button"
                aria-label="إغلاق القائمة"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 z-[1005] lg:hidden bg-black/10 dark:bg-black/40"
              />

              <motion.div
                initial={{ x: 32, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 32, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="fixed top-2 start-2 z-[1010] lg:hidden w-[22rem] max-w-[85vw] max-h-[75vh] overflow-hidden rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl"
              >
                <div className="flex flex-col">
                  <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-base leading-none shadow-md">
                        د
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{SITE_CONFIG.name}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="p-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition"
                      aria-label="إغلاق"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="p-3 flex flex-col gap-1 overflow-y-auto max-h-[calc(75vh-3.25rem)]">
                    {navLinks.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                            isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent'
                          }`}
                        >
                          <div
                            className={`p-1.5 rounded-lg ${
                              isActive ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-slate-100 dark:bg-slate-900'
                            }`}
                          >
                            <item.icon size={18} />
                          </div>
                          <span className="flex items-center gap-2">
                            {item.name}
                          </span>
                        </Link>
                      );
                    })}

                    {/* زر التحديثات: يظهر في قائمة الموبايل فقط */}
                    <Link
                      href="/updates"
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all border ${
                        pathname?.startsWith('/updates')
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 border-transparent'
                      }`}
                      aria-label="اذهب إلى صفحة التحديثات"
                    >
                      <div
                        className={`p-1.5 rounded-lg ${
                          pathname?.startsWith('/updates')
                            ? 'bg-emerald-100 dark:bg-emerald-900/50'
                            : 'bg-slate-100 dark:bg-slate-900'
                        }`}
                      >
                        <Bell size={18} />
                      </div>
                      <span className="flex items-center gap-2">
                        تحديثات 2026
                        {hasNewUpdates && !pathname?.startsWith('/updates') && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500/50 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                        )}
                      </span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        portalTarget
      )
    : null;

  return (
    <>
      <nav
        ref={navRef}
        className={`sticky top-0 w-full bg-slate-200/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-300/60 dark:border-slate-700 shadow-md dark:shadow-lg font-cairo transition-colors ${
          isOpen ? 'z-[1000]' : 'z-40'
        }`}
      >
      <div className="max-w-screen-2xl mx-auto px-4 py-1 min-h-9 flex items-center justify-between gap-1.5">
        
        {/* الشعار */}
        <Link href="/" className="flex items-center gap-2 shrink-0" onClick={() => setIsOpen(false)}>
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-base leading-none shadow-md">
            د
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-100 text-base tracking-tight hidden xs:block">
            {SITE_CONFIG.name}
          </span>
        </Link>

        {/* روابط الكمبيوتر */}
        <div className="hidden lg:flex items-center justify-center gap-0.5 flex-1 min-w-0 overflow-x-hidden">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* أزرار إضافية */}
        <div className="flex items-center gap-2 shrink-0">
           {/* زر بحث للموبايل */}
           <Link href="/directory" className="lg:hidden p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition z-10 relative">
             <Search size={18} />
           </Link>

           {/* زر تبديل الوضع المظلم */}
           <ThemeToggle />

           <Link
             href="/consultant"
             aria-label="المستشار الذكي"
             className="hidden lg:flex items-center justify-center bg-primary-700 dark:bg-primary-800 text-white p-2 rounded-full text-sm font-bold hover:bg-primary-600 dark:hover:bg-primary-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 z-[70] relative"
           >
             <BrainCircuit size={16} />
             <span className="sr-only">المستشار الذكي</span>
           </Link>

           {/* زر القائمة للموبايل */}
           <button 
             onClick={() => setIsOpen(!isOpen)} 
             className="lg:hidden p-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition z-[70] relative"
             aria-label="القائمة"
           >
             {isOpen ? <X size={22} /> : <Menu size={22} />}
           </button>
        </div>
      </div>

      </nav>

      {mobileDrawer}
    </>
  );
}