# قائمة متابعة تدقيق «دليل المواقف» — 2026-07-30

ما لم يدخل ملف التصحيح `sql/2026-07-30_consultant_audit_full.sql` وسببه.

## ملاحظات أسقطها التفنيد (الصف الأصلي صحيح — لا تغيير)

- `protection-status-2026` / `cost` — الادّعاء المرفوض: تكاليف الإقامة السياحية تبدأ من 3,000+ ليرة سنوياً.
- `syrian-return-code` / `title` — الادّعاء المرفوض: إزالة كود V-87 / كود العودة
- `daily-bank-open` / `steps[0]` — الادّعاء المرفوض: استخرج رقماً ضريبياً (Vergi Numarası) إن لم يكن لديك — مجاني من أي دائرة ضرائب.
- `tourist-health-insurance` / `steps[0]` — الادّعاء المرفوض: حاملو الإقامة أكثر من سنة: يمكنهم التسجيل في التأمين الحكومي GSS

## تصحيحها يحتاج قراراً بشرياً (النص المقترح غير قابل للنشر كما هو)

- `syrian-fix-address` / `title` [medium] — إزالة كود V-160 (تجميد العنوان)
- `housing-eviction` / `cost` [medium] — الدفاع عن حقوقك: رسوم المحكمة ~2,000-4,000 ليرة + أتعاب محامٍ 10,000-25,000 ليرة. المحكمة 
- `housing-rent-increase` / `cost` [medium] — شكوى Tüketici Hakem Heyeti: مجانية. دعوى المحكمة: رسوم ~1,500-3,000 ليرة + أتعاب محامٍ (اخ
- `housing-tahliye-undertaking` / `cost` [medium] — الاعتراض في İcra: رسوم بسيطة. الدعوى في المحكمة: 2,000-4,000 ليرة + محامٍ.

## متوسطة/منخفضة لم تُفنَّد بعد (وجدها المدقّق ولم تمرّ على مفنِّد مستقل)

من دفعات daily-2 / worker / student / tourist / other فقط — البقية فُنّدت.

- [medium|FALSE] `daily-internet-telecom` / `steps[1]` — إذا لم تُحل خلال 15 يوماً، قدّم شكوى في BTK (هيئة تنظيم الاتصالات)
- [medium|MISSI] `daily-internet-telecom` / `tip` — قبل توقيع عقد جديد، اسأل عن مدة الالتزام (Taahhüt). العقود بالتزام 24 شهراً تتضم
- [medium|FALSE] `daily-family-doctor-change` / `legal` — لا يوجد قيد قانوني على عدد مرات التغيير، لكن بعض الولايات تضع حداً عملياً (مرة ك
- [medium|FALSE] `daily-family-doctor-change` / `description` — يحق لك تغيير طبيب العائلة مرة واحدة كل فترة (حسب لوائح الولاية).
- [medium|FALSE] `daily-goc-appointment` / `steps[1]` — نظام Randevu (randevu.goc.gov.tr أو عبر ALO 157): استخدمه لـ تحديث بيانات، استفس
- [medium|FALSE] `daily-goc-appointment` / `steps[3]` — لحجز Randevu عام: اتصل على 157 أو استخدم بوابة الحجز الإلكتروني. حدد نوع المعامل
- [medium|STALE] `daily-mhrs-booking` / `cost` — الكشف في المشفى الحكومي: 10-30 ليرة مشاركة (Katılım payı) مع SGK.
- [medium|UNVER] `daily-mhrs-booking` / `cost` — بدون تأمين: تكلفة الكشف كاملة (500-2,000 ليرة).
- [medium|OVERC] `daily-mhrs-booking` / `description` — الشرط الأساسي: تأمين صحي ساري المفعول (SGK أو خاص معتمد).
- [medium|FALSE] `daily-fast` / `description` — لكن له حدود يومية تختلف حسب البنك.
- [medium|DANGE] `daily-fast` / `steps[2]` — إذا كان المبلغ كبيراً: اسأل البنك عن الطريقة الأنسب (EFT/حوالة/تقسيم دفعات) لتجن
- [medium|FALSE] `daily-lost-driving-license` / `steps[3]` — دفع الرسوم إن طُلب.
- [medium|MISSI] `daily-lost-driving-license` / `cost` — رسوم/ضرائب تختلف.
- [low|FALSE] `daily-family-doctor-change` / `steps[1]` — للتغيير إلكترونياً: E-Devlet → Aile Hekimi Değiştirme (إن كان متاحاً في ولايتك).
- [medium|FALSE] `daily-crypto` / `steps[1]` — لا تخلط بين “تداول” و“دفع”؛ قواعد الدفع قد تكون مختلفة ومقيّدة.
- [low|FALSE] `daily-fast` / `steps[0]` — تحقق من تطبيق بنكك: هل يدعم FAST؟ وما الحد اليومي؟
- [low|UNVER] `daily-mhrs-booking` / `tip` — (تُفتح مواعيد جديدة يومياً الساعة 08:00)
- [medium|OVERC] `worker-rights-violation` / `steps[4]` — يمكنك المطالبة بالراتب المتأخر + تعويض الإنهاء غير العادل (Kıdem + İhbar Tazmina
- [medium|OVERC] `worker-rights-violation` / `cost` — الوساطة: مجانية للعامل | المحكمة: رسوم قليلة مع إمكانية الإعفاء
- [medium|OVERC] `work-permit-employee` / `docs[0]` — الكملك المسجل في نفس ولاية العمل
- [medium|MISSI] `work-permit-employee` / `tip` — تأكد دورياً من أن صاحب العمل يدفع التأمينات عبر E-Devlet (سجل SGK).
- [medium|MISSI] `worker-freelance-rules` / `steps[0]` — تحتاج إذن عمل ساري المفعول حتى للعمل الحر
- [medium|FALSE] `work-sgk` / `legal` — تعديلات قانون الضمان الاجتماعي (SGK) لعام 2026 ولوائح GSS للأجانب.
- [medium|STALE] `company-setup` / `steps[3]` — أنجز التوقيعات/النوتر (تواقيع المدير/مدراء) ثم تابع إجراءات السجل التجاري/الغرفة
- [medium|MISSI] `worker-bagkur` / `cost` — اشتراك شهري يتغير حسب السنة والفئة.
- [medium|OVERC] `work-permit-company` / `description` — هذا المسار مناسب لمن لديه نشاط تجاري حقيقي ويريد إذن عمل كمدير/مالك. التحدي الأس
- [medium|OVERC] `worker-meal-card` / `tip` — لا تفترض أنه حق تلقائي للجميع. هو “ميزة” شائعة لكنها تعتمد على العقد.
- [low|STALE] `work-permit-cost` / `title` — تكلفة إذن العمل 2025 (تقريباً وما الذي يُدفع فعلاً)
- [medium|OVERC] `student-residence` / `cost` — الطلاب المسجّلون رسمياً معفون من رسوم الإقامة الشهرية (Harç) — يدفعون فقط بطاقة 
- [medium|MISSI] `student-residence` / `description` — إقامة الطالب غالباً أقوى وأسهل من السياحية لأنها مبنية على قبول/تسجيل تعليمي. نج
- [medium|MISSI] `student-open-highschool` / `cost` — رسوم رمزية/كتب حسب النظام.
- [medium|FALSE] `student-mavi-diploma` / `description` — هي ملحق للدبلوم (Diploma Supplement) تصدره بعض الجامعات لتسهيل فهم الشهادة دوليا
- [medium|FALSE] `student-mavi-diploma` / `steps[1]` — تحقق إن كانت تصدر مجاناً أم برسوم، وما آلية الطلب.
- [medium|FALSE] `student-mavi-diploma` / `cost` — حسب الجامعة.
- [medium|UNVER] `student-dormitory` / `cost` — KYK: 1,500-3,000 ليرة/شهر | خاص: 4,000-15,000 ليرة/شهر
- [medium|OVERC] `tourist-extension` / `steps[5]` — خلال فترة الانتظار تبقى إقامتك القديمة سارية المفعول قانونياً حتى صدور القرار.
- [medium|MISSI] `tourist-extension` / `docs` — وصل دفع الرسوم
- [low|FALSE] `tourist-extension` / `docs[4]` — صور شخصية بيومترية (4 صور)
- [low|FALSE] `tourist-new` / `docs[1]` — صور شخصية بيومترية (4 صور، خلفية بيضاء)
- [medium|FALSE] `tourist-overstay` / `steps[4]` — غادر تركيا خلال المهلة المحددة (عادة 7-30 يوماً بعد التبليغ).
- [medium|FALSE] `tourist-health-insurance` / `docs[1]` — تقرير الدخل من SGK
- [low|FALSE] `tourist-lease-contract` / `steps[4]` — سجّل عنوانك في النفوس خلال 20 يوماً من الانتقال
- [medium|MISSI] `emergency-domestic-violence` / `tip` — أمر الحماية يصدر حتى لو لم يكن لديك إقامة رسمية. يمكنك أيضاً التقديم عبر UYAP أو
- [medium|OVERC] `family-child-vaccination` / `tip` — التطعيمات مجانية لجميع الأطفال في تركيا بغض النظر عن الجنسية أو وضع الإقامة.
- [medium|UNVER] `family-pregnancy-birth` / `cost` — الولادة الحكومية: مجانية مع GSS | بدون تأمين: 5,000-15,000 ليرة
- [medium|UNVER] `family-pregnancy-birth` / `steps[1]` — متابعة الحمل مجانية في المشافي الحكومية (حتى بدون تأمين للحوامل)
- [medium|OVERC] `family-pregnancy-birth` / `tip` — حتى لو لم يكن لديك تأمين صحي، لا يحق لأي مشفى حكومي رفض الحامل عند الولادة.
- [medium|FABRI] `emergency-airport-denied` / `legal` — قانون الأجانب والحماية الدولية رقم 6458 — المادة 9
- [medium|UNVER] `investor-property-buying-process` / `cost` — 4% رسوم طابو + ~3,000-5,000 ليرة تقييم + رسوم نوتر
- [medium|UNVER] `investor-property-dispute` / `cost` — الوساطة: 2,000-5,000 ليرة | المحكمة: حسب قيمة النزاع
- [medium|OVERC] `investor-tax-obligations` / `tip` — إذا كنت لا تقيم في تركيا وتؤجر عقارك، عليك تعيين ممثل ضريبي (Vergi Temsilcisi). 

الإحصاء: {'medium': 44, 'low': 7}