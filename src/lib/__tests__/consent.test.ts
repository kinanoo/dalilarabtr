import {
    ANALYTICS_CONSENT_EVENT,
    ANALYTICS_CONSENT_KEY,
    getAnalyticsConsent,
    setAnalyticsConsent,
} from '@/lib/consent';

describe('analytics consent', () => {
    beforeEach(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
        document.cookie = '_ga=; Max-Age=0; path=/';
    });

    it('keeps analytics disabled until the visitor chooses', () => {
        expect(getAnalyticsConsent()).toBe('unknown');
    });

    it('stores consent and notifies the current page', () => {
        const listener = jest.fn();
        window.addEventListener(ANALYTICS_CONSENT_EVENT, listener);

        setAnalyticsConsent('granted');

        expect(window.localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe('granted');
        expect(getAnalyticsConsent()).toBe('granted');
        expect(listener).toHaveBeenCalledTimes(1);
        window.removeEventListener(ANALYTICS_CONSENT_EVENT, listener);
    });

    it('removes analytics identifiers and cookies when consent is withdrawn', () => {
        window.localStorage.setItem('visitor_id', 'visitor-1');
        window.sessionStorage.setItem('session_id', 'session-1');
        window.sessionStorage.setItem('session_start', '123');
        document.cookie = '_ga=test-value; path=/';

        setAnalyticsConsent('denied');

        expect(getAnalyticsConsent()).toBe('denied');
        expect(window.localStorage.getItem('visitor_id')).toBeNull();
        expect(window.sessionStorage.getItem('session_id')).toBeNull();
        expect(window.sessionStorage.getItem('session_start')).toBeNull();
        expect(document.cookie).not.toContain('_ga=');
    });
});
