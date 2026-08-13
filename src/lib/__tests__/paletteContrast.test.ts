/**
 * The palette is a contract, not a preference.
 *
 * 2026-08: the site carried 4,471 colour-class usages across 17 hues, with the
 * hue usually chosen by an item's INDEX rather than its meaning — ten grounds
 * on the homepage carousel, thirteen gradients on the tools hub, one hue per
 * FAQ section. That was collapsed to: ink for structure, ONE brand accent for
 * what is interactive, and semantic colour only where it carries information
 * (red = danger, amber = caution).
 *
 * Cleaning up the hues surfaced real contrast bugs underneath them, so both
 * halves are pinned here:
 *
 *   1. every role in the palette clears its WCAG 2.1 floor — computed, not
 *      asserted from a table someone typed once;
 *   2. the specific class pairings that were WRONG cannot come back.
 *
 * Why arithmetic instead of a screenshot: this repo's preview pane does not
 * composite, so rendered measurement returns zero-sized boxes and samples only
 * fixed chrome (learned the hard way). Tailwind's hex values are fixed, so the
 * ratios can be computed exactly and checked in CI on every run.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const HEX: Record<string, string> = {
    white: '#ffffff',
    'slate-300': '#cbd5e1',
    'slate-400': '#94a3b8',
    'slate-800': '#1e293b',
    'slate-900': '#0f172a',
    'slate-950': '#020617',
    'emerald-100': '#d1fae5',
    'emerald-400': '#34d399',
    'emerald-600': '#059669',
    'emerald-700': '#047857',
    'teal-700': '#0f766e',
    'red-800': '#991b1b',
    'amber-100': '#fef3c7',
    /** The site's light page ground — cream, NOT white. It is ~8% darker, and
     *  that difference is exactly what pushed slate-500 under the AA floor. */
    cream: '#faf6ee',
    /** What the two lightest grey utilities resolve to in light mode after the
     *  floor in globals.css (raw slate-500 on cream is 4.41:1 — a near miss,
     *  which is the worst kind: invisible in review, real for the reader). */
    'meta(floored)': '#475569',
    'soft(floored)': '#5a6675',
};

function luminance(hex: string): number {
    const chan = (i: number) => parseInt(hex.slice(i, i + 2), 16) / 255;
    const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * lin(chan(1)) + 0.7152 * lin(chan(3)) + 0.0722 * lin(chan(5));
}

function contrast(fg: string, bg: string): number {
    const a = luminance(HEX[fg]);
    const b = luminance(HEX[bg]);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** [role, foreground, background, floor]. 4.5 = body text (WCAG 1.4.3),
 *  3.0 = icons and other graphical objects (WCAG 1.4.11). */
const CONTRACT: Array<[string, string, string, number]> = [
    ['body text (light)', 'slate-800', 'cream', 4.5],
    ['meta text (light)', 'meta(floored)', 'cream', 4.5],
    ['soft meta (light)', 'soft(floored)', 'cream', 4.5],
    ['link / accent (light)', 'emerald-700', 'cream', 4.5],
    ['button label', 'white', 'emerald-700', 4.5],
    ['badge count on chip', 'emerald-100', 'emerald-700', 4.5],
    ['icon on brand chip', 'white', 'emerald-600', 3.0],
    ['icon on ramp end', 'white', 'teal-700', 3.0],
    ['body text (dark)', 'slate-300', 'slate-900', 4.5],
    ['meta text (dark)', 'slate-400', 'slate-950', 4.5],
    ['accent (dark)', 'emerald-400', 'slate-900', 4.5],
    ['footer meta', 'slate-400', 'slate-950', 4.5],
    ['danger chip', 'red-800', 'amber-100', 4.5],
];

function walk(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full, out);
        else if (entry.endsWith('.tsx')) out.push(full);
    }
    return out;
}

describe('palette contrast contract', () => {
    it.each(CONTRACT)('%s clears its WCAG floor', (_role, fg, bg, floor) => {
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(floor);
    });

    it('never puts white text on emerald-500/600 again', () => {
        // Measured: 2.6:1 and 3.8:1 — both under the 4.5:1 floor for label
        // text. Buttons carry bg-emerald-700 (5.5:1). Gradients are exempt:
        // there the emerald end holds a white ICON, which needs only 3:1.
        //
        // The pairing has to be checked PER VARIANT CONTEXT, not per line. A
        // line reading `text-white … dark:hover:bg-emerald-500
        // dark:hover:text-slate-950` is correct — the white label belongs to
        // the light-mode slate button, and the bright dark-mode hover carries
        // an ink label (7.9:1). Matching `text-white` anywhere against
        // `bg-emerald-500` anywhere flagged exactly that, three times, on
        // buttons that render fine. So: for each emerald surface, look only at
        // the text colour that actually applies in ITS context.
        const badPairing = (line: string): boolean => {
            if (line.includes('gradient')) return false;
            const SURFACE = /\b((?:[\w-]+:)*)bg-emerald-(?:500|600)\b/g;
            for (const m of line.matchAll(SURFACE)) {
                const variant = m[1];                           // '' | 'dark:hover:' | …
                if (variant) {
                    const esc = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    // A text colour declared in the surface's own context wins.
                    if (new RegExp(`\\b${esc}text-(?!white\\b)[\\w-]+`).test(line)) continue;
                    if (new RegExp(`\\b${esc}text-white\\b`).test(line)) return true;
                }
                // Otherwise the base text colour is what paints the label.
                if (/(?:^|["'\s{])text-white\b/.test(line)) return true;
            }
            return false;
        };

        // The detector is itself pinned, so a future "fix" that quietly stops
        // detecting anything fails here rather than passing silently.
        expect(badPairing('className="bg-emerald-600 text-white"')).toBe(true);
        expect(badPairing("? 'bg-emerald-500 text-white' : ''")).toBe(true);
        expect(badPairing('className="bg-emerald-700 text-white"')).toBe(false);
        expect(badPairing(
            'className="bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950 ' +
            'dark:hover:bg-emerald-500 dark:hover:text-slate-950"')).toBe(false);
        expect(badPairing(
            'className="bg-slate-950 text-white dark:hover:bg-emerald-500 ' +
            'dark:hover:text-white"')).toBe(true);

        const offenders: string[] = [];
        for (const file of walk(join(process.cwd(), 'src'))) {
            readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
                if (badPairing(line)) offenders.push(`${file.replace(process.cwd(), '')}:${i + 1}`);
            });
        }
        expect(offenders).toEqual([]);
    });

    it('never makes dark-mode grey darker than light-mode grey', () => {
        // `text-slate-400 dark:text-slate-500` was written 59 times: the dark
        // theme got the DARKER ink on the DARKER ground (4.2:1 on slate-950).
        const offenders: string[] = [];
        for (const file of walk(join(process.cwd(), 'src'))) {
            readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
                if (/\bdark:text-slate-500\b/.test(line)) {
                    offenders.push(`${file.replace(process.cwd(), '')}:${i + 1}`);
                }
            });
        }
        expect(offenders).toEqual([]);
    });
});
