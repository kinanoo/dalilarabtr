'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, ArrowLeft, Search, FileText, Briefcase, Bell, BookOpen, BrainCircuit, Send, MessageCircle, Clock } from 'lucide-react';
import QuickReplyButtons from './QuickReplyButtons';
import { trackWhatsAppClick, trackWhatsAppMessageSent, trackSearch } from '@/lib/analytics';
import type { LucideIcon } from 'lucide-react';
import { SERVICES_LIST, FORMS, LATEST_UPDATES } from '@/lib/data';
import { ARTICLES } from '@/lib/articles';
import { CONSULTANT_SCENARIOS } from '@/lib/consultant-data';
import { DICTIONARY } from '@/lib/dictionary';
import { minTokenMatches, normalizeArabic, scoreMatch, tokenizeArabicQuery } from '@/lib/arabicSearch';

// =====================================================
// ⚙️ رقم الواتساب - غيّره لرقمك
// =====================================================
const WHATSAPP_NUMBER = '966580757487';

type AssistantResult = {
  id: string;
  title: string;
  type: string;
  url: string;
  icon: LucideIcon;
};

type AssistantIndexItem = {
  id: string;
  title: string;
  type: string;
  url: string;
  icon: LucideIcon;
  haystack: string;
};

function extractArticleIdFromLink(link?: string): string {
  const raw = (link || '').trim();
  if (!raw.startsWith('/article/')) return '';
  const after = raw.slice('/article/'.length);
  const clean = after.split(/[?#]/)[0] || '';
  try {
    return decodeURIComponent(clean).trim();
  } catch {
    return clean.trim();
  }
}

const CONSULTANT_INDEX: AssistantIndexItem[] = Object.entries(CONSULTANT_SCENARIOS).map(([key, value]) => {
  const articleId = (value.articleId || '').trim() || extractArticleIdFromLink(value.link);
  const article = articleId ? ARTICLES[articleId] : undefined;

  const articleText = article
    ? [
      article.title,
      article.intro,
      article.details,
      ...(article.documents || []),
      ...(article.steps || []),
      ...(article.tips || []),
      article.fees || '',
      article.warning || '',
    ]
      .filter(Boolean)
      .join(' ')
    : '';

  const desc = article?.intro?.trim() ? article.intro : value.desc;
  return {
    id: `consult-${key}`,
    title: value.title,
    type: 'استشارة ذكية',
    url: `/consultant?scenario=${encodeURIComponent(key)}`,
    icon: BrainCircuit,
    haystack: normalizeArabic(`${value.title} ${desc || ''} ${value.legal || ''} ${articleText}`),
  };
});

const ARTICLE_INDEX: AssistantIndexItem[] = Object.entries(ARTICLES).map(([slug, data]) => {
  const raw = [
    data.title,
    data.intro,
    data.details,
    ...(data.documents || []),
    ...(data.steps || []),
    ...(data.tips || []),
    data.fees || '',
    data.warning || '',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    id: `art-${slug}`,
    title: data.title,
    type: 'مقال',
    url: `/article/${slug}`,
    icon: FileText,
    haystack: normalizeArabic(raw),
  };
});

const SERVICE_INDEX: AssistantIndexItem[] = SERVICES_LIST.map((service) => ({
  id: `srv-${service.id}`,
  title: service.title,
  type: 'خدمة',
  url: `/request?service=${service.id}`,
  icon: Briefcase,
  haystack: normalizeArabic(`${service.title} ${service.desc}`),
}));

const DICTIONARY_INDEX: AssistantIndexItem[] = DICTIONARY.map((term, idx) => ({
  id: `dict-${idx}`,
  title: `${term.term} — ${term.trans}`,
  type: 'قاموس',
  url: '/dictionary',
  icon: BookOpen,
  haystack: normalizeArabic(`${term.term} ${term.trans} ${term.pron}`),
}));

const FORMS_INDEX: AssistantIndexItem[] = FORMS.map((form, idx) => ({
  id: `form-${idx}`,
  title: form.name,
  type: 'نموذج',
  url: '/forms',
  icon: FileText,
  haystack: normalizeArabic(form.name),
}));

const UPDATES_INDEX: AssistantIndexItem[] = LATEST_UPDATES.map((update) => ({
  id: `upd-${update.id}`,
  title: update.title,
  type: 'خبر',
  url: `/updates#upd-${update.id}`,
  icon: Bell,
  haystack: normalizeArabic(update.title),
}));

function buildResults(query: string): AssistantResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const tokens = tokenizeArabicQuery(trimmed);
  const needle = normalizeArabic(trimmed);
  const minMatched = minTokenMatches(tokens);

  const scored: Array<AssistantResult & { _score: number }> = [];

  const maybeAdd = (item: AssistantIndexItem) => {
    if (tokens.length === 0) {
      if (!needle || needle.length < 2) return;
      if (!item.haystack.includes(needle)) return;
      scored.push({ id: item.id, title: item.title, type: item.type, url: item.url, icon: item.icon, _score: 10 });
      return;
    }

    const { score, matched } = scoreMatch(item.haystack, item.title, tokens);
    if (matched < minMatched) return;
    scored.push({ id: item.id, title: item.title, type: item.type, url: item.url, icon: item.icon, _score: score });
  };

  for (const item of CONSULTANT_INDEX) maybeAdd(item);
  for (const item of ARTICLE_INDEX) maybeAdd(item);
  for (const item of SERVICE_INDEX) maybeAdd(item);
  for (const item of DICTIONARY_INDEX) maybeAdd(item);
  for (const item of FORMS_INDEX) maybeAdd(item);
  for (const item of UPDATES_INDEX) maybeAdd(item);

  return scored
    .sort((a, b) => b._score - a._score)
    .slice(0, 6)
    .map(({ _score, ...rest }) => rest);
}

// Helper: Check if support is online (9 AM - 6 PM Turkey time)
function isOnlineNow(): boolean {
  const now = new Date();
  const turkeyTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
  const hour = turkeyTime.getHours();
  return hour >= 9 && hour < 18;
}

export default function WhatsAppAssistant() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [request, setRequest] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const pathname = usePathname();
  const isOnline = isOnlineNow();

  const results = useMemo(() => {
    const trimmed = request.trim();
    if (trimmed.length === 0) return [];
    return buildResults(trimmed);
  }, [request]);

  const reset = () => {
    setOpen(false);
    setRequest('');
  };

  const canSuggest = request.trim().length > 0;

  // =====================================================
  // 📱 إرسال للواتساب
  // =====================================================
  const handleSendWhatsApp = () => {
    if (!request.trim()) return;

    const whatsappMessage = encodeURIComponent(
      `${request}\n\n---\n📱 مرسل من: دليل العرب في تركيا`
    );
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

    // Track WhatsApp click
    trackWhatsAppClick('assistant');
    trackWhatsAppMessageSent(request || 'direct_message');

    window.open(whatsappUrl, '_blank');
    reset();
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        reset();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="fixed bottom-16 lg:bottom-4 end-4 z-[90]">
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="relative flex items-center bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-2 rounded-full shadow-xl shadow-green-600/20 transition"
          aria-label="اسأل خبير"
          title="اسأل خبير"
        >
          <span
            className="absolute -inset-2 rounded-full bg-green-400/25 blur-lg animate-ping [animation-duration:2.8s] pointer-events-none"
            aria-hidden="true"
          />
          <span className="relative z-10 text-sm flex items-center gap-1.5">
            <MessageCircle size={14} />
            اسأل خبير
          </span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="w-[92vw] max-w-sm rounded-3xl overflow-hidden border-2 border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/95 dark:bg-slate-950 shadow-2xl shadow-emerald-600/10 flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-l from-emerald-700 to-teal-700 text-white border-b border-white/10">
            <div className="flex-1">
              <div className="flex items-center gap-2 font-bold">
                <Search size={18} className="text-white/90" />
                اسأل خبير
              </div>
              {isOnline && (
                <div className="flex items-center gap-1 text-xs text-emerald-200 mt-1">
                  <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></span>
                  الدعم متصل الآن
                </div>
              )}
              {!isOnline && (
                <div className="flex items-center gap-1 text-xs text-amber-200 mt-1">
                  <Clock size={12} />
                  نرد خلال ساعة (9ص - 6م)
                </div>
              )}
            </div>
            <button
              onClick={reset}
              className="p-2 rounded-full hover:bg-white/10 text-white/90"
              aria-label="إغلاق"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 flex-1 overflow-y-auto">
            <div className="text-[11px] text-emerald-900/80 dark:text-slate-300 mb-2">
              اكتب طلبك وسأقترح روابط من الموقع
            </div>

            <div className="space-y-2">
              <div className="font-bold text-sm text-slate-800 dark:text-slate-100">ما طلبك؟</div>
              <textarea
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                className="w-full min-h-[64px] rounded-xl px-3 py-2 text-sm bg-white/90 dark:bg-slate-900 border border-emerald-200/80 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                placeholder="اكتب طلبك باختصار..."
              />

              {canSuggest && (
                <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-white/80 dark:bg-slate-950/60 overflow-hidden">
                  <div className="px-3 py-2 bg-emerald-100/80 dark:bg-emerald-950/30 text-[11px] font-bold text-emerald-900 dark:text-emerald-100">
                    نتائج من الموقع (اضغط للانتقال)
                  </div>
                  {results.length ? (
                    <div className="divide-y divide-emerald-200/60 dark:divide-slate-800">
                      {results.map((r) => (
                        <Link
                          key={r.id}
                          href={r.url}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-emerald-50/60 dark:hover:bg-slate-900 transition"
                        >
                          <div className="p-2 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200">
                            <r.icon size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{r.title}</div>
                            <div className="text-[11px] text-emerald-900/70 dark:text-slate-300">{r.type}</div>
                          </div>
                          <ArrowLeft size={14} className="text-emerald-800/40 dark:text-slate-500" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-3 text-sm bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-b-xl">
                      ⚠️ لا يوجد شيء مطابق. جرّب كلمات أدق أو أرسل رسالة واتس.
                    </div>
                  )}
                </div>
              )}

              {/* Quick Replies */}
              {!canSuggest && showQuickReplies && (
                <QuickReplyButtons
                  onSelect={(message) => {
                    setRequest(message);
                    setShowQuickReplies(false);
                  }}
                  currentPage={pathname}
                />
              )}

              {/* =====================================================
                  📱 زر الواتساب - يظهر دائماً عند الكتابة
                  ===================================================== */}
              {canSuggest && (
                <div className="pt-2 border-t border-emerald-200/60 dark:border-slate-800 mt-3">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 text-center">
                    لم تجد ما تبحث عنه؟ تواصل معنا مباشرة
                  </div>
                  <button
                    onClick={handleSendWhatsApp}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-green-500/20 transition-all"
                  >
                    <Send size={16} />
                    <span>إرسال عبر واتساب</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 bg-white/85 dark:bg-slate-950/80 border-t border-emerald-200/70 dark:border-slate-800 shrink-0">
            <button
              onClick={reset}
              className="w-full rounded-xl py-2.5 text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
