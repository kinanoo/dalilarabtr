'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ARTICLES } from '@/lib/articles';
import type { ArticleData } from '@/lib/articles';
import { CATEGORY_SLUGS } from '@/lib/data';
import Link from 'next/link';
import { FileText, FolderOpen, ArrowLeft } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { minTokenMatches, normalizeArabic, tokenizeArabicQuery } from '@/lib/arabicSearch';
import { fetchRemoteArticles } from '@/lib/remoteData';
import PageHero from '@/components/PageHero';
import HeroSearchInput from '@/components/HeroSearchInput';

type DirectoryArticle = { slug: string } & ArticleData;

const PRIMARY_SECTIONS: Array<{ key: string; title: string; categoryName?: string }> = [
  { key: 'kimlik', title: 'الكملك', categoryName: CATEGORY_SLUGS.kimlik },
  { key: 'residence', title: 'الإقامة', categoryName: CATEGORY_SLUGS.residence },
  { key: 'visa', title: 'الفيزا', categoryName: CATEGORY_SLUGS.visa },
  { key: 'work', title: 'العمل', categoryName: CATEGORY_SLUGS.work },
  { key: 'health', title: 'الصحة', categoryName: CATEGORY_SLUGS.health },
  { key: 'education', title: 'الدراسة', categoryName: CATEGORY_SLUGS.education },
];

function categoryToPrimaryKey(categoryName: string): (typeof PRIMARY_SECTIONS)[number]['key'] {
  // Keep this mapping conservative and predictable.
  // Any category not explicitly mapped goes to "الإقامة" as the broadest umbrella.
  switch (categoryName) {
    case 'الكملك والحماية المؤقتة':
    case 'خدمات السوريين':
      return 'kimlik';

    case 'أنواع الإقامات':
    case 'الإقامة والأوراق':
    case 'السكن والحياة':
    case 'الحياة اليومية':
    case 'معاملات رسمية':
      return 'residence';

    case 'الفيزا والتأشيرات':
      return 'visa';

    case 'العمل والاستثمار':
    case 'العمل والدخل':
      return 'work';

    case 'الصحة والتأمين':
      return 'health';

    case 'الدراسة والتعليم':
      return 'education';

    default:
      return 'residence';
  }
}

export default function DirectoryPage() {
  const [filter, setFilter] = useState('');
  const [remoteArticles, setRemoteArticles] = useState<Array<{ id: string; article: ArticleData }> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const q = new URLSearchParams(window.location.search).get('q');
      if (q) setFilter(q);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchRemoteArticles()
      .then((r) => {
        if (!mounted) return;
        setRemoteArticles(r);
      })
      .catch(() => {
        if (!mounted) return;
        setRemoteArticles(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const isStaticId = useMemo(() => {
    const staticIds = new Set(Object.keys(ARTICLES));
    return (id: string) => staticIds.has(id);
  }, []);

  const sections = useMemo(() => {
    const normalizedFilter = normalizeArabic(filter);
    const tokens = tokenizeArabicQuery(filter);
    const minMatched = minTokenMatches(tokens);

    const merged: DirectoryArticle[] = [];
    for (const [slug, data] of Object.entries(ARTICLES)) merged.push({ slug, ...data });
    if (remoteArticles?.length) {
      const seen = new Set(merged.map((a) => a.slug));
      for (const item of remoteArticles) {
        if (seen.has(item.id)) continue;
        merged.push({ slug: item.id, ...item.article });
      }
    }

    const bucketed = new Map<
      string,
      {
        key: string;
        title: string;
        groups: Record<string, DirectoryArticle[]>;
      }
    >();

    for (const s of PRIMARY_SECTIONS) {
      bucketed.set(s.key, { key: s.key, title: s.title, groups: {} });
    }

    for (const data of merged) {
      const categoryName = data.category || 'غير مصنف';

      if (normalizedFilter) {
        const haystack = normalizeArabic(`${data.title} ${categoryName} ${data.intro ?? ''}`);
        const matches =
          tokens.length === 0
            ? haystack.includes(normalizedFilter)
            : (() => {
                let matched = 0;
                for (const token of tokens) {
                  if (haystack.includes(token)) matched += 1;
                }
                return matched >= minMatched;
              })();
        if (!matches) continue;
      }

      const primaryKey = categoryToPrimaryKey(categoryName);
      const bucket = bucketed.get(primaryKey);
      if (!bucket) continue;
      if (!bucket.groups[categoryName]) bucket.groups[categoryName] = [];
      bucket.groups[categoryName].push(data);
    }

    // Keep fixed primary order, and sort subgroup titles for scanability.
    const ordered = PRIMARY_SECTIONS.map((s) => {
      const bucket = bucketed.get(s.key);
      if (!bucket) return { key: s.key, title: s.title, groups: {} as Record<string, DirectoryArticle[]> };

      const sortedGroups: Record<string, DirectoryArticle[]> = {};
      const keys = Object.keys(bucket.groups).sort((a, b) => a.localeCompare(b, 'ar'));
      for (const k of keys) sortedGroups[k] = bucket.groups[k];
      return { ...bucket, groups: sortedGroups };
    });

    return ordered;
  }, [filter, remoteArticles]);

  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />
      <PageHero
        title="الدليل الشامل"
        description="فهرس كامل لكل مقالات وأدلة الموقع."
        icon={<FolderOpen className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      >
        <HeroSearchInput value={filter} onChange={setFilter} placeholder="ابحث داخل الدليل..." />
      </PageHero>
      <div className="max-w-screen-2xl mx-auto px-4 py-16">
        {sections.some((s) => Object.keys(s.groups).length > 0) ? (
          <div className="space-y-16">
            {sections.map((section) => (
              Object.keys(section.groups).length > 0 && (
                <div key={section.key} className="relative">
                  <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{section.title}</h2>
                    <div className="flex-grow h-px bg-slate-200 dark:bg-slate-700"></div>
                  </div>

                  <div className="space-y-10">
                    {Object.entries(section.groups).map(([categoryName, articles]) => (
                      <div key={`${section.key}:${categoryName}`} className="space-y-5">
                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">{categoryName}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {articles.map((article) => (
                            <Link
                              key={article.slug}
                              href={isStaticId(article.slug) ? `/article/${article.slug}` : `/read?id=${encodeURIComponent(article.slug)}`}
                              className="group bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-accent-500 hover:shadow-xl transition-all duration-300 flex flex-col"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600 transition-colors"><FileText size={24} /></div>
                              </div>
                              <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-primary-700 transition-colors">{article.title}</h4>
                              <div className="flex items-center text-accent-600 font-bold text-sm mt-auto group-hover:gap-2 transition-all">عرض التفاصيل <ArrowLeft size={16} className="mr-1" /></div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        ) : (
          <div className="text-center py-20"><p className="text-xl text-slate-500 dark:text-slate-300">لا توجد مقالات.</p></div>
        )}
      </div>
      <Footer />
    </main>
  );
}