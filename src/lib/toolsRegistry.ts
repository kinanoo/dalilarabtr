// ============================================================================
// 🛠️ Tools Registry — single source of truth for the whole tools system
// ============================================================================
//
// Every tool the site offers is described ONCE here: where it lives, how it is
// grouped, how popular it is (drives the "most used" ordering on /tools), a one
// line "when to use it", and — crucially — the tool's OUTGOING links: the real
// articles, services, and sibling tools it should point a visitor to next.
//
// Consumed by:
//   • src/app/tools/page.tsx      → the hub (grouped + "الأكثر استخداماً" + search)
//   • src/components/tools/ToolFooter.tsx → the post-use CTA + related links block
//
// ⚠️ RELATED ARTICLE SLUGS ARE REAL. Every slug below was checked against the
// live approved-articles table. Do NOT add a slug you have not verified exists
// (a 404 related-link is worse than none) — the whole point of this registry is
// that the tools link into a living system, not into dead ends.
// ============================================================================

import type { LucideIcon } from 'lucide-react';
import {
  BrainCircuit,
  ShieldAlert,
  Calculator,
  MapPin,
  CreditCard,
  CalendarClock,
  Banknote,
  Wallet,
  Coins,
  Home,
  Pill,
  Smartphone,
  Receipt,
} from 'lucide-react';

export type ToolGroupId = 'residence' | 'security' | 'money' | 'daily';

export interface ToolGroup {
  id: ToolGroupId;
  title: string;
  subtitle: string;
}

export interface ToolLink {
  href: string;
  label: string;
}

export interface Tool {
  id: string;
  /** ToolSchema key (src/components/ToolSchema.tsx) — undefined if the page has no ToolSchema. */
  schemaKey?: string;
  title: string;
  href: string;
  icon: LucideIcon;
  /** Tailwind gradient (from-… to-…) — the tool's colour identity across the site. */
  color: string;
  group: ToolGroupId;
  /** Higher = shown earlier. Curated from real article views + known search demand.
   *  Real per-tool usage now streams to analytics_events (event_name='tool_use'),
   *  so this ordering can be re-tuned from data over time. */
  popularity: number;
  badge?: string | null;
  /** Card description on the hub. */
  short: string;
  /** One line: the moment a visitor actually needs this tool. */
  whenToUse: string;
  /** The "next step" after using the tool. */
  cta: {
    heading: string;
    primary: ToolLink;
    secondary?: ToolLink;
  };
  /** Real, verified article slugs (→ /article/<slug>). */
  relatedArticles: ToolLink[];
  /** Where to go to get this done by a human (request form / directory / consultant). */
  relatedServices: ToolLink[];
  /** Sibling tool ids that pair naturally with this one. */
  relatedTools: string[];
}

// ─── Groups (render order) ──────────────────────────────────────────────────
export const TOOL_GROUPS: ToolGroup[] = [
  { id: 'residence', title: 'الإقامة والكملك والنفوس', subtitle: 'تحقّق من وضعك، احسب مدّتك، واعرف أين تسجّل.' },
  { id: 'security', title: 'الأمان والأكواد والحظر', subtitle: 'افهم القيود الأمنية والمنع من الدخول وما تفعله حيالها.' },
  { id: 'money', title: 'المال والعمل والإيجار', subtitle: 'رواتب، تعويضات، إيجار، وأسعار صرف بأرقام رسمية.' },
  { id: 'daily', title: 'الصحة والخدمات اليومية', subtitle: 'صيدليات، طوارئ، وبوابة الحكومة الإلكترونية.' },
];

const a = (slug: string, label: string): ToolLink => ({ href: `/article/${slug}`, label });

// ─── Tools ──────────────────────────────────────────────────────────────────
export const TOOLS: Tool[] = [
  {
    id: 'consultant',
    schemaKey: 'consultant',
    title: 'دليل المواقف',
    href: '/consultant',
    icon: BrainCircuit,
    color: 'from-emerald-500 to-teal-600',
    group: 'security',
    popularity: 100,
    badge: 'الأكثر استخداماً',
    short: 'حدّد إجراءاتك القانونية في تركيا خطوة بخطوة حسب حالتك.',
    whenToUse: 'حين لا تعرف من أين تبدأ أو ما الإجراء المناسب لوضعك.',
    cta: {
      heading: 'وصلت لخطوة تحتاج فيها مساعدة؟',
      primary: { href: '/request', label: 'قدّم طلبك وسنوجّهك' },
      secondary: { href: '/directory', label: 'ابحث عن مختصّ قريب منك' },
    },
    relatedArticles: [
      a('turkey-visa-types-2026', 'أنواع التأشيرات ودخول تركيا'),
      a('citizenship-track-general', 'متابعة معاملة الجنسية التركية'),
      a('work-permit-turkey-2026', 'تصريح العمل في تركيا 2026'),
    ],
    relatedServices: [
      { href: '/request', label: 'اطلب خدمة أو استشارة' },
      { href: '/directory', label: 'دليل مقدّمي الخدمات' },
    ],
    relatedTools: ['codes', 'kimlik-check', 'ban-calculator'],
  },
  {
    id: 'codes',
    schemaKey: 'security-codes',
    title: 'فاحص الأكواد الأمنية',
    href: '/codes',
    icon: ShieldAlert,
    color: 'from-rose-500 to-red-600',
    group: 'security',
    popularity: 95,
    badge: null,
    short: 'اعرف معنى الكود الأمني (V-87، G-87، Ç…) وسبب الرفض أو المنع.',
    whenToUse: 'حين تجد كوداً على ورقة رفض أو منع ولا تعرف معناه.',
    cta: {
      heading: 'عرفت الكود؟ اعرف مدّته وكيف تعترض عليه',
      primary: { href: '/ban-calculator', label: 'احسب مدة المنع المتوقّعة' },
      secondary: { href: '/request', label: 'اطلب مساعدة في الاعتراض' },
    },
    relatedArticles: [
      a('return-code-v87', 'كود V-87 وشروط العودة'),
      a('tahdit-entry-restriction-codes-how-to-object', 'الاعتراض على أكواد التقييد (Tahdit)'),
      a('identity-kimlik-iptal-v160', 'إلغاء الكملك وكود V-160'),
      a('deportation-rights', 'حقوقك عند الترحيل'),
    ],
    relatedServices: [
      { href: '/request', label: 'مساعدة قانونية في رفع المنع' },
      { href: '/directory', label: 'محامٍ / مختصّ قريب منك' },
    ],
    relatedTools: ['ban-calculator', 'consultant'],
  },
  {
    id: 'ban-calculator',
    schemaKey: 'ban-calculator',
    title: 'حاسبة مدة الحظر',
    href: '/ban-calculator',
    icon: Calculator,
    color: 'from-blue-500 to-indigo-600',
    group: 'security',
    popularity: 78,
    badge: null,
    short: 'احسب متى يُرفع الحظر عنك بناءً على نوع المخالفة ونوع الخروج.',
    whenToUse: 'حين رُحّلت أو مُنعت وتريد تقدير موعد رفع المنع.',
    cta: {
      heading: 'اعرف الخطوة القانونية التالية',
      primary: { href: '/codes', label: 'افحص كود المنع الخاص بك' },
      secondary: { href: '/request', label: 'اطلب مساعدة قانونية' },
    },
    relatedArticles: [
      a('return-code-v87', 'كود V-87 وشروط العودة'),
      a('tahdit-entry-restriction-codes-how-to-object', 'الاعتراض على أكواد التقييد'),
      a('overstay-solutions', 'حلول تجاوز مدة الإقامة'),
      a('deportation-rights', 'حقوقك عند الترحيل'),
    ],
    relatedServices: [
      { href: '/request', label: 'مساعدة في الاعتراض على المنع' },
    ],
    relatedTools: ['codes', 'consultant'],
  },
  {
    id: 'kimlik-check',
    schemaKey: 'kimlik-checker',
    title: 'فاحص صلاحية الكملك',
    href: '/tools/kimlik-check',
    icon: CreditCard,
    color: 'from-purple-500 to-violet-600',
    group: 'residence',
    popularity: 90,
    badge: null,
    short: 'تحقّق خوارزمياً من رقم الكملك، مع رابط النفوس الرسمي لفحص القيد.',
    whenToUse: 'حين تريد التأكد أن كملكك فعّال قبل معاملة أو توظيف.',
    cta: {
      heading: 'كملكك يحتاج تجديداً أو معاملة؟',
      primary: { href: '/request?service=appointments', label: 'احجز موعد نفوس / تحديث بيانات' },
      secondary: { href: '/consultant', label: 'حدّد إجراءك عبر دليل المواقف' },
    },
    relatedArticles: [
      a('kimlik-renewal-steps', 'خطوات تجديد الكملك'),
      a('kimlik-renewal-expired', 'تجديد الكملك بعد انتهائه'),
      a('lost-kimlik-replacement', 'فقدان الكملك واستخراج بدل'),
      a('citizenship-for-kimlik-holders-2026', 'الجنسية لحاملي الكملك 2026'),
    ],
    relatedServices: [
      { href: '/request?service=appointments', label: 'حجز موعد نفوس / هجرة' },
    ],
    relatedTools: ['residence-calculator', 'zones', 'consultant'],
  },
  {
    id: 'residence-calculator',
    schemaKey: 'residence-calculator',
    title: 'حاسبة أيام الإقامة والغياب',
    href: '/tools/residence-calculator',
    icon: CalendarClock,
    color: 'from-teal-500 to-emerald-600',
    group: 'residence',
    popularity: 72,
    badge: null,
    short: 'احسب أيام غيابك عن تركيا لمتابعة شرط الإقامة المتّصلة للجنسية.',
    whenToUse: 'حين تحضّر للجنسية أو الإقامة الدائمة وتحتاج ضبط أيام الغياب.',
    cta: {
      heading: 'تابع طريقك نحو الإقامة الدائمة أو الجنسية',
      primary: { href: '/tools/kimlik-check', label: 'تحقّق من صلاحية كملكك' },
      secondary: { href: '/calculator', label: 'اعرف رسوم الإقامة الرسمية' },
    },
    relatedArticles: [
      a('tourist-residence-renewal-turkey-2026', 'تجديد الإقامة السياحية 2026'),
      a('residence-permit-fees-2026', 'رسوم الإقامة 2026'),
      a('citizenship-by-residence-2025', 'الجنسية عبر الإقامة'),
      a('citizenship-for-kimlik-holders-2026', 'الجنسية لحاملي الكملك'),
    ],
    relatedServices: [
      { href: '/request?service=appointments', label: 'حجز موعد هجرة / إقامة' },
    ],
    relatedTools: ['kimlik-check', 'calculator'],
  },
  {
    id: 'zones',
    schemaKey: 'restricted-areas',
    title: 'فاحص المناطق المحظورة',
    href: '/zones',
    icon: MapPin,
    color: 'from-amber-500 to-orange-600',
    group: 'residence',
    popularity: 82,
    badge: 'محدّث',
    short: 'تحقّق إن كان الحيّ مفتوحاً لتسجيل الأجانب قبل توقيع عقد السكن.',
    whenToUse: 'قبل استئجار أو شراء سكن — لتتأكد أنك تستطيع تسجيل العنوان.',
    cta: {
      heading: 'الحيّ مغلق أو غير واضح؟',
      primary: { href: '/consultant', label: 'حدّد بدائلك عبر دليل المواقف' },
      secondary: { href: '/request', label: 'اطلب مساعدة في السكن والعنوان' },
    },
    relatedArticles: [
      a('address-registration-closed', 'تسجيل العنوان في حيّ مغلق'),
      a('closed-neighborhoods-80-percent-reduction-2026', 'تقليص الأحياء المغلقة 2026'),
      a('istanbul-closed-neighborhoods-lift-2026', 'فتح أحياء في إسطنبول 2026'),
      a('address-registration-problems', 'مشاكل تسجيل العنوان وحلولها'),
    ],
    relatedServices: [
      { href: '/request', label: 'مساعدة في تسجيل العنوان' },
    ],
    relatedTools: ['kimlik-check', 'consultant'],
  },
  {
    id: 'calculator',
    schemaKey: 'cost-calculator',
    title: 'تكاليف الإقامة',
    href: '/calculator',
    icon: Receipt,
    color: 'from-amber-500 to-yellow-600',
    group: 'residence',
    popularity: 55,
    badge: null,
    short: 'رسوم الإقامة الرسمية ومن أين تتحقّق منها بدقّة — بلا أرقام وهمية.',
    whenToUse: 'حين تريد تقدير كلفة استخراج أو تجديد الإقامة من مصدر رسمي.',
    cta: {
      heading: 'خطّط لإقامتك بثقة',
      primary: { href: '/tools/residence-calculator', label: 'احسب أيام إقامتك وغيابك' },
      secondary: { href: '/request?service=appointments', label: 'احجز موعد إقامة' },
    },
    relatedArticles: [
      a('residence-permit-fees-2026', 'رسوم الإقامة 2026'),
      a('tourist-residence-renewal-turkey-2026', 'تجديد الإقامة السياحية'),
      a('goc-idaresi-fees-no-change-april-2026', 'رسوم الهجرة الرسمية المحدّثة'),
    ],
    relatedServices: [
      { href: '/request?service=appointments', label: 'حجز موعد إقامة' },
    ],
    relatedTools: ['residence-calculator', 'kimlik-check'],
  },
  {
    id: 'currency',
    schemaKey: 'currency-converter',
    title: 'أسعار الصرف ومحوّل العملات',
    href: '/tools/currency',
    icon: Banknote,
    color: 'from-emerald-500 to-green-600',
    group: 'money',
    popularity: 92,
    badge: null,
    short: 'الدولار واليورو والذهب والليرة السورية مقابل التركية اليوم + محوّل فوري.',
    whenToUse: 'حين تحتاج سعر الصرف اليومي أو تحويل مبلغ بسرعة.',
    cta: {
      heading: 'حوّل الأرقام إلى قرارات',
      primary: { href: '/tools/salary-calculator', label: 'احسب راتبك الصافي' },
      secondary: { href: '/tools/rent-increase-calculator', label: 'احسب سقف زيادة إيجارك' },
    },
    relatedArticles: [
      a('cost-of-living-turkey-2026', 'تكاليف المعيشة في تركيا 2026'),
      a('money-transfer-turkey-syria', 'تحويل الأموال بين تركيا وسوريا'),
      a('home-subscriptions-turkey-2026', 'فواتير واشتراكات المنزل'),
    ],
    relatedServices: [],
    relatedTools: ['salary-calculator', 'rent-increase-calculator'],
  },
  {
    id: 'salary-calculator',
    schemaKey: 'salary-calculator',
    title: 'حاسبة الراتب الصافي والإجمالي',
    href: '/tools/salary-calculator',
    icon: Wallet,
    color: 'from-emerald-500 to-green-600',
    group: 'money',
    popularity: 85,
    badge: null,
    short: 'حوّل راتبك بين الإجمالي (Brüt) والصافي (Net) 2026 مع كل الاقتطاعات.',
    whenToUse: 'حين تتفاوض على راتب أو تريد فهم اقتطاعات كشف راتبك.',
    cta: {
      heading: 'اعرف بقية حقوقك المالية',
      primary: { href: '/tools/severance-calculator', label: 'احسب تعويض نهاية الخدمة' },
      secondary: { href: '/tools/currency', label: 'حوّل راتبك لعملة أخرى' },
    },
    relatedArticles: [
      a('foreigner-minimum-salary-2026', 'الحد الأدنى للأجور للأجانب 2026'),
      a('asgari-ucret-turkiye-2026-net-brut-isveren-maliyeti', 'الحد الأدنى: نت/بروت وتكلفة صاحب العمل'),
      a('worker-rights-turkey-2026', 'حقوق العامل في تركيا 2026'),
      a('severance-pay-kidem-tazminati', 'تعويض نهاية الخدمة (Kıdem)'),
    ],
    relatedServices: [],
    relatedTools: ['severance-calculator', 'currency'],
  },
  {
    id: 'severance-calculator',
    schemaKey: 'severance-calculator',
    title: 'حاسبة تعويض نهاية الخدمة',
    href: '/tools/severance-calculator',
    icon: Coins,
    color: 'from-amber-500 to-yellow-600',
    group: 'money',
    popularity: 65,
    badge: null,
    short: 'احسب تعويض نهاية الخدمة (Kıdem) والإشعار (İhbar) 2026 حسب راتبك ومدّتك.',
    whenToUse: 'حين تُفصل أو تستقيل وتريد معرفة تعويضك المستحقّ.',
    cta: {
      heading: 'تأكّد من حصولك على كامل حقّك',
      primary: { href: '/tools/salary-calculator', label: 'احسب راتبك الصافي' },
      secondary: { href: '/request', label: 'اطلب استشارة في نزاع عمل' },
    },
    relatedArticles: [
      a('severance-pay-kidem-tazminati', 'تعويض نهاية الخدمة (Kıdem)'),
      a('worker-rights-turkey-2026', 'حقوق العامل في تركيا'),
      a('unemployment-benefit-iskur', 'إعانة البطالة (İŞKUR)'),
      a('employment-worker-rights-kidem-alo170', 'حقوق العامل وخط ALO 170'),
    ],
    relatedServices: [
      { href: '/request', label: 'استشارة في نزاع عمل' },
    ],
    relatedTools: ['salary-calculator', 'consultant'],
  },
  {
    id: 'rent-increase-calculator',
    schemaKey: 'rent-increase-calculator',
    title: 'حاسبة زيادة الإيجار القانونية',
    href: '/tools/rent-increase-calculator',
    icon: Home,
    color: 'from-rose-500 to-pink-600',
    group: 'money',
    popularity: 70,
    badge: null,
    short: 'اعرف الحد الأقصى القانوني لزيادة إيجارك 2026 حسب متوسط TÜFE.',
    whenToUse: 'حين يطلب صاحب العقار زيادة ولا تعرف السقف القانوني.',
    cta: {
      heading: 'احمِ نفسك من زيادة غير قانونية',
      primary: { href: '/tools/currency', label: 'تابع أسعار الصرف والتكاليف' },
      secondary: { href: '/request', label: 'اطلب مساعدة في نزاع إيجار' },
    },
    relatedArticles: [
      a('rent-contract-tenant-rights-turkey-2026', 'عقد الإيجار وحقوق المستأجر 2026'),
      a('tenant-rights-rent-increase-cap', 'سقف زيادة الإيجار وحقوق المستأجر'),
      a('tahliye-taahhutnamesi-eviction-undertaking-turkey-2026', 'تعهّد الإخلاء (Tahliye taahhütnamesi)'),
      a('cost-of-living-turkey-2026', 'تكاليف المعيشة في تركيا'),
    ],
    relatedServices: [
      { href: '/request', label: 'مساعدة في نزاع إيجار' },
    ],
    relatedTools: ['currency', 'calculator'],
  },
  {
    id: 'pharmacy',
    schemaKey: 'pharmacy',
    title: 'الصيدليات المناوبة',
    href: '/tools/pharmacy',
    icon: Pill,
    color: 'from-green-500 to-emerald-600',
    group: 'daily',
    popularity: 68,
    badge: null,
    short: 'اعثر على أقرب صيدلية مناوبة (nöbetçi eczane) مفتوحة الآن في مدينتك.',
    whenToUse: 'حين تحتاج دواءً ليلاً أو في عطلة والصيدليات العادية مغلقة.',
    cta: {
      heading: 'رتّب أمورك الصحية بالكامل',
      primary: { href: '/article/mhrs-guide-syrians-arabs-2026', label: 'احجز موعد طبيب عبر MHRS' },
      secondary: { href: '/article/emergency-guide', label: 'دليل الطوارئ وأرقامها' },
    },
    relatedArticles: [
      a('pharmacy-duty', 'دليل الصيدليات المناوبة'),
      a('emergency-guide', 'دليل الطوارئ في تركيا'),
      a('mhrs-guide-syrians-arabs-2026', 'حجز موعد مستشفى عبر MHRS'),
      a('sgk-gss-health-insurance-turkey-2026', 'التأمين الصحي SGK / GSS 2026'),
    ],
    relatedServices: [],
    relatedTools: ['edevlet', 'consultant'],
  },
  {
    id: 'edevlet',
    schemaKey: undefined,
    title: 'خدمات e-Devlet',
    href: '/e-devlet-services',
    icon: Smartphone,
    color: 'from-sky-500 to-blue-600',
    group: 'daily',
    popularity: 60,
    badge: null,
    short: 'روابط مباشرة لأهم خدمات الحكومة الإلكترونية التركية e-Devlet.',
    whenToUse: 'حين تريد إنجاز معاملة رسمية أونلاين دون مراجعة دائرة.',
    cta: {
      heading: 'أنجز معاملتك من بيتك',
      primary: { href: '/tools/kimlik-check', label: 'تحقّق من صلاحية كملكك' },
      secondary: { href: '/consultant', label: 'حدّد إجراءك عبر دليل المواقف' },
    },
    relatedArticles: [
      a('edevlet-nvi-yerlesim-yeri', 'إثبات العنوان (Yerleşim yeri)'),
      a('edevlet-mhrs', 'حجز موعد صحي عبر MHRS'),
      a('edevlet-adli-sicil-kaydi', 'إخراج السجل العدلي (Adli sicil)'),
      a('edevlet-imei-sorgulama', 'استعلام IMEI للهاتف'),
    ],
    relatedServices: [
      { href: '/request?service=phone-imei', label: 'مساعدة في تتريك الهاتف (IMEI)' },
    ],
    relatedTools: ['kimlik-check', 'pharmacy'],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const BY_ID: Record<string, Tool> = Object.fromEntries(TOOLS.map((t) => [t.id, t]));

export function getTool(id: string): Tool | undefined {
  return BY_ID[id];
}

/** Tools of one group, most-popular first. */
export function toolsInGroup(group: ToolGroupId): Tool[] {
  return TOOLS.filter((t) => t.group === group).sort((x, y) => y.popularity - x.popularity);
}

/** The N most-used tools overall (drives the "الأكثر استخداماً" strip). */
export function featuredTools(n = 5): Tool[] {
  return [...TOOLS].sort((x, y) => y.popularity - x.popularity).slice(0, n);
}
