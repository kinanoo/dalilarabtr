/**
 * FeaturedNewsHero — the homepage's "show this above everything" slot.
 *
 * The use case: a piece of news lands that the entire audience has been
 * waiting for (e.g. Istanbul lifting the ban on 49 closed neighborhoods).
 * Burying it in the regular updates carousel wastes the moment. This
 * widget renders right under the hero, dominates the fold, and sells
 * the click in two seconds.
 *
 * Data source: the most recent active+approved article that carries the
 * sentinel tag `خبر_رئيسي` ("featured news"). Tagging is set from the
 * admin article editor or directly via SQL. There can be many tagged
 * articles; we always show the freshest by published_at.
 *
 * Renders nothing when no tagged article exists — silent fallback, the
 * homepage flows normally.
 *
 * Server component on purpose: it should appear in the initial HTML so
 * social-share crawlers (WhatsApp, Facebook, Twitter) can preview the
 * card content properly when the homepage URL is shared.
 */

import Link from 'next/link';
import { supabase, withTimeout } from '@/lib/supabaseClient';
import { Flame, ArrowLeft, Calendar, Share2 } from 'lucide-react';

const FEATURED_TAG = 'خبر_رئيسي';

interface FeaturedArticle {
    slug: string;
    title: string;
    intro: string | null;
    category: string | null;
    published_at: string | null;
    image: string | null;
}

const AR_MONTHS = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

function formatDate(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function stripHtml(html: string | null, max = 220): string {
    if (!html) return '';
    const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (text.length <= max) return text;
    return text.slice(0, max - 1).trim() + '…';
}

async function getFeatured(): Promise<FeaturedArticle | null> {
    if (!supabase) return null;
    try {
        const result = await withTimeout(
            supabase
                .from('articles')
                .select('slug, title, intro, category, published_at, image')
                .contains('tags', [FEATURED_TAG])
                .eq('active', true)
                .eq('status', 'approved')
                .order('published_at', { ascending: false })
                .limit(1),
            5000,
        );
        const rows = (result as { data?: FeaturedArticle[] } | null)?.data;
        return rows && rows.length > 0 ? rows[0] : null;
    } catch {
        return null;
    }
}

export default async function FeaturedNewsHero() {
    const article = await getFeatured();
    if (!article) return null;

    const date = formatDate(article.published_at);
    const summary = stripHtml(article.intro, 240);
    const href = `/article/${article.slug}`;

    return (
        <section
            className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-rose-950 to-slate-950 py-10 sm:py-14 border-b border-rose-900/40"
            dir="rtl"
            aria-label="خبر عاجل"
        >
            {/* Animated red orb top-right — gives the "breaking" feeling */}
            <div
                aria-hidden="true"
                className="absolute -top-32 -right-32 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none animate-pulse"
                style={{ animationDuration: '4s' }}
            />
            <div
                aria-hidden="true"
                className="absolute -bottom-32 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
            />

            {/* Decorative diagonal stripes — "newsroom" texture */}
            <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.5) 35px, rgba(255,255,255,0.5) 36px)',
                }}
            />

            <div className="relative max-w-6xl mx-auto px-4">
                <div className="grid lg:grid-cols-[1fr_auto] gap-6 lg:gap-10 items-center">
                    {/* Main content */}
                    <Link href={href} className="block group">
                        {/* Breaking label — red pill with pulsing dot */}
                        <div className="inline-flex items-center gap-2 bg-rose-600 text-white px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-black tracking-[0.18em] uppercase mb-4 shadow-lg shadow-rose-900/50">
                            <span className="relative inline-flex items-center justify-center w-2 h-2">
                                <span className="absolute inline-flex w-2 h-2 rounded-full bg-white opacity-75 animate-ping" />
                                <span className="relative inline-flex w-2 h-2 rounded-full bg-white" />
                            </span>
                            <Flame size={12} />
                            <span>خبر عاجل · BREAKING</span>
                        </div>

                        {/* Category + date — sub-meta line */}
                        <div className="flex items-center gap-3 text-xs sm:text-sm text-rose-200/80 mb-3">
                            {article.category && (
                                <span className="bg-white/10 backdrop-blur-sm border border-white/15 px-2.5 py-0.5 rounded-full font-bold">
                                    {article.category}
                                </span>
                            )}
                            {date && (
                                <span className="inline-flex items-center gap-1 font-bold">
                                    <Calendar size={12} />
                                    {date}
                                </span>
                            )}
                        </div>

                        {/* The headline — large, attention-stealing. Arabic
                            needs more line-height than English at bold
                            weights: descenders + diacritics on lines below
                            collide with ascenders on lines above when
                            leading is tight. 1.6 gives breathing room
                            without losing the "compact headline" feel. */}
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-[1.6] text-white drop-shadow-lg group-hover:text-rose-100 transition-colors">
                            {article.title}
                        </h2>

                        {summary && (
                            <p className="mt-4 text-sm sm:text-base text-rose-100/85 leading-relaxed max-w-3xl">
                                {summary}
                            </p>
                        )}

                        {/* Inline CTA — large white pill with arrow */}
                        <div className="mt-6 inline-flex items-center gap-2 bg-white text-rose-700 hover:bg-rose-50 font-black px-5 py-3 rounded-2xl text-sm sm:text-base shadow-xl shadow-rose-900/30 group-hover:scale-[1.02] transition-all">
                            <span>اقرأ التفاصيل كاملة</span>
                            <ArrowLeft size={18} />
                        </div>
                    </Link>

                    {/* Right-side share callout — encourages sharing without
                        being aggressive. Only on lg+ to keep mobile clean. */}
                    <div className="hidden lg:block">
                        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 max-w-xs text-center shadow-xl shadow-rose-900/30">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/15 mb-3">
                                <Share2 size={22} className="text-white" />
                            </div>
                            <div className="text-sm font-black text-white mb-1">شارك الخبر</div>
                            <div className="text-xs text-rose-100/70 leading-relaxed mb-3">
                                ساعد من ينتظر هذه المعلومة منذ سنوات
                            </div>
                            <ShareButtons href={href} title={article.title} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Inline WhatsApp + Telegram share buttons — server-rendered (just <a>
// tags, no JS needed). The href params are URL-encoded text the receiver
// sees in their chat preview.
function ShareButtons({ href, title }: { href: string; title: string }) {
    const fullUrl = `https://dalilarabtr.com${href}`;
    const text = `${title}\n\n${fullUrl}`;
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    const tg = `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`;
    return (
        <div className="flex items-center justify-center gap-2">
            <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3.5 rounded-xl text-xs transition-colors"
                aria-label="مشاركة عبر واتساب"
            >
                {/* WhatsApp glyph */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                </svg>
                واتساب
            </a>
            <a
                href={tg}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-3.5 rounded-xl text-xs transition-colors"
                aria-label="مشاركة عبر تلغرام"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                تلغرام
            </a>
        </div>
    );
}
