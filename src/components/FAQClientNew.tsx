'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import Footer from './Footer';
import Accordion from '@/components/ui/Accordion';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { FAQCategory } from '@/lib/faq-types';

interface FAQClientProps {
  staticData: FAQCategory[];
  totalCount: number;
}

export default function FAQClientNew({ staticData, totalCount }: FAQClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number | null>(null);

  // البحث والفلترة
  const filteredData = useMemo(() => {
    let filtered = staticData;

    // Filter by category
    if (selectedCategoryIndex !== null) {
      filtered = [staticData[selectedCategoryIndex]];
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered
        .map((cat) => ({
          ...cat,
          questions: cat.questions.filter(
            (q) =>
              q.q.toLowerCase().includes(query) ||
              q.a.toLowerCase().includes(query)
          ),
        }))
        .filter((cat) => cat.questions.length > 0);
    }

    return filtered;
  }, [staticData, searchQuery, selectedCategoryIndex]);

  const totalFiltered = filteredData.reduce(
    (sum, cat) => sum + cat.questions.length,
    0
  );

  return (
    <>
      <PageHeader
        title="الأسئلة الشائعة"
        description={`أكثر من ${totalCount} سؤال وجواب عن الحياة في تركيا`}
        icon={<Search size={48} />}
        breadcrumbs={[
          { label: 'الأسئلة الشائعة', href: '/faq' },
        ]}
      />

      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن سؤال..."
                className="w-full pr-12 pl-4 py-4 text-lg border-2 border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Categories Filter */}
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategoryIndex(null)}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${selectedCategoryIndex === null
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-emerald-500'
                }`}
            >
              الكل ({totalCount})
            </button>
            {staticData.map((cat, index) => (
              <button
                key={index}
                onClick={() => setSelectedCategoryIndex(index)}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${selectedCategoryIndex === index
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-emerald-500'
                  }`}
              >
                {cat.category} ({cat.questions.length})
              </button>
            ))}
          </div>

          {/* Results Count */}
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            عرض {totalFiltered} من {totalCount} سؤال
          </p>

          {/* FAQ Categories with Accordion */}
          {totalFiltered === 0 ? (
            <EmptyState
              type="search"
              message={`لم نعثر على أسئلة تطابق "${searchQuery}"`}
            />
          ) : (
            <div className="space-y-6">
              {filteredData.map((category, catIndex) => (
                <div key={catIndex}>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                    {category.category}
                  </h2>

                  <Accordion
                    items={category.questions.map((q) => ({
                      title: q.q,
                      content: (
                        <div
                          className="prose dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: q.a }}
                        />
                      ),
                    }))}
                    allowMultiple={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
