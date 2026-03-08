import { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import PageHero from '@/components/PageHero';
import { MapPin, ArrowRight, AlertTriangle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG } from '@/lib/config';

export const revalidate = 3600;

type Props = {
    params: Promise<{ slug: string }>;
};

// 1. Metadata Generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);

    if (!supabase) return { title: `منطقة ${decodedSlug}` };

    // Try finding by neighborhood
    const { data: exactZone } = await supabase
        .from('zones')
        .select('neighborhood, city, district')
        .ilike('neighborhood', decodedSlug)
        .limit(1)
        .single();

    if (exactZone) {
        const zoneTitle = `هل حي ${exactZone.neighborhood} محظور؟`;
        return {
            title: `${zoneTitle} - دليل المناطق`,
            description: `تحقق من حالة حي ${exactZone.neighborhood} في ${exactZone.district}/${exactZone.city} وهل هو محظور لتثبيت النفوس.`,
            alternates: { canonical: `/zones/${decodedSlug}` },
            openGraph: {
                title: zoneTitle,
                images: [{
                    url: `${SITE_CONFIG.siteUrl}/api/og?${new URLSearchParams({ title: zoneTitle, category: 'المناطق المحظورة' })}`,
                    width: 1200, height: 630, alt: zoneTitle,
                }],
            },
        };
    }

    // Try finding by district
    const { data: districtZones } = await supabase
        .from('zones')
        .select('id')
        .ilike('district', decodedSlug)
        .limit(1);

    if (districtZones && districtZones.length > 0) {
        const districtTitle = `الأحياء المحظورة في ${decodedSlug}`;
        return {
            title: `${districtTitle} - دليل المناطق`,
            description: `قائمة بجميع الأحياء المغلقة أمام الأجانب في منطقة ${decodedSlug}، تركيا.`,
            alternates: { canonical: `/zones/${decodedSlug}` },
            openGraph: {
                title: districtTitle,
                images: [{
                    url: `${SITE_CONFIG.siteUrl}/api/og?${new URLSearchParams({ title: districtTitle, category: 'المناطق المحظورة' })}`,
                    width: 1200, height: 630, alt: districtTitle,
                }],
            },
        };
    }

    // Try finding by city
    const { data: cityZones } = await supabase
        .from('zones')
        .select('id')
        .ilike('city', decodedSlug)
        .limit(1);

    if (cityZones && cityZones.length > 0) {
        const cityTitle = `الأحياء المحظورة في ${decodedSlug}`;
        return {
            title: `${cityTitle} - دليل المناطق`,
            description: `قائمة بجميع الأحياء المغلقة أمام الأجانب في مدينة ${decodedSlug}، تركيا.`,
            alternates: { canonical: `/zones/${decodedSlug}` },
            openGraph: {
                title: cityTitle,
                images: [{
                    url: `${SITE_CONFIG.siteUrl}/api/og?${new URLSearchParams({ title: cityTitle, category: 'المناطق المحظورة' })}`,
                    width: 1200, height: 630, alt: cityTitle,
                }],
            },
        };
    }

    return { title: 'المنطقة غير موجودة' };
}

// 2. Page Component
export default async function ZoneDetailPage({ params }: Props) {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);

    if (!supabase) return notFound();

    let viewType: 'single' | 'district' | 'city' = 'single';
    let singleItem: any = null;
    let groupItems: any[] = [];
    let title = '';

    const ZONE_COLS = 'id, neighborhood, city, district, status, is_banned';

    // 1. Try NEIGHBORHOOD (e.g. "MOLLA GÜRANİ MAHALLESİ")
    {
        const { data } = await supabase
            .from('zones')
            .select(ZONE_COLS)
            .ilike('neighborhood', decodedSlug)
            .limit(1)
            .single();
        if (data) { singleItem = data; viewType = 'single'; }
    }

    // 2. Try DISTRICT (e.g., "Fatih")
    if (!singleItem) {
        const { data } = await supabase
            .from('zones')
            .select(ZONE_COLS)
            .ilike('district', decodedSlug);
        if (data && data.length > 0) {
            viewType = 'district';
            groupItems = data;
            title = data[0].district;
        }
    }

    // 3. Try CITY (e.g., "Istanbul", "Gaziantep")
    if (!singleItem && groupItems.length === 0) {
        const { data } = await supabase
            .from('zones')
            .select(ZONE_COLS)
            .ilike('city', decodedSlug);
        if (data && data.length > 0) {
            viewType = 'city';
            groupItems = data;
            title = data[0].city;
        }
    }

    // 4. Fallback: ID check
    if (!singleItem && groupItems.length === 0) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedSlug);
        if (isUUID) {
            const { data } = await supabase.from('zones').select(ZONE_COLS).eq('id', decodedSlug).single();
            if (data) { singleItem = data; viewType = 'single'; }
        }
    }

    // --- RENDER LOGIC ---

    // A. Single Zone View
    if (viewType === 'single' && singleItem) {
        const item = singleItem;
        const locked = item.status === 'closed' || item.is_banned === true;

        return (
            <main className="min-h-screen bg-white dark:bg-slate-950 font-cairo">
                <PageHero
                    title={item.neighborhood}
                    description={`${item.city} - ${item.district}`}
                    icon={<MapPin className="w-10 h-10 md:w-12 md:h-12 text-pink-500" />}
                />
                <div className="max-w-3xl mx-auto px-4 py-12">
                    <Link href="/zones" className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 mb-8 font-bold w-fit transition">
                        <ArrowRight size={20} />
                        عودة للخريطة
                    </Link>

                    <div className={`rounded-3xl border-2 p-8 sm:p-12 text-center shadow-xl ${locked ? 'border-red-100 bg-red-50/50 dark:bg-red-900/10' : 'border-green-100 bg-green-50/50 dark:bg-green-900/10'}`}>
                        <div className="mb-6 flex justify-center">
                            {locked ? <div className="bg-red-100 text-red-600 p-4 rounded-full"><AlertTriangle size={48} /></div> : <div className="bg-green-100 text-green-600 p-4 rounded-full"><MapPin size={48} /></div>}
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black mb-2 text-slate-800 dark:text-slate-100">{item.neighborhood}</h1>
                        <h2 className="text-xl text-slate-500 font-bold mb-6">{item.district} / {item.city}</h2>

                        <div className={`inline-block px-6 py-2 rounded-xl text-lg font-bold border ${locked ? 'bg-red-500 text-white border-red-600' : 'bg-green-500 text-white border-green-600'}`}>
                            {locked ? '⛔ حي محظور (مغلق)' : '✅ حي متاح (مفتوح)'}
                        </div>
                        <p className="mt-6 text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto">
                            {locked
                                ? `للأسف، حي ${item.neighborhood} في منطقة ${item.district} محظور حالياً من تسجيل النفوس الجديد.`
                                : `حي ${item.neighborhood} متاح حالياً.`}
                        </p>
                    </div>
                    <div className="mt-8 flex justify-center">
                        <ShareMenu title={`حالة حي ${item.neighborhood}`} />
                    </div>
                </div>
            </main>
        );
    }

    // B. Group View (District or City Summary)
    if ((viewType === 'district' || viewType === 'city') && groupItems.length > 0) {
        // Group by district for city view
        const districtGroups: Record<string, typeof groupItems> = {};
        for (const item of groupItems) {
            const d = item.district || 'أخرى';
            if (!districtGroups[d]) districtGroups[d] = [];
            districtGroups[d].push(item);
        }
        const sortedDistricts = Object.entries(districtGroups).sort((a, b) => b[1].length - a[1].length);

        return (
            <main className="min-h-screen bg-white dark:bg-slate-950 font-cairo">
                <PageHero
                    title={viewType === 'district' ? `مناطق ${title} المحظورة` : `أحياء ${title} المحظورة`}
                    description={`قائمة بجميع الأحياء المغلقة أمام الأجانب في ${title} — ${groupItems.length} حي`}
                    icon={<MapPin className="w-10 h-10 md:w-12 md:h-12 text-pink-500" />}
                />
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <Link href="/zones" className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 mb-8 font-bold w-fit transition">
                        <ArrowRight size={20} />
                        عودة للخريطة
                    </Link>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 flex-wrap">
                            <ShieldAlert className="text-red-500" />
                            {viewType === 'district' ? `الأحياء المحظورة في ${title}` : `الأحياء المحظورة في مدينة ${title}`}
                            <span className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full">{groupItems.length} حي مغلق</span>
                        </h2>

                        {viewType === 'city' && sortedDistricts.length > 1 ? (
                            <div className="space-y-6">
                                {sortedDistricts.map(([district, items]) => (
                                    <div key={district}>
                                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                                            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{items.length}</span>
                                            {district}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {items.map((item: any) => (
                                                <div key={item.id} className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30">
                                                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{item.neighborhood}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {groupItems.map((item: any) => (
                                    <div key={item.id} className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30">
                                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{item.neighborhood}</div>
                                        {viewType === 'district' && <div className="text-xs text-red-600 dark:text-red-400 mt-1">{item.city}</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex justify-center">
                        <ShareMenu title={`المناطق المحظورة في ${title}`} />
                    </div>
                </div>
            </main>
        );
    }

    // C. Not Found (Graceful UI - Likely Safe)
    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center font-cairo bg-white dark:bg-slate-950">
            <div className="bg-slate-50 dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-2xl w-full">
                <div className="mb-6 flex justify-center">
                    <div className="bg-emerald-100 text-emerald-600 p-4 rounded-full animate-bounce-slow">
                        <MapPin size={64} />
                    </div>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black text-slate-800 dark:text-slate-100 mb-4 leading-tight">
                    لم يتم العثور على المنطقة في قائمة الحظر
                </h1>

                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-6 my-6">
                    <p className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">
                        مما يعني أن المنطقة غالباً <span className="underline decoration-wavy decoration-emerald-400">غير محظورة</span> (مفتوحة)
                    </p>
                    <p className="text-sm sm:text-base text-emerald-600/80 dark:text-emerald-500/80">
                        لم نجد أي سجل حظر لهذا الاسم في قاعدة البيانات الرسمية.
                    </p>
                </div>

                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl text-right mb-8">
                    <AlertTriangle className="text-amber-500 shrink-0 mt-1" size={24} />
                    <div className="text-amber-800 dark:text-amber-200 text-sm sm:text-base font-medium">
                        <strong>تنبيه هام:</strong> تأكد أنك قمت بكتابة اسم الحي أو المنطقة (بالتركي) بشكل <b>صحيح تماماً</b> ومطابق للفاتورة أو عقد الإيجار. حرف واحد خطأ قد يغير النتيجة!
                        <div className="mt-2 text-xs font-mono bg-white/50 dark:bg-black/20 p-2 rounded dir-ltr text-center">
                            بحثك الحالي: <span className="select-all font-bold">"{decodedSlug}"</span>
                        </div>
                    </div>
                </div>

                <Link href="/zones" className="inline-flex items-center gap-2 bg-slate-800 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all text-lg">
                    <ArrowRight size={20} />
                    جرب البحث مرة أخرى
                </Link>
            </div>
        </main>
    );
}
