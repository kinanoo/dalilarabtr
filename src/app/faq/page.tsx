import FAQClientNew from '@/components/FAQClientNew';
import { getFAQData } from '@/lib/faq';
import { createClient } from '@supabase/supabase-js';
import { FAQCategory, FAQQuestion } from '@/lib/faq-types';
import { Suspense } from 'react';

export const revalidate = 60; // Revalidate every minute

export default async function FAQPage() {
  // 1. Static Data (600+ questions)
  const staticData = getFAQData();

  // 2. Dynamic Data from Supabase
  let dynamicFaqs: any[] = [];
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('active', true);

      if (!error && data) {
        dynamicFaqs = data;
      }
    }
  } catch (err) {
    console.error('Failed to fetch dynamic FAQs:', err);
  }

  // 3. Transform Dynamic Data to Categories
  const dynamicCategories: Record<string, FAQQuestion[]> = {};

  dynamicFaqs.forEach((item) => {
    // Default to 'general' if no category
    const cat = item.category || 'general';
    // Normalized category name (simple mapping logic if needed, or just use raw)
    // Here we use the raw category from DB.

    if (!dynamicCategories[cat]) {
      dynamicCategories[cat] = [];
    }

    dynamicCategories[cat].push({
      id: item.id,
      q: item.question,
      a: item.answer || 'لا توجد إجابة متاحة.' // Fallback
    });
  });

  // 4. Merge & Deduplicate
  // We start with static categories
  const mergedData: FAQCategory[] = [...staticData];

  // Helper to find or create category
  const getCategory = (name: string) => {
    let cat = mergedData.find(c => c.category.toLowerCase() === name.toLowerCase());
    if (!cat) {
      // Try to map English keys to Arabic labels if needed, or just create new
      // For now, if admin uses 'general', we might want to map it to 'أسئلة عامة' if existing.
      // But let's append new categories if they don't match.
      cat = { category: name, questions: [] };
      mergedData.push(cat);
    }
    return cat;
  };

  // Map common admin values to static Arabic names if possible
  const categoryMapping: Record<string, string> = {
    'general': 'أسئلة عامة',
    'legal': 'الشؤون القانونية',
    'residency': 'الإقامة في تركيا',
    'work': 'إذن العمل',
    'health': 'الصحة والتأمين',
    // Add more if known from getFAQData
  };

  Object.entries(dynamicCategories).forEach(([catKey, questions]) => {
    const displayCat = categoryMapping[catKey.toLowerCase()] || catKey;
    const targetCat = getCategory(displayCat);

    questions.forEach(q => {
      // Check for duplicates in this category
      const exists = targetCat.questions.some(
        existing => existing.q.trim() === q.q.trim()
      );

      if (!exists) {
        // Prepend new questions to appear first
        targetCat.questions.unshift(q);
      }
    });
  });

  // Recalculate total
  const totalCount = mergedData.reduce((sum, cat) => sum + cat.questions.length, 0);

  // Schema.org
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: mergedData
      .flatMap(cat => cat.questions)
      .slice(0, 200) // First 200 for SEO
      .map(q => ({
        '@type': 'Question',
        name: q.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: q.a
        }
      }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div>جاري تحميل الأسئلة...</div>}>
        <FAQClientNew staticData={mergedData} totalCount={totalCount} />
      </Suspense>
    </>
  );
}
