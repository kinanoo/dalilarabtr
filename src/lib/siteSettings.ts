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
    /**
     * Master switch for every way a visitor can reach the owner directly.
     * When false the site shows NO contact surface at all — no consultation
     * block, no floating button, no contact-page WhatsApp, no request form,
     * and no phone number in the structured data Google reads. The owner turns
     * it on when he is available and off when he is not; the rest of the site
     * keeps working untouched.
     */
    contactEnabled: boolean;
};

const FALLBACK: SiteSettings = {
    whatsapp: String(SITE_CONFIG.whatsapp || '').replace(/\D/g, ''),
    // Default ON so a failed read never silently hides the funnel; only an
    // explicit `false` in the database turns contact off.
    contactEnabled: true,
};

type SettingsRow = { whatsapp_number?: unknown; contact_enabled?: unknown } | null;

export async function getSiteSettings(): Promise<SiteSettings> {
    if (!supabase) return FALLBACK;
    const client = supabase;
    try {
        // Two-step read, and the retry is the point. PostgREST rejects the
        // WHOLE query when one selected column does not exist, so asking for
        // contact_enabled before its migration has run would not "degrade
        // gracefully" — it would fail the read outright and silently drop the
        // site back to the hardcoded fallback number. Caught in local testing:
        // every page went back to serving the old number. So: try the full
        // select, and on any error retry with just the column we know exists.
        let row: SettingsRow = null;
        let contactColumnMissing = false;

        const full = await client
            .from('site_settings')
            .select('whatsapp_number, contact_enabled')
            .eq('id', 1)
            .maybeSingle();

        if (full.error) {
            contactColumnMissing = true;
            const basic = await client
                .from('site_settings')
                .select('whatsapp_number')
                .eq('id', 1)
                .maybeSingle();
            if (basic.error) {
                logger.error('site_settings read failed:', basic.error);
                return FALLBACK;
            }
            row = basic.data as SettingsRow;
        } else {
            row = full.data as SettingsRow;
        }

        if (contactColumnMissing && row) {
            // Column not deployed yet: keep the admin-set number, contact on.
            const digitsOnly = typeof row.whatsapp_number === 'string'
                ? row.whatsapp_number.replace(/\D/g, '') : '';
            const phone = digitsOnly.length >= 8 ? digitsOnly : FALLBACK.whatsapp;
            return { whatsapp: phone, contactEnabled: phone.length >= 8 };
        }

        const raw = row?.whatsapp_number;
        const digits = typeof raw === 'string' ? raw.replace(/\D/g, '') : '';
        // A too-short value means someone half-typed it in the admin form;
        // serving that would produce a dead wa.me link on every page.
        const whatsapp = digits.length >= 8 ? digits : FALLBACK.whatsapp;

        // Only an explicit false disables; anything else keeps contact on.
        const contactEnabled = row?.contact_enabled !== false;

        // A switch that is on but has no usable number is still "off" in
        // practice — better to render nothing than a dead link.
        return { whatsapp, contactEnabled: contactEnabled && whatsapp.length >= 8 };
    } catch (e) {
        logger.error('site_settings read threw:', e);
        return FALLBACK;
    }
}
