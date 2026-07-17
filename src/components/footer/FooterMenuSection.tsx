'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useSiteConfig } from '@/lib/hooks/useSiteConfig';

/**
 * DB-driven footer menu override.
 *
 * The owner can manage footer links in site_menus (locations
 * footer_section_1 / footer_section_2). When rows exist they replace the
 * hardcoded defaults; otherwise the server-rendered fallback <li>s passed as
 * children show. Children arrive pre-rendered from the server Footer, so the
 * fallback lists cost no client JS — this island only ships the swap logic.
 * SSR renders children (SWR has no data on the server), exactly matching the
 * previous all-client footer's initial HTML.
 */
export default function FooterMenuSection({
    section,
    children,
}: {
    section: 'section1' | 'section2';
    children: ReactNode;
}) {
    const { data: siteConfig } = useSiteConfig();
    const items = siteConfig?.footerMenus?.[section] ?? [];

    if (items.length === 0) return <>{children}</>;

    return (
        <>
            {items.map((item: { id: string; label: string; href: string }) => (
                <li key={item.id}>
                    {/* prefetch={false} matches the server-rendered fallback links:
                        footer links sit below the fold and are low-intent, and
                        Next 16 was eagerly prefetching their routes' chunks on
                        every page view (~100KB gz just for /consultant). */}
                    <Link prefetch={false} href={item.href} className="hover:text-emerald-400 transition-colors flex items-center gap-2 py-1">
                        {item.label}
                    </Link>
                </li>
            ))}
        </>
    );
}
