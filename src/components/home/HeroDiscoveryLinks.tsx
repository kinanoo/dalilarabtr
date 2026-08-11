'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

type DiscoveryKind = 'tool' | 'guide' | 'content' | 'service' | 'place';

type DiscoveryLink = {
  title: string;
  href: string;
  kind: DiscoveryKind;
};

const DISCOVERY_LINKS: DiscoveryLink[] = [
  { title: 'فحص الكملك', href: '/tools/kimlik-check', kind: 'tool' },
  { title: 'معاني الأكواد الأمنية', href: '/codes', kind: 'tool' },
  { title: 'المناطق المحظورة', href: '/zones', kind: 'tool' },
  { title: 'أسعار الصرف اليوم', href: '/tools/currency', kind: 'tool' },
  { title: 'الصيدليات المناوبة', href: '/tools/pharmacy', kind: 'tool' },
  { title: 'احسب راتبك الصافي', href: '/tools/salary-calculator', kind: 'tool' },
  { title: 'احسب تعويض نهاية الخدمة', href: '/tools/severance-calculator', kind: 'tool' },
  { title: 'احسب زيادة الإيجار', href: '/tools/rent-increase-calculator', kind: 'tool' },
  { title: 'احسب أيام الإقامة', href: '/tools/residence-calculator', kind: 'tool' },
  { title: 'تكاليف الإقامة', href: '/calculator', kind: 'tool' },
  { title: 'خدمات الحكومة الإلكترونية', href: '/e-devlet-services', kind: 'tool' },
  { title: 'نماذج جاهزة للتحميل', href: '/forms', kind: 'tool' },

  { title: 'دليل الإقامات في تركيا', href: '/residence', kind: 'guide' },
  { title: 'العمل وإذن العمل', href: '/work', kind: 'guide' },
  { title: 'الصحة والتأمين والمشافي', href: '/health', kind: 'guide' },
  { title: 'التعليم والجامعات', href: '/education', kind: 'guide' },
  { title: 'السكن والإيجار', href: '/housing', kind: 'guide' },
  { title: 'كل المعاملات حسب الموضوع', href: '/directory', kind: 'guide' },
  { title: 'شروحات مصورة خطوة بخطوة', href: '/guides', kind: 'guide' },
  { title: 'الأسئلة الأكثر تكراراً', href: '/faq', kind: 'guide' },
  { title: 'أسئلة الناس وإجاباتها', href: '/qa', kind: 'guide' },

  { title: 'آخر القرارات في تركيا', href: '/updates', kind: 'content' },
  { title: 'أحدث المقالات والأدلة', href: '/articles', kind: 'content' },
  { title: 'نقل الكملك بين الولايات', href: '/article/syrian-kimlik-transfer', kind: 'content' },
  { title: 'تحويل الإقامة إلى إذن عمل', href: '/article/tourist-to-work-permit-2026', kind: 'content' },
  { title: 'تسجيل العنوان والمناطق المغلقة', href: '/article/address-registration-closed', kind: 'content' },
  { title: 'حقوق المحتجز في تركيا', href: '/article/detention-center-rights', kind: 'content' },
  { title: 'الجامعات الخاصة في تركيا', href: '/article/private-universities-turkey-2026', kind: 'content' },
  { title: 'فحص السيارة في تركيا', href: '/article/auto-tuvturk-inspection', kind: 'content' },
  { title: 'تأمين الزلازل الإلزامي', href: '/article/dask-earthquake-insurance', kind: 'content' },
  { title: 'حلول تجاوز مدة الإقامة', href: '/article/overstay-solutions', kind: 'content' },

  { title: 'أطباء يتحدثون العربية', href: '/services/category/doctors', kind: 'service' },
  { title: 'محامون يتحدثون العربية', href: '/services/category/lawyers', kind: 'service' },
  { title: 'مترجمون في تركيا', href: '/services/category/translators', kind: 'service' },

  { title: 'السفارات والقنصليات', href: '/consulates', kind: 'place' },
  { title: 'دوائر ومؤسسات قريبة', href: '/places', kind: 'place' },
  { title: 'دليل المدن التركية', href: '/city', kind: 'place' },
  { title: 'روابط حكومية مهمة', href: '/important-links', kind: 'place' },
  { title: 'مصادر المعلومات الرسمية', href: '/sources', kind: 'place' },
];

const STORAGE_KEY = 'daleel.hero-discovery-links.v2';
const VISIBLE_LINKS = 12;
const DISCOVERY_KINDS: DiscoveryKind[] = ['tool', 'guide', 'content', 'service', 'place'];
const DEFAULT_HREFS = [
  '/codes',
  '/tools/pharmacy',
  '/e-devlet-services',
  '/article/syrian-kimlik-transfer',
  '/updates',
  '/guides',
  '/services/category/doctors',
  '/services/category/translators',
  '/consulates',
  '/places',
  '/forms',
  '/tools/kimlik-check',
];

function linksFromHrefs(hrefs: string[]) {
  const uniqueHrefs = Array.from(new Set(hrefs));
  return uniqueHrefs
    .map((href) => DISCOVERY_LINKS.find((item) => item.href === href))
    .filter((item): item is DiscoveryLink => Boolean(item))
    .slice(0, VISIBLE_LINKS);
}

function shuffle<T>(items: T[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const target = randomBuffer[0] % (index + 1);
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

function randomLinks() {
  const requiredKinds = DISCOVERY_KINDS.map(
    (kind) => shuffle(DISCOVERY_LINKS.filter((item) => item.kind === kind))[0],
  );
  const requiredHrefs = new Set(requiredKinds.map((item) => item.href));
  const remaining = shuffle(DISCOVERY_LINKS.filter((item) => !requiredHrefs.has(item.href)));
  return shuffle([...requiredKinds, ...remaining.slice(0, VISIBLE_LINKS - requiredKinds.length)]);
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
        // Storage can be unavailable in strict privacy modes.
      }
    }

    if (selected.length !== VISIBLE_LINKS) {
      selected = randomLinks();
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selected.map((item) => item.href)));
      } catch {
        // The discovery links still work with an in-memory selection.
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
      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-0.5 sm:gap-x-6 sm:gap-y-1">
        {links.map((item) => (
          <li key={item.href} className="min-w-0">
            <Link
              href={item.href}
              prefetch={false}
              className="group relative inline-flex min-h-8 max-w-full items-center gap-0.5 py-0.5 text-center text-[11px] font-bold leading-4 text-slate-600 transition-colors duration-200 after:absolute after:inset-x-2 after:bottom-0 after:h-px after:origin-right after:scale-x-[0.35] after:bg-emerald-500/70 after:transition-transform after:duration-300 hover:text-emerald-800 hover:after:scale-x-100 focus-visible:text-emerald-800 focus-visible:outline-none focus-visible:after:scale-x-100 active:scale-[0.97] sm:text-xs dark:text-slate-300 dark:after:bg-emerald-400/70 dark:hover:text-emerald-300 dark:focus-visible:text-emerald-300"
            >
              <span>{item.title}</span>
              <ChevronLeft
                aria-hidden="true"
                className="h-3 w-3 shrink-0 text-emerald-600/75 transition-transform duration-200 group-hover:-translate-x-0.5 group-focus-visible:-translate-x-0.5 dark:text-emerald-400/80"
                strokeWidth={2.5}
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
