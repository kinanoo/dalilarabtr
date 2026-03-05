'use client';

import DOMPurify from 'isomorphic-dompurify';
import { useMemo } from 'react';

interface HtmlContentProps {
    html: string;
    className?: string;
}

/**
 * Renders sanitized HTML content with the `prose-content` class
 * for consistent rich-text styling across public pages.
 */
export default function HtmlContent({ html, className = '' }: HtmlContentProps) {
    const safeHtml = useMemo(() => DOMPurify.sanitize(html), [html]);

    return (
        <div
            className={`prose-content ${className}`}
            dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
    );
}
