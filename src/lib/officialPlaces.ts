// ============================================================================
// 📍 officialPlaces — «أين يقع؟» دليل مواقع القنصليات والدوائر الرسمية
// ============================================================================
//
// WHY THIS EXISTS
// ---------------
// The single most common question we get is *where is it*: «وين القنصلية
// السورية في إسطنبول؟», «وين إدارة الهجرة في عين تاب؟», «وين أقرب دائرة
// نفوس؟». Until now the site answered every question about a procedure but
// never the location, so people left for Google. This module turns that
// question into a first-class answer: every place people ask about has its own
// page, is reachable from the global search box, and is one tap from Google
// Maps.
//
// BOTH HALVES, ON PURPOSE (read before adding data)
// -------------------------------------------------
// Every place carries a `mapQuery`: its official institution name as Google
// Maps knows it. Specific missions may ALSO carry a verified `contact` — street
// address, phone, counter hours, and the date we checked them.
//
// Why both:
//   • A stored address is what a person actually uses. They read it, copy it,
//     send it to a driver, check it the night before. Official addresses are
//     stable — many sit unchanged for years — so refusing to store them just to
//     stay theoretically safe costs the visitor real convenience.
//   • A live name search is what stays correct. When a mission does move, Maps
//     knows before we do. So every page also offers «الموقع تغيّر؟ ابحث بالاسم
//     في جوجل», and the stored address is always stamped with `verifiedOn` so
//     the visitor can judge it instead of trusting it blindly.
//
// The rules that keep this honest:
//   1. NEVER invent an address. No entry is better than a wrong one — sending
//      someone across İstanbul to the wrong building is the failure mode we are
//      guarding against. `contact` is optional precisely so gaps stay gaps.
//   2. Record `verifiedOn` + `source` for every address, and re-check rather
//      than re-guess. Sources that disagree (see jordan) mean NO stored address.
//   3. Only add a mission you are confident exists. A map query for a mission
//      that was never opened resolves to noise.
//   4. `honorary: true` on a consulate post is not cosmetic. An honorary consul
//      cannot issue passports or legalise documents; labelling one as a full
//      consulate sends people after a passport to an office that cannot make
//      one. Mark it, and the UI warns.
//
// Class-of-office pages (kind: 'nearby') never store an address — "the Nüfus
// offices in İstanbul" is dozens of branches, and the useful answer is the one
// nearest the visitor, which only a live search can give.
//
// TWO SHAPES OF PLACE
// -------------------
//   • kind: 'single'  — one specific institution ("القنصلية السورية في إسطنبول").
//                       The map query resolves to that one building.
//   • kind: 'nearby'  — a class of public offices in a province ("دوائر النفوس
//                       في إسطنبول"). The map query lists every branch around
//                       the visitor, which is what people actually want: the
//                       NEAREST one, not a specific one.
//
// Consumed by:
//   • src/app/places/page.tsx        → the hub (search + city filter)
//   • src/app/places/[slug]/page.tsx → one page per place
//   • src/lib/searchIndex.ts         → every place is findable from the global
//                                      search box on the homepage
//   • src/app/sitemap-places.xml     → all place pages
// ============================================================================

import type { LucideIcon } from 'lucide-react';
import {
    Landmark, Building2, Users, Gavel, Fingerprint, ReceiptText, HeartPulse,
    Briefcase, Mail, HandHeart, Stamp, Home, Hospital, Plane, ShieldCheck,
} from 'lucide-react';
import { TR_CITIES } from '@/lib/turkishCities';

// ============================================================================
// 🗂️ المجموعات — how the hub is organised
// ============================================================================

export type PlaceGroupId = 'missions' | 'immigration' | 'civil' | 'money' | 'social';

export interface PlaceGroup {
    id: PlaceGroupId;
    ar: string;
    subtitle: string;
    icon: LucideIcon;
    /** Tailwind text/bg accent pair used by the cards. */
    accent: string;
}

export const PLACE_GROUPS: PlaceGroup[] = [
    {
        id: 'missions',
        ar: 'السفارات والقنصليات',
        subtitle: 'مقرات السفارات والقنصليات العربية والأجنبية في تركيا على الخريطة',
        icon: Landmark,
        accent: 'emerald',
    },
    {
        id: 'immigration',
        ar: 'الهجرة والإقامة والأمن',
        subtitle: 'إدارات الهجرة، شرطة الأجانب، والمتصرفيات',
        icon: Fingerprint,
        accent: 'blue',
    },
    {
        id: 'civil',
        ar: 'النفوس والعدل والمعاملات',
        subtitle: 'دوائر النفوس، دار العدل، كاتب العدل، والمختار',
        icon: Users,
        accent: 'violet',
    },
    {
        id: 'money',
        ar: 'الضرائب والعقارات والبريد',
        subtitle: 'دوائر الضرائب، الطابو، ومكاتب PTT',
        icon: ReceiptText,
        accent: 'amber',
    },
    {
        id: 'social',
        ar: 'العمل والضمان والصحة',
        subtitle: 'الضمان الاجتماعي، مكتب العمل، المستشفيات، ومراكز الدعم',
        icon: HeartPulse,
        accent: 'rose',
    },
];

export const placeGroupById = (id: string): PlaceGroup | undefined =>
    PLACE_GROUPS.find((g) => g.id === id);

// ============================================================================
// 🏙️ المدن — Turkish display names for the canonical slugs in turkishCities.ts
// ============================================================================
// The taxonomy in turkishCities.ts owns the slug + the Arabic name + every
// spelling variant (which we reuse as search aliases). It has no properly-cased
// Turkish name, and the Maps query needs one, so it lives here.

const CITY_TR_NAMES: Record<string, string> = {
    istanbul: 'İstanbul',
    gaziantep: 'Gaziantep',
    bursa: 'Bursa',
    ankara: 'Ankara',
    izmir: 'İzmir',
    mersin: 'Mersin',
    kocaeli: 'Kocaeli',
    sakarya: 'Sakarya',
    sanliurfa: 'Şanlıurfa',
    adana: 'Adana',
    hatay: 'Hatay',
    tekirdag: 'Tekirdağ',
    yalova: 'Yalova',
    konya: 'Konya',
    kayseri: 'Kayseri',
    mardin: 'Mardin',
    kilis: 'Kilis',
    kahramanmaras: 'Kahramanmaraş',
    malatya: 'Malatya',
    antalya: 'Antalya',
};

export interface PlaceCity {
    slug: string;
    ar: string;
    tr: string;
    /** Every spelling that should find this city in search (Arabic + Latin). */
    aliases: string[];
}

const ARABIC_LETTER = /[؀-ۿ]/;

/**
 * People write the city glued to a preposition — «بإسطنبول», «بعنتاب»,
 * «لبورصة» — and the query tokenizer only strips the prefixes ال/بال/لل/ل, so
 * «باسطنبول» never matched the alias «اسطنبول». Carrying the prefixed forms in
 * the haystack fixes the recall from our side without touching the shared
 * stemmer (which every other search on the site depends on).
 */
function withArabicPrefixes(variants: string[]): string[] {
    const out = new Set(variants);
    for (const v of variants) {
        if (!ARABIC_LETTER.test(v)) continue;
        out.add(`ب${v}`);
        out.add(`في${v}`);
    }
    return Array.from(out);
}

/** Provinces we build office pages for — the canonical taxonomy, in its order. */
export const PLACE_CITIES: PlaceCity[] = TR_CITIES.map((c) => ({
    slug: c.slug,
    ar: c.ar,
    tr: CITY_TR_NAMES[c.slug] || c.slug,
    aliases: withArabicPrefixes(c.variants),
}));

export const placeCityBySlug = (slug: string): PlaceCity | undefined =>
    PLACE_CITIES.find((c) => c.slug === slug);

// ============================================================================
// 🏛️ أنواع الدوائر الرسمية — the 'nearby' places, one page per (kind × city)
// ============================================================================

export interface OfficeKind {
    id: string;
    /** Arabic label WITHOUT the city ("إدارة الهجرة"). */
    ar: string;
    /** Turkish institution name — the core of the Maps query. */
    tr: string;
    groupId: PlaceGroupId;
    icon: LucideIcon;
    /** One line: what a visitor actually goes there to do. */
    what: string;
    /** Extra search spellings (Arabic dialect, Turkish, English). */
    aliases: string[];
    /** The institution's national website, when it has one. */
    officialUrl?: string;
    /** Official online-appointment portal — most of these need one. */
    appointment?: { url: string; label: string };
    /** Restrict to specific city slugs; omitted = every province above. */
    cities?: string[];
}

export const OFFICE_KINDS: OfficeKind[] = [
    {
        id: 'goc',
        ar: 'إدارة الهجرة',
        tr: 'İl Göç İdaresi Müdürlüğü',
        groupId: 'immigration',
        icon: Fingerprint,
        what: 'كل ما يتعلق بالإقامة والكملك: التقديم، التجديد، تسليم الوثائق، تثبيت العنوان، وأذون السفر.',
        aliases: [
            'ادارة الهجرة', 'إدارة الهجرة', 'دائرة الهجرة', 'مديرية الهجرة', 'الهجرة',
            'goc idaresi', 'göç idaresi', 'goc', 'il goc idaresi', 'immigration office',
            'اقامة', 'كملك', 'اذن سفر', 'تجديد اقامة', 'e-ikamet', 'ikamet',
        ],
        officialUrl: 'https://www.goc.gov.tr/',
        appointment: { url: 'https://e-ikamet.goc.gov.tr/', label: 'التقديم والموعد عبر e-İkamet' },
    },
    {
        id: 'emniyet',
        ar: 'مديرية الأمن (شرطة الأجانب)',
        tr: 'İl Emniyet Müdürlüğü',
        groupId: 'immigration',
        icon: ShieldCheck,
        what: 'قسم الأجانب، السجل الجنائي، وثائق المرور، ومعاملات الشرطة الرسمية.',
        aliases: [
            'مديرية الامن', 'شرطة الاجانب', 'الشرطة', 'مركز الشرطة', 'الامن',
            'emniyet', 'emniyet mudurlugu', 'yabancilar sube', 'polis', 'police',
        ],
        officialUrl: 'https://www.egm.gov.tr/',
    },
    {
        id: 'kaymakamlik',
        ar: 'المتصرفية (القائمقامية)',
        tr: 'Kaymakamlık',
        groupId: 'immigration',
        icon: Building2,
        what: 'تصديق الوثائق، طلبات المساعدة الاجتماعية، ومعاملات الحكومة المحلية في منطقتك.',
        aliases: [
            'المتصرفية', 'القائمقامية', 'قائمقامية', 'متصرفية', 'kaymakamlik',
            'kaymakamlık', 'district governorate', 'الحكومة المحلية',
        ],
    },
    {
        id: 'nufus',
        ar: 'دائرة النفوس (الأحوال المدنية)',
        tr: 'Nüfus ve Vatandaşlık Müdürlüğü',
        groupId: 'civil',
        icon: Users,
        what: 'الهوية التركية، تثبيت العنوان، وثائق الزواج والولادة، وطلبات الجنسية.',
        aliases: [
            'النفوس', 'نفوس', 'دائرة النفوس', 'الاحوال المدنية', 'الأحوال المدنية',
            'nufus', 'nüfus', 'nufus mudurlugu', 'nvi', 'kimlik', 'الجنسية',
            'تثبيت العنوان', 'ادرس', 'قيد نفوس', 'شهادة ميلاد',
        ],
        officialUrl: 'https://www.nvi.gov.tr/',
        appointment: { url: 'https://randevu.nvi.gov.tr/', label: 'حجز موعد النفوس الرسمي' },
    },
    {
        id: 'adliye',
        ar: 'دار العدل (المحكمة)',
        tr: 'Adliye',
        groupId: 'civil',
        icon: Gavel,
        what: 'المحاكم، الدعاوى، السجل العدلي (Adli Sicil)، والمعاملات القضائية.',
        aliases: [
            'المحكمة', 'دار العدل', 'العدلية', 'محكمة', 'قصر العدل', 'السجل العدلي',
            'adliye', 'mahkeme', 'adli sicil', 'courthouse', 'court',
        ],
        officialUrl: 'https://www.adalet.gov.tr/',
        appointment: { url: 'https://vatandas.uyap.gov.tr/', label: 'بوابة UYAP للمواطنين' },
    },
    {
        id: 'noter',
        ar: 'كاتب العدل (نوتر)',
        tr: 'Noter',
        groupId: 'civil',
        icon: Stamp,
        what: 'تصديق العقود والوكالات والتراجم الرسمية وتوثيق التواقيع.',
        aliases: [
            'نوتر', 'كاتب العدل', 'كاتب عدل', 'noter', 'notary', 'وكالة',
            'تصديق', 'ترجمة محلفة', 'yeminli tercuman', 'عقد ايجار موثق',
        ],
        officialUrl: 'https://www.tnb.org.tr/',
    },
    {
        id: 'muhtarlik',
        ar: 'المختار (المحتارلك)',
        tr: 'Muhtarlık',
        groupId: 'civil',
        icon: Home,
        what: 'وثيقة إثبات السكن (İkametgah)، التصديق على الإقامة في الحي، وشهادة الفقر.',
        aliases: [
            'المختار', 'مختار', 'المحتارلك', 'muhtar', 'muhtarlik', 'muhtarlık',
            'اثبات سكن', 'ikametgah', 'وثيقة سكن', 'شهادة سكن',
        ],
    },
    {
        id: 'vergi',
        ar: 'دائرة الضرائب',
        tr: 'Vergi Dairesi',
        groupId: 'money',
        icon: ReceiptText,
        what: 'الرقم الضريبي (Vergi No)، دفع الرسوم والضرائب، ومعاملات الشركات.',
        aliases: [
            'الضرائب', 'دائرة الضرائب', 'الرقم الضريبي', 'رقم ضريبي',
            'vergi', 'vergi dairesi', 'vergi no', 'gib', 'tax office',
        ],
        officialUrl: 'https://www.gib.gov.tr/',
        appointment: { url: 'https://ivd.gib.gov.tr/', label: 'الدائرة الضريبية التفاعلية' },
    },
    {
        id: 'tapu',
        ar: 'الطابو (السجل العقاري)',
        tr: 'Tapu Müdürlüğü',
        groupId: 'money',
        icon: Home,
        what: 'نقل ملكية العقار، سند الطابو، والاستعلام العقاري.',
        aliases: [
            'الطابو', 'طابو', 'السجل العقاري', 'سند الملكية', 'tapu',
            'tapu mudurlugu', 'kadastro', 'land registry', 'شراء عقار', 'تملك',
        ],
        officialUrl: 'https://www.tkgm.gov.tr/',
        appointment: { url: 'https://randevu.tkgm.gov.tr/', label: 'حجز موعد الطابو' },
    },
    {
        id: 'ptt',
        ar: 'مكتب البريد PTT',
        tr: 'PTT Merkez Müdürlüğü',
        groupId: 'money',
        icon: Mail,
        what: 'دفع الرسوم الحكومية، الحوالات، استلام البطاقات والوثائق بالبريد.',
        aliases: [
            'البريد', 'بريد', 'مكتب البريد', 'بي تي تي', 'ptt', 'posta',
            'حوالة', 'دفع رسوم', 'رسم الاقامة', 'harc',
        ],
        officialUrl: 'https://www.ptt.gov.tr/',
    },
    {
        id: 'sgk',
        ar: 'مؤسسة الضمان الاجتماعي SGK',
        tr: 'SGK Sosyal Güvenlik Merkezi',
        groupId: 'social',
        icon: ShieldCheck,
        what: 'التأمين الصحي العام (GSS)، التأمين على العمل، والاستعلام عن الأقساط.',
        aliases: [
            'الضمان الاجتماعي', 'التأمين', 'التامين الصحي', 'سيكورتا', 'ضمان',
            'sgk', 'gss', 'sosyal guvenlik', 'sigorta', 'تأمين صحي', 'تامين',
        ],
        officialUrl: 'https://www.sgk.gov.tr/',
        appointment: { url: 'https://www.turkiye.gov.tr/', label: 'خدمات SGK عبر e-Devlet' },
    },
    {
        id: 'iskur',
        ar: 'مكتب العمل İŞKUR',
        tr: 'İŞKUR İl Müdürlüğü',
        groupId: 'social',
        icon: Briefcase,
        what: 'التسجيل للعمل، الدورات المهنية، وإجراءات إذن العمل.',
        aliases: [
            'مكتب العمل', 'ايشكور', 'إيشكور', 'iskur', 'i̇şkur', 'işkur',
            'اذن عمل', 'تصريح عمل', 'calisma izni', 'وظيفة', 'دورة مهنية',
        ],
        officialUrl: 'https://www.iskur.gov.tr/',
    },
    {
        id: 'hastane',
        ar: 'مستشفى الدولة',
        tr: 'Devlet Hastanesi',
        groupId: 'social',
        icon: Hospital,
        what: 'العلاج بالتأمين الصحي، الطوارئ، والتقارير الطبية الرسمية.',
        aliases: [
            'مستشفى', 'مشفى', 'المستشفى الحكومي', 'مستشفى الدولة', 'الطوارئ',
            'hastane', 'devlet hastanesi', 'hospital', 'mhrs', 'موعد طبيب',
            'تقرير طبي', 'علاج',
        ],
        officialUrl: 'https://www.saglik.gov.tr/',
        appointment: { url: 'https://mhrs.gov.tr/', label: 'حجز موعد طبي عبر MHRS' },
    },
    {
        id: 'gocmen-saglik',
        ar: 'مركز صحة المهاجرين',
        tr: 'Göçmen Sağlığı Merkezi',
        groupId: 'social',
        icon: HeartPulse,
        what: 'رعاية صحية أولية بكوادر عربية للسوريين وحاملي الحماية المؤقتة.',
        aliases: [
            'مركز صحة المهاجرين', 'مركز صحي', 'العيادة', 'مركز صحة اللاجئين',
            'gocmen sagligi', 'göçmen sağlığı merkezi', 'gsm', 'sihhat',
            'طبيب عربي', 'عيادة سوريين',
        ],
        officialUrl: 'https://www.saglik.gov.tr/',
    },
    {
        id: 'kizilay',
        ar: 'الهلال الأحمر التركي (Kızılay)',
        tr: 'Kızılay Toplum Merkezi',
        groupId: 'social',
        icon: HandHeart,
        what: 'كرت الهلال الأحمر، المساعدات النقدية والعينية، والدعم الاجتماعي.',
        aliases: [
            'الهلال الاحمر', 'الهلال الأحمر', 'كرت الهلال', 'كزيلاي',
            'kizilay', 'kızılay', 'red crescent', 'مساعدة', 'كرت المساعدة', 'ssc',
        ],
        officialUrl: 'https://www.kizilay.org.tr/',
    },
    {
        id: 'visa-center',
        ar: 'مركز طلبات التأشيرات',
        tr: 'Vize Başvuru Merkezi',
        groupId: 'missions',
        icon: Plane,
        what: 'تسليم ملفات تأشيرات شنغن وغيرها عبر مراكز الطلبات المعتمدة (iDATA وVFS Global).',
        aliases: [
            'مركز التأشيرات', 'مركز الفيزا', 'الفيزا', 'تأشيرة', 'تاشيرة', 'شنغن',
            'idata', 'i̇data', 'vfs', 'vfs global', 'visa center', 'vize', 'schengen',
        ],
        cities: ['istanbul', 'ankara', 'izmir', 'antalya', 'bursa', 'gaziantep'],
    },
];

export const officeKindById = (id: string): OfficeKind | undefined =>
    OFFICE_KINDS.find((k) => k.id === id);

// ============================================================================
// 🌍 السفارات والقنصليات — the 'single' places
// ============================================================================
//
// ⚠️ ONLY missions we are confident exist are listed. Turkey hosts far more
// consulates than this; the ones we left out are the ones we could not vouch
// for. `consulates` holds the city slugs where the country runs a Consulate
// General; `embassy: true` means it has an embassy in Ankara. If you add a
// country, verify the mission before you add the city — see the honesty rule
// at the top of this file.

/**
 * A stored, human-readable location for a specific mission.
 *
 * We DO store street addresses (they change once every few years, not weekly,
 * and a visible address is what people copy, send to a driver, or check before
 * they leave the house). What we do NOT do is present a stored address as the
 * only truth:
 *   • `verifiedOn` is shown on the page, so the visitor judges its freshness.
 *   • Every page also carries a «الموقع تغيّر؟ ابحث بالاسم في جوجل» link that
 *     runs a live Maps search by the official name — the escape hatch for the
 *     day the mission moves and we have not caught up yet.
 *   • A mission with no verified address simply omits this block and falls back
 *     to the live search. Never guess an address to fill the gap.
 *
 * `source` records where the value came from so the next maintainer can
 * re-check it instead of re-researching from zero.
 */
export interface PlaceContact {
    /** Street address as published, in Turkish — the form a taxi driver reads. */
    address: string;
    /** Landline in local format; rendered as a tel: link. */
    phone?: string;
    /** Published counter hours, e.g. 'الاثنين–الجمعة 09:30–15:00'. */
    hours?: string;
    /** ISO date (YYYY-MM-DD) this was last checked. Shown to the visitor. */
    verifiedOn: string;
    /** Where it was checked — a domain or 'cross-checked directories'. */
    source: string;
    /**
     * A caveat the visitor needs before they travel — e.g. sources reporting
     * that consular services at this post are suspended or reduced. Rendered as
     * a warning, not hidden: an address that is right about the building but
     * wrong about it being open still wastes the trip.
     */
    note?: string;
}

/** One consulate of one country in one city. */
interface ConsulatePost {
    city: string;
    /**
     * Official Turkish name, when it is not the default
     * «<Country> Başkonsolosluğu». Germany's Antalya post, for instance, is a
     * plain `Konsolosluk` with a passport desk but no visa section — calling it
     * a Başkonsolosluk would send visa applicants to the wrong city.
     */
    titleTr?: string;
    /**
     * Honorary consulate (Fahri Konsolosluk). This matters a lot in practice:
     * an honorary consul cannot issue passports or legalise documents, so
     * sending a passport-seeker there wastes their day. Labelled explicitly.
     */
    honorary?: boolean;
    contact?: PlaceContact;
    officialUrl?: string;
}

interface MissionCountry {
    /** slug base, e.g. 'syria' → syria-consulate-istanbul */
    id: string;
    /** Arabic country name, e.g. 'سوريا'. */
    countryAr: string;
    /** Arabic adjective used in the label, e.g. 'السورية'. */
    adjAr: string;
    /** Turkish country name — the core of the Maps query. */
    tr: string;
    flag: string;
    /** Has an embassy in Ankara. */
    embassy: boolean;
    /** Verified details of the Ankara embassy, when we have them. */
    embassyContact?: PlaceContact;
    embassyUrl?: string;
    /** Consulate posts, by city. */
    consulates: ConsulatePost[];
    /** Extra search spellings. */
    aliases?: string[];
}

// Addresses below were gathered on 2026-07-26 by cross-checking the Turkish
// consulate directories against each mission's own site where it has one. They
// are the province + district + street form the missions themselves publish.
// Missions with no entry here deliberately carry no address — the page falls
// back to the live Maps search rather than showing a guess.
const V = '2026-07-26';
const DIRS = 'مقارنة أدلة القنصليات التركية';

/** الدول العربية — الجهة الأكثر بحثاً عند العرب في تركيا. */
const ARAB_MISSIONS: MissionCountry[] = [
    {
        id: 'syria', countryAr: 'سوريا', adjAr: 'السورية', tr: 'Suriye', flag: '🇸🇾',
        embassy: true,
        embassyContact: { address: 'Sedat Simavi Sok. No: 40, 06550 Çankaya, Ankara', phone: '0312 440 96 57', hours: 'الاثنين–الجمعة 08:30–15:00', verifiedOn: V, source: DIRS, note: 'بعض المصادر تشير إلى تعليق أو تقليص الخدمات القنصلية في هذا المقر — اتصل قبل التوجّه أو استخدم البحث الحيّ للتأكد.' }, aliases: ['سوري', 'syrian', 'suriye konsoloslugu'],
        consulates: [
            {
                city: 'istanbul',
                contact: {
                    address: 'Maçka Cad., Ralli Apt. No: 59, Kat: 3, Teşvikiye, Şişli, İstanbul',
                    phone: '0212 232 71 10',
                    hours: 'الاثنين–الجمعة 09:30–15:00',
                    verifiedOn: V, source: DIRS,
                },
            },
            {
                city: 'gaziantep',
                contact: {
                    address: 'Alleben Mah., Kemal Köker Cad. No: 16, Şahinbey, Gaziantep',
                    phone: '0342 232 60 47',
                    hours: 'الاثنين–الجمعة 08:30–15:00',
                    verifiedOn: V, source: DIRS,
                },
            },
        ],
    },
    {
        id: 'egypt', countryAr: 'مصر', adjAr: 'المصرية', tr: 'Mısır', flag: '🇪🇬',
        embassy: true,
        embassyContact: { address: 'Atatürk Bulvarı No: 26, Kavaklıdere, Çankaya, Ankara', phone: '0312 426 10 26', hours: 'الاثنين–الجمعة 09:00–12:00 و14:00–17:00', verifiedOn: V, source: DIRS }, aliases: ['مصري', 'egypt', 'egyptian', 'misir'],
        consulates: [{
            city: 'istanbul',
            contact: {
                address: 'Cevdetpaşa Cad. No: 12, Bebek, Beşiktaş, 34330 İstanbul',
                phone: '0212 324 21 33',
                hours: 'الاثنين–الجمعة 10:00–16:00',
                verifiedOn: V, source: DIRS,
            },
        }],
    },
    {
        id: 'saudi', countryAr: 'السعودية', adjAr: 'السعودية', tr: 'Suudi Arabistan', flag: '🇸🇦',
        embassy: true,
        embassyContact: { address: 'Gaziosmanpaşa Mah., Turan Emeksiz Sok. No: 6, 06700 Çankaya, Ankara', phone: '0312 468 55 40', hours: 'الاثنين–الجمعة 09:00–15:00', verifiedOn: V, source: 'mofa.gov.sa' }, aliases: ['سعودي', 'saudi', 'المملكة العربية السعودية', 'suudi'],
        consulates: [{
            city: 'istanbul',
            contact: {
                address: 'Konaklar Mah., Çamlık Cad., Akasyalı Sok. No: 6, 4. Levent, Beşiktaş, İstanbul',
                phone: '0212 281 91 40',
                hours: 'الاثنين–الجمعة 09:00–15:00',
                verifiedOn: V, source: DIRS,
            },
        }],
    },
    {
        id: 'iraq', countryAr: 'العراق', adjAr: 'العراقية', tr: 'Irak', flag: '🇮🇶',
        embassy: true,
        embassyContact: { address: 'Turan Emeksiz Sok. No: 11, Gaziosmanpaşa, Çankaya, Ankara', phone: '0312 468 74 21', hours: 'الاثنين–الجمعة 09:00–15:00', verifiedOn: V, source: DIRS }, aliases: ['عراقي', 'iraq', 'iraqi'],
        consulates: [{
            city: 'istanbul',
            contact: {
                address: 'Esentepe Mah., Hikaye Sok. No: 3, 34394 Şişli, İstanbul',
                phone: '0212 299 67 29',
                hours: 'الاثنين–الجمعة 09:00–16:00',
                verifiedOn: V, source: DIRS,
            },
        }],
    },
    {
        id: 'jordan', countryAr: 'الأردن', adjAr: 'الأردنية', tr: 'Ürdün', flag: '🇯🇴',
        embassy: true,
        embassyContact: { address: 'Mesnevi, Dede Korkut Sok. No: 18, Çankaya, Ankara', phone: '0312 440 20 54', verifiedOn: V, source: DIRS }, aliases: ['اردني', 'أردني', 'jordan', 'urdun'],
        // Honorary post. Directories first looked split (Kalıpçı Sok. vs
        // Büyükdere Cad.); a follow-up check settled it on Büyükdere — the
        // Kalıpçı listing belongs to a different, older record.
        consulates: [{
            city: 'istanbul', honorary: true,
            contact: {
                address: 'Büyükdere Cad. No: 155/3, Zincirlikuyu, Şişli, İstanbul',
                verifiedOn: V, source: DIRS,
            },
        }],
    },
    {
        id: 'lebanon', countryAr: 'لبنان', adjAr: 'اللبنانية', tr: 'Lübnan', flag: '🇱🇧',
        embassy: true,
        embassyContact: { address: 'Kızkulesi Sok. No: 44, Gaziosmanpaşa, Çankaya, Ankara', phone: '0312 446 74 85', hours: 'الاثنين–الجمعة 09:00–15:00', verifiedOn: V, source: DIRS }, aliases: ['لبناني', 'lebanon', 'lubnan'],
        consulates: [{
            city: 'istanbul',
            officialUrl: 'http://istanbul.mfa.gov.lb/turkey/turkish/contact-us',
            contact: {
                address: 'Teşvikiye Mah., Hüsrev Gerede Cad. No: 106, Şişli, İstanbul',
                phone: '0212 236 13 65',
                hours: 'الاثنين–الجمعة 09:00–15:00',
                verifiedOn: V, source: 'istanbul.mfa.gov.lb',
            },
        }],
    },
    {
        id: 'palestine', countryAr: 'فلسطين', adjAr: 'الفلسطينية', tr: 'Filistin', flag: '🇵🇸',
        embassy: true,
        embassyContact: { address: 'Kılıç Ali Cad. No: 5, Diplomatik Site, 06450 Oran, Çankaya, Ankara', phone: '0312 490 35 46', hours: 'الاثنين–الجمعة 08:30–15:00', verifiedOn: V, source: 'embassyofpalestine.org.tr' }, embassyUrl: 'https://www.embassyofpalestine.org.tr/tr-tr',
        aliases: ['فلسطيني', 'palestine', 'filistin'],
        consulates: [{
            city: 'istanbul',
            officialUrl: 'https://consulateofpalestine.com.tr/',
            contact: {
                address: 'Topçular Mah., Topçular Cad. No: 40, Eyüpsultan, İstanbul',
                phone: '0212 493 34 70',
                hours: 'الاثنين–الجمعة 08:30–15:30',
                verifiedOn: V, source: 'consulateofpalestine.com.tr',
            },
        }],
    },
    {
        id: 'yemen', countryAr: 'اليمن', adjAr: 'اليمنية', tr: 'Yemen', flag: '🇾🇪',
        embassy: true,
        embassyContact: { address: 'Fethiye Sok. No: 2, 06700 Gaziosmanpaşa, Çankaya, Ankara', phone: '0312 446 26 37', hours: 'الاثنين–الجمعة 08:30–15:00', verifiedOn: V, source: DIRS }, embassyUrl: 'https://yemenembassytr.org/',
        aliases: ['يمني', 'yemen'],
        consulates: [{
            city: 'istanbul', honorary: true,
            contact: {
                address: 'Halaskargazi Cad., Uygar Apt. No: 43, Kat: 5, Harbiye, Şişli, İstanbul',
                phone: '0212 233 31 17',
                verifiedOn: V, source: 'yemenembassytr.org',
            },
        }],
    },
    {
        id: 'sudan', countryAr: 'السودان', adjAr: 'السودانية', tr: 'Sudan', flag: '🇸🇩',
        embassy: true,
        embassyContact: { address: 'Mahatma Gandi Cad. No: 48, Gaziosmanpaşa, Çankaya, Ankara', phone: '0312 446 63 27', verifiedOn: V, source: 'sudanembassy-turkiye.net' }, aliases: ['سوداني', 'sudan'],
        consulates: [{
            city: 'istanbul',
            officialUrl: 'https://sudanist.com/',
            contact: {
                address: 'Levent Mah., Menekşeli Sok. No: 16, 1. Levent, 34330 Beşiktaş, İstanbul',
                phone: '0212 281 74 41',
                hours: 'الاثنين–الجمعة 09:00–15:30',
                verifiedOn: V, source: 'sudanist.com',
            },
        }],
    },
    {
        id: 'libya', countryAr: 'ليبيا', adjAr: 'الليبية', tr: 'Libya', flag: '🇱🇾',
        embassy: true,
        embassyContact: { address: 'Cinnah Cad. No: 60, 06690 Çankaya, Ankara', phone: '0312 438 11 10', hours: 'الاثنين–الجمعة 09:00–15:00', verifiedOn: V, source: DIRS }, aliases: ['ليبي', 'libya'],
        consulates: [{
            city: 'istanbul',
            contact: {
                address: 'Gümüşsuyu Mah., İnönü Cad., Miralay Şefik Bey Sok. No: 3, Beyoğlu, İstanbul',
                phone: '0212 251 81 00',
                hours: 'الاثنين–الجمعة 10:00–16:00',
                verifiedOn: V, source: DIRS,
            },
        }],
    },
    {
        id: 'morocco', countryAr: 'المغرب', adjAr: 'المغربية', tr: 'Fas', flag: '🇲🇦',
        embassy: true,
        embassyContact: { address: '100. Yıl Mah., Fıskiye Sok. No: 22, Gaziosmanpaşa, Çankaya, Ankara', phone: '0312 437 60 20', hours: 'الاثنين–الجمعة 09:00–16:00', verifiedOn: V, source: 'maec.gov.ma' }, aliases: ['مغربي', 'morocco', 'fas'],
        consulates: [{
            city: 'istanbul',
            contact: {
                address: 'Levazım Mah., Korukent Sitesi, Beyaz Köşk No: 46/2, Beşiktaş, İstanbul',
                phone: '0212 258 15 98',
                hours: 'الاثنين–الجمعة 09:00–16:00',
                verifiedOn: V, source: DIRS,
            },
        }],
    },
    {
        id: 'tunisia', countryAr: 'تونس', adjAr: 'التونسية', tr: 'Tunus', flag: '🇹🇳',
        embassy: true,
        embassyContact: { address: 'Ferit Recai Ertuğrul Cad. No: 19, Diplomatik Site, Oran, Çankaya, Ankara', phone: '0312 491 96 35', verifiedOn: V, source: DIRS }, aliases: ['تونسي', 'tunisia', 'tunus'],
        consulates: [{
            city: 'istanbul',
            contact: {
                address: 'Esentepe Mah., Keskin Kalem Sok. No: 31, Şişli, İstanbul',
                phone: '0212 217 41 56',
                verifiedOn: V, source: DIRS,
            },
        }],
    },
    {
        id: 'algeria', countryAr: 'الجزائر', adjAr: 'الجزائرية', tr: 'Cezayir', flag: '🇩🇿',
        embassy: true,
        embassyContact: { address: 'Şehit Ersan Cad. No: 42, 06680 Çankaya, Ankara', phone: '0312 468 77 19', hours: 'الاثنين–الخميس 09:00–12:00 و13:00–17:00', verifiedOn: V, source: 'embankara.mfa.gov.dz' }, aliases: ['جزائري', 'algeria', 'cezayir'],
        consulates: [{
            city: 'istanbul',
            officialUrl: 'https://cgistanbul.mfa.gov.dz/tr/contact',
            contact: {
                address: 'Gazeteciler Sitesi, 23 Temmuz Meydanı No: 7, 34394 Şişli, İstanbul',
                phone: '0212 356 95 16',
                hours: 'الاثنين–الجمعة 09:00–17:00',
                verifiedOn: V, source: 'cgistanbul.mfa.gov.dz',
            },
        }],
    },
    {
        id: 'kuwait', countryAr: 'الكويت', adjAr: 'الكويتية', tr: 'Kuveyt', flag: '🇰🇼',
        embassy: true,
        embassyContact: { address: 'Kazım Özalp, Reşit Galip Cad. No: 110, 06700 Çankaya, Ankara', phone: '0312 445 05 76', hours: 'الاثنين–الجمعة 09:00–16:00', verifiedOn: V, source: 'kuwaitembassy.org.tr' }, embassyUrl: 'http://kuwaitembassy.org.tr/',
        aliases: ['كويتي', 'kuwait', 'kuveyt'],
        consulates: [{
            city: 'istanbul',
            contact: {
                address: 'Akat Mah., Cebeci Cad. No: 22, Beşiktaş, İstanbul',
                phone: '0212 351 18 88',
                hours: 'الاثنين–الجمعة 09:00–15:00',
                verifiedOn: V, source: DIRS,
            },
        }],
    },
    {
        id: 'qatar', countryAr: 'قطر', adjAr: 'القطرية', tr: 'Katar', flag: '🇶🇦',
        embassy: true,
        embassyContact: { address: 'Bakü Sok. No: 6, Diplomatik Site, 06450 Oran, Çankaya, Ankara', phone: '0312 490 72 74', hours: 'الاثنين–الجمعة 09:00–15:00', verifiedOn: V, source: DIRS }, aliases: ['قطري', 'qatar', 'katar'],
        consulates: [{
            city: 'istanbul',
            contact: {
                address: 'Yeniköy Mah., İstinye Mevkii, Balbandere Cad., Hilpark Suites No: 2, 34464 Sarıyer, İstanbul',
                phone: '0212 229 99 55',
                hours: 'الاثنين–الجمعة 09:00–15:00',
                verifiedOn: V, source: DIRS,
            },
        }],
    },
    {
        id: 'uae', countryAr: 'الإمارات', adjAr: 'الإماراتية', tr: 'Birleşik Arap Emirlikleri', flag: '🇦🇪',
        embassy: true,
        embassyContact: { address: 'Turan Güneş Bulvarı, Galip Erdem Cad., 613. Sok. No: 13, Çankaya, Ankara', phone: '0312 490 14 14', verifiedOn: V, source: 'mofa.gov.ae' }, aliases: ['اماراتي', 'الامارات', 'uae', 'emirates', 'dubai', 'bae'],
        consulates: [{
            city: 'istanbul',
            officialUrl: 'https://www.mofa.gov.ae/tr-tr/missions/istanbul',
            contact: {
                address: 'Konaklar Mah., Meşeli Sok. No: 11, 4. Levent, Beşiktaş, 34330 İstanbul',
                phone: '0212 317 92 57',
                hours: 'الاثنين–الجمعة 09:00–16:00',
                verifiedOn: V, source: 'mofa.gov.ae',
            },
        }],
    },
    {
        id: 'bahrain', countryAr: 'البحرين', adjAr: 'البحرينية', tr: 'Bahreyn', flag: '🇧🇭',
        embassy: true,
        embassyContact: { address: 'İlkbahar Mah., 606. Sok. No: 19, Oran, Çankaya, Ankara', phone: '0312 491 26 55', hours: 'الاثنين–الجمعة 09:00–15:00', verifiedOn: V, source: 'mofa.gov.bh' }, aliases: ['بحريني', 'bahrain', 'bahreyn'],
        consulates: [{
            city: 'istanbul', honorary: true,
            contact: {
                address: 'Fahrettin Kerim Gökay Cad. No: 36, Altunizade, Üsküdar, İstanbul',
                hours: 'الاثنين–الجمعة 09:00–15:00',
                verifiedOn: V, source: DIRS,
            },
        }],
    },
    { id: 'oman', countryAr: 'عُمان', adjAr: 'العُمانية', tr: 'Umman', flag: '🇴🇲', embassy: true,
        embassyContact: { address: 'Diplomatik Bölge, Besim Atalay Sok. No: 7, Oran, Çankaya, Ankara', phone: '0312 491 09 40', hours: 'الاثنين–الخميس 09:00–15:00، الجمعة 09:00–14:00', verifiedOn: V, source: 'mofa.gov.om' }, consulates: [], aliases: ['عمان', 'سلطنة عمان', 'oman', 'umman'] },
    {
        id: 'somalia', countryAr: 'الصومال', adjAr: 'الصومالية', tr: 'Somali', flag: '🇸🇴',
        embassy: true,
        embassyContact: { address: 'Kazım Özalp, Reşit Galip Cad. No: 100, 06700 Çankaya, Ankara', phone: '0312 436 40 28', hours: 'الاثنين–الجمعة 09:00–12:00 و13:00–17:00', verifiedOn: V, source: 'ankara.mfa.gov.so' }, embassyUrl: 'https://ankara.mfa.gov.so/',
        aliases: ['صومالي', 'somalia'],
        consulates: [{
            city: 'istanbul', honorary: true,
            contact: {
                address: 'Çobançeşme Mah., Kalender Sok. No: 8, Bahçelievler, İstanbul',
                phone: '0212 452 20 15',
                hours: 'الاثنين–الجمعة 09:00–17:00',
                verifiedOn: V, source: DIRS,
            },
        }],
    },
    { id: 'mauritania', countryAr: 'موريتانيا', adjAr: 'الموريتانية', tr: 'Moritanya', flag: '🇲🇷', embassy: true,
        embassyContact: { address: 'Oran Mah., Şemsettin Bayramoğlu Sok. No: 7, Çankaya, Ankara', phone: '0312 491 70 63', hours: 'الاثنين–الجمعة 09:00–12:00 و13:00–15:30', verifiedOn: V, source: DIRS }, consulates: [], aliases: ['موريتاني', 'mauritania', 'moritanya'] },
    { id: 'djibouti', countryAr: 'جيبوتي', adjAr: 'الجيبوتية', tr: 'Cibuti', flag: '🇩🇯', embassy: true,
        embassyContact: { address: 'İlkbahar Mah., Galip Erdem Cad., 613. Sok. No: 21, Yıldız, Çankaya, Ankara', phone: '0312 491 95 13', verifiedOn: V, source: 'djiboutiembassy.com.tr' }, consulates: [], aliases: ['جيبوتي', 'djibouti', 'cibuti'] },
];

/**
 * سفارات وقنصليات أجنبية — مطلوبة بكثرة لطلبات التأشيرات والهجرة.
 * No stored addresses yet: these are next in line for the same verification
 * pass the Arab missions above got. Until then their pages open the live Maps
 * search, which already answers "where is it" correctly.
 */
const INTL_MISSIONS: MissionCountry[] = [
    { id: 'usa', countryAr: 'أمريكا', adjAr: 'الأمريكية', tr: 'Amerika Birleşik Devletleri', flag: '🇺🇸', embassy: true, embassyContact: { address: 'Atatürk Bulvarı No: 110, Kavaklıdere, Çankaya, Ankara', phone: '0312 455 55 55', hours: 'الاثنين–الجمعة 08:30–17:30', verifiedOn: V, source: DIRS }, consulates: [{ city: 'istanbul', contact: { address: 'Kaplıcalar Mevkii Sok. No: 2, İstinye, Sarıyer, 34460 İstanbul', phone: '0212 335 90 00', hours: 'الاثنين–الجمعة 08:00–16:30', verifiedOn: V, source: DIRS } }], aliases: ['امريكا', 'الولايات المتحدة', 'usa', 'us', 'america', 'abd'] },
    { id: 'uk', countryAr: 'بريطانيا', adjAr: 'البريطانية', tr: 'Birleşik Krallık', flag: '🇬🇧', embassy: true, embassyContact: { address: 'Şehit Ersan Cad. No: 46/A, Çankaya, Ankara', phone: '0312 455 33 44', hours: 'الاثنين–الجمعة 09:00–17:00', verifiedOn: V, source: DIRS }, consulates: [{ city: 'istanbul', contact: { address: 'Kamer Hatun, Meşrutiyet Cad. No: 34, 34435 Tepebaşı, Beyoğlu, İstanbul', phone: '0212 334 64 00', hours: 'الاثنين–الجمعة 09:00–13:00 و14:00–17:00', verifiedOn: V, source: DIRS } }], aliases: ['بريطانيا', 'انجلترا', 'المملكة المتحدة', 'uk', 'britain', 'england', 'ingiltere'] },
    { id: 'germany', countryAr: 'ألمانيا', adjAr: 'الألمانية', tr: 'Almanya', flag: '🇩🇪', embassy: true, embassyContact: { address: 'Atatürk Bulvarı No: 114, Kavaklıdere, 06680 Çankaya, Ankara', phone: '0312 455 51 00', hours: 'الاثنين–الجمعة 09:00–16:00', verifiedOn: V, source: 'tuerkei.diplo.de' }, embassyUrl: 'https://tuerkei.diplo.de/tr-tr/vertretungen/botschaft', consulates: [{ city: 'istanbul', officialUrl: 'https://tuerkei.diplo.de/tr-tr/vertretungen/generalkonsulat-istanbul', contact: { address: 'İnönü Cad. No: 10, 34437 Gümüşsuyu, Beyoğlu, İstanbul', phone: '0212 334 61 00', hours: 'قسم التأشيرات: الاثنين–الجمعة 08:00–12:00', verifiedOn: V, source: 'tuerkei.diplo.de' } }, { city: 'izmir', officialUrl: 'https://tuerkei.diplo.de/tr-tr/vertretungen/generalkonsulat-izmir', contact: { address: 'Korutürk Mah., Havuzbaşı Sok. No: 1, 35330 Balçova, İzmir', phone: '0232 488 88 88', hours: 'الاثنين–الخميس 08:00–12:30 و13:00–17:15، الجمعة 08:00–14:00', verifiedOn: V, source: 'tuerkei.diplo.de' } }, { city: 'antalya', titleTr: 'Almanya Konsolosluğu', officialUrl: 'https://tuerkei.diplo.de/tr-tr/vertretungen/konsulat-antalya', contact: { address: 'Çağlayan Mah., Barınaklar Bulvarı No: 54, 07235 Muratpaşa, Antalya', phone: '0242 314 11 01', hours: 'الاثنين–الجمعة 09:00–12:00، والخميس أيضاً 14:00–16:30', verifiedOn: V, source: 'tuerkei.diplo.de', note: 'هذه قنصلية (Konsolosluk) وليست قنصلية عامة: فيها قسم جوازات لكن لا يوجد قسم تأشيرات — طلبات التأشيرة تُقدَّم في إسطنبول أو إزمير أو أنقرة.' } }], aliases: ['المانيا', 'germany', 'almanya', 'deutschland'] },
    { id: 'france', countryAr: 'فرنسا', adjAr: 'الفرنسية', tr: 'Fransa', flag: '🇫🇷', embassy: true, embassyContact: { address: 'Paris Cad. No: 70, Kavaklıdere, 06540 Çankaya, Ankara', phone: '0312 455 45 45', hours: 'قسم التأشيرات: الاثنين–الجمعة 08:30–13:00 و15:00–17:00', verifiedOn: V, source: 'tr.diplomatie.gouv.fr' }, embassyUrl: 'https://tr.diplomatie.gouv.fr/tr/fransanin-turkiye-buyukelciligi', consulates: [{ city: 'istanbul', officialUrl: 'https://tr.diplomatie.gouv.fr/tr/fransanin-istanbul-baskonsoloslugu', contact: { address: 'İstiklal Cad. No: 4, 34435 Taksim, Beyoğlu, İstanbul', phone: '0212 334 87 30', hours: 'الاثنين–الجمعة 09:00–13:00 و14:00–17:00 — بموعد مسبق فقط', verifiedOn: V, source: 'tr.diplomatie.gouv.fr' } }], aliases: ['فرنسا', 'france', 'fransa'] },
    { id: 'netherlands', countryAr: 'هولندا', adjAr: 'الهولندية', tr: 'Hollanda', flag: '🇳🇱', embassy: true, embassyContact: { address: 'Hilal Mah., Turan Güneş Bulvarı, Hollanda Cad. No: 5, 06550 Çankaya, Ankara', phone: '0312 409 18 00', hours: 'الاثنين–الجمعة 08:30–17:00', verifiedOn: V, source: DIRS }, consulates: [{ city: 'istanbul', contact: { address: 'İstiklal Cad. No: 197, 34433 Beyoğlu, İstanbul', phone: '0212 393 21 21', hours: 'الاثنين–الجمعة 09:00–17:00 — قسم التأشيرات 08:30–12:00', verifiedOn: V, source: DIRS } }], aliases: ['هولندا', 'netherlands', 'holland', 'hollanda'] },
    { id: 'italy', countryAr: 'إيطاليا', adjAr: 'الإيطالية', tr: 'İtalya', flag: '🇮🇹', embassy: true, embassyContact: { address: 'Atatürk Bulvarı No: 118, 06680 Kavaklıdere, Çankaya, Ankara', phone: '0312 457 42 00', hours: 'القسم القنصلي: الاثنين–الجمعة 09:30–12:00 بموعد', verifiedOn: V, source: 'ambankara.esteri.it' }, embassyUrl: 'https://ambankara.esteri.it/tr/chi-siamo/contatti/', consulates: [{ city: 'istanbul', officialUrl: 'https://consistanbul.esteri.it/tr/', contact: { address: 'Tomtom Kaptan Sok. No: 5, Beyoğlu, İstanbul', phone: '0212 243 10 24', hours: 'الاثنين–الخميس 08:30–16:30، الجمعة 08:30–14:00', verifiedOn: V, source: 'consistanbul.esteri.it' } }, { city: 'izmir', titleTr: 'İtalya Konsolosluğu', officialUrl: 'https://consizmir.esteri.it/tr/', contact: { address: 'Akdeniz Mah., Şehit Fethi Bey Cad. No: 55, Konak, İzmir', phone: '0232 463 66 76', hours: 'الاثنين–الجمعة 09:00–17:00', verifiedOn: V, source: 'consizmir.esteri.it' } }], aliases: ['ايطاليا', 'italy', 'italya'] },
    { id: 'spain', countryAr: 'إسبانيا', adjAr: 'الإسبانية', tr: 'İspanya', flag: '🇪🇸', embassy: true, embassyContact: { address: 'Prof. Dr. Aziz Sancar Cad. No: 8, Çankaya, Ankara', phone: '0312 438 03 92', hours: 'الاثنين–الجمعة 09:00–16:30 — التأشيرات 09:30–12:00', verifiedOn: V, source: 'exteriores.gob.es' }, embassyUrl: 'https://www.exteriores.gob.es/Embajadas/ankara/tr/Embajada/Paginas/Contacto.aspx', consulates: [{ city: 'istanbul', officialUrl: 'https://www.exteriores.gob.es/Consulados/estambul/tr/Paginas/index.aspx', contact: { address: 'Karanfil Aralığı Sok. No: 16, 1. Levent, 34330 Beşiktaş, İstanbul', phone: '0212 270 74 10', hours: 'الاثنين–الجمعة 09:00–13:00', verifiedOn: V, source: 'exteriores.gob.es' } }], aliases: ['اسبانيا', 'spain', 'ispanya'] },
    { id: 'greece', countryAr: 'اليونان', adjAr: 'اليونانية', tr: 'Yunanistan', flag: '🇬🇷', embassy: true, embassyContact: { address: 'Ziaur Rahman Cad. No: 9-11, 06700 Gaziosmanpaşa, Çankaya, Ankara', phone: '0312 448 06 47', hours: 'الاثنين–الجمعة 09:00–16:00', verifiedOn: V, source: 'mfa.gr' }, embassyUrl: 'https://www.mfa.gr/turkey/tr/the-embassy', consulates: [{ city: 'istanbul', officialUrl: 'https://www.mfa.gr/turkey/tr/contact/contact-our-missions-in-turkey/consulate-general-in-istanbul.html', contact: { address: 'Turnacıbaşı Sok. No: 22, 34433 Beyoğlu, İstanbul', phone: '0212 393 82 90', hours: 'الاثنين–الجمعة 09:00–13:30', verifiedOn: V, source: 'mfa.gr' } }, { city: 'izmir', officialUrl: 'https://www.mfa.gr/turkey/tr/contact/contact-our-missions-in-turkey/consulate-general-in-izmir.html', contact: { address: 'Atatürk Cad. No: 262, Alsancak, Konak, İzmir', phone: '0232 464 31 60', hours: 'الاثنين–الجمعة 09:00–16:00 — التأشيرات بموعد مسبق', verifiedOn: V, source: 'mfa.gr' } }], aliases: ['اليونان', 'greece', 'yunanistan'] },
    { id: 'sweden', countryAr: 'السويد', adjAr: 'السويدية', tr: 'İsveç', flag: '🇸🇪', embassy: true, embassyContact: { address: 'Katip Çelebi Sok. No: 7, 06692 Kavaklıdere, Çankaya, Ankara', phone: '0312 455 41 00', hours: 'الاثنين–الخميس 08:00–16:45، الجمعة 08:00–14:30', verifiedOn: V, source: 'swedenabroad.se' }, embassyUrl: 'https://www.swedenabroad.se/en/embassies/turkey-ankara/', consulates: [{ city: 'istanbul', contact: { address: 'Şahkulu Mah., İstiklal Cad., Beyoğlu, İstanbul', phone: '0212 334 06 00', hours: 'الاثنين–الخميس 10:30–12:30', verifiedOn: V, source: DIRS } }], aliases: ['السويد', 'sweden', 'isvec'] },
    { id: 'canada', countryAr: 'كندا', adjAr: 'الكندية', tr: 'Kanada', flag: '🇨🇦', embassy: true, embassyContact: { address: 'Cinnah Cad. No: 58, 06690 Çankaya, Ankara', phone: '0312 409 27 00', hours: 'الاثنين–الخميس 08:30–17:45، الجمعة 08:30–13:00', verifiedOn: V, source: 'international.gc.ca' }, embassyUrl: 'https://www.international.gc.ca/country-pays/turkiye/ankara.aspx?lang=eng', consulates: [{ city: 'istanbul', contact: { address: 'Büyükdere Cad., Tekfen Tower Kat: 16, 4. Levent, 34394 İstanbul', phone: '0212 385 97 00', hours: 'الاثنين–الخميس 08:30–16:45، الجمعة 08:30–13:00', verifiedOn: V, source: DIRS } }], aliases: ['كندا', 'canada', 'kanada'] },
    { id: 'russia', countryAr: 'روسيا', adjAr: 'الروسية', tr: 'Rusya', flag: '🇷🇺', embassy: true, embassyContact: { address: 'Karyağdı Sok. No: 5, 06692 Çankaya, Ankara', phone: '0312 440 94 85', hours: 'القسم القنصلي: الاثنين والأربعاء والجمعة 09:00–12:00', verifiedOn: V, source: DIRS }, consulates: [{ city: 'istanbul', contact: { address: 'İstiklal Cad. No: 219-225A, 34433 Beyoğlu, İstanbul', phone: '0212 292 51 01', hours: 'الاثنين–الجمعة 08:30–13:00 و14:30–18:00', verifiedOn: V, source: DIRS } }, { city: 'antalya', officialUrl: 'https://antalya.mid.ru/tr/', contact: { address: 'Çağlayan Mah., 2011. Sok. No: 10, Muratpaşa, Antalya', phone: '0242 248 32 02', hours: 'الاثنين–الجمعة 09:00–18:00', verifiedOn: V, source: 'antalya.mid.ru' } }], aliases: ['روسيا', 'russia', 'rusya'] },
    { id: 'iran', countryAr: 'إيران', adjAr: 'الإيرانية', tr: 'İran', flag: '🇮🇷', embassy: true, embassyContact: { address: 'Tahran Cad. No: 10, Kavaklıdere, Çankaya, Ankara', phone: '0312 457 41 00', hours: 'الاثنين–الجمعة 08:00–18:00', verifiedOn: V, source: 'turkey.mfa.gov.ir' }, embassyUrl: 'https://turkey.mfa.gov.ir/tr', consulates: [{ city: 'istanbul', contact: { address: 'Ankara Cad. No: 1, Cağaloğlu, Fatih, İstanbul', phone: '0212 513 82 30', hours: 'الاثنين–الجمعة 08:00–16:00', verifiedOn: V, source: DIRS } }], aliases: ['ايران', 'iran'] },
    { id: 'azerbaijan', countryAr: 'أذربيجان', adjAr: 'الأذربيجانية', tr: 'Azerbaycan', flag: '🇦🇿', embassy: true, embassyContact: { address: 'Diplomatik Site, Bakü Sok. No: 1, 06450 Oran, Çankaya, Ankara', phone: '0312 491 16 81', verifiedOn: V, source: 'ankara.mfa.gov.az' }, embassyUrl: 'https://ankara.mfa.gov.az/tr/content/6/iletisim', consulates: [{ city: 'istanbul', officialUrl: 'https://istanbul.mfa.gov.az/tr', contact: { address: 'Zeytinoğlu Cad. No: 65, Akatlar, Beşiktaş, İstanbul', phone: '0212 325 80 42', verifiedOn: V, source: 'istanbul.mfa.gov.az' } }], aliases: ['اذربيجان', 'azerbaijan', 'azerbaycan'] },
    { id: 'pakistan', countryAr: 'باكستان', adjAr: 'الباكستانية', tr: 'Pakistan', flag: '🇵🇰', embassy: true, embassyContact: { address: 'Gaziosmanpaşa Mah., İran Cad. No: 37, 06700 Çankaya, Ankara', phone: '0312 427 14 10', hours: 'الاثنين–الجمعة 08:30–17:00', verifiedOn: V, source: DIRS }, embassyUrl: 'https://www.pakembassyankara.com/', consulates: [{ city: 'istanbul', contact: { address: 'Konaklar Mah., Akağaç Sok. No: 2, 4. Levent, 34330 Beşiktaş, İstanbul', phone: '0212 324 91 54', verifiedOn: V, source: DIRS } }], aliases: ['باكستان', 'pakistan'] },
];

// ============================================================================
// 📦 النموذج الموحّد — every place, one flat shape, one flat route
// ============================================================================

export type PlaceKind = 'single' | 'nearby';

export interface OfficialPlace {
    /** URL slug → /places/<slug> */
    slug: string;
    kind: PlaceKind;
    groupId: PlaceGroupId;
    /** Full Arabic title including the city ("القنصلية السورية في إسطنبول"). */
    ar: string;
    /** Short Arabic label without the city, for chips and lists. */
    shortAr: string;
    /** Turkish/official name, shown so visitors can read the signage. */
    tr: string;
    citySlug: string;
    cityAr: string;
    cityTr: string;
    /** Exact string handed to Google Maps — see the honesty rule at the top. */
    mapQuery: string;
    /** What a visitor gets done at this place. */
    what: string;
    /** Everything that should match this place in search, space-joined later. */
    aliases: string[];
    icon: LucideIcon;
    flag?: string;
    officialUrl?: string;
    appointment?: { url: string; label: string };
    /** Set on 'nearby' places so the copy can say "الأقرب إليك" honestly. */
    officeKindId?: string;
    /** Missions only — splits the hub into «عربية» / «أجنبية». */
    region?: 'arab' | 'intl';
    /** Missions only. `honorary` cannot issue passports — surfaced in the UI. */
    missionType?: 'embassy' | 'consulate' | 'honorary';
    /**
     * Verified street address / phone / hours, when we have them. Absent means
     * "we have no address we can stand behind" — the page then leads with the
     * live Maps search instead of a guess.
     */
    contact?: PlaceContact;
}

function buildMissionPlaces(list: MissionCountry[], region: 'arab' | 'intl'): OfficialPlace[] {
    const out: OfficialPlace[] = [];
    const groupId: PlaceGroupId = 'missions';

    for (const m of list) {
        const sharedAliases = [
            m.countryAr, m.adjAr, m.tr, m.id,
            ...(m.aliases || []),
        ];

        if (m.embassy) {
            const city = placeCityBySlug('ankara')!;
            out.push({
                slug: `${m.id}-embassy-ankara`,
                kind: 'single',
                groupId,
                ar: `سفارة ${m.countryAr} في أنقرة`,
                shortAr: `سفارة ${m.countryAr}`,
                tr: `${m.tr} Büyükelçiliği`,
                citySlug: city.slug,
                cityAr: city.ar,
                cityTr: city.tr,
                mapQuery: `${m.tr} Büyükelçiliği Ankara`,
                what: `المعاملات القنصلية الرسمية لمواطني ${m.countryAr}: الجوازات، الوكالات، التصديق، وطلبات التأشيرة.`,
                aliases: [
                    ...sharedAliases, ...city.aliases,
                    'سفارة', 'السفارة', 'سفاره', 'embassy', 'buyukelcilik', 'büyükelçilik',
                    `سفارة ${m.countryAr}`, `السفارة ${m.adjAr}`,
                ],
                icon: Landmark,
                flag: m.flag,
                region,
                missionType: 'embassy',
                officialUrl: m.embassyUrl,
                contact: m.embassyContact,
            });
        }

        for (const post of m.consulates) {
            const city = placeCityBySlug(post.city);
            if (!city) continue;

            // An honorary consul is a local representative, not a career
            // diplomat with a passport counter. Saying so up front is the whole
            // point — «القنصلية اليمنية» sent someone after a passport to an
            // office that cannot issue one.
            const trName = post.titleTr
                ?? (post.honorary
                    ? `${m.tr} Fahri Konsolosluğu`
                    : `${m.tr} Başkonsolosluğu`);

            out.push({
                slug: `${m.id}-consulate-${city.slug}`,
                kind: 'single',
                groupId,
                ar: post.honorary
                    ? `القنصلية الفخرية ${m.adjAr} في ${city.ar}`
                    : `القنصلية ${m.adjAr} في ${city.ar}`,
                shortAr: post.honorary
                    ? `القنصلية الفخرية ${m.adjAr}`
                    : `القنصلية ${m.adjAr}`,
                tr: trName,
                citySlug: city.slug,
                cityAr: city.ar,
                cityTr: city.tr,
                mapQuery: `${trName} ${city.tr}`,
                what: post.honorary
                    ? `قنصلية فخرية: تقدّم معلومات ومساعدة محدودة، ولا تُصدر جوازات ولا وثائق رسمية ولا تصدّق أوراقاً. للمعاملات الرسمية لمواطني ${m.countryAr} راجع السفارة في أنقرة.`
                    : `المعاملات القنصلية لمواطني ${m.countryAr} في ${city.ar}: الجوازات، الوثائق، الوكالات، والتصديق.`,
                aliases: [
                    ...sharedAliases, ...city.aliases,
                    'قنصلية', 'القنصلية', 'قنصليه', 'القنصليه', 'consulate',
                    'konsolosluk', 'baskonsolosluk', 'başkonsolosluk',
                    `قنصلية ${m.countryAr}`, `القنصلية ${m.adjAr}`,
                    ...(post.honorary ? ['فخرية', 'قنصلية فخرية', 'fahri', 'fahri konsolosluk', 'honorary'] : []),
                ],
                icon: Landmark,
                flag: m.flag,
                region,
                missionType: post.honorary ? 'honorary' : 'consulate',
                officialUrl: post.officialUrl,
                contact: post.contact,
            });
        }
    }

    return out;
}

function buildOfficePlaces(): OfficialPlace[] {
    const out: OfficialPlace[] = [];

    for (const kind of OFFICE_KINDS) {
        const cities = kind.cities
            ? kind.cities.map(placeCityBySlug).filter((c): c is PlaceCity => Boolean(c))
            : PLACE_CITIES;

        for (const city of cities) {
            out.push({
                slug: `${kind.id}-${city.slug}`,
                kind: 'nearby',
                groupId: kind.groupId,
                ar: `${kind.ar} في ${city.ar}`,
                shortAr: kind.ar,
                tr: `${kind.tr} — ${city.tr}`,
                citySlug: city.slug,
                cityAr: city.ar,
                cityTr: city.tr,
                mapQuery: `${kind.tr} ${city.tr}`,
                what: kind.what,
                aliases: [
                    ...kind.aliases, ...city.aliases, city.ar, kind.ar,
                    `${kind.ar} ${city.ar}`,
                ],
                icon: kind.icon,
                officialUrl: kind.officialUrl,
                appointment: kind.appointment,
                officeKindId: kind.id,
            });
        }
    }

    return out;
}

/** Every place the site knows about, built once at module load. */
export const OFFICIAL_PLACES: OfficialPlace[] = [
    ...buildMissionPlaces(ARAB_MISSIONS, 'arab'),
    ...buildMissionPlaces(INTL_MISSIONS, 'intl'),
    ...buildOfficePlaces(),
];

/** Missions (kind: 'single'), Arab ones first — the audience we serve. */
export const MISSION_PLACES: OfficialPlace[] =
    OFFICIAL_PLACES.filter((p) => p.kind === 'single');

/** Office pages (kind: 'nearby'). */
export const OFFICE_PLACES: OfficialPlace[] =
    OFFICIAL_PLACES.filter((p) => p.kind === 'nearby');

/** The office page for a (kind, city) pair — the hub's city switcher uses it. */
export const officePlace = (kindId: string, citySlug: string): OfficialPlace | undefined =>
    PLACES_BY_SLUG.get(`${kindId}-${citySlug}`);

const PLACES_BY_SLUG = new Map(OFFICIAL_PLACES.map((p) => [p.slug, p]));

export const placeBySlug = (slug: string): OfficialPlace | undefined =>
    PLACES_BY_SLUG.get(slug);

export const placesInCity = (citySlug: string): OfficialPlace[] =>
    OFFICIAL_PLACES.filter((p) => p.citySlug === citySlug);

// ============================================================================
// 🔗 روابط الخرائط — the whole point
// ============================================================================

const mapsSearch = (q: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

/**
 * What Google Maps should be asked for. Two options, on purpose:
 *   • With a stored address → name + street address. That geocodes to the exact
 *     building, which is the whole benefit of storing the address: no guessing
 *     between three similarly-named pins.
 *   • Without one → the official name alone, a live search Maps resolves itself.
 */
const mapTarget = (place: OfficialPlace): string =>
    place.contact ? `${place.tr}, ${place.contact.address}` : place.mapQuery;

/** Opens the place on Google Maps — precise when we have the address. */
export const placeMapUrl = (place: OfficialPlace): string =>
    mapsSearch(mapTarget(place));

/** Turn-by-turn directions from wherever the visitor is standing. */
export const placeDirectionsUrl = (place: OfficialPlace): string =>
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapTarget(place))}`;

/**
 * The escape hatch, and the other half of the deal: a LIVE Maps search by the
 * official name only, ignoring anything we stored. This is what a visitor taps
 * when the mission has moved and our address is behind — Maps knows before we
 * do. Every place page shows it; pages with a stored address show it as the
 * «الموقع تغيّر؟» fallback.
 */
export const placeNameSearchUrl = (place: OfficialPlace): string =>
    mapsSearch(place.mapQuery);

/** True when we have an address we can stand behind for this place. */
export const hasStoredAddress = (place: OfficialPlace): boolean => Boolean(place.contact);

// ============================================================================
// 🔍 مدخلات البحث — feeds the global search box
// ============================================================================

export interface PlaceSearchEntry {
    id: string;
    title: string;
    desc: string;
    url: string;
    /** Space-joined aliases; searchIndex.ts normalises it into the haystack. */
    keywords: string;
    /** Direct Maps link, so search results can offer one-tap navigation. */
    mapUrl: string;
    icon: LucideIcon;
}

/**
 * One search entry per place. Titles carry the city name so a two-token query
 * like «القنصلية السورية إسطنبول» matches the title in full — that is the
 * +150 "all tokens in title" bonus in useGlobalSearch, which puts the exact
 * place the visitor asked for at the top.
 */
export function buildPlacesSearchEntries(): PlaceSearchEntry[] {
    return OFFICIAL_PLACES.map((p) => ({
        id: `place-${p.slug}`,
        title: p.ar,
        // A stored address in the result row answers "where is it" before the
        // visitor even taps — that is the point of storing it.
        desc: p.contact
            ? p.contact.address
            : p.kind === 'nearby'
                ? `اعرض أقرب ${p.shortAr} في ${p.cityAr} على خرائط جوجل`
                : `الموقع على خرائط جوجل + المعاملات والمواعيد`,
        url: `/places/${p.slug}`,
        keywords: [
            p.ar, p.tr, p.shortAr, p.cityAr, p.cityTr,
            // Street/district names are searchable too («قنصلية مجكا», «Levent»).
            ...(p.contact ? [p.contact.address] : []),
            ...p.aliases,
        ].join(' '),
        mapUrl: placeMapUrl(p),
        icon: p.icon,
    }));
}
