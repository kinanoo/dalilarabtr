'use client';

import { useEffect } from 'react';

/**
 * ChunkReloadGuard — the ROOT fix for "click a link → stuck on the loading
 * skeleton, refresh fixes it".
 *
 * On a frequently-redeployed Cloudflare Worker, an open tab holds the OLD
 * build's chunk hashes. When the user soft-navigates (clicks a <Link>), the
 * client router asks Cloudflare for those old chunks — which the new deploy has
 * replaced — and gets a 404. Next.js' App Router then sits on the loading.tsx
 * skeleton instead of recovering, so the page "never opens". A full refresh
 * loads the fresh build and works.
 *
 * This guard listens for the chunk-load failure (ChunkLoadError / failed dynamic
 * import / failed script) and does ONE hard reload to the current build, so a
 * stale-chunk navigation self-heals instead of hanging. A 10s timestamp guard
 * prevents any reload loop if a chunk is genuinely broken on the fresh build.
 */
const RELOAD_KEY = 'cf-chunk-reload-ts';

function isChunkLoadError(message?: string): boolean {
    if (!message) return false;
    return /ChunkLoadError|Loading chunk [\d]+ failed|Loading CSS chunk [\d]+ failed|Failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed/i.test(
        message,
    );
}

function reloadOnce() {
    try {
        const last = Number(sessionStorage.getItem(RELOAD_KEY) || '0');
        // Avoid an infinite reload loop: at most one auto-reload per 10s.
        if (Date.now() - last > 10000) {
            sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
            window.location.reload();
        }
    } catch {
        // sessionStorage blocked (private mode quirks) — reload anyway once.
        window.location.reload();
    }
}

export default function ChunkReloadGuard() {
    useEffect(() => {
        const onError = (e: ErrorEvent) => {
            if (isChunkLoadError(e.message) || isChunkLoadError(e.error?.message)) {
                reloadOnce();
            }
        };
        const onRejection = (e: PromiseRejectionEvent) => {
            const reason = e?.reason;
            const msg = typeof reason === 'string' ? reason : reason?.message;
            if (isChunkLoadError(msg)) {
                reloadOnce();
            }
        };

        // Register at browser idle rather than in the post-hydration effect
        // flush — these guard against chunk 404s on SOFT NAVIGATION (a later
        // <Link> click), never the first paint, so a ~sub-second delay costs
        // nothing but keeps the listeners off the critical hydration task.
        const w = window as unknown as {
            requestIdleCallback?: (c: () => void, o?: { timeout: number }) => number;
            cancelIdleCallback?: (i: number) => void;
        };
        const attach = () => {
            window.addEventListener('error', onError);
            window.addEventListener('unhandledrejection', onRejection);
        };
        const idleId = w.requestIdleCallback
            ? w.requestIdleCallback(attach, { timeout: 2000 })
            : window.setTimeout(attach, 200);

        return () => {
            if (w.cancelIdleCallback) w.cancelIdleCallback(idleId);
            else window.clearTimeout(idleId);
            window.removeEventListener('error', onError);
            window.removeEventListener('unhandledrejection', onRejection);
        };
    }, []);

    return null;
}
