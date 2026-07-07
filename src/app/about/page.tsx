import PageHero from '@/components/PageHero';
import { Users, Scale, BadgeCheck, ShieldCheck, BookOpen, Shield, Clock, Heart } from 'lucide-react';
import { Metadata } from 'next';
import { supabase, withTimeout } from '@/lib/supabaseClient';
import { SITE_CONFIG } from '@/lib/config';

export const revalidate = 3600; // Cache for 1 hour

export const metadata: Metadata = {
  title: 'عن الموقع',
  description: 'تعرّف على دليل العرب والسوريين في تركيا، رسالتنا، وفريقنا المتخصص في تقديم المعلومات القانونية والإجرائية.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'عن دليل العرب في تركيا',
    description: 'الدليل الشامل للعرب والسوريين في تركيا — معلومات قانونية وإجرائية موثوقة.',
    url: `${SITE_CONFIG.siteUrl}/about`,
    type: 'website',
  },
};

async function getStats() {
  if (!supabase) return { articles: 0, codes: 0 };

  const result = await withTimeout(
    Promise.all([
      supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('security_codes').select('code', { count: 'exact', head: true }),
    ])
  );

  if (!result) return { articles: 0, codes: 0 };

  const [articlesRes, codesRes] = result;
  return {
    articles: articlesRes.count || 0,
    codes: codesRes.count || 0,
  };
}

export default async function AboutPage() {
  const stats = await getStats();
    return (
        <main className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo">


            <PageHero
                title="من نحن؟"
                description="قصتنا، رسالتنا، ولماذا نسعى أن نكون دليلك القانوني الموثوق في تركيا"
                icon={<Users className="w-12 h-12" />}
            />

            {/* Mission Section */}
            <section className="py-16 px-4 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08),transparent_60%)]" aria-hidden />
                <div className="max-w-4xl mx-auto text-center relative">
                    <h2 className="text-3xl sm:text-4xl font-black mb-6 text-slate-800 dark:text-slate-100 leading-tight">
                        لماذا أسسنا <span className="bg-gradient-to-l from-emerald-600 to-emerald-500 bg-clip-text text-transparent">دليل العرب في تركيا</span>؟
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
                        في عام 2025، لاحظنا الفجوة الكبيرة في المعلومات القانونية المتاحة للعرب في تركيا. شائعات كثيرة، قوانين متغيرة، ومعلومات غير دقيقة تؤدي لمشاكل قانونية (منع، ترحيل، غرامات).
                        <br /><br />
                        لذا قررنا إنشاء منصة تكون <strong className="text-emerald-700 dark:text-emerald-400">المرجع الموثوق</strong> الذي يجمع بين الخبرة القانونية والتقنية الحديثة. هدفنا أن نوصل لك المعلومة الرسمية الأحدث في وجه الإشاعة.
                    </p>
                </div>
            </section>

            {/* Section divider */}
            <div className="relative h-12 -my-6">
                <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 bg-slate-50 dark:bg-slate-950 rounded-full border border-slate-200 dark:border-slate-800">
                    <Heart size={16} className="text-emerald-500" />
                </div>
            </div>

            {/* Trust Grid — magazine cards with accent stripes */}
            <section className="py-16 px-4 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">
                            ثلاث ركائز لا نحيد عنها
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="group relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-950/20 rounded-2xl border border-slate-200 dark:border-slate-800 p-7 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-1 transition-all duration-300">
                            <span className="absolute top-0 end-0 w-1 h-full bg-emerald-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
                                <Scale size={32} />
                            </div>
                            <h3 className="text-xl font-black mb-3 text-slate-800 dark:text-slate-100">دقة قانونية</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                معلوماتنا مستمدة مباشرة من الجريدة الرسمية التركية ومواقع الدوائر الحكومية (Göç İdaresi, Nüfus).{' '}
                                <a href="/editorial-policy" className="font-bold text-emerald-700 dark:text-emerald-400 underline underline-offset-2">اطّلع على منهجيتنا التحريرية</a>.
                            </p>
                        </div>

                        <div className="group relative overflow-hidden bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-900 dark:to-blue-950/20 rounded-2xl border border-slate-200 dark:border-slate-800 p-7 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-1 transition-all duration-300">
                            <span className="absolute top-0 end-0 w-1 h-full bg-blue-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
                                <BadgeCheck size={32} />
                            </div>
                            <h3 className="text-xl font-black mb-3 text-slate-800 dark:text-slate-100">تحديث دوري</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                نتابع التعديلات القانونية ونحدّث المقالات والأدوات بشكل دوري، ونقارن معلوماتنا بالمصادر الرسمية (الجريدة الرسمية والدوائر الحكومية).
                            </p>
                        </div>

                        <div className="group relative overflow-hidden bg-gradient-to-br from-white to-violet-50/50 dark:from-slate-900 dark:to-violet-950/20 rounded-2xl border border-slate-200 dark:border-slate-800 p-7 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-1 transition-all duration-300">
                            <span className="absolute top-0 end-0 w-1 h-full bg-violet-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                            <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
                                <ShieldCheck size={32} />
                            </div>
                            <h3 className="text-xl font-black mb-3 text-slate-800 dark:text-slate-100">خصوصية بدون تخزين</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                نحترم خصوصيتك. أدواتنا (مثل فحص الكود) لا تخزن بياناتك الشخصية أبداً.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats — premium counters with accent stripes */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">
                            ما حققناه حتى الآن
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                        <div className="group relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 text-center hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
                            <span className="absolute top-0 end-0 w-0.5 h-full bg-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <BookOpen size={22} />
                            </div>
                            <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 mb-1 tabular-nums" dir="ltr">+{stats.articles}</div>
                            <div className="text-xs sm:text-sm text-slate-500 font-bold">مقال ودليل</div>
                        </div>

                        <div className="group relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 text-center hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
                            <span className="absolute top-0 end-0 w-0.5 h-full bg-blue-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Shield size={22} />
                            </div>
                            <div className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 mb-1 tabular-nums" dir="ltr">+{stats.codes}</div>
                            <div className="text-xs sm:text-sm text-slate-500 font-bold">كود أمني</div>
                        </div>

                        <div className="group relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 text-center hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
                            <span className="absolute top-0 end-0 w-0.5 h-full bg-violet-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Clock size={22} />
                            </div>
                            <div className="text-3xl sm:text-4xl font-black text-violet-600 dark:text-violet-400 mb-1 tabular-nums" dir="ltr">24/7</div>
                            <div className="text-xs sm:text-sm text-slate-500 font-bold">دليل المواقف</div>
                        </div>

                        <div className="group relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 text-center hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
                            <span className="absolute top-0 end-0 w-0.5 h-full bg-rose-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Heart size={22} />
                            </div>
                            <div className="text-3xl sm:text-4xl font-black text-rose-600 dark:text-rose-400 mb-1 tabular-nums" dir="ltr">100%</div>
                            <div className="text-xs sm:text-sm text-slate-500 font-bold">مجاني</div>
                        </div>
                    </div>
                </div>
            </section>


        </main>
    );
}
