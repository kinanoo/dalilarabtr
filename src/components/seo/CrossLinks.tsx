/**
 * CrossLinks — compact "روابط تهمّك" internal-linking section for SEO.
 *
 * Server component. Links are chosen STATICALLY from a hand-curated map
 * keyed by `context` (no DB queries, zero runtime cost beyond render):
 *   - code → codes list, consultant, zones, faq (+ relevant hub if
 *     `category` matches a known hub).
 *   - tool → tools, codes, zones, e-devlet services, faq.
 *   - zone → zones, codes, consultant, residence hub.
 *   - hub  → consultant, faq, services, tools.
 *
 * Anchor labels are descriptive Arabic sentences (good SEO anchor text),
 * never generic "اضغط هنا". `keywords` is accepted for forward API
 * compatibility but not used by the static map.
 */
import Link from 'next/link';
import {
  ArrowLeft,
  Banknote,
  Coins,
  Compass,
  GraduationCap,
  HeartHandshake,
  HeartPulse,
  HelpCircle,
  Home,
  KeyRound,
  Landmark,
  Link2,
  MapPin,
  Receipt,
  ShieldAlert,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

type CrossLinksContext = 'code' | 'tool' | 'zone' | 'hub';

type CrossLinksProps = {
  context: CrossLinksContext;
  /** Reserved for future fine-tuning; the current map is purely static. */
  keywords?: string[];
  /** For `code`: adds a link to the matching content hub (e.g. "work"). */
  category?: string;
  /** Overrides the default section heading "روابط تهمّك". */
  title?: string;
};

type CrossLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// ---------------------------------------------------------------------------
// Curated destinations (single source of truth for labels/icons)
// ---------------------------------------------------------------------------

const CODES_LINK: CrossLink = {
  href: '/codes',
  label: 'العودة إلى قائمة أكواد المنع والحظر في تركيا مع شرح كل كود',
  icon: ShieldAlert,
};

const CONSULTANT_LINK: CrossLink = {
  href: '/consultant',
  label: 'حدّد إجراءك القانوني خطوة بخطوة عبر المستشار الذكي',
  icon: Compass,
};

const ZONES_LINK: CrossLink = {
  href: '/zones',
  label: 'افحص حالة حيّك في قائمة الأحياء المغلقة أمام تسجيل القيود',
  icon: MapPin,
};

const FAQ_LINK: CrossLink = {
  href: '/faq',
  label: 'تصفّح إجابات الأسئلة الشائعة عن الإقامة والحماية المؤقتة',
  icon: HelpCircle,
};

const TOOLS_LINK: CrossLink = {
  href: '/tools',
  label: 'جرّب باقي الأدوات التفاعلية المجانية للعرب في تركيا',
  icon: Wrench,
};

const EDEVLET_LINK: CrossLink = {
  href: '/e-devlet-services',
  label: 'نفّذ معاملاتك الحكومية بنفسك عبر دليل خدمات إي دولت',
  icon: Landmark,
};

const SERVICES_LINK: CrossLink = {
  href: '/services',
  label: 'استكشف الخدمات المتاحة للمقيمين العرب في تركيا',
  icon: HeartHandshake,
};

const RESIDENCE_LINK: CrossLink = {
  href: '/residence',
  label: 'اقرأ أدلة الإقامة في تركيا: أنواعها وشروط تجديدها',
  icon: Home,
};

// Finance tools — surfaced contextually on the work + housing hubs.
const CURRENCY_LINK: CrossLink = {
  href: '/tools/currency',
  label: 'تابع سعر الدولار واليورو والذهب مقابل الليرة التركية اليوم',
  icon: Banknote,
};

const SALARY_LINK: CrossLink = {
  href: '/tools/salary-calculator',
  label: 'احسب راتبك الصافي من الإجمالي في تركيا مع كل الاقتطاعات',
  icon: Wallet,
};

const SEVERANCE_LINK: CrossLink = {
  href: '/tools/severance-calculator',
  label: 'احسب تعويض نهاية الخدمة وتعويض الإشعار حسب راتبك ومدة عملك',
  icon: Coins,
};

const RENT_LINK: CrossLink = {
  href: '/tools/rent-increase-calculator',
  label: 'اعرف الحد الأقصى القانوني لزيادة إيجارك السنوية في تركيا',
  icon: Home,
};

const COST_OF_LIVING_LINK: CrossLink = {
  href: '/article/cost-of-living-turkey-2026',
  label: 'اطّلع على دليل تكاليف المعيشة في تركيا 2026 بالأرقام لكل بند',
  icon: Receipt,
};

const PROPERTY_LINK: CrossLink = {
  href: '/article/buying-property-turkey-2026',
  label: 'اقرأ دليل شراء العقار في تركيا 2026 والوضع الخاص للسوريين',
  icon: Landmark,
};

const WORKER_RIGHTS_LINK: CrossLink = {
  href: '/article/worker-rights-turkey-2026',
  label: 'اعرف حقوقك كعامل في تركيا: الساعات والإجازات والعمل الإضافي والفصل',
  icon: HeartHandshake,
};

// Content hubs reachable from a code page via `category`.
// Keys are normalized (lowercase, trimmed); Arabic aliases included.
const HUB_LINKS: Record<string, CrossLink> = {
  residence: RESIDENCE_LINK,
  'إقامة': RESIDENCE_LINK,
  'الإقامة': RESIDENCE_LINK,
  work: {
    href: '/work',
    label: 'تعرّف على شروط إذن العمل وحقوق العامل في تركيا',
    icon: Landmark,
  },
  'عمل': {
    href: '/work',
    label: 'تعرّف على شروط إذن العمل وحقوق العامل في تركيا',
    icon: Landmark,
  },
  'العمل': {
    href: '/work',
    label: 'تعرّف على شروط إذن العمل وحقوق العامل في تركيا',
    icon: Landmark,
  },
  health: {
    href: '/health',
    label: 'اطّلع على أدلة العلاج والتأمين الصحي للمقيمين في تركيا',
    icon: HeartPulse,
  },
  'صحة': {
    href: '/health',
    label: 'اطّلع على أدلة العلاج والتأمين الصحي للمقيمين في تركيا',
    icon: HeartPulse,
  },
  'الصحة': {
    href: '/health',
    label: 'اطّلع على أدلة العلاج والتأمين الصحي للمقيمين في تركيا',
    icon: HeartPulse,
  },
  education: {
    href: '/education',
    label: 'تعرّف على تسجيل المدارس والجامعات والمنح في تركيا',
    icon: GraduationCap,
  },
  'تعليم': {
    href: '/education',
    label: 'تعرّف على تسجيل المدارس والجامعات والمنح في تركيا',
    icon: GraduationCap,
  },
  'التعليم': {
    href: '/education',
    label: 'تعرّف على تسجيل المدارس والجامعات والمنح في تركيا',
    icon: GraduationCap,
  },
  housing: {
    href: '/housing',
    label: 'اقرأ أدلة السكن وعقود الإيجار وتسجيل العنوان في تركيا',
    icon: KeyRound,
  },
  'سكن': {
    href: '/housing',
    label: 'اقرأ أدلة السكن وعقود الإيجار وتسجيل العنوان في تركيا',
    icon: KeyRound,
  },
  'السكن': {
    href: '/housing',
    label: 'اقرأ أدلة السكن وعقود الإيجار وتسجيل العنوان في تركيا',
    icon: KeyRound,
  },
};

// ---------------------------------------------------------------------------
// Static selection per context
// ---------------------------------------------------------------------------

function getLinks(context: CrossLinksContext, category?: string): CrossLink[] {
  let links: CrossLink[];

  switch (context) {
    case 'code': {
      links = [CODES_LINK, CONSULTANT_LINK, ZONES_LINK, FAQ_LINK];
      const hub = category ? HUB_LINKS[category.trim().toLowerCase()] : undefined;
      if (hub) links.push(hub);
      break;
    }
    case 'tool':
      links = [TOOLS_LINK, CODES_LINK, ZONES_LINK, EDEVLET_LINK, FAQ_LINK];
      break;
    case 'zone':
      links = [ZONES_LINK, CODES_LINK, CONSULTANT_LINK, RESIDENCE_LINK];
      break;
    case 'hub': {
      links = [CONSULTANT_LINK, FAQ_LINK, SERVICES_LINK, TOOLS_LINK];
      // Prepend topically-matched finance tools so a work/housing hub visitor
      // discovers the money calculators in-context (crawlable internal links).
      const cat = category?.trim().toLowerCase();
      if (cat === 'work' || cat === 'عمل' || cat === 'العمل') {
        // Ordered by work intent; the 6-link cap drops the generic tail.
        links = [WORKER_RIGHTS_LINK, SALARY_LINK, SEVERANCE_LINK, COST_OF_LIVING_LINK, ...links];
      } else if (cat === 'housing' || cat === 'سكن' || cat === 'السكن') {
        // Ordered by housing intent; getLinks caps at 6, so the generic tail
        // (services/tools) drops off once the topical links fill the list.
        links = [RENT_LINK, PROPERTY_LINK, COST_OF_LIVING_LINK, CURRENCY_LINK, ...links];
      }
      break;
    }
  }

  // Dedupe by href (defensive — the curated lists should already be unique).
  const seen = new Set<string>();
  return links
    .filter((link) => {
      if (seen.has(link.href)) return false;
      seen.add(link.href);
      return true;
    })
    .slice(0, 6);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CrossLinks({ context, category, title }: CrossLinksProps) {
  const links = getLinks(context, category);
  if (links.length === 0) return null;

  return (
    <nav
      aria-label="روابط داخلية ذات صلة"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 md:p-6"
    >
      <h2 className="flex items-center gap-2 text-base font-black text-slate-800 dark:text-slate-100 mb-3">
        <Link2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        {title || 'روابط تهمّك'}
      </h2>

      <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className="group flex items-center gap-3 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                <span className="flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </span>
                <span className="flex-1 leading-relaxed">{link.label}</span>
                <ArrowLeft
                  className="w-4 h-4 shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 group-hover:-translate-x-0.5 transition-all"
                  aria-hidden="true"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
