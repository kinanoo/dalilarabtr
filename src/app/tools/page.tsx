/**
 * 🛠️ صفحة الأدوات — مركز الأدوات (Tools hub)
 * ==========================================
 * Server component: metadata + structured data. The interactive hub (search,
 * "الأكثر استخداماً", grouped sections) is the <ToolsExplorer/> client island,
 * which still SSRs every card + link so the full hub is crawlable.
 */

import { Metadata } from 'next';
import Link from 'next/link';

import PageHero from '@/components/PageHero';
import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG } from '@/lib/config';
import { ArrowLeft, CheckCircle, Wrench } from 'lucide-react';
import ToolsExplorer from '@/components/tools/ToolsExplorer';
import { TOOLS, featuredTools } from '@/lib/toolsRegistry';

export const metadata: Metadata = {
  title: 'أدوات مجانية للأجانب في تركيا — حاسبات وفاحصات رسمية',
  description:
    'مركز أدوات دليل العرب: دليل المواقف، فاحص الأكواد الأمنية، حاسبة الراتب الصافي، أسعار الصرف، فاحص الكملك، المناطق المحظورة، الصيدليات المناوبة والمزيد — مجانية وبأرقام رسمية 2026.',
  keywords:
    'أدوات تركيا, حاسبة الراتب تركيا, حاسبة الحظر, أكواد أمنية, مناطق محظورة, فحص الكملك, أسعار الصرف تركيا, الصيدليات المناوبة, إقامة تركيا',
  openGraph: {
    title: 'مركز الأدوات المجانية للأجانب في تركيا',
    description: 'حاسبات وفاحصات ذكية بأرقام رسمية 2026 — لكل ما تحتاجه في تركيا، مرتّبة حسب الأكثر استخداماً.',
    type: 'website',
    url: `${SITE_CONFIG.siteUrl}/tools`,
  },
  alternates: { canonical: '/tools' },
};

// Ranked ItemList — the "most used" ordering expressed as a machine-readable
// signal (position 1..N by popularity), plus a CollectionPage wrapper.
function ToolsSchema() {
  const ranked = [...TOOLS].sort((x, y) => y.popularity - x.popularity);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'مركز الأدوات المجانية للأجانب في تركيا',
    description: 'مجموعة أدوات مجانية لمساعدة الأجانب في تركيا، مرتّبة حسب الأكثر استخداماً.',
    url: `${SITE_CONFIG.siteUrl}/tools`,
    inLanguage: 'ar',
    isPartOf: { '@type': 'WebSite', name: SITE_CONFIG.name, url: SITE_CONFIG.siteUrl },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: ranked.length,
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      itemListElement: ranked.map((tool, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'WebApplication',
          name: tool.title,
          description: tool.short,
          url: `${SITE_CONFIG.siteUrl}${tool.href}`,
          applicationCategory: 'UtilitiesApplication',
          isAccessibleForFree: true,
        },
      })),
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export default function ToolsPage() {
  const topThree = featuredTools(3).map((t) => t.title).join('، ');

  return (
    <main className="flex flex-col min-h-screen font-cairo">
      <ToolsSchema />

      <PageHero
        title="مركز الأدوات المجانية"
        description="كل أداة تحتاجها في تركيا في مكان واحد — مرتّبة حسب الأكثر استخداماً، بأرقام رسمية ومجانية بالكامل."
        icon={<Wrench className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      />

      <div className="flex justify-center -mt-4 mb-4">
        <ShareMenu
          title="مركز الأدوات المجانية للأجانب في تركيا"
          text={`أدوات مجانية للأجانب في تركيا — أبرزها: ${topThree}. حاسبات وفاحصات بأرقام رسمية.`}
          url={`${SITE_CONFIG.siteUrl}/tools`}
          variant="subtle"
        />
      </div>

      <section className="px-4 py-8 flex-grow">
        <div className="max-w-6xl mx-auto">

          {/* Free banner */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 mb-8 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="text-emerald-600" size={24} />
            </div>
            <div>
              <h2 className="font-bold text-emerald-900 dark:text-emerald-100">جميع الأدوات مجانية</h2>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">استخدمها بدون تسجيل أو اشتراك — وكل أداة تدلّك على خطوتك التالية.</p>
            </div>
          </div>

          {/* The explorer: search + featured + grouped */}
          <ToolsExplorer />

          {/* Help CTA */}
          <div className="mt-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">لم تجد الأداة التي تحتاجها؟</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">أخبرنا بالأداة التي تريدها وسنعمل على إضافتها.</p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition"
            >
              اقترح أداة <ArrowLeft size={16} />
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}
