'use client';

// ============================================================================
// 🧭 ToolsExplorer — the tools hub as a daily launcher, not a flat list
// ============================================================================
// • Search box → find any tool in one keystroke (filters title/desc/when-to-use).
// • "الأكثر استخداماً" strip → the most-used tools first (registry popularity).
// • Grouped sections → tools organised by life situation, each with a one-line
//   "متى تستخدمها" so a visitor knows instantly whether it's for them.
// A client component so search is instant, but it still SSRs every card + link,
// so Google crawls the full hub in the first HTML response.
// ============================================================================

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, Sparkles, X } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { TOOLS, TOOL_GROUPS, featuredTools, toolsInGroup, type Tool } from '@/lib/toolsRegistry';

function badgeTone(badge: string) {
  if (badge === 'الأكثر استخداماً') return 'brand' as const;
  if (badge === 'قريباً') return 'neutral' as const;
  return 'updated' as const;
}

function ToolCard({ tool, featured = false }: { tool: Tool; featured?: boolean }) {
  const Icon = tool.icon;
  return (
    <Link
      href={tool.href}
      className="group relative h-full flex items-start gap-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-0.5 transition-all"
    >
      {tool.badge && (
        <Badge tone={badgeTone(tool.badge)} className="absolute -top-3 end-4 z-10 shadow-sm">
          {tool.badge}
        </Badge>
      )}
      <span className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shrink-0`}>
        <Icon size={22} className="text-white" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-black text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
          {tool.title}
        </span>
        <span className="block text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
          {tool.short}
        </span>
        {!featured && (
          <span className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-emerald-700/90 dark:text-emerald-400/90">
            <Sparkles size={12} className="mt-0.5 shrink-0" />
            <span className="line-clamp-2"><span className="font-bold">متى تستخدمها:</span> {tool.whenToUse}</span>
          </span>
        )}
      </span>
      <ChevronLeft size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 shrink-0 transition-colors mt-1" />
    </Link>
  );
}

export default function ToolsExplorer() {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();

  const results = useMemo(() => {
    if (!query) return null;
    return TOOLS.filter((t) =>
      `${t.title} ${t.short} ${t.whenToUse}`.toLowerCase().includes(query)
    ).sort((x, y) => y.popularity - x.popularity);
  }, [query]);

  const featured = featuredTools(5);

  return (
    <div className="space-y-10">
      {/* Search */}
      <div className="relative max-w-xl mx-auto">
        <Search size={18} className="absolute top-1/2 -translate-y-1/2 start-4 text-slate-400 pointer-events-none" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن أداة… (راتب، إقامة، صيدلية، كود)"
          aria-label="ابحث عن أداة"
          className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ps-11 pe-11 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ('')}
            aria-label="مسح البحث"
            className="absolute top-1/2 -translate-y-1/2 end-3 grid place-items-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Search results */}
      {results !== null ? (
        <section>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4">
            {results.length > 0 ? `${results.length} أداة مطابقة` : 'لا توجد أداة مطابقة — جرّب كلمة أخرى'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((t) => <ToolCard key={t.id} tool={t} />)}
          </div>
        </section>
      ) : (
        <>
          {/* الأكثر استخداماً */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-emerald-600" />
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">الأكثر استخداماً</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((t) => <ToolCard key={t.id} tool={t} featured />)}
            </div>
          </section>

          {/* Grouped by life situation */}
          {TOOL_GROUPS.map((group) => (
            <section key={group.id}>
              <div className="mb-4">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">{group.title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{group.subtitle}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {toolsInGroup(group.id).map((t) => <ToolCard key={t.id} tool={t} />)}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
