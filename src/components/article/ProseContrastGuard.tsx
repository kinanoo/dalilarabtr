'use client';

import { useEffect } from 'react';

/**
 * ProseContrastGuard — rescues admin-authored inline TEXT colours that vanish
 * in dark mode.
 *
 * Article bodies are admin HTML. Authors set inline colours tuned for the LIGHT
 * page (e.g. `<ul style="color:#1f2937">`). On the dark page those dark colours
 * become dark-on-dark and disappear.
 *
 * Scope is deliberately narrow — and this is the key lesson from the previous
 * version that made things worse:
 *   • We ONLY touch elements with an inline `color` that are NOT inside an
 *     element carrying its own inline `background`. Colour boxes / highlights
 *     are handled entirely in CSS (globals.css). Skipping them avoids the trap
 *     where `background:linear-gradient(...)` computes as a TRANSPARENT
 *     backgroundColor, which fooled the old guard into reading the dark page
 *     behind the box and flipping the box text to white.
 *   • For the plain-page text we keep, the effective background is a real,
 *     solid theme/card colour, so the contrast measurement is reliable.
 *   • We only intervene when contrast is genuinely too low (<3.0); a colour the
 *     admin chose that still reads (e.g. a teal accent) is left alone.
 *
 * Mounted once site-wide in the root layout (like BodyImageGallery).
 */

type RGB = [number, number, number];

const DARK = '#111827';
const LIGHT = '#f8fafc';
const DARK_RGB: RGB = [17, 24, 39];
const LIGHT_RGB: RGB = [248, 250, 252];
const MIN_CONTRAST = 3.0;

function parse(c: string): RGB | null {
    if (!c) return null;
    const s = c.trim().toLowerCase();
    if (s === 'transparent' || s === 'currentcolor' || s === 'inherit') return null;
    const fn = s.match(/^rgba?\(([^)]+)\)/);
    if (fn) {
        const p = fn[1].split(/[,\s/]+/).map((x) => parseFloat(x)).filter((n) => !Number.isNaN(n));
        if (p.length >= 3) {
            if (p.length >= 4 && p[3] < 0.4) return null;
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
            document.querySelectorAll<HTMLElement>('.prose-content [style*="color"]').forEach((el) => {
                // Colour boxes / highlights are CSS's job — skip anything that
                // sits in (or is) an element with its own inline background.
                if (el.closest('[style*="background"]')) return;

                if (el.dataset.cg === undefined) el.dataset.cg = el.style.color || '';
                el.style.removeProperty('color');
                if (el.dataset.cg) el.style.color = el.dataset.cg;

                const fg = parse(el.style.color) || parse(getComputedStyle(el).color);
                if (!fg) return;
                const bg = effectiveBg(el);
                if (contrast(fg, bg) >= MIN_CONTRAST) return;

                el.style.setProperty('color', contrast(DARK_RGB, bg) >= contrast(LIGHT_RGB, bg) ? DARK : LIGHT, 'important');
                void isDark;
            });
        };

        const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(run); };
        schedule();

        const themeMo = new MutationObserver(schedule);
        themeMo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        const domMo = new MutationObserver(schedule);
        domMo.observe(document.body, { childList: true, subtree: true });

        return () => { cancelAnimationFrame(raf); themeMo.disconnect(); domMo.disconnect(); };
    }, []);

    return null;
}
