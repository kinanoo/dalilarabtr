import Link from 'next/link';
import type { Metadata } from 'next';
import { MapPin, Phone, Mail, ExternalLink, Info, CalendarCheck, ArrowLeft } from 'lucide-react';
import { SITE_CONFIG, getOgImage } from '@/lib/config';
import {
    SYRIAN_MISSIONS,
    NO_OTHER_MISSIONS,
    MISSIONS_SOURCE,
    MISSIONS_VERIFIED_ON,
    formatMissionPhone,
} from '@/lib/syrianMissions';

/**
 * /consulates — where the Syrian missions in Türkiye actually are.
 *
 * Built because "القنصلية السورية في غازي عنتاب" is the site's second and
 * fourth most-read article (1,509 and 651 reads), which says the demand is for
 * consulate information generally, not for that one city. The obvious next step
 * looked like a page per city — until the ministry's own directory turned out to
 * list only two missions in the whole country. So the page's real job is to
 * answer the question honestly for everyone else: there is no consulate in your
 * city, here are the two that exist, and here is how to book.
 *
 * Every address, phone and email comes from mofaex.gov.sy and the page says so
 * with the date it was checked. Nothing here is sourced from a directory site.
 */

export const revalidate = 86400;

const TITLE = 'القنصليات السورية في تركيا 2026: العناوين والتواصل وحجز الموعد';
const DESCRIPTION =
    'البعثات السورية في تركيا من المصدر الرسمي: قنصليتا إسطنبول وغازي عنتاب، عناوينهما وهواتفهما وبريدهما، وكيف تحجز موعداً — ولماذا لا توجد قنصلية في أنقرة أو إزمير.';

export async function generateMetadata(): Promise<Metadata> {
    const url = `${SITE_CONFIG.siteUrl}/consulates`;
    return {
        title: TITLE,
        description: DESCRIPTION,
        alternates: { canonical: url },
        openGraph: {
            title: TITLE,
            description: DESCRIPTION,
            url,
            type: 'website',
            images: [{ url: getOgImage(undefined, { title: 'القنصليات السورية في تركيا' }), width: 1200, height: 630, alt: TITLE }],
        },
    };
}

export default function ConsulatesPage() {
    // GovernmentOffice per mission, so a search for the consulate by name can
    // match the address we publish. postalAddress stays coarse — we hold the
    // street line the ministry publishes, not a verified structured address.
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: TITLE,
        description: DESCRIPTION,
        url: `${SITE_CONFIG.siteUrl}/consulates`,
        inLanguage: 'ar',
        mainEntity: SYRIAN_MISSIONS.map((m) => ({
            '@type': 'GovernmentOffice',
            name: m.name,
            address: { '@type': 'PostalAddress', streetAddress: m.address, addressCountry: 'TR', addressLocality: m.city },
            ...(m.phone ? { telephone: `+${m.phone}` } : {}),
            email: m.email,
        })),
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-950" dir="rtl">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
                <nav aria-label="مسار التنقل" className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-4">
                    <Link href="/" className="hover:text-emerald-600">الرئيسية</Link>
                    <span className="mx-1.5">/</span>
                    <span className="text-slate-700 dark:text-slate-200">القنصليات السورية</span>
                </nav>

                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 leading-tight tracking-tight">
                    القنصليات السورية{' '}
                    <span className="bg-gradient-to-l from-emerald-500 to-teal-500 bg-clip-text text-transparent">في تركيا</span>
                </h1>
                <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    العناوين وطرق التواصل كما تنشرها وزارة الخارجية والمغتربين السورية نفسها.
                </p>

                {/* The provenance line is part of the content, not a footnote:
                    it is the reason a reader should trust an address here over
                    one from a listings site. */}
                <p className="mt-3 inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                    <Info size={13} />
                    مأخوذة من دليل البعثات الرسمي، وتحقّقنا منها بتاريخ {MISSIONS_VERIFIED_ON}
                    <a href={MISSIONS_SOURCE} target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1 hover:text-emerald-600">
                        المصدر <ExternalLink size={11} />
                    </a>
                </p>

                <div className="mt-8 space-y-4">
                    {SYRIAN_MISSIONS.map((m) => (
                        <section key={m.slug} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                            <h2 className="text-lg font-black text-slate-900 dark:text-slate-50 leading-snug">{m.name}</h2>

                            <dl className="mt-4 space-y-3 text-sm">
                                <div className="flex gap-2.5">
                                    <dt className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5"><MapPin size={16} /><span className="sr-only">العنوان</span></dt>
                                    <dd className="text-slate-700 dark:text-slate-200 leading-relaxed" dir="auto">{m.address}</dd>
                                </div>

                                <div className="flex gap-2.5">
                                    <dt className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5"><Phone size={16} /><span className="sr-only">الهاتف</span></dt>
                                    <dd className="text-slate-700 dark:text-slate-200">
                                        {m.phone ? (
                                            <a href={`tel:+${m.phone}`} className="font-bold hover:text-emerald-600" dir="ltr">{formatMissionPhone(m.phone)}</a>
                                        ) : (
                                            // Saying so beats leaving a blank the reader reads as an oversight.
                                            <span className="text-slate-500 dark:text-slate-400">
                                                لا تنشر الوزارة رقم هاتف لهذه القنصلية — التواصل عبر البريد أو صفحاتها الرسمية.
                                            </span>
                                        )}
                                    </dd>
                                </div>

                                <div className="flex gap-2.5">
                                    <dt className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5"><Mail size={16} /><span className="sr-only">البريد</span></dt>
                                    <dd><a href={`mailto:${m.email}`} className="text-slate-700 dark:text-slate-200 font-bold hover:text-emerald-600 break-all" dir="ltr">{m.email}</a></dd>
                                </div>
                            </dl>

                            {m.note && (
                                <p className="mt-4 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                                    {m.note}
                                </p>
                            )}

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                {m.social.map((s) => (
                                    <a
                                        key={s.url}
                                        href={s.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-700"
                                    >
                                        {s.label} <ExternalLink size={11} />
                                    </a>
                                ))}
                                {m.guide && (
                                    <Link href={m.guide.href} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700">
                                        {m.guide.label}
                                        <ArrowLeft size={12} />
                                    </Link>
                                )}
                            </div>
                        </section>
                    ))}
                </div>

                {/* The answer for every city that is not one of the two. */}
                <section className="mt-8 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-900/10 p-5">
                    <h2 className="text-base font-black text-amber-900 dark:text-amber-200 flex items-center gap-2">
                        <Info size={17} />
                        {NO_OTHER_MISSIONS.headline}
                    </h2>
                    <p className="mt-2.5 text-sm leading-relaxed text-amber-900/90 dark:text-amber-100/85">
                        {NO_OTHER_MISSIONS.body}
                    </p>
                </section>

                <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                    <h2 className="text-base font-black text-slate-900 dark:text-slate-50 flex items-center gap-2">
                        <CalendarCheck size={17} className="text-emerald-600" />
                        حجز الموعد
                    </h2>
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        المواعيد في القنصليتين تُحجز عبر بوّابة الخدمات الإلكترونية وتطبيق وزارة الخارجية، لا بالحضور المباشر.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <a
                            href="https://mofaex.gov.sy/eservices-app"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                        >
                            بوّابة الحجز الرسمية <ExternalLink size={12} />
                        </a>
                        <Link href="/article/syrian-consulate-appointment" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-400">
                            شرح التطبيق خطوة بخطوة <ArrowLeft size={12} />
                        </Link>
                    </div>
                </section>

                <section className="mt-6">
                    <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-3">شروحات المعاملات القنصلية</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { href: '/article/syrian-consulate-services-turkey-2026', label: 'خدمات القنصلية السورية في تركيا' },
                            { href: '/article/document-attestation-turkey-to-syria-students-2026', label: 'تصديق الشهادات والأوراق من تركيا إلى سوريا' },
                            { href: '/article/lost-passport-turkey', label: 'فقدان جواز السفر في تركيا: المحضر والقنصلية' },
                            { href: '/article/syrian-passport-renewal', label: 'تجديد الجواز السوري: الأوراق والرسوم والخطوات' },
                        ].map((l) => (
                            <Link
                                key={l.href}
                                href={l.href}
                                className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 shadow-sm transition-all hover:-translate-y-[2px] hover:border-emerald-300"
                            >
                                <span className="leading-relaxed">{l.label}</span>
                                <ArrowLeft size={14} className="shrink-0 text-emerald-600 transition-transform group-hover:-translate-x-1" />
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
