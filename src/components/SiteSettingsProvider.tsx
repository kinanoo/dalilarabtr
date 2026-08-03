'use client';

import { createContext, useContext } from 'react';
import { SITE_CONFIG } from '@/lib/config';

/**
 * Carries the admin-editable site settings from the server layout down to the
 * client components that need them (every WhatsApp CTA on the site).
 *
 * Why a context and not a direct read: the value lives in Supabase, so it must
 * be fetched on the server; but the consumers — the floating assistant, the
 * consultant CTA, the contact and request forms — are client components. The
 * layout resolves it once per rendered page and hands it down, so no component
 * ever fetches and nothing runs per visitor.
 */

const FALLBACK = String(SITE_CONFIG.whatsapp || '').replace(/\D/g, '');

const SiteSettingsContext = createContext<{ whatsapp: string }>({ whatsapp: FALLBACK });

export function SiteSettingsProvider({
    value,
    children,
}: {
    value: { whatsapp: string };
    children: React.ReactNode;
}) {
    return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

/** The site-wide WhatsApp number, digits only, ready for a wa.me URL. */
export function useSiteWhatsApp(): string {
    return useContext(SiteSettingsContext).whatsapp || FALLBACK;
}
