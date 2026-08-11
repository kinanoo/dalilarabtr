'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type DiscoveryLink = {
  title: string;
  href: string;
};

const DISCOVERY_LINKS: DiscoveryLink[] = [
  { title: 'دليل المواقف', href: '/consultant' },
  { title: 'فحص الكملك', href: '/tools/kimlik-check' },
  { title: 'الأكواد الأمنية', href: '/codes' },
  { title: 'المناطق المحظورة', href: '/zones' },
  { title: 'أسعار الصرف', href: '/tools/currency' },
  { title: 'الصيدليات المناوبة', href: '/tools/pharmacy' },
  { title: 'حاسبة الراتب', href: '/tools/salary-calculator' },
  { title: 'تعويض نهاية الخدمة', href: '/tools/severance-calculator' },
  { title: 'زيادة الإيجار', href: '/tools/rent-increase-calculator' },
  { title: 'حاسبة أيام الإقامة', href: '/tools/residence-calculator' },
  { title: 'تكاليف الإقامة', href: '/calculator' },
  { title: 'خدمات الحكومة الإلكترونية', href: '/e-devlet-services' },
  { title: 'روابط حكومية', href: '/important-links' },
  { title: 'القنصليات', href: '/consulates' },
  { title: 'أين يقع؟', href: '/places' },
  { title: 'مقدمو الخدمات', href: '/services' },
  { title: 'أطباء', href: '/services/category/doctors' },
  { title: 'محامون', href: '/services/category/lawyers' },
  { title: 'مترجمون', href: '/services/category/translators' },
  { title: 'الإقامات', href: '/residence' },
  { title: 'العمل في تركيا', href: '/work' },
  { title: 'الصحة والتأمين', href: '/health' },
  { title: 'التعليم والجامعات', href: '/education' },
  { title: 'السكن والإيجار', href: '/housing' },
  { title: 'النماذج الجاهزة', href: '/forms' },
  { title: 'دليل المدن', href: '/city' },
  { title: 'الأسئلة الشائعة', href: '/faq' },
  { title: 'الدليل الشامل', href: '/directory' },
];

const STORAGE_KEY = 'daleel.hero-discovery-links.v1';
const VISIBLE_LINKS = 6;
const DEFAULT_HREFS = [
  '/codes',
  '/tools/pharmacy',
  '/services',
  '/e-devlet-services',
  '/tools/currency',
  '/places',
];

function linksFromHrefs(hrefs: string[]) {
  const uniqueHrefs = Array.from(new Set(hrefs));
  return uniqueHrefs
    .map((href) => DISCOVERY_LINKS.find((item) => item.href === href))
    .filter((item): item is DiscoveryLink => Boolean(item))
    .slice(0, VISIBLE_LINKS);
}

function randomLinks() {
  const shuffled = [...DISCOVERY_LINKS];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const target = randomBuffer[0] % (index + 1);
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled.slice(0, VISIBLE_LINKS);
}

export default function HeroDiscoveryLinks() {
  const [links, setLinks] = useState(() => linksFromHrefs(DEFAULT_HREFS));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let selected: DiscoveryLink[] = [];
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) selected = linksFromHrefs(saved);
    } catch {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage restrictions and use an in-memory selection instead.
      }
    }

    if (selected.length !== VISIBLE_LINKS) {
      selected = randomLinks();
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selected.map((item) => item.href)));
      } catch {
        // Discovery links still work when browser storage is unavailable.
      }
    }

    const revealFrame = requestAnimationFrame(() => {
      setLinks(selected);
      setReady(true);
    });
    return () => cancelAnimationFrame(revealFrame);
  }, []);

  return (
    <nav
      aria-label="استكشف أقسام وأدوات الدليل"
      className={`mx-auto w-full transition-opacity duration-300 ${ready ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="flex min-h-10 snap-x snap-mandatory gap-2 overflow-x-auto px-0.5 pb-1 scrollbar-hide sm:flex-wrap sm:justify-center sm:overflow-visible">
        {links.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={`group relative flex min-h-10 shrink-0 snap-start items-center justify-center overflow-hidden rounded-lg border px-3.5 py-2 text-xs font-black shadow-sm transition duration-200 after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-right after:scale-x-0 after:rounded-full after:transition-transform after:duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(22,101,52,0.16)] hover:after:scale-x-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:after:scale-x-100 active:translate-y-0 active:scale-[0.97] active:after:scale-x-100 ${index === 0 ? 'border-emerald-700 bg-emerald-800 text-white after:bg-amber-400 dark:border-emerald-500 dark:bg-emerald-900' : 'border-slate-200 bg-white/90 text-slate-700 after:bg-emerald-800 hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-100 dark:after:bg-emerald-400 dark:hover:border-emerald-700 dark:hover:text-emerald-200'}`}
          >
            {item.title}
          </Link>
        ))}
      </div>
    </nav>
  );
}
