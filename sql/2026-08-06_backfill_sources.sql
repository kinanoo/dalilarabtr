-- ============================================================================
-- إسناد سبع عشرة صفحة كانت مسنَدة في كل مكان إلا في حقل المصدر (2026-08-06)
-- ============================================================================
-- هذه ليست تمريرة موضوع. هذه العمود الذي ظلّت التمريرات التسع السابقة تصطدم
-- به: صفحات على حقّ ولا يمكن التحقّق منها.
--
-- ثلاث وأربعون صفحة منشورة بحقل مصدر فارغ. أربع عشرة منها **تستشهد بالقوانين
-- التركية برقمها ومادّتها داخل المتن**: 6458 للأجانب والحماية الدولية، و5271
-- لأصول المحاكمات الجزائية، و2577 للمحاكمات الإدارية، و4857 للعمل، و6305
-- للتأمين ضد الكوارث، و2644/6302 للطابو، و5490 لخدمات النفوس، ولائحة الحماية
-- المؤقتة. المحتوى مسنَد. الحقل فارغ. فجوة تسجيل لا فجوة تحقّق.
--
-- والعلاج لا يخترع شيئاً: كل سطر مصدر أدناه مركَّب من الاستشهادات التي تقولها
-- الصفحة نفسها — ولهذا يمكن توليد هذا الملف بدل كتابته.
--
-- وبين الأربع عشرة تقع أثقل ثلاثة أدلّة قانونية على الموقع: 5,735 كلمة عن
-- حقوق المُرحَّل، و5,315 عمّا يجري في المخفر، و4,139 عن مراكز الترحيل. خمسة
-- عشر ألف كلمة عن التوقيف والترحيل، كلٌّ منها يذكر أرقام الموادّ في متنه، ولا
-- واحدة تقولها في الحقل الذي يقرأه القارئ ومحرّك البحث.
--
-- وثلاث صفحات عولجت باليد لأنّها لا تستشهد بشيء أصلاً وتحمل قراءات حقيقية:
--
--   • trader-leave-work-permit-turkey (385 قراءة) — أكثر صفحة بلا مصدر قراءةً
--     على الموقع. دعواها المركزية أنّ حامل الحماية المؤقتة الذي يغادر تركيا
--     بلا إذن مسبق قد يفقد بطاقته. الدعوى صحيحة والنتيجة كاملة، فصارت تسمّي
--     لائحة الحماية المؤقتة ومديرية الهجرة في الولاية حيث يُقدَّم الطلب فعلاً.
--     ولم أُثبت رقم مادّة، لأنّني لم أقرأ واحدة.
--   • kizilay-card-application (177) — معايير الضعف هي معايير البرنامج نفسه،
--     ينفّذه الهلال الأحمر التركي مع أوقاف التضامن الاجتماعي.
--   • return-code-v87 (98) — مهلة الستّين يوماً التي تحذّر منها هي مهلة دعوى
--     الإلغاء في القانون 2577. أمّا نطاق أجور المحاماة «30,000-50,000 ليرة»
--     فغير مسنَد وغير قابل للإسناد — الأجور لا تُنشر — فتبقى الصفحة بالتحذير
--     ويسقط الرقم المخترَع، وهي القاعدة نفسها المطبَّقة على رسوم القنصلية
--     والتأشيرات في هذا التدقيق.
--
-- آمن لإعادة التشغيل: كل تحديث مشروط بأن يكون الحقل فارغاً.
-- ============================================================================

-- ── مركَّبة من استشهادات المتن نفسه ─────────────────────────────────────
-- children-passport-syria                          38 قراءة
UPDATE articles SET source = 'قانون الأجانب والحماية الدولية رقم 6458، وقانون خدمات النفوس رقم 5490، ولائحة الحماية المؤقتة (Geçici Koruma Yönetmeliği) — كما هي مذكورة بموادّها في متن هذه الصفحة.', last_update = CURRENT_DATE
WHERE slug = 'children-passport-syria' AND coalesce(trim(source), '') = '';

-- deportation-rights                               37 قراءة
UPDATE articles SET source = 'قانون الأجانب والحماية الدولية رقم 6458، وقانون المحاكمات الإدارية رقم 2577، ولائحة الحماية المؤقتة (Geçici Koruma Yönetmeliği) — كما هي مذكورة بموادّها في متن هذه الصفحة.', last_update = CURRENT_DATE
WHERE slug = 'deportation-rights' AND coalesce(trim(source), '') = '';

-- kimlik-renewal-documents                         34 قراءة
UPDATE articles SET source = 'لائحة الحماية المؤقتة (Geçici Koruma Yönetmeliği) — كما هي مذكورة بموادّها في متن هذه الصفحة. والجهات الرسمية: goc.gov.tr.', last_update = CURRENT_DATE
WHERE slug = 'kimlik-renewal-documents' AND coalesce(trim(source), '') = '';

-- lost-passport-turkey                             33 قراءة
UPDATE articles SET source = 'قانون الأجانب والحماية الدولية رقم 6458، ولائحة الحماية المؤقتة (Geçici Koruma Yönetmeliği) — كما هي مذكورة بموادّها في متن هذه الصفحة.', last_update = CURRENT_DATE
WHERE slug = 'lost-passport-turkey' AND coalesce(trim(source), '') = '';

-- home-subscriptions-turkey-2026                   29 قراءة
UPDATE articles SET source = 'قانون التأمين الإجباري ضد الكوارث رقم 6305 — كما هي مذكورة بموادّها في متن هذه الصفحة. والجهات الرسمية: dask.gov.tr، turkiye.gov.tr.', last_update = CURRENT_DATE
WHERE slug = 'home-subscriptions-turkey-2026' AND coalesce(trim(source), '') = '';

-- kimlik-renewal-steps                             29 قراءة
UPDATE articles SET source = 'قانون الأجانب والحماية الدولية رقم 6458، ولائحة الحماية المؤقتة (Geçici Koruma Yönetmeliği) — كما هي مذكورة بموادّها في متن هذه الصفحة. والجهات الرسمية: goc.gov.tr.', last_update = CURRENT_DATE
WHERE slug = 'kimlik-renewal-steps' AND coalesce(trim(source), '') = '';

-- lost-kimlik-replacement                          25 قراءة
UPDATE articles SET source = 'قانون الأجانب والحماية الدولية رقم 6458، وقانون خدمات النفوس رقم 5490، ولائحة الحماية المؤقتة (Geçici Koruma Yönetmeliği) — كما هي مذكورة بموادّها في متن هذه الصفحة.', last_update = CURRENT_DATE
WHERE slug = 'lost-kimlik-replacement' AND coalesce(trim(source), '') = '';

-- detention-center-rights                          18 قراءة
UPDATE articles SET source = 'قانون الأجانب والحماية الدولية رقم 6458، وقانون أصول المحاكمات الجزائية رقم 5271، وقانون المحاكمات الإدارية رقم 2577، ولائحة الحماية المؤقتة (Geçici Koruma Yönetmeliği) — كما هي مذكورة بموادّها في متن هذه الصفحة.', last_update = CURRENT_DATE
WHERE slug = 'detention-center-rights' AND coalesce(trim(source), '') = '';

-- buying-property-turkey-2026                      17 قراءة
UPDATE articles SET source = 'قانون الطابو رقم 2644، والقانون رقم 6302 المعدِّل لقانون الطابو، وقانون الجنسية التركية رقم 5901 — كما هي مذكورة بموادّها في متن هذه الصفحة. والجهات الرسمية: dask.gov.tr، goc.gov.tr، invest.gov.tr، istanbul.gov.tr.', last_update = CURRENT_DATE
WHERE slug = 'buying-property-turkey-2026' AND coalesce(trim(source), '') = '';

-- worker-rights-turkey-2026                        17 قراءة
UPDATE articles SET source = 'قانون العمل رقم 4857 — كما هي مذكورة بموادّها في متن هذه الصفحة. والجهات الرسمية: cimer.gov.tr، mevzuat.gov.tr، sgk.gov.tr.', last_update = CURRENT_DATE
WHERE slug = 'worker-rights-turkey-2026' AND coalesce(trim(source), '') = '';

-- police-station-rights                            14 قراءة
UPDATE articles SET source = 'قانون الأجانب والحماية الدولية رقم 6458، وقانون أصول المحاكمات الجزائية رقم 5271، وقانون المحاكمات الإدارية رقم 2577، ولائحة الحماية المؤقتة (Geçici Koruma Yönetmeliği) — كما هي مذكورة بموادّها في متن هذه الصفحة.', last_update = CURRENT_DATE
WHERE slug = 'police-station-rights' AND coalesce(trim(source), '') = '';

-- lost-residence-card                               7 قراءة
UPDATE articles SET source = 'قانون الأجانب والحماية الدولية رقم 6458، ولائحة الحماية المؤقتة (Geçici Koruma Yönetmeliği) — كما هي مذكورة بموادّها في متن هذه الصفحة.', last_update = CURRENT_DATE
WHERE slug = 'lost-residence-card' AND coalesce(trim(source), '') = '';

-- professions-foreigners-turkey-2026                6 قراءة
UPDATE articles SET source = 'لائحة الحماية المؤقتة (Geçici Koruma Yönetmeliği) — كما هي مذكورة بموادّها في متن هذه الصفحة. والجهات الرسمية: calismaizni.gov.tr، csgb.gov.tr، goc.gov.tr، meb.gov.tr.', last_update = CURRENT_DATE
WHERE slug = 'professions-foreigners-turkey-2026' AND coalesce(trim(source), '') = '';

-- ── مكتوبة باليد: لا استشهاد داخلياً ────────────────────────────────────
-- trader-leave-work-permit-turkey                 385 قراءة
UPDATE articles SET source = 'لائحة الحماية المؤقتة (Geçici Koruma Yönetmeliği) ورئاسة إدارة الهجرة (goc.gov.tr) — طلبات إذن السفر لحاملي الحماية المؤقتة تُقدَّم إلى مديرية الهجرة أو الولاية في محل التسجيل، وهي الجهة التي تمنح الإذن المسبق. والوثائق المذكورة هنا بحسب ما تطلبه الولايات عملياً، وتختلف بينها — أكّدها في ولايتك قبل التقديم.', last_update = CURRENT_DATE
WHERE slug = 'trader-leave-work-permit-turkey' AND coalesce(trim(source), '') = '';

-- kizilay-card-application                        177 قراءة
UPDATE articles SET source = 'برنامج بطاقة الهلال الأحمر (Kızılaykart / SUY) الذي ينفّذه الهلال الأحمر التركي (Türk Kızılay) بالتعاون مع أوقاف التضامن الاجتماعي (SYDV) التابعة لوزارة الأسرة والخدمات الاجتماعية. ومعايير الاستحقاق المذكورة هي معايير الضعف المعتمدة في البرنامج نفسه.', last_update = CURRENT_DATE
WHERE slug = 'kizilay-card-application' AND coalesce(trim(source), '') = '';

-- return-code-v87                                  98 قراءة
UPDATE articles SET source = 'قانون المحاكمات الإدارية رقم 2577 — مهلة رفع دعوى الإلغاء أمام المحكمة الإدارية ستّون يوماً من التبليغ. وأصل الكود ورفعه من اختصاص رئاسة إدارة الهجرة (goc.gov.tr).', last_update = CURRENT_DATE
WHERE slug = 'return-code-v87' AND coalesce(trim(source), '') = '';

-- ── ورقم أجور محاماة لا يمكن إسناده ─────────────────────────────────────
UPDATE articles SET details = replace(details, 'أجور المحاماة قد تتجاوز 30,000 - 50,000 ليرة حسب تعقيد القضية.', 'أجور المحاماة غير منشورة في أي تعرفة رسمية وتختلف بين محامٍ وآخر وبحسب تعقيد القضية — اطلب عرضاً مكتوباً قبل التوكيل، ولا تعتمد على رقم متداول.'), last_update = CURRENT_DATE
WHERE slug = 'return-code-v87' AND details LIKE '%30,000 - 50,000%';

-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — الأول يجب أن ينزل بعدد الصفحات بلا مصدر، والثاني صفر
SELECT count(*) AS صفحات_بلا_مصدر
FROM articles WHERE status = 'approved' AND coalesce(trim(source), '') = '';

SELECT slug FROM articles
WHERE status = 'approved' AND coalesce(trim(source), '') = ''
  AND slug IN ('children-passport-syria', 'deportation-rights', 'kimlik-renewal-documents', 'lost-passport-turkey', 'home-subscriptions-turkey-2026', 'kimlik-renewal-steps', 'lost-kimlik-replacement', 'detention-center-rights', 'buying-property-turkey-2026', 'worker-rights-turkey-2026', 'police-station-rights', 'lost-residence-card', 'professions-foreigners-turkey-2026');

SELECT slug FROM articles WHERE details LIKE '%30,000 - 50,000%';
