import type { ArticleData } from '../articles';

const TODAY = '2025-12-16';

type EDevletServiceArticle = {
  id: string;
  title: string;
  source: string;
  intro: string;
  details: string;
  documents: string[];
  steps: string[];
  tips: string[];
  fees: string;
  warning?: string;
};

const DEFAULT_DOCUMENTS = [
  'حساب e‑Devlet فعّال (شيفرة أو بنك أو طرق الدخول المتاحة).',
  'رقم الهوية (T.C.) أو رقم الأجنبي (YKN) حسب حالتك.',
  'رقم هاتف فعّال (قد تحتاجه للتحقق عبر SMS).',
];

const DEFAULT_TIPS = [
  'إذا لم تفتح الخدمة من المتصفح، جرّب تطبيق e‑Devlet ثم أعد المحاولة.',
  'إن ظهرت رسالة “لا تملك صلاحية”، فقد تكون الخدمة غير متاحة لنوع هويتك أو لولايتك.',
  'احتفظ بنسخة PDF/Barcode عند استخراج أي وثيقة رسمية.',
];

const DEFAULT_FEES = 'تظهر أي متطلبات أو رسوم (إن وُجدت) داخل صفحة الخدمة الرسمية.';

const DEFAULT_WARNING = 'لا تدخل أي بيانات شخصية إلا ضمن رابط حكومي رسمي.';

// ملاحظة: هذه القائمة مبنية على الروابط المُجربة التي زودنا بها المستخدم.
// أي خدمة لا يوجد لها رابط مؤكد تم حذفها من تبويب e‑Devlet.
const SERVICES: EDevletServiceArticle[] = [
  {
    id: 'edevlet_dogum_raporu',
    title: 'استخراج شهادة/تقرير ولادة في تركيا',
    source: 'https://www.turkiye.gov.tr/saglik-dogum-raporlari-sorgulama',
    intro: 'طريقة الوصول لتقارير/شهادات الولادة عبر بوابة e‑Devlet.',
    details:
      'تتيح هذه الخدمة عرض/تحميل تقارير الولادة المسجلة ضمن النظام الصحي التركي. عند توفر التقرير يمكنك تنزيله وحفظه كملف PDF/Barcode لاستخدامه في المعاملات التي تطلب إثبات الولادة.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'افتح الرابط الرسمي للخدمة ثم سجّل الدخول إلى e‑Devlet.',
      'اعرض قائمة تقارير الولادة (إن وُجدت) واختر التقرير المطلوب.',
      'قم بتحميل التقرير/الوثيقة واحفظها على جهازك.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_evlenme_ehliyet',
    title: 'استخراج ورقة أعزب/أهلية زواج عبر e‑Devlet',
    source: 'https://www.turkiye.gov.tr/goc-idaresi-evlenme-ehliyet-belgesi-basvurusu',
    intro: 'خطوات تقديم طلب “أهلية الزواج/العزوبية” إلكترونياً عبر e‑Devlet.',
    details:
      'الخدمة مخصصة لتقديم طلب أهلية الزواج إلكترونياً ثم متابعة الطلب وفق متطلبات البلدية التي ستُقدَّم لها الأوراق. غالباً ستحتاج لإدخال بيانات التواصل وتحديد البلدية، ثم تعبئة بيانات الطرف الآخر وإرفاق الوثائق المطلوبة داخل الطلب.',
    documents: [
      ...DEFAULT_DOCUMENTS,
      'بيانات الزوج/الزوجة (رقم الكملك/YKN، جواز السفر إن وجد، الاسم والكنية، تاريخ الميلاد، الجنسية).',
      'صورة واضحة لهوية/كملك الطرف الآخر عند الطلب.',
    ],
    steps: [
      'افتح الرابط الرسمي ثم سجّل الدخول إلى e‑Devlet.',
      'اضغط “طلب جديد” (Yeni Başvuru).',
      'أدخل البريد الإلكتروني ورقم الهاتف وحدد البلدية الأقرب لتقديم الأوراق.',
      'املأ بيانات الطرف الآخر وأرفق صورة الهوية/الكملك ثم تابع (Devam et).',
      'أكمل إرسال الطلب واحتفظ برقم/حالة الطلب للمتابعة.',
    ],
    tips: [
      'لا يمكن إتمام زواج مدني في تركيا لمن هو متزوج؛ القانون التركي يمنع تعدد الزوجات.',
      'لا يُقبل الزواج بالوكالة عادةً؛ يُطلب حضور الزوجين أثناء عقد القِران.',
      ...DEFAULT_TIPS,
    ],
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_nvi_yerlesim_yeri',
    title: 'استخراج سند إقامة (وثيقة سكن) في تركيا',
    source: 'https://www.turkiye.gov.tr/nvi-yerlesim-yeri-ve-diger-adres-belgesi-sorgulama',
    intro: 'شرح عملي لاستخراج سند الإقامة/العنوان (İkametgah) من e‑Devlet وطباعة الوثيقة.',
    details:
      'سند الإقامة يُطلب كثيراً في التسجيل المدرسي، معاملات الإقامة، تحديث البيانات، فتح حساب بنكي، تأسيس شركة، معاملات الجنسية، وغيرها. يمكنك استخراج الوثيقة وطباعتها مباشرةً من e‑Devlet بخطوات بسيطة.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'سجّل الدخول إلى e‑Devlet ثم ابحث عن “Adres bilgisi”.',
      'اختر خدمة: Yerleşim Yeri (İkametgah) ve Diğer Adres Belgesi Sorgulama.',
      'وافق على الشروط ثم اضغط Devam et.',
      'اختر نوع الوثيقة (شخصي/عائلي) ثم سبب الطلب والجهة المقدَّم لها.',
      'اطبع الوثيقة أو احفظها PDF وقدمها للجهة التي طلبتها.',
    ],
    tips: [
      'إذا ظهر أن العنوان غير محدث، قد تحتاج تحديث العنوان لدى النفوس/المختار حسب حالتك.',
      ...DEFAULT_TIPS,
    ],
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_operator_debt',
    title: 'الاستعلام عن اشتراكات/ديون المشغلات (هاتف/إنترنت/TV) باسمك',
    source: 'https://turkiye.gov.tr/btk-mobil-sabit-internet-kablo-tv-uydu-isletmecilerinden-borc-ve-alacak-sorgulama',
    intro: 'تعرف على الاشتراكات المسجلة باسمك (جوال/إنترنت/هاتف ثابت/TV) وتواريخها والديون إن وجدت.',
    details:
      'هذه من أكثر خدمات e‑Devlet استخداماً لأنها تُظهر اشتراكات المشغلين المسجلة باسمك، تاريخ بداية الاشتراك ونهايته، وقد تظهر مبالغ/متأخرات مرتبطة بخدمات الاتصالات.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'افتح الرابط الرسمي ثم سجّل الدخول إلى e‑Devlet.',
      'اعرض قائمة الاشتراكات/الخدمات المسجلة باسمك.',
      'راجع تواريخ الاشتراك وحالته، وأي مبالغ ظاهرة داخل الخدمة.',
      'إذا وجدت اشتراكاً لا يخصك أو ديناً غير مفهوم، تواصل مع المشغل واطلب توضيحاً وإجراء الإلغاء/التصحيح.',
    ],
    tips: [
      'افحص هذه الخدمة دوريًا لتجنب تسجيل خطوط/اشتراكات باسمك دون علمك.',
      ...DEFAULT_TIPS,
    ],
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_tuketici_sikayet',
    title: 'تقديم شكوى إلى هيئة حماية المستهلك',
    source: 'https://turkiye.gov.tr/tuketici-sikayeti-uygulamasi',
    intro: 'تقديم شكوى إلكترونية حول منتج/خدمة مع متابعة ملفك عبر بوابة e‑Devlet.',
    details:
      'تركيا تملك آليات متقدمة لحماية المستهلك. عبر هذه الخدمة يمكنك رفع شكوى حول المنتجات والخدمات وفتح ملف إلكتروني لمتابعة الإجراء دون مراجعة مكاتب متعددة.',
    documents: [
      ...DEFAULT_DOCUMENTS,
      'تفاصيل الشكوى (اسم الشركة/المنتج/التاريخ/المبلغ).',
      'إثباتات إن وُجدت (فاتورة/صور/مراسلات).',
    ],
    steps: [
      'سجّل الدخول إلى e‑Devlet عبر الرابط الرسمي.',
      'ابدأ شكوى جديدة ثم املأ البيانات المطلوبة.',
      'أرفق الإثباتات إن طُلبت ثم أرسل الشكوى.',
      'تابع حالة الشكوى من ملفك داخل e‑Devlet.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_cimer_basvuru',
    title: 'تقديم شكوى إلى رئاسة الجمهورية (منصة CİMER)',
    source: 'https://turkiye.gov.tr/cimer-basvuru-sorgulama',
    intro: 'تقديم بلاغ/طلب رسمي عبر CİMER ومتابعته إلكترونياً.',
    details:
      'يمكن عبر CİMER تقديم شكوى/طلب رسمي إلى رئاسة الجمهورية التركية. يتم إرسال الطلب بسرية، وعادةً تتم المراجعة والرد خلال مدة قد تصل إلى 30 يوم بحسب نوع الطلب.',
    documents: [
      ...DEFAULT_DOCUMENTS,
      'نص الشكوى/الطلب بشكل واضح ومحدد.',
      'مرفقات داعمة إن وُجدت (صور/وثائق).',
    ],
    steps: [
      'افتح رابط CİMER الرسمي ثم سجّل الدخول إلى e‑Devlet.',
      'أنشئ طلباً جديداً واكتب الشكوى/الطلب وحدد التفاصيل المطلوبة.',
      'أرفق المستندات إن لزم ثم أرسل الطلب.',
      'تابع حالة الطلب من نفس الصفحة حتى ظهور الرد.',
    ],
    tips: [
      'اكتب معلومات دقيقة وتجنب التعميم؛ كلما كان الطلب محدداً كانت المعالجة أسرع.',
      ...DEFAULT_TIPS,
    ],
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_aracimin_cekildigi_otopark_bilgisi_sorgulama',
    title: 'معرفة المرآب الذي أودعت فيه السيارات المحجوزة في تركيا',
    source: 'https://turkiye.gov.tr/egm-otopark-cekilmis-araclar?hizmet=Ekrani',
    intro: 'اعرف أين تم سحب سيارتك وما هو عنوان المرآب لإتمام إجراءات الاسترجاع.',
    details:
      'إذا تم سحب سيارتك بسبب الوقوف في مكان مخالف، تساعدك هذه الخدمة على معرفة المرآب الذي أُودعت فيه سيارتك وعنوانه، لتتمكن من الذهاب مباشرةً واستكمال إجراءات الاستلام.',
    documents: [
      ...DEFAULT_DOCUMENTS,
      'معلومات السيارة إن طُلبت داخل الخدمة (قد تختلف حسب الشاشة).',
    ],
    steps: [
      'افتح الرابط الرسمي ثم سجّل الدخول إلى e‑Devlet.',
      'اعرض نتيجة الخدمة لمعرفة المرآب وعنوانه.',
      'توجه للمرآب وفق العنوان واستكمل إجراءات الاسترجاع حسب المطلوب.',
    ],
    tips: [
      'قد تحتاج لتسديد رسوم السحب/المرآب حسب الحالة؛ تأكد من المتطلبات عند المرآب.',
      ...DEFAULT_TIPS,
    ],
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_sgk_kayit_belgesi',
    title: 'الحصول على وثيقة تسجيل/قيد في SGK',
    source: 'https://turkiye.gov.tr/sosyal-guvenlik-kayit-belgesi-sorgulama',
    intro: 'استخراج وثيقة رسمية فورية تثبت تسجيلك لدى التأمينات الاجتماعية التركية (SGK).',
    details:
      'تُستخدم وثيقة قيد SGK في معاملات متعددة لإثبات أنك مسجل/تعمل ضمن النظام. يمكنك استخراجها فوراً كوثيقة رسمية وطباعتها عند الحاجة.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'افتح الرابط الرسمي ثم سجّل الدخول.',
      'اطلب استخراج الوثيقة (إن كانت متاحة في حسابك).',
      'حمّل الوثيقة واحفظها/اطبعها.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_mhrs',
    title: 'حجز موعد بالمشافي التركية (MHRS)',
    source: 'https://turkiye.gov.tr/saglik-bakanligi-merkezi-hekim-randevu-sistemi',
    intro: 'حجز مواعيد المستشفيات الحكومية عبر الإنترنت دون انتظار طويل.',
    details:
      'عبر MHRS يمكنك اختيار المشفى والطبيب والموعد المتاح، ثم الذهاب في نفس الموعد لإجراء المعاينة. هذه الخدمة مرتبطة بحسابك وتُدار من داخل e‑Devlet.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'ادخل إلى رابط MHRS الرسمي وسجّل الدخول.',
      'اختر الولاية/المشفى/العيادة/الطبيب وفق المتاح.',
      'ثبت الموعد واحفظ تفاصيله.',
    ],
    tips: [
      'غيّر فلتر الولاية/المشفى إذا لم تجد موعداً قريباً.',
      ...DEFAULT_TIPS,
    ],
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_e_nabiz',
    title: 'الحصول على المعلومات الطبية الخاصة بك (e‑Nabız)',
    source: 'https://turkiye.gov.tr/saglik-bakanligi-e-nabiz-kisisel-saglik-sistemi',
    intro: 'عرض تقاريرك الطبية والتحاليل والوصفات والصور الشعاعية لك ولأفراد عائلتك.',
    details:
      'e‑Nabız منصة وزارة الصحة التركية التي تجمع تقاريرك وتحاليلك ووصفاتك وسجل زياراتك الطبية. يمكنك الوصول للمعلومات من منزلك دون مراجعة المشافي للحصول على النسخ.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'ادخل للرابط الرسمي وسجّل الدخول إلى e‑Devlet.',
      'افتح e‑Nabız واختر القسم المطلوب (تحاليل/تقارير/وصفات/صور).',
      'قم بعرض أو تحميل النتائج وفق المتاح.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_ikamet_kisisel_bilgi',
    title: 'الاستعلام عن معلومات الإقامة الخاصة بك',
    source: 'https://turkiye.gov.tr/goc-idaresi-ikamet-izni-kisisel-bilgi-sorgulama-sonuclari',
    intro: 'تحقق من حالة الإقامة وتاريخ الانتهاء ومعلومات التواصل المعتمدة.',
    details:
      'هذه الخدمة مخصصة للأجانب للاستعلام عن معلومات الإقامة الخاصة بهم: صلاحية الإقامة، تاريخ انتهاء الصلاحية، وبعض بيانات التواصل/التسجيل المعتمدة.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'افتح الرابط الرسمي ثم سجّل الدخول إلى e‑Devlet.',
      'اعرض بيانات الإقامة وحالة الصلاحية وتاريخ الانتهاء.',
      'احفظ المعلومات أو التقط صورة للشاشة عند الحاجة.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_surucu_basvuru_durum',
    title: 'الاستعلام عن طلب استخراج/تعديل شهادة القيادة التركية',
    source: 'https://turkiye.gov.tr/nvi-surucu-belgesi-basvuru-durum-sorgu',
    intro: 'تعرف على آخر حالة وصل إليها طلب رخصة القيادة التركية أو تعديلها.',
    details:
      'إذا قدمت طلب استخراج رخصة قيادة تركية أو تعديل بياناتها، تساعدك هذه الخدمة على متابعة حالة الطلب إلكترونياً ومعرفة المرحلة الحالية.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'افتح الرابط الرسمي وسجّل الدخول.',
      'اعرض حالة الطلب وتفاصيل المرحلة الحالية.',
      'إذا طُلب إجراء إضافي، اتبع التعليمات الظاهرة داخل الخدمة.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_aile_hekim_bilgisi_sorgulama',
    title: 'الحصول على معلومات طبيب العائلة في تركيا',
    source: 'https://turkiye.gov.tr/aile-hekim-bilgisi',
    intro: 'اعرف طبيب العائلة المخصص لك ولعائلتك ومعلومات المركز الصحي.',
    details:
      'تتيح هذه الخدمة معرفة الطبيب/المركز الصحي المخصص لك. الخدمة متاحة للمواطنين والمقيمين بحسب التغطية والبيانات المسجلة في النظام الصحي.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'افتح الرابط الرسمي وسجّل الدخول.',
      'اعرض بيانات طبيب العائلة والمركز الصحي.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_adli_sicil_kaydi',
    title: 'استخراج وثيقة لا حكم عليه (خلو السوابق) في تركيا',
    source: 'https://turkiye.gov.tr/adli-sicil-kaydi',
    intro: 'استخراج شهادة خلو السوابق وتحديد الجهة والسبب ثم تحميل الوثيقة فوراً.',
    details:
      'تُطلب “وثيقة لا حكم عليه” في معاملات متعددة (مدارس/جامعات/مرور/زواج…). داخل الخدمة ستحدد الجهة المقدَّم لها (رسمية/خاصة/أجنبية) والسبب، ثم يمكنك تنزيل الوثيقة وطباعتها.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'ادخل للرابط الرسمي وسجّل الدخول.',
      'اختر الجهة التي ستقدم لها الوثيقة والسبب، ثم أدخل اسم الجهة إن طُلب.',
      'اضغط “Sorgula” لعرض الوثيقة.',
      'حمّل الوثيقة (İndir) واحتفظ بها/اطبعها.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_nvi_nufus_kayit_ornegi',
    title: 'الحصول على بيان/سجل عائلي (لحاملي الجنسية التركية)',
    source: 'https://turkiye.gov.tr/nvi-nufus-kayit-ornegi-belgesi-sorgulama',
    intro: 'استخراج وثيقة/سند قيد عائلي عبر e‑Devlet (غالباً لحاملي الجنسية التركية).',
    details:
      'يعرض سند القيد العائلي أسماء أفراد العائلة وبياناتهم. غالباً ما تطلبه جهات رسمية في معاملات مثل الزواج والطلاق وغيرها. توفر الخدمة يعتمد على نوع هويتك وصلاحيات الحساب.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'ادخل للرابط الرسمي وسجّل الدخول.',
      'اطلب استخراج الوثيقة ثم حمّلها واحتفظ بها.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_adres_degisikligi_bildirimi',
    title: 'تغيير عنوان السكن (لحاملي الجنسية التركية)',
    source: 'https://turkiye.gov.tr/adres-degisikligi-bildirimi',
    intro: 'تثبيت/تحديث عنوان السكن إلكترونياً (قد يتطلب تحقق إضافي حسب الحساب).',
    details:
      'هذه الخدمة مخصصة لتحديث العنوان إلكترونياً دون مراجعة النفوس في بعض الحالات. قد يتطلب التحقق بالتوقيع الإلكتروني أو رمز SMS حسب طريقة الدخول وتحقق الهوية.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'افتح الرابط الرسمي وسجّل الدخول.',
      'أدخل معلومات العنوان الجديد وتابع خطوات التحقق حسب ما يظهر لك.',
      'أرسل الطلب واحتفظ بتأكيد العملية إن ظهر.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_tapu_harc',
    title: 'دفع/الاستعلام عن رسوم نقل الملكية عند شراء عقار',
    source: 'https://turkiye.gov.tr/tapu-harc-sorgulama',
    intro: 'الاستعلام عن رسوم الطابو (Tapu Harcı) وسدادها عند توفر متطلبات الدفع.',
    details:
      'عند شراء عقار قد تُطلب رسوم نقل الملكية. عبر الخدمة يمكنك الاطلاع على الرسوم وإتمام الدفع عندما تظهر لك بيانات الدفع والمتطلبات ضمن الصفحة الرسمية.',
    documents: [
      ...DEFAULT_DOCUMENTS,
      'قد تحتاج رقم/مرجع دفع (e‑Tahsilat) إن طُلب ضمن المعاملة.',
    ],
    steps: [
      'افتح الرابط الرسمي وسجّل الدخول.',
      'اعرض الرسوم/البيانات ثم اتبع خطوات الدفع إن كانت متاحة.',
      'احتفظ بإيصال الدفع إن تم السداد.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_webtapu',
    title: 'الدخول إلى نظام WebTapu لإدارة معاملات العقارات',
    source: 'https://turkiye.gov.tr/tkgm-web-tapu',
    intro: 'الوصول إلى WebTapu لإدارة معاملات وبيانات العقارات إلكترونياً.',
    details:
      'يتيح WebTapu إدارة معاملات مرتبطة بالعقارات المسجلة باسمك (بيع/حجز/رهن/إجراءات متنوعة) وفق صلاحيات الحساب. بعض الإجراءات تحتاج موافقات أو مستندات إضافية تظهر داخل النظام.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'افتح رابط WebTapu الرسمي وسجّل الدخول.',
      'اختر الخدمة المطلوبة داخل WebTapu واتبع التعليمات.',
      'احتفظ بأي إيصالات/مخرجات رسمية تصدرها المنصة.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_tapu_telefon_beyan',
    title: 'تسجيل رقم هاتفك لدى مديرية السجلات العقارية',
    source: 'https://turkiye.gov.tr/tapu-telefon-beyan',
    intro: 'تحديث/تسجيل رقم الهاتف المرتبط بسجلات الطابو لتلقي الإشعارات والتواصل الرسمي.',
    details:
      'تسجيل رقم الهاتف يساعد الجهات الرسمية على التواصل مع صاحب العقار وإبلاغه بالتغييرات أو المتطلبات المتعلقة بالعقار عند الحاجة.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'افتح الرابط الرسمي وسجّل الدخول.',
      'أدخل رقم الهاتف وبيانات التحقق المطلوبة ثم احفظ الطلب.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_adima_tescilli_arac',
    title: 'الاستعلام عن عدد السيارات المسجلة باسمك',
    source: 'https://turkiye.gov.tr/emniyet-adima-tescilli-arac-sorgulama?hizmet=ekrani',
    intro: 'عرض المركبات/عددها المسجل باسمك وفق بيانات مديرية الأمن.',
    details:
      'تساعدك الخدمة على معرفة المركبات المسجلة باسمك، وهو مفيد للتحقق وتجنب أي تسجيل غير صحيح.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'افتح الرابط الرسمي وسجّل الدخول.',
      'اعرض النتائج وتحقق من أي مركبة لا تعرفها.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_yol_izin',
    title: 'استخراج إذن السفر (Yol İzin) للاجئين/حسب نوع الحساب',
    source: 'https://www.turkiye.gov.tr/goc-idaresi-yol-izin-belge-basvurusu',
    intro: 'تقديم طلب إذن السفر بين الولايات إلكترونياً مع تتبع الرد عبر البريد/الحساب.',
    details:
      'إذن السفر تصريح رسمي يسمح بالسفر بين الولايات في حالات معينة (خصوصاً ضمن بعض أوضاع الحماية/الإقامة). داخل الطلب ستحدد سبب السفر والولاية وتواريخ الذهاب والعودة وقد تُطلب مرفقات تثبت السبب.',
    documents: [
      ...DEFAULT_DOCUMENTS,
      'تفاصيل السفر (سبب السفر، الولاية، تاريخ الذهاب والعودة).',
      'مرفقات تثبت سبب السفر إن طُلبت داخل الخدمة.',
    ],
    steps: [
      'سجّل الدخول إلى e‑Devlet وافتح الخدمة من الرابط الرسمي.',
      'اضغط “Yeni başvuru” (طلب جديد).',
      'حدد سبب السفر والولاية والتواريخ وأدخل البريد الإلكتروني ولوحة السيارة إن وُجدت.',
      'أضف المرافقين والمرفقات المطلوبة ثم أرسل الطلب.',
      'تابع الرد داخل الخدمة/البريد الإلكتروني حسب ما يظهر لك.',
    ],
    tips: [
      'إذا تم رفض الطلب أكثر من مرة، قد تحتاج مراجعة الجهة المختصة في ولايتك لمعرفة السبب.',
      ...DEFAULT_TIPS,
    ],
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_imei_sorgulama',
    title: 'التحقق من الرقم التسلسلي IMEI لجهاز جوال',
    source: 'https://www.turkiye.gov.tr/imei-sorgulama',
    intro: 'تحقق من معلومات/حالة جهازك عبر إدخال رقم IMEI (15 رقم).',
    details:
      'يمكن عبر IMEI الاستعلام عن معلومات مرتبطة بجهاز الهاتف. أدخل رقم IMEI (من *#06#) داخل الخدمة لعرض النتائج المتاحة.',
    documents: [
      ...DEFAULT_DOCUMENTS,
      'رقم IMEI (15 خانة).',
    ],
    steps: [
      'افتح الرابط الرسمي وسجّل الدخول.',
      'أدخل رقم IMEI ثم نفّذ الاستعلام.',
      'راجع النتائج واحتفظ بها عند الحاجة.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_dava_dosyasi_sorgulama',
    title: 'التحقق من الدعاوى القضائية (Davalarım)',
    source: 'https://www.turkiye.gov.tr/davalarim',
    intro: 'عرض القضايا وتواريخ الجلسات والأحكام النهائية المرتبطة بك (إن وجدت).',
    details:
      'تمكنك الخدمة من الاستعلام عن قضاياك القانونية وتطوراتها. قد تختلف التفاصيل الظاهرة حسب نوع القضية والصلاحيات المتاحة في حسابك.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'افتح الرابط الرسمي وسجّل الدخول.',
      'اعرض القضايا وتفاصيلها المتاحة (جلسات/قرارات).',
    ],
    tips: [
      'لملفات التنفيذ (İcra) قد تكون هناك خدمات/بوابات أخرى متخصصة ضمن UYAP.',
      ...DEFAULT_TIPS,
    ],
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_vergi_borcu',
    title: 'الاستعلام عن المستحقات/الديون الضريبية الشخصية',
    source: 'https://www.turkiye.gov.tr/gib-vergi-borcu-sorgu',
    intro: 'اعرف الديون/المستحقات الضريبية المتراكمة وأي تأخير مرتبط بها.',
    details:
      'تعرض الخدمة المستحقات الضريبية المتوجبة عليك، وقد تُظهر الديون المتأخرة بسبب عدم السداد في الوقت المحدد حسب البيانات المسجلة.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'افتح الرابط الرسمي وسجّل الدخول.',
      'اعرض قائمة المستحقات/الديون وتفاصيلها.',
      'اتبع تعليمات الدفع إن ظهرت ضمن الصفحة الرسمية.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_mobil_hat_sorgulama',
    title: 'الاستعلام عن خطوط الجوال المسجلة باسمك',
    source: 'https://www.turkiye.gov.tr/mobil-hat-sorgulama',
    intro: 'تحقق من عدد الخطوط المسجلة باسمك لتجنب الاستعمال غير المشروع.',
    details:
      'فحص الخطوط المسجلة باسمك مهم لتجنب أي مساءلة قانونية إذا استُخدمت بياناتك لفتح خطوط دون علمك. الخدمة تعرض الخطوط المرتبطة بهويتك حسب النظام.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'افتح الرابط الرسمي وسجّل الدخول.',
      'راجع قائمة الخطوط المسجلة باسمك.',
      'إن وجدت خطاً غير معروف، تواصل مع المشغل فوراً لتصحيح الوضع.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_plaka_ceza',
    title: 'الاستعلام عن المخالفات المرورية على سيارتك',
    source: 'https://www.turkiye.gov.tr/emniyet-arac-plakasina-yazilan-ceza-sorgulama',
    intro: 'اعرف المخالفات المرورية المترتبة على سيارتك عبر e‑Devlet.',
    details:
      'تعرض الخدمة المخالفات المرورية المرتبطة بلوحة سيارتك وفق بيانات مديرية الأمن. يمكنك مراجعتها ومعرفة تفاصيلها ومبالغها حسب ما يظهر لك.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'افتح الرابط الرسمي وسجّل الدخول.',
      'اعرض المخالفات وتفاصيل كل مخالفة.',
      'اتبع تعليمات الدفع/الاعتراض إن كانت متاحة ضمن النظام.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_sgk_hizmet_dokumu',
    title: 'احتساب/عرض أيام الخدمة في SGK (4A)',
    source: 'https://www.turkiye.gov.tr/4a-hizmet-dokumu',
    intro: 'عرض مدة الخدمة المسجلة في التأمينات الاجتماعية (4A) وأيام العمل.',
    details:
      'تعرض الخدمة أيام العمل ومدة الخدمة المسجلة، وهي مفيدة لمتابعة وضعك التأميني وبيانات العمل (حسب تسجيلك في النظام).',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'افتح الرابط الرسمي وسجّل الدخول.',
      'اعرض كشف الخدمة وقم بتحميله إن كان متاحاً.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_borc_durumu_sorgulama',
    title: 'الاستعلام عن الديون المتراكمة في SGK لأصحاب الشركات (4B)',
    source: 'https://www.turkiye.gov.tr/4b-borc-durumu',
    intro: 'عرض ديون/مستحقات SGK المرتبطة بـ 4B (غالباً لأصحاب الأعمال/الشركات).',
    details:
      'تساعد الخدمة على معرفة الديون المتراكمة في SGK ضمن فئة 4B. تظهر التفاصيل حسب التسجيل والصلاحيات في حسابك.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'افتح الرابط الرسمي وسجّل الدخول.',
      'اعرض الديون/المستحقات وتفاصيلها.',
      'اتبع تعليمات السداد إن كانت متاحة ضمن النظام.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_sirketlerim',
    title: 'الاستعلام عن الشركات التي تملكها أو شريك فيها أو تملك صلاحياتها',
    source: 'https://www.turkiye.gov.tr/gtb-mersis-sahibi-ortagi-yetkilisi-oldugum-ticari-isletme-veya-sirketler',
    intro: 'اعرض الشركات/المنشآت التجارية المرتبطة بك ضمن نظام MERSİS.',
    details:
      'تعرض الخدمة الشركات التي أنت مالك/شريك/مخوّل فيها. مفيدة للتأكد من بياناتك التجارية وتوثيق علاقتك بالشركات عند الحاجة.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'افتح الرابط الرسمي وسجّل الدخول.',
      'اعرض قائمة الشركات المرتبطة بك وتفاصيل كل سجل حسب المتاح.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_doviz',
    title: 'الاستعلام عن أسعار صرف العملات',
    source: 'https://www.turkiye.gov.tr/doviz-kurlari',
    intro: 'عرض أسعار الصرف الرسمية اليومية للعملات عبر بوابة الحكومة.',
    details:
      'تعرض الخدمة أسعار صرف العملات وفق البيانات الرسمية. يمكنك استخدامها كمرجع يومي لسعر البيع/الشراء حسب ما يظهر في الصفحة.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'افتح الرابط الرسمي وسجّل الدخول إن طُلب.',
      'اختر العملة المطلوبة وراجع السعر اليومي.',
    ],
    tips: [
      'أسعار الصرف تتغير يومياً؛ اعتمد تاريخ اليوم داخل الصفحة.',
      ...DEFAULT_TIPS,
    ],
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_surucu_ceza_nokta_belgesi',
    title: 'استخراج مستند رسمي بنقاط المخالفات المرورية',
    source: 'https://turkiye.gov.tr/emniyet-surucu-ceza-bilgisi-barkodlu-belge-sorgulama',
    intro: 'استخراج وثيقة رسمية (Barkodlu) بإجمالي نقاط المخالفات على رخصة القيادة.',
    details:
      'عدد نقاط رخصة القيادة التركية عادة 100 نقطة، وتُخصم نقاط عند ارتكاب مخالفات. تتيح هذه الخدمة استخراج وثيقة رسمية توضح نقاط المخالفات.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'افتح الرابط الرسمي وسجّل الدخول.',
      'اطلب الوثيقة ثم قم بتحميلها وطباعتها عند الحاجة.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_iski_su',
    title: 'فتح/إدارة خدمات ماء إسطنبول (İSKİ) عبر e‑Devlet',
    source: 'https://www.turkiye.gov.tr/istanbul-su-ve-kanalizasyon-idaresi',
    intro: 'الوصول لخدمات ماء إسطنبول عبر بوابة e‑Devlet حسب ما يتيحه حسابك.',
    details:
      'تقدم بعض شركات الخدمات صفحات ضمن e‑Devlet لإدارة الاشتراك والطلبات/الفواتير وفق المنطقة. الخيارات المتاحة تظهر داخل الصفحة بعد تسجيل الدخول.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'افتح الرابط الرسمي وسجّل الدخول.',
      'اختر الخدمة المطلوبة (اشتراك/فواتير/طلبات) حسب المتاح.',
      'اتبع التعليمات الظاهرة داخل الصفحة لإتمام الإجراء.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
  {
    id: 'edevlet_ck_bogazici_elektrik',
    title: 'فتح/إدارة خدمات كهرباء CK Boğaziçi عبر e‑Devlet',
    source: 'https://www.turkiye.gov.tr/ck-bogazici-elektrik-perakende-satis-as',
    intro: 'الوصول لخدمات الكهرباء وإجراءات الاشتراك/الفواتير حسب المنطقة والمتاح في حسابك.',
    details:
      'تُظهر الصفحة الخدمات المتاحة للكهرباء ضمن e‑Devlet (تفعيل/إلغاء/فواتير/طلبات) حسب حسابك والمنطقة. اتبع التعليمات داخل الصفحة لإتمام الإجراء.',
    documents: DEFAULT_DOCUMENTS,
    steps: [
      'افتح الرابط الرسمي وسجّل الدخول.',
      'اختر الخدمة المطلوبة من القائمة داخل الصفحة.',
      'أكمل الطلب واحتفظ بأي إيصال/مرجع يظهر لك.',
    ],
    tips: DEFAULT_TIPS,
    fees: DEFAULT_FEES,
    warning: DEFAULT_WARNING,
  },
];

export const EDEVLET_ARTICLES: Record<string, ArticleData> = Object.fromEntries(
  SERVICES.map((s) => [
    s.id,
    {
      title: s.title,
      category: 'خدمات e-Devlet',
      lastUpdate: TODAY,
      intro: s.intro,
      details: s.details,
      documents: s.documents,
      steps: s.steps,
      tips: s.tips,
      fees: s.fees,
      warning: s.warning,
      source: s.source,
    } satisfies ArticleData,
  ])
);
