import { normalizeTurkishPhone } from '@/lib/serviceDirectory';
import { cleanServiceText } from '@/lib/serviceText';

export const SERVICE_DESCRIPTION_MIN_WORDS = 40;

type PublicProviderCandidate = {
    whatsapp?: string | null;
    description?: string | null;
};

const GENERATED_DESCRIPTION_PATTERNS = [
    /\u064a\u0639\u0631[\u0651]?\u0641 \u0639\u0646 (?:\u062e\u062f\u0645\u0627\u062a|\u0645\u0637\u0639\u0645|\u0645\u0643\u062a\u0628|\u0639\u064a\u0627\u062f\u0629)/u,
    /\u0648\u064a\u062a\u064a\u062d \u0627\u0644\u062a\u0648\u0627\u0635\u0644\.?$/u,
    /\u064a\u0642\u062f[\u0651]?\u0645 \u062e\u062f\u0645\u0627\u062a .+ \u0648\u064a\u062a\u064a\u062d \u0627\u0644\u062a\u0648\u0627\u0635\u0644/u,
];

export function countServiceDescriptionWords(value: unknown): number {
    if (typeof value !== 'string') return 0;
    return cleanServiceText(value)
        .split(/\s+/u)
        .filter(Boolean)
        .length;
}

export function isGeneratedServiceDescription(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    const description = cleanServiceText(value);
    return GENERATED_DESCRIPTION_PATTERNS.some((pattern) => pattern.test(description));
}

export function hasQualityServiceDescription(value: unknown): boolean {
    return countServiceDescriptionWords(value) >= SERVICE_DESCRIPTION_MIN_WORDS &&
        !isGeneratedServiceDescription(value);
}

/**
 * Public pages must not repeat old synthetic copy as if the provider wrote it.
 * An empty result tells the UI to show an honest, non-indexable placeholder.
 */
export function publicServiceDescription(value: unknown): string {
    return hasQualityServiceDescription(value) && typeof value === 'string'
        ? cleanServiceText(value)
        : '';
}

export function normalizeWhatsAppNumber(value: unknown): string {
    if (typeof value !== 'string') return '';
    const raw = value.trim();
    if (!raw) return '';

    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);

    // Local Turkish numbers are accepted in 05xx / 5xx / area-code form.
    if (digits.length === 11 && digits.startsWith('0')) {
        digits = `90${digits.slice(1)}`;
    } else if (digits.length === 10) {
        digits = normalizeTurkishPhone(digits);
    }

    return digits;
}

export function isValidExplicitWhatsApp(value: unknown): boolean {
    const digits = normalizeWhatsAppNumber(value);
    if (!/^[1-9]\d{7,14}$/.test(digits)) return false;
    if (/^(\d)\1{7,}$/.test(digits)) return false;
    if (/^(?:12345678|123456789|1234567890|9876543210)$/.test(digits)) return false;

    // Turkish geographic, mobile and 0850 business numbers.
    if (digits.startsWith('90')) {
        return /^90(?:[2-5]\d{9}|850\d{7})$/.test(digits);
    }

    return true;
}

export function isPublicServiceProvider(provider: PublicProviderCandidate): boolean {
    return isValidExplicitWhatsApp(provider.whatsapp);
}

export function isIndexableServiceProvider(provider: PublicProviderCandidate): boolean {
    return isPublicServiceProvider(provider) && hasQualityServiceDescription(provider.description);
}

export function serviceProviderQualityIssues(provider: PublicProviderCandidate): string[] {
    const issues: string[] = [];
    if (!isValidExplicitWhatsApp(provider.whatsapp)) {
        issues.push('\u0631\u0642\u0645 \u0648\u0627\u062a\u0633\u0627\u0628 \u0635\u0631\u064a\u062d \u0648\u0635\u0627\u0644\u062d \u0645\u0637\u0644\u0648\u0628');
    }
    if (isGeneratedServiceDescription(provider.description)) {
        issues.push('\u0627\u0644\u0648\u0635\u0641 \u0627\u0644\u0622\u0644\u064a \u0627\u0644\u0642\u062f\u064a\u0645 \u063a\u064a\u0631 \u0645\u0642\u0628\u0648\u0644');
    } else if (!hasQualityServiceDescription(provider.description)) {
        issues.push(`\u0627\u0644\u0648\u0635\u0641 \u064a\u062c\u0628 \u0623\u0646 \u064a\u0643\u0648\u0646 ${SERVICE_DESCRIPTION_MIN_WORDS} \u0643\u0644\u0645\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644`);
    }
    return issues;
}
