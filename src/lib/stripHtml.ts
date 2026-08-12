const NAMED_ENTITIES: Record<string, string> = {
    amp: '&',
    apos: "'",
    bull: '•',
    copy: '©',
    emsp: ' ',
    ensp: ' ',
    gt: '>',
    hellip: '…',
    laquo: '«',
    ldquo: '“',
    lrm: '\u200e',
    lsquo: '‘',
    lt: '<',
    mdash: '—',
    middot: '·',
    nbsp: ' ',
    ndash: '–',
    quot: '"',
    raquo: '»',
    rdquo: '”',
    reg: '®',
    rlm: '\u200f',
    rsquo: '’',
    thinsp: ' ',
    trade: '™',
};

function decodeHtmlEntities(value: string): string {
    return value.replace(/&(#x[\da-f]+|#\d+|[a-z][\da-z]+);/gi, (entity, code: string) => {
        if (code[0] !== '#') return NAMED_ENTITIES[code.toLowerCase()] ?? entity;

        const hex = code[1]?.toLowerCase() === 'x';
        const numericValue = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
        if (
            !Number.isFinite(numericValue)
            || numericValue < 0
            || numericValue > 0x10ffff
            || (numericValue >= 0xd800 && numericValue <= 0xdfff)
        ) {
            return '';
        }

        return String.fromCodePoint(numericValue);
    });
}

function removeMarkup(value: string): string {
    return value
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/<\s*(script|style|template|noscript|iframe|object)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, ' ')
        .replace(/<\s*\/?\s*(?:address|article|aside|blockquote|br|dd|div|dl|dt|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|tbody|td|tfoot|th|thead|tr|ul)\b[^>]*>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/[<>]/g, ' ');
}

/**
 * Convert rich/escaped HTML to display-safe plain text.
 *
 * The small repeated pass also handles content that was escaped more than once,
 * such as `&amp;lt;strong&amp;gt;` from an editor or an import.
 */
export function stripHtml(html: string | undefined | null): string {
    if (!html) return '';

    let text = String(html);
    for (let pass = 0; pass < 3; pass += 1) {
        text = removeMarkup(decodeHtmlEntities(text));
    }

    return decodeHtmlEntities(text)
        .replace(/[\u00a0\u2007\u202f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Return a word-safe, Unicode-safe excerpt with no HTML. */
export function plainTextExcerpt(
    html: string | undefined | null,
    maxLength = 160,
    suffix = '…',
): string {
    const text = stripHtml(html);
    if (!text || maxLength <= 0) return '';

    const characters = Array.from(text);
    if (characters.length <= maxLength) return text;

    const visibleLength = Math.max(1, maxLength - Array.from(suffix).length);
    let excerpt = characters.slice(0, visibleLength).join('').trimEnd();
    const nextCharacter = characters[visibleLength];

    if (excerpt && nextCharacter && !/\s/u.test(nextCharacter) && !/[\s،؛,.!?؟:]/u.test(excerpt.at(-1) || '')) {
        const lastSpace = excerpt.search(/\s+\S*$/u);
        if (lastSpace >= Math.floor(visibleLength * 0.6)) excerpt = excerpt.slice(0, lastSpace);
    }

    return `${excerpt.trimEnd()}${suffix}`;
}
