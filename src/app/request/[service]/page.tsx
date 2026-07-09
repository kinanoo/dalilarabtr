import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHero from '@/components/PageHero';
import { SITE_CONFIG } from '@/lib/config';
import { SERVICES_LIST } from '@/lib/constants';
import { SchemaScript, generateBreadcrumbSchema } from '@/lib/schemaOrg';
import { CheckCircle2, ClipboardList, MessageCircle, ShieldCheck, ChevronLeft, HelpCircle } from 'lucide-react';

export const revalidate = 86400;

/**
 * Per-service landing pages (/request/<serviceId>) — the conversion layer the
 * old single form lacked. Every claim here is deliberately honest: no invented
 * fees, durations, or guarantees — pricing/timing are agreed on WhatsApp
 * before anything starts. The CTA deep-links the request form with the
 * service preselected (?service=id).
 */

type ServiceCopy = {
  heroDesc: string;
  what: string[];
  needs: string[];
};

const COPY: Record<string, ServiceCopy> = {
  'syria-docs': {
    heroDesc: 'إخراج قيد، بيان عائلي، وثائق مدنية ورسمية من سوريا — نتابع استخراجها وإيصالها إليك في تركيا.',
    what: [
      'إخراج قيد فردي أو عائلي حديث',
      'بيان ولادة أو زواج أو وفاة',
      'متابعة استخراج الوثيقة من الدوائر المختصة وإيصالها إليك',
    ],
    needs: [
      'بيانات صاحب الوثيقة كاملة (الاسم، اسم الأب والأم، مكان ورقم القيد إن توفر)',
      'تحديد نوع الوثيقة المطلوبة والغرض منها',
    ],
  },
  'flight-booking': {
    heroDesc: 'حجوزات طيران لجميع الوجهات — نبحث لك عن أنسب الخيارات والأسعار المتاحة ونرتب الحجز.',
    what: [
      'البحث عن أنسب الرحلات والأسعار المتاحة لوجهتك وتاريخك',
      'ترتيب الحجز وإرسال التذكرة إليك',
      'مساعدة في متطلبات السفر الأساسية المرتبطة بالحجز',
    ],
    needs: [
      'الوجهة والتواريخ المرغوبة وعدد المسافرين',
      'صورة صفحة بيانات جواز السفر (بعد التواصل والاتفاق — لا ترسلها عبر النموذج)',
    ],
  },
  'single-paper': {
    heroDesc: 'استخراج ورقة العزوبية اللازمة لمعاملة تثبيت الزواج في البلديات التركية.',
    what: [
      'متابعة استخراج وثيقة العزوبية من الجهات المختصة',
      'توجيهك للخطوة التالية في معاملة الزواج بعد استلامها',
    ],
    needs: [
      'بياناتك المدنية كاملة',
      'تحديد الجهة التي طلبت الوثيقة منك (بلدية، نوتر...)',
    ],
  },
  'newspaper-ad': {
    heroDesc: 'نشر إعلان فقدان (هوية، جواز، وثيقة) في جريدة رسمية — خطوة تطلبها بعض الدوائر قبل إصدار بدل ضائع.',
    what: [
      'صياغة إعلان الفقدان بالشكل الذي تقبله الدوائر الرسمية',
      'نشره في جريدة معتمدة وإرسال ما يثبت النشر إليك',
    ],
    needs: [
      'نوع الوثيقة المفقودة وبياناتها الأساسية',
      'اسم صاحبها كما هو مكتوب فيها',
    ],
  },
  'translation': {
    heroDesc: 'ترجمة محلّفة ومعتمدة لوثائقك بين العربية والتركية وغيرهما، مع تصديق النوتر عند الحاجة.',
    what: [
      'ترجمة محلّفة (Yeminli tercüme) مقبولة لدى الدوائر الرسمية',
      'تصديق النوتر (Noter) على الترجمة عند طلب الجهة الرسمية ذلك',
      'ترجمة الوثائق الشائعة: قيود، شهادات، عقود، وكالات، لوحات قيادة',
    ],
    needs: [
      'صورة واضحة للوثيقة (بعد التواصل والاتفاق)',
      'تحديد الجهة التي ستقدَّم إليها الترجمة لمعرفة هل يلزم تصديق النوتر',
    ],
  },
  'attestation': {
    heroDesc: 'تسيير معاملات تصديق الأوراق والوثائق لدى الجهات المختصة في تركيا.',
    what: [
      'متابعة تصديق الوثائق لدى الجهات المطلوبة (الولاية، النوتر، الجهات المختصة)',
      'إرشادك لتسلسل التصديق الصحيح حسب نوع وثيقتك ووجهة استخدامها',
    ],
    needs: [
      'نوع الوثيقة والجهة التي تطلب التصديق',
      'صورة الوثيقة (بعد التواصل والاتفاق)',
    ],
  },
  'appointments': {
    heroDesc: 'حجز مواعيد القنصليات والسفارات وتحديث البيانات — نتابع المواعيد المتاحة ونحجز لك.',
    what: [
      'حجز مواعيد القنصليات والسفارات (جوازات، وكالات، تسجيل واقعات)',
      'مواعيد تحديث البيانات وأشباهها من المعاملات الحكومية',
      'تذكيرك بالوثائق التي تطلبها الجهة ليوم الموعد',
    ],
    needs: [
      'نوع الموعد والجهة والمدينة',
      'بيانات صاحب الموعد كما في وثائقه',
    ],
  },
  'insurance': {
    heroDesc: 'إصدار بوالص التأمين المطلوبة لمعاملات الإقامة وغيرها من شركات مرخّصة.',
    what: [
      'إصدار تأمين صحي مقبول لمعاملات الإقامة',
      'مقارنة خيارات الشركات المرخّصة واختيار الأنسب لعمرك ووضعك',
      'إيصال البوليصة إليك جاهزة للتقديم',
    ],
    needs: [
      'صورة جواز السفر أو الكملك (بعد التواصل والاتفاق)',
      'مدة التأمين المطلوبة حسب معاملتك',
    ],
  },
};

const SHARED_FAQ = [
  {
    q: 'كم التكلفة؟',
    a: 'تختلف حسب نوع المعاملة وتفاصيلها، ونتفق عليها معك بوضوح عبر واتساب قبل البدء بأي خطوة — لا نطلب أي دفعة مسبقة عبر الموقع.',
  },
  {
    q: 'كم تستغرق المعاملة؟',
    a: 'المدة تعتمد على الجهة الرسمية المعنية وازدحامها، ونخبرك بالتقدير الواقعي عند التواصل بدل وعود غير دقيقة.',
  },
  {
    q: 'هل الموقع جهة رسمية؟',
    a: 'لا — دليل العرب جهة مساعدة وتوجيه ومتابعة، ولسنا مكتب محاماة ولا جهة حكومية. راجع صفحة إخلاء المسؤولية.',
  },
];

export function generateStaticParams() {
  return SERVICES_LIST.map((s) => ({ service: s.id }));
}

export async function generateMetadata(props: { params: Promise<{ service: string }> }): Promise<Metadata> {
  const { service } = await props.params;
  const svc = SERVICES_LIST.find((s) => s.id === service);
  if (!svc || !COPY[service]) return { title: 'طلب خدمة' };
  return {
    title: `${svc.title} — طلب الخدمة`,
    description: COPY[service].heroDesc,
    alternates: { canonical: `/request/${service}` },
    openGraph: {
      title: `${svc.title} — دليل العرب في تركيا`,
      description: COPY[service].heroDesc,
      url: `${SITE_CONFIG.siteUrl}/request/${service}`,
      type: 'website',
    },
  };
}

export default async function ServiceLandingPage(props: { params: Promise<{ service: string }> }) {
  const { service } = await props.params;
  const svc = SERVICES_LIST.find((s) => s.id === service);
  const copy = COPY[service];
  if (!svc || !copy) notFound();

  const whatsappNumber = (SITE_CONFIG.whatsapp || '').replace(/\D/g, '');
  const waText = encodeURIComponent(`مرحباً، أريد الاستفسار عن خدمة: ${svc.title}`);

  const breadcrumb = generateBreadcrumbSchema([
    { name: 'الرئيسية', url: '/' },
    { name: 'طلب خدمة', url: '/request' },
    { name: svc.title, url: `/request/${service}` },
  ]);

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: svc.title,
    description: copy.heroDesc,
    provider: { '@type': 'Organization', name: SITE_CONFIG.name, url: SITE_CONFIG.siteUrl },
    areaServed: 'TR',
    url: `${SITE_CONFIG.siteUrl}/request/${service}`,
  };

  return (
    <main className="flex flex-col min-h-screen">
      <SchemaScript schema={[serviceSchema, breadcrumb]} />
      <PageHero title={svc.title} description={copy.heroDesc} />

      <div className="w-full max-w-3xl mx-auto px-4 pt-8 pb-12 space-y-6">

        {/* What we do */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="flex items-center gap-2.5 text-lg font-extrabold text-slate-900 dark:text-slate-50 mb-4">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300 shrink-0"><CheckCircle2 size={16} /></span>
            ما الذي نقوم به
          </h2>
          <ul className="space-y-2.5">
            {copy.what.map((w) => (
              <li key={w} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                {w}
              </li>
            ))}
          </ul>
        </section>

        {/* What you may need */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="flex items-center gap-2.5 text-lg font-extrabold text-slate-900 dark:text-slate-50 mb-4">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300 shrink-0"><ClipboardList size={16} /></span>
            ما قد تحتاجه غالباً
          </h2>
          <ul className="space-y-2.5">
            {copy.needs.map((n) => (
              <li key={n} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                {n}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            نؤكد لك المطلوب بدقة عند التواصل — لا ترسل صور وثائقك قبل الاتفاق.
          </p>
        </section>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/request?service=${service}`}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
          >
            اطلب الخدمة الآن
            <ChevronLeft size={18} />
          </Link>
          <a
            href={`https://wa.me/${whatsappNumber}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-emerald-600/30 text-emerald-700 dark:text-emerald-400 font-bold py-3.5 px-6 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
          >
            <MessageCircle size={18} />
            استفسر عبر واتساب
          </a>
        </div>

        {/* FAQ */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="flex items-center gap-2.5 text-lg font-extrabold text-slate-900 dark:text-slate-50 mb-4">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300 shrink-0"><HelpCircle size={16} /></span>
            أسئلة شائعة
          </h2>
          <div className="space-y-4">
            {SHARED_FAQ.map((f) => (
              <div key={f.q}>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">{f.q}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust note */}
        <div className="flex items-start gap-3 bg-emerald-600/[0.06] dark:bg-emerald-400/10 border border-emerald-600/15 dark:border-emerald-400/20 rounded-2xl p-4">
          <ShieldCheck size={18} className="text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            نتفق على التكلفة والخطوات قبل البدء، ولا نطلب أي مبلغ مسبقاً عبر الموقع. تواصلنا الرسمي حصراً عبر
            قنوات الموقع المعلنة — احذر المنتحلين.
          </p>
        </div>
      </div>
    </main>
  );
}
