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

import { SITE_CONFIG } from '@/lib/config';

type ToolType =
  | 'ban-calculator'
  | 'cost-calculator'
  | 'security-codes'
  | 'restricted-areas'
  | 'consultant'
  | 'kimlik-checker'
  | 'dictionary'
  | 'pharmacy';

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
  'cost-calculator': {
    name: 'حاسبة تكاليف الإقامة في تركيا',
    description: 'أداة لحساب التكلفة التقريبية لاستخراج أو تجديد الإقامة في تركيا — الضريبة، التأمين الصحي، ورسوم البطاقة.',
    url: '/calculator',
    category: 'UtilityApplication',
    keywords: ['تكاليف الإقامة', 'رسوم الإقامة تركيا', 'ضريبة الإقامة', 'تأمين صحي', 'حاسبة الإقامة'],
    faqs: [
      {
        question: 'كم تكلفة استخراج الإقامة في تركيا؟',
        answer: 'التكلفة تشمل ضريبة الإقامة + التأمين الصحي (يختلف حسب العمر) + رسوم البطاقة. استخدم الحاسبة لمعرفة التكلفة التقريبية.'
      },
      {
        question: 'هل تختلف تكلفة التجديد عن أول مرة؟',
        answer: 'نعم، ضريبة التجديد عادة أقل من ضريبة الاستخراج لأول مرة.'
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
    name: 'فحص الكملك التركي — تأكد من صلاحية قيدك فوراً',
    description: 'أداة مجانية للتحقق من صحة رقم الكملك (TC Kimlik) خوارزمياً، مع رابط مباشر لموقع النفوس التركي الرسمي NVI لفحص صلاحية القيد.',
    url: '/tools/kimlik-check',
    category: 'UtilityApplication',
    keywords: ['فحص الكملك', 'التاكد من صلاحية الكملك', 'هل الكملك شغال', 'رابط فحص الكملك 99', 'التحقق من الكملك', 'صلاحية الكملك', 'TC Kimlik doğrulama', 'كيف اعرف الكملك شغال'],
    faqs: [
      {
        question: 'كيف أتأكد من صلاحية الكملك؟',
        answer: 'ادخل رقم الكملك المكون من 11 رقم في أداة الفحص المجانية للتحقق الخوارزمي الفوري. ثم استخدم الرابط المباشر لموقع النفوس التركي الرسمي (tckimlik.nvi.gov.tr) لمعرفة إن كان القيد فعّال أو مُبطل.'
      },
      {
        question: 'كيف أعرف الكملك شغال أو موقوف؟',
        answer: 'ادخل موقع النفوس التركي NVI وأدخل رقم الكملك واسمك وتاريخ ميلادك. إذا ظهرت بياناتك فالقيد فعّال. إذا ظهرت رسالة Kayıt Bulunamadı فالقيد مُبطل أو موقوف.'
      },
      {
        question: 'ما هو رابط فحص الكملك 99 للأجانب؟',
        answer: 'رابط فحص الكملك للأجانب (الذي يبدأ بـ 99) هو صفحة Yabancı Kimlik No Doğrulama على موقع tckimlik.nvi.gov.tr — وهو الموقع الرسمي لمديرية النفوس والمواطنة التركية.'
      },
      {
        question: 'ماذا أفعل إذا اكتشفت أن الكملك موقوف؟',
        answer: 'إذا كان القيد مُبطل، راجع أقرب مديرية هجرة (Göç İdaresi) مع جواز سفرك. قد يكون السبب تجاوز مدة الإقامة أو عدم تجديد الكملك في الموعد. بعض الحالات تحتاج مراجعة محامٍ متخصص.'
      },
      {
        question: 'هل فحص الكملك على هذا الموقع آمن؟',
        answer: 'نعم، أداتنا تتحقق فقط من صحة خوارزمية الرقم محلياً على جهازك دون إرسال أي بيانات لأي سيرفر. للتحقق من حالة القيد الفعلية، نوجهك للموقع الحكومي الرسمي مباشرة.'
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
  },
  'pharmacy': {
    name: 'الصيدلية المناوبة الآن — أقرب صيدلية مفتوحة في تركيا',
    description: 'اعرف أقرب صيدلية مناوبة مفتوحة الآن في منطقتك عبر رابط e-Devlet الرسمي المباشر. يغطي كل الولايات التركية الـ 81.',
    url: '/tools/pharmacy',
    category: 'MedicalApplication',
    keywords: ['الصيدلية المناوبة', 'صيدلية مناوبة', 'الصيدليات المناوبة', 'الصيدلية المناوبة في موقعي', 'صيدلية مناوبة اسطنبول', 'نوبتشي اجزاني', 'Nöbetçi Eczane', 'برنامج الصيدليات المناوبة في تركيا'],
    faqs: [
      {
        question: 'كيف أعرف الصيدلية المناوبة في موقعي الآن؟',
        answer: 'اضغط على رابط e-Devlet الرسمي في صفحتنا، ثم اختر الولاية (İl) والمنطقة (İlçe) وستظهر لك قائمة الصيدليات المناوبة المفتوحة حالياً مع العناوين وأرقام الهاتف.'
      },
      {
        question: 'هل خدمة الصيدلية المناوبة تغطي كل مدن تركيا؟',
        answer: 'نعم، الخدمة مرتبطة ببوابة الحكومة الإلكترونية e-Devlet وتغطي كافة الولايات التركية الـ 81 بما فيها إسطنبول، أنقرة، غازي عنتاب، مرسين، أنطاليا، بورصة وغيرها.'
      },
      {
        question: 'ما هي ساعات عمل الصيدلية المناوبة في تركيا؟',
        answer: 'الصيدلية المناوبة (Nöbetçi Eczane) تعمل على مدار الساعة 24/7 خلال فترة مناوبتها. يتم تغيير المناوبة يومياً، لذلك تحقق من القائمة المحدثة يومياً عبر e-Devlet.'
      },
      {
        question: 'هل أحتاج حساب e-Devlet لمعرفة الصيدلية المناوبة؟',
        answer: 'لا، خدمة البحث عن الصيدليات المناوبة متاحة للجميع بدون تسجيل دخول. فقط اضغط الرابط واختر منطقتك.'
      },
      {
        question: 'ما هي أرقام الطوارئ الصحية في تركيا؟',
        answer: 'رقم الطوارئ العامة 112 (Acil)، رقم خط الأدوية والتسمم 182، رقم الشرطة 155، رقم الإطفاء 110. جميعها تعمل على مدار الساعة ومجانية.'
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
