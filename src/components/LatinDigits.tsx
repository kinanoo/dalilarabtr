'use client';

/**
 * LatinDigits — site-wide Eastern-Arabic → Latin digit normalizer.
 *
 * The site has Eastern-Arabic digits (٠-٩) scattered everywhere — hardcoded in
 * JSX, baked into DB article content, produced by Intl with the ar locale. The
 * owner wants a hard guarantee that NO number ever renders in Eastern-Arabic
 * form. Doing it by hand in source + DB is fragile; this normalizes the
 * rendered DOM instead.
 *
 * PERFORMANCE (why it's written this way):
 * The first version walked the whole <body> recursively and synchronously in
 * the mount effect, then kept a body-wide MutationObserver reacting per
 * mutation. On weak Android phones that full walk ran as one uninterruptible
 * long task at the exact moment the page became interactive — a visible
 * multi-second freeze on top of the ~1MB JS hydration. This version keeps the
 * same digit guarantee but never blocks:
 *   1. Uses a native TreeWalker (SHOW_TEXT) instead of JS recursion over every
 *      element — the browser enumerates only text nodes, far cheaper.
 *   2. Runs the initial sweep at requestIdleCallback, chunked (~500 nodes per
 *      slice, rescheduling the rest) so it can never become one long task.
 *   3. Attaches the MutationObserver only AFTER the first sweep, and coalesces
 *      its work into a single idle batch instead of reacting synchronously.
 */

import { useEffect } from 'react';

const ARABIC_DIGIT_RE = /[٠-٩۰-۹]/;
const ARABIC_DIGIT_RE_G = /[٠-٩۰-۹]/g;

function arabicToLatin(s: string): string {
    return s.replace(ARABIC_DIGIT_RE_G, (ch) => {
        const code = ch.charCodeAt(0);
        if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660); // Arabic-Indic
        if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0); // Extended (Persian/Urdu)
        return ch;
    });
}

/** Normalize a single text node in place if it contains Eastern digits. */
function normalizeTextNode(node: Node): void {
    const txt = node.nodeValue;
    if (txt && ARABIC_DIGIT_RE.test(txt)) {
        node.nodeValue = arabicToLatin(txt);
    }
}

type IdleId = number;
const scheduleIdle: (cb: () => void) => IdleId =
    (typeof window !== 'undefined' && 'requestIdleCallback' in window)
        ? (cb) => (window as unknown as { requestIdleCallback: (c: () => void, o?: { timeout: number }) => number }).requestIdleCallback(cb, { timeout: 2000 })
        : (cb) => window.setTimeout(cb, 200);
const cancelIdle: (id: IdleId) => void =
    (typeof window !== 'undefined' && 'cancelIdleCallback' in window)
        ? (id) => (window as unknown as { cancelIdleCallback: (i: number) => void }).cancelIdleCallback(id)
        : (id) => window.clearTimeout(id);

export default function LatinDigits() {
    useEffect(() => {
        if (typeof document === 'undefined') return;

        let cancelled = false;
        let sweepId: IdleId | null = null;
        let flushId: IdleId | null = null;
        let obs: MutationObserver | null = null;

        const isSkippedParent = (n: Node): boolean => {
            const tag = n.parentNode?.nodeName;
            return tag === 'SCRIPT' || tag === 'STYLE';
        };

        // A TreeWalker that visits only text nodes, skipping SCRIPT/STYLE.
        const makeWalker = (root: Node) =>
            document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                acceptNode(n) {
                    return isSkippedParent(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
                },
            });

        // Coalesce all pending mutations into one idle batch instead of
        // normalizing synchronously per mutation (which used to churn during
        // ticker/coverflow updates).
        const pending: Node[] = [];
        const flush = () => {
            flushId = null;
            if (cancelled) return;
            const batch = pending.splice(0, pending.length);
            for (const root of batch) {
                if (root.nodeType === Node.TEXT_NODE) {
                    if (!isSkippedParent(root)) normalizeTextNode(root); // same exclusion as the walker
                } else if (root.nodeType === Node.ELEMENT_NODE) {
                    const el = root as Element;
                    if (el.nodeName === 'SCRIPT' || el.nodeName === 'STYLE') continue;
                    const walker = makeWalker(el);
                    for (let n = walker.nextNode(); n; n = walker.nextNode()) normalizeTextNode(n);
                }
            }
        };

        // Attach the observer BEFORE the sweep starts, so any text mutated
        // during the (possibly multi-slice) sweep is buffered in `pending` and
        // flushed — no region can be both already-walked and unobserved. The
        // sweep's own normalize() writes are idempotent (a re-check on Latin
        // text is a cheap no-op), so double-processing is harmless.
        obs = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.type === 'characterData') pending.push(m.target);
                m.addedNodes.forEach((n) => pending.push(n));
            }
            if (pending.length && flushId == null) flushId = scheduleIdle(flush);
        });
        obs.observe(document.body, { childList: true, characterData: true, subtree: true });

        // Chunked initial sweep — process ~500 text nodes per idle slice so a
        // huge DOM never produces one long task.
        const startSweep = () => {
            const walker = makeWalker(document.body);
            const step = () => {
                if (cancelled) return;
                let count = 0;
                let node = walker.nextNode();
                while (node) {
                    normalizeTextNode(node);
                    if (++count >= 500) break;
                    node = walker.nextNode();
                }
                if (node) sweepId = scheduleIdle(step); // more nodes remain
            };
            step();
        };

        sweepId = scheduleIdle(startSweep);

        return () => {
            cancelled = true;
            if (sweepId != null) cancelIdle(sweepId);
            if (flushId != null) cancelIdle(flushId);
            obs?.disconnect();
        };
    }, []);

    return null;
}
