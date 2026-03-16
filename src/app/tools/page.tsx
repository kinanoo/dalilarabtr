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
  Sparkles,
  CheckCircle,
  Wrench
} from 'lucide-react';

// =====================================================
// 📊 Metadata للصفحة
// =====================================================

export const metadata: Metadata = {
  title: 'أدوات مجانية للأجانب في تركيا | دليل العرب في تركيا',
  description: 'مجموعة أدوات مجانية لمساعدة الأجانب في تركيا: حاسبة مدة الحظر، فاحص الأكواد الأمنية، المناطق المحظورة، المستشار القانوني الذكي، والمزيد.',
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
    title: 'المستشار القانوني الذكي',
    description: 'حلل وضعك القانوني في تركيا واحصل على توصيات مخصصة',
    icon: BrainCircuit,
    href: '/consultant',
    color: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    badge: 'الأكثر استخداماً',
    features: ['تحليل شامل', 'توصيات مخصصة', 'مجاني 100%']
  },
  {
    id: 'ban-calculator',
    title: 'حاسبة مدة الحظر',
    description: 'احسب متى يُرفع الحظر عنك بناءً على نوع المخالفة',
    icon: Calculator,
    href: '/ban-calculator',
    color: 'from-blue-500 to-indigo-600',
    bgLight: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    badge: null,
    features: ['حساب دقيق', 'كل أنواع الحظر', 'نتيجة فورية']
  },
  {
    id: 'security-codes',
    title: 'فاحص الأكواد الأمنية',
    description: 'اعرف معنى الكود الأمني وسبب الرفض أو المنع',
    icon: ShieldAlert,
    href: '/codes',
    color: 'from-rose-500 to-red-600',
    bgLight: 'bg-rose-50 dark:bg-rose-950/30',
    borderColor: 'border-rose-200 dark:border-rose-800',
    badge: null,
    features: ['V-87, G-87, N-82', 'شرح مفصل', 'حلول مقترحة']
  },
  {
    id: 'restricted-areas',
    title: 'فاحص المناطق المحظورة',
    description: 'تحقق إذا كانت المنطقة مفتوحة لتسجيل الأجانب',
    icon: MapPin,
    href: '/zones',
    color: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    badge: 'محدّث',
    features: ['كل الولايات', 'بحث سريع', 'بيانات رسمية']
  },
  {
    id: 'kimlik-checker',
    title: 'فاحص صلاحية الكملك',
    description: 'تحقق من حالة بطاقة الإقامة (الكملك)',
    icon: CreditCard,
    href: '/tools/kimlik-check',
    color: 'from-purple-500 to-violet-600',
    bgLight: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    badge: null,
    features: ['تحقق فوري', 'حالة الإقامة', 'تنبيهات']
  },
  {
    id: 'dictionary',
    title: 'القاموس القانوني',
    description: 'ترجمة المصطلحات التركية القانونية والإدارية',
    icon: BookOpen,
    href: '/dictionary',
    color: 'from-cyan-500 to-sky-600',
    bgLight: 'bg-cyan-50 dark:bg-cyan-950/30',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    badge: null,
    features: ['مصطلحات قانونية', 'شرح مفصل', 'أمثلة']
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
// 🎨 مكون بطاقة الأداة
// =====================================================

function ToolCard({ tool }: { tool: typeof TOOLS[0] }) {
  const Icon = tool.icon;
  const isComingSoon = tool.badge === 'قريباً';

  return (
    <div className={`relative group ${isComingSoon ? 'opacity-70' : ''}`}>
      {/* البادج */}
      {tool.badge && (
        <div className={`absolute -top-3 right-4 z-10 px-3 py-1 rounded-full text-xs font-bold ${tool.badge === 'قريباً'
          ? 'bg-slate-500 text-white'
          : tool.badge === 'الأكثر استخداماً'
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
          }`}>
          {tool.badge === 'الأكثر استخداماً' && <Sparkles size={12} className="inline ml-1" />}
          {tool.badge}
        </div>
      )}

      {isComingSoon ? (
        <div className={`h-full ${tool.bgLight} border ${tool.borderColor} rounded-2xl p-6 cursor-not-allowed`}>
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 opacity-50`}>
            <Icon size={28} className="text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{tool.title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{tool.description}</p>
        </div>
      ) : (
        <Link
          href={tool.href}
          className={`block h-full ${tool.bgLight} border ${tool.borderColor} rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
        >
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon size={28} className="text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-emerald-600 transition-colors">
            {tool.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{tool.description}</p>

          {/* المميزات */}
          <ul className="space-y-1 mb-4">
            {tool.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <CheckCircle size={12} className="text-emerald-500" />
                {feature}
              </li>
            ))}
          </ul>

          <div className="flex items-center text-sm font-bold text-emerald-600 group-hover:gap-3 gap-2 transition-all">
            استخدم الأداة <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          </div>
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
          text="مجموعة أدوات مجانية لمساعدة الأجانب في تركيا: حاسبة الحظر، فاحص الكملك، المستشار القانوني والمزيد."
          url={`${SITE_CONFIG.siteUrl}/tools`}
          variant="subtle"
        />
      </div>

      <section className="px-4 py-10 flex-grow">
        <div className="max-w-6xl mx-auto">

          {/* شريط المعلومات */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 mb-8 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
              <Sparkles className="text-emerald-600" size={24} />
            </div>
            <div>
              <h2 className="font-bold text-emerald-900 dark:text-emerald-100">جميع الأدوات مجانية 100%</h2>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">استخدم أي أداة بدون تسجيل أو اشتراك. نتائج فورية ودقيقة.</p>
            </div>
          </div>

          {/* شبكة الأدوات */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
