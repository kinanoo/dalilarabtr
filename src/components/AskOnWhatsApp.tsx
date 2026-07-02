'use client';

import { MessageCircle } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/config';

/**
 * AskOnWhatsApp — an inline "didn't understand? message us" CTA for content
 * pages (articles, news, info pages, security codes). NOT for the services
 * directory, which has its own per-provider contact buttons.
 *
 * Clicking opens a WhatsApp chat to the site's number
 * (SITE_CONFIG.whatsapp, overridable via NEXT_PUBLIC_WHATSAPP_PHONE) with the
 * page title + URL pre-filled, so the admin instantly knows which topic the
 * visitor is asking about. The bare wa.me link is the href fallback (works
 * without JS); the click handler adds the contextual message.
 *
 * `lang="tr"` renders the Turkish variant (used on /codes?lang=tr pages).
 */
const STRINGS = {
    ar: {
        title: 'هل الإجراء معقّد؟',
        sub: 'يمكنك استشارتنا مجاناً، وسنوضّح لك الخطوات مباشرةً.',
        button: 'انقر هنا للاستشارة',
        msg: (title: string, url: string) =>
            `السلام عليكم\nأرغب باستشارة بخصوص: «${title}»\n${url}\n\nأرجو توضيح الخطوات من فضلكم.`,
    },
    tr: {
        title: 'Sorunuz mu var?',
        sub: 'Bize ücretsiz danışabilirsiniz, adımları doğrudan açıklarız.',
        button: 'WhatsApp\'tan danışın',
        msg: (title: string, url: string) =>
            `Merhaba,\n«${title}» hakkında danışmak istiyorum.\n${url}\n\nAdımları açıklayabilir misiniz?`,
    },
} as const;

export default function AskOnWhatsApp({ topic, lang = 'ar' }: { topic?: string; lang?: 'ar' | 'tr' }) {
    const num = (SITE_CONFIG.whatsapp || '').replace(/\D/g, '');
    if (!num) return null;
    const t = STRINGS[lang];

    const openWithContext = () => {
        const title = (topic || (typeof document !== 'undefined' ? document.title : '') || '').trim();
        const url = typeof location !== 'undefined' ? location.href : '';
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(t.msg(title, url))}`, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="my-6 flex flex-col items-center gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-l from-emerald-50 to-teal-50/50 p-5 text-center dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-slate-900 sm:flex-row sm:text-start">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/30">
                <MessageCircle size={24} />
            </div>
            <div className="min-w-0 flex-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white">{t.title}</h3>
                <p className="mt-0.5 text-sm font-medium text-slate-600 dark:text-slate-300">{t.sub}</p>
            </div>
            <a
                href={`https://wa.me/${num}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => { e.preventDefault(); openWithContext(); }}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-700 active:scale-95"
            >
                <MessageCircle size={18} />
                {t.button}
            </a>
        </div>
    );
}
