import PageHero from '@/components/PageHero';
import Link from 'next/link';
import { Metadata } from 'next';
import { ScrollText, ShieldCheck, FileSearch, RefreshCw, AlertTriangle, Scale, MessageCircle, BadgeCheck } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/config';

export const revalidate = 86400; // static-ish; revalidate daily

export const metadata: Metadata = {
    title: 'سياسة التحرير ومنهجية المحتوى — من يكتب وكيف نتحقّق',
    description:
        'كيف يُنتَج محتوى دليل العرب والسوريين في تركيا: هيئة التحرير، مصادرنا الرسمية (الجريدة الرسمية ودائرة الهجرة والوزارات)، آلية التحقّق والتحديث، وسياسة تصحيح الأخطاء.',
    alternates: { canonical: '/editorial-policy' },
    openGraph: {
        title: 'سياسة التحرير ومنهجية المحتوى — دليل العرب في تركيا',
        description: 'من يكتب محتوانا، وكيف نتحقّق منه، ومن أين نستمدّ معلوماتنا.',
        url: `${SITE_CONFIG.siteUrl}/editorial-policy`,
        type: 'website',
    },
};

const SECTIONS: { icon: React.ReactNode; title: string; body: React.ReactNode }[] = [
    {
        icon: <BadgeCheck size={26} />,
        title: 'من يقف خلف المحتوى؟',
        body: (
            <>
                يُنتَج محتوى الموقع وتُراجَع دقّته من قِبل <strong>هيئة تحرير دليل العرب والسوريين في تركيا</strong> — فريق
                تحريريّ متخصّص في متابعة الإجراءات الرسمية للأجانب في تركيا (الإقامة، الكملك، العمل، الصحة، التعليم،
                والمعاملات الحكومية). لا نَنشُر باسم أفراد وهميّين؛ الجهة المسؤولة عن كل مقال هي هيئة التحرير نفسها،
                وهي التي تُحدّثه وتُصحّحه.
            </>
        ),
    },
    {
        icon: <FileSearch size={26} />,
        title: 'مصادرنا',
        body: (
            <>
                نستمدّ معلوماتنا من <strong>المصادر الرسمية الأولية</strong> حصراً، ومنها: الجريدة الرسمية التركية
                (<span dir="ltr">Resmî Gazete</span>)، الرئاسة العامة لإدارة الهجرة (<span dir="ltr">Göç İdaresi</span>)،
                مديرية النفوس (<span dir="ltr">Nüfus</span>)، مؤسسة الضمان الاجتماعي (<span dir="ltr">SGK</span>)،
                وزارتا العمل والصحة، وبوابة <span dir="ltr">e-Devlet</span>. نضع رابط المصدر الرسمي داخل المقال كلّما توفّر،
                لتتحقّق بنفسك.
            </>
        ),
    },
    {
        icon: <ShieldCheck size={26} />,
        title: 'كيف نتحقّق قبل النشر',
        body: (
            <>
                كل معلومة حسّاسة (رسوم، مهلة، شرط قانوني) تُقارَن بالمصدر الرسمي قبل النشر. الأرقام التي تتغيّر سنوياً
                (كالرسوم والحدّ الأدنى للأجور) نُرفقها بتاريخها ونُشير إلى ضرورة التحقّق من الرقم الرسمي الحالي، بدل
                افتراض ثباتها. ولا نَنشُر ادّعاءً لا نستطيع إسناده لمصدر موثوق.
            </>
        ),
    },
    {
        icon: <RefreshCw size={26} />,
        title: 'متى نُحدّث ونُراجع',
        body: (
            <>
                القوانين والإجراءات في تركيا تتغيّر باستمرار. نتابع التعديلات ونُراجع المقالات دورياً؛ ويظهر في أعلى كل
                مقال تاريخ <strong>«آخر تحديث»</strong> وشارة <strong>«راجعته الهيئة»</strong> لتعرف حداثة المعلومة. عند
                صدور قرار رسمي جديد نُحدّث المقال المتأثّر ونضيف خبراً في قسم التحديثات.
            </>
        ),
    },
    {
        icon: <MessageCircle size={26} />,
        title: 'سياسة تصحيح الأخطاء',
        body: (
            <>
                نرحّب بأي تصحيح. إن لاحظت معلومة قديمة أو غير دقيقة، راسِلنا عبر{' '}
                <Link href="/contact" className="text-emerald-700 dark:text-emerald-400 font-bold underline underline-offset-2">
                    صفحة التواصل
                </Link>{' '}
                وسنراجعها ونُصحّحها بأسرع وقت. الشفافية والدقّة أهمّ من السرعة.
            </>
        ),
    },
    {
        icon: <AlertTriangle size={26} />,
        title: 'إخلاء المسؤولية',
        body: (
            <>
                دليل العرب موقع معلوماتيّ إرشاديّ، <strong>ولسنا مكتباً قانونياً ولا جهة رسمية</strong>. المعلومات هنا
                للمساعدة والتوجيه العامّ، ولا تُغني عن مراجعة الجهة الرسمية المختصّة أو مستشار قانوني في الحالات الخاصّة.
                القرار الرسمي النهائي يبقى دائماً للدائرة الحكومية المعنيّة.
            </>
        ),
    },
];

export default function EditorialPolicyPage() {
    const orgSchema = {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'سياسة التحرير ومنهجية المحتوى',
        url: `${SITE_CONFIG.siteUrl}/editorial-policy`,
        inLanguage: 'ar',
        mainEntity: {
            '@type': 'Organization',
            name: SITE_CONFIG.name,
            url: SITE_CONFIG.siteUrl,
            logo: `${SITE_CONFIG.siteUrl}/logo.png`,
            publishingPrinciples: `${SITE_CONFIG.siteUrl}/editorial-policy`,
            knowsAbout: [
                'الإقامة في تركيا', 'الكملك والحماية المؤقتة', 'إذن العمل في تركيا',
                'الجنسية التركية', 'التأمين الصحي SGK', 'التعليم في تركيا', 'المعاملات الرسمية للأجانب',
            ],
        },
    };

    return (
        <main className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />

            <PageHero
                title="سياسة التحرير ومنهجية المحتوى"
                description="من يكتب محتوى دليل العرب، ومن أين نستمدّ معلوماتنا، وكيف نتحقّق ونُحدّث ونُصحّح"
                icon={<ScrollText className="w-12 h-12" />}
            />

            <section className="pt-8 pb-12 px-4">
                <div className="max-w-3xl mx-auto space-y-4">
                    {SECTIONS.map((s, i) => (
                        <article
                            key={i}
                            className="group relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg hover:shadow-emerald-500/5 transition-all"
                        >
                            <span className="absolute top-0 end-0 w-1 h-full bg-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 shrink-0 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    {s.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 mb-2">{s.title}</h2>
                                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">{s.body}</p>
                                </div>
                            </div>
                        </article>
                    ))}

                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 p-4 mt-2">
                        <Scale size={20} className="text-slate-400 shrink-0" />
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            هذه الصفحة تُوضّح التزامنا بالدقّة والشفافية. تعرّف أكثر علينا في{' '}
                            <Link href="/about" className="font-bold text-emerald-700 dark:text-emerald-400 underline underline-offset-2">صفحة «من نحن»</Link>.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}
