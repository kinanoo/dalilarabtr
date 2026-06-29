'use client';

import { useEffect } from 'react';

/**
 * ProseContrastGuard — guarantees that admin-authored inline colours never
 * make text disappear, in either theme.
 *
 * Article bodies (and any `.prose-content`) are user HTML from the editor:
 * admins can highlight text or set a text colour. Those inline colours are
 * fixed, but the surrounding theme flips — so a dark text colour vanished on
 * the dark page, and highlighted text (which inherits the theme colour) turned
 * near-white on a light pastel highlight and disappeared in dark mode.
 *
 * This walks every inline-styled element inside `.prose-content`, measures the
 * real contrast between its text and its actual background (climbing parents to
 * find the effective background), and only when contrast is too low swaps the
 * text to black or white — whichever reads on that background. Originals are
 * stashed in data-* and restored before each pass, so toggling the theme
 * re-evaluates from scratch and readable custom colours are left untouched.
 *
 * Mounted once site-wide in the root layout (like BodyImageGallery).
 */

type RGB = [number, number, number];

const DARK_TEXT = '#111827';
const LIGHT_TEXT = '#f8fafc';
const DARK_RGB: RGB = [17, 24, 39];
const LIGHT_RGB: RGB = [248, 250, 252];
// Only rescue text that is genuinely unreadable. Truly-vanishing cases (white
// on a pastel highlight, dark-on-dark) sit at ~1.1–1.7; a colour the admin
// deliberately chose and that still reads (≥3.0) is left as authored.
const MIN_CONTRAST = 3.0;

function parse(c: string): RGB | null {
    if (!c) return null;
    const s = c.trim().toLowerCase();
    if (s === 'transparent' || s === 'currentcolor' || s === 'inherit') return null;
    const fn = s.match(/^rgba?\(([^)]+)\)/);
    if (fn) {
        const p = fn[1].split(/[,\s/]+/).map((x) => parseFloat(x)).filter((n) => !Number.isNaN(n));
        if (p.length >= 3) {
            if (p.length >= 4 && p[3] < 0.4) return null; // mostly transparent → not a real bg
            return [p[0], p[1], p[2]];
        }
        return null;
    }
    if (s[0] === '#') {
        let h = s.slice(1);
        if (h.length === 3) h = h.split('').map((x) => x + x).join('');
        if (h.length === 6) {
            const n = parseInt(h, 16);
            if (!Number.isNaN(n)) return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        }
    }
    return null;
}

function lum([r, g, b]: RGB): number {
    const f = (v: number) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a: RGB, b: RGB): number {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function effectiveBg(el: Element): RGB {
    let node: Element | null = el;
    while (node && node !== document.documentElement) {
        const rgb = parse(getComputedStyle(node).backgroundColor);
        if (rgb) return rgb;
        node = node.parentElement;
    }
    return document.documentElement.classList.contains('dark') ? [15, 23, 42] : [255, 255, 255];
}

export default function ProseContrastGuard() {
    useEffect(() => {
        let raf = 0;

        const run = () => {
            const isDark = document.documentElement.classList.contains('dark');
            document.querySelectorAll<HTMLElement>('.prose-content [style]').forEach((el) => {
                const st = el.style;
                if (el.dataset.cgInit === undefined) {
                    el.dataset.cgColor = st.color || '';
                    el.dataset.cgBg = st.backgroundColor || '';
                    el.dataset.cgInit = '1';
                }
                // Restore originals so each pass evaluates the author's intent,
                // not our previous override.
                st.color = el.dataset.cgColor || '';
                st.backgroundColor = el.dataset.cgBg || '';

                if (!el.dataset.cgBg && !el.dataset.cgColor) return; // nothing colour-related

                // effectiveBg() reads the element's OWN computed background
                // first (which resolves named colours like "yellow" to rgb),
                // then climbs to the card / page behind it. getComputedStyle is
                // also used for the text colour, so named text colours resolve
                // too.
                const bg = effectiveBg(el);
                const fg = parse(st.color) || parse(getComputedStyle(el).color) || (isDark ? LIGHT_RGB : DARK_RGB);

                if (contrast(fg, bg) >= MIN_CONTRAST) return; // already readable

                st.color = contrast(DARK_RGB, bg) >= contrast(LIGHT_RGB, bg) ? DARK_TEXT : LIGHT_TEXT;
            });
        };

        const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(run); };
        schedule();

        // Re-run when the theme toggles…
        const themeMo = new MutationObserver(schedule);
        themeMo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        // …and when new content mounts (client navigation, lazy sections).
        const domMo = new MutationObserver(schedule);
        domMo.observe(document.body, { childList: true, subtree: true });

        return () => { cancelAnimationFrame(raf); themeMo.disconnect(); domMo.disconnect(); };
    }, []);

    return null;
}
