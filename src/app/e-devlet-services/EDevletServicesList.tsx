'use client';

import Link from 'next/link';
import { ExternalLink, FileText, Search } from 'lucide-react';
import { minTokenMatches, normalizeArabic, tokenizeArabicQuery } from '@/lib/arabicSearch';
import { useMemo, useState } from 'react';

type EDevletService = {
  id: string;
  title: string;
  intro: string;
  lastUpdate: string;
  source?: string;
  slug?: string;
};

export default function EDevletServicesList({
  services,
}: {
  services: EDevletService[];
}) {
  const [filter, setFilter] = useState('');

  const filteredServices = useMemo(() => {
    const tokens = tokenizeArabicQuery(filter);
    if (!tokens.length) return services;

    const minMatched = minTokenMatches(tokens);

    return services.filter((s) => {
      const haystack = normalizeArabic(`${s.title} ${s.intro}`);
      let matched = 0;
      for (const token of tokens) {
        if (haystack.includes(token)) matched += 1;
      }
      return matched >= minMatched;
    });
  }, [filter, services]);

  return (
    <div>
      <div className="relative max-w-xl mx-auto mb-8">
        <input
          type="text"
          placeholder="ابحث في خدمات e-Devlet..."
          value={filter}
          className="w-full p-4 pr-12 rounded-xl text-slate-800 dark:text-slate-100 shadow-lg outline-none bg-white dark:bg-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-400 border border-slate-200 dark:border-slate-800"
          onChange={(e) => setFilter(e.target.value)}
        />
        <Search className="absolute right-4 top-4 text-slate-400" />
      </div>

      {filteredServices.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <FileText size={22} />
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded whitespace-nowrap">
                  {service.lastUpdate}
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 leading-snug">
                {service.title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-6 flex-grow">
                {service.intro}
              </p>

              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/article/${service.slug || service.id}`}
                  className="text-primary-700 dark:text-primary-300 font-bold text-sm hover:underline"
                >
                  اقرأ الشرح
                </Link>

                {service.source ? (
                  <a
                    href={service.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 flex items-center gap-2 text-sm"
                  >
                    زيارة الموقع <ExternalLink size={16} />
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-lg text-slate-500 dark:text-slate-300">لا توجد نتائج مطابقة.</p>
        </div>
      )}
    </div>
  );
}
