import {
    SERVICE_CATEGORIES,
    categoryBySlug,
    categoryForName,
    categorySlugForName,
} from '@/lib/serviceCategories';
import {
    TR_CITIES,
    canonicalCity,
    cityBySlug,
    citySlugForName,
} from '@/lib/turkishCities';

export const DIRECTORY_PAGE_SIZE = 15;
export const DIRECTORY_MAX_PAGE_SIZE = 30;

export interface DirectoryProvider {
    id: string;
    slug: string | null;
    name: string;
    profession: string | null;
    category: string | null;
    description: string | null;
    city: string | null;
    image: string | null;
    phone: string | null;
    whatsapp?: string | null;
    is_verified: boolean | null;
    verification_level?: string | null;
    is_featured?: boolean | null;
    rating: number | null;
    review_count: number | null;
    status: string | null;
    created_at: string | null;
}

export interface DirectoryFacets {
    cityCounts: Record<string, number>;
    categoryCounts: Record<string, number>;
    extraCategories: string[];
}

export interface DirectoryFacetRow {
    city?: string | null;
    category?: string | null;
    count?: number | null;
}

export interface DirectoryPopularSearch {
    city: string;
    citySlug: string;
    category: string;
    categoryLabel: string;
    categorySlug: string;
    count: number;
}

const normalizeComparable = (value: string): string =>
    value
        .normalize('NFKC')
        .toLocaleLowerCase('tr-TR')
        .replace(/[\u064B-\u065F\u0670]/g, '')
        .replace(/[إأآٱ]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();

export function sanitizeDirectorySearch(value: string | null | undefined): string {
    if (!value) return '';
    return value
        .normalize('NFKC')
        .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80);
}

export function directorySearchVariants(value: string): string[] {
    const lower = value.toLocaleLowerCase('tr-TR');
    const titleCase = lower.replace(
        /(^|[\s-])(\p{L})/gu,
        (_, separator: string, letter: string) =>
            `${separator}${letter.toLocaleUpperCase('tr-TR')}`,
    );

    return Array.from(new Set([
        value,
        lower,
        value.toLocaleUpperCase('tr-TR'),
        titleCase,
    ]));
}

export function normalizeTurkishPhone(value: string | null | undefined): string {
    if (!value) return '';
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('0090')) digits = digits.slice(2);
    if (digits.startsWith('0') && digits.length === 11) digits = `90${digits.slice(1)}`;
    if (digits.length === 10) digits = `90${digits}`;
    return digits;
}

export function providerFingerprint(input: {
    name?: string | null;
    city?: string | null;
    phone?: string | null;
}): string {
    const phone = normalizeTurkishPhone(input.phone);
    const name = normalizeComparable(input.name || '');
    const city = normalizeComparable(canonicalCity(input.city) || '');
    return [phone || 'no-phone', name || 'no-name', city || 'no-city'].join('|');
}

export function cityVariantsForDirectory(value: string | null | undefined): string[] {
    if (!value || value === 'all') return [];
    const trimmed = value.trim();
    const canonical = canonicalCity(trimmed);
    const city = cityBySlug(trimmed) || TR_CITIES.find((item) => item.ar === canonical);
    if (!city) return [trimmed];
    const variants = [city.slug, ...city.variants];
    const caseVariants = variants.flatMap((variant) => [
        variant,
        variant.charAt(0).toUpperCase() + variant.slice(1),
        variant.charAt(0).toLocaleUpperCase('tr-TR') + variant.slice(1),
    ]);
    return Array.from(new Set([city.ar, ...caseVariants]));
}

export function categoryVariantsForDirectory(value: string | null | undefined): string[] {
    if (!value || value === 'all') return [];
    const trimmed = value.trim();
    const category = categoryBySlug(trimmed) || categoryForName(trimmed);
    if (!category) return [trimmed];
    return Array.from(new Set([category.name, ...category.variants]));
}

export function buildDirectoryFacets(
    rows: DirectoryFacetRow[],
): DirectoryFacets {
    const cityCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    const unknownCategories = new Set<string>();

    for (const row of rows) {
        const weight = Math.max(1, Number(row.count) || 1);
        const city = canonicalCity(row.city);
        if (city) cityCounts[city] = (cityCounts[city] || 0) + weight;

        const rawCategory = row.category?.trim();
        if (!rawCategory) continue;
        const category = categoryForName(rawCategory);
        const key = category?.name || rawCategory;
        categoryCounts[key] = (categoryCounts[key] || 0) + weight;
        if (!category) unknownCategories.add(rawCategory);
    }

    const taxonomyOrder = new Map(
        SERVICE_CATEGORIES.map((category, index) => [category.name, index]),
    );
    const extraCategories = Array.from(unknownCategories).sort((a, b) =>
        a.localeCompare(b, 'ar'),
    );

    return {
        cityCounts: Object.fromEntries(
            Object.entries(cityCounts).sort((a, b) => {
                const ai = TR_CITIES.findIndex((city) => city.ar === a[0]);
                const bi = TR_CITIES.findIndex((city) => city.ar === b[0]);
                if (ai === -1 && bi === -1) return a[0].localeCompare(b[0], 'ar');
                if (ai === -1) return 1;
                if (bi === -1) return -1;
                return ai - bi;
            }),
        ),
        categoryCounts: Object.fromEntries(
            Object.entries(categoryCounts).sort((a, b) => {
                const ai = taxonomyOrder.get(a[0]) ?? Number.MAX_SAFE_INTEGER;
                const bi = taxonomyOrder.get(b[0]) ?? Number.MAX_SAFE_INTEGER;
                return ai - bi || a[0].localeCompare(b[0], 'ar');
            }),
        ),
        extraCategories,
    };
}

export function buildPopularDirectorySearches(
    rows: DirectoryFacetRow[],
    limit = 10,
): DirectoryPopularSearch[] {
    const combinations = new Map<string, DirectoryPopularSearch>();

    for (const row of rows) {
        const weight = Math.max(1, Number(row.count) || 1);
        const city = canonicalCity(row.city);
        const category = categoryForName(row.category);
        if (!city || !category) continue;

        const citySlug = citySlugForName(city);
        const categorySlug = categorySlugForName(category.name);
        if (!citySlug || !categorySlug) continue;

        const key = `${citySlug}|${categorySlug}`;
        const current = combinations.get(key);
        if (current) {
            current.count += weight;
            continue;
        }

        combinations.set(key, {
            city,
            citySlug,
            category: category.name,
            categoryLabel: category.labelAr,
            categorySlug,
            count: weight,
        });
    }

    return Array.from(combinations.values())
        .sort((a, b) =>
            b.count - a.count ||
            a.city.localeCompare(b.city, 'ar') ||
            a.categoryLabel.localeCompare(b.categoryLabel, 'ar'),
        )
        .slice(0, Math.max(0, limit));
}
