import 'server-only';
import { supabase } from '@/lib/supabaseClient';
import { SITE_CONFIG } from '@/lib/config';
import logger from '@/lib/logger';

/**
 * Server-side resolver for the settings the admin panel actually edits.
 *
 * The bug this fixes: /admin/settings writes `site_settings.whatsapp_number`
 * and the write succeeds — but nothing on the public site ever read that
 * column. All ten call sites read `SITE_CONFIG.whatsapp`, which is
 * `process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '<hardcoded>'`, baked at build
 * time. So the owner could change the number, see it saved, and watch the site
 * keep serving the old one forever. (There WAS a resolver, remoteData's
 * fetchDefaultWhatsApp, but it selected a column named `default_whatsapp`,
 * which does not exist on the table — it failed silently and returned null.)
 *
 * Uses the anon `supabase` client, never `cookies()`, so pages calling this
 * stay statically renderable and the read is amortised by their ISR window
 * instead of running per visitor.
 */

export type SiteSettings = {
    whatsapp: string;
};

const FALLBACK: SiteSettings = {
    whatsapp: String(SITE_CONFIG.whatsapp || '').replace(/\D/g, ''),
};

export async function getSiteSettings(): Promise<SiteSettings> {
    if (!supabase) return FALLBACK;
    try {
        const { data, error } = await supabase
            .from('site_settings')
            .select('whatsapp_number')
            .eq('id', 1)
            .maybeSingle();

        if (error) {
            logger.error('site_settings read failed:', error);
            return FALLBACK;
        }

        const raw = (data as { whatsapp_number?: unknown } | null)?.whatsapp_number;
        const digits = typeof raw === 'string' ? raw.replace(/\D/g, '') : '';
        // A too-short value means someone half-typed it in the admin form;
        // serving that would produce a dead wa.me link on every page.
        return digits.length >= 8 ? { whatsapp: digits } : FALLBACK;
    } catch (e) {
        logger.error('site_settings read threw:', e);
        return FALLBACK;
    }
}
