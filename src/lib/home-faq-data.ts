export interface HomeFAQItem {
    id: string;
    question: string;
    answer: string;
    detailHref: string;
    sourceUrl: string;
    sourceLabel: string;
}

// Keep homepage answers short and conservative. Detailed procedures belong in
// their dedicated pages, where they can be reviewed and updated independently.
export const TOP_FAQS: HomeFAQItem[] = [
    {
        id: 'faq-1',
        question: 'متى أقدّم طلب تجديد الإقامة؟',
        answer: 'يمكن بدء طلب التمديد خلال الستين يوماً السابقة لانتهاء الإقامة، ويجب تقديمه قبل انتهاء المدة. الوثائق والإجراء يختلفان حسب نوع الإقامة والولاية، لذلك تحقّق من قائمة e-İkamet الرسمية قبل التقديم.',
        detailHref: '/category/residence',
        sourceUrl: 'https://www.goc.gov.tr/ikamet-genel-bilgiler',
        sourceLabel: 'إدارة الهجرة',
    },
    {
        id: 'faq-2',
        question: 'ظهر كود على ملفي، ماذا أفعل؟',
        answer: 'لا يكفي اسم الكود وحده لمعرفة أثره أو مهلة الاعتراض؛ النتيجة تتغيّر بحسب القرار والتبليغ وملف الشخص. اطلب نسخة من القرار، واستعلم من YİMER 157، واستشر محامياً مرخصاً عند وجود منع دخول أو ترحيل.',
        detailHref: '/codes',
        sourceUrl: 'https://www.goc.gov.tr/yabancilar-iletisim-merkezi2',
        sourceLabel: 'YİMER 157',
    },
    {
        id: 'faq-3',
        question: 'كيف أعمل بصورة قانونية في تركيا؟',
        answer: 'المسار يعتمد على وضعك القانوني ونوع العمل. غالباً يتقدّم صاحب العمل بطلب إذن العمل، وتوجد حالات محددة للإعفاء، منها حالات مرتبطة بالحماية المؤقتة. لا تعتمد على قاعدة واحدة أو وعد شفهي قبل التحقق من حالتك.',
        detailHref: '/category/work',
        sourceUrl: 'https://www.csgb.gov.tr/uigm/tr/genel-bilgi/yabancilara-duzenlenen-belgeler/',
        sourceLabel: 'وزارة العمل',
    },
    {
        id: 'faq-4',
        question: 'كم يمكن أن ترتفع أجرة السكن عند التجديد؟',
        answer: 'لا يوجد حالياً سقف ثابت قدره 25%. في عقود السكن المجددة يرتبط الحد القانوني بمعدل تغيّر مؤشر أسعار المستهلك لاثني عشر شهراً، وتُنشر النسبة شهرياً. قد تختلف النتيجة في حالات خاصة أو نزاع قضائي.',
        detailHref: '/category/housing',
        sourceUrl: 'https://mgm.adalet.gov.tr/Resimler/SayfaDokuman/181020191500286098.pdf',
        sourceLabel: 'قانون الالتزامات التركي',
    },
    {
        id: 'faq-5',
        question: 'من أين أتأكد من معلومات الإقامة والكملك؟',
        answer: 'استخدم مواقع الجهات الحكومية، أو اتصل بـ YİMER 157 الذي يقدّم معلومات بالعربية حول الإقامة والحماية المؤقتة وإذن السفر. لا ترسل صور وثائقك أو أرقامك الكاملة إلى صفحات أو وسطاء غير معروفين.',
        detailHref: '/sources',
        sourceUrl: 'https://www.goc.gov.tr/yabancilar-iletisim-merkezi2',
        sourceLabel: 'إدارة الهجرة',
    },
];
