import { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, ArrowLeft } from 'lucide-react';
import PageHero from '@/components/PageHero';
import { SITE_CONFIG } from '@/lib/config';
import { TR_CITIES } from '@/lib/turkishCities';

export const metadata: Metadata = {
    title: { absolute: 'دليل العرب والسوريين حسب المدن في تركيا | دليل العرب في تركيا' },
    description: 'اختر مدينتك في تركيا لتصل مباشرة إلى الخدمات العربية، حالة الأحياء المغلقة، وأدلّة الإقامة والعمل: إسطنبول، غازي عنتاب، أنقرة، بورصة، مرسين وكل المدن.',
    alternates: { canonical: '/city' },
    openGraph: {
        title: 'دليل العرب حسب المدن في تركيا',
        description: 'الخدمات، الأحياء المغلقة، وأدلّة الإجراءات لكل مدينة تركية.',
        url: `${SITE_CONFIG.siteUrl}/city`,
        images: ['/og-banner.jpg'],
    },
};

export default function CityIndexPage() {
    const base = SITE_CONFIG.siteUrl;
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'دليل العرب والسوريين حسب المدن في تركيا',
        url: `${base}/city`,
        inLanguage: 'ar',
        hasPart: TR_CITIES.map((c) => ({ '@type': 'WebPage', name: `دليل العرب في ${c.ar}`, url: `${base}/city/${c.slug}` })),
    };

    return (
        <main className="flex flex-col min-h-screen font-cairo bg-slate-50 dark:bg-slate-950" dir="rtl">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <PageHero
                title="دليل العرب حسب المدن"
                description="اختر مدينتك للوصول المباشر إلى الخدمات العربية، الأحياء المغلقة، وأدلّة الإقامة والعمل فيها."
                icon={<MapPin className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
                titleClassName="md:text-4xl"
            />
            <div className="max-w-5xl mx-auto w-full px-4 py-10">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {TR_CITIES.map((c) => (
                        <Link key={c.slug} href={`/city/${c.slug}`}
                            className="group flex items-center justify-between gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all">
                            <span className="flex items-center gap-2 font-black text-slate-900 dark:text-slate-100">
                                <MapPin size={16} className="text-emerald-600" /> {c.ar}
                            </span>
                            <ArrowLeft size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 group-hover:-translate-x-1 transition-all" />
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}
