import { SERVICE_CATEGORIES } from '@/lib/serviceCategories';

/**
 * Maps an article to the service category a reader of that article would
 * actually need next.
 *
 * The gap this closes: 357 articles carry the site's entire search traffic and
 * not one of them linked to the 431-provider directory or the /request funnel.
 * Every visit ended at the bottom of a page.
 *
 * The mapping is deliberately conservative. A wrong match is worse than no
 * match — sending someone reading about a lost kimlik to a dentist destroys
 * the trust the article just built — so anything without a confident signal
 * returns null and the reader is offered the honest generic route instead.
 */

export type ServiceMatch = {
    /** service category slug, e.g. 'lawyers' */
    slug: string;
    /** canonical Arabic category value stored in service_providers.category */
    name: string;
    /** plural display label, e.g. 'محامون' */
    labelAr: string;
    /** why this article leads here, shown to the reader */
    reason: string;
};

/**
 * slug fragments → service category slug, MOST SPECIFIC FIRST.
 *
 * Order and anchoring both matter, and both were got wrong on the first pass.
 * An audit over all 357 live slugs caught: `tiktak-car-rental` and
 * `marti-scooter-rental` matching the housing rule on the substring "rent",
 * `tenant-rights-…` matching a legal rule on the bare token "rights", and
 * `auto-noter-satis-transfer` (a car sale at a notary) matching translators.
 * Hence `(^|-)token(-|$)` anchoring and vehicles before everything else.
 *
 * Re-run scratchpad/match_audit.mjs after touching this table.
 */
const SLUG_RULES: Array<[RegExp, string, string]> = [
    // Vehicles first: their slugs contain tokens other rules would steal
    // ("rental" → rent, "noter" → translators).
    [/(^|-)(car|cars|auto|vehicle|ehliyet|plaka|plate|traffic|trafik|scooter|taxi|tiktak|marti|mtv|tuvturk|hgs|ogs)(-|$)/, 'cars', 'للسيارات والمعاملات المرورية'],
    // Very specific professions.
    [/(^|-)(dental|dentist)(-|$)|أسنان/, 'dentists', 'لطب الأسنان'],
    [/(^|-)(hair|beauty|estetik)(-|$)|تجميل/, 'beauty', 'لخدمات التجميل'],
    [/(^|-)(nakliyat|moving)(-|$)|نقل-عفش/, 'moving', 'لنقل العفش'],
    // Documents that genuinely need a sworn translator or a notary.
    [/(^|-)(attestation|denklik|translation|translator|sworn|yeminli|tercuman)(-|$)|تصديق/, 'translators', 'هذه المعاملة تحتاج ترجمة محلّفة'],
    [/(^|-)(consulate|consulates)(-|$)|قنصلي/, 'translators', 'أوراق القنصلية تحتاج ترجمة محلّفة غالباً'],
    // High-stakes legal: only where a lawyer is the actual next step.
    [/(^|-)(deportation|deport|detention|police-station|removal|overstay|undocumented|appeal|lawsuit|court|mahkeme)(-|$)/, 'lawyers', 'هذه المسائل يُتابعها محامٍ'],
    [/(^|-)(citizenship|naturalization)(-|$)|جنسية/, 'lawyers', 'ملفات الجنسية يتابعها محامٍ'],
    [/(^|-)(company|sirket|invest|investor)(-|$)/, 'lawyers', 'لتأسيس الشركات والاستثمار'],
    // Housing — anchored so "car-rental" can never reach here.
    [/(^|-)(rent|rental|renting|kira|tapu|property|housing|deposit|depozito|eviction|tahliye|aidat|dask|emlak)(-|$)/, 'real-estate', 'للسكن والعقار'],
    // Education.
    [/(^|-)(school|university|student|yos|yks|tomer|scholarship|burslari|education|denklik|diploma)(-|$)|جامع|مدرس/, 'education', 'للتسجيل والمعادلة'],
    // Health — hospital/clinic topics only. SGK/insurance paperwork is an
    // administrative matter, not a reason to send someone to a doctor.
    [/(^|-)(hospital|mhrs|enabiz|doctor|clinic|medical|treatment|dava)(-|$)|طبيب|علاج/, 'doctors', 'للرعاية الصحية بالعربية'],
];

/**
 * article category (Arabic) → service category slug. Checked second, and only
 * where the whole category genuinely implies one profession. Categories that
 * do not — «الكملك والحماية المؤقتة», «أنواع الإقامات», «معاملات رسمية»,
 * «خدمات e-Devlet», «خدمات السوريين» — are deliberately absent: most of their
 * articles are self-service procedures, and blanket-routing them to a lawyer
 * both misleads the reader and buries 13 lawyers under a third of the site.
 */
const CATEGORY_RULES: Record<string, [string, string]> = {
    'الصحة والتأمين': ['doctors', 'للرعاية الصحية بالعربية'],
    'الدراسة والتعليم': ['education', 'للتسجيل والمعادلة'],
    'المرور والسيارات': ['cars', 'للسيارات والمعاملات المرورية'],
    // «السكن والحياة» is deliberately NOT here. It means "housing AND daily
    // life", so it also holds aid cards, phone lines and transport passes —
    // the audit caught the Red Crescent aid-card article being routed to
    // estate agents through it. Housing articles still match by slug.
};

export function matchServiceCategory(args: {
    slug: string;
    category?: string | null;
    tags?: string[] | null;
}): ServiceMatch | null {
    const bySlug = SLUG_RULES.find(([re]) => re.test(args.slug));
    const hit = bySlug
        ? { slug: bySlug[1], reason: bySlug[2] }
        : (() => {
            const c = args.category ? CATEGORY_RULES[args.category] : undefined;
            return c ? { slug: c[0], reason: c[1] } : null;
        })();

    if (!hit) return null;

    // Only offer a category the directory actually knows about.
    const cat = SERVICE_CATEGORIES.find((c) => c.slug === hit.slug);
    if (!cat) return null;

    return { slug: cat.slug, name: cat.name, labelAr: cat.labelAr, reason: hit.reason };
}
