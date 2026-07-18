/**
 * Per-province data for the duty-pharmacy city pages (/tools/pharmacy/[city]).
 *
 * Slugs reuse the canonical taxonomy in `turkishCities.ts` so a city's
 * pharmacy page, hub page (/city/[slug]) and services pages all share one
 * slug. `odaUrl` is the OFFICIAL provincial Chamber of Pharmacists
 * (Eczacı Odası) duty list — every URL here was fetched (HTTP 200 with a
 * browser UA) and independently re-verified on 2026-07-18 to be the
 * chamber's own domain showing that day's actual duty list. Cities whose
 * chamber has no verified public list keep `null` and the page falls back
 * to e-Devlet + the live map only. Never add an oda URL without verifying
 * it responds and actually lists nöbetçi pharmacies.
 *
 * Districts are the province's major İlçe list (the ones people actually
 * search for in Arabic), used for per-district live-map links.
 */

export interface PharmacyDistrict {
    tr: string; // Turkish district name (used in the Maps query)
    ar: string; // Arabic display name
}

export interface PharmacyCity {
    slug: string;          // matches turkishCities.ts slug ⇒ /tools/pharmacy/[slug]
    tr: string;            // Turkish province name
    ar: string;            // Arabic display name
    odaName: string | null; // official chamber name (Turkish)
    odaUrl: string | null;  // VERIFIED duty-list URL of the chamber, or null
    hasCityHub: boolean;    // /city/[slug] hub page exists (slug in TR_CITIES)
    districts: PharmacyDistrict[];
}

export const PHARMACY_CITIES: PharmacyCity[] = [
    {
        slug: 'istanbul', tr: 'İstanbul', ar: 'إسطنبول',
        odaName: 'İstanbul Eczacı Odası',
        odaUrl: 'https://www.istanbuleczaciodasi.org.tr/nobetci-eczane/',
        hasCityHub: true,
        districts: [
            { tr: 'Fatih', ar: 'الفاتح' }, { tr: 'Esenyurt', ar: 'اسنيورت' },
            { tr: 'Zeytinburnu', ar: 'زيتون بورنو' }, { tr: 'Başakşehir', ar: 'باشاك شهير' },
            { tr: 'Sultangazi', ar: 'سلطان غازي' }, { tr: 'Bağcılar', ar: 'باجيلار' },
            { tr: 'Esenler', ar: 'اسنلر' }, { tr: 'Avcılar', ar: 'افجيلار' },
            { tr: 'Küçükçekmece', ar: 'كوتشوك تشكمجة' }, { tr: 'Ümraniye', ar: 'العمرانية' },
            { tr: 'Sultanbeyli', ar: 'سلطان بيلي' }, { tr: 'Arnavutköy', ar: 'أرناؤوط كوي' },
        ],
    },
    {
        slug: 'gaziantep', tr: 'Gaziantep', ar: 'غازي عنتاب',
        odaName: 'Gaziantep Eczacı Odası',
        odaUrl: 'https://www.gaziantepeo.org.tr/nobetci-eczaneler',
        hasCityHub: true,
        districts: [
            { tr: 'Şahinbey', ar: 'شاهين بيه' }, { tr: 'Şehitkamil', ar: 'شهيد كامل' },
            { tr: 'Nizip', ar: 'نيزيب' }, { tr: 'İslahiye', ar: 'اسلاهية' },
            { tr: 'Oğuzeli', ar: 'أوغوزالي' },
        ],
    },
    {
        slug: 'mersin', tr: 'Mersin', ar: 'مرسين',
        odaName: 'Mersin Eczacı Odası',
        odaUrl: 'https://www.mersineczaciodasi.org.tr/nobetci-eczaneler',
        hasCityHub: true,
        districts: [
            { tr: 'Akdeniz', ar: 'أكدنيز' }, { tr: 'Toroslar', ar: 'توروسلار' },
            { tr: 'Yenişehir', ar: 'يني شهير' }, { tr: 'Mezitli', ar: 'مزيتلي' },
            { tr: 'Tarsus', ar: 'طرسوس' },
        ],
    },
    {
        slug: 'adana', tr: 'Adana', ar: 'أضنة',
        odaName: 'Adana Eczacı Odası',
        odaUrl: 'https://www.adanaeo.org.tr/nobetci-eczaneler',
        hasCityHub: true,
        districts: [
            { tr: 'Seyhan', ar: 'سيهان' }, { tr: 'Yüreğir', ar: 'يوره غير' },
            { tr: 'Çukurova', ar: 'تشوكوروفا' }, { tr: 'Sarıçam', ar: 'ساريتشام' },
            { tr: 'Ceyhan', ar: 'جيهان' },
        ],
    },
    {
        slug: 'hatay', tr: 'Hatay', ar: 'هاتاي',
        odaName: 'Hatay Eczacı Odası',
        odaUrl: 'https://www.hatayeo.org.tr/nobetci-eczaneler',
        hasCityHub: true,
        districts: [
            { tr: 'Antakya', ar: 'أنطاكيا' }, { tr: 'İskenderun', ar: 'اسكندرون' },
            { tr: 'Reyhanlı', ar: 'الريحانية' }, { tr: 'Defne', ar: 'دفنة' },
            { tr: 'Kırıkhan', ar: 'قرقخان' }, { tr: 'Samandağ', ar: 'صمندغ' },
            { tr: 'Altınözü', ar: 'ألتن أوزو' },
        ],
    },
    {
        slug: 'kilis', tr: 'Kilis', ar: 'كلّس',
        // Kilis has no independent chamber — it is covered by the Gaziantep
        // chamber (TEB 8. Bölge), whose list includes a KİLİS district filter.
        odaName: 'Gaziantep Eczacı Odası (تغطي كلّس)',
        odaUrl: 'https://www.gaziantepeo.org.tr/nobetci-eczaneler',
        hasCityHub: true,
        districts: [
            { tr: 'Kilis Merkez', ar: 'كلّس المركز' }, { tr: 'Elbeyli', ar: 'البيلي' },
        ],
    },
    {
        slug: 'sanliurfa', tr: 'Şanlıurfa', ar: 'شانلي أورفا',
        odaName: 'Şanlıurfa Eczacı Odası',
        odaUrl: 'https://www.sanliurfaeo.org.tr/nobetci-eczaneler',
        hasCityHub: true,
        districts: [
            { tr: 'Eyyübiye', ar: 'أيوبية' }, { tr: 'Haliliye', ar: 'خليلية' },
            { tr: 'Karaköprü', ar: 'كاراكوبرو' }, { tr: 'Siverek', ar: 'سيفرك' },
            { tr: 'Viranşehir', ar: 'فيران شهير' }, { tr: 'Akçakale', ar: 'أقجة قلعة' },
        ],
    },
    {
        slug: 'ankara', tr: 'Ankara', ar: 'أنقرة',
        odaName: 'Ankara Eczacı Odası',
        odaUrl: 'https://www.aeo.org.tr/nobetci-eczaneler',
        hasCityHub: true,
        districts: [
            { tr: 'Çankaya', ar: 'تشانكايا' }, { tr: 'Keçiören', ar: 'كتشيورن' },
            { tr: 'Altındağ', ar: 'ألتنداغ' }, { tr: 'Mamak', ar: 'ماماك' },
            { tr: 'Sincan', ar: 'سنجان' }, { tr: 'Etimesgut', ar: 'اتيمسغوت' },
        ],
    },
    {
        slug: 'izmir', tr: 'İzmir', ar: 'إزمير',
        odaName: 'İzmir Eczacı Odası',
        odaUrl: 'https://www.izmireczaciodasi.org.tr/nobetci-eczaneler',
        hasCityHub: true,
        districts: [
            { tr: 'Konak', ar: 'قوناق' }, { tr: 'Bornova', ar: 'بورنوفا' },
            { tr: 'Buca', ar: 'بوجا' }, { tr: 'Karabağlar', ar: 'كاراباغلار' },
            { tr: 'Bayraklı', ar: 'بايراكلي' },
        ],
    },
    {
        slug: 'bursa', tr: 'Bursa', ar: 'بورصة',
        odaName: 'Bursa Eczacı Odası',
        odaUrl: 'https://www.beo.org.tr/nobetci-eczaneler',
        hasCityHub: true,
        districts: [
            { tr: 'Osmangazi', ar: 'عثمان غازي' }, { tr: 'Yıldırım', ar: 'يلدرم' },
            { tr: 'Nilüfer', ar: 'نيلوفر' }, { tr: 'İnegöl', ar: 'اينه غول' },
            { tr: 'Gemlik', ar: 'غمليك' },
        ],
    },
    {
        slug: 'osmaniye', tr: 'Osmaniye', ar: 'عثمانية',
        odaName: 'Osmaniye Eczacı Odası',
        odaUrl: 'https://www.osmaniyeeczaciodasi.org.tr/nobetci-eczaneler',
        hasCityHub: false,
        districts: [
            { tr: 'Osmaniye Merkez', ar: 'عثمانية المركز' }, { tr: 'Kadirli', ar: 'قادرلي' },
            { tr: 'Düziçi', ar: 'دوزيتشي' },
        ],
    },
    {
        slug: 'konya', tr: 'Konya', ar: 'قونية',
        // The chamber (keo.org.tr) publishes its live duty list on its own
        // dedicated site — cross-linked in both directions, verified 2026-07-18.
        odaName: 'Konya Eczacı Odası',
        odaUrl: 'https://www.konyanobetcieczaneleri.com/',
        hasCityHub: true,
        districts: [
            { tr: 'Meram', ar: 'ميرام' }, { tr: 'Selçuklu', ar: 'سلجوقلو' },
            { tr: 'Karatay', ar: 'كاراتاي' }, { tr: 'Ereğli', ar: 'اره غلي' },
        ],
    },
    {
        slug: 'kayseri', tr: 'Kayseri', ar: 'قيصري',
        odaName: 'Kayseri Eczacı Odası',
        odaUrl: 'https://www.kayserieo.org.tr/nobetci-eczaneler',
        hasCityHub: true,
        districts: [
            { tr: 'Melikgazi', ar: 'ملك غازي' }, { tr: 'Kocasinan', ar: 'كوجاسينان' },
            { tr: 'Talas', ar: 'طالاس' },
        ],
    },
    {
        slug: 'mardin', tr: 'Mardin', ar: 'ماردين',
        odaName: 'Mardin Eczacı Odası',
        odaUrl: 'https://www.mardineczaciodasi.org.tr/nobetci-eczaneler',
        hasCityHub: true,
        districts: [
            { tr: 'Artuklu', ar: 'أرتوكلو' }, { tr: 'Kızıltepe', ar: 'قزلتبة' },
            { tr: 'Midyat', ar: 'مديات' }, { tr: 'Nusaybin', ar: 'نصيبين' },
        ],
    },
    {
        slug: 'kahramanmaras', tr: 'Kahramanmaraş', ar: 'كهرمان مرعش',
        odaName: 'Kahramanmaraş Eczacı Odası',
        odaUrl: 'https://www.kahramanmaraseo.org.tr/nobetkarti',
        hasCityHub: true,
        districts: [
            { tr: 'Onikişubat', ar: 'اونيكي شوباط' }, { tr: 'Dulkadiroğlu', ar: 'دولكادير أوغلو' },
            { tr: 'Elbistan', ar: 'البستان' }, { tr: 'Pazarcık', ar: 'بازارجيك' },
        ],
    },
    {
        slug: 'malatya', tr: 'Malatya', ar: 'ملاطية',
        odaName: null, odaUrl: null,
        hasCityHub: true,
        districts: [
            { tr: 'Battalgazi', ar: 'بتال غازي' }, { tr: 'Yeşilyurt', ar: 'يشيل يورت' },
        ],
    },
    {
        slug: 'antalya', tr: 'Antalya', ar: 'أنطاليا',
        odaName: null, odaUrl: null,
        hasCityHub: true,
        districts: [
            { tr: 'Muratpaşa', ar: 'مراد باشا' }, { tr: 'Kepez', ar: 'كبز' },
            { tr: 'Konyaaltı', ar: 'كونيا ألتي' }, { tr: 'Alanya', ar: 'ألانيا' },
            { tr: 'Manavgat', ar: 'مانافغات' },
        ],
    },
    {
        slug: 'kocaeli', tr: 'Kocaeli', ar: 'كوجالي',
        odaName: null, odaUrl: null,
        hasCityHub: true,
        districts: [
            { tr: 'İzmit', ar: 'إزميت' }, { tr: 'Gebze', ar: 'غبزة' },
            { tr: 'Darıca', ar: 'داريجا' }, { tr: 'Körfez', ar: 'كورفز' },
        ],
    },
    {
        slug: 'sakarya', tr: 'Sakarya', ar: 'سكاريا',
        odaName: null, odaUrl: null,
        hasCityHub: true,
        districts: [
            { tr: 'Adapazarı', ar: 'أدابازاري' }, { tr: 'Serdivan', ar: 'سرديفان' },
            { tr: 'Erenler', ar: 'ارنلر' },
        ],
    },
];

export const pharmacyCityBySlug = (slug: string): PharmacyCity | undefined =>
    PHARMACY_CITIES.find((c) => c.slug === slug);

/** Live Google-Maps search of currently-open duty pharmacies in an area. */
export const dutyMapUrl = (query: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Nöbetçi Eczane ${query}`)}`;

export const OFFICIAL_EDEVLET_PHARMACY =
    'https://www.turkiye.gov.tr/saglik-titck-nobetci-eczane-sorgulama';
