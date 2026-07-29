import {
    buildDirectoryFacets,
    categoryVariantsForDirectory,
    cityVariantsForDirectory,
    directorySearchVariants,
    normalizeTurkishPhone,
    providerFingerprint,
    sanitizeDirectorySearch,
} from '@/lib/serviceDirectory';

describe('service directory normalization', () => {
    test('normalizes Turkish mobile numbers', () => {
        expect(normalizeTurkishPhone('0532 123 45 67')).toBe('905321234567');
        expect(normalizeTurkishPhone('+90 532 123 45 67')).toBe('905321234567');
        expect(normalizeTurkishPhone('0090 532 123 45 67')).toBe('905321234567');
    });

    test('maps city and category variants to one filter set', () => {
        expect(cityVariantsForDirectory('إسطنبول')).toContain('Istanbul');
        expect(cityVariantsForDirectory('istanbul')).toContain('اسطنبول الفاتح');
        expect(categoryVariantsForDirectory('lawyers')).toContain('legal');
        expect(categoryVariantsForDirectory('محامي')).toContain('Lawyer');
    });

    test('builds stable fingerprints across spelling and phone formatting', () => {
        expect(
            providerFingerprint({
                name: 'مكتب الأمان',
                city: 'Gaziantep',
                phone: '+90 532 123 45 67',
            }),
        ).toBe(
            providerFingerprint({
                name: 'مكتب الامان',
                city: 'غازي عنتاب',
                phone: '05321234567',
            }),
        );
    });

    test('aggregates dirty database facets into canonical values', () => {
        const facets = buildDirectoryFacets([
            { city: 'Istanbul', category: 'legal' },
            { city: 'اسطنبول الفاتح', category: 'محامي' },
            { city: 'Gaziantep', category: 'translation' },
        ]);

        expect(facets.cityCounts['إسطنبول']).toBe(2);
        expect(facets.cityCounts['غازي عنتاب']).toBe(1);
        expect(facets.categoryCounts['محامي']).toBe(2);
        expect(facets.categoryCounts['مترجم']).toBe(1);
    });

    test('removes PostgREST control characters from search input', () => {
        expect(sanitizeDirectorySearch('طبيب),status.eq.pending')).toBe(
            'طبيب status eq pending',
        );
    });

    test('creates Turkish-aware search variants', () => {
        expect(directorySearchVariants('infoyed')).toContain('İnfoyed');
        expect(directorySearchVariants('onat tercüme')).toContain('Onat Tercüme');
    });
});
