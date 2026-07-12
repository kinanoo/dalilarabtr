import PageHero from '@/components/PageHero';
import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Database, Bell, MessageCircle, UserRound, Trash2, AlertTriangle, Link as LinkIcon, Users, Clock, HelpCircle } from 'lucide-react';

// Explicit yes/no answers to the questions people actually ask about their
// data. Kept as plain strings so the same content feeds BOTH the visible
// section and the FAQPage JSON-LD (Google requires the marked-up Q&A to be
// visible on the page). Every answer reflects how the site truly works.
const PRIVACY_FAQ: { q: string; a: string }[] = [
  {
    q: 'هل تجمعون اسمي؟',
    a: 'لا نطلب اسمك لتصفّح الموقع. الاسم الوحيد الذي قد نخزّنه هو «اسم العرض» إن اخترتَ تسجيل الدخول بحساب غوغل (اختياري بالكامل). طلب الخدمة عبر واتساب لا يمرّ بخوادمنا أصلاً.',
  },
  {
    q: 'هل تجمعون رقم هاتفي؟',
    a: 'لا نجمعه ولا نخزّنه على خوادمنا. عند إرسال طلب عبر واتساب يظهر رقمك لفريقنا داخل واتساب فقط — كأي محادثة واتساب عادية — وذلك يخضع لسياسة واتساب لا لسياستنا. لا يوجد حقل «رقم هاتف» في أي نموذج على الموقع.',
  },
  {
    q: 'هل تجمعون رقم الكملك؟',
    a: 'لا، إطلاقاً. لا يوجد أي حقل لرقم الكملك في الموقع ولا نطلبه عبر أي نموذج عام. حتى أداة «فحص الكملك» تتحقّق من الرقم على جهازك محلياً ولا تُرسله إلينا.',
  },
  {
    q: 'هل تستقبلون صور وثائق؟',
    a: 'لا عبر الموقع — لا يوجد رفع ملفات في نموذج الطلب. أي وثيقة تشاركها تكون داخل محادثة واتساب بمبادرتك أنت وبعد الاتفاق فقط. لا ترسل أي صورة وثيقة قبل التواصل والتأكّد.',
  },
  {
    q: 'أين تُخزَّن الطلبات؟',
    a: 'لا تُخزَّن لدينا أصلاً. نموذج الطلب يفتح واتساب برسالة جاهزة على جهازك؛ لا نحتفظ بأي نسخة على خوادمنا. قاعدة بياناتنا (لدى Supabase) تخزّن فقط الحساب والتعليقات والاشتراكات إن استخدمتها بنفسك.',
  },
  {
    q: 'من يستطيع الوصول إلى بياناتي؟',
    a: 'محادثة واتساب: أنت وفريقنا فقط (بتشفير واتساب). الحساب والاشتراكات وبلاغات الأحياء: فريق إدارة دليل العرب فقط، ولأغراض التشغيل والدعم لا غير. تعليقاتك العامة: مرئية للجميع لأنك نشرتها علناً. لا معلنين ولا وسطاء بيانات ولا بيع لبياناتك.',
  },
  {
    q: 'كم مدة الاحتفاظ بها؟',
    a: 'الطلبات: صفر — لا تُخزَّن. الحساب والتعليقات والنشرة البريدية: تبقى ما دام حسابك/اشتراكك قائماً وتُحذف فور طلبك. اشتراك الإشعارات المعطّل: يُحذف تلقائياً. نحتفظ بالحد الأدنى وللمدة اللازمة للغرض فقط.',
  },
  {
    q: 'كيف أطلب حذف بياناتي؟',
    a: 'راسلنا عبر صفحة التواصل واطلب الحذف — ننفّذه دون شروط ودون إبطاء: حسابك، تعليقاتك، أو بريدك في النشرة. طلبات واتساب لا تحتاج حذفاً لأنها ليست مخزّنة عندنا.',
  },
  {
    q: 'هل تستخدمون واتساب أو أطراف ثالثة؟',
    a: 'نعم بشفافية: واتساب (لاستقبال الطلبات — يخضع لسياسته)، Supabase (قاعدة البيانات)، Cloudflare (الاستضافة والحماية، وقد تعالج عنوان IP تقنياً)، وغوغل (لتسجيل الدخول الاختياري وإحصاءات مجمّعة لا تحدّد هويتك). لا نستخدم أي أدوات تتبّع إعلانية.',
  },
  {
    q: 'ما البيانات التي لا يجب إرسالها إلا عند الضرورة؟',
    a: 'لا ترسل أبداً عبر نماذج عامة أو لأي شخص قبل التأكّد: رقم الكملك الكامل، صور جواز السفر أو الإقامة أو الهوية، بياناتك البنكية، أو كلمات المرور. شاركها فقط داخل واتساب وبعد اتفاق صريح ولمن تأكّدت أنه رقمنا الرسمي — ونحن لا نطلب أياً منها عبر الموقع.',
  },
];

export const metadata: Metadata = {
  title: 'سياسة الخصوصية',
  description: 'ما البيانات التي يجمعها موقع دليل العرب فعلياً، أين تُخزَّن، ما الذي لا نطلبه أبداً، وكيف تطلب حذف بياناتك.',
  alternates: { canonical: '/privacy' },
};

// Static legal page — every statement here reflects how the site actually
// works in code (request form goes to WhatsApp and is not stored, push
// subscriptions are anonymous, accounts are optional, etc.). Keep this file
// in sync with reality when features change.

const SECTIONS = [
  {
    icon: ShieldCheck,
    title: 'المبدأ العام',
    body: (
      <p>
        الموقع منصة معلومات وإرشاد، ولا يتطلب تصفّحه إنشاء أي حساب أو تقديم أي بيانات شخصية.
        نجمع أقل قدر ممكن من البيانات، وفقط عندما ترسلها أنت بنفسك لغرض واضح.
      </p>
    ),
  },
  {
    icon: HelpCircle,
    title: 'أسئلة صريحة عن بياناتك — إجابات مباشرة',
    body: (
      <dl className="space-y-2.5">
        {PRIVACY_FAQ.map((f) => (
          <div key={f.q} className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-3.5">
            <dt className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">{f.q}</dt>
            <dd className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{f.a}</dd>
          </div>
        ))}
      </dl>
    ),
  },
  {
    icon: MessageCircle,
    title: 'طلبات الخدمة — لا تُخزَّن لدينا',
    body: (
      <p>
        نموذج «طلب خدمة» لا يحفظ بياناتك على خوادمنا إطلاقاً: عند الضغط على «إرسال» يفتح تطبيق
        واتساب على جهازك برسالة جاهزة، والتواصل يجري هناك مباشرة. ما تكتبه في النموذج يبقى على
        جهازك حتى ترسله أنت عبر واتساب، وتخضع تلك المحادثة لسياسة خصوصية واتساب.
        لا نطلب أي دفعة مسبقة عبر النموذج، ولا نطلب صور وثائقك قبل التواصل والاتفاق.
      </p>
    ),
  },
  {
    icon: UserRound,
    title: 'الحساب الاختياري',
    body: (
      <p>
        إن اخترت تسجيل الدخول (عبر حساب غوغل)، نخزّن بريدك الإلكتروني واسم العرض لتشغيل ميزات
        حسابك: لوحة التحكم، الإشعارات الشخصية، والتعليقات. التسجيل اختياري بالكامل، وكل محتوى
        الموقع متاح بدونه.
      </p>
    ),
  },
  {
    icon: Bell,
    title: 'إشعارات المتصفح (Push)',
    body: (
      <p>
        عند تفعيل الإشعارات يخزَّن «اشتراك المتصفح» فقط — وهو عنوان تقني مشفَّر يصدره متصفحك —
        دون اسم أو بريد أو أي هوية. إلغاء الاشتراك متاح في أي وقت من إعدادات المتصفح نفسه،
        وتُحذف الاشتراكات المعطّلة تلقائياً.
      </p>
    ),
  },
  {
    icon: Database,
    title: 'ما الذي يُخزَّن فعلاً، وأين',
    body: (
      <ul className="list-disc ps-5 space-y-2">
        <li>التعليقات والأسئلة التي تنشرها بحسابك، وتقييمات «هل أفادك المقال؟» (مجهولة الهوية).</li>
        <li>بلاغات حالة الأحياء في أداة المناطق، والبريد الإلكتروني إن اشتركت بالنشرة.</li>
        <li>تفضيلات واجهة بسيطة (الوضع الليلي، آخر الأخبار المقروءة) في التخزين المحلي لمتصفحك — لا تغادر جهازك.</li>
        <li>تُستضاف قاعدة البيانات لدى Supabase والموقع لدى Cloudflare، وقد تعالج Cloudflare عناوين IP تقنياً لأغراض الحماية من الهجمات وإحصاءات مجمّعة لا تحدد هويتك.</li>
        <li>لا نستخدم أدوات تتبّع إعلانية، ولا نبيع أو نشارك أي بيانات مع أي جهة تجارية.</li>
      </ul>
    ),
  },
  {
    icon: Users,
    title: 'من يستطيع الوصول إلى بياناتك',
    body: (
      <ul className="list-disc ps-5 space-y-2">
        <li><strong>محادثة واتساب</strong>: يراها أنت وفريقنا فقط، وتخضع لتشفير واتساب من طرف إلى طرف.</li>
        <li><strong>حسابك ونشرتك البريدية وبلاغات الأحياء</strong>: لا يطّلع عليها إلا فريق تحرير وإدارة دليل العرب، وفقط لأغراض التشغيل والإشراف والدعم — لا أكثر.</li>
        <li><strong>تعليقاتك وأسئلتك العامة</strong>: مرئية للجميع بطبيعتها لأنك نشرتها علناً على الموقع.</li>
        <li><strong>مزوّدو الاستضافة</strong> (Supabase لقاعدة البيانات، Cloudflare للموقع) يعالجون البيانات تقنياً بصفتهم منفّذين لخدمتنا وضمن سياساتهم، لا لاستخدامهم الخاص.</li>
        <li><strong>لا نمنح أي وصول</strong> لمعلنين أو وسطاء بيانات أو أي جهة تجارية، ولا نبيع بياناتك إطلاقاً.</li>
      </ul>
    ),
  },
  {
    icon: Clock,
    title: 'مدة الاحتفاظ بالبيانات',
    body: (
      <ul className="list-disc ps-5 space-y-2">
        <li><strong>طلبات الخدمة</strong>: لا تُحفظ لدينا أصلاً — تذهب مباشرةً إلى واتساب، فلا مدة احتفاظ على خوادمنا.</li>
        <li><strong>الحساب والتعليقات والنشرة البريدية</strong>: تبقى ما دام حسابك/اشتراكك قائماً، وتُحذف فور طلبك ذلك أو حذفك لحسابك.</li>
        <li><strong>اشتراك الإشعارات</strong>: يبقى حتى تُلغيه من متصفحك، وتُحذف الاشتراكات المعطّلة تلقائياً.</li>
        <li><strong>تفضيلات الواجهة</strong> (الوضع الليلي، آخر ما قرأت): على جهازك فقط حتى تمسح بيانات المتصفح.</li>
        <li>نحتفظ بالحد الأدنى وللمدة اللازمة للغرض فقط؛ ومتى زال الغرض أو طلبت الحذف، نحذف دون إبطاء.</li>
      </ul>
    ),
  },
  {
    icon: Trash2,
    title: 'حقوقك: الاطلاع والحذف',
    body: (
      <p>
        يمكنك في أي وقت طلب حذف حسابك أو تعليقاتك أو بريدك من النشرة — راسلنا عبر{' '}
        <Link href="/contact" className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline">صفحة التواصل</Link>{' '}
        وسننفّذ الطلب دون شروط. البيانات تبقى محفوظة حتى تطلب حذفها أو يُحذف الغرض الذي جُمعت له.
      </p>
    ),
  },
  {
    icon: AlertTriangle,
    title: 'ما لا نطلبه أبداً — احذر المنتحلين',
    body: (
      <p>
        لا نطلب أبداً: كلمات مرور، رقم الكملك الكامل عبر نماذج عامة، صور وثائق عبر الموقع، أو أي
        دفعة مالية قبل تواصل واتفاق صريح. أي شخص يراسلك مدّعياً أنه «دليل العرب» ويطلب ذلك فهو
        منتحل — تواصلنا الرسمي يجري حصراً عبر قنوات الموقع المعلنة.
      </p>
    ),
  },
  {
    icon: LinkIcon,
    title: 'الروابط الخارجية',
    body: (
      <p>
        نُحيل كثيراً إلى مواقع حكومية رسمية (مثل goc.gov.tr وe-Devlet) ومصادر خارجية. سياسات
        الخصوصية في تلك المواقع تخصّها هي، ولا نتحمل مسؤوليتها. راجع أيضاً{' '}
        <Link href="/disclaimer" className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline">إخلاء المسؤولية</Link>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PRIVACY_FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <main className="flex flex-col min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <PageHero
        title="سياسة الخصوصية"
        description="بوضوح وبلا تعقيد: ما الذي نجمعه فعلاً، وما الذي لا نطلبه أبداً، وكيف تحذف بياناتك."
      />

      <div className="max-w-4xl mx-auto px-4 pt-8 pb-12 space-y-4 text-slate-700 dark:text-slate-200 leading-relaxed w-full">
        {SECTIONS.map((s) => (
          <section key={s.title} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="flex items-center gap-2.5 text-lg font-bold text-slate-900 dark:text-slate-50 mb-3">
              <span className="grid place-items-center w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300 shrink-0">
                <s.icon size={16} />
              </span>
              {s.title}
            </h2>
            <div className="text-sm sm:text-[15px]">{s.body}</div>
          </section>
        ))}

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 pt-4">
          آخر تحديث لسياسة الخصوصية: يوليو 2026 — تُحدَّث هذه الصفحة كلما تغيّرت طريقة تعاملنا مع البيانات.
        </p>
      </div>
    </main>
  );
}
