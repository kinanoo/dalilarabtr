'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import type { Article } from '@/lib/types'; // Only Type
import { getOfficialSourceUrls } from '@/lib/externalLinks';
import { FileText, CheckCircle, AlertTriangle, ListOrdered, Printer, Sparkles, Lightbulb, Coins, Info, ExternalLink, BrainCircuit, ChevronDown, Clock, Eye, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ShareMenu from './ShareMenu';
import BookmarkButton from './BookmarkButton';
import { Mail } from 'lucide-react';
import { SITE_CONFIG, CATEGORY_SLUGS, TAG_LABELS } from '@/lib/config';
import Breadcrumbs from './Breadcrumbs';
import InlineRelatedArticles from './InlineRelatedArticles';

import { deobfuscate, isObfuscated } from '@/lib/security';
import DOMPurify from 'isomorphic-dompurify';
import { estimateReadingTime, isRecentlyUpdated, formatViewCount } from '@/lib/useAdminData';
import ArticleTOC from './article/ArticleTOC';
import ReadingProgressBar from './article/ReadingProgressBar';
import EndOfArticleShare from './article/EndOfArticleShare';
import StickyMobileShareBar from './article/StickyMobileShareBar';
import NewsletterCard from './NewsletterCard';

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

  const emailHref = useMemo(() => {
    const subject = encodeURIComponent(`استفسار: ${article.title}`);
    const body = encodeURIComponent(`السلام عليكم،\n\nأحتاج مساعدة بخصوص: ${article.title}\n${SITE_CONFIG.siteUrl}/article/${slug}\n\n`);
    return `mailto:${SITE_CONFIG.email}?subject=${subject}&body=${body}`;
  }, [article.title, slug]);

  // 🛡️ فك تشفير المحتوى المحمي
  const safeDetails = useMemo(() => {
    const raw = isObfuscated(article.details) ? deobfuscate(article.details) : article.details;
    return DOMPurify.sanitize(raw);
  }, [article.details]);
  const safeIntro = useMemo(() => {
    const raw = isObfuscated(article.intro) ? deobfuscate(article.intro) : article.intro;
    return DOMPurify.sanitize(raw);
  }, [article.intro]);
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
      {/* Floating mobile-only WhatsApp share — appears after the reader
          scrolls past the hero. Desktop already has the hero ShareMenu so we
          hide it there to avoid visual noise. */}
      <StickyMobileShareBar
          title={article.title}
          url={`${SITE_CONFIG.siteUrl}/article/${slug}`}
          excerpt={article.intro || undefined}
      />
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

            {/* Header */}
            <div className="bg-primary-900 text-white p-4 sm:p-6 lg:p-12 relative overflow-hidden rounded-2xl lg:rounded-[2.5rem] w-full">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4 lg:mb-6 flex-wrap">
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full">
                    {article.category}
                  </span>
                  {recentlyUpdated && (
                    <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <RefreshCw size={11} /> محدّث
                    </span>
                  )}
                  {progress === 100 && (
                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 animate-in fade-in zoom-in">
                      <CheckCircle size={12} /> مكتمل
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-4 lg:mb-6 leading-[1.5]">{article.title}</h1>
                <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-slate-400 text-sm font-medium">
                  <span className="flex items-center gap-2"><Sparkles size={16} className="text-emerald-400" /> آخر تحديث: {article.lastUpdate}</span>
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
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-20"></div>
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

              {/* Featured Image */}
              {article.image && article.image.startsWith('http') && (
                <div data-image-wrapper className="relative w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-800">
                  <div className="relative w-full aspect-video">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
                      priority
                      onError={(e) => {
                        const wrapper = e.currentTarget.closest('[data-image-wrapper]') as HTMLElement;
                        if (wrapper) wrapper.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* ✅ ملخص الإجراء - Notion Style Callout (High Contrast) */}
              <div
                ref={summaryRef}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 border-l-4 border-l-emerald-500 shadow-sm scroll-mt-20"
              >
                <h3 className="flex items-center text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-4 gap-2">
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
                    className="prose-content text-slate-600 dark:text-slate-200 mb-6 text-base sm:text-lg"
                    dangerouslySetInnerHTML={{ __html: safeDetails }}
                  />

                  {/* أهم الأوراق + الخطة السريعة (High Contrast UI) */}
                  <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white border border-gray-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-xl p-5">
                      <div className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <FileText size={16} className="text-slate-500 dark:text-slate-400" /> أهم الأوراق
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

                    <div className="bg-white border border-gray-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-xl p-5">
                      <div className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <ListOrdered size={16} className="text-slate-500 dark:text-slate-400" /> الخطة السريعة
                      </div>
                      <ol className="space-y-3 text-sm text-gray-700 dark:text-slate-300">
                        {safeSteps.slice(0, 5).map((step, i) => (
                          <li key={i} className="flex gap-3">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                            <div className="leading-relaxed flex-1 min-w-0">
                              <div className="font-medium text-gray-900 dark:text-slate-100">{step.title}</div>
                              {step.description && (
                                <div className="mt-0.5 text-xs text-gray-600 dark:text-slate-400 leading-relaxed">{step.description}</div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  {/* التنبيه المهم */}
                  {article.warning && (
                    <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl text-sm font-medium text-red-700 dark:text-red-300 flex gap-2">
                      <AlertTriangle size={18} className="shrink-0" />
                      <p>{safeWarning}</p>
                    </div>
                  )}
                </div>
              </div>



              {/* بطاقة المساعدة المباشرة - NativeConsultCard (Clean) - Keeping original placement as well or removing if duplicate? 
                   User said "Move Consultation Widget -> To After Summary". I added the 'Contextual Help Widget' above.
                   NativeConsultCard was the green one? Wait. 
                   The previous code had `NativeConsultCard` at line 253.
                   I'll remove the one at line 253 to avoid duplication, or keep it as the 'Contextual' one I just added.
                   I will assume the 'Contextual Help Widget' code above replaces line 253.
                   Wait, `NativeConsultCard` is a component. I should use that component if possible, but the user gave specific styling: "wide, inline card... bg-blue-50/50".
                   I'll rely on the manual code I wrote above for the specific style requested.
                */}

              {/* قد يهمك أيضاً — Mid-article related articles */}
              <InlineRelatedArticles currentArticleId={slug} category={article.category} />

              {/* التكلفة */}
              {article.fees && (
                <div className="bg-gradient-to-br from-primary-800 to-primary-900 text-white p-4 lg:p-6 rounded-2xl shadow-lg relative overflow-hidden">
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm flex-shrink-0">
                      <Coins size={28} className="text-yellow-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-primary-100/80 text-sm mb-1 font-bold">التكلفة التقديرية</h3>
                      <p className="text-xl lg:text-2xl font-bold tracking-wide break-words">{safeFees}</p>
                    </div>
                  </div>
                  <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                    <Coins size={120} />
                  </div>
                </div>
              )}

              {/* النصائح الذهبية */}
              {safeTips.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-400 p-6 rounded-r-xl">
                  <h3 className="font-bold text-amber-900 dark:text-amber-100 text-base lg:text-lg mb-4 flex items-center gap-2">
                    <Lightbulb className="fill-amber-400 text-amber-500 flex-shrink-0" size={24} /> نصائح ذهبية
                  </h3>
                  <ul className="space-y-3">
                    {safeTips.map((tip, i) => (
                      <li key={i} className="flex gap-3 text-amber-800 dark:text-amber-200 font-medium text-sm">
                        <span className="text-amber-500 mt-1.5 flex-shrink-0">•</span>
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 🧠 Contextual Help Widget (Relocated Here) */}
              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <BrainCircuit size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">هل الإجراء يبدو معقداً؟</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">تحدث مع مستشار مختص لإنهاء معاملتك قانونياً.</p>
                  </div>
                </div>
                <a href={emailHref} className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 whitespace-nowrap text-center inline-flex items-center justify-center gap-2">
                  <Mail size={16} />
                  تواصل عبر البريد
                </a>
              </div>

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
                  </div>
                </details>
              </div>


              {/* Widgets (Comments/Helpful) passed as children */}
              <div className="mt-12 space-y-8">
                {children}
                {/* End-of-article share CTA — peak emotional moment for
                    sharing. WhatsApp-first, pre-filled message with title +
                    intro excerpt so the receiver sees context not a bare URL. */}
                <EndOfArticleShare
                    title={article.title}
                    url={`${SITE_CONFIG.siteUrl}/article/${slug}`}
                    excerpt={article.intro || undefined}
                />
                {/* Newsletter card at the end of the article — readers who
                    finished a long legal/procedural piece are the warmest
                    candidates for the signup. The source string tells the
                    admin where this email came from. */}
                <NewsletterCard tone="compact" source="article-footer" />
              </div>

            </div>

          </div>

        </div>
      </article>
    </>
  );
}
