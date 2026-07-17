'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { isPrivateModelSharePath } from '@/lib/models/routes';

/**
 * Client visibility gate for the (server-rendered) footer.
 *
 * Footer used to be one big 'use client' component just so it could call
 * usePathname() to hide itself on /admin and private model-share pages. That
 * shipped + hydrated ~160 lines of purely static JSX on every page. Now the
 * footer content is a server component passed in as children (zero client
 * JS), and only this tiny gate hydrates.
 */
export default function FooterGate({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    if (pathname?.startsWith('/admin') || isPrivateModelSharePath(pathname)) return null;
    return <>{children}</>;
}
