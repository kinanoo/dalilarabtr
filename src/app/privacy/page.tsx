import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle,
  BarChart3,
  Clock,
  Database,
  Globe2,
  KeyRound,
  MessageCircle,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import PageHero from '@/components/PageHero';
import PrivacyControls from '@/components/privacy/PrivacyControls';

const PRIVACY_FAQ: { q: string; a: string }[] = [
  {
    q: 'هل أحتاج إلى تقديم بيانات لتصفّح الموقع؟',
    a: 'لا. التصفّح العام لا يحتاج إلى حساب. قد تُعالج بيانات اتصال تقنية لازمة للحماية وتشغيل الموقع، ولا تعمل تحليلات الاستخدام الاختيارية قبل موافقتك.',
  },
  {
    q: 'ما الذي يُحفظ عند إنشاء حساب؟',
    a: 'تدير Supabase جلسة الحساب، ونحفظ البريد الإلكتروني واسم العرض والصورة الشخصية التي يرسلها مزوّد تسجيل الدخول، إضافة إلى المحتوى الذي تختار نشره أو حفظه في حسابك.',
  },
  {
    q: 'هل تحفظون طلب الخدمة الذي أكتبه؟',
    a: 'نموذج طلب الخدمة يجهّز رسالة على جهازك ثم يفتح واتساب. لا يحفظ الموقع نسخة من نص الطلب، لكن الرسالة التي ترسلها لاحقاً تخضع لسياسة واتساب.',
  },
  {
    q: 'هل تحفظون رقم هاتفي أو رقم الكملك؟',
    a: 'لا يوجد في النماذج العامة حقل لرقم الهاتف أو الكملك، ولا نخزنهما في قاعدة الموقع. لا ترسل وثائق أو كلمات مرور أو بيانات بنكية في التعليقات أو الأسئلة العامة.',
  },
  {
    q: 'هل يمكنني إيقاف التحليلات بعد السماح بها؟',
    a: 'نعم. يمكنك تغيير الاختيار في قسم إعدادات الخصوصية في هذه الصفحة. عند الرفض يتوقف التتبع الاختياري ونحذف معرّفات التحليلات التي يستطيع الموقع الوصول إليها من المتصفح.',
  },
  {
    q: 'كيف أطلب نسخة من بياناتي أو تصحيحها أو حذفها؟',
    a: 'أرسل الطلب عبر صفحة التواصل وحدد البريد المرتبط بالحساب ونوع الطلب. قد نطلب خطوة تحقق لحماية الحساب، ثم نعالج الطلب ضمن المدة التي يحددها القانون المطبق.',
  },
];

export const metadata: Metadata = {
  title: 'سياسة الخصوصية وإعداداتها',
  description: 'بيان واضح للبيانات التي يعالجها دليل العرب، أغراض استخدامها، الجهات المستلمة، مدد الاحتفاظ، وحقوق المستخدم وإعدادات التحليلات.',
  alternates: { canonical: '/privacy' },
};

const SECTIONS = [
  {
    icon: ShieldCheck,
    title: 'المسؤول عن البيانات ونطاق السياسة',
    body: (
      <div className="space-y-2">
        <p>
          إدارة موقع «دليل العرب والسوريين في تركيا» هي الجهة المسؤولة عن معالجة البيانات داخل هذا الموقع.
          تشمل هذه السياسة صفحات الموقع وحسابات الأعضاء والنشرة والأسئلة والتقييمات ومعرض النماذج.
        </p>
        <p>
          للاستفسار أو لممارسة حق متعلق ببياناتك، استخدم{' '}
          <Link href="/contact" className="font-bold text-emerald-700 hover:underline dark:text-emerald-400">صفحة التواصل</Link>
          {' '}واختر «استفسار عام»، ثم اكتب أن الرسالة تخص الخصوصية.
        </p>
      </div>
    ),
  },
  {
    icon: Database,
    title: 'البيانات التي نعالجها فعلياً',
    body: (
      <ul className="list-disc space-y-2 ps-5">
        <li><strong>الحساب:</strong> البريد الإلكتروني، اسم العرض، الصورة الشخصية، معرّف الحساب، وبيانات الجلسة عند تسجيل الدخول.</li>
        <li><strong>المحتوى الذي ترسله:</strong> التعليقات والأسئلة وسياقها والاسم أو البريد الاختياري، التقييمات والبلاغات والملاحظات المرتبطة بها.</li>
        <li><strong>النشرة والإشعارات:</strong> البريد الإلكتروني ومصدر الاشتراك، أو اشتراك المتصفح التقني اللازم لإرسال الإشعار.</li>
        <li><strong>الأمان والتشغيل:</strong> عنوان الاتصال الذي يراه مزوّد الاستضافة، سجلات الأخطاء، ومعرّف IP مجزأ في بعض النماذج لمنع التكرار والإساءة.</li>
        <li><strong>روابط النماذج الخاصة:</strong> وقت المشاهدة، معرّف IP مجزأ، نوع المتصفح، والصفحة المحيلة لحساب المشاهدات وحماية الرابط.</li>
        <li><strong>التفضيلات المحلية:</strong> مثل المظهر وآخر ما قرأت واختيار الخصوصية؛ تبقى في متصفحك ما لم تكن لازمة لمزامنة ميزة طلبتها.</li>
      </ul>
    ),
  },
  {
    icon: BarChart3,
    title: 'التحليلات الاختيارية',
    body: (
      <div className="space-y-2">
        <p>
          لا تعمل تحليلات الموقع الداخلية ولا Google Analytics قبل اختيار «السماح بالتحليلات».
          بعد الموافقة قد نقيس الصفحة والمسار المحيل وحجم الشاشة ونوع الجهاز والمتصفح والنظام واللغة والأداء والتفاعلات العامة.
        </p>
        <p>
          ننشئ معرّف زائر ومعرّف جلسة، ونخزن تجزئة مختصرة لعنوان IP تتغير يومياً مع بلد أو مدينة تقريبية يرسلها Cloudflare.
          لا نستخدم هذه البيانات لإنشاء إعلانات موجهة ولا نبيعها. سحب الموافقة يوقف القياس اللاحق ولا يؤثر في استخدام الموقع.
        </p>
      </div>
    ),
  },
  {
    icon: KeyRound,
    title: 'الملفات والتخزين في المتصفح',
    body: (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-start text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="p-2 text-start">الاسم أو النوع</th>
              <th className="p-2 text-start">الغرض</th>
              <th className="p-2 text-start">المدة</th>
              <th className="p-2 text-start">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            <tr><td className="p-2 font-mono">Supabase auth</td><td className="p-2">جلسة تسجيل الدخول</td><td className="p-2">مدة الجلسة أو حتى تسجيل الخروج</td><td className="p-2">ضروري للحساب</td></tr>
            <tr><td className="p-2 font-mono">dalil_models_gallery_access</td><td className="p-2">تذكر فتح معرض النماذج المحمي</td><td className="p-2">6 ساعات</td><td className="p-2">ضروري عند فتح المعرض</td></tr>
            <tr><td className="p-2 font-mono">dalil_analytics_consent</td><td className="p-2">حفظ اختيار الخصوصية</td><td className="p-2">حتى تغييره أو مسح المتصفح</td><td className="p-2">ضروري لحفظ القرار</td></tr>
            <tr><td className="p-2 font-mono">visitor_id / session_id</td><td className="p-2">إحصاء الزيارات والجلسات</td><td className="p-2">حتى السحب أو مسح التخزين / نهاية الجلسة</td><td className="p-2">اختياري</td></tr>
            <tr><td className="p-2 font-mono">_ga / _ga_*</td><td className="p-2">Google Analytics</td><td className="p-2">بحسب إعداد Google، وقد تصل إلى سنتين</td><td className="p-2">اختياري</td></tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    icon: MessageCircle,
    title: 'طلبات الخدمة وواتساب',
    body: (
      <p>
        ما تكتبه في نموذج طلب الخدمة لا يُرسل إلى قاعدة الموقع؛ يفتح واتساب برسالة جاهزة على جهازك.
        عندما تختار إرسالها تصبح المحادثة بينك وبين الجهة المستلمة عبر واتساب وتخضع لشروط Meta/WhatsApp.
        لا ترسل وثيقة أو معلومة حساسة قبل التأكد من الرقم والغرض والحاجة إليها.
      </p>
    ),
  },
  {
    icon: Users,
    title: 'لماذا نعالج البيانات ومن يستلمها',
    body: (
      <div className="space-y-3">
        <p>
          نعالج البيانات لتشغيل الحساب والميزات التي طلبتها، نشر المحتوى الذي أرسلته، إدارة الاشتراكات، منع الاحتيال، حماية الموقع،
          والقياس الاختياري لتحسينه. يستند ذلك، بحسب الحالة، إلى طلبك للخدمة أو موافقتك أو التزام قانوني أو مصلحة مشروعة لا تتغلب على حقوقك.
        </p>
        <ul className="list-disc space-y-2 ps-5">
          <li><strong>Supabase:</strong> الحساب وقاعدة البيانات والتخزين.</li>
          <li><strong>Cloudflare:</strong> الاستضافة والتوصيل والحماية وسجلات الاتصال التقنية.</li>
          <li><strong>Google:</strong> تسجيل الدخول، والتحليلات فقط بعد الموافقة.</li>
          <li><strong>Meta/WhatsApp:</strong> فقط عندما تختار فتح واتساب أو إرسال رسالة.</li>
        </ul>
        <p>
          قد تعالج هذه الجهات البيانات خارج بلد إقامتك وفق بنيتها وسياساتها. لا نمنح البيانات لمعلنين أو وسطاء بيانات،
          ولا نبيعها. التعليقات والأسئلة المقبولة للنشر تكون عامة بطبيعتها، أما البريد الاختياري في السؤال فلا يظهر للزوار.
        </p>
      </div>
    ),
  },
  {
    icon: Clock,
    title: 'مدة الاحتفاظ',
    body: (
      <ul className="list-disc space-y-2 ps-5">
        <li>يبقى الحساب وملفه ومحتواه ما دام الحساب قائماً أو إلى أن يُحذف المحتوى أو نقبل طلب الحذف.</li>
        <li>يبقى بريد النشرة حتى إلغاء الاشتراك، وتوجد صفحة مستقلة تنفذ الإلغاء والحذف.</li>
        <li>تبقى الأسئلة والتعليقات والتقييمات والبلاغات ما دامت منشورة أو لازمة للإشراف والتوثيق، ثم تُحذف أو تُفصل عن الحساب عند زوال الغرض.</li>
        <li>تُراجع سجلات الأمان والمشاهدات والتحليلات دورياً، وتُحذف أو تُجمّع عندما لا تعود لازمة للقياس أو منع إساءة الاستخدام.</li>
        <li>قد تبقى نسخة محدودة مدة إضافية في النسخ الاحتياطية أو عند وجود التزام قانوني أو نزاع، ثم تُزال وفق دورة الحذف.</li>
      </ul>
    ),
  },
  {
    icon: Trash2,
    title: 'حقوقك وطلبات الخصوصية',
    body: (
      <div className="space-y-2">
        <p>
          وفق القانون المطبق، يمكنك طلب معرفة ما إذا كنا نعالج بياناتك، والحصول على معلومات أو نسخة منها، وتصحيحها أو حذفها،
          والاعتراض على بعض أوجه المعالجة، وسحب الموافقة دون أثر رجعي. يمكنك أيضاً إلغاء النشرة مباشرةً من{' '}
          <Link href="/newsletter/unsubscribe" className="font-bold text-emerald-700 hover:underline dark:text-emerald-400">صفحة إلغاء الاشتراك</Link>.
        </p>
        <p>
          أرسل طلبك عبر <Link href="/contact" className="font-bold text-emerald-700 hover:underline dark:text-emerald-400">صفحة التواصل</Link>.
          سنطلب فقط ما يلزم للتحقق من أن البيانات تخصك، ثم نجيب ضمن المدة القانونية. يمكنك كذلك تقديم شكوى إلى{' '}
          <a href="https://www.kvkk.gov.tr/" target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-700 hover:underline dark:text-emerald-400">
            هيئة حماية البيانات الشخصية التركية (KVKK)
          </a>.
        </p>
      </div>
    ),
  },
  {
    icon: AlertTriangle,
    title: 'بيانات حساسة وروابط خارجية',
    body: (
      <div className="space-y-2">
        <p>
          لا تنشر في التعليقات أو الأسئلة العامة كلمات مرور أو بيانات بنكية أو رقم كملك كامل أو صور هوية وجواز.
          الموقع يتضمن روابط لمصادر حكومية وخدمات خارجية، وتطبق عليها سياسات تلك الجهات عند مغادرة موقعنا.
        </p>
        <p>
          للمعلومات المتعلقة بدقة المحتوى وحدود المسؤولية راجع{' '}
          <Link href="/disclaimer" className="font-bold text-emerald-700 hover:underline dark:text-emerald-400">إخلاء المسؤولية</Link>.
        </p>
      </div>
    ),
  },
];

export default function PrivacyPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PRIVACY_FAQ.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <main className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <PageHero
        title="سياسة الخصوصية"
        description="ما الذي نعالجه فعلياً، ولماذا، وكيف تتحكم ببياناتك واختيار التحليلات."
      />

      <div className="mx-auto w-full max-w-4xl space-y-4 px-4 pb-12 pt-8 leading-relaxed text-slate-700 dark:text-slate-200">
        <PrivacyControls />

        {SECTIONS.map((section) => (
          <section key={section.title} className="border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <h2 className="mb-3 flex items-center gap-2.5 text-lg font-bold text-slate-900 dark:text-slate-50">
              <span className="grid h-8 w-8 shrink-0 place-items-center bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                <section.icon size={16} />
              </span>
              {section.title}
            </h2>
            <div className="text-sm sm:text-[15px]">{section.body}</div>
          </section>
        ))}

        <section className="border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h2 className="mb-3 flex items-center gap-2.5 text-lg font-bold text-slate-900 dark:text-slate-50">
            <span className="grid h-8 w-8 shrink-0 place-items-center bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
              <Globe2 size={16} />
            </span>
            أسئلة شائعة
          </h2>
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            {PRIVACY_FAQ.map((item) => (
              <div key={item.q} className="py-3 first:pt-0 last:pb-0">
                <dt className="mb-1 text-sm font-bold text-slate-800 dark:text-slate-100">{item.q}</dt>
                <dd className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="pt-4 text-center text-xs text-slate-400 dark:text-slate-500">
          آخر تحديث: 16 يوليو 2026. نحدّث هذه الصفحة عند تغيير طريقة معالجة البيانات.
        </p>
      </div>
    </main>
  );
}
