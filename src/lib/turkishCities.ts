/**
 * Canonical Turkish-city taxonomy for the services directory.
 *
 * The `city` column was free text, so the same place arrived as "Istanbul",
 * "اسطنبول", "اسطنبول الفاتح", "İstanbul"… This collapses every spelling to a
 * single canonical Arabic name + a clean English `slug` used for per-city
 * landing pages (/services/category/[slug]/[city]) and for normalising the
 * stored data. Covers the cities present in the data plus the major
 * Arab-relevant provinces; unknown values are left untouched.
 */
export interface TRCity {
    slug: string;     // english, url-clean
    ar: string;       // canonical Arabic display name
    variants: string[]; // every spelling that maps here (lower-cased compare)
}

export const TR_CITIES: TRCity[] = [
    { slug: 'istanbul', ar: 'إسطنبول', variants: ['istanbul', 'i̇stanbul', 'اسطنبول', 'إسطنبول', 'اسطنبول الفاتح', 'الفاتح', 'fatih'] },
    { slug: 'gaziantep', ar: 'غازي عنتاب', variants: ['gaziantep', 'antep', 'غازي عنتاب', 'غازي عينتاب', 'عنتاب', 'عينتاب'] },
    { slug: 'bursa', ar: 'بورصة', variants: ['bursa', 'بورصة', 'بورسا'] },
    { slug: 'ankara', ar: 'أنقرة', variants: ['ankara', 'أنقرة', 'انقرة', 'أنكارا'] },
    { slug: 'izmir', ar: 'إزمير', variants: ['izmir', 'i̇zmir', 'إزمير', 'ازمير'] },
    { slug: 'mersin', ar: 'مرسين', variants: ['mersin', 'مرسين'] },
    { slug: 'kocaeli', ar: 'كوجالي', variants: ['kocaeli', 'izmit', 'i̇zmit', 'كوجالي', 'كوجائيلي', 'إزميت', 'ازميت'] },
    { slug: 'sakarya', ar: 'سكاريا', variants: ['sakarya', 'adapazari', 'سكاريا', 'سكاريّا'] },
    { slug: 'sanliurfa', ar: 'شانلي أورفا', variants: ['sanliurfa', 'şanlıurfa', 'urfa', 'شانلي اورفا', 'شانلي أورفا', 'اورفا', 'أورفا'] },
    { slug: 'adana', ar: 'أضنة', variants: ['adana', 'أضنة', 'اضنة', 'أدنة'] },
    { slug: 'hatay', ar: 'هاتاي', variants: ['hatay', 'antakya', 'هاتاي', 'أنطاكيا', 'انطاكيا'] },
    { slug: 'tekirdag', ar: 'تكيرداغ', variants: ['tekirdag', 'tekirdağ', 'تكيرداغ'] },
    { slug: 'yalova', ar: 'يالوفا', variants: ['yalova', 'يالوفا'] },
    { slug: 'konya', ar: 'قونية', variants: ['konya', 'قونية', 'قونيا'] },
    { slug: 'kayseri', ar: 'قيصري', variants: ['kayseri', 'قيصري', 'قيصرية'] },
    { slug: 'mardin', ar: 'ماردين', variants: ['mardin', 'ماردين'] },
    { slug: 'kilis', ar: 'كلّس', variants: ['kilis', 'كلس', 'كلّس'] },
    { slug: 'kahramanmaras', ar: 'كهرمان مرعش', variants: ['kahramanmaras', 'kahramanmaraş', 'maras', 'مرعش', 'كهرمان مرعش'] },
    { slug: 'malatya', ar: 'ملاطية', variants: ['malatya', 'ملاطية', 'ملاطيا'] },
    { slug: 'antalya', ar: 'أنطاليا', variants: ['antalya', 'أنطاليا', 'انطاليا', 'أنطاكية'] },
];

const norm = (s: string) => s.toLowerCase().trim();

export const cityBySlug = (slug: string): TRCity | undefined =>
    TR_CITIES.find((c) => c.slug === slug);

/** Collapse a raw city string to its canonical Arabic name (or trimmed input). */
export const canonicalCity = (raw?: string | null): string => {
    if (!raw) return '';
    const low = norm(raw);
    const hit = TR_CITIES.find((c) => c.variants.some((v) => norm(v) === low) || norm(c.ar) === low || c.slug === low);
    return hit ? hit.ar : raw.trim();
};

/** Map a raw city string to its url slug (or undefined if unknown). */
export const citySlugForName = (raw?: string | null): string | undefined => {
    if (!raw) return undefined;
    const low = norm(raw);
    return TR_CITIES.find((c) => c.variants.some((v) => norm(v) === low) || norm(c.ar) === low || c.slug === low)?.slug;
};
