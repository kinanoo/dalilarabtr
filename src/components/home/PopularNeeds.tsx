'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  type LucideIcon,
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  GraduationCap,
  Landmark,
  MapPinned,
  Pill,
  ShieldAlert,
  Stethoscope,
  UsersRound,
} from 'lucide-react';

type NeedLink = { title: string; href: string; note: string };
type NeedHub = {
  id: string;
  title: string;
  note: string;
  icon: LucideIcon;
  tone: string;
  links: NeedLink[];
};

const DIRECT_NEEDS = [
  {
    title: 'المناطق وتثبيت النفوس',
    note: 'اعرف المناطق المفتوحة والمحظورة حسب الولاية',
    href: '/zones',
    icon: MapPinned,
    tone: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-200',
  },
  {
    title: 'التحقق من قيد الكملك',
    note: 'افحص حالة القيد وما تعنيه النتيجة',
    href: '/tools/kimlik-check',
    icon: BadgeCheck,
    tone: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/25 dark:text-sky-200',
  },
  {
    title: 'أقرب صيدلية مناوبة',
    note: 'اعثر على الصيدلية المفتوحة الآن',
    href: '/tools/pharmacy',
    icon: Pill,
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-200',
  },
];

const NEED_HUBS: NeedHub[] = [
  {
    id: 'consulate',
    title: 'القنصلية والجواز',
    note: 'مواعيد ووثائق',
    icon: Landmark,
    tone: 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30',
    links: [
      { title: 'دليل السفارات والقنصليات', href: '/consulates', note: 'العناوين والخرائط وطرق التواصل' },
      { title: 'استخراج وتجديد جواز السفر السوري', href: '/article/syrian-passport-renewal', note: 'الأوراق والخطوات العملية' },
      { title: 'حجز موعد القنصلية السورية', href: '/article/syrian-consulate-appointment', note: 'شرح الحجز والاستعداد للموعد' },
    ],
  },
  {
    id: 'residence',
    title: 'الإقامة والفيزا',
    note: 'تقديم وتجديد',
    icon: Building2,
    tone: 'text-cyan-700 bg-cyan-100 dark:text-cyan-300 dark:bg-cyan-900/30',
    links: [
      { title: 'كل موضوعات الإقامة', href: '/category/residence', note: 'الأنواع والشروط والإجراءات' },
      { title: 'تجديد الإقامة السياحية 2026', href: '/article/tourist-residence-renewal-turkey-2026', note: 'دليل عملي خطوة بخطوة' },
      { title: 'الاستعلام عن معلومات إقامتك', href: '/e-devlet-services#ikamet-kisisel-bilgi', note: 'الوصول إلى الخدمة وقراءة النتيجة' },
    ],
  },
  {
    id: 'work',
    title: 'العمل وحقوق العامل',
    note: 'إذن وراتب وتأمين',
    icon: BriefcaseBusiness,
    tone: 'text-indigo-700 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/30',
    links: [
      { title: 'إذن العمل في تركيا 2026', href: '/article/work-permit-turkey-2026', note: 'الأنواع والشروط والأوراق' },
      { title: 'حقوق العامل في تركيا 2026', href: '/article/worker-rights-turkey-2026', note: 'الأجر والتأمين والإجازات والحماية' },
      { title: 'حاسبة الراتب الصافي', href: '/tools/salary-calculator', note: 'حوّل الراتب بين الإجمالي والصافي' },
    ],
  },
  {
    id: 'legal',
    title: 'الأكواد والحقوق',
    note: 'تقييد وترحيل',
    icon: ShieldAlert,
    tone: 'text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-900/30',
    links: [
      { title: 'دليل الأكواد الأمنية', href: '/codes', note: 'معنى كل كود وطريق الاعتراض' },
      { title: 'مراكز الترحيل وحقوقك القانونية', href: '/article/detention-center-rights', note: 'ما الذي تفعله عند الاحتجاز' },
      { title: 'إبطال الكملك وكود V-160', href: '/article/identity-kimlik-iptal-v160', note: 'الأسباب الشائعة وطريقة التعامل' },
    ],
  },
  {
    id: 'education',
    title: 'المدرسة والمعادلة',
    note: 'تسجيل ودراسة',
    icon: GraduationCap,
    tone: 'text-violet-700 bg-violet-100 dark:text-violet-300 dark:bg-violet-900/30',
    links: [
      { title: 'دليل التعليم في تركيا', href: '/education', note: 'المدارس والجامعات والمعادلات' },
      { title: 'تسجيل الأطفال في المدرسة بالكملك', href: '/article/school-registration-turkey', note: 'الخطوات وأسباب الرفض الشائعة' },
      { title: 'معادلة شهادة الثانوية', href: '/article/high-school-equivalency-turkey-2026', note: 'الأوراق وطريقة تقديم الطلب' },
    ],
  },
  {
    id: 'services',
    title: 'مقدم خدمة قريب',
    note: 'طبيب ومحامٍ ومترجم',
    icon: UsersRound,
    tone: 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30',
    links: [
      { title: 'كل مقدمي الخدمات', href: '/services', note: 'ابحث بحسب المهنة والمدينة' },
      { title: 'أطباء وعيادات', href: '/services/category/doctors', note: 'اعثر على طبيب وتواصل مباشرة' },
      { title: 'محامون ومستشارون قانونيون', href: '/services/category/lawyers', note: 'اختر المدينة وقارن النتائج' },
    ],
  },
];

export default function PopularNeeds() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeHub = NEED_HUBS.find((hub) => hub.id === activeId);

  return (
    <section aria-labelledby="popular-needs-title">
      <div className="mb-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-400">
          <Stethoscope size={17} aria-hidden="true" />
          ابدأ من حاجتك
        </div>
        <h2 id="popular-needs-title" className="text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">ماذا تحتاج الآن؟</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
          أكثر ما يبحث عنه زوار الدليل، ثم بقية المعاملات والخدمات مرتبة في مكان واحد.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        {DIRECT_NEEDS.map((item, index) => (
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

      <h3 className="mb-2 mt-6 text-sm font-black text-slate-800 dark:text-slate-100">كل ما يلزمك حسب الموضوع</h3>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        {NEED_HUBS.map((hub) => {
          const isActive = activeId === hub.id;
          return (
            <button
              key={hub.id}
              type="button"
              aria-expanded={isActive}
              aria-controls="popular-needs-panel"
              onClick={() => setActiveId((current) => current === hub.id ? null : hub.id)}
              className={`flex min-h-20 items-center gap-2.5 rounded-lg border p-3 text-start transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${isActive ? 'border-emerald-500 bg-emerald-50 shadow-sm dark:border-emerald-600 dark:bg-emerald-950/25' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${hub.tone}`}>
                <hub.icon size={18} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-[13px] font-black text-slate-900 dark:text-white sm:text-sm">{hub.title}</strong>
                <span className="mt-0.5 block text-[10px] text-slate-500 dark:text-slate-400 sm:text-[11px]">{hub.note}</span>
              </span>
              <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${isActive ? 'rotate-180 text-emerald-600' : ''}`} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      {activeHub && (
        <div id="popular-needs-panel" className="mt-4 animate-in fade-in slide-in-from-top-1 border-y border-emerald-200 bg-emerald-50/70 py-3 dark:border-emerald-900 dark:bg-emerald-950/20">
          <div className="mb-2 flex items-center gap-2 px-3">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${activeHub.tone}`}>
              <activeHub.icon size={17} aria-hidden="true" />
            </span>
            <strong className="text-sm font-black text-slate-900 dark:text-white">{activeHub.title}</strong>
          </div>
          <div className="divide-y divide-emerald-100 dark:divide-emerald-900/60">
            {activeHub.links.map((link) => (
              <Link key={link.href} href={link.href} prefetch={false} className="group flex min-h-14 items-center gap-3 px-3 py-2.5 transition-colors hover:bg-white/75 dark:hover:bg-slate-900/60">
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm font-bold text-slate-800 group-hover:text-emerald-800 dark:text-slate-100 dark:group-hover:text-emerald-300">{link.title}</strong>
                  <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">{link.note}</span>
                </span>
                <ArrowLeft size={16} className="shrink-0 text-emerald-600 transition-transform group-hover:-translate-x-1 dark:text-emerald-400" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
