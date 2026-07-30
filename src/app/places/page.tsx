import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, ShieldCheck, Navigation, Info, ChevronDown, HelpCircle } from 'lucide-react';
import PageHero from '@/components/PageHero';
import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG } from '@/lib/config';
import {
    OFFICIAL_PLACES, MISSION_PLACES, OFFICE_KINDS, PLACE_CITIES,
    districtsOfCity, officeKindById,
} from '@/lib/officialPlaces';

import PlacesClient from './PlacesClient';

/** The office kinds that have per-district pages (see OfficeKind.perDistrict). */
const DISTRICT_KIND_IDS = OFFICE_KINDS.filter((k) => k.perDistrict).map((k) => k.id);

// Everything on this hub is a compile-time constant plus outbound Maps links,
// so it can be cached hard. Matches the /tools/pharmacy hub.
export const revalidate = 86400;

const pageUrl = `${SITE_CONFIG.siteUrl}/places`;

export const metadata: Metadata = {
    title: 'أين يقع؟ — مواقع القنصليات والسفارات والدوائر الرسمية في تركيا على الخريطة',
    description:
        'دليل عناوين ومواقع القنصليات والسفارات العربية والأجنبية وإدارات الهجرة ودوائر النفوس والضرائب والطابو والمحاكم في تركيا — العنوان ورقم الهاتف مكتوبان، وضغطة واحدة تفتح الموقع على خرائط جوجل.',
    keywords:
        'موقع القنصلية السورية في اسطنبول, القنصلية السورية في غازي عنتاب, القنصلية المصرية في اسطنبول, القنصلية السعودية في اسطنبول, عنوان ادارة الهجرة, دائرة النفوس, خرائط جوجل, سفارات وقنصليات تركيا, اين تقع القنصلية',
    alternates: { canonical: '/places' },
    openGraph: {
        title: 'أين يقع؟ — مواقع القنصليات والدوائر الرسمية في تركيا',
        description: 'اكتب اسم القنصلية أو الدائرة، واذهب إليها مباشرة على خرائط جوجل.',
        url: pageUrl,
        type: 'website',
        images: ['/og-banner.jpg'],
    },
};

const FAQS = [
    {
        q: 'كيف أجد موقع القنصلية السورية في إسطنبول على الخريطة؟',
        a: 'اكتب «القنصلية السورية في إسطنبول» في مربع البحث أعلى الصفحة (أو في بحث الصفحة الرئيسية) — يظهر لك العنوان في النتيجة نفسها، وزر «خرائط» بجانبها يفتح الموقع مباشرة على خرائط جوجل مع الاتجاهات. ونفس الطريقة تعمل لقنصلية غازي عنتاب والقنصليات المصرية والسعودية وبقية المقرات.',
    },
    {
        q: 'هل العناوين المسجّلة عندكم محدّثة؟',
        a: 'العناوين المعروضة محقَّقة من أدلة القنصليات ومن مواقع البعثات نفسها، وكل عنوان مكتوب تحته تاريخ آخر تحقّق — لتحكم بنفسك على حداثته. والعناوين الرسمية بطبيعتها مستقرّة، كثير منها ثابت سنوات. ومع ذلك لم نعتمد عليها وحدها: كل صفحة فيها أيضاً زر «الموقع تغيّر؟ ابحث بالاسم الآن في جوجل» يشغّل بحثاً حياً بالاسم الرسمي، فيعرض الموقع الحالي حتى لو انتقل المقر قبل أن نحدّث بياناتنا. الخيارَان موجودان دائماً.',
    },
    {
        q: 'لماذا بعض المقرات بدون عنوان مكتوب؟',
        a: 'لأننا لا نكتب عنواناً لم نتحقق منه — العنوان الخاطئ أسوأ من لا عنوان، فهو يرسلك إلى مبنى غير صحيح. المقرات التي لم نتحقق من عنوانها بعد (أو التي تتناقض المصادر بشأنها) تعرض زر البحث الحيّ في خرائط جوجل فقط، وهو يوصلك للموقع الصحيح. ونضيف العناوين تدريجياً بعد التحقق.',
    },
    {
        q: 'ما الفرق بين مقر محدّد و«الأقرب إليك»؟',
        a: 'السفارات والقنصليات مقرّات محدّدة، فالرابط يفتح ذلك المبنى بالتحديد — على العنوان المسجّل إن كان لدينا. أما الدوائر الحكومية (النفوس، الضرائب، الطابو، النوتر، البريد...) فلها فروع كثيرة في كل ولاية، لذلك يفتح الرابط الفروع القريبة من موقعك الحالي — وهو ما تحتاجه فعلاً: الأقرب، لا فرعاً بعيداً. ولهذا لا نسجّل عنواناً واحداً لهذه الدوائر.',
    },
    {
        q: 'ما معنى «قنصلية فخرية»؟ وهل أنجز فيها معاملاتي؟',
        a: 'القنصلية الفخرية (Fahri Konsolosluk) يرأسها قنصل فخري وليست بعثة دبلوماسية كاملة: لا تُصدر جوازات ولا وثائق ولا تصدّق أوراقاً ولا تمنح تأشيرات، ومهمتها معلومات ومساعدة محدودة وتمثيل تجاري. نضع عليها تنبيهاً واضحاً في الدليل لأن كثيرين ذهبوا إليها لاستخراج جواز وعادوا خائبين — للمعاملات الرسمية راجع السفارة في أنقرة.',
    },
    {
        q: 'هل أحتاج حساباً أو تسجيلاً؟',
        a: 'لا. كل الروابط مجانية ومفتوحة وتعمل من الهاتف مباشرة. اسمح لخرائط جوجل بالوصول إلى موقعك لتحصل على أدق ترتيب للأقرب إليك.',
    },
    {
        q: 'هل يمكنني حجز موعد من هنا؟',
        a: 'صفحة كل دائرة تضع رابط الحجز الرسمي إن وُجد (e-İkamet لإدارة الهجرة، randevu.nvi.gov.tr للنفوس، MHRS للمواعيد الطبية، randevu.tkgm.gov.tr للطابو). الحجز يتم على الموقع الحكومي نفسه — نحن نوصلك إليه فقط.',
    },
];

export default function PlacesHubPage() {
    const missionCount = MISSION_PLACES.length;
    const totalCount = OFFICIAL_PLACES.length;
    const addressCount = OFFICIAL_PLACES.filter((p) => p.contact).length;

    const jsonLd = [
        {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'أين يقع؟ — مواقع القنصليات والدوائر الرسمية في تركيا',
            description:
                'دليل مواقع السفارات والقنصليات والدوائر الحكومية في تركيا، كل مقر مع رابط مباشر إلى موقعه على خرائط جوجل.',
            url: pageUrl,
            inLanguage: 'ar',
            isPartOf: { '@type': 'WebSite', name: 'دليل العرب في تركيا', url: SITE_CONFIG.siteUrl },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_CONFIG.siteUrl },
                { '@type': 'ListItem', position: 2, name: 'أين يقع؟ — المقرات الرسمية', item: pageUrl },
            ],
        },
    ];

    return (
        <main className="flex flex-col min-h-screen">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <PageHero
                title="أين يقع؟"
                description="مواقع القنصليات والسفارات والدوائر الرسمية في تركيا — اكتب ما تبحث عنه واذهب إليه مباشرة على خرائط جوجل."
                icon={<MapPin className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
            />

            {/* The search box + the interactive lists are one client island: they
                share the query, so they cannot be split across the hero boundary.
                It renders its own search field directly under the hero. */}
            <PlacesClient />

            <div className="flex justify-center mb-2">
                <ShareMenu
                    title="أين يقع؟ — مواقع القنصليات والدوائر الرسمية في تركيا"
                    text="دليل مواقع السفارات والقنصليات والدوائر الحكومية في تركيا على خرائط جوجل."
                    url={pageUrl}
                    variant="subtle"
                />
            </div>

            <div className="max-w-6xl mx-auto px-4 pb-14 w-full space-y-6">

                {/* How it works — the honesty promise, stated plainly */}
                <section className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 bg-emerald-500" />
                    <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            <Info size={16} />
                        </span>
                        كيف يعمل الدليل؟
                    </h2>
                    <ol className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300 list-decimal list-inside leading-relaxed">
                        <li>اكتب ما تبحث عنه بلغتك العادية: «القنصلية السورية في إسطنبول»، «إدارة الهجرة عنتاب»، «نفوس بورصة».</li>
                        <li>يظهر <strong>العنوان</strong> في النتيجة نفسها — انسخه أو أرسله لسائق التاكسي.</li>
                        <li>اضغط زر <strong>«خرائط»</strong> ليفتح الموقع فوراً على خرائط جوجل مع الاتجاهات.</li>
                        <li>وإن كان المقر قد انتقل، زر <strong>«الموقع تغيّر؟ ابحث بالاسم في جوجل»</strong> يعرض لك موقعه الحالي.</li>
                    </ol>
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {addressCount} عنوان محقَّق بتاريخه — والبحث الحيّ في جوجل متاح دائماً كخيار ثانٍ</span>
                        <span className="flex items-center gap-1"><Navigation className="w-3.5 h-3.5 text-emerald-600" /> {totalCount} مقر ودائرة</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-600" /> {missionCount} سفارة وقنصلية</span>
                    </div>
                </section>

                {/* FAQ — visible + schema above */}
                <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            <HelpCircle size={16} />
                        </span>
                        أسئلة شائعة
                    </h2>
                    <div className="space-y-3">
                        {FAQS.map((f) => (
                            <details key={f.q} className="group border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors list-none [&::-webkit-details-marker]:hidden">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 text-start">{f.q}</h3>
                                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 group-open:rotate-180" />
                                </summary>
                                <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                                    {f.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </section>

                {/* Crawlable index — the interactive lists above are behind a
                    city switcher / tabs, so this block makes every single place
                    page reachable by a crawler (and by anyone who just wants
                    the full list) without JavaScript. */}
                <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-4">
                        فهرس كامل — كل المقرات والدوائر
                    </h2>

                    <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 mb-2">السفارات والقنصليات</h3>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {MISSION_PLACES.map((p) => (
                            <Link
                                key={p.slug}
                                href={`/places/${p.slug}`}
                                className="text-[11px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 hover:border-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                            >
                                {p.flag} {p.ar}
                            </Link>
                        ))}
                    </div>

                    <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 mb-2">الدوائر الرسمية حسب الولاية</h3>
                    <div className="space-y-3">
                        {OFFICE_KINDS.map((kind) => {
                            const cities = kind.cities
                                ? PLACE_CITIES.filter((c) => kind.cities!.includes(c.slug))
                                : PLACE_CITIES;
                            return (
                                <div key={kind.id}>
                                    <p className="text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5">{kind.ar}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {cities.map((c) => (
                                            <Link
                                                key={`${kind.id}-${c.slug}`}
                                                href={`/places/${kind.id}-${c.slug}`}
                                                className="text-[11px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full px-2.5 py-1 hover:border-blue-300 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                                            >
                                                {c.ar}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* District-level pages need their own crawlable links: they
                        are the answer for «إدارة الهجرة في اسنيورت» and there are
                        hundreds of them, all otherwise reachable only from inside
                        their province page. */}
                    <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 mt-6 mb-2">
                        حسب المنطقة — الهجرة والنفوس والمستشفيات
                    </h3>
                    <div className="space-y-3">
                        {PLACE_CITIES.filter((c) => districtsOfCity(c.slug).length > 0).map((c) => (
                            <div key={`d-${c.slug}`}>
                                <p className="text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5">{c.ar}</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {DISTRICT_KIND_IDS.flatMap((kindId) =>
                                        districtsOfCity(c.slug).map((d) => (
                                            <Link
                                                key={`${kindId}-${c.slug}-${d.slug}`}
                                                href={`/places/${kindId}-${c.slug}-${d.slug}`}
                                                className="text-[11px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full px-2.5 py-1 hover:border-blue-300 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                                            >
                                                {officeKindById(kindId)?.ar.split(' ')[0]} {d.ar}
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Cross-links into the rest of the site */}
                <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-3">قد تحتاج أيضاً</h2>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { href: '/important-links', label: 'الروابط الحكومية الرسمية' },
                            { href: '/e-devlet-services', label: 'خدمات e-Devlet' },
                            { href: '/residence', label: 'دليل الإقامات' },
                            { href: '/tools/pharmacy', label: 'الصيدليات المناوبة' },
                            { href: '/zones', label: 'المناطق المحظورة' },
                            { href: '/city', label: 'دليل المدن' },
                            { href: '/consultant', label: 'دليل المواقف' },
                        ].map((l) => (
                            <Link
                                key={l.href}
                                href={l.href}
                                className="text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 hover:border-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                            >
                                {l.label}
                            </Link>
                        ))}
                    </div>
                </section>

            </div>
        </main>
    );
}
