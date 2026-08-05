/**
 * e-Devlet services directory — single source of truth.
 *
 * These 33 entries used to be 33 published articles, and measurement is what
 * settled it: on a 331-article site the twenty-eight most textually similar
 * PAIRS were all from this group, overlapping 50-65%, while outside it only two
 * pairs anywhere passed 30%. They were not similar articles. They were one
 * template with the service name swapped — identical prerequisites, identical
 * tips, identical fee line, identical warning, identical first step. Each
 * carried an average of 38 words of its own and about ten reads.
 *
 * A directory entry is not an article. The shared half is stated once on the
 * hub (EDEVLET_PREREQS / EDEVLET_TIPS below), each entry keeps the sentence,
 * the step and the official link that were genuinely its own, and the old
 * article URLs 308 to their anchor here.
 *
 * `id` is the anchor and the redirect target: /e-devlet-services#<id>.
 * `url` is always the service's own page on turkiye.gov.tr — never a mirror,
 * never a shortener. If a link dies, fix it here; there is nowhere else.
 *
 * Generated from the rows themselves by scripts/gen-edevlet-registry.py, so no
 * wording was invented in the move. Add a service by hand: it needs an id, a
 * title, one honest sentence, and the official URL.
 */

export type EDevletService = {
    /** Anchor on /e-devlet-services, and the tail of the old article slug. */
    id: string;
    title: string;
    /** One sentence on what the service does. */
    intro: string;
    /** The step specific to this service; the shared ones live in EDEVLET_STEPS. */
    howTo: string;
    /** Anything this service needs beyond the shared prerequisites. */
    needs?: string[];
    /** Extra explanation, on the few entries that carried real writing. */
    notes?: string[];
    /** The service's own page on turkiye.gov.tr. */
    url: string;
};

/** True of every service here, so it is said once instead of thirty-three times. */
export const EDEVLET_PREREQS = [
    'حساب e‑Devlet فعّال (شيفرة من PTT، أو الدخول عبر البنك، أو الطرق الأخرى المتاحة).',
    'رقم الهوية (T.C.) أو رقم الأجنبي (YKN) بحسب حالتك.',
    'رقم هاتف فعّال — قد تحتاجه للتحقق عبر SMS.',
];

export const EDEVLET_STEPS = [
    'افتح الرابط الرسمي للخدمة وسجّل الدخول إلى e‑Devlet.',
];

export const EDEVLET_TIPS = [
    'إذا لم تفتح الخدمة من المتصفح، جرّب تطبيق e‑Devlet ثم أعد المحاولة.',
    'إن ظهرت رسالة «لا تملك صلاحية»، فقد تكون الخدمة غير متاحة لنوع هويتك أو لولايتك.',
    'احتفظ بنسخة PDF أو بالباركود عند استخراج أي وثيقة رسمية.',
    'لا تدخل أي بيانات شخصية إلا داخل نطاق حكومي رسمي ينتهي بـ turkiye.gov.tr.',
];

export const EDEVLET_SERVICES: EDevletService[] = [
    {
        id: 'adima-tescilli-arac',
        title: 'الاستعلام عن عدد السيارات المسجلة باسمك',
        intro: 'تساعدك الخدمة على معرفة المركبات المسجلة باسمك، وهو مفيد للتحقق وتجنب أي تسجيل غير صحيح.',
        howTo: 'اعرض النتائج وتحقق من أي مركبة لا تعرفها.',
        notes: [
            'الرابط الرسمي المباشر اسمها الرسمي «Adıma Tescilli Araç Sorgulama» وتتبع المديرية العامة للأمن: turkiye.gov.tr/emniyet-adima-tescilli-arac-sorgulama لماذا يهمّك هذا الاستعلام تحديداً؟',
            'ليس فضولاً: كل مركبة مسجّلة باسمك تترتّب عليها مسؤولية — مخالفاتها وضرائبها وتأمينها الإجباري.',
            'ولهذا يستعمله الناس في ثلاث حالات عملية: بعد بيع سيارة: للتأكد أن نقل الملكية تمّ فعلاً وأنها لم تعد باسمك.',
            'إن ظهرت بعد البيع، النقل لم يكتمل — راجع النوتر فوراً.',
            'عند اشتباه بتسجيل خاطئ: مركبة لا تعرفها باسمك تعني خطأً إدارياً أو استعمالاً لهويتك؛ راجع مديرية المرور بلا تأخير.',
            'قبل معاملة رسمية: بعض المعاملات تتأثر بما هو مسجّل باسمك.',
            'إن ظهرت مركبة غريبة، تحقّق أيضاً من المخالفات المسجّلة عليها: استعلام مخالفات اللوحة .',
        ],
        url: 'https://turkiye.gov.tr/emniyet-adima-tescilli-arac-sorgulama?hizmet=ekrani',
    },
    {
        id: 'adli-sicil-kaydi',
        title: 'استخراج وثيقة لا حكم عليه (خلو السوابق) في تركيا',
        intro: 'تُطلب “وثيقة لا حكم عليه” في معاملات متعددة (مدارس/جامعات/مرور/زواج…).',
        howTo: 'اختر الجهة التي ستقدم لها الوثيقة والسبب، ثم أدخل اسم الجهة إن طُلب.',
        notes: [
            'داخل الخدمة ستحدد الجهة المقدَّم لها (رسمية/خاصة/أجنبية) والسبب، ثم يمكنك تنزيل الوثيقة وطباعتها.',
        ],
        url: 'https://turkiye.gov.tr/adli-sicil-kaydi',
    },
    {
        id: 'adres-degisikligi-bildirimi',
        title: 'تغيير عنوان السكن (لحاملي الجنسية التركية)',
        intro: 'هذه الخدمة مخصصة لتحديث العنوان إلكترونياً دون مراجعة النفوس في بعض الحالات.',
        howTo: 'أدخل معلومات العنوان الجديد وتابع خطوات التحقق حسب ما يظهر لك.',
        notes: [
            'قد يتطلب التحقق بالتوقيع الإلكتروني أو رمز SMS حسب طريقة الدخول وتحقق الهوية.',
        ],
        url: 'https://turkiye.gov.tr/adres-degisikligi-bildirimi',
    },
    {
        id: 'aile-hekim-bilgisi-sorgulama',
        title: 'الحصول على معلومات طبيب العائلة في تركيا',
        intro: 'تتيح هذه الخدمة معرفة الطبيب/المركز الصحي المخصص لك.',
        howTo: 'اعرض بيانات طبيب العائلة والمركز الصحي.',
        notes: [
            'الخدمة متاحة للمواطنين والمقيمين بحسب التغطية والبيانات المسجلة في النظام الصحي.',
        ],
        url: 'https://turkiye.gov.tr/aile-hekim-bilgisi',
    },
    {
        id: 'aracimin-cekildigi-otopark-bilgisi-sorgulama',
        title: 'معرفة المرآب الذي أودعت فيه السيارات المحجوزة في تركيا',
        intro: 'إذا تم سحب سيارتك بسبب الوقوف في مكان مخالف، تساعدك هذه الخدمة على معرفة المرآب الذي أُودعت فيه سيارتك وعنوانه، لتتمكن من الذهاب مباشرةً واستكمال إجراءات الاستلام.',
        howTo: 'اعرض نتيجة الخدمة لمعرفة المرآب وعنوانه.',
        needs: ['معلومات السيارة إن طُلبت داخل الخدمة (قد تختلف حسب الشاشة).'],
        url: 'https://turkiye.gov.tr/egm-otopark-cekilmis-araclar?hizmet=Ekrani',
    },
    {
        id: 'borc-durumu-sorgulama',
        title: 'الاستعلام عن الديون المتراكمة في SGK لأصحاب الشركات (4B)',
        intro: 'تساعد الخدمة على معرفة الديون المتراكمة في SGK ضمن فئة 4B.',
        howTo: 'اعرض الديون/المستحقات وتفاصيلها.',
        notes: [
            'تظهر التفاصيل حسب التسجيل والصلاحيات في حسابك.',
        ],
        url: 'https://www.turkiye.gov.tr/4b-borc-durumu',
    },
    {
        id: 'cimer-basvuru',
        title: 'تقديم شكوى إلى رئاسة الجمهورية (منصة CİMER)',
        intro: 'يمكن عبر CİMER تقديم شكوى/طلب رسمي إلى رئاسة الجمهورية التركية.',
        howTo: 'أنشئ طلباً جديداً واكتب الشكوى/الطلب وحدد التفاصيل المطلوبة.',
        notes: [
            'يتم إرسال الطلب بسرية، وعادةً تتم المراجعة والرد خلال مدة قد تصل إلى 30 يوم بحسب نوع الطلب.',
        ],
        needs: ['نص الشكوى/الطلب بشكل واضح ومحدد.', 'مرفقات داعمة إن وُجدت (صور/وثائق).'],
        url: 'https://turkiye.gov.tr/cimer-basvuru-sorgulama',
    },
    {
        id: 'ck-bogazici-elektrik',
        title: 'فتح/إدارة خدمات كهرباء CK Boğaziçi عبر e‑Devlet',
        intro: 'تُظهر الصفحة الخدمات المتاحة للكهرباء ضمن e‑Devlet (تفعيل/إلغاء/فواتير/طلبات) حسب حسابك والمنطقة.',
        howTo: 'اختر الخدمة المطلوبة من القائمة داخل الصفحة.',
        notes: [
            'اتبع التعليمات داخل الصفحة لإتمام الإجراء.',
        ],
        url: 'https://www.turkiye.gov.tr/ck-bogazici-elektrik-perakende-satis-as',
    },
    {
        id: 'dava-dosyasi-sorgulama',
        title: 'التحقق من الدعاوى القضائية (Davalarım)',
        intro: 'تمكنك الخدمة من الاستعلام عن قضاياك القانونية وتطوراتها.',
        howTo: 'اعرض القضايا وتفاصيلها المتاحة (جلسات/قرارات).',
        notes: [
            'قد تختلف التفاصيل الظاهرة حسب نوع القضية والصلاحيات المتاحة في حسابك.',
        ],
        url: 'https://www.turkiye.gov.tr/davalarim',
    },
    {
        id: 'dogum-raporu',
        title: 'استخراج شهادة/تقرير ولادة في تركيا',
        intro: 'تتيح هذه الخدمة عرض/تحميل تقارير الولادة المسجلة ضمن النظام الصحي التركي.',
        howTo: 'اعرض قائمة تقارير الولادة (إن وُجدت) واختر التقرير المطلوب.',
        notes: [
            'عند توفر التقرير يمكنك تنزيله وحفظه كملف PDF/Barcode لاستخدامه في المعاملات التي تطلب إثبات الولادة.',
        ],
        url: 'https://www.turkiye.gov.tr/saglik-dogum-raporlari-sorgulama',
    },
    {
        id: 'doviz',
        title: 'الاستعلام عن أسعار صرف العملات',
        intro: 'تعرض الخدمة أسعار صرف العملات وفق البيانات الرسمية.',
        howTo: 'اختر العملة المطلوبة وراجع السعر اليومي.',
        notes: [
            'يمكنك استخدامها كمرجع يومي لسعر البيع/الشراء حسب ما يظهر في الصفحة.',
        ],
        url: 'https://www.turkiye.gov.tr/doviz-kurlari',
    },
    {
        id: 'e-nabiz',
        title: 'الحصول على المعلومات الطبية الخاصة بك (e‑Nabız)',
        intro: 'e‑Nabız منصة وزارة الصحة التركية التي تجمع تقاريرك وتحاليلك ووصفاتك وسجل زياراتك الطبية.',
        howTo: 'افتح e‑Nabız واختر القسم المطلوب (تحاليل/تقارير/وصفات/صور).',
        notes: [
            'يمكنك الوصول للمعلومات من منزلك دون مراجعة المشافي للحصول على النسخ.',
        ],
        url: 'https://turkiye.gov.tr/saglik-bakanligi-e-nabiz-kisisel-saglik-sistemi',
    },
    {
        id: 'evlenme-ehliyet',
        title: 'استخراج ورقة أعزب/أهلية زواج عبر e‑Devlet',
        intro: 'الخدمة مخصصة لتقديم طلب أهلية الزواج إلكترونياً ثم متابعة الطلب وفق متطلبات البلدية التي ستُقدَّم لها الأوراق.',
        howTo: 'اضغط “طلب جديد” (Yeni Başvuru).',
        notes: [
            'غالباً ستحتاج لإدخال بيانات التواصل وتحديد البلدية، ثم تعبئة بيانات الطرف الآخر وإرفاق الوثائق المطلوبة داخل الطلب.',
        ],
        needs: ['بيانات الزوج/الزوجة (رقم الكملك/YKN، جواز السفر إن وجد، الاسم والكنية، تاريخ الميلاد، الجنسية).', 'صورة واضحة لهوية/كملك الطرف الآخر عند الطلب.'],
        url: 'https://www.turkiye.gov.tr/goc-idaresi-evlenme-ehliyet-belgesi-basvurusu',
    },
    {
        id: 'ikamet-kisisel-bilgi',
        title: 'الاستعلام عن معلومات الإقامة الخاصة بك',
        intro: 'هذه الخدمة مخصصة للأجانب للاستعلام عن معلومات الإقامة الخاصة بهم: صلاحية الإقامة، تاريخ انتهاء الصلاحية، وبعض بيانات التواصل/التسجيل المعتمدة.',
        howTo: 'اعرض بيانات الإقامة وحالة الصلاحية وتاريخ الانتهاء.',
        url: 'https://turkiye.gov.tr/goc-idaresi-ikamet-izni-kisisel-bilgi-sorgulama-sonuclari',
    },
    {
        id: 'imei-sorgulama',
        title: 'التحقق من الرقم التسلسلي IMEI لجهاز جوال',
        intro: 'يمكن عبر IMEI الاستعلام عن معلومات مرتبطة بجهاز الهاتف.',
        howTo: 'أدخل رقم IMEI ثم نفّذ الاستعلام.',
        notes: [
            'أدخل رقم IMEI (من *#06#) داخل الخدمة لعرض النتائج المتاحة.',
        ],
        needs: ['رقم IMEI (15 خانة).'],
        url: 'https://www.turkiye.gov.tr/imei-sorgulama',
    },
    {
        id: 'iski-su',
        title: 'فتح/إدارة خدمات ماء إسطنبول (İSKİ) عبر e‑Devlet',
        intro: 'تقدم بعض شركات الخدمات صفحات ضمن e‑Devlet لإدارة الاشتراك والطلبات/الفواتير وفق المنطقة.',
        howTo: 'اختر الخدمة المطلوبة (اشتراك/فواتير/طلبات) حسب المتاح.',
        notes: [
            'الخيارات المتاحة تظهر داخل الصفحة بعد تسجيل الدخول.',
        ],
        url: 'https://www.turkiye.gov.tr/istanbul-su-ve-kanalizasyon-idaresi',
    },
    {
        id: 'mhrs',
        title: 'حجز موعد بالمشافي التركية (MHRS)',
        intro: 'عبر MHRS يمكنك اختيار المشفى والطبيب والموعد المتاح، ثم الذهاب في نفس الموعد لإجراء المعاينة.',
        howTo: 'اختر الولاية/المشفى/العيادة/الطبيب وفق المتاح.',
        notes: [
            'هذه الخدمة مرتبطة بحسابك وتُدار من داخل e‑Devlet.',
        ],
        url: 'https://turkiye.gov.tr/saglik-bakanligi-merkezi-hekim-randevu-sistemi',
    },
    {
        id: 'mobil-hat-sorgulama',
        title: 'الاستعلام عن خطوط الجوال المسجلة باسمك',
        intro: 'فحص الخطوط المسجلة باسمك مهم لتجنب أي مساءلة قانونية إذا استُخدمت بياناتك لفتح خطوط دون علمك.',
        howTo: 'راجع قائمة الخطوط المسجلة باسمك.',
        notes: [
            'الخدمة تعرض الخطوط المرتبطة بهويتك حسب النظام.',
        ],
        needs: ['رقم TC/هوية لإتمام الدخول.', 'في حال وجود خط غير معروف: وثيقة هوية + معلومات الخط عند مراجعة الشركة.'],
        url: 'https://www.turkiye.gov.tr/mobil-hat-sorgulama',
    },
    {
        id: 'nvi-nufus-kayit-ornegi',
        title: 'الحصول على بيان/سجل عائلي (لحاملي الجنسية التركية)',
        intro: 'يعرض سند القيد العائلي أسماء أفراد العائلة وبياناتهم.',
        howTo: 'اطلب استخراج الوثيقة ثم حمّلها واحتفظ بها.',
        notes: [
            'غالباً ما تطلبه جهات رسمية في معاملات مثل الزواج والطلاق وغيرها.',
            'توفر الخدمة يعتمد على نوع هويتك وصلاحيات الحساب.',
        ],
        url: 'https://turkiye.gov.tr/nvi-nufus-kayit-ornegi-belgesi-sorgulama',
    },
    {
        id: 'nvi-yerlesim-yeri',
        title: 'استخراج سند إقامة (وثيقة سكن) في تركيا',
        intro: 'سند الإقامة يُطلب كثيراً في التسجيل المدرسي، معاملات الإقامة، تحديث البيانات، فتح حساب بنكي، تأسيس شركة، معاملات الجنسية، وغيرها.',
        howTo: 'سجّل الدخول إلى e‑Devlet ثم ابحث عن “Adres bilgisi”.',
        notes: [
            'يمكنك استخراج الوثيقة وطباعتها مباشرةً من e‑Devlet بخطوات بسيطة.',
        ],
        url: 'https://www.turkiye.gov.tr/nvi-yerlesim-yeri-ve-diger-adres-belgesi-sorgulama',
    },
    {
        id: 'operator-debt',
        title: 'الاستعلام عن اشتراكات/ديون المشغلات (هاتف/إنترنت/TV) باسمك',
        intro: 'هذه من أكثر خدمات e‑Devlet استخداماً لأنها تُظهر اشتراكات المشغلين المسجلة باسمك، تاريخ بداية الاشتراك ونهايته، وقد تظهر مبالغ/متأخرات مرتبطة بخدمات الاتصالات.',
        howTo: 'اعرض قائمة الاشتراكات/الخدمات المسجلة باسمك.',
        url: 'https://turkiye.gov.tr/btk-mobil-sabit-internet-kablo-tv-uydu-isletmecilerinden-borc-ve-alacak-sorgulama',
    },
    {
        id: 'plaka-ceza',
        title: 'الاستعلام عن المخالفات المرورية على سيارتك',
        intro: 'تعرض الخدمة المخالفات المرورية المرتبطة بلوحة سيارتك وفق بيانات مديرية الأمن.',
        howTo: 'اعرض المخالفات وتفاصيل كل مخالفة.',
        notes: [
            'يمكنك مراجعتها ومعرفة تفاصيلها ومبالغها حسب ما يظهر لك.',
            'الرابط الرسمي المباشر الخدمة اسمها الرسمي «Araç Plakasına Yazılan Ceza Sorgulama» وتتبع المديرية العامة للأمن، وتعرض المخالفات المسجّلة على لوحة المركبة: turkiye.gov.tr/emniyet-arac-plakasina-yazilan-ceza-sorgulama كيف تقرأ النتيجة النتيجة تُظهر المخالفة وتاريخها والمبلغ.',
            'الفارق الذي يربك الكثيرين: هذه الخدمة تعرض مخالفات اللوحة ، وهي ليست بالضرورة نفس الدين المستحق عليك .',
            'المخالفة المسجّلة شيء، وحالة سدادها شيء آخر يُتابَع من خدمة الديون: استعلام ودفع دين المخالفات المرورية (Gelir İdaresi) ماذا تفعل بعد الاستعلام مخالفة تعرفها: السداد المبكر عادةً أرخص — راجع المبلغ وشروط الخصم على صفحة الدفع الرسمية أعلاه قبل أن تدفع.',
            'مخالفة لا تعرفها: لا تدفع لمجرّد إغلاقها.',
            'راجع تاريخها ومكانها أولاً؛ قد تكون على مالك سابق أو خطأ في اللوحة.',
            'بعت السيارة ولا تزال المخالفات تظهر: راجع تاريخ نقل الملكية لدى النوتر — المخالفات بعد النقل ليست عليك، وقبله عليك.',
        ],
        url: 'https://www.turkiye.gov.tr/emniyet-arac-plakasina-yazilan-ceza-sorgulama',
    },
    {
        id: 'sgk-hizmet-dokumu',
        title: 'احتساب/عرض أيام الخدمة في SGK (4A)',
        intro: 'تعرض الخدمة أيام العمل ومدة الخدمة المسجلة، وهي مفيدة لمتابعة وضعك التأميني وبيانات العمل (حسب تسجيلك في النظام).',
        howTo: 'اعرض كشف الخدمة وقم بتحميله إن كان متاحاً.',
        notes: [
            'الرابط الرسمي المباشر اسمها الرسمي «SGK Tescil ve Hizmet Dökümü / İşyeri Ünvan Listesi»: turkiye.gov.tr/sgk-tescil-ve-hizmet-dokumu ما الذي يظهر لك بالضبط الكشف يعرض أيام الخدمة المسجّلة و أسماء أماكن العمل التي جرى التصريح عنك فيها والفترات.',
            'وهذه الورقة ليست للاطلاع فقط — تُطلب في معاملات حقيقية: التقديم على الجنسية، إثبات الدخل في طلبات الإقامة، ومتابعة استحقاق التقاعد.',
            'أهم ما تتحقّق منه — وهو ما يغفله كثيرون فجوات في الأيام: شهر عملت فيه ولا يظهر يعني أن صاحب العمل لم يصرّح عنك عن تلك الفترة.',
            'هذا حقّ مالي وتأميني يضيع بصمتك.',
            'اسم منشأة لا تعرفه: يستوجب مراجعة فورية لمؤسسة الضمان الاجتماعي.',
            'الرقم الإجمالي: احفظ عدد الأيام؛ كثير من المعاملات تشترط حدّاً أدنى منها، وحسابه من الكشف أدقّ من التقدير بالذاكرة.',
            'إن وجدت نقصاً، اجمع ما يثبت العمل في تلك الفترة (عقد، إيصالات، شهود) قبل تقديم الشكوى — الشكوى بلا إثبات تُغلق سريعاً.',
        ],
        url: 'https://www.turkiye.gov.tr/4a-hizmet-dokumu',
    },
    {
        id: 'sgk-kayit-belgesi',
        title: 'الحصول على وثيقة تسجيل/قيد في SGK',
        intro: 'تُستخدم وثيقة قيد SGK في معاملات متعددة لإثبات أنك مسجل/تعمل ضمن النظام.',
        howTo: 'اطلب استخراج الوثيقة (إن كانت متاحة في حسابك).',
        notes: [
            'يمكنك استخراجها فوراً كوثيقة رسمية وطباعتها عند الحاجة.',
        ],
        url: 'https://turkiye.gov.tr/sosyal-guvenlik-kayit-belgesi-sorgulama',
    },
    {
        id: 'sirketlerim',
        title: 'الاستعلام عن الشركات التي تملكها أو شريك فيها أو تملك صلاحياتها',
        intro: 'تعرض الخدمة الشركات التي أنت مالك/شريك/مخوّل فيها.',
        howTo: 'اعرض قائمة الشركات المرتبطة بك وتفاصيل كل سجل حسب المتاح.',
        notes: [
            'مفيدة للتأكد من بياناتك التجارية وتوثيق علاقتك بالشركات عند الحاجة.',
        ],
        url: 'https://www.turkiye.gov.tr/gtb-mersis-sahibi-ortagi-yetkilisi-oldugum-ticari-isletme-veya-sirketler',
    },
    {
        id: 'surucu-basvuru-durum',
        title: 'الاستعلام عن طلب استخراج/تعديل شهادة القيادة التركية',
        intro: 'إذا قدمت طلب استخراج رخصة قيادة تركية أو تعديل بياناتها، تساعدك هذه الخدمة على متابعة حالة الطلب إلكترونياً ومعرفة المرحلة الحالية.',
        howTo: 'اعرض حالة الطلب وتفاصيل المرحلة الحالية.',
        url: 'https://turkiye.gov.tr/nvi-surucu-belgesi-basvuru-durum-sorgu',
    },
    {
        id: 'surucu-ceza-nokta-belgesi',
        title: 'استخراج مستند رسمي بنقاط المخالفات المرورية',
        intro: 'عدد نقاط رخصة القيادة التركية عادة 100 نقطة، وتُخصم نقاط عند ارتكاب مخالفات.',
        howTo: 'اطلب الوثيقة ثم قم بتحميلها وطباعتها عند الحاجة.',
        notes: [
            'تتيح هذه الخدمة استخراج وثيقة رسمية توضح نقاط المخالفات.',
        ],
        url: 'https://turkiye.gov.tr/emniyet-surucu-ceza-bilgisi-barkodlu-belge-sorgulama',
    },
    {
        id: 'tapu-harc',
        title: 'دفع/الاستعلام عن رسوم نقل الملكية عند شراء عقار',
        intro: 'عند شراء عقار قد تُطلب رسوم نقل الملكية.',
        howTo: 'اعرض الرسوم/البيانات ثم اتبع خطوات الدفع إن كانت متاحة.',
        notes: [
            'عبر الخدمة يمكنك الاطلاع على الرسوم وإتمام الدفع عندما تظهر لك بيانات الدفع والمتطلبات ضمن الصفحة الرسمية.',
        ],
        needs: ['قد تحتاج رقم/مرجع دفع (e‑Tahsilat) إن طُلب ضمن المعاملة.'],
        url: 'https://turkiye.gov.tr/tapu-harc-sorgulama',
    },
    {
        id: 'tapu-telefon-beyan',
        title: 'تسجيل رقم هاتفك لدى مديرية السجلات العقارية',
        intro: 'تسجيل رقم الهاتف يساعد الجهات الرسمية على التواصل مع صاحب العقار وإبلاغه بالتغييرات أو المتطلبات المتعلقة بالعقار عند الحاجة.',
        howTo: 'أدخل رقم الهاتف وبيانات التحقق المطلوبة ثم احفظ الطلب.',
        url: 'https://turkiye.gov.tr/tapu-telefon-beyan',
    },
    {
        id: 'tuketici-sikayet',
        title: 'تقديم شكوى إلى هيئة حماية المستهلك',
        intro: 'تركيا تملك آليات متقدمة لحماية المستهلك.',
        howTo: 'ابدأ شكوى جديدة ثم املأ البيانات المطلوبة.',
        notes: [
            'عبر هذه الخدمة يمكنك رفع شكوى حول المنتجات والخدمات وفتح ملف إلكتروني لمتابعة الإجراء دون مراجعة مكاتب متعددة.',
        ],
        needs: ['تفاصيل الشكوى (اسم الشركة/المنتج/التاريخ/المبلغ).', 'إثباتات إن وُجدت (فاتورة/صور/مراسلات).', 'فاتورة الشراء (Fiş/Fatura).', 'صور للمنتج المعيب.', 'صورة المحادثات مع البائع (إن وجدت).', 'شيفرة إي دولات.'],
        url: 'https://turkiye.gov.tr/tuketici-sikayeti-uygulamasi',
    },
    {
        id: 'vergi-borcu',
        title: 'الاستعلام عن المستحقات/الديون الضريبية الشخصية',
        intro: 'تعرض الخدمة المستحقات الضريبية المتوجبة عليك، وقد تُظهر الديون المتأخرة بسبب عدم السداد في الوقت المحدد حسب البيانات المسجلة.',
        howTo: 'اعرض قائمة المستحقات/الديون وتفاصيلها.',
        notes: [
            'أين تجدها رسمياً الاستعلام عن الضرائب والرسوم والغرامات يتبع رئاسة إدارة الإيرادات (Gelir İdaresi Başkanlığı) ، ومدخلها الرسمي على البوابة: turkiye.gov.tr/vergi-harc-ve-cezalar-hizmetleri — «Vergi, Harç ve Cezalar» ومنها تصل إلى خدمات الاستعلام والدفع، ومنها خدمة دين المخالفات المرورية: استعلام ودفع دين المخالفات المرورية .',
            'مَن يظهر عليه دين ضريبي أصلاً؟',
            'الدين الضريبي يظهر غالباً على مَن له نشاط أو التزام مسجّل: صاحب سجل تجاري أو شركة ، مالك عقار أو مركبة (ضرائب دورية)، أو مَن ترتّبت عليه غرامة .',
            'إن كنت موظفاً براتب فحسب، الغالب ألا يظهر شيء — وظهور صفر نتيجة صحيحة لا خلل.',
            'لماذا لا يُترك الدين معلّقاً الدين الضريبي المتأخر يتراكم عليه فرق تأخير ، فالمبلغ اليوم أقلّ منه بعد أشهر.',
            'وجود دين قد يعطّل معاملات مرتبطة به (نقل ملكية، تجديد سجل).',
            'ادفع من القناة الرسمية فقط.',
            'لا تدفع لوسيط يطلب بياناتك مقابل «تسوية» — البوابة تتيح الدفع مباشرة.',
            'إن ظهر دين لا تعرف مصدره، لا تسدّده قبل معرفة سببه: راجع المركبات المسجّلة باسمك و مخالفات اللوحة — كثير من الديون «المجهولة» مصدرها مركبة أو مخالفة.',
        ],
        url: 'https://www.turkiye.gov.tr/gib-vergi-borcu-sorgu',
    },
    {
        id: 'webtapu',
        title: 'الدخول إلى نظام WebTapu لإدارة معاملات العقارات',
        intro: 'يتيح WebTapu إدارة معاملات مرتبطة بالعقارات المسجلة باسمك (بيع/حجز/رهن/إجراءات متنوعة) وفق صلاحيات الحساب.',
        howTo: 'اختر الخدمة المطلوبة داخل WebTapu واتبع التعليمات.',
        notes: [
            'بعض الإجراءات تحتاج موافقات أو مستندات إضافية تظهر داخل النظام.',
        ],
        url: 'https://turkiye.gov.tr/tkgm-web-tapu',
    },
    {
        id: 'yol-izin',
        title: 'استخراج إذن السفر (Yol İzin) للاجئين',
        intro: 'إذن السفر تصريح رسمي يسمح بالسفر بين الولايات داخل الطلب ستحدد سبب السفر والولاية وتواريخ الذهاب والعودة وتُطلب مرفقات تثبت السبب.',
        howTo: 'اضغط “Yeni başvuru” (طلب جديد).',
        needs: ['تفاصيل السفر (سبب السفر، الولاية، تاريخ الذهاب والعودة).', 'مرفقات تثبت سبب السفر'],
        url: 'https://www.turkiye.gov.tr/goc-idaresi-yol-izin-belge-basvurusu',
    },
];

/** Old /article/<slug> → anchor, for next.config.ts and any stale link. */
export const EDEVLET_LEGACY_SLUGS: Record<string, string> = {
    'edevlet-adima-tescilli-arac': 'adima-tescilli-arac',
    'edevlet-adli-sicil-kaydi': 'adli-sicil-kaydi',
    'edevlet-adres-degisikligi-bildirimi': 'adres-degisikligi-bildirimi',
    'edevlet-aile-hekim-bilgisi-sorgulama': 'aile-hekim-bilgisi-sorgulama',
    'edevlet-aracimin-cekildigi-otopark-bilgisi-sorgulama': 'aracimin-cekildigi-otopark-bilgisi-sorgulama',
    'edevlet-borc-durumu-sorgulama': 'borc-durumu-sorgulama',
    'edevlet-cimer-basvuru': 'cimer-basvuru',
    'edevlet-ck-bogazici-elektrik': 'ck-bogazici-elektrik',
    'edevlet-dava-dosyasi-sorgulama': 'dava-dosyasi-sorgulama',
    'edevlet-dogum-raporu': 'dogum-raporu',
    'edevlet-doviz': 'doviz',
    'edevlet-e-nabiz': 'e-nabiz',
    'edevlet-evlenme-ehliyet': 'evlenme-ehliyet',
    'edevlet-ikamet-kisisel-bilgi': 'ikamet-kisisel-bilgi',
    'edevlet-imei-sorgulama': 'imei-sorgulama',
    'edevlet-iski-su': 'iski-su',
    'edevlet-mhrs': 'mhrs',
    'edevlet-mobil-hat-sorgulama': 'mobil-hat-sorgulama',
    'edevlet-nvi-nufus-kayit-ornegi': 'nvi-nufus-kayit-ornegi',
    'edevlet-nvi-yerlesim-yeri': 'nvi-yerlesim-yeri',
    'edevlet-operator-debt': 'operator-debt',
    'edevlet-plaka-ceza': 'plaka-ceza',
    'edevlet-sgk-hizmet-dokumu': 'sgk-hizmet-dokumu',
    'edevlet-sgk-kayit-belgesi': 'sgk-kayit-belgesi',
    'edevlet-sirketlerim': 'sirketlerim',
    'edevlet-surucu-basvuru-durum': 'surucu-basvuru-durum',
    'edevlet-surucu-ceza-nokta-belgesi': 'surucu-ceza-nokta-belgesi',
    'edevlet-tapu-harc': 'tapu-harc',
    'edevlet-tapu-telefon-beyan': 'tapu-telefon-beyan',
    'edevlet-tuketici-sikayet': 'tuketici-sikayet',
    'edevlet-vergi-borcu': 'vergi-borcu',
    'edevlet-webtapu': 'webtapu',
    'edevlet-yol-izin': 'yol-izin',
};
