import {
    SERVICE_DESCRIPTION_MIN_WORDS,
    countServiceDescriptionWords,
    hasQualityServiceDescription,
    isGeneratedServiceDescription,
    isIndexableServiceProvider,
    isPublicServiceProvider,
    isValidExplicitWhatsApp,
    normalizeWhatsAppNumber,
    publicServiceDescription,
} from '@/lib/serviceProviderQuality';

describe('service provider publication quality', () => {
    it.each([
        ['+90 555 123 45 67', '905551234567'],
        ['0555 123 45 67', '905551234567'],
        ['5551234567', '905551234567'],
        ['+90 850 532 78 72', '908505327872'],
        ['+963 944 123 456', '963944123456'],
    ])('normalizes a WhatsApp number %s', (input, expected) => {
        expect(normalizeWhatsAppNumber(input)).toBe(expected);
        expect(isValidExplicitWhatsApp(input)).toBe(true);
    });

    it.each(['', '1234567890', '0000000000', '+901234', '+909991234567'])('rejects a suspicious or malformed number %s', (input) => {
        expect(isValidExplicitWhatsApp(input)).toBe(false);
    });

    it('detects the legacy generated description template', () => {
        const description = 'الدكتورة تغريد الخطيب يعرّف عن خدمات طبية في مرسين ويتيح التواصل.';
        expect(isGeneratedServiceDescription(description)).toBe(true);
        expect(publicServiceDescription(description)).toBe('');
    });

    it('requires at least forty original words for indexable provider copy', () => {
        const description = Array.from(
            { length: SERVICE_DESCRIPTION_MIN_WORDS },
            (_, index) => `كلمة${index + 1}`,
        ).join(' ');

        expect(countServiceDescriptionWords(description)).toBe(SERVICE_DESCRIPTION_MIN_WORDS);
        expect(hasQualityServiceDescription(description)).toBe(true);
        expect(isPublicServiceProvider({ whatsapp: '+905551234567' })).toBe(true);
        expect(isIndexableServiceProvider({ whatsapp: '+905551234567', description })).toBe(true);
        expect(isIndexableServiceProvider({ whatsapp: '+905551234567', description: 'وصف قصير' })).toBe(false);
    });
});
