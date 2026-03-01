import PageHero from '@/components/PageHero';
import { Users, Scale, BadgeCheck, ShieldCheck } from 'lucide-react';
import { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';

export const revalidate = 3600; // Cache for 1 hour

export const metadata: Metadata = {
  title: 'عن الموقع | دليل العرب في تركيا',
  description: 'تعرّف على دليل العرب والسوريين في تركيا، رسالتنا، وفريقنا المتخصص في تقديم المعلومات القانونية والإجرائية.',
  alternates: { canonical: '/about' },
};

async function getStats() {
  if (!supabase) return { articles: 0, codes: 0 };

  const [articlesRes, codesRes] = await Promise.all([
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('security_codes').select('code', { count: 'exact', head: true }),
  ]);

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
                description="قصتنا، رسالتنا، ولماذا نحن دليلك القانوني الأول في تركيا"
                icon={<Users className="w-12 h-12 text-emerald-400" />}
            />

            {/* Mission Section */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-6 text-slate-800 dark:text-slate-100">
                        لماذا أسسنا <span className="text-emerald-600">دليل العرب في تركيا</span>؟
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
                        في عام 2025، لاحظنا الفجوة الكبيرة في المعلومات القانونية المتاحة للعرب في تركيا. شائعات كثيرة، قوانين متغيرة، ومعلومات غير دقيقة تؤدي لمشاكل قانونية (منع، ترحيل، غرامات).
                        <br /><br />
                        لذا قررنا إنشاء منصة تكون <strong>المرجع الموثوق</strong> الذي يجمع بين الخبرة القانونية والتقنية الحديثة.
                    </p>
                </div>
            </section>

            {/* Trust Grid */}
            <section className="py-10 px-4 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center p-6">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                            <Scale size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">دقة قانونية</h3>
                        <p className="text-slate-500 text-sm">
                            معلوماتنا مستمدة مباشرة من الجريدة الرسمية التركية ومواقع الدوائر الحكومية (Göç İdaresi, Nüfus).
                        </p>
                    </div>
                    <div className="text-center p-6">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                            <BadgeCheck size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">تحديث يومي</h3>
                        <p className="text-slate-500 text-sm">
                            فريقنا يراقب التعديلات القانونية يومياً ويحدث المقالات والأدوات لضمان دقة المعلومات 100%.
                        </p>
                    </div>
                    <div className="text-center p-6">
                        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
                            <ShieldCheck size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">خصوصية تامة</h3>
                        <p className="text-slate-500 text-sm">
                            نحترم خصوصيتك. أدواتنا (مثل فحص الكود) لا تخزن بياناتك الشخصية أبداً.
                        </p>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-200 dark:divide-slate-800 divide-x-reverse">
                    <div>
                        <div className="text-4xl font-bold text-emerald-600 mb-2">+{stats.articles}</div>
                        <div className="text-sm text-slate-500">مقال ودليل</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-emerald-600 mb-2">+{stats.codes}</div>
                        <div className="text-sm text-slate-500">كود أمني</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-emerald-600 mb-2">24/7</div>
                        <div className="text-sm text-slate-500">مستشار ذكي</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-emerald-600 mb-2">100%</div>
                        <div className="text-sm text-slate-500">مجاني</div>
                    </div>
                </div>
            </section>


        </main>
    );
}
