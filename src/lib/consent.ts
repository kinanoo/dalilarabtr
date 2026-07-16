export const ANALYTICS_CONSENT_KEY = 'dalil_analytics_consent';
export const ANALYTICS_CONSENT_EVENT = 'dalil:analytics-consent-changed';

const LEGACY_ACCEPTED_KEY = 'cookie_consent_accepted';
const LEGACY_DISMISSED_KEY = 'cookie_consent_dismissed_at';

export type AnalyticsConsent = 'granted' | 'denied' | 'unknown';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

function deleteAnalyticsCookies(): void {
    if (typeof document === 'undefined') return;

    const cookieNames = document.cookie
        .split(';')
        .map((cookie) => cookie.split('=')[0]?.trim())
        .filter((name): name is string => Boolean(name))
        .filter((name) => name === '_ga' || name === '_gid' || name.startsWith('_ga_') || name.startsWith('_gat'));

    const hostname = window.location.hostname;
    const rootDomain = hostname.split('.').slice(-2).join('.');
    const domains = Array.from(new Set([hostname, `.${hostname}`, rootDomain, `.${rootDomain}`]));

    for (const name of cookieNames) {
        document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
        for (const domain of domains) {
            document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}; SameSite=Lax`;
        }
    }
}

function applyAnalyticsConsent(consent: Exclude<AnalyticsConsent, 'unknown'>): void {
    const analyticsWindow = window as Window & { gtag?: (...args: unknown[]) => void };
    const analyticsFlags = window as unknown as Record<string, unknown>;
    const granted = consent === 'granted';

    if (GA_ID) analyticsFlags[`ga-disable-${GA_ID}`] = !granted;
    analyticsWindow.gtag?.('consent', 'update', {
        analytics_storage: granted ? 'granted' : 'denied',
    });

    if (!granted) {
        window.localStorage.removeItem('visitor_id');
        window.sessionStorage.removeItem('session_id');
        window.sessionStorage.removeItem('session_start');
        deleteAnalyticsCookies();
    }
}

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

    applyAnalyticsConsent(consent);

    window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: consent }));
}
