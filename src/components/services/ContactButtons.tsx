'use client';

import { PhoneCall, MessageCircle } from 'lucide-react';
import type { ProviderCardData } from './ProviderCard';
import { SITE_CONFIG } from '@/lib/config';

/**
 * Contact actions (WhatsApp + call) with click tracking. Logs a
 * `service_contact` event into the site's own analytics (/api/track →
 * analytics_events) so the owner can see which providers get contacted, and
 * mirrors it to GA. sendBeacon is used so the event survives the immediate
 * navigation to WhatsApp / the dialer.
 */
function trackContact(p: ProviderCardData, channel: 'whatsapp' | 'call') {
    try {
        const payload = JSON.stringify({
            event_name: 'service_contact',
            page_path: typeof location !== 'undefined' ? location.pathname : '/services',
            visitor_id: localStorage.getItem('visitor_id') || undefined,
            session_id: sessionStorage.getItem('session_id') || undefined,
            meta: { provider_id: p.id, provider_name: p.name, channel, profession: p.profession || undefined, city: p.city || undefined },
        });
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
        } else {
            fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
        }
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'service_contact', { event_category: 'conversion', event_label: p.name });
        }
    } catch { /* tracking must never block the contact action */ }
}

const waUrl = (p: ProviderCardData) => {
    if (!p.phone) return '';
    // Include the provider's own listing link so they instantly see the client
    // came from دليل العرب + exactly which service page — builds trust and lets
    // the owner attribute the lead to the site.
    const listing = `${SITE_CONFIG.siteUrl}/services/${p.slug || p.id}`;
    const service = p.profession || p.name || 'خدمتك';
    const msg = `مرحباً، وصلت إليك عبر موقع "دليل العرب" 🧭\nرأيت خدمتك "${service}" على هذا الرابط:\n${listing}`;
    return `https://wa.me/${p.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
};

// Returns a fragment (WhatsApp + call) so the parent card/row controls layout.
export default function ContactButtons({ p, compact = false }: { p: ProviderCardData; compact?: boolean }) {
    return (
        <>
            <a
                href={waUrl(p)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackContact(p, 'whatsapp')}
                className={`${compact ? 'h-10 px-3 sm:px-4' : 'flex-1 py-2.5'} inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-sm shadow-emerald-600/20 active:scale-95 transition-all`}
            >
                <MessageCircle size={15} /><span className={compact ? 'hidden sm:inline' : ''}>واتساب</span>
            </a>
            {p.phone && (
                <a
                    href={`tel:${p.phone}`}
                    aria-label={`اتصال بـ ${p.name}`}
                    onClick={() => trackContact(p, 'call')}
                    className={`inline-flex items-center justify-center ${compact ? 'w-10 h-10' : 'w-11 h-[42px]'} rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 active:scale-95 transition-all`}
                >
                    <PhoneCall size={compact ? 15 : 16} />
                </a>
            )}
        </>
    );
}
