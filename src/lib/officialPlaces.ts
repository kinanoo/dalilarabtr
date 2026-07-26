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
// THE HONESTY RULE (read before adding data)
// ------------------------------------------
// We do NOT store street addresses or coordinates. Consulates relocate, Göç
// İdaresi branches move, offices split — a hard-coded address becomes a wrong
// address, and sending someone across İstanbul to a building that moved is
// worse than not answering. Instead every place carries a `mapQuery`: the
// official institution name as Google Maps knows it. The link opens a LIVE
// Maps search, so whatever Maps shows today — the current pin, the current
// phone number, the current opening hours, the reviews — is what the visitor
// gets. That is what "الموقع الحقيقي المحدّث" means in practice.
//
// Consequence: only add a place you are confident actually exists. A map query
// for a mission that was never opened resolves to noise, and noise is exactly
// what this module is meant to remove. Uncertain entries are left out on
// purpose (see the comments in ARAB_MISSIONS / INTL_MISSIONS).
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
    /** City slugs hosting a Consulate General. */
    consulates: string[];
    /** Extra search spellings. */
    aliases?: string[];
}

/** الدول العربية — الجهة الأكثر بحثاً عند العرب في تركيا. */
const ARAB_MISSIONS: MissionCountry[] = [
    { id: 'syria', countryAr: 'سوريا', adjAr: 'السورية', tr: 'Suriye', flag: '🇸🇾', embassy: true, consulates: ['istanbul', 'gaziantep'], aliases: ['سوري', 'syrian', 'suriye konsoloslugu'] },
    { id: 'egypt', countryAr: 'مصر', adjAr: 'المصرية', tr: 'Mısır', flag: '🇪🇬', embassy: true, consulates: ['istanbul'], aliases: ['مصري', 'egypt', 'egyptian', 'misir'] },
    { id: 'saudi', countryAr: 'السعودية', adjAr: 'السعودية', tr: 'Suudi Arabistan', flag: '🇸🇦', embassy: true, consulates: ['istanbul'], aliases: ['سعودي', 'saudi', 'المملكة العربية السعودية', 'suudi'] },
    { id: 'iraq', countryAr: 'العراق', adjAr: 'العراقية', tr: 'Irak', flag: '🇮🇶', embassy: true, consulates: ['istanbul'], aliases: ['عراقي', 'iraq', 'iraqi'] },
    { id: 'jordan', countryAr: 'الأردن', adjAr: 'الأردنية', tr: 'Ürdün', flag: '🇯🇴', embassy: true, consulates: ['istanbul'], aliases: ['اردني', 'أردني', 'jordan', 'urdun'] },
    { id: 'lebanon', countryAr: 'لبنان', adjAr: 'اللبنانية', tr: 'Lübnan', flag: '🇱🇧', embassy: true, consulates: ['istanbul'], aliases: ['لبناني', 'lebanon', 'lubnan'] },
    { id: 'palestine', countryAr: 'فلسطين', adjAr: 'الفلسطينية', tr: 'Filistin', flag: '🇵🇸', embassy: true, consulates: ['istanbul'], aliases: ['فلسطيني', 'palestine', 'filistin'] },
    { id: 'yemen', countryAr: 'اليمن', adjAr: 'اليمنية', tr: 'Yemen', flag: '🇾🇪', embassy: true, consulates: ['istanbul'], aliases: ['يمني', 'yemen'] },
    { id: 'sudan', countryAr: 'السودان', adjAr: 'السودانية', tr: 'Sudan', flag: '🇸🇩', embassy: true, consulates: ['istanbul'], aliases: ['سوداني', 'sudan'] },
    { id: 'libya', countryAr: 'ليبيا', adjAr: 'الليبية', tr: 'Libya', flag: '🇱🇾', embassy: true, consulates: ['istanbul'], aliases: ['ليبي', 'libya'] },
    { id: 'morocco', countryAr: 'المغرب', adjAr: 'المغربية', tr: 'Fas', flag: '🇲🇦', embassy: true, consulates: ['istanbul'], aliases: ['مغربي', 'morocco', 'fas'] },
    { id: 'tunisia', countryAr: 'تونس', adjAr: 'التونسية', tr: 'Tunus', flag: '🇹🇳', embassy: true, consulates: ['istanbul'], aliases: ['تونسي', 'tunisia', 'tunus'] },
    { id: 'algeria', countryAr: 'الجزائر', adjAr: 'الجزائرية', tr: 'Cezayir', flag: '🇩🇿', embassy: true, consulates: ['istanbul'], aliases: ['جزائري', 'algeria', 'cezayir'] },
    { id: 'kuwait', countryAr: 'الكويت', adjAr: 'الكويتية', tr: 'Kuveyt', flag: '🇰🇼', embassy: true, consulates: ['istanbul'], aliases: ['كويتي', 'kuwait', 'kuveyt'] },
    { id: 'qatar', countryAr: 'قطر', adjAr: 'القطرية', tr: 'Katar', flag: '🇶🇦', embassy: true, consulates: ['istanbul'], aliases: ['قطري', 'qatar', 'katar'] },
    { id: 'uae', countryAr: 'الإمارات', adjAr: 'الإماراتية', tr: 'Birleşik Arap Emirlikleri', flag: '🇦🇪', embassy: true, consulates: ['istanbul'], aliases: ['اماراتي', 'الامارات', 'uae', 'emirates', 'dubai', 'bae'] },
    { id: 'bahrain', countryAr: 'البحرين', adjAr: 'البحرينية', tr: 'Bahreyn', flag: '🇧🇭', embassy: true, consulates: ['istanbul'], aliases: ['بحريني', 'bahrain', 'bahreyn'] },
    { id: 'oman', countryAr: 'عُمان', adjAr: 'العُمانية', tr: 'Umman', flag: '🇴🇲', embassy: true, consulates: [], aliases: ['عمان', 'سلطنة عمان', 'oman', 'umman'] },
    { id: 'somalia', countryAr: 'الصومال', adjAr: 'الصومالية', tr: 'Somali', flag: '🇸🇴', embassy: true, consulates: ['istanbul'], aliases: ['صومالي', 'somalia'] },
    { id: 'mauritania', countryAr: 'موريتانيا', adjAr: 'الموريتانية', tr: 'Moritanya', flag: '🇲🇷', embassy: true, consulates: [], aliases: ['موريتاني', 'mauritania', 'moritanya'] },
    { id: 'djibouti', countryAr: 'جيبوتي', adjAr: 'الجيبوتية', tr: 'Cibuti', flag: '🇩🇯', embassy: true, consulates: [], aliases: ['جيبوتي', 'djibouti', 'cibuti'] },
];

/** سفارات وقنصليات أجنبية — مطلوبة بكثرة لطلبات التأشيرات والهجرة. */
const INTL_MISSIONS: MissionCountry[] = [
    { id: 'usa', countryAr: 'أمريكا', adjAr: 'الأمريكية', tr: 'Amerika Birleşik Devletleri', flag: '🇺🇸', embassy: true, consulates: ['istanbul'], aliases: ['امريكا', 'الولايات المتحدة', 'usa', 'us', 'america', 'abd'] },
    { id: 'uk', countryAr: 'بريطانيا', adjAr: 'البريطانية', tr: 'Birleşik Krallık', flag: '🇬🇧', embassy: true, consulates: ['istanbul'], aliases: ['بريطانيا', 'انجلترا', 'المملكة المتحدة', 'uk', 'britain', 'england', 'ingiltere'] },
    { id: 'germany', countryAr: 'ألمانيا', adjAr: 'الألمانية', tr: 'Almanya', flag: '🇩🇪', embassy: true, consulates: ['istanbul', 'izmir', 'antalya'], aliases: ['المانيا', 'germany', 'almanya', 'deutschland'] },
    { id: 'france', countryAr: 'فرنسا', adjAr: 'الفرنسية', tr: 'Fransa', flag: '🇫🇷', embassy: true, consulates: ['istanbul'], aliases: ['فرنسا', 'france', 'fransa'] },
    { id: 'netherlands', countryAr: 'هولندا', adjAr: 'الهولندية', tr: 'Hollanda', flag: '🇳🇱', embassy: true, consulates: ['istanbul'], aliases: ['هولندا', 'netherlands', 'holland', 'hollanda'] },
    { id: 'italy', countryAr: 'إيطاليا', adjAr: 'الإيطالية', tr: 'İtalya', flag: '🇮🇹', embassy: true, consulates: ['istanbul', 'izmir'], aliases: ['ايطاليا', 'italy', 'italya'] },
    { id: 'spain', countryAr: 'إسبانيا', adjAr: 'الإسبانية', tr: 'İspanya', flag: '🇪🇸', embassy: true, consulates: ['istanbul'], aliases: ['اسبانيا', 'spain', 'ispanya'] },
    { id: 'greece', countryAr: 'اليونان', adjAr: 'اليونانية', tr: 'Yunanistan', flag: '🇬🇷', embassy: true, consulates: ['istanbul', 'izmir'], aliases: ['اليونان', 'greece', 'yunanistan'] },
    { id: 'sweden', countryAr: 'السويد', adjAr: 'السويدية', tr: 'İsveç', flag: '🇸🇪', embassy: true, consulates: ['istanbul'], aliases: ['السويد', 'sweden', 'isvec'] },
    { id: 'canada', countryAr: 'كندا', adjAr: 'الكندية', tr: 'Kanada', flag: '🇨🇦', embassy: true, consulates: ['istanbul'], aliases: ['كندا', 'canada', 'kanada'] },
    { id: 'russia', countryAr: 'روسيا', adjAr: 'الروسية', tr: 'Rusya', flag: '🇷🇺', embassy: true, consulates: ['istanbul', 'antalya'], aliases: ['روسيا', 'russia', 'rusya'] },
    { id: 'iran', countryAr: 'إيران', adjAr: 'الإيرانية', tr: 'İran', flag: '🇮🇷', embassy: true, consulates: ['istanbul'], aliases: ['ايران', 'iran'] },
    { id: 'azerbaijan', countryAr: 'أذربيجان', adjAr: 'الأذربيجانية', tr: 'Azerbaycan', flag: '🇦🇿', embassy: true, consulates: ['istanbul'], aliases: ['اذربيجان', 'azerbaijan', 'azerbaycan'] },
    { id: 'pakistan', countryAr: 'باكستان', adjAr: 'الباكستانية', tr: 'Pakistan', flag: '🇵🇰', embassy: true, consulates: ['istanbul'], aliases: ['باكستان', 'pakistan'] },
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
    /** Missions only. */
    missionType?: 'embassy' | 'consulate';
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
            });
        }

        for (const citySlug of m.consulates) {
            const city = placeCityBySlug(citySlug);
            if (!city) continue;
            out.push({
                slug: `${m.id}-consulate-${city.slug}`,
                kind: 'single',
                groupId,
                ar: `القنصلية ${m.adjAr} في ${city.ar}`,
                shortAr: `القنصلية ${m.adjAr}`,
                tr: `${m.tr} Başkonsolosluğu`,
                citySlug: city.slug,
                cityAr: city.ar,
                cityTr: city.tr,
                mapQuery: `${m.tr} Başkonsolosluğu ${city.tr}`,
                what: `المعاملات القنصلية لمواطني ${m.countryAr} في ${city.ar}: الجوازات، الوثائق، الوكالات، والتصديق.`,
                aliases: [
                    ...sharedAliases, ...city.aliases,
                    'قنصلية', 'القنصلية', 'قنصليه', 'القنصليه', 'consulate',
                    'konsolosluk', 'baskonsolosluk', 'başkonsolosluk',
                    `قنصلية ${m.countryAr}`, `القنصلية ${m.adjAr}`,
                ],
                icon: Landmark,
                flag: m.flag,
                region,
                missionType: 'consulate',
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

/**
 * LIVE Google-Maps search for the place. Deliberately a search (not a
 * lat/lng pin): whatever Maps knows today — the current address, phone,
 * opening hours — is what opens, so the answer can't go stale on our side.
 */
export const placeMapUrl = (place: OfficialPlace): string =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.mapQuery)}`;

/** Turn-by-turn directions from wherever the visitor is standing. */
export const placeDirectionsUrl = (place: OfficialPlace): string =>
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.mapQuery)}`;

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
        desc: p.kind === 'nearby'
            ? `اعرض أقرب ${p.shortAr} في ${p.cityAr} على خرائط جوجل`
            : `الموقع على خرائط جوجل + المعاملات والمواعيد`,
        url: `/places/${p.slug}`,
        keywords: [p.ar, p.tr, p.shortAr, p.cityAr, p.cityTr, ...p.aliases].join(' '),
        mapUrl: placeMapUrl(p),
        icon: p.icon,
    }));
}
