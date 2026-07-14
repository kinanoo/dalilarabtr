'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import type { Article } from '@/lib/types'; // Only Type
import { getOfficialSourceUrls } from '@/lib/externalLinks';
import { FileText, CheckCircle, AlertTriangle, ListOrdered, Printer, Sparkles, Lightbulb, Coins, Info, ExternalLink, ChevronDown, Clock, Eye, RefreshCw, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import ShareMenu from './ShareMenu';
import BookmarkButton from './BookmarkButton';
import { SITE_CONFIG, CATEGORY_SLUGS, TAG_LABELS } from '@/lib/config';
import Breadcrumbs from './Breadcrumbs';
import InlineRelatedArticles from './InlineRelatedArticles';

import { deobfuscate, isObfuscated } from '@/lib/security';
import DOMPurify from '@/lib/sanitize';
import { estimateReadingTime, isRecentlyUpdated, formatViewCount } from '@/lib/articleMeta';
import ArticleTOC from './article/ArticleTOC';
import ReadingProgressBar from './article/ReadingProgressBar';
import ArticleHeroImage from './article/ArticleHeroImage';
import ArticleHeroGallery from './article/ArticleHeroGallery';

export default function ArticleView({ article, slug, initialComments, children }: { article: Article, slug: string, initialComments?: any[], children?: React.ReactNode }) {
  const [checkedItems, setCheckedItems] = useState<number[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [views, setViews] = useState<number | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const officialSources = getOfficialSourceUrls(article.source);
  const readingTime = estimateReadingTime(article);
  const recentlyUpdated = isRecentlyUpdated(article.lastUpdate);

  // Track article view + fetch count
  useEffect(() => {
    const key = `article_viewed_${slug}`;
    const lastViewed = localStorage.getItem(key);
    const now = Date.now();
    const shouldTrack = !lastViewed || (now - Number(lastViewed)) > 60 * 1000; // 60 sec cooldown

    fetch(`/api/articles/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId: slug, track: shouldTrack }),
    })
      .then(r => r.json())
      .then(d => { if (d.views != null) setViews(d.views); })
      .catch(() => { /* view tracking is non-critical — silent fail is intentional */ });

    if (shouldTrack) localStorage.setItem(key, String(now));
  }, [slug]);


  // 🛡️ فك تشفير المحتوى المحمي
  const safeDetails = useMemo(() => {
    const raw = isObfuscated(article.details) ? deobfuscate(article.details) : article.details;
    return DOMPurify.sanitize(raw);
  }, [article.details]);
  const safeIntro = useMemo(() => {
    const raw = isObfuscated(article.intro) ? deobfuscate(article.intro) : article.intro;
    return DOMPurify.sanitize(raw);
  }, [article.intro]);

  // All article images (hero + the ones embedded in the body), deduped, WITH
  // their captions (figcaption, falling back to alt) — review found the first
  // version dropped the admin-authored step captions entirely. When there are
  // 2+, the top shows a gallery instead of a single hero so readers see the
  // whole illustrated guide up front.
  const heroImages = useMemo(() => {
    const out: { src: string; caption: string }[] = [];
    const idx = new Map<string, number>();
    const push = (src?: string | null, caption = '') => {
      if (!src || !src.startsWith('http')) return;
      const at = idx.get(src);
      if (at != null) {
        // Same image seen again with a real caption — keep the caption.
        if (caption && !out[at].caption) out[at].caption = caption;
        return;
      }
      idx.set(src, out.length);
      out.push({ src, caption });
    };
    push(article.image);
    // Figures first: they carry the step captions.
    const figs = safeDetails.match(/<figure[\s\S]*?<\/figure>/gi) || [];
    for (const block of figs) {
      const src = block.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
      const cap =
        block.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ||
        block.match(/<img[^>]+alt=["']([^"']*)["']/i)?.[1] || '';
      if (src) push(src, cap);
    }
    // Then bare images outside figures (alt as caption).
    const noFigs = safeDetails.replace(/<figure[\s\S]*?<\/figure>/gi, '');
    const imgRe = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let m: RegExpExecArray | null;
    while ((m = imgRe.exec(noFigs))) {
      const alt = m[0].match(/alt=["']([^"']*)["']/i)?.[1] || '';
      push(m[1], alt);
    }
    return out;
  }, [article.image, safeDetails]);

  // When the top gallery shows all images, strip them out of the body so they
  // aren't duplicated (the editor wraps uploads in <figure>; also catch bare
  // <img>). Below the 2-image threshold the body is untouched.
  const bodyDetails = useMemo(() => {
    if (heroImages.length < 2) return safeDetails;
    let out = safeDetails
      // Drop only figures that wrap an uploaded (http) image — those moved to
      // the top gallery. A figure without an http image is left untouched.
      .replace(/<figure[\s\S]*?<\/figure>/gi, (m) => (/<img[^>]+src=["']https?:/i.test(m) ? '' : m))
      // Drop standalone http images too; any non-http image stays in the body
      // (it isn't in the gallery either, so it can never vanish).
      .replace(/<img[^>]+src=["']https?:[^>]*>/gi, '')
      // The in-body image carousels shipped with a "اسحب للتنقّل" hint line —
      // meaningless once the images moved to the top gallery.
      .replace(/<p[^>]*>[^<]*اسحب للتنقّل[^<]*<\/p>/gi, '');
    // Sweep the now-empty wrappers the stripping leaves behind (carousel divs,
    // emptied links/paragraphs). A few passes handle shallow nesting.
    for (let i = 0; i < 3; i++) {
      const next = out.replace(/<(div|p|a|span)\b[^>]*>\s*<\/\1>/gi, '');
      if (next === out) break;
      out = next;
    }
    return out;
  }, [safeDetails, heroImages.length]);
  const safeDocuments = useMemo(() => (article.documents || []).map((d: string) => isObfuscated(d) ? deobfuscate(d) : d), [article.documents]);
  // Steps come in two historical shapes:
  //   - legacy: plain strings (whole step in one line)
  //   - new:    objects { title, description } — title is the headline,
  //             description is a one-line elaboration shown underneath
  // We normalize both to { title, description? } here so the renderer
  // doesn't have to branch. Strings that look obfuscated still get decoded;
  // object fields are passed through (security.ts helpers assume strings,
  // so we only invoke them on strings).
  type StepObj = { title: string; description?: string };
  const safeSteps = useMemo<StepObj[]>(() => {
    return (article.steps || []).map((s: unknown): StepObj => {
      if (typeof s === 'string') {
        const decoded = isObfuscated(s) ? deobfuscate(s) : s;
        return { title: decoded };
      }
      if (s && typeof s === 'object') {
        const obj = s as { title?: unknown; description?: unknown };
        return {
          title: typeof obj.title === 'string' ? obj.title : '',
          description: typeof obj.description === 'string' ? obj.description : undefined,
        };
      }
      return { title: String(s ?? '') };
    });
  }, [article.steps]);
  const safeTips = useMemo(() => (article.tips || []).map((t: string) => isObfuscated(t) ? deobfuscate(t) : t), [article.tips]);
  const safeFees = useMemo(() => article.fees && isObfuscated(article.fees) ? deobfuscate(article.fees) : article.fees, [article.fees]);
  const safeWarning = useMemo(() => article.warning && isObfuscated(article.warning) ? deobfuscate(article.warning) : article.warning, [article.warning]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`progress-${slug}`);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setCheckedItems(parsed);
      }
    } catch {
      // ignore
    }
  }, [slug]);

  const toggleItem = (index: number) => {
    let newItems;
    if (checkedItems.includes(index)) {
      newItems = checkedItems.filter(i => i !== index);
    } else {
      newItems = [...checkedItems, index];
    }
    setCheckedItems(newItems);
    localStorage.setItem(`progress-${slug}`, JSON.stringify(newItems));
  };

  // دالة تبديل التفاصيل مع التمرير السلس
  const handleToggleDetails = () => {
    if (showDetails) {
      // عند الإخفاء: نخفي أولاً ثم نمرر للقسم
      setShowDetails(false);
      // انتظر حتى ينتهي الإخفاء ثم مرر للقسم
      setTimeout(() => {
        summaryRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    } else {
      setShowDetails(true);
    }
  };

  // Internal related articles logic removed in favor of external component


  const progress = (article.documents?.length || 0)
    ? Math.round((checkedItems.length / (article.documents?.length || 0)) * 100)
    : 0;

  return (
    <>
      {/* Pinned to the top of the viewport, tracks doc scroll progress. */}
      <ReadingProgressBar />
      <article
        className="w-full max-w-full lg:max-w-6xl mx-auto px-3 sm:px-4 py-8 overflow-hidden"
      >
        {/* Breadcrumbs محسّن */}
        <Breadcrumbs
          items={[
            { name: 'الدليل', href: '/directory' },
            ...(article.category ? (() => {
              const categorySlug = Object.entries(CATEGORY_SLUGS).find(([_, name]) => name === article.category)?.[0];
              return categorySlug
                ? [{ name: article.category, href: `/category/${categorySlug}` }]
                : [{ name: article.category, href: '/directory' }];
            })() : []),
            { name: article.title, href: '#', isActive: true },
          ]}
        />

        <div className="w-full max-w-4xl mx-auto space-y-8">
          <div className="w-full bg-white dark:bg-slate-900 rounded-2xl lg:rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden relative">

            {/* Header — premium editorial spread.
                Tri-stop gradient bg + diagonal newsroom stripes + two
                corner orbs in complementary hues give the article header
                a "magazine cover" feel instead of the flat dark slab. */}
            <div className="bg-gradient-to-br from-slate-950 via-primary-900 to-emerald-950 text-white p-4 sm:p-6 lg:p-12 relative overflow-hidden rounded-2xl lg:rounded-[2.5rem] w-full">
              {/* Top accent stripe — matches the site-wide UpdateCard
                  pattern so an article hero feels family-related to the
                  homepage cards. */}
              <div
                aria-hidden="true"
                className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-emerald-400 via-teal-400 to-cyan-400"
              />

              {/* Diagonal newsroom stripes — very faint, just enough to
                  signal "this is editorial content" without competing
                  with the headline */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, transparent 0 28px, rgba(255,255,255,0.6) 28px 29px)',
                }}
              />

              {/* Top sheen — subtle highlight bleeding from the top
                  edge so the dark gradient doesn't read as a flat slab */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none"
              />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4 lg:mb-6 flex-wrap">
                  <span className="bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide shadow-sm shadow-emerald-900/30">
                    {article.category}
                  </span>
                  {recentlyUpdated && (
                    <span className="bg-blue-500/25 text-blue-200 border border-blue-400/40 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-wide">
                      <RefreshCw size={11} /> محدّث
                    </span>
                  )}
                  {progress === 100 && (
                    <span className="bg-green-500 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 animate-in fade-in zoom-in uppercase tracking-wide shadow-md shadow-green-900/40">
                      <CheckCircle size={12} /> مكتمل
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black mb-4 lg:mb-6 leading-[1.5] drop-shadow-lg">{article.title}</h1>
                <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-slate-400 text-sm font-medium">
                  {/* Visible authorship + review byline — the on-page E-E-A-T
                      signal Google looks for on YMYL pages. Attributed honestly
                      to the editorial team (no fabricated personal authors), and
                      linked to the methodology page. */}
                  <Link href="/editorial-policy" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors border-b border-transparent hover:border-emerald-400 pb-0.5">
                    <ShieldCheck size={16} className="text-emerald-400" /> بإشراف هيئة تحرير دليل العرب
                  </Link>
                  <span className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-400" /> راجعته الهيئة · آخر تحديث: {article.lastUpdate}</span>
                  <span className="flex items-center gap-2"><Clock size={14} /> {readingTime} د قراءة</span>
                  {views != null && views > 0 && (
                    <span className="flex items-center gap-2"><Eye size={14} /> {formatViewCount(views)}</span>
                  )}
                  {officialSources.length > 0 && (
                    <a href={officialSources[0]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors border-b border-transparent hover:border-emerald-400 pb-0.5">
                      <ExternalLink size={14} /> المصدر الرسمي
                    </a>
                  )}

                  <div className="flex items-center gap-2 mr-auto sm:mr-0">
                    <div className="w-px h-4 bg-white/20 mx-2 hidden sm:block"></div>
                    <BookmarkButton
                      id={slug}
                      variant="glass"
                    />
                    <ShareMenu
                      title={article.title}
                      url={`${SITE_CONFIG.siteUrl}/article/${slug}`}
                      variant="glass"
                    />
                    <button
                      type="button"
                      onClick={() => { try { window.print(); } catch { } }}
                      className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-md border border-white/10"
                    >
                      <Printer size={14} /> <span className="hidden sm:inline">طباعة</span>
                    </button>
                  </div>
                </div>



              </div>
              {/* Primary orb — emerald glow bottom-left */}
              <div aria-hidden="true" className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
              {/* Secondary orb — cyan glow top-right, completes the
                  two-tone glow that gives the gradient depth */}
              <div aria-hidden="true" className="absolute -top-32 -right-32 w-80 h-80 bg-cyan-500 rounded-full blur-[110px] opacity-[0.12] pointer-events-none"></div>
            </div>

            {/* Tag chips — link to the matching /tag/[slug] hubs so the reader
                can pivot to related articles without going back to search.
                Also feeds internal-link equity into tag landing pages for SEO. */}
            {Array.isArray(article.tags) && article.tags.length > 0 && (
              <div className="px-4 sm:px-6 lg:px-12 pt-4 lg:pt-6">
                <div className="flex flex-wrap gap-2">
                  {article.tags.slice(0, 12).map((t: string) => {
                    const tag = (t || '').trim();
                    if (!tag) return null;
                    const label = (CATEGORY_SLUGS as Record<string, string>)[tag] || TAG_LABELS[tag] || tag;
                    return (
                      <Link
                        key={tag}
                        href={`/tag/${encodeURIComponent(tag)}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition"
                      >
                        # {label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8 break-words overflow-x-hidden w-full max-w-full">

              {/* Trust badge — real last-updated date + official source link on
                  the light content surface, where a scam-wary reader verifies
                  credibility by checking recency + source. Reuses the values
                  already computed for the dark hero (no new data/imports). */}
              {(article.lastUpdate || officialSources.length > 0) && (
                <div className="flex flex-wrap items-center gap-2 -mt-1">
                  {article.lastUpdate && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                      <Clock size={13} />
                      آخر تحديث: {article.lastUpdate}
                    </span>
                  )}
                  {officialSources.length > 0 && (
                    <a href={officialSources[0]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition">
                      <ExternalLink size={13} />
                      مصدر رسمي
                    </a>
                  )}
                </div>
              )}

              {/* Featured Image — natural aspect ratio + click-to-zoom
                  lightbox. Replaces the old 16:9 object-cover crop which
                  mangled tall portrait documents (official letters,
                  decree screenshots) by chopping off the top and bottom. */}
              {heroImages.length >= 2 ? (
                <ArticleHeroGallery images={heroImages} />
              ) : article.image && article.image.startsWith('http') ? (
                <ArticleHeroImage
                  src={article.image}
                  alt={article.title}
                  priority
                />
              ) : null}

              {/* ✅ ملخص الإجراء — accent stripe on right (RTL) + gradient surface */}
              <div
                ref={summaryRef}
                className="relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-800 dark:to-emerald-950/20 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm scroll-mt-20"
              >
                <span className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-emerald-500 to-teal-500 opacity-80" />
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-[11px] font-black tracking-wider uppercase mb-3">
                  <Sparkles size={12} />
                  نظرة سريعة
                </span>
                <h3 className="flex items-center text-lg lg:text-xl font-black text-gray-900 dark:text-white mb-4 gap-2">
                  <Info className="text-emerald-500 flex-shrink-0" size={22} /> ملخص الإجراء
                </h3>

                {/* 👇 الجزء الظاهر دائماً - العنوان/المقدمة */}
                <div
                  className="prose-content text-slate-700 dark:text-slate-100 font-medium"
                  dangerouslySetInnerHTML={{ __html: safeIntro }}
                />



                {/* 👇 التفاصيل الكاملة (بدون إخفاء) */}
                <div className="overflow-hidden">
                  { /* علامة مائية مخفية للمطاردة القانونية */}
                  <span className="opacity-0 pointer-events-none absolute text-[1px]">حقوق النشر محفوظة لـ {SITE_CONFIG.name}</span>

                  {/* Auto-generated table of contents — renders nothing for
                      short articles (<3 headings). Sticky sidebar on desktop,
                      collapsible card on mobile. */}
                  <ArticleTOC contentSelector="[data-article-body]" />

                  {/* التفاصيل */}
                  <div
                    data-article-body
                    className="prose-content text-slate-600 dark:text-slate-200 mb-6 text-[17px] sm:text-lg"
                    dangerouslySetInnerHTML={{ __html: bodyDetails }}
                  />


                  {/* أهم الأوراق + الخطة السريعة — accent stripes per type */}
                  <div className="grid grid-cols-1 gap-6">
                    <div className="group relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-800 dark:to-emerald-950/20 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl p-5 hover:shadow-md hover:shadow-emerald-500/10 transition-shadow">
                      <span className="absolute top-0 right-0 h-full w-1 bg-emerald-500 opacity-70" />
                      <div className="text-sm font-black text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:rotate-3 transition-transform">
                          <FileText size={16} />
                        </span>
                        أهم الأوراق
                      </div>
                      <ul className="space-y-2 text-sm text-gray-700 dark:text-slate-300">
                        {safeDocuments.slice(0, 5).map((doc, i) => (
                          <li key={i} className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                            <span className="leading-relaxed font-medium">{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="group relative overflow-hidden bg-gradient-to-br from-white to-blue-50/40 dark:from-slate-800 dark:to-blue-950/20 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl p-5 hover:shadow-md hover:shadow-blue-500/10 transition-shadow">
                      <span className="absolute top-0 right-0 h-full w-1 bg-blue-500 opacity-70" />
                      <div className="text-sm font-black text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:rotate-3 transition-transform">
                          <ListOrdered size={16} />
                        </span>
                        الخطة السريعة
                      </div>
                      <ol className="space-y-3 text-sm text-gray-700 dark:text-slate-300">
                        {safeSteps.slice(0, 5).map((step, i) => (
                          <li key={i} className="flex gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-black flex-shrink-0 mt-0.5 shadow-sm shadow-blue-500/30 tabular-nums" dir="ltr">{i + 1}</span>
                            <div className="leading-relaxed flex-1 min-w-0">
                              <div className="font-bold text-gray-900 dark:text-slate-100">{step.title}</div>
                              {step.description && (
                                <div className="mt-0.5 text-xs text-gray-600 dark:text-slate-400 leading-relaxed">{step.description}</div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  {/* التنبيه المهم — accent stripe + gradient */}
                  {article.warning && (
                    <div className="relative overflow-hidden mt-6 p-5 bg-gradient-to-br from-red-50 to-rose-50/50 dark:from-red-900/15 dark:to-rose-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl text-sm font-medium text-red-700 dark:text-red-300 flex gap-3 items-start">
                      <span className="absolute top-0 right-0 h-full w-1 bg-red-500 opacity-70" />
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 shrink-0">
                        <AlertTriangle size={18} />
                      </span>
                      <p className="leading-relaxed pt-1.5">{safeWarning}</p>
                    </div>
                  )}
                </div>
              </div>



              {/* قد يهمك أيضاً — Mid-article related articles */}
              <InlineRelatedArticles currentArticleId={slug} category={article.category} />

              {/* التكلفة — accent stripe + light orb */}
              {article.fees && (
                <div className="bg-gradient-to-br from-primary-800 via-primary-800 to-emerald-900 text-white p-5 lg:p-7 rounded-2xl shadow-xl shadow-primary-900/30 relative overflow-hidden">
                  <span className="absolute top-0 right-0 h-full w-1.5 bg-white/25" />
                  <span className="absolute -left-10 -top-10 w-40 h-40 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="p-3 bg-white/15 backdrop-blur-sm rounded-2xl flex-shrink-0">
                      <Coins size={28} className="text-yellow-400" />
                    </div>
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 backdrop-blur text-white/95 rounded-full text-[10px] font-black tracking-wider uppercase mb-1.5">
                        رسوم رسمية
                      </span>
                      <h3 className="text-primary-100/85 text-sm mb-1 font-bold">التكلفة التقديرية</h3>
                      <p className="text-xl lg:text-2xl font-black tracking-wide break-words">{safeFees}</p>
                    </div>
                  </div>
                  <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4 pointer-events-none">
                    <Coins size={120} />
                  </div>
                </div>
              )}

              {/* النصائح الذهبية — RTL right accent + gradient */}
              {safeTips.length > 0 && (
                <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100/40 dark:from-amber-900/15 dark:to-amber-900/5 border border-amber-200 dark:border-amber-900/30 p-6 rounded-2xl">
                  <span className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-amber-400 to-amber-500 opacity-80" />
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-200/60 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-[11px] font-black tracking-wider uppercase mb-3">
                    <Sparkles size={12} />
                    خبراتنا
                  </span>
                  <h3 className="font-black text-amber-900 dark:text-amber-100 text-base lg:text-lg mb-4 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-amber-200/70 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                      <Lightbulb className="fill-amber-400 text-amber-500 flex-shrink-0" size={20} />
                    </span>
                    نصائح ذهبية
                  </h3>
                  <ul className="space-y-3">
                    {safeTips.map((tip, i) => (
                      <li key={i} className="flex gap-3 text-amber-800 dark:text-amber-200 font-medium text-sm">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-200/70 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] font-black flex-shrink-0 mt-0.5 tabular-nums" dir="ltr">{i + 1}</span>
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* التحذير القانوني (Subtle Accordion Footer) */}
              <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800">
                <details className="group open:p-4 rounded-xl transition-all duration-300">
                  <summary className="flex items-center gap-2 font-medium text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer select-none list-none opacity-70 hover:opacity-100 transition-opacity">
                    <AlertTriangle size={14} />
                    <span>إخلاء مسؤولية قانوني وشروط الاستخدام</span>
                    <ChevronDown size={14} className="mr-auto transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl">
                    <p className="mb-2"><strong>تنبيه هام:</strong> {safeWarning || 'المعلومات الواردة في هذا الدليل هي لأغراض استرشادية فقط وقد تتغير القوانين في أي وقت.'}</p>
                    <p>نحن نبذل قصارى جهدنا لضمان دقة المعلومات، ولكننا لا نتحمل مسؤولية أي إجراءات يتم اتخاذها بناءً على هذا المحتوى دون استشارة قانونية مختصة. يرجى دائماً مراجعة المصادر الرسمية.</p>
                    <p className="mt-2 font-semibold text-slate-600 dark:text-slate-300">لسنا محامين ولا تابعين لأي جهة حكومية، ولا نطلب مالاً ولا نَعِد بنتيجة.</p>
                  </div>
                </details>
              </div>


              {/* Widgets (consultation CTA + comments) passed as children.
                  Sharing lives once at the top (hero ShareMenu) — the old
                  end-of-article share card + floating mobile share bar were
                  removed to keep the page short and non-pushy. */}
              <div className="mt-12 space-y-8">
                {children}
              </div>

            </div>

          </div>

        </div>
      </article>
    </>
  );
}
