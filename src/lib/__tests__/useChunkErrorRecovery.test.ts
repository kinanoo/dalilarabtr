import { isChunkLoadError, isLikelyNavigationError } from '../useChunkErrorRecovery';

describe('navigation error recovery classification', () => {
    it.each([
        new Error('ChunkLoadError: Loading chunk app-services failed'),
        new Error('Failed to fetch dynamically imported module'),
        new Error("'text/html' is not a valid JavaScript MIME type"),
        new Error('NetworkError when attempting to fetch resource'),
    ])('recognizes transient asset and network failures', (error) => {
        expect(isChunkLoadError(error)).toBe(true);
        expect(isLikelyNavigationError(error)).toBe(true);
    });

    it('recognizes redacted Next.js server-component errors by digest', () => {
        const error = Object.assign(new Error('An error occurred in the Server Components render.'), {
            digest: '123456789',
        });

        expect(isLikelyNavigationError(error)).toBe(true);
    });

    it('does not reload for an ordinary application programming error', () => {
        expect(isLikelyNavigationError(new TypeError('Cannot read properties of undefined'))).toBe(false);
    });

    it('does not classify missing or primitive values as recoverable', () => {
        expect(isLikelyNavigationError(undefined)).toBe(false);
        expect(isLikelyNavigationError('Failed to fetch')).toBe(false);
    });
});
