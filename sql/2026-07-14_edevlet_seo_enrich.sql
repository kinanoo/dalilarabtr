-- ============================================================================
-- 2026-07-14 — e-Devlet articles SEO enrichment (33 articles)
-- seo_title / seo_description / seo_keywords rewritten to capture how people
-- actually search: colloquial Arabic («كيف اشيك نفوس», «اطلع ورقة عنوان»)
-- + Turkish terms (yerleşim yeri, adli sicil, MHRS...) + formal Arabic.
-- Titles have NO brand suffix (the layout template appends it).
-- Idempotent: plain UPDATEs by slug. Run in Supabase SQL editor.
-- ============================================================================

BEGIN;

UPDATE articles SET
  seo_title = 'تفعيل ونقل خطوط الهاتف للأجانب بموافقتك عبر e-Devlet (BTK)',
  seo_description = 'من الآن لا يُفعَّل أي خط هاتف جديد باسمك ولا يُنقَل رقمك إلا بموافقتك الرقمية عبر e-Devlet. اعرف كيف توافق على طلبات خطوط الأجانب (e-Kayıt Onay) من BTK.',
  seo_keywords = ARRAY['تفعيل خط هاتف تركيا', 'نقل الرقم تركيا', 'Numara Taşıma', 'BTK e-Kayıt', 'e-Kayıt Başvurusu Onay', 'كيف افعل خط جديد تركيا', 'خط باسمي بدون علمي', 'موافقة فتح خط للاجانب', 'حماية الكملك من الخطوط', 'Onayla', 'e-Devlet', 'turkiye.gov.tr', 'خط هاتف للسوريين تركيا', 'Turkcell Vodafone Türk Telekom']::text[]
WHERE slug = 'btk-ekayit-foreigners-phone-line-2026';

UPDATE articles SET
  seo_title = 'استخراج سند الإقامة (Yerleşim Yeri) من e-Devlet',
  seo_description = 'كيف تطلع سند الإقامة ووثيقة العنوان (Yerleşim Yeri / İkametgah) من e-Devlet وتطبعها. «كيف اطلع ورقة عنوان» للمدرسة والبنك والإقامة عبر turkiye.gov.tr.',
  seo_keywords = ARRAY['سند إقامة تركيا', 'وثيقة العنوان', 'كيف اطلع ورقة عنوان', 'ورقة سكن', 'ikametgah', 'yerleşim yeri belgesi', 'سند اقامة e-Devlet', 'اثبات عنوان', 'e-Devlet', 'turkiye.gov.tr', 'وثيقة سكن للمدرسة', 'adres belgesi']::text[]
WHERE slug = 'edevlet-nvi-yerlesim-yeri';

UPDATE articles SET
  seo_title = 'استخراج وثيقة عدم محكومية (Adli Sicil) من e-Devlet',
  seo_description = 'كيف تطلع وثيقة لا حكم عليه / خلو السوابق (Adli Sicil Kaydı) وتحمّلها فوراً من e-Devlet. «كيف اطلع ورقة عدم محكومية» للجهات الرسمية على turkiye.gov.tr.',
  seo_keywords = ARRAY['وثيقة عدم محكومية', 'خلو السوابق تركيا', 'كيف اطلع ورقة عدم محكومية', 'لا حكم عليه', 'adli sicil kaydı', 'adli sicil belgesi', 'e-Devlet', 'turkiye.gov.tr', 'ورقة السوابق', 'شهادة حسن سيرة', 'سجل عدلي', 'adli sicil']::text[]
WHERE slug = 'edevlet-adli-sicil-kaydi';

UPDATE articles SET
  seo_title = 'التحقق من رقم IMEI للجوال عبر e-Devlet',
  seo_description = 'كيف تتحقق من حالة جهازك عبر رقم IMEI (15 خانة) على e-Devlet. «كيف اشيك IMEI الجوال» و«جهازي مسجّل أو لا» خطوة بخطوة على turkiye.gov.tr.',
  seo_keywords = ARRAY['فحص IMEI تركيا', 'رقم IMEI الجوال', 'كيف اشيك imei', 'تسجيل الجوال تركيا', 'imei sorgulama', 'imei kayıt', 'e-Devlet', 'turkiye.gov.tr', 'جهاز مسجل', 'التحقق من الايمي', 'هاتف مسجل تركيا', 'imei numarası']::text[]
WHERE slug = 'edevlet-imei-sorgulama';

UPDATE articles SET
  seo_title = 'استخراج وثيقة التسجيل في SGK عبر e-Devlet',
  seo_description = 'كيف تطلع وثيقة قيد وتسجيل التأمينات الاجتماعية (SGK Kayıt Belgesi) فوراً من e-Devlet. «كيف اطلع ورقة SGK» لإثبات التسجيل خطوة بخطوة على turkiye.gov.tr.',
  seo_keywords = ARRAY['وثيقة SGK', 'تسجيل التأمينات الاجتماعية', 'كيف اطلع ورقة SGK', 'اثبات قيد SGK', 'sgk kayıt belgesi', 'sgk tescil', 'e-Devlet', 'turkiye.gov.tr', 'وثيقة تسجيل التامينات', 'ورقة سجق', 'اثبات عمل تركيا', 'sgk belgesi']::text[]
WHERE slug = 'edevlet-sgk-kayit-belgesi';

UPDATE articles SET
  seo_title = 'الاستعلام عن مخالفات سيارتك المرورية عبر e-Devlet',
  seo_description = 'كيف تشيّك المخالفات المرورية على لوحة سيارتك (plaka ceza) وقيمتها عبر e-Devlet. «كيف اشيك مخالفات سيارتي» و«شو علي مخالفات» على turkiye.gov.tr.',
  seo_keywords = ARRAY['مخالفات مرورية تركيا', 'مخالفات السيارة', 'كيف اشيك مخالفات سيارتي', 'غرامات المرور', 'plaka ceza sorgulama', 'trafik cezası', 'e-Devlet', 'turkiye.gov.tr', 'شو علي مخالفات', 'مخالفة لوحة السيارة', 'دفع المخالفات', 'araç ceza']::text[]
WHERE slug = 'edevlet-plaka-ceza';

UPDATE articles SET
  seo_title = 'عرض أيام الخدمة والتأمين SGK 4A عبر e-Devlet',
  seo_description = 'كيف تعرض مدة خدمتك وأيام عملك المسجلة في التأمينات (SGK 4A Hizmet Dökümü) عبر e-Devlet. «كيف اشوف أيام السجق» و«مدة تأميني» على turkiye.gov.tr.',
  seo_keywords = ARRAY['ايام الخدمة SGK', 'تأمين 4A تركيا', 'كيف اشوف ايام السجق', 'كشف الخدمة', '4a hizmet dökümü', 'sgk hizmet dökümü', 'e-Devlet', 'turkiye.gov.tr', 'مدة التأمين', 'ايام العمل المسجلة', 'سجل التامينات', 'sgk gün sorgulama']::text[]
WHERE slug = 'edevlet-sgk-hizmet-dokumu';

UPDATE articles SET
  seo_title = 'تقديم شكوى أو طلب عبر CİMER من e-Devlet',
  seo_description = 'كيف تقدّم بلاغاً أو طلباً رسمياً لرئاسة الجمهورية عبر منصة CİMER من e-Devlet وتتابع الرد. «كيف اقدّم شكوى حكومية» خطوة بخطوة على turkiye.gov.tr.',
  seo_keywords = ARRAY['شكوى CİMER', 'تقديم طلب حكومي تركيا', 'كيف اقدم شكوى حكومية', 'بلاغ رئاسة الجمهورية', 'cimer başvuru', 'cimer شكوى', 'e-Devlet', 'turkiye.gov.tr', 'شكوى رسمية تركيا', 'طلب حكومي الكتروني', 'متابعة شكوى cimer', 'تظلم حكومي']::text[]
WHERE slug = 'edevlet-cimer-basvuru';

UPDATE articles SET
  seo_title = 'متابعة حالة طلب رخصة القيادة التركية عبر e-Devlet',
  seo_description = 'كيف تتابع حالة طلب استخراج أو تعديل رخصة القيادة (sürücü belgesi başvuru) عبر e-Devlet. «وين وصلت رخصتي» و«حالة طلب الرخصة» خطوة بخطوة على turkiye.gov.tr.',
  seo_keywords = ARRAY['حالة طلب رخصة القيادة', 'رخصة قيادة تركيا', 'وين وصلت رخصتي', 'متابعة طلب الرخصة', 'sürücü belgesi başvuru durum', 'ehliyet başvuru', 'e-Devlet', 'turkiye.gov.tr', 'تعديل رخصة القيادة', 'استخراج رخصة', 'حالة الطلب', 'ehliyet durumu']::text[]
WHERE slug = 'edevlet-surucu-basvuru-durum';

UPDATE articles SET
  seo_title = 'خدمات ماء إسطنبول (İSKİ) عبر e-Devlet',
  seo_description = 'كيف توصل لخدمات ماء إسطنبول (İSKİ) من اشتراك وفواتير وطلبات عبر e-Devlet. «كيف افتح اشتراك مي بإسطنبول» و«فاتورة الماء» على turkiye.gov.tr.',
  seo_keywords = ARRAY['ماء اسطنبول', 'İSKİ', 'كيف افتح اشتراك مي', 'فاتورة الماء اسطنبول', 'iski su', 'iski abonelik', 'e-Devlet', 'turkiye.gov.tr', 'اشتراك الماء تركيا', 'خدمات المياه', 'فاتورة مي اسطنبول', 'iski fatura']::text[]
WHERE slug = 'edevlet-iski-su';

UPDATE articles SET
  seo_title = 'سند القيد العائلي للأتراك (Nüfus Kayıt Örneği)',
  seo_description = 'كيف تطلع سند القيد والبيان العائلي (Nüfus Kayıt Örneği) عبر e-Devlet، غالباً لحاملي الجنسية التركية. «كيف اطلع بيان عائلي» خطوة بخطوة على turkiye.gov.tr.',
  seo_keywords = ARRAY['سند القيد العائلي', 'بيان عائلي تركيا', 'كيف اطلع بيان عائلي', 'سجل نفوس عائلي', 'nüfus kayıt örneği', 'سند قيد للاتراك', 'e-Devlet', 'turkiye.gov.tr', 'وثيقة عائلية', 'قيد عائلي', 'nüfus belgesi', 'بيان قيد الجنسية التركية']::text[]
WHERE slug = 'edevlet-nvi-nufus-kayit-ornegi';

UPDATE articles SET
  seo_title = 'أين سحبت سيارتك؟ الاستعلام عن مرآب الحجز (Otopark)',
  seo_description = 'كيف تعرف المرآب الذي سُحبت إليه سيارتك وعنوانه (çekilen araç / otopark) عبر e-Devlet. «وين راحت سيارتي المسحوبة» خطوة بخطوة على turkiye.gov.tr.',
  seo_keywords = ARRAY['سيارة مسحوبة تركيا', 'مرآب حجز السيارات', 'وين راحت سيارتي', 'سحب السيارة مخالفة', 'çekilen araç', 'otopark sorgulama', 'e-Devlet', 'turkiye.gov.tr', 'استرجاع سيارة مسحوبة', 'عنوان المرآب', 'سيارتي انسحبت', 'araç çekme']::text[]
WHERE slug = 'edevlet-aracimin-cekildigi-otopark-bilgisi-sorgulama';

UPDATE articles SET
  seo_title = 'حجز موعد مستشفى حكومي عبر MHRS من e-Devlet',
  seo_description = 'كيف تحجز موعد طبيب في المستشفيات الحكومية عبر نظام MHRS من e-Devlet دون انتظار. «كيف اخذ موعد مشفى» واختيار العيادة خطوة بخطوة على turkiye.gov.tr.',
  seo_keywords = ARRAY['حجز موعد مستشفى تركيا', 'نظام MHRS', 'كيف اخذ موعد مشفى', 'موعد طبيب حكومي', 'mhrs randevu', 'merkezi hekim randevu', 'e-Devlet', 'turkiye.gov.tr', 'حجز موعد دكتور', 'موعد مستشفى حكومي', 'mhrs موعد', 'حجز عيادة']::text[]
WHERE slug = 'edevlet-mhrs';

UPDATE articles SET
  seo_title = 'الاستعلام عن قضاياك عبر e-Devlet (Davalarım)',
  seo_description = 'كيف تشوف قضاياك القانونية ومواعيد الجلسات والأحكام (Davalarım) عبر e-Devlet. «كيف اشيك عندي قضية» و«موعد جلسة المحكمة» على turkiye.gov.tr.',
  seo_keywords = ARRAY['قضايا محكمة تركيا', 'دعاوى قضائية', 'كيف اشيك عندي قضية', 'مواعيد الجلسات', 'davalarım', 'dava dosyası sorgulama', 'e-Devlet', 'turkiye.gov.tr', 'موعد جلسة المحكمة', 'احكام قضائية', 'استعلام قضية', 'uyap davalarım']::text[]
WHERE slug = 'edevlet-dava-dosyasi-sorgulama';

UPDATE articles SET
  seo_title = 'الاستعلام عن ديون SGK 4B لأصحاب الشركات عبر e-Devlet',
  seo_description = 'كيف تشيّك ديونك ومستحقات التأمينات فئة 4B (Bağ-Kur) عبر e-Devlet، غالباً لأصحاب الأعمال والشركات. «كيف اشيك ديون السجق تبعي» على turkiye.gov.tr.',
  seo_keywords = ARRAY['ديون SGK 4B', 'باغ كور تركيا', 'كيف اشيك ديون السجق', 'تأمين اصحاب الشركات', '4b borç durumu', 'bağ-kur borç', 'e-Devlet', 'turkiye.gov.tr', 'ديون التامينات', 'مستحقات sgk', 'تأمين اصحاب الاعمال', 'sgk borç sorgulama']::text[]
WHERE slug = 'edevlet-borc-durumu-sorgulama';

UPDATE articles SET
  seo_title = 'استخراج ورقة أعزب / أهلية زواج عبر e-Devlet',
  seo_description = 'كيف تقدّم طلب أهلية الزواج والعزوبية (Evlenme Ehliyet Belgesi) إلكترونياً عبر e-Devlet. «كيف اطلع ورقة أعزب» ومتابعة الطلب للبلدية خطوة بخطوة على turkiye.gov.tr.',
  seo_keywords = ARRAY['ورقة أعزب تركيا', 'أهلية الزواج', 'كيف اطلع ورقة أعزب', 'شهادة عزوبية', 'evlenme ehliyet belgesi', 'bekarlık belgesi', 'طلب زواج e-Devlet', 'الزواج في تركيا', 'e-Devlet', 'turkiye.gov.tr', 'ورقة عزوبية للاجانب', 'تصريح زواج']::text[]
WHERE slug = 'edevlet-evlenme-ehliyet';

UPDATE articles SET
  seo_title = 'عرض تقاريرك وتحاليلك الطبية عبر e-Nabız من e-Devlet',
  seo_description = 'كيف تشوف تحاليلك وتقاريرك ووصفاتك الطبية عبر منصة e-Nabız من e-Devlet لك ولعائلتك. «كيف اشوف نتائج تحاليلي» خطوة بخطوة على turkiye.gov.tr.',
  seo_keywords = ARRAY['e-Nabız', 'تقارير طبية تركيا', 'كيف اشوف نتائج تحاليلي', 'سجل طبي e-Devlet', 'e nabız', 'نتائج التحاليل', 'وصفات طبية', 'e-Devlet', 'turkiye.gov.tr', 'تقرير طبي الكتروني', 'صور شعاعية', 'ملف صحي تركيا']::text[]
WHERE slug = 'edevlet-e-nabiz';

UPDATE articles SET
  seo_title = 'استخراج شهادة الولادة من e-Devlet (Doğum Raporu)',
  seo_description = 'كيف تطلع تقرير أو شهادة الولادة (Doğum Raporu) من e-Devlet وتحفظها PDF. «كيف اطلع ورقة ولادة» و«شهادة ميلاد المولود» خطوة بخطوة عبر turkiye.gov.tr.',
  seo_keywords = ARRAY['شهادة ولادة تركيا', 'تقرير ولادة', 'كيف اطلع ورقة ولادة', 'شهادة ميلاد المولود', 'doğum raporu', 'doğum belgesi', 'استخراج شهادة الولادة', 'ورقة ولادة e-Devlet', 'e-Devlet', 'turkiye.gov.tr', 'شهادة ميلاد للاجانب', 'ولادة في تركيا']::text[]
WHERE slug = 'edevlet-dogum-raporu';

UPDATE articles SET
  seo_title = 'الاستعلام عن رسوم الطابو (Tapu Harcı) عبر e-Devlet',
  seo_description = 'كيف تستعلم عن رسوم نقل الملكية (Tapu Harcı) وتدفعها عند شراء عقار عبر e-Devlet. «كم رسوم الطابو» و«كيف ادفع رسوم نقل الملكية» على turkiye.gov.tr.',
  seo_keywords = ARRAY['رسوم الطابو تركيا', 'نقل ملكية عقار', 'كم رسوم الطابو', 'دفع رسوم الطابو', 'tapu harcı', 'tapu harç sorgulama', 'e-Devlet', 'turkiye.gov.tr', 'رسوم شراء عقار', 'ضريبة نقل الملكية', 'tapu harcı ödeme', 'رسوم تسجيل العقار']::text[]
WHERE slug = 'edevlet-tapu-harc';

UPDATE articles SET
  seo_title = 'الاستعلام عن خطوط الجوال المسجلة باسمك عبر e-Devlet',
  seo_description = 'كيف تشيّك عدد خطوط الجوال المسجلة باسمك (mobil hat sorgulama) عبر e-Devlet لتجنب أي استخدام غير مشروع. «شو خطوط مسجلة عليّ» على turkiye.gov.tr.',
  seo_keywords = ARRAY['خطوط مسجلة باسمي تركيا', 'خطوط جوال باسمي', 'شو خطوط مسجلة علي', 'كم خط باسمي', 'mobil hat sorgulama', 'adıma kayıtlı hatlar', 'e-Devlet', 'turkiye.gov.tr', 'خط تليفون باسمي', 'استعلام الخطوط', 'حماية الهوية', 'btk hat sorgulama']::text[]
WHERE slug = 'edevlet-mobil-hat-sorgulama';

UPDATE articles SET
  seo_title = 'الاستعلام عن السيارات المسجلة باسمك عبر e-Devlet',
  seo_description = 'كيف تشيّك عدد المركبات المسجلة باسمك (adıma tescilli araç) عبر e-Devlet لتتجنب أي تسجيل خاطئ. «شو السيارات المسجلة عليّ» على turkiye.gov.tr.',
  seo_keywords = ARRAY['سيارات مسجلة باسمي تركيا', 'مركبات باسمي', 'شو السيارات المسجلة علي', 'تسجيل سيارة', 'adıma tescilli araç', 'araç sorgulama', 'e-Devlet', 'turkiye.gov.tr', 'سيارة باسمي', 'استعلام مركبات', 'عدد السيارات باسمي', 'tescilli araç']::text[]
WHERE slug = 'edevlet-adima-tescilli-arac';

UPDATE articles SET
  seo_title = 'الشركات المسجلة باسمك عبر e-Devlet (MERSİS)',
  seo_description = 'كيف تعرض الشركات التي تملكها أو أنت شريك أو مخوّل فيها (MERSİS) عبر e-Devlet. «شو الشركات المسجلة عليّ» و«شركاتي» خطوة بخطوة على turkiye.gov.tr.',
  seo_keywords = ARRAY['شركات مسجلة باسمي', 'MERSİS تركيا', 'شو الشركات المسجلة علي', 'شركاتي', 'mersis sorgulama', 'ortağı olduğum şirketler', 'e-Devlet', 'turkiye.gov.tr', 'سجل تجاري تركيا', 'شركة باسمي', 'صلاحيات الشركة', 'mersis']::text[]
WHERE slug = 'edevlet-sirketlerim';

UPDATE articles SET
  seo_title = 'شكوى حماية المستهلك عبر e-Devlet (Tüketici Şikayeti)',
  seo_description = 'كيف تقدّم شكوى على منتج أو خدمة لهيئة حماية المستهلك (Tüketici Şikayeti) عبر e-Devlet وتتابع ملفك. «كيف اشتكي على شركة» خطوة بخطوة على turkiye.gov.tr.',
  seo_keywords = ARRAY['شكوى حماية المستهلك', 'تقديم شكوى على شركة', 'كيف اشتكي على منتج', 'حقوق المستهلك تركيا', 'tüketici şikayeti', 'tüketici hakem heyeti', 'e-Devlet', 'turkiye.gov.tr', 'شكوى الكترونية', 'استرجاع حقي', 'شكوى على متجر', 'حماية المستهلك تركيا']::text[]
WHERE slug = 'edevlet-tuketici-sikayet';

UPDATE articles SET
  seo_title = 'الدخول إلى WebTapu لإدارة معاملات العقارات',
  seo_description = 'كيف تدخل نظام WebTapu لإدارة معاملات عقاراتك (بيع/رهن/إجراءات) عبر e-Devlet. «كيف افتح web tapu» و«إدارة الطابو أونلاين» على turkiye.gov.tr.',
  seo_keywords = ARRAY['WebTapu', 'نظام الطابو الالكتروني', 'كيف افتح web tapu', 'معاملات عقارية تركيا', 'web tapu', 'tkgm web tapu', 'e-Devlet', 'turkiye.gov.tr', 'ادارة العقارات', 'طابو اونلاين', 'بيع عقار الكتروني', 'معاملات الطابو']::text[]
WHERE slug = 'edevlet-webtapu';

UPDATE articles SET
  seo_title = 'تغيير عنوان السكن (Adres Değişikliği) — للأتراك',
  seo_description = 'كيف تحدّث أو تغيّر عنوان سكنك إلكترونياً (Adres Değişikliği Bildirimi) عبر e-Devlet، غالباً لحاملي الجنسية التركية. «كيف اغيّر عنواني» على turkiye.gov.tr.',
  seo_keywords = ARRAY['تغيير عنوان السكن تركيا', 'تحديث العنوان', 'كيف اغير عنواني', 'نقل القيد', 'adres değişikliği bildirimi', 'adres değiştirme', 'e-Devlet', 'turkiye.gov.tr', 'تحديث عنوان النفوس', 'تسجيل عنوان جديد', 'عنوان السكن للاتراك', 'ikamet adres değişikliği']::text[]
WHERE slug = 'edevlet-adres-degisikligi-bildirimi';

UPDATE articles SET
  seo_title = 'طبيب العائلة المخصص لك عبر e-Devlet (Aile Hekimi)',
  seo_description = 'كيف تعرف طبيب العائلة والمركز الصحي المخصص لك ولعائلتك (Aile Hekimi) عبر e-Devlet. «مين دكتور العائلة تبعي» و«وين مركزي الصحي» على turkiye.gov.tr.',
  seo_keywords = ARRAY['طبيب العائلة تركيا', 'المركز الصحي المخصص', 'مين دكتور العائلة تبعي', 'aile hekimi', 'aile hekim bilgisi', 'e-Devlet', 'turkiye.gov.tr', 'دكتور العائلة', 'مركز صحي تركيا', 'معلومات طبيب العائلة', 'وين مركزي الصحي', 'aile sağlık merkezi']::text[]
WHERE slug = 'edevlet-aile-hekim-bilgisi-sorgulama';

UPDATE articles SET
  seo_title = 'استخراج وثيقة نقاط المخالفات المرورية عبر e-Devlet',
  seo_description = 'كيف تطلع وثيقة رسمية (باركود) بإجمالي نقاط مخالفات رخصتك (sürücü ceza puanı) عبر e-Devlet. «كم نقطة راحت من رخصتي» على turkiye.gov.tr.',
  seo_keywords = ARRAY['نقاط المخالفات المرورية', 'نقاط رخصة القيادة تركيا', 'كم نقطة راحت من رخصتي', 'وثيقة نقاط المخالفات', 'sürücü ceza puanı', 'ceza puanı belgesi', 'e-Devlet', 'turkiye.gov.tr', 'نقاط الرخصة', 'باركود المخالفات', 'خصم نقاط الرخصة', 'ehliyet ceza puanı']::text[]
WHERE slug = 'edevlet-surucu-ceza-nokta-belgesi';

UPDATE articles SET
  seo_title = 'اشتراكات وديون الهاتف والإنترنت باسمك (BTK)',
  seo_description = 'كيف تشيّك الاشتراكات والديون المسجلة باسمك (هاتف/إنترنت/TV) عبر e-Devlet وخدمة BTK. «شو مسجّل عليّ» و«ديون خطوط باسمي» خطوة بخطوة على turkiye.gov.tr.',
  seo_keywords = ARRAY['اشتراكات باسمي تركيا', 'ديون الهاتف والانترنت', 'كيف اشيك اشتراكاتي', 'خطوط مسجلة باسمي', 'BTK borç sorgulama', 'işletmeci borç', 'e-Devlet', 'turkiye.gov.tr', 'ديون انترنت باسمي', 'اشتراك TV باسمي', 'شو مسجل علي', 'استعلام ديون الاتصالات']::text[]
WHERE slug = 'edevlet-operator-debt';

UPDATE articles SET
  seo_title = 'معلومات الإقامة وتاريخ انتهائها عبر e-Devlet',
  seo_description = 'كيف تشيّك حالة إقامتك وتاريخ انتهائها ومعلوماتك المسجلة (ikamet izni bilgi) عبر e-Devlet. «كيف اشيك إقامتي» و«متى تنتهي إقامتي» على turkiye.gov.tr.',
  seo_keywords = ARRAY['معلومات الإقامة تركيا', 'تاريخ انتهاء الإقامة', 'كيف اشيك اقامتي', 'حالة الإقامة', 'ikamet izni sorgulama', 'göç idaresi', 'e-Devlet', 'turkiye.gov.tr', 'متى تنتهي اقامتي', 'صلاحية الاقامة', 'استعلام اقامة', 'معلومات كملك']::text[]
WHERE slug = 'edevlet-ikamet-kisisel-bilgi';

UPDATE articles SET
  seo_title = 'أسعار صرف العملات الرسمية عبر e-Devlet (Döviz Kurları)',
  seo_description = 'كيف تشوف أسعار صرف العملات الرسمية اليومية (Döviz Kurları) عبر بوابة e-Devlet. «كم سعر الدولار اليوم» و«سعر صرف الليرة» خطوة بخطوة على turkiye.gov.tr.',
  seo_keywords = ARRAY['اسعار صرف العملات تركيا', 'سعر الدولار اليوم', 'كم سعر الدولار', 'سعر صرف الليرة', 'döviz kurları', 'دولار يورو ليرة', 'e-Devlet', 'turkiye.gov.tr', 'اسعار العملات الرسمية', 'سعر صرف اليوم', 'تحويل العملات', 'kur sorgulama']::text[]
WHERE slug = 'edevlet-doviz';

UPDATE articles SET
  seo_title = 'خدمات كهرباء CK Boğaziçi عبر e-Devlet',
  seo_description = 'كيف توصل لخدمات كهرباء CK Boğaziçi من اشتراك وفواتير وطلبات عبر e-Devlet. «كيف افتح اشتراك كهربا» و«فاتورة الكهرباء إسطنبول» على turkiye.gov.tr.',
  seo_keywords = ARRAY['كهرباء CK Boğaziçi', 'اشتراك كهرباء اسطنبول', 'كيف افتح اشتراك كهربا', 'فاتورة الكهرباء', 'ck boğaziçi elektrik', 'elektrik aboneliği', 'e-Devlet', 'turkiye.gov.tr', 'خدمات الكهرباء تركيا', 'فاتورة كهربا اسطنبول', 'تفعيل الكهرباء', 'elektrik fatura']::text[]
WHERE slug = 'edevlet-ck-bogazici-elektrik';

UPDATE articles SET
  seo_title = 'الاستعلام عن الديون الضريبية عبر e-Devlet (Vergi Borcu)',
  seo_description = 'كيف تشيّك مستحقاتك وديونك الضريبية (Vergi Borcu) وأي تأخير عبر e-Devlet. «كيف اشيك ديوني الضريبية» و«شو علي ضرائب» خطوة بخطوة على turkiye.gov.tr.',
  seo_keywords = ARRAY['ديون ضريبية تركيا', 'استعلام ضريبة', 'كيف اشيك ديوني الضريبية', 'ضرائب متأخرة', 'vergi borcu sorgulama', 'gib vergi borcu', 'e-Devlet', 'turkiye.gov.tr', 'شو علي ضرائب', 'مستحقات ضريبية', 'دفع الضريبة', 'vergi borç']::text[]
WHERE slug = 'edevlet-vergi-borcu';

UPDATE articles SET
  seo_title = 'تسجيل رقم هاتفك لدى مديرية الطابو عبر e-Devlet',
  seo_description = 'كيف تسجّل أو تحدّث رقم هاتفك المرتبط بسجلات الطابو (Tapu Telefon Beyanı) عبر e-Devlet لتلقي إشعارات العقار. «كيف اربط رقمي بالطابو» على turkiye.gov.tr.',
  seo_keywords = ARRAY['تسجيل رقم الهاتف بالطابو', 'اشعارات العقار تركيا', 'كيف اربط رقمي بالطابو', 'بيان هاتف الطابو', 'tapu telefon beyanı', 'tapu bildirim', 'e-Devlet', 'turkiye.gov.tr', 'تحديث رقم الطابو', 'حماية العقار', 'رقم هاتف الطابو', 'tapu sms']::text[]
WHERE slug = 'edevlet-tapu-telefon-beyan';

-- تحقّق: يجب أن تُحدَّث 33 مقالة بالضبط، وإلا يفشل التنفيذ كله (rollback)
DO $check$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM articles WHERE slug IN ('btk-ekayit-foreigners-phone-line-2026', 'edevlet-nvi-yerlesim-yeri', 'edevlet-adli-sicil-kaydi', 'edevlet-imei-sorgulama', 'edevlet-sgk-kayit-belgesi', 'edevlet-plaka-ceza', 'edevlet-sgk-hizmet-dokumu', 'edevlet-cimer-basvuru', 'edevlet-surucu-basvuru-durum', 'edevlet-iski-su', 'edevlet-nvi-nufus-kayit-ornegi', 'edevlet-aracimin-cekildigi-otopark-bilgisi-sorgulama', 'edevlet-mhrs', 'edevlet-dava-dosyasi-sorgulama', 'edevlet-borc-durumu-sorgulama', 'edevlet-evlenme-ehliyet', 'edevlet-e-nabiz', 'edevlet-dogum-raporu', 'edevlet-tapu-harc', 'edevlet-mobil-hat-sorgulama', 'edevlet-adima-tescilli-arac', 'edevlet-sirketlerim', 'edevlet-tuketici-sikayet', 'edevlet-webtapu', 'edevlet-adres-degisikligi-bildirimi', 'edevlet-aile-hekim-bilgisi-sorgulama', 'edevlet-surucu-ceza-nokta-belgesi', 'edevlet-operator-debt', 'edevlet-ikamet-kisisel-bilgi', 'edevlet-doviz', 'edevlet-ck-bogazici-elektrik', 'edevlet-vergi-borcu', 'edevlet-tapu-telefon-beyan') AND seo_title IN ('تفعيل ونقل خطوط الهاتف للأجانب بموافقتك عبر e-Devlet (BTK)', 'استخراج سند الإقامة (Yerleşim Yeri) من e-Devlet', 'استخراج وثيقة عدم محكومية (Adli Sicil) من e-Devlet', 'التحقق من رقم IMEI للجوال عبر e-Devlet', 'استخراج وثيقة التسجيل في SGK عبر e-Devlet', 'الاستعلام عن مخالفات سيارتك المرورية عبر e-Devlet', 'عرض أيام الخدمة والتأمين SGK 4A عبر e-Devlet', 'تقديم شكوى أو طلب عبر CİMER من e-Devlet', 'متابعة حالة طلب رخصة القيادة التركية عبر e-Devlet', 'خدمات ماء إسطنبول (İSKİ) عبر e-Devlet', 'سند القيد العائلي للأتراك (Nüfus Kayıt Örneği)', 'أين سحبت سيارتك؟ الاستعلام عن مرآب الحجز (Otopark)', 'حجز موعد مستشفى حكومي عبر MHRS من e-Devlet', 'الاستعلام عن قضاياك عبر e-Devlet (Davalarım)', 'الاستعلام عن ديون SGK 4B لأصحاب الشركات عبر e-Devlet', 'استخراج ورقة أعزب / أهلية زواج عبر e-Devlet', 'عرض تقاريرك وتحاليلك الطبية عبر e-Nabız من e-Devlet', 'استخراج شهادة الولادة من e-Devlet (Doğum Raporu)', 'الاستعلام عن رسوم الطابو (Tapu Harcı) عبر e-Devlet', 'الاستعلام عن خطوط الجوال المسجلة باسمك عبر e-Devlet', 'الاستعلام عن السيارات المسجلة باسمك عبر e-Devlet', 'الشركات المسجلة باسمك عبر e-Devlet (MERSİS)', 'شكوى حماية المستهلك عبر e-Devlet (Tüketici Şikayeti)', 'الدخول إلى WebTapu لإدارة معاملات العقارات', 'تغيير عنوان السكن (Adres Değişikliği) — للأتراك', 'طبيب العائلة المخصص لك عبر e-Devlet (Aile Hekimi)', 'استخراج وثيقة نقاط المخالفات المرورية عبر e-Devlet', 'اشتراكات وديون الهاتف والإنترنت باسمك (BTK)', 'معلومات الإقامة وتاريخ انتهائها عبر e-Devlet', 'أسعار صرف العملات الرسمية عبر e-Devlet (Döviz Kurları)', 'خدمات كهرباء CK Boğaziçi عبر e-Devlet', 'الاستعلام عن الديون الضريبية عبر e-Devlet (Vergi Borcu)', 'تسجيل رقم هاتفك لدى مديرية الطابو عبر e-Devlet');
  IF n <> 33 THEN
    RAISE EXCEPTION 'expected 33 updated e-Devlet articles, found %', n;
  END IF;
END $check$;

COMMIT;

-- عرض النتيجة النهائية للمراجعة السريعة
SELECT slug, seo_title, left(seo_description, 60) AS desc_start, array_length(seo_keywords, 1) AS kw
FROM articles WHERE slug IN ('btk-ekayit-foreigners-phone-line-2026', 'edevlet-nvi-yerlesim-yeri', 'edevlet-adli-sicil-kaydi', 'edevlet-imei-sorgulama', 'edevlet-sgk-kayit-belgesi', 'edevlet-plaka-ceza', 'edevlet-sgk-hizmet-dokumu', 'edevlet-cimer-basvuru', 'edevlet-surucu-basvuru-durum', 'edevlet-iski-su', 'edevlet-nvi-nufus-kayit-ornegi', 'edevlet-aracimin-cekildigi-otopark-bilgisi-sorgulama', 'edevlet-mhrs', 'edevlet-dava-dosyasi-sorgulama', 'edevlet-borc-durumu-sorgulama', 'edevlet-evlenme-ehliyet', 'edevlet-e-nabiz', 'edevlet-dogum-raporu', 'edevlet-tapu-harc', 'edevlet-mobil-hat-sorgulama', 'edevlet-adima-tescilli-arac', 'edevlet-sirketlerim', 'edevlet-tuketici-sikayet', 'edevlet-webtapu', 'edevlet-adres-degisikligi-bildirimi', 'edevlet-aile-hekim-bilgisi-sorgulama', 'edevlet-surucu-ceza-nokta-belgesi', 'edevlet-operator-debt', 'edevlet-ikamet-kisisel-bilgi', 'edevlet-doviz', 'edevlet-ck-bogazici-elektrik', 'edevlet-vergi-borcu', 'edevlet-tapu-telefon-beyan') ORDER BY slug;