/**
 * Shared taxonomy for the services directory. One source of truth for:
 *  - the public category landing pages (/services/category/[slug])
 *  - the profession × city pages (/services/category/[slug]/[city])
 *  - the breadcrumb on a provider page (/services/[id])
 *  - the "browse by profession" grid + filter on /services
 *  - the sitemap
 *
 * `slug` is an English, URL-clean identifier (better for Google than a
 * percent-encoded Arabic path). `variants` lists every value the DB column
 * `category` might hold for this profession (legacy + English + Arabic +
 * Turkish), so fetches catch them all — and the client filter derives its map
 * from here so the two never drift.
 *
 * `guide` is REAL, evergreen guidance rendered on the landing page so each
 * profession page is useful (and indexable) even before providers register —
 * practical "how to choose / what to verify" advice, never fabricated legal
 * claims. `note` carries a caution where a profession is regulated or
 * scam-prone. `related` links only to pages that actually exist on the site.
 */
export interface ServiceGuide {
    intro: string;                                  // practical framing shown in the page body
    checklist: string[];                            // "before you hire, verify:" — actionable, universally true
    note?: string;                                  // caution (regulated profession / common scam)
    related?: { label: string; href: string }[];   // internal links to real pages/tools
}

export interface ServiceCategory {
    slug: string;
    name: string;        // canonical Arabic category value (stored in DB `category`)
    labelAr: string;     // plural display label
    variants: string[];  // all DB `category` values that map here
    keywords: string[];  // SEO keywords (Arabic + Turkish where natural)
    blurb: string;       // short description fragment for meta + intro
    guide: ServiceGuide; // evergreen how-to content for the landing page
    popular?: boolean;   // surface as an inline quick-filter chip on /services
}

// Reused verification bullets (kept DRY; every trade needs the same basics).
const TRUST_BASICS = [
    'اطلب أمثلة سابقة أو تقييمات من عملاء حقيقيين قبل الاتفاق.',
    'اتّفق على السعر وتفاصيل العمل كتابةً (واتساب يكفي) قبل البدء — لا تدفع كامل المبلغ مقدّماً.',
    'تأكّد أنه يتحدّث لغتك ويشرح لك الخطوات بوضوح دون غموض.',
];

export const SERVICE_CATEGORIES: ServiceCategory[] = [
    {
        slug: 'doctors', name: 'طبيب', labelAr: 'أطباء', variants: ['طبيب', 'Health', 'health', 'doctor', 'Doctor', 'medical'],
        keywords: ['أطباء عرب في تركيا', 'طبيب عربي اسطنبول', 'عيادة عربية تركيا', 'arap doktor', 'doktor'],
        blurb: 'أطباء وعيادات يتحدّثون العربية', popular: true,
        guide: {
            intro: 'إيجاد طبيب يتحدّث العربية يوفّر عليك سوء الفهم في التشخيص والعلاج. لكن اللغة وحدها لا تكفي — تأكّد من ترخيص الطبيب والعيادة أولاً.',
            checklist: [
                'تحقّق أن الطبيب والعيادة مرخّصان رسمياً في تركيا (رخصة وزارة الصحة).',
                'للحالات غير الطارئة، ابدأ بنظام المواعيد الحكومي عبر MHRS ومستشفيات الدولة — الخدمة مشمولة غالباً بتأمينك.',
                'اطلب تفصيل التكلفة قبل أي إجراء، ولا توقّع على علاج مكلف قبل رأي ثانٍ.',
            ],
            note: 'مزاولة بعض المهن الطبية (كطب الأسنان والصيدلة) مقصورة قانوناً على المرخّصين في تركيا — تأكّد دائماً من الترخيص التركي للطبيب.',
        },
    },
    {
        slug: 'dentists', name: 'طب أسنان', labelAr: 'أطباء أسنان', variants: ['طب أسنان', 'طبيب أسنان', 'أسنان', 'Dentist', 'dentist', 'dental', 'diş'],
        keywords: ['طبيب أسنان عربي تركيا', 'زراعة أسنان اسطنبول', 'تجميل أسنان تركيا', 'diş hekimi', 'implant'],
        blurb: 'أطباء أسنان وعيادات يتحدّثون العربية', popular: true,
        guide: {
            intro: 'تركيا وجهة رئيسية لعلاج وتجميل الأسنان بأسعار منافسة. المفتاح هو اختيار عيادة مرخّصة وطبيب مؤهّل، لا الأرخص فقط.',
            checklist: [
                'تأكّد أن العيادة مرخّصة من وزارة الصحة وأن الطبيب مرخّص لمزاولة طب الأسنان في تركيا.',
                'اطلب خطة علاج مكتوبة بالتكلفة الإجمالية قبل البدء (زراعة/تقويم/تجميل).',
                'احذر عروض «الابتسامة الكاملة» المبالغة — اطلب رأياً ثانياً للحالات الكبيرة.',
            ],
            note: 'مزاولة طب الأسنان في تركيا مقصورة قانوناً على المرخّصين محلياً — احرص على التحقق من ترخيص الطبيب.',
        },
    },
    {
        slug: 'lawyers', name: 'محامي', labelAr: 'محامون', variants: ['محامي', 'Lawyer', 'lawyer', 'legal', 'Legal'],
        keywords: ['محامي عربي تركيا', 'محامي سوري اسطنبول', 'استشارة قانونية تركيا', 'arap avukat', 'avukat'],
        blurb: 'محامون ومستشارون قانونيّون بالعربية', popular: true,
        guide: {
            intro: 'القضايا القانونية في تركيا (إقامة، جنسية، شركات، عقود، أحوال شخصية) تحتاج محامياً مرخّصاً مقيّداً في نقابة المحامين (Baro).',
            checklist: [
                'تأكّد أن المحامي مقيّد في نقابة محامين تركية (Baro) — هذا شرط قانوني للمرافعة.',
                'اطّلب عقد أتعاب واضحاً يحدّد الخدمة والمبلغ ومراحل الدفع.',
                'احذر من يَعِدك بنتيجة «مضمونة» في الإقامة أو الجنسية — لا أحد يضمن قرار الدولة.',
            ],
            note: 'مهنة المحاماة مقصورة قانوناً على المواطنين الأتراك؛ المكاتب قد توظّف مستشارين عرباً لكن المرافعة تكون بمحامٍ مقيّد في النقابة.',
        },
    },
    {
        slug: 'translators', name: 'مترجم', labelAr: 'مترجمون', variants: ['مترجم', 'Translation', 'translation', 'Translator', 'translator'],
        keywords: ['مترجم عربي تركيا', 'ترجمة محلّفة اسطنبول', 'مترجم محلّف', 'tercüman', 'yeminli tercüman'],
        blurb: 'مترجمون محلّفون وخدمات ترجمة', popular: true,
        guide: {
            intro: 'أغلب المعاملات الرسمية (النفوس، الكاتب بالعدل، المحاكم، الجامعات) تشترط ترجمة محلّفة (yeminli tercüme) مصدّقة، لا ترجمة عادية.',
            checklist: [
                'اطلب صراحةً «ترجمة محلّفة» (yeminli) إن كانت المعاملة رسمية — العادية تُرفض.',
                'تأكّد من ختم المترجم المحلّف وتصديق الكاتب بالعدل (noter) عند الحاجة.',
                'قارن السعر لكل صفحة، واسأل عن مدّة التسليم قبل الاتفاق.',
            ],
        },
    },
    {
        slug: 'real-estate', name: 'عقارات', labelAr: 'العقارات', variants: ['عقارات', 'Real Estate', 'real_estate', 'housing'],
        keywords: ['عقارات تركيا', 'شقق للبيع اسطنبول', 'مكتب عقاري عربي', 'emlak', 'gayrimenkul'],
        blurb: 'مكاتب ووسطاء عقاريّون', popular: true,
        guide: {
            intro: 'سواء للإيجار أو الشراء أو العقار المؤهِّل للإقامة/الجنسية، تعامل مع مكتب عقاري موثوق وتحقّق من الأوراق الرسمية قبل الدفع.',
            checklist: [
                'تأكّد من سند الملكية (Tapu) وأن البائع هو المالك الفعلي قبل أي عربون.',
                'للإيجار: وقّع عقداً رسمياً ولا تدفع خارج العقد؛ احذر «العربون» قبل معاينة العقار.',
                'للشراء بهدف الجنسية، تحقّق من الحدّ الرسمي وتقييم الخبير المعتمد قبل الالتزام.',
            ],
            note: 'الوساطة العقارية تتطلّب توثيق العقود؛ احذر السماسرة الذين يطلبون مبالغ نقدية دون إيصال أو عقد.',
            related: [{ label: 'حاسبة زيادة الإيجار القانونية', href: '/tools/rent-increase-calculator' }],
        },
    },
    {
        slug: 'education', name: 'تعليم', labelAr: 'التعليم والطلاب', variants: ['تعليم', 'Education', 'education', 'student'],
        keywords: ['تعليم تركيا', 'مكتب طلابي تركيا', 'تسجيل جامعات تركيا', 'eğitim danışmanlık'],
        blurb: 'خدمات تعليمية ومكاتب طلابية',
        guide: {
            intro: 'مكاتب التسجيل الجامعي تسهّل القبول والمعادلة، لكن كثيراً منها يتقاضى عمولات على خدمات يمكنك إنجازها بنفسك مجاناً.',
            checklist: [
                'اسأل بدقّة عمّا تدفع مقابله: هل هي رسوم جامعة فعلية أم عمولة مكتب؟',
                'للجامعات الحكومية، تحقّق من مواعيد YÖS/التقديم على المواقع الرسمية للجامعة مباشرة.',
                'لا تسلّم أوراقك الأصلية؛ اكتفِ بالنسخ، واحتفظ بإيصال لكل مبلغ.',
            ],
        },
    },
    {
        slug: 'beauty', name: 'تجميل', labelAr: 'التجميل', variants: ['تجميل', 'Beauty', 'beauty', 'cosmetics'],
        keywords: ['تجميل تركيا', 'زراعة شعر اسطنبول', 'مركز تجميل عربي', 'estetik', 'saç ekimi'],
        blurb: 'مراكز وخدمات التجميل والعناية', popular: true,
        guide: {
            intro: 'من زراعة الشعر إلى العناية والتجميل، تركيا مشهورة بالأسعار المنافسة — لكن الإجراءات الطبية منها تحتاج مركزاً مرخّصاً وطبيباً مختصاً.',
            checklist: [
                'للإجراءات الطبية (زراعة شعر، تجميل)، تأكّد أن المركز مرخّص وأن مَن يجري العملية طبيب لا «فنّي».',
                'اطلب صوراً حقيقية لنتائج سابقة وعقداً بالسعر الشامل.',
                'احذر الباقات «الكل شامل» الرخيصة جداً — قد تخفي رسوماً أو تنازلاً عن الجودة.',
            ],
        },
    },
    {
        slug: 'barber', name: 'حلاقة', labelAr: 'حلاقون وكوافير', variants: ['حلاقة', 'حلاق', 'كوافير', 'Barber', 'barber', 'kuaför'],
        keywords: ['حلاق عربي تركيا', 'كوافير عربي اسطنبول', 'صالون حلاقة عربي', 'kuaför', 'berber'],
        blurb: 'صالونات حلاقة وكوافير عربية',
        guide: {
            intro: 'صالونات الحلاقة والكوافير العربية منتشرة في أحياء الجاليات — دليل سريع لإيجاد الأقرب إليك بلغتك.',
            checklist: [
                'اسأل عن الأسعار قبل الجلوس — بعض الصالونات تفرّق بين الخدمات.',
                'تأكّد من نظافة الأدوات والتعقيم، خاصةً للحلاقة بالموس.',
                'التقييمات وصور الأعمال السابقة أفضل دليل على الجودة.',
            ],
        },
    },
    {
        slug: 'insurance', name: 'تأمين', labelAr: 'التأمين', variants: ['تأمين', 'Insurance', 'insurance'],
        keywords: ['تأمين تركيا', 'تأمين صحي اسطنبول', 'سيكورتا', 'sigorta'],
        blurb: 'وكلاء وخدمات التأمين',
        guide: {
            intro: 'التأمين الصحي شرط أساسي للإقامة، وهناك تأمين إجباري للسيارات (Trafik) وآخر شامل (Kasko). اختر وكيلاً يشرح لك التغطية بوضوح.',
            checklist: [
                'للإقامة: تأكّد أن بوليصة التأمين الصحي مقبولة لدى دائرة الهجرة (Göç İdaresi).',
                'اقرأ ما تغطّيه البوليصة وما تستثنيه قبل التوقيع — لا تكتفِ بالسعر.',
                'قارن عروض أكثر من وكيل؛ الفروق كبيرة أحياناً لنفس التغطية.',
            ],
        },
    },
    {
        slug: 'cars', name: 'سيارات', labelAr: 'السيارات', variants: ['سيارات', 'Cars', 'cars', 'automotive'],
        keywords: ['سيارات تركيا', 'معرض سيارات عربي', 'تأجير سيارات اسطنبول', 'oto', 'araç'],
        blurb: 'معارض وخدمات السيارات',
        guide: {
            intro: 'شراء أو تأجير سيارة في تركيا يتطلّب أوراقاً سليمة ونقل ملكية موثّقاً — لا تسلّم المال قبل إتمام المعاملة رسمياً.',
            checklist: [
                'للشراء: تحقّق من رخصة السيارة (Ruhsat) وغياب الحجوزات/الديون عليها قبل الدفع.',
                'أتمّ نقل الملكية لدى الكاتب بالعدل (noter) — لا تعتمد على اتفاق شفهي.',
                'للتأجير: اقرأ شروط التأمين والوديعة وحدود المسافة بعناية.',
            ],
        },
    },
    {
        slug: 'restaurants', name: 'مطاعم', labelAr: 'المطاعم', variants: ['مطاعم', 'Restaurants', 'restaurants', 'food'],
        keywords: ['مطاعم عربية تركيا', 'مطعم سوري اسطنبول', 'أكل عربي تركيا', 'arap restoran'],
        blurb: 'مطاعم وخدمات الطعام العربية', popular: true,
        guide: {
            intro: 'مطاعم ومحلات الطعام العربية والسورية منتشرة في مدن تركيا — دليل لإيجاد الأقرب والأكثر تقييماً في مدينتك.',
            checklist: [
                'التقييمات والصور الحديثة أفضل دليل على الجودة والنظافة.',
                'اسأل عن التوصيل وأوقات العمل قبل الطلب.',
                'للمناسبات والولائم، اتّفق على القائمة والسعر والعدد كتابةً مسبقاً.',
            ],
        },
    },
    {
        slug: 'cargo', name: 'شحن', labelAr: 'الشحن', variants: ['شحن', 'Cargo', 'cargo', 'shipping'],
        keywords: ['شحن من تركيا', 'شحن إلى سوريا', 'كارجو تركيا', 'kargo'],
        blurb: 'شركات الشحن والكارجو',
        guide: {
            intro: 'شركات الشحن تنقل البضائع والطرود من تركيا إلى سوريا والدول العربية. اختر شركة واضحة الأسعار والمواعيد ومسؤولة عن الضمان.',
            checklist: [
                'اطلب سعراً واضحاً حسب الوزن/الحجم ومدّة وصول تقديرية مكتوبة.',
                'اسأل عن التأمين على الشحنة وماذا يحدث عند التلف أو الضياع.',
                'احتفظ بإيصال ورقم تتبّع لكل شحنة.',
            ],
            related: [{ label: 'أسعار الصرف ومحوّل العملات', href: '/tools/currency' }],
        },
    },
    {
        slug: 'customs', name: 'تخليص جمركي', labelAr: 'التخليص الجمركي والاستيراد', variants: ['تخليص جمركي', 'جمارك', 'استيراد', 'تصدير', 'Customs', 'customs', 'gümrük'],
        keywords: ['تخليص جمركي تركيا', 'استيراد من تركيا', 'شحن تجاري تركيا', 'gümrük müşaviri', 'ithalat ihracat'],
        blurb: 'خدمات التخليص الجمركي والاستيراد والتصدير',
        guide: {
            intro: 'للتجّار والشركات: التخليص الجمركي والاستيراد/التصدير من تركيا يحتاج مكتباً متمرّساً يعرف الإجراءات والوثائق الرسمية.',
            checklist: [
                'تأكّد أن المكتب معتمد للتعامل مع الجمارك (Gümrük) ولديه سجل واضح.',
                'اطلب تفصيل الرسوم الجمركية والعمولات كتابةً — لا مبالغ مبهمة.',
                'راجع فاتورة الشحنة والوثائق (الفاتورة، شهادة المنشأ) قبل الإرسال.',
            ],
            note: 'مهنة «مستشار الجمارك» مقصورة قانوناً على الأتراك؛ تعامَل مع مكتب/شركة معتمدة.',
            related: [{ label: 'أسعار الصرف ومحوّل العملات', href: '/tools/currency' }],
        },
    },
    {
        slug: 'accounting', name: 'محاسبة', labelAr: 'محاسبون ومستشارون ماليّون', variants: ['محاسبة', 'محاسب', 'مالية', 'Accounting', 'accounting', 'accountant', 'muhasebe'],
        keywords: ['محاسب عربي تركيا', 'مستشار مالي تركيا', 'محاسبة شركات', 'muhasebe', 'mali müşavir'],
        blurb: 'خدمات محاسبية ومالية للشركات والأفراد',
        guide: {
            intro: 'أصحاب الشركات والمحلات يحتاجون محاسباً لتنظيم الضرائب والفواتير والرواتب. اختر مكتباً منظّماً يشرح التزاماتك الضريبية بوضوح.',
            checklist: [
                'اتّفق على أتعاب شهرية واضحة وما تشمله (ضريبة، رواتب، تأمينات SGK).',
                'تأكّد أن الإقرارات الضريبية تُقدَّم في مواعيدها لتجنّب الغرامات.',
                'احتفظ بنسخ من كل فاتورة وإقرار — لا تترك أوراقك كلها لدى المكتب فقط.',
            ],
            note: 'مهنة المحاسب القانوني المعتمد (SMMM) مقصورة قانوناً على الأتراك؛ المكاتب توفّر الخدمة عبر محاسبين مرخّصين محلياً.',
            related: [
                { label: 'حاسبة الراتب (صافي/إجمالي)', href: '/tools/salary-calculator' },
                { label: 'حاسبة تعويض نهاية الخدمة', href: '/tools/severance-calculator' },
            ],
        },
    },
    {
        slug: 'contractors', name: 'مقاولات', labelAr: 'مقاولون وتعهّدات', variants: ['مقاولات', 'مقاول', 'تعهدات', 'Contractor', 'contractor', 'construction', 'inşaat', 'tadilat'],
        keywords: ['مقاول عربي تركيا', 'ترميم شقق اسطنبول', 'تشطيب وديكور', 'inşaat', 'tadilat'],
        blurb: 'مقاولو بناء وترميم وتشطيبات',
        guide: {
            intro: 'ترميم شقة أو تشطيب محل يحتاج مقاولاً أميناً يلتزم بالمدّة والميزانية. الاتفاق المكتوب هو حمايتك الأولى.',
            checklist: [
                ...TRUST_BASICS,
                'قسّم الدفع على مراحل مرتبطة بإنجاز فعلي، لا دفعة واحدة مقدّماً.',
            ],
        },
    },
    {
        slug: 'plumbing', name: 'سباكة', labelAr: 'سبّاكون', variants: ['سباكة', 'سباك', 'Plumber', 'plumber', 'plumbing', 'tesisat', 'tesisatçı'],
        keywords: ['سباك عربي تركيا', 'تصليح سباكة اسطنبول', 'تسليك مجاري', 'su tesisatı', 'tesisatçı'],
        blurb: 'سبّاكون وصيانة تمديدات المياه',
        guide: {
            intro: 'من تسريب بسيط إلى تمديد كامل، سبّاك يتحدّث لغتك يسهّل شرح المشكلة والحل. اتّفق على السعر قبل بدء العمل.',
            checklist: [
                'اسأل عن سعر الكشف/الزيارة قبل استدعائه.',
                'اطلب تقدير التكلفة قبل الشراء وبدء الإصلاح.',
                'تأكّد من ضمان على العمل والقطع المستبدلة.',
            ],
        },
    },
    {
        slug: 'electrical', name: 'كهرباء', labelAr: 'كهربائيون', variants: ['كهرباء', 'كهربائي', 'Electrician', 'electrician', 'electrical', 'elektrik', 'elektrikçi'],
        keywords: ['كهربائي عربي تركيا', 'صيانة كهرباء اسطنبول', 'تمديدات كهربائية', 'elektrikçi', 'elektrik'],
        blurb: 'كهربائيون وصيانة التمديدات الكهربائية',
        guide: {
            intro: 'الأعمال الكهربائية تمسّ سلامتك — اختر كهربائياً خبيراً يلتزم معايير الأمان، لا الأرخص فقط.',
            checklist: [
                'تأكّد من خبرته في نوع العمل المطلوب (منزلي / تجاري).',
                'اطلب تقدير التكلفة قبل البدء وضماناً على العمل.',
                'لا تساوم على السلامة — الأعمال الكهربائية الرديئة خطر حريق.',
            ],
        },
    },
    {
        slug: 'carpentry', name: 'نجارة', labelAr: 'نجّارون', variants: ['نجارة', 'نجار', 'Carpenter', 'carpenter', 'carpentry', 'mobilya', 'marangoz'],
        keywords: ['نجار عربي تركيا', 'تفصيل أثاث اسطنبول', 'موبيليا وأبواب', 'mobilya', 'marangoz'],
        blurb: 'نجّارو أثاث وأبواب وموبيليا',
        guide: {
            intro: 'تفصيل مطبخ أو خزانة أو إصلاح أثاث يحتاج نجّاراً دقيقاً. اتفق على المقاسات والخامة والسعر كتابةً قبل البدء.',
            checklist: [
                ...TRUST_BASICS,
                'حدّد نوع الخشب/الخامة كتابةً — الفرق في السعر والجودة كبير.',
            ],
        },
    },
    {
        slug: 'hvac', name: 'تكييف وتبريد', labelAr: 'تكييف وتبريد', variants: ['تكييف', 'تبريد', 'تكييف وتبريد', 'HVAC', 'hvac', 'klima'],
        keywords: ['صيانة مكيفات تركيا', 'تركيب تكييف اسطنبول', 'تبريد وتكييف', 'klima servisi', 'soğutma'],
        blurb: 'تركيب وصيانة المكيّفات والتبريد',
        guide: {
            intro: 'تركيب أو صيانة مكيّف يحتاج فنّياً متخصّصاً. الصيانة الدورية تطيل عمر الجهاز وتخفّض الفاتورة.',
            checklist: [
                'اسأل عن سعر التركيب/الصيانة وما يشمله (شحن غاز، تنظيف).',
                'تأكّد من ضمان على التركيب وقطع الغيار.',
                'للأجهزة تحت الضمان، تحقّق من الوكيل المعتمد قبل أي فنّي خارجي.',
            ],
        },
    },
    {
        slug: 'moving', name: 'نقل عفش', labelAr: 'نقل الأثاث والعفش', variants: ['نقل عفش', 'نقل اثاث', 'نقل أثاث', 'Moving', 'moving', 'nakliyat'],
        keywords: ['نقل عفش تركيا', 'نقل اثاث اسطنبول', 'شركة نقل عفش', 'evden eve nakliyat'],
        blurb: 'شركات نقل الأثاث والعفش',
        guide: {
            intro: 'شركة نقل عفش موثوقة تنقل أثاثك بأمان وتغلّفه جيداً. اتّفق على السعر والتاريخ والخدمات قبل يوم النقل.',
            checklist: [
                'اطلب سعراً شاملاً (تغليف، فكّ وتركيب، حمل الطوابق) مكتوباً.',
                'اسأل عن الضمان في حال كسر أو تلف أثناء النقل.',
                'احجز الموعد مبكراً وتأكّد من حجم السيارة المناسب لأثاثك.',
            ],
        },
    },
    {
        slug: 'cleaning', name: 'تنظيف', labelAr: 'خدمات التنظيف', variants: ['تنظيف', 'Cleaning', 'cleaning', 'temizlik'],
        keywords: ['شركة تنظيف تركيا', 'تنظيف منازل اسطنبول', 'عاملة تنظيف', 'temizlik şirketi'],
        blurb: 'شركات وعمّال تنظيف المنازل والمكاتب',
        guide: {
            intro: 'خدمات تنظيف المنازل والمكاتب متوفّرة بالساعة أو بالمهمة. حدّد المطلوب والسعر مسبقاً لتجنّب الخلاف.',
            checklist: [
                'اتّفق على نطاق العمل (المساحة، الغرف، الزجاج) والسعر قبل البدء.',
                'اسأل هل مواد التنظيف مشمولة أم عليك توفيرها.',
                'التقييمات مهمّة — خدمة التنظيف تدخل بيتك، فاختر موثوقاً.',
            ],
        },
    },
    {
        slug: 'appliance-repair', name: 'صيانة أجهزة', labelAr: 'صيانة الأجهزة المنزلية', variants: ['صيانة أجهزة', 'صيانة', 'Appliance', 'appliance', 'repair', 'beyaz eşya'],
        keywords: ['صيانة غسالات تركيا', 'تصليح ثلاجات اسطنبول', 'صيانة أجهزة منزلية', 'beyaz eşya servisi'],
        blurb: 'صيانة غسّالات وثلّاجات وأجهزة كهربائية',
        guide: {
            intro: 'تصليح غسّالة أو ثلّاجة أرخص غالباً من الاستبدال. اختر فنّياً يشخّص العطل بوضوح ويضمن عمله.',
            checklist: [
                'اسأل عن سعر الكشف قبل الزيارة، وهل يُخصم من قيمة الإصلاح.',
                'اطلب تقدير تكلفة القطعة والأجرة قبل الموافقة على الإصلاح.',
                'تأكّد من ضمان على القطعة المستبدلة والعمل.',
            ],
        },
    },
    {
        slug: 'tourism', name: 'سياحة', labelAr: 'السياحة', variants: ['سياحة', 'Tourism', 'tourism', 'travel'],
        keywords: ['سياحة تركيا', 'مكتب سياحي عربي', 'رحلات اسطنبول', 'turizm', 'tur'],
        blurb: 'مكاتب ورحلات سياحية',
        guide: {
            intro: 'مكاتب السياحة تنظّم الرحلات والجولات والحجوزات. قارن البرامج والأسعار واقرأ ما تشمله الرحلة بالضبط.',
            checklist: [
                'اطلب برنامج الرحلة مفصّلاً: ماذا يشمل السعر (نقل، إقامة، وجبات، مدخل).',
                'تأكّد من سياسة الإلغاء والاسترجاع قبل الدفع.',
                'احذر العروض الرخيصة جداً التي تخفي رسوماً إضافية لاحقاً.',
            ],
        },
    },
    {
        slug: 'general', name: 'خدمات عامة', labelAr: 'خدمات عامة', variants: ['خدمات عامة', 'General', 'general', 'other'],
        keywords: ['خدمات عربية تركيا', 'حرفيّون تركيا', 'صيانة اسطنبول'],
        blurb: 'خدمات عامة وحرف متنوّعة',
        guide: {
            intro: 'خدمات وحرف متنوّعة لا تندرج تحت تصنيف محدّد. نفس قواعد الأمان تنطبق: اتّفق كتابةً وتحقّق من السمعة.',
            checklist: TRUST_BASICS,
        },
    },
];

/** Popular Turkish cities used in landing-page copy + keywords. */
export const POPULAR_CITIES = ['إسطنبول', 'غازي عنتاب', 'أنقرة', 'بورصة', 'إزمير', 'مرسين'];

export const categoryBySlug = (slug: string): ServiceCategory | undefined =>
    SERVICE_CATEGORIES.find((c) => c.slug === slug);

/** Map a provider's raw DB `category` value to its canonical taxonomy entry. */
export const categoryForName = (name?: string | null): ServiceCategory | undefined => {
    if (!name) return undefined;
    const low = name.toLowerCase().trim();
    return SERVICE_CATEGORIES.find((c) => c.variants.some((v) => v.toLowerCase() === low));
};

/** Map a provider's raw DB `category` value to its landing-page slug (if any). */
export const categorySlugForName = (name?: string | null): string | undefined =>
    categoryForName(name)?.slug;

/**
 * The client filter's canonical-name → variants map, derived from the taxonomy
 * so /services and the landing pages never drift. Keyed by the Arabic `name`.
 */
export const CATEGORY_VARIANTS: Record<string, string[]> = Object.fromEntries(
    SERVICE_CATEGORIES.map((c) => [c.name, c.variants]),
);
