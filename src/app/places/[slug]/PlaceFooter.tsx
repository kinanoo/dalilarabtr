'use client';

// ============================================================================
// 🔻 PlaceFooter — measurement + the correction channel
// ============================================================================
// Two jobs, both of which the directory needs to stay honest over time:
//
//   1. MEASUREMENT. Fires 'place_view' on mount and 'place_map_open' when the
//      visitor taps through to Maps. The second one is the signal that matters:
//      a view without a map tap means the page did not answer the question. With
//      ~690 places we cannot guess which ones matter — this tells us.
//
//   2. CORRECTION. A stored address decays silently: nobody notices a consulate
//      moved until someone drives there. The people who DO notice are the ones
//      standing in front of the building. This hands them a one-tap way to say
//      so, with the place already identified so the report is actionable.
// ============================================================================

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { AlertCircle, MapPin } from 'lucide-react';
import { trackPlaceView, trackPlaceMapOpen } from '@/lib/analytics';

export default function PlaceFooter({
    slug,
    placeAr,
    citySlug,
    districtSlug,
    officeKindId,
    mapUrl,
    hasAddress,
}: {
    slug: string;
    placeAr: string;
    citySlug: string;
    districtSlug?: string;
    officeKindId?: string;
    mapUrl: string;
    hasAddress: boolean;
}) {
    const fired = useRef(false);
    const meta = { place: slug, city: citySlug, district: districtSlug, kind: officeKindId };

    useEffect(() => {
        if (fired.current) return; // one view signal per mount
        fired.current = true;
        trackPlaceView(meta);
        // meta is derived from props that don't change for a given page.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    // Prefilled so the report arrives already saying which place and what kind
    // of problem — a bare "something is wrong" mail is not actionable.
    const reportHref = `/contact?subject=${encodeURIComponent(
        `تصحيح بيانات مقر: ${placeAr}`
    )}&ref=${encodeURIComponent(`/places/${slug}`)}`;

    return (
        <section aria-label="ساعدنا نحدّث البيانات" className="w-full max-w-2xl mx-auto px-4 pb-12 pt-2">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-5">
                <div className="flex items-start gap-3">
                    <span className="grid place-items-center w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 shrink-0">
                        <AlertCircle size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">
                            {hasAddress ? 'العنوان غلط أو المقر انتقل؟' : 'تعرف عنوان هذا المقر؟'}
                        </h2>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {hasAddress
                                ? 'أنت الآن أمام المكان، ونحن لا. إن كان العنوان أو الهاتف أو ساعات العمل غير صحيحة، بلّغنا ونصحّحها للجميع.'
                                : 'لا نملك عنواناً محقَّقاً لهذا المقر بعد. إن كنت تعرفه، أرسله لنا ونضيفه بعد التحقق.'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2.5">
                            <Link
                                href={reportHref}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-black px-4 py-2.5 transition-colors"
                            >
                                <AlertCircle size={14} />
                                {hasAddress ? 'بلّغنا عن خطأ' : 'أرسل لنا العنوان'}
                            </Link>
                            <a
                                href={mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackPlaceMapOpen(meta)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black px-4 py-2.5 hover:border-emerald-300 transition-colors"
                            >
                                <MapPin size={14} />
                                تحقّق على الخريطة
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
