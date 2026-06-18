'use client';

/**
 * EndOfArticleShare — large, emotionally-timed share CTA at the article's end.
 *
 * Why it exists: ShareMenu sits in the hero meta bar. By the time a reader
 * finishes a 15-minute legal/procedural piece, they've scrolled far past it.
 * The peak emotional moment ("this is so useful") is right after the
 * conclusion — that's when they want to share. Showing the WhatsApp button
 * at that moment converts much better than a hero icon they scrolled past.
 *
 * Design choices:
 *   - WhatsApp is the *primary* CTA, big and green. For our MENA/Syrian
 *     audience it's the dominant share channel — burying it equal-weight
 *     beside LinkedIn wastes the prime click.
 *   - Pre-filled share text includes a short framing line + URL, so the
 *     receiver sees context not just a bare link. This lifts click-through
 *     on the recipient's side too.
 *   - Telegram + Native Share (mobile) as secondary buttons — covers the
 *     other realistic share channels without bloat.
 *   - Plain Arabic copy ("شاركه يصل لمن يحتاجه") frames sharing as helping
 *     someone, not as social promotion. That resonates with our community.
 */

import { useEffect, useState } from 'react';
import { Send, Share2 } from 'lucide-react';
import { stripHtml } from '@/lib/stripHtml';

// Inline WhatsApp icon (same SVG used in ShareMenu) — duplicated to keep this
// component self-contained and avoid circular dependencies on ShareMenu.
function WhatsAppIcon({ size = 22 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    );
}

function TelegramIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
    );
}

interface Props {
    /** Article title — used as the first line of the pre-filled share text. */
    title: string;
    /** Canonical article URL (absolute). */
    url: string;
    /** Optional short summary (article intro/excerpt). Adds 1-2 lines of
        context to the shared message so the recipient sees more than just a
        link. Truncated to ~140 chars to keep WhatsApp previews clean. */
    excerpt?: string;
}

export default function EndOfArticleShare({ title, url, excerpt }: Props) {
    const [canNativeShare, setCanNativeShare] = useState(false);

    useEffect(() => {
        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        setCanNativeShare(isMobile && typeof navigator.share === 'function');
    }, []);

    // Build the pre-filled share message. Strip HTML from both title and
    // excerpt — article.intro arrives as raw HTML (`<strong>...</strong>`,
    // `<br/>`) and WhatsApp/Telegram render the tags literally, so the
    // receiver sees the markup not the prose. Encoded once, reused for both
    // WhatsApp and Telegram which accept the same query-string text format.
    const cleanTitle = stripHtml(title);
    const cleanExcerpt = stripHtml(excerpt);
    const summary = cleanExcerpt ? cleanExcerpt.slice(0, 140).trim() + (cleanExcerpt.length > 140 ? '…' : '') : '';
    const messageBody = summary ? `${cleanTitle}\n\n${summary}\n\n${url}` : `${cleanTitle}\n\n${url}`;
    const encoded = encodeURIComponent(messageBody);
    const whatsappLink = `https://wa.me/?text=${encoded}`;
    const telegramLink = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(cleanTitle)}`;

    const handleNativeShare = async () => {
        if (canNativeShare && navigator.share) {
            try {
                await navigator.share({ title: cleanTitle, text: summary || cleanTitle, url });
            } catch {
                // user cancelled
            }
        }
    };

    return (
        <section
            className="
                relative overflow-hidden rounded-3xl
                bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700
                dark:from-emerald-700 dark:via-emerald-800 dark:to-teal-900
                text-white p-6 sm:p-8
                shadow-xl shadow-emerald-500/20
            "
            aria-label="شارك هذا المقال"
        >
            {/* Decorative blobs — pure visual flair, no semantic weight. */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-teal-300/20 rounded-full blur-3xl" aria-hidden="true" />

            <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm">
                        <Share2 size={22} />
                    </span>
                    <div>
                        <h3 className="text-xl sm:text-2xl font-black leading-tight">
                            هل أعجبك المقال؟
                        </h3>
                        <p className="text-sm sm:text-base text-emerald-50 mt-0.5">
                            شاركه يصل لمن يحتاجه — دقيقة منك قد توفّر على أحدهم شهوراً من المشاكل.
                        </p>
                    </div>
                </div>

                {/* Primary CTA: WhatsApp — the dominant share channel for our
                    audience. Rendered as a real <a> so long-press / open-in-new-tab
                    behave naturally on every platform. */}
                <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                        mt-4 w-full flex items-center justify-center gap-3
                        bg-white text-emerald-700 hover:bg-emerald-50
                        font-black py-4 px-5 rounded-2xl
                        transition-all hover:scale-[1.01]
                        shadow-lg shadow-black/10
                    "
                >
                    <WhatsAppIcon size={24} />
                    <span className="text-base sm:text-lg">مشاركة عبر واتساب</span>
                </a>

                {/* Secondary row — Telegram + (mobile-only) native share. We
                    intentionally drop X/Facebook/LinkedIn here: the hero already
                    has the full menu; this footer slot is for the high-intent
                    1-tap channels, not the long tail. */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                    <a
                        href={telegramLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                            flex items-center justify-center gap-2
                            bg-sky-500 hover:bg-sky-600
                            text-white font-bold py-3 px-4 rounded-2xl
                            transition-all
                            shadow-md
                        "
                    >
                        <TelegramIcon size={20} />
                        <span>تيليجرام</span>
                    </a>
                    {canNativeShare ? (
                        <button
                            type="button"
                            onClick={handleNativeShare}
                            className="
                                flex items-center justify-center gap-2
                                bg-white/15 hover:bg-white/25
                                text-white font-bold py-3 px-4 rounded-2xl
                                backdrop-blur-sm border border-white/20
                                transition-all
                            "
                        >
                            <Send size={20} />
                            <span>المزيد…</span>
                        </button>
                    ) : (
                        // Desktop fallback: keep the grid symmetrical, send users
                        // to the existing ShareMenu trigger in the hero. Plain
                        // anchor with hash so we don't depend on a JS bridge.
                        <a
                            href="#share-from-top"
                            onClick={(e) => {
                                e.preventDefault();
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="
                                flex items-center justify-center gap-2
                                bg-white/15 hover:bg-white/25
                                text-white font-bold py-3 px-4 rounded-2xl
                                backdrop-blur-sm border border-white/20
                                transition-all
                            "
                        >
                            <Share2 size={20} />
                            <span>مشاركات أخرى</span>
                        </a>
                    )}
                </div>
            </div>
        </section>
    );
}
