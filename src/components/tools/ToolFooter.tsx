'use client';

// ============================================================================
// 🔻 ToolFooter — the shared "after you used the tool" experience
// ============================================================================
// One line at the bottom of every tool page: <ToolFooter toolId="pharmacy" />.
// It delivers three of the tools-system requirements at once:
//   • تتبّع الاستخدام — fires a `tool_use` signal (GA + our analytics_events).
//   • CTA بعد الأداة — a clear "next step" with primary/secondary actions.
//   • ربط بالمقالات والخدمات — real, verified related articles + services + sibling
//     tools, all as crawlable links (client component still SSRs its <a> tags).
// Everything is data-driven from src/lib/toolsRegistry.ts — no per-tool markup.
// ============================================================================

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Send, Wrench, ChevronLeft, Sparkles } from 'lucide-react';
import { getTool } from '@/lib/toolsRegistry';
import { trackToolUse } from '@/lib/analytics';

export default function ToolFooter({ toolId }: { toolId: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return; // one signal per mount
    fired.current = true;
    trackToolUse(toolId);
  }, [toolId]);

  const tool = getTool(toolId);
  if (!tool) return null;

  const relatedTools = tool.relatedTools.map(getTool).filter(Boolean);

  return (
    <section aria-label="الخطوة التالية وروابط ذات صلة" className="w-full max-w-4xl mx-auto px-4 pb-14 pt-2 space-y-6">
      {/* ── Next-step CTA ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-200/70 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 p-5 sm:p-6">
        <span className="absolute top-0 end-0 h-full w-1.5 bg-gradient-to-b from-emerald-500 to-teal-500" />
        <div className="flex items-start gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 shrink-0">
            <Sparkles size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-snug">
              {tool.cta.heading}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link
                href={tool.cta.primary.href}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black px-5 py-3 shadow-sm shadow-emerald-600/20 transition-colors"
              >
                {tool.cta.primary.label}
                <ArrowLeft size={16} />
              </Link>
              {tool.cta.secondary && (
                <Link
                  href={tool.cta.secondary.href}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 bg-white/70 dark:bg-slate-900/40 text-sm font-black px-5 py-3 hover:bg-white dark:hover:bg-slate-900 transition-colors"
                >
                  {tool.cta.secondary.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Related: articles · services · sibling tools ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Related articles */}
        {tool.relatedArticles.length > 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <h3 className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-100 mb-3">
              <FileText size={16} className="text-emerald-600" /> مقالات ذات صلة
            </h3>
            <ul className="space-y-1.5">
              {tool.relatedArticles.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                  >
                    <ChevronLeft size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 shrink-0" />
                    <span className="line-clamp-1">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Related services + sibling tools stacked in one column */}
        <div className="space-y-4">
          {tool.relatedServices.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <h3 className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-100 mb-3">
                <Send size={15} className="text-emerald-600" /> خدمات قد تحتاجها
              </h3>
              <ul className="space-y-1.5">
                {tool.relatedServices.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                    >
                      <ChevronLeft size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 shrink-0" />
                      <span className="line-clamp-1">{l.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {relatedTools.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <h3 className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-100 mb-3">
                <Wrench size={15} className="text-emerald-600" /> أدوات مكمّلة
              </h3>
              <div className="flex flex-wrap gap-2">
                {relatedTools.map((t) => {
                  const Icon = t!.icon;
                  return (
                    <Link
                      key={t!.id}
                      href={t!.href}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                    >
                      <Icon size={14} /> {t!.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Back to the full hub — keeps the tools a browsable system, not silos */}
      <div className="text-center">
        <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
          كل الأدوات <ArrowLeft size={15} />
        </Link>
      </div>
    </section>
  );
}
