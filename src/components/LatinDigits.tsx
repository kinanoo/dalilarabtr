'use client';

/**
 * LatinDigits — site-wide Eastern-Arabic → Latin digit normalizer.
 *
 * Why this exists: the site has Eastern-Arabic digits (٠-٩) scattered
 * everywhere — hardcoded in JSX strings, baked into article content from
 * the DB, written by editors in markdown intros, formatted via Intl
 * APIs with the ar-EG locale, etc. The user wants a hard guarantee
 * that NO number ever renders in Eastern-Arabic form on this site.
 *
 * Doing this by hand-replacing every string in source + DB is fragile —
 * the next published article would re-introduce the problem. Instead
 * this component runs once on the client after hydration:
 *
 *   1. Walks every text node currently in <body> and replaces any
 *      Eastern-Arabic digit codepoint (U+0660..U+0669) with the
 *      matching Latin digit (U+0030..U+0039).
 *
 *   2. Attaches a MutationObserver so any text added later (article
 *      ISR refresh, client-side fetches, route changes, modals) is
 *      normalized the moment it appears in the DOM.
 *
 * It does NOT mutate the underlying React state — only the rendered
 * text nodes. React will re-render with the original digits when state
 * changes, then this observer fires again. Net cost: one walk per text
 * node mutation, which is microseconds even on slow phones.
 *
 * Mounted globally from app/layout.tsx so it covers every page.
 */

import { useEffect } from 'react';

const ARABIC_DIGIT_RE = /[٠-٩۰-۹]/g;

function arabicToLatin(s: string): string {
    return s.replace(ARABIC_DIGIT_RE, (ch) => {
        const code = ch.charCodeAt(0);
        // U+0660-U+0669 → 0-9
        if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
        // U+06F0-U+06F9 → 0-9 (Persian/Urdu digits — same conversion)
        if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0);
        return ch;
    });
}

function normalizeNode(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
        const txt = node.nodeValue || '';
        if (ARABIC_DIGIT_RE.test(txt)) {
            // Re-test required because the regex has the /g flag and
            // lastIndex sticks between calls. The replace below is
            // independent of the test's lastIndex but we still reset it
            // by re-reading the value through arabicToLatin.
            ARABIC_DIGIT_RE.lastIndex = 0;
            node.nodeValue = arabicToLatin(txt);
        }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Skip script/style — their text content isn't visible numbers.
        const tag = (node as Element).tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE') return;
        // Recurse into children
        node.childNodes.forEach(normalizeNode);
    }
}

export default function LatinDigits() {
    useEffect(() => {
        if (typeof document === 'undefined') return;

        // Initial sweep — handles the SSR'd content.
        normalizeNode(document.body);

        // Continuous sweep — anything React (or any other script) adds to
        // the DOM after this point gets normalized too. We listen for
        // node-add AND character-data changes so both new elements and
        // text replacements are caught.
        const obs = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.type === 'characterData' && m.target.nodeType === Node.TEXT_NODE) {
                    const txt = m.target.nodeValue || '';
                    if (ARABIC_DIGIT_RE.test(txt)) {
                        ARABIC_DIGIT_RE.lastIndex = 0;
                        m.target.nodeValue = arabicToLatin(txt);
                    }
                }
                m.addedNodes.forEach(normalizeNode);
            }
        });

        obs.observe(document.body, {
            childList: true,
            characterData: true,
            subtree: true,
        });

        return () => obs.disconnect();
    }, []);

    return null;
}
