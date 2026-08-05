-- ============================================================================
-- عنقود e-Devlet: 33 صفحة قالب ← دليل واحد (2026-08-05)
-- ============================================================================
-- ليست صفحات متشابهة. هي قالب واحد نُشر 33 مرّة.
--
-- القياس هو ما حسمها: على موقع فيه 331 مقالاً، أعلى ثمانية وعشرين زوجاً
-- تشابهاً نصّياً كانت كلّها من هذه المجموعة، بتداخل 50-65%؛ وخارجها لا يتجاوز
-- 30% إلا زوجان في الموقع كلّه.
--
-- المتطابق حرفياً في الـ33: الوثائق الثلاث، والنصائح الثلاث، وسطر الرسوم،
-- والتنبيه، والخطوة الأولى. والفريد: العنوان، وجملة أو جملتان، ورابط
-- turkiye.gov.tr، وخطوة واحدة خاصة. وسطي المتن 38 كلمة، ومجموع القراءات 329
-- أي نحو عشر لكل صفحة.
--
-- مدخل في دليل ليس مقالاً. فالمشترك يُقال مرّة واحدة على الصفحة المجمِّعة،
-- وكل خدمة تحتفظ بجملتها وخطوتها ورابطها الرسمي على شكل كرت، والروابط الـ33
-- تُحوَّل إلى مرساتها هناك. القارئ لا يخسر شيئاً — الرابط الرسمي هو ما جاء
-- من أجله، وصار أقرب بنقرة بدل أن يبعد بصفحة.
--
-- ولم يُعَد كتابة شيء: العناوين والجمل والخطوات والروابط نُقلت بنصّها إلى
-- src/lib/edevletServices.ts، وهذا الملف يحذف الصفوف بعدها.
--
-- ولم تُمَسّ أربع صفحات في التصنيف نفسه لأنّها ليست من القالب: صفحتا توثيق
-- خطّ الهاتف (404 و59 قراءة)، وصفحة حسابات النقود الإلكترونية، وكشف الخدمة.
--
-- شغّله بعد اكتمال نشر الشيفرة (التحويلات في next.config.ts).
-- ============================================================================

DELETE FROM articles WHERE slug IN (
    'edevlet-adima-tescilli-arac',
    'edevlet-adli-sicil-kaydi',
    'edevlet-adres-degisikligi-bildirimi',
    'edevlet-aile-hekim-bilgisi-sorgulama',
    'edevlet-aracimin-cekildigi-otopark-bilgisi-sorgulama',
    'edevlet-borc-durumu-sorgulama',
    'edevlet-cimer-basvuru',
    'edevlet-ck-bogazici-elektrik',
    'edevlet-dava-dosyasi-sorgulama',
    'edevlet-dogum-raporu',
    'edevlet-doviz',
    'edevlet-e-nabiz',
    'edevlet-evlenme-ehliyet',
    'edevlet-ikamet-kisisel-bilgi',
    'edevlet-imei-sorgulama',
    'edevlet-iski-su',
    'edevlet-mhrs',
    'edevlet-mobil-hat-sorgulama',
    'edevlet-nvi-nufus-kayit-ornegi',
    'edevlet-nvi-yerlesim-yeri',
    'edevlet-operator-debt',
    'edevlet-plaka-ceza',
    'edevlet-sgk-hizmet-dokumu',
    'edevlet-sgk-kayit-belgesi',
    'edevlet-sirketlerim',
    'edevlet-surucu-basvuru-durum',
    'edevlet-surucu-ceza-nokta-belgesi',
    'edevlet-tapu-harc',
    'edevlet-tapu-telefon-beyan',
    'edevlet-tuketici-sikayet',
    'edevlet-vergi-borcu',
    'edevlet-webtapu',
    'edevlet-yol-izin'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — الأول صفر، والثاني يجب أن يبقى 4 صفوف (غير القالب)
SELECT slug FROM articles WHERE slug IN ('edevlet-adima-tescilli-arac',
       'edevlet-adli-sicil-kaydi',
       'edevlet-adres-degisikligi-bildirimi',
       'edevlet-aile-hekim-bilgisi-sorgulama',
       'edevlet-aracimin-cekildigi-otopark-bilgisi-sorgulama',
       'edevlet-borc-durumu-sorgulama',
       'edevlet-cimer-basvuru',
       'edevlet-ck-bogazici-elektrik',
       'edevlet-dava-dosyasi-sorgulama',
       'edevlet-dogum-raporu',
       'edevlet-doviz',
       'edevlet-e-nabiz',
       'edevlet-evlenme-ehliyet',
       'edevlet-ikamet-kisisel-bilgi',
       'edevlet-imei-sorgulama',
       'edevlet-iski-su',
       'edevlet-mhrs',
       'edevlet-mobil-hat-sorgulama',
       'edevlet-nvi-nufus-kayit-ornegi',
       'edevlet-nvi-yerlesim-yeri',
       'edevlet-operator-debt',
       'edevlet-plaka-ceza',
       'edevlet-sgk-hizmet-dokumu',
       'edevlet-sgk-kayit-belgesi',
       'edevlet-sirketlerim',
       'edevlet-surucu-basvuru-durum',
       'edevlet-surucu-ceza-nokta-belgesi',
       'edevlet-tapu-harc',
       'edevlet-tapu-telefon-beyan',
       'edevlet-tuketici-sikayet',
       'edevlet-vergi-borcu',
       'edevlet-webtapu',
       'edevlet-yol-izin');

SELECT slug, views FROM articles
WHERE category = 'خدمات e-Devlet' AND status = 'approved'
ORDER BY views DESC;
