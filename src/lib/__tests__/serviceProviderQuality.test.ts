import {
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

    it('publishes a reachable provider but indexes only a substantive profile', () => {
        expect(isPublicServiceProvider({ whatsapp: '+905551234567' })).toBe(true);
        expect(isIndexableServiceProvider({ whatsapp: '+905551234567' })).toBe(false);
        expect(isIndexableServiceProvider({ whatsapp: '+905551234567', description: 'وصف قصير' })).toBe(false);
        expect(isIndexableServiceProvider({
            whatsapp: '+905551234567',
            description: 'نقدم خدمة مهنية واضحة تشمل شرح نطاق العمل وطريقة التواصل والمواعيد والمناطق التي نخدمها، مع توضيح ما يحتاجه العميل قبل بدء الطلب ومتابعته حتى الإنجاز.',
        })).toBe(true);
        expect(publicServiceDescription('وصف قصير')).toBe('وصف قصير');
    });
});
