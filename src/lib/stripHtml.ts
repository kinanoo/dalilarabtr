/** Strip HTML tags from a string, returning plain text. Safe for both HTML and plain text input. */
export function stripHtml(html: string | undefined | null): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
}
