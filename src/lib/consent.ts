export const ANALYTICS_CONSENT_KEY = 'dalil_analytics_consent';
export const ANALYTICS_CONSENT_EVENT = 'dalil:analytics-consent-changed';

const LEGACY_ACCEPTED_KEY = 'cookie_consent_accepted';
const LEGACY_DISMISSED_KEY = 'cookie_consent_dismissed_at';

export type AnalyticsConsent = 'granted' | 'denied' | 'unknown';

export function getAnalyticsConsent(): AnalyticsConsent {
    if (typeof window === 'undefined') return 'unknown';

    try {
        const current = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
        if (current === 'granted' || current === 'denied') return current;

        if (window.localStorage.getItem(LEGACY_ACCEPTED_KEY)) return 'granted';
    } catch {
        // Storage may be unavailable. Analytics remains disabled.
    }

    return 'unknown';
}

export function hasAnalyticsConsent(): boolean {
    return getAnalyticsConsent() === 'granted';
}

export function setAnalyticsConsent(consent: Exclude<AnalyticsConsent, 'unknown'>): void {
    if (typeof window === 'undefined') return;

    try {
        window.localStorage.setItem(ANALYTICS_CONSENT_KEY, consent);
        window.localStorage.removeItem(LEGACY_DISMISSED_KEY);

        if (consent === 'granted') {
            window.localStorage.setItem(LEGACY_ACCEPTED_KEY, Date.now().toString());
        } else {
            window.localStorage.removeItem(LEGACY_ACCEPTED_KEY);
        }
    } catch {
        // The event still updates the current page when storage fails.
    }

    window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: consent }));
}
