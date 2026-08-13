'use client';

import { useEffect, useState } from 'react';

/**
 * Recover automatically from a failed JS chunk load instead of asking the reader
 * to refresh.
 *
 * WHY THIS EXISTS. On a soft navigation the App Router has to import the chunk
 * for the segment it is entering. If that request fails — a dropped connection,
 * a proxy hiccup, an evicted asset — React throws and the nearest error.tsx
 * renders with the layout still intact. Nothing is actually broken: the very
 * same request succeeds moments later. That is precisely why readers reported
 * "I refresh two or three times and it opens".
 *
 * A `reset()` button is the wrong remedy for this class. reset() re-renders the
 * segment from the same client state, so it retries the same import against the
 * same broken module registry; when it fails again the reader gets the identical
 * screen and concludes the site is broken. A full document load is what actually
 * clears it, and it is what the reader was doing by hand anyway.
 *
 * SAFETY. A reload triggered by a render error can loop forever if the failure
 * is permanent (a chunk genuinely 404s after a bad deploy). So: at most one
 * automatic reload per path per 30 seconds, recorded in sessionStorage. A second
 * failure inside that window falls through and shows the error UI — the reader
 * sees an honest message instead of a flickering page.
 *
 * Returns whether the boundary should show the neutral recovery state.
 */

// Message shapes browsers use when a dynamic import or chunk fetch fails.
// Chrome, Firefox and Safari each word it differently, and webpack adds its own.
const CHUNK_ERROR = /ChunkLoadError|Loading chunk [\w-]+ failed|Loading CSS chunk|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|'text\/html' is not a valid JavaScript MIME type|Failed to load resource|Failed to fetch|fetch failed|NetworkError|Load failed/i;

const WINDOW_MS = 30_000;

export function isChunkLoadError(error: unknown): boolean {
    if (!error) return false;
    const e = error as { name?: string; message?: string };
    return CHUNK_ERROR.test(`${e.name ?? ''} ${e.message ?? ''}`);
}

type RecoverableError = { digest?: string; message?: string; name?: string };

export function isLikelyNavigationError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const value = error as RecoverableError;
    const text = `${value.name ?? ''} ${value.message ?? ''}`;

    // Client navigation and RSC failures are not always surfaced as a named
    // ChunkLoadError. In production Next may redact the message and expose only
    // a digest, although a hard document request for the same URL succeeds.
    return isChunkLoadError(error)
        || /RSC|React Server Component|server component|navigation|network|fetch|load/i.test(text)
        || Boolean(value.digest);
}

/**
 * Tries one clean document load before an error page is shown to the reader.
 * Returns true while that recovery is in progress so the boundary can render a
 * calm loading state instead of flashing a red failure screen.
 */
export function useChunkErrorRecovery(error: unknown): boolean {
    const [recovering, setRecovering] = useState(() => isLikelyNavigationError(error));

    useEffect(() => {
        if (!isLikelyNavigationError(error) || typeof window === 'undefined') return;

        const stopRecoveryOnNextFrame = () => {
            const timer = window.setTimeout(() => setRecovering(false), 0);
            return () => window.clearTimeout(timer);
        };

        const key = `navigation-recovery:${window.location.pathname}${window.location.search}`;
        let last = 0;
        try {
            last = Number(window.sessionStorage.getItem(key)) || 0;
        } catch {
            return stopRecoveryOnNextFrame();
        }

        if (Date.now() - last < WINDOW_MS) {
            return stopRecoveryOnNextFrame();
        }

        try {
            window.sessionStorage.setItem(key, String(Date.now()));
        } catch {
            return stopRecoveryOnNextFrame();
        }

        // Give the boundary one paint so the visitor sees a neutral recovery
        // state, then bypass the client router/module registry completely.
        const timer = window.setTimeout(() => window.location.reload(), 80);
        return () => window.clearTimeout(timer);
    }, [error]);

    return recovering;
}
