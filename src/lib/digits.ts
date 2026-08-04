/**
 * Normalize Arabic-Indic (٠-٩, U+0660–0669) and Persian (۰-۹, U+06F0–06F9)
 * digits to Latin 0-9. House style is Latin digits everywhere; some
 * provider-entered free text (e.g. opening hours "١٠:٠٠") arrives with
 * Arabic-Indic numerals, so normalize at render.
 */
export function toLatinDigits(input: string | null | undefined): string {
    if (!input) return '';
    return input.replace(/[٠-٩۰-۹]/g, (d) => {
        const code = d.charCodeAt(0);
        if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
        return String(code - 0x06f0);
    });
}

/**
 * Keep a number glued to the Arabic word it counts.
 *
 * A Latin number inside RTL text is its own bidi run, so a line break is
 * allowed between it and the noun that follows. In a headline that reads
 * "…: 72 موقوفاً" the wrap point often lands exactly there, leaving "72"
 * stranded at the end of one line and "موقوفاً" opening the next — the number
 * appears detached from what it counts, which is what readers notice first in
 * an Arabic headline.
 *
 * Replacing that one space with U+00A0 makes the pair unbreakable, so the wrap
 * moves to the previous space instead. Counted phrases are short ("687 شخصاً"),
 * so nothing can overflow a narrow screen.
 *
 * Only the space between a digit run and a following Arabic letter is touched:
 * "16 ولاية" binds, while "2026 — النص" or "1,045 عقاراً و15 مركبة" keep every
 * other break opportunity intact.
 */
export function bindNumbersToWords(input: string | null | undefined): string {
    if (!input) return '';
    return input.replace(/(\d[\d.,]*)[ \t]+(?=[؀-ۿ])/g, '$1 ');
}
