import Link from 'next/link';
import Image from 'next/image';
import { ListChecks, ArrowLeft } from 'lucide-react';

export interface FeaturedGuide {
    id: string;
    title: string;
    slug: string;
    category: string;
    image: string | null;
    stepCount: number;
}

/**
 * FeaturedGuides — a homepage section surfacing the illustrated, step-by-step
 * guides (articles that carry a HowTo `steps` array). Renders nothing when
 * there are no guides, so it's safe to mount unconditionally. Cards show the
 * guide's hero image when present, or a clean branded placeholder otherwise,
 * so the row looks complete even before every guide has artwork.
 */
export default function FeaturedGuides({ guides }: { guides: FeaturedGuide[] }) {
    if (!guides?.length) return null;

    return (
        <section className="relative bg-white dark:bg-slate-950 pt-4 pb-16" dir="rtl">
            <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-50 leading-tight tracking-tight">
                    شروحات مصوّرة <span className="bg-gradient-to-l from-emerald-500 to-teal-500 bg-clip-text text-transparent">خطوة بخطوة</span>
                </h2>
                <p className="mt-3 mb-8 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                    لأهمّ المعاملات والإجراءات الرسمية في تركيا.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {guides.map((g) => (
                        <Link
                            key={g.id}
                            href={`/article/${g.slug}`}
                            className="group relative flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                                {g.image ? (
                                    <Image
                                        src={g.image}
                                        alt={g.title}
                                        fill
                                        sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                                        className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 px-4 text-center overflow-hidden">
                                        <ListChecks aria-hidden size={120} className="absolute -bottom-5 -left-5 text-white/10 rotate-[-12deg]" />
                                        <span className="relative inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/25">
                                            <ListChecks size={26} className="text-white" />
                                        </span>
                                        <span className="relative text-white font-black text-base leading-tight drop-shadow-sm line-clamp-2">{g.category}</span>
                                        <span className="relative text-white/80 text-[11px] font-bold tracking-wide">شرح مصوّر</span>
                                    </div>
                                )}
                                <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-md">
                                    <ListChecks size={12} /> {g.stepCount} خطوات
                                </span>
                                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />
                                <span className="absolute bottom-3 right-3 text-[11px] font-bold text-white/95 bg-black/35 backdrop-blur-sm px-2 py-0.5 rounded-md">
                                    {g.category}
                                </span>
                            </div>
                            <div className="flex-1 flex flex-col p-4">
                                <h3 className="font-black text-slate-900 dark:text-slate-50 leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    {g.title}
                                </h3>
                                <span className="mt-auto pt-3 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                                    اقرأ الشرح
                                    <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
