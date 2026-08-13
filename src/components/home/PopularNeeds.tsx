'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  type LucideIcon,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Building2,
  Calculator,
  CalendarClock,
  Coins,
  FileText,
  FolderOpen,
  HeartPulse,
  Landmark,
  Link2,
  MapPinned,
  Pill,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserRoundSearch,
  Wallet,
  WalletCards,
  X,
} from 'lucide-react';

type ToolLink = {
  title: string;
  href: string;
  note: string;
  icon: LucideIcon;
};

type ToolGroup = {
  id: string;
  title: string;
  note: string;
  icon: LucideIcon;
  tone: string;
  iconTone: string;
  accent: string;
  tools: ToolLink[];
};

const DIRECT_TOOLS = [
  {
    title: 'المناطق وتثبيت النفوس',
    note: 'المفتوحة والمحظورة حسب الولاية',
    href: '/zones',
    icon: MapPinned,
    tone: 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-900/60 dark:bg-slate-950/25 dark:text-slate-200',
  },
  {
    title: 'فحص قيد الكملك',
    note: 'تحقق من الرقم واقرأ النتيجة',
    href: '/tools/kimlik-check',
    icon: BadgeCheck,
    tone: 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-900/60 dark:bg-slate-950/25 dark:text-slate-200',
  },
  {
    title: 'صيدلية مناوبة الآن',
    note: 'اعثر على الأقرب إليك',
    href: '/tools/pharmacy',
    icon: Pill,
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-200',
  },
];

const TOOL_GROUPS: ToolGroup[] = [
  {
    id: 'identity',
    title: 'الهوية والحماية',
    note: 'الكملك، الأكواد والمنع',
    icon: ShieldCheck,
    tone: 'border-slate-200 hover:border-emerald-400 dark:border-slate-900/70 dark:hover:border-emerald-700',
    iconTone: 'bg-slate-100 text-slate-700 dark:bg-slate-950/60 dark:text-slate-300',
    accent: 'bg-slate-500',
    tools: [
      { title: 'فحص قيد الكملك', href: '/tools/kimlik-check', note: 'تحقق من الرقم واقرأ حالة القيد', icon: BadgeCheck },
      { title: 'دليل الأكواد الأمنية', href: '/codes', note: 'معاني الأكواد وطرق الاعتراض', icon: ShieldAlert },
      { title: 'المناطق المحظورة', href: '/zones', note: 'ابحث حسب الولاية والحي', icon: MapPinned },
      { title: 'حاسبة مدة منع الدخول', href: '/ban-calculator', note: 'احسب المدة وتاريخ انتهائها', icon: Calculator },
      { title: 'دليل المواقف', href: '/consultant', note: 'شخّص حالتك واعرف خطوتك التالية', icon: SearchCheck },
    ],
  },
  {
    id: 'money',
    title: 'المال والعمل',
    note: 'راتب، تعويض وصرف',
    icon: WalletCards,
    tone: 'border-amber-200 hover:border-amber-400 dark:border-amber-900/70 dark:hover:border-amber-700',
    iconTone: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    accent: 'bg-amber-500',
    tools: [
      { title: 'أسعار الصرف والعملات', href: '/tools/currency', note: 'الليرة والعملات والذهب مع محوّل', icon: Banknote },
      { title: 'حاسبة الراتب الصافي', href: '/tools/salary-calculator', note: 'حوّل بين الإجمالي والصافي', icon: Wallet },
      { title: 'تعويض نهاية الخدمة', href: '/tools/severance-calculator', note: 'احسب التعويض حسب الراتب والمدة', icon: Coins },
      { title: 'زيادة الإيجار القانونية', href: '/tools/rent-increase-calculator', note: 'اعرف الحد الأعلى للزيادة', icon: Building2 },
    ],
  },
  {
    id: 'transactions',
    title: 'الإقامة والمعاملات',
    note: 'مدة، تكلفة وروابط رسمية',
    icon: CalendarClock,
    tone: 'border-slate-200 hover:border-emerald-400 dark:border-slate-900/70 dark:hover:border-emerald-700',
    iconTone: 'bg-slate-100 text-slate-700 dark:bg-slate-950/60 dark:text-slate-300',
    accent: 'bg-slate-500',
    tools: [
      { title: 'حاسبة أيام الإقامة', href: '/tools/residence-calculator', note: 'احسب أيام الإقامة والغياب', icon: CalendarClock },
      { title: 'حاسبة تكاليف الإقامة', href: '/calculator', note: 'قدّر التكاليف حسب نوع الإقامة', icon: Calculator },
      { title: 'خدمات الحكومة الإلكترونية', href: '/e-devlet-services', note: 'ابحث عن الخدمة المطلوبة', icon: Smartphone },
      { title: 'الروابط الحكومية الرسمية', href: '/important-links', note: 'بوابات موثوقة في مكان واحد', icon: Link2 },
      { title: 'النماذج الجاهزة', href: '/forms', note: 'نماذج ووثائق قابلة للتنزيل', icon: FileText },
    ],
  },
  {
    id: 'nearby',
    title: 'خدمات وأماكن',
    note: 'صيدلية، قنصلية ومختص',
    icon: MapPinned,
    tone: 'border-emerald-200 hover:border-emerald-400 dark:border-emerald-900/70 dark:hover:border-emerald-700',
    iconTone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    accent: 'bg-emerald-500',
    tools: [
      { title: 'الصيدليات المناوبة', href: '/tools/pharmacy', note: 'اعثر على المفتوح الآن حسب المدينة', icon: HeartPulse },
      { title: 'أين يقع؟', href: '/places', note: 'قنصليات ودوائر على الخريطة', icon: MapPinned },
      { title: 'دليل القنصليات', href: '/consulates', note: 'العناوين وطرق التواصل', icon: Landmark },
      { title: 'مقدمو الخدمات', href: '/services', note: 'ابحث حسب المهنة والمدينة', icon: UserRoundSearch },
      { title: 'الدليل الشامل', href: '/directory', note: 'قوائم الخدمات والمواقع المهمة', icon: FolderOpen },
    ],
  },
];

export default function PopularNeeds() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const activeGroup = TOOL_GROUPS.find((group) => group.id === activeId) ?? null;

  useEffect(() => {
    if (!activeGroup) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveId(null);
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [activeGroup]);

  const dialog = activeGroup && typeof document !== 'undefined'
    ? createPortal(
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 backdrop-blur-[2px] animate-fadeIn sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveId(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="tool-group-title"
            className="relative max-h-[88dvh] w-full overflow-hidden rounded-t-3xl border border-white/70 bg-white shadow-2xl animate-slideInUp dark:border-slate-700 dark:bg-slate-900 sm:max-w-3xl sm:rounded-2xl"
            dir="rtl"
          >
            <div className={`h-1.5 w-full ${activeGroup.accent}`} aria-hidden="true" />
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-slate-200 sm:hidden dark:bg-slate-700" aria-hidden="true" />

            <header className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-6">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${activeGroup.iconTone}`}>
                <activeGroup.icon size={24} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 id="tool-group-title" className="text-xl font-black text-slate-950 dark:text-white sm:text-2xl">
                  {activeGroup.title}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{activeGroup.note}</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setActiveId(null)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                aria-label="إغلاق النافذة"
              >
                <X size={21} aria-hidden="true" />
              </button>
            </header>

            <div className="max-h-[calc(88dvh-98px)] overflow-y-auto overscroll-contain p-3 sm:p-5">
              <div className="grid gap-2.5 sm:grid-cols-2">
                {activeGroup.tools.map((tool, index) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    prefetch={false}
                    onClick={() => setActiveId(null)}
                    className={`group relative flex min-h-[76px] items-center gap-3 overflow-hidden rounded-xl border p-3.5 text-start transition duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-lg active:translate-y-0 active:scale-[0.99] dark:hover:border-slate-600 ${index === 0 ? 'border-slate-800 bg-slate-900 text-white dark:border-emerald-500 dark:bg-emerald-950/60' : 'border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white'}`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${index === 0 ? 'bg-white/10 text-white' : activeGroup.iconTone}`}>
                      <tool.icon size={20} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-sm font-black sm:text-[15px]">{tool.title}</strong>
                      <span className={`mt-1 block text-[11px] leading-relaxed ${index === 0 ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                        {tool.note}
                      </span>
                    </span>
                    <ArrowLeft size={17} className="shrink-0 opacity-45 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>,
        document.body,
      )
    : null;

  return (
    <section aria-labelledby="popular-needs-title">
      <div className="mb-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-400">
          <Sparkles size={17} aria-hidden="true" />
          مركز الأدوات اليومية
        </div>
        <h2 id="popular-needs-title" className="text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
          ماذا تحتاج الآن؟
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
          افتح أكثر الأدوات طلباً مباشرة، أو اختر المجموعة التي تناسب حاجتك.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        {DIRECT_TOOLS.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={`${item.tone} group ${index === 0 ? 'col-span-2 lg:col-span-1' : ''} flex min-h-24 items-center gap-3 rounded-lg border p-3.5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:scale-[0.99]`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-sm dark:bg-slate-900/65">
              <item.icon size={22} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-sm font-black sm:text-base">{item.title}</strong>
              <span className="mt-1 block text-[11px] leading-relaxed opacity-75 sm:text-xs">{item.note}</span>
            </span>
            <ArrowLeft size={17} className="shrink-0 opacity-45 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
          </Link>
        ))}
      </div>

      <div className="mb-3 mt-6 flex items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white sm:text-lg">أدواتك مرتبة حسب الحاجة</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">اختر مجموعة للوصول إلى أدواتها وقوائمها.</p>
        </div>
        <span className="hidden items-center gap-1.5 text-xs font-bold text-emerald-700 sm:flex dark:text-emerald-400">
          <Sparkles size={14} aria-hidden="true" />
          وصول سريع
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {TOOL_GROUPS.map((group) => (
          <button
            key={group.id}
            type="button"
            aria-haspopup="dialog"
            onClick={() => setActiveId(group.id)}
            className={`group relative isolate flex min-h-[92px] items-center gap-2.5 overflow-hidden rounded-xl border bg-white p-3 text-start shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:scale-[0.99] dark:bg-slate-900 ${group.tone}`}
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition duration-200 group-hover:scale-110 group-hover:-rotate-3 ${group.iconTone}`}>
              <group.icon size={22} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-[13px] font-black text-slate-900 dark:text-white sm:text-sm">{group.title}</strong>
              <span className="mt-1 block text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-[11px]">{group.note}</span>
            </span>
            <ArrowLeft size={16} className="shrink-0 text-slate-400 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            <span className={`absolute inset-x-3 bottom-0 h-1 origin-right scale-x-0 rounded-full transition-transform duration-300 group-hover:scale-x-100 ${group.accent}`} aria-hidden="true" />
          </button>
        ))}
      </div>

      {dialog}
    </section>
  );
}
