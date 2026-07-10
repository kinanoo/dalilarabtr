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
