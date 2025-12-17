/**
 * 🔧 مكون Schema.org للأدوات
 * ============================
 * 
 * يضيف بيانات منظمة لمحركات البحث لتتعرف على أدوات الموقع
 * 
 * 📁 ضع هذا الملف في: src/components/ToolSchema.tsx
 * 
 * 🔧 الاستخدام:
 *    import ToolSchema from '@/components/ToolSchema';
 *    <ToolSchema tool="ban-calculator" />
 */

import { SITE_CONFIG } from '@/lib/data';

type ToolType = 
  | 'ban-calculator' 
  | 'security-codes' 
  | 'restricted-areas' 
  | 'consultant'
  | 'kimlik-checker'
  | 'dictionary';

interface ToolData {
  name: string;
  description: string;
  url: string;
  category: string;
  keywords: string[];
  faqs: Array<{ question: string; answer: string }>;
}

const TOOLS_DATA: Record<ToolType, ToolData> = {
  'ban-calculator': {
    name: 'حاسبة مدة الحظر من تركيا',
    description: 'أداة مجانية لحساب مدة الحظر من دخول تركيا بناءً على نوع المخالفة وتاريخ الترحيل. احسب متى يُرفع المنع عنك.',
    url: '/ban-calculator',
    category: 'UtilityApplication',
    keywords: ['حاسبة الحظر', 'مدة المنع من تركيا', 'الترحيل من تركيا', 'رفع الحظر', 'V-87', 'حظر الدخول'],
    faqs: [
      {
        question: 'كيف أعرف مدة الحظر من تركيا؟',
        answer: 'استخدم حاسبة مدة الحظر المجانية، أدخل تاريخ الترحيل ونوع المخالفة وستحصل على التاريخ المتوقع لرفع الحظر.'
      },
      {
        question: 'ما هي أنواع الحظر من تركيا؟',
        answer: 'هناك عدة أنواع: حظر 1 سنة (تجاوز الإقامة البسيط)، حظر 2 سنة (مخالفات متوسطة)، حظر 5 سنوات (ترحيل قسري)، وحظر دائم (جرائم خطيرة).'
      },
      {
        question: 'هل يمكن إلغاء الحظر قبل انتهاء مدته؟',
        answer: 'نعم، في بعض الحالات يمكن التقدم بطلب رفع الحظر مبكراً عبر المحكمة الإدارية أو من خلال محامٍ متخصص.'
      }
    ]
  },
  'security-codes': {
    name: 'فاحص الأكواد الأمنية التركية',
    description: 'أداة للتعرف على معاني الأكواد الأمنية في تركيا مثل V-87, G-87, N-82 وغيرها. اعرف سبب رفض طلبك أو منعك من الدخول.',
    url: '/codes',
    category: 'UtilityApplication',
    keywords: ['أكواد أمنية تركيا', 'V-87', 'G-87', 'N-82', 'سبب الرفض', 'كود الترحيل', 'أكواد الهجرة'],
    faqs: [
      {
        question: 'ما معنى كود V-87 في تركيا؟',
        answer: 'كود V-87 يعني وجود قيد أمني أو منع دخول. عادة يُوضع بسبب تجاوز مدة الإقامة أو مخالفة قوانين الهجرة.'
      },
      {
        question: 'كيف أعرف سبب رفض دخولي لتركيا؟',
        answer: 'يمكنك استخدام فاحص الأكواد الأمنية لمعرفة معنى الكود المكتوب على ورقة الرفض، أو مراجعة إدارة الهجرة.'
      },
      {
        question: 'هل يمكن إزالة الكود الأمني؟',
        answer: 'نعم، حسب نوع الكود. بعض الأكواد تُزال تلقائياً بعد انتهاء المدة، وبعضها يتطلب إجراءات قانونية.'
      }
    ]
  },
  'restricted-areas': {
    name: 'فاحص المناطق المحظورة للأجانب في تركيا',
    description: 'أداة للتحقق من المناطق والأحياء المغلقة أمام تسجيل الأجانب في تركيا. ابحث قبل استئجار سكن جديد.',
    url: '/zones',
    category: 'UtilityApplication',
    keywords: ['مناطق محظورة تركيا', 'أحياء مغلقة', 'تسجيل النفوس', 'سكن الأجانب', 'Kapalı mahalle'],
    faqs: [
      {
        question: 'ما هي المناطق المحظورة على الأجانب في تركيا؟',
        answer: 'هي أحياء ومحلات لا يُسمح للأجانب بتسجيل عنوان سكن فيها بسبب ارتفاع نسبة الأجانب فيها عن الحد المسموح.'
      },
      {
        question: 'كيف أعرف إذا كانت المنطقة محظورة؟',
        answer: 'استخدم أداة فحص المناطق المحظورة، أدخل اسم الحي أو المنطقة وستعرف فوراً إذا كانت مفتوحة أم مغلقة.'
      },
      {
        question: 'ماذا أفعل إذا كان سكني في منطقة محظورة؟',
        answer: 'إذا كنت مسجلاً قبل إغلاق المنطقة، يمكنك البقاء والتجديد. لكن إذا انتقلت لمنطقة أخرى، لن تستطيع العودة للتسجيل فيها.'
      }
    ]
  },
  'consultant': {
    name: 'المستشار القانوني الذكي - تحليل وضعك في تركيا',
    description: 'أداة ذكية مجانية لتحليل وضعك القانوني في تركيا. أجب على أسئلة بسيطة واحصل على تشخيص شامل وتوصيات.',
    url: '/consultant',
    category: 'UtilityApplication',
    keywords: ['مستشار قانوني', 'وضع الإقامة', 'استشارة مجانية', 'تحليل قانوني', 'إقامة تركيا'],
    faqs: [
      {
        question: 'كيف يعمل المستشار القانوني الذكي؟',
        answer: 'تجيب على مجموعة أسئلة عن وضعك (نوع الإقامة، المدة، المخالفات...) ويعطيك النظام تحليلاً شاملاً مع توصيات قانونية.'
      },
      {
        question: 'هل المستشار الذكي مجاني؟',
        answer: 'نعم، الخدمة مجانية بالكامل. يمكنك استخدامها لتحليل وضعك ومعرفة خياراتك القانونية.'
      },
      {
        question: 'هل نتائج المستشار دقيقة؟',
        answer: 'النتائج استرشادية مبنية على القوانين التركية الحالية. للحالات المعقدة، ننصح بمراجعة محامٍ متخصص.'
      }
    ]
  },
  'kimlik-checker': {
    name: 'التحقق من صلاحية الكملك التركي',
    description: 'أداة للتحقق من حالة الكملك (بطاقة الإقامة) إذا كانت سارية أو منتهية أو ملغاة.',
    url: '/kimlik-checker',
    category: 'UtilityApplication',
    keywords: ['كملك', 'بطاقة الإقامة', 'صلاحية الكملك', 'إقامة تركيا', 'kimlik'],
    faqs: [
      {
        question: 'كيف أعرف إذا كان الكملك ساري؟',
        answer: 'يمكنك التحقق من خلال أداتنا أو من موقع e-Devlet الرسمي باستخدام رقم الكملك.'
      },
      {
        question: 'ماذا أفعل إذا انتهى الكملك؟',
        answer: 'يجب التقدم بطلب تجديد قبل انتهاء الصلاحية. إذا انتهى، قد تحتاج لدفع غرامة أو إعادة التقديم من جديد.'
      }
    ]
  },
  'dictionary': {
    name: 'القاموس التركي العربي للمصطلحات القانونية',
    description: 'قاموس شامل للمصطلحات القانونية والإدارية التركية مع الترجمة العربية والشرح المفصل.',
    url: '/dictionary',
    category: 'ReferenceApplication',
    keywords: ['قاموس تركي عربي', 'مصطلحات قانونية', 'ترجمة تركي', 'كلمات تركية'],
    faqs: [
      {
        question: 'ما المصطلحات المتوفرة في القاموس؟',
        answer: 'يشمل القاموس مصطلحات الإقامة، الهجرة، العمل، الصحة، التعليم، والمعاملات الحكومية في تركيا.'
      }
    ]
  }
};

interface ToolSchemaProps {
  tool: ToolType;
}

export default function ToolSchema({ tool }: ToolSchemaProps) {
  const data = TOOLS_DATA[tool];
  if (!data) return null;

  const baseUrl = SITE_CONFIG.siteUrl || 'https://daleel-arab.com';

  // Schema للأداة (WebApplication)
  const applicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': data.name,
    'description': data.description,
    'url': `${baseUrl}${data.url}`,
    'applicationCategory': data.category,
    'operatingSystem': 'Web Browser',
    'browserRequirements': 'Requires JavaScript',
    'inLanguage': 'ar',
    'isAccessibleForFree': true,
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'TRY'
    },
    'author': {
      '@type': 'Organization',
      'name': 'دليل العرب في تركيا',
      'url': baseUrl
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'دليل العرب في تركيا',
      'url': baseUrl
    },
    'keywords': data.keywords.join(', ')
  };

  // Schema للأسئلة الشائعة (FAQPage)
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': data.faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer
      }
    }))
  };

  // Schema للصفحة (WebPage)
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': data.name,
    'description': data.description,
    'url': `${baseUrl}${data.url}`,
    'inLanguage': 'ar',
    'isPartOf': {
      '@type': 'WebSite',
      'name': 'دليل العرب في تركيا',
      'url': baseUrl
    },
    'about': {
      '@type': 'Thing',
      'name': 'أدوات قانونية للأجانب في تركيا'
    },
    'audience': {
      '@type': 'Audience',
      'audienceType': 'العرب والأجانب المقيمين في تركيا'
    }
  };

  // Schema للـ BreadcrumbList
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'الرئيسية',
        'item': baseUrl
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'الأدوات',
        'item': `${baseUrl}/tools`
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': data.name,
        'item': `${baseUrl}${data.url}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}

// =====================================================
// 🎯 مكون للـ Meta Tags المحسنة
// =====================================================

interface ToolMetaProps {
  tool: ToolType;
}

export function getToolMetadata(tool: ToolType) {
  const data = TOOLS_DATA[tool];
  if (!data) return {};

  const baseUrl = 'https://daleel-arab.com';

  return {
    title: `${data.name} | دليل العرب في تركيا`,
    description: data.description,
    keywords: data.keywords.join(', '),
    openGraph: {
      title: data.name,
      description: data.description,
      url: `${baseUrl}${data.url}`,
      siteName: 'دليل العرب في تركيا',
      locale: 'ar_SA',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: data.name,
      description: data.description,
    },
    alternates: {
      canonical: `${baseUrl}${data.url}`,
    },
  };
}
