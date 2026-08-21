import {
    getNavigationRecoveryMethod,
    isChunkLoadError,
    isLikelyNavigationError,
} from '../useChunkErrorRecovery';

describe('navigation error recovery classification', () => {
    it.each([
        new Error('ChunkLoadError: Loading chunk app-services failed'),
        new Error('Failed to fetch dynamically imported module'),
        new Error("'text/html' is not a valid JavaScript MIME type"),
    ])('recognizes transient asset failures', (error) => {
        expect(isChunkLoadError(error)).toBe(true);
        expect(isLikelyNavigationError(error)).toBe(true);
        expect(getNavigationRecoveryMethod(error)).toBe('reload');
    });

    it('retries a transient network failure before considering a hard reload', () => {
        const error = new Error('NetworkError when attempting to fetch resource');

        expect(isChunkLoadError(error)).toBe(false);
        expect(isLikelyNavigationError(error)).toBe(true);
        expect(getNavigationRecoveryMethod(error)).toBe('retry');
    });

    it('recognizes redacted Next.js server-component errors by digest', () => {
        const error = Object.assign(new Error('An error occurred in the Server Components render.'), {
            digest: '123456789',
        });

        expect(isLikelyNavigationError(error)).toBe(true);
        expect(getNavigationRecoveryMethod(error)).toBe('retry');
    });

    it('does not reload for an ordinary application programming error', () => {
        expect(isLikelyNavigationError(new TypeError('Cannot read properties of undefined'))).toBe(false);
        expect(getNavigationRecoveryMethod(new TypeError('Cannot read properties of undefined'))).toBe(null);
    });

    it('does not classify missing or primitive values as recoverable', () => {
        expect(isLikelyNavigationError(undefined)).toBe(false);
        expect(isLikelyNavigationError('Failed to fetch')).toBe(false);
    });
});
