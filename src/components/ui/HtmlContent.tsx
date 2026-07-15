import { sanitizeHtmlContent } from '@/lib/sanitize';

interface HtmlContentProps {
    html: string;
    className?: string;
}

/**
 * Renders sanitized HTML content with the `prose-content` class
 * for consistent rich-text styling across public pages.
 *
 * SERVER component on purpose. It was a client component whose only job was to
 * run the sanitizer in a useMemo — which pulled sanitize-html + htmlparser2 +
 * entities (~93KB gzip) into the browser bundle of every page that renders
 * rich text, to clean HTML that comes from our own admin. Sanitizing here runs
 * once per render on the server with the identical whitelist, and the browser
 * receives only the finished HTML.
 *
 * ⚠️ Do not add 'use client' or hooks here, and do not import it from a client
 * component — either would drag the sanitizer back into the client bundle.
 * A client caller must sanitize its HTML before rendering it instead.
 */
export default function HtmlContent({ html, className = '' }: HtmlContentProps) {
    const safeHtml = sanitizeHtmlContent(html);

    return (
        <div
            className={`prose-content ${className}`}
            dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
    );
}
