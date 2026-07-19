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
  Menu, X, ChevronDown, ChevronLeft,
  Home, Briefcase, FileText, Info, Building2, Smartphone,
  ShieldAlert, FolderOpen, MapPin, BookOpen, Calculator,
  UserCheck, HeartPulse, Link as LinkIcon, ScrollText, Newspaper,
  Compass, CalendarClock, Wallet, Banknote, Ban, Pill, LogIn, UserRound,
  LayoutGrid, Wrench, type LucideIcon
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import PrayerPopover from './PrayerPopoverLazy';
import NavDropdown from './NavDropdown';
import NavMegaMenu from './NavMegaMenu';
import NotificationBell from './notifications/NotificationBellLazy';
import UrgencyBanner from './UrgencyBanner';
import { useSiteConfig } from '@/lib/hooks/useSiteConfig';
import { useAuth } from '@/lib/hooks/useAuth';
import { isPrivateModelSharePath } from '@/lib/models/routes';

// Helper to map icon names to components.
// "BrainCircuit" stays as a KEY (DB menu rows may still reference the name)
// but renders Compass — the owner wants no AI-looking symbols on the site.
export const IconMap: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  Home, Briefcase, FileText, BrainCircuit: Compass, Info, Building2, Smartphone,
  ShieldAlert, FolderOpen, MapPin, BookOpen, Calculator,
  UserCheck, HeartPulse, Link: LinkIcon, ScrollText
};

// ── Mobile drawer data ────────────────────────────────────────────────
// Sections reuse SECTIONS_MENU (single source of truth with the desktop
// mega-menu). Tools are curated here: the /codes duplicate is dropped
// (it's a section) and the longest label is shortened so nothing
// truncates at 360px-wide phones.
const DRAWER_TOOLS = [
  { name: 'أسعار الصرف والعملات', href: '/tools/currency', icon: Banknote },
  { name: 'حاسبة الإقامة والغياب', href: '/tools/residence-calculator', icon: CalendarClock },
  { name: 'فحص الكملك', href: '/tools/kimlik-check', icon: UserCheck },
  { name: 'حاسبة المنع', href: '/ban-calculator', icon: Calculator },
  { name: 'حاسبة تكاليف الإقامة', href: '/calculator', icon: Wallet },
  { name: 'المناطق المحظورة', href: '/zones', icon: Ban },
  { name: 'الصيدليات المناوبة', href: '/tools/pharmacy', icon: Pill },
];

// The ONE row used for every drawer destination: emerald icon chip on the
// right (RTL first-child), label tight beside it, 48px tall, active =
// filled chip + side bar. Keeps the whole menu on a single visual rhythm.
function DrawerRow({ item, active, dot, onClick }: {
  item: { name: string; href: string; icon: LucideIcon };
  active: boolean;
  dot?: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`relative flex items-center gap-3 h-12 px-4 transition-colors ${active
        ? 'bg-emerald-600/10 dark:bg-emerald-400/10'
        : 'hover:bg-slate-50 dark:hover:bg-white/[0.03] active:bg-slate-100 dark:active:bg-white/[0.05]'
      }`}
    >
      {active && <span aria-hidden="true" className="absolute start-0 inset-y-2 w-[3px] rounded-full bg-emerald-600 dark:bg-emerald-400" />}
      <span className={`relative grid place-items-center shrink-0 w-8 h-8 rounded-lg ${active
        ? 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-emerald-950'
        : 'bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300'
      }`}>
        <Icon size={18} />
        {dot && <span className="absolute -top-0.5 -end-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950" />}
      </span>
      <span className={`flex-1 min-w-0 truncate text-[15px] ${active
        ? 'font-bold text-emerald-800 dark:text-emerald-200'
        : 'font-medium text-slate-700 dark:text-slate-200'
      }`}>{item.name}</span>
    </Link>
  );
}

// Account card at the top of the drawer — the ONLY place gold appears.
function DrawerAccount({ onNavigate }: { onNavigate: () => void }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="mx-3 h-[62px] rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse" />;
  if (user) {
    return (
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="mx-3 flex items-center gap-3 rounded-2xl p-3 bg-emerald-600/[0.07] ring-1 ring-emerald-600/15 dark:bg-emerald-400/10 dark:ring-emerald-400/20"
      >
        <span className="grid place-items-center w-10 h-10 rounded-xl bg-emerald-600 text-white dark:bg-emerald-400 dark:text-emerald-950 shrink-0"><UserRound size={20} /></span>
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-bold text-emerald-900 dark:text-emerald-100">حسابي</span>
          <span className="block text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">لوحة التحكّم والإشعارات</span>
        </span>
        <ChevronLeft size={16} className="shrink-0 text-slate-300 dark:text-slate-600" />
      </Link>
    );
  }
  return (
    <Link
      href="/login"
      onClick={onNavigate}
      className="mx-3 flex items-center gap-3 rounded-2xl p-3 bg-[#d8b96a]/15 ring-1 ring-[#d8b96a]/40 dark:bg-[#d8b96a]/10 dark:ring-[#d8b96a]/30"
    >
      <span className="grid place-items-center w-10 h-10 rounded-xl bg-[#d8b96a] text-white shrink-0"><LogIn size={20} /></span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-bold text-[#6d5518] dark:text-[#e7cd8f]">تسجيل الدخول</span>
        <span className="block text-[12px] text-[#9a8144] dark:text-[#b89a5a] mt-0.5">سجّل لحفظ مفضّلتك ومتابعة طلباتك</span>
      </span>
      <ChevronLeft size={16} className="shrink-0 text-[#c2a878]" />
    </Link>
  );
}


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

  // Measure the navbar's rendered height so the spacer below it (which keeps
  // page content from jumping under the now-fixed header) is always exactly the
  // right size.
  //
  // Default = the REAL no-banner height: the nav row is a constant `h-12`
  // (48px) + the 1px `border-b` = 49px. The old default was 56 (a stale value
  // from when the row was `h-14`), so on EVERY load the ResizeObserver
  // corrected 56 → 49 and the whole page (ticker, hero, and the navbar's gold
  // accent line at its bottom edge) jumped ~7px — the "الخط الذهبي يرمش"
  // flicker. With the default already correct, the no-banner case (the common
  // one) has ZERO correction, so nothing shifts. Measure the BORDER box (via
  // getBoundingClientRect, includes the border) so the spacer clears the whole
  // header; the observer still follows real changes (a banner appearing,
  // breakpoint/theme reflow).
  const [navHeight, setNavHeight] = useState(49);
  useEffect(() => {
    const el = navRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const h = el.getBoundingClientRect().height;
      if (h && h > 0) setNavHeight(Math.round(h));
    };
    measure(); // correct immediately if the SSR default is off (e.g. a banner)
    const ro = new ResizeObserver(measure);
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

  // When the drawer opens, reveal the group that contains the current
  // page: a tools route opens «الأدوات», anything else keeps «كل الأقسام»
  // open (the default) so the active row is never hidden behind a fold.
  useEffect(() => {
    if (!isOpen) return;
    setOpenSection(DRAWER_TOOLS.some((t) => t.href === pathname) ? 'tools' : 'sections');
  }, [isOpen, pathname]);

  // Don't render on Admin pages or private model-share links (after all hooks).
  if (pathname?.startsWith('/admin') || isPrivateModelSharePath(pathname)) return null;

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

            {/* Drawer — slides from the LEFT: the hamburger sits on the
                left side of the RTL header, so the panel opening from the
                same side feels natural (owner request). */}
            <div
              id="mobile-menu"
              role="dialog"
              aria-modal={isOpen || undefined}
              aria-hidden={!isOpen}
              inert={!isOpen}
              aria-label="القائمة الرئيسية"
              className={`fixed top-0 left-0 z-[120] h-full w-[85vw] max-w-md bg-[#faf9f6] dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
              {/* Header — flat and calm: logo + name + close. */}
              <div className="flex-none h-14 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-950">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Image src="/logo.png" alt="شعار دليل العرب" width={30} height={30} className="w-[30px] h-[30px] object-contain shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-[15px] font-extrabold leading-tight text-emerald-900 dark:text-emerald-100 truncate">{SITE_CONFIG.name}</span>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500">دليلك الموثوق في تركيا</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-11 h-11 shrink-0 grid place-items-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="إغلاق القائمة"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto overscroll-contain pb-4 custom-scrollbar">

                {/* حسابك */}
                <div className="px-4 pt-4 pb-1.5 text-[11px] font-bold tracking-wide text-slate-400 dark:text-slate-500">حسابك</div>
                <DrawerAccount onNavigate={() => setIsOpen(false)} />

                {/* الخدمات — its own prominent section (owner request) */}
                <div className="px-4 pt-5 pb-1.5 text-[11px] font-bold tracking-wide text-slate-400 dark:text-slate-500">الخدمات</div>
                <Link
                  href="/services"
                  onClick={() => setIsOpen(false)}
                  className="mx-3 flex items-center gap-3 rounded-2xl p-3.5 bg-gradient-to-l from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-600/25"
                >
                  <span className="grid place-items-center w-10 h-10 rounded-xl bg-white/20 shrink-0"><Briefcase size={20} /></span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-bold">الخدمات والمهن</span>
                    <span className="block text-[11px] text-white/75 mt-0.5">تصفّح مقدّمي الخدمات والحرفيين</span>
                  </span>
                  <ChevronLeft size={18} className="shrink-0 opacity-70" />
                </Link>

                {/* الوصول السريع */}
                <div className="px-4 pt-5 pb-1.5 text-[11px] font-bold tracking-wide text-slate-400 dark:text-slate-500">الوصول السريع</div>
                <div className="mx-3 rounded-2xl bg-white dark:bg-slate-900/40 ring-1 ring-black/[0.04] dark:ring-white/[0.06] divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
                  <DrawerRow item={{ name: 'الرئيسية', href: '/', icon: Home }} active={pathname === '/'} onClick={() => setIsOpen(false)} />
                  <DrawerRow item={{ name: 'الأخبار', href: '/updates', icon: Newspaper }} active={!!pathname?.startsWith('/updates')} dot={hasNewUpdates} onClick={() => setIsOpen(false)} />
                  <DrawerRow item={{ name: 'دليل المواقف', href: '/consultant', icon: Compass }} active={pathname === '/consultant'} onClick={() => setIsOpen(false)} />
                </div>

                {/* ── كل الأقسام — bold accordion header + full sections list ── */}
                <div className="mx-3 mt-4 rounded-2xl bg-white dark:bg-slate-900/40 ring-1 ring-black/[0.04] dark:ring-white/[0.06] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenSection(openSection === 'sections' ? null : 'sections')}
                    aria-expanded={openSection === 'sections'}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <span className="grid place-items-center w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300 shrink-0"><LayoutGrid size={18} /></span>
                    <span className="flex-1 text-start text-[15px] font-bold text-slate-800 dark:text-slate-100">كل الأقسام</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">12</span>
                    <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform duration-200 ${openSection === 'sections' ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${openSection === 'sections' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                      <div className="border-t border-slate-100 dark:border-slate-800/60 divide-y divide-slate-100 dark:divide-slate-800/60">
                        {SECTIONS_MENU.map((item) => (
                          <DrawerRow key={item.href} item={item} active={pathname === item.href} onClick={() => setIsOpen(false)} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── الأدوات — bold accordion header + tools list ── */}
                <div className="mx-3 mt-3 rounded-2xl bg-white dark:bg-slate-900/40 ring-1 ring-black/[0.04] dark:ring-white/[0.06] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenSection(openSection === 'tools' ? null : 'tools')}
                    aria-expanded={openSection === 'tools'}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <span className="grid place-items-center w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300 shrink-0"><Wrench size={18} /></span>
                    <span className="flex-1 text-start text-[15px] font-bold text-slate-800 dark:text-slate-100">الأدوات</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">7</span>
                    <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform duration-200 ${openSection === 'tools' ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${openSection === 'tools' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                      <div className="border-t border-slate-100 dark:border-slate-800/60 divide-y divide-slate-100 dark:divide-slate-800/60">
                        {DRAWER_TOOLS.map((item) => (
                          <DrawerRow key={item.href} item={item} active={pathname === item.href} onClick={() => setIsOpen(false)} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer — slogan + labeled theme toggle, safe-area aware */}
              <div className="flex-none border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-950 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
                <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 mb-2.5">{SITE_CONFIG.slogan}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">المظهر</span>
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
                  icon: staticTool?.icon || Wrench
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
