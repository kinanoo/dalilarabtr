/**
 * 🛠️ صفحة الأدوات الرئيسية
 * =========================
 *
 * 📁 ضع هذا الملف في: src/app/tools/page.tsx
 */

import { Metadata } from 'next';
import Link from 'next/link';

import PageHero from '@/components/PageHero';
import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG } from '@/lib/config';
import {
  Calculator,
  ShieldAlert,
  MapPin,
  BrainCircuit,
  CreditCard,
  BookOpen,
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  Wrench,
  Pill,
  Smartphone,
  CalendarClock,
  Wallet,
  Coins,
  Banknote,
  Home
} from 'lucide-react';
import Badge from '@/components/ui/Badge';

// =====================================================
// 📊 Metadata للصفحة
// =====================================================

export const metadata: Metadata = {
  title: 'أدوات مجانية للأجانب في تركيا',
  description: 'مجموعة أدوات مجانية لمساعدة الأجانب في تركيا: حاسبة مدة الحظر، فاحص الأكواد الأمنية، المناطق المحظورة، دليل المواقف، والمزيد.',
  keywords: 'أدوات تركيا, حاسبة الحظر, أكواد أمنية, مناطق محظورة, مستشار قانوني, كملك, إقامة تركيا',
  openGraph: {
    title: 'أدوات مجانية للأجانب في تركيا',
    description: 'حاسبات وأدوات ذكية لمساعدتك في فهم وضعك القانوني في تركيا',
    type: 'website',
  },
  alternates: { canonical: '/tools' },
};

// =====================================================
// 🎯 بيانات الأدوات
// =====================================================

const TOOLS = [
  {
    id: 'consultant',
    title: 'دليل المواقف',
    description: 'حدّد إجراءاتك القانونية في تركيا خطوة بخطوة حسب حالتك',
    icon: BrainCircuit,
    href: '/consultant',
    color: 'from-emerald-500 to-teal-600',
    badge: 'الأكثر استخداماً',
  },
  {
    id: 'currency-converter',
    title: 'أسعار الصرف ومحوّل العملات',
    description: 'سعر الدولار واليورو والريال والذهب والليرة السورية مقابل الليرة التركية اليوم، مع محوّل فوري',
    icon: Banknote,
    href: '/tools/currency',
    color: 'from-emerald-500 to-green-600',
    badge: 'جديد',
  },
  {
    id: 'salary-calculator',
    title: 'حاسبة الراتب الصافي والإجمالي',
    description: 'حوّل راتبك بين الإجمالي (Brüt) والصافي (Net) 2026 مع تفصيل كل الاقتطاعات',
    icon: Wallet,
    href: '/tools/salary-calculator',
    color: 'from-emerald-500 to-green-600',
    badge: 'جديد',
  },
  {
    id: 'severance-calculator',
    title: 'حاسبة تعويض نهاية الخدمة',
    description: 'احسب تعويض نهاية الخدمة (Kıdem) والإشعار (İhbar) 2026 حسب راتبك ومدة عملك',
    icon: Coins,
    href: '/tools/severance-calculator',
    color: 'from-amber-500 to-yellow-600',
    badge: 'جديد',
  },
  {
    id: 'rent-increase-calculator',
    title: 'حاسبة زيادة الإيجار القانونية',
    description: 'اعرف الحد الأقصى القانوني لزيادة إيجارك 2026 حسب متوسط TÜFE — واحمِ نفسك من الزيادات غير القانونية',
    icon: Home,
    href: '/tools/rent-increase-calculator',
    color: 'from-rose-500 to-pink-600',
    badge: 'جديد',
  },
  {
    id: 'ban-calculator',
    title: 'حاسبة مدة الحظر',
    description: 'احسب متى يُرفع الحظر عنك بناءً على نوع المخالفة',
    icon: Calculator,
    href: '/ban-calculator',
    color: 'from-blue-500 to-indigo-600',
    badge: null,
  },
  {
    id: 'security-codes',
    title: 'فاحص الأكواد الأمنية',
    description: 'اعرف معنى الكود الأمني وسبب الرفض أو المنع',
    icon: ShieldAlert,
    href: '/codes',
    color: 'from-rose-500 to-red-600',
    badge: null,
  },
  {
    id: 'restricted-areas',
    title: 'فاحص المناطق المحظورة',
    description: 'تحقق إذا كانت المنطقة مفتوحة لتسجيل الأجانب',
    icon: MapPin,
    href: '/zones',
    color: 'from-amber-500 to-orange-600',
    badge: 'محدّث',
  },
  {
    id: 'kimlik-checker',
    title: 'فاحص صلاحية الكملك',
    description: 'تحقق من حالة بطاقة الإقامة (الكملك)',
    icon: CreditCard,
    href: '/tools/kimlik-check',
    color: 'from-purple-500 to-violet-600',
    badge: null,
  },
  {
    id: 'residence-calculator',
    title: 'حاسبة أيام الإقامة والغياب',
    description: 'احسب أيام غيابك عن تركيا لمتابعة شرط الإقامة المتّصلة للجنسية والإقامة الدائمة',
    icon: CalendarClock,
    href: '/tools/residence-calculator',
    color: 'from-teal-500 to-emerald-600',
    badge: 'جديد',
  },
  {
    id: 'dictionary',
    title: 'القاموس القانوني',
    description: 'ترجمة المصطلحات التركية القانونية والإدارية',
    icon: BookOpen,
    href: '/dictionary',
    color: 'from-cyan-500 to-sky-600',
    badge: null,
  },
  {
    id: 'pharmacy',
    title: 'الصيدليات المناوبة',
    description: 'اعثر على أقرب صيدلية مناوبة (nöbetçi eczane) في مدينتك الآن',
    icon: Pill,
    href: '/tools/pharmacy',
    color: 'from-green-500 to-emerald-600',
    badge: null,
  },
  {
    id: 'edevlet',
    title: 'خدمات e-Devlet',
    description: 'روابط مباشرة لأهم خدمات الحكومة الإلكترونية التركية',
    icon: Smartphone,
    href: '/e-devlet-services',
    color: 'from-sky-500 to-blue-600',
    badge: null,
  },
];

// =====================================================
// 📊 Schema.org للصفحة
// =====================================================

function ToolsPageSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': 'أدوات مجانية للأجانب في تركيا',
    'description': 'مجموعة أدوات مجانية لمساعدة الأجانب في تركيا',
    'url': `${SITE_CONFIG.siteUrl}/tools`,
    'inLanguage': 'ar',
    'isPartOf': {
      '@type': 'WebSite',
      'name': SITE_CONFIG.name,
      'url': SITE_CONFIG.siteUrl,
    },
    'hasPart': TOOLS.filter(t => t.badge !== 'قريباً').map(tool => ({
      '@type': 'WebApplication',
      'name': tool.title,
      'description': tool.description,
      'url': `${SITE_CONFIG.siteUrl}${tool.href}`,
      'applicationCategory': 'UtilityApplication',
      'isAccessibleForFree': true
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// =====================================================
// 🎨 مكون بطاقة الأداة — صف مدمج قابل للمسح السريع (نمط /codes):
// أيقونة صغيرة بهوية الأداة اللونية + عنوان + سطر وصف، بدون شارات
// حشو أو زخارف دوّارة. البطاقة نفسها رابط، فلا حاجة لزر إضافي.
// =====================================================

function ToolCard({ tool }: { tool: typeof TOOLS[0] }) {
  const Icon = tool.icon;
  const isComingSoon = tool.badge === 'قريباً';

  const body = (
    <>
      <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shrink-0 ${isComingSoon ? 'opacity-50' : ''}`}>
        <Icon size={20} className="text-white" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
          {tool.title}
        </span>
        <span className="block text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mt-0.5">
          {tool.description}
        </span>
      </span>
    </>
  );

  return (
    <div className={`relative h-full ${isComingSoon ? 'opacity-70' : ''}`}>
      {/* البادج — مكوّن Badge الموحّد بألوان دلالية (نفس المعنى = نفس اللون
          عبر كل الموقع: "محدّث" أزرق دائماً، "الأكثر استخداماً" أخضر العلامة) */}
      {tool.badge && (
        <Badge
          tone={tool.badge === 'قريباً' ? 'neutral' : tool.badge === 'الأكثر استخداماً' ? 'brand' : 'updated'}
          className="absolute -top-3 end-4 z-10 shadow-sm"
        >
          {tool.badge}
        </Badge>
      )}

      {isComingSoon ? (
        <div className="h-full flex items-center gap-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 cursor-not-allowed">
          {body}
        </div>
      ) : (
        <Link
          href={tool.href}
          className="group h-full flex items-center gap-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-0.5 transition-all"
        >
          {body}
          <ChevronLeft size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 shrink-0 transition-colors" />
        </Link>
      )}
    </div>
  );
}

// =====================================================
// 📄 الصفحة الرئيسية
// =====================================================

export default function ToolsPage() {
  return (
    <main className="flex flex-col min-h-screen font-cairo">
      <ToolsPageSchema />

      <PageHero
        title="أدوات مجانية للأجانب"
        description="حاسبات وأدوات ذكية لمساعدتك في فهم وضعك القانوني في تركيا"
        icon={<Wrench className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      />

      <div className="flex justify-center -mt-4 mb-4">
        <ShareMenu
          title="أدوات مجانية للأجانب في تركيا"
          text="مجموعة أدوات مجانية لمساعدة الأجانب في تركيا: حاسبة الحظر، فاحص الكملك، دليل المواقف والمزيد."
          url={`${SITE_CONFIG.siteUrl}/tools`}
          variant="subtle"
        />
      </div>

      <section className="px-4 py-10 flex-grow">
        <div className="max-w-6xl mx-auto">

          {/* شريط المعلومات */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 mb-8 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="text-emerald-600" size={24} />
            </div>
            <div>
              <h2 className="font-bold text-emerald-900 dark:text-emerald-100">جميع الأدوات مجانية</h2>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">استخدمها بدون تسجيل أو اشتراك.</p>
            </div>
          </div>

          {/* شبكة الأدوات */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TOOLS.map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>

          {/* قسم المساعدة */}
          <div className="mt-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">لم تجد ما تبحث عنه؟</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">تواصل معنا وأخبرنا بالأداة التي تحتاجها</p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition"
            >
              تواصل معنا <ArrowLeft size={16} />
            </Link>
          </div>

        </div>
      </section>


    </main>
  );
}
