-- ============================================================================
-- مواءمة النسخة التركية للأكواد المصحّحة — تكملة تدقيق 2026-07-09
-- Turkish re-alignment for the corrected security codes.
-- ============================================================================
-- الترجمات التركية (title_tr/description_tr) أُنشئت بتاريخ 2026-07-02 من
-- النصوص العربية القديمة — أي قبل تصحيحات 2026-07-09 — فورثت الخلط نفسه
-- (G34 Sahtecilik شرحه التركي عن الإرهاب، Ç179 لا يزال Sağlık Vizesi...).
-- هذا الملف يوائم النص التركي مع المعاني المصحّحة الموثّقة بنفس مصادر
-- التدقيق، وروجع لغوياً (تدقيق ثانٍ مستقل للتركية القانونية).
-- يتضمن أيضاً تصحيحاً عربياً واحداً: N82 كان مكتوباً (İstihzan) والصحيح
-- المصطلح القانوني (İstizan). آمن لإعادة التشغيل.
-- ============================================================================

-- ── عائلة G ──

UPDATE public.security_codes SET description_tr = $$Yasa dışı örgüt faaliyetlerine karışan veya bu örgütlerle ciddi bağlantısından şüphelenilen yabancılara uygulanır. Giriş yasağı doğurur; buna sınır dışı etme kararı eşlik edebilir. İdare mahkemesinde itiraz için avukat desteği önerilir.$$
WHERE code = 'G26';

UPDATE public.security_codes SET description_tr = $$Resmî veya özel belgede sahtecilik (evrakta sahtecilik) suçundan hüküm giymiş ya da şüpheli yabancılara uygulanır. Giriş yasağı doğurur; yasal süresi içinde idari yargıda itiraz mümkündür.$$
WHERE code = 'G34';

UPDATE public.security_codes SET description_tr = $$Kaçakçılık suçlarına karışan yabancılara uygulanır. Giriş yasağının süresi fiilin ağırlığına ve yargı kararına göre değişir.$$
WHERE code = 'G43';

UPDATE public.security_codes SET description_tr = $$Fuhşa aracılık etme, teşvik etme veya yer temin etme suçlarına karışan yabancılara uygulanır. Uzun süreli giriş yasağı doğurur; buna sınır dışı etme kararı eşlik edebilir.$$
WHERE code = 'G48';

UPDATE public.security_codes SET description_tr = $$Tehdit suçundan hüküm giymiş veya şüpheli yabancılara uygulanır. Giriş yasağı doğurur; kaldırılması idari yargı sürecine tabidir.$$
WHERE code = 'G64';

UPDATE public.security_codes SET description_tr = $$Hırsızlık suçundan hüküm giymiş veya şüpheli yabancılara uygulanır. Giriş yasağı doğurur; idare mahkemesinde itiraz mümkündür.$$
WHERE code = 'G65';

UPDATE public.security_codes SET description_tr = $$Gasp / yağma suçlarından hüküm giymiş veya şüpheli yabancılara uygulanır. Ağır suç niteliği nedeniyle uzun süreli giriş yasağı doğurur.$$
WHERE code = 'G66';

UPDATE public.security_codes SET description_tr = $$Dolandırıcılık suçundan hüküm giymiş veya şüpheli yabancılara uygulanır. Giriş yasağı doğurur; kaldırılması yargısal itiraza tabidir.$$
WHERE code = 'G67';

UPDATE public.security_codes SET description_tr = $$Kamu sağlığı için tehdit oluşturduğu değerlendirilen bulaşıcı hastalık taşıyan yabancılara uygulanır. Sağlık gerekçeli bir koddur; sebep ortadan kalktığında yeniden değerlendirilebilir ve herhangi bir adli suçlama içermez.$$
WHERE code = 'G78';

UPDATE public.security_codes SET title_tr = $$Millî güvenlik aleyhine faaliyet$$, description_tr = $$Türkiye'nin millî güvenliği aleyhine faaliyette bulunduğu değerlendirilen yabancılara uygulanır. En ağır kodlardan biridir; uzun süreli giriş yasağı ve sınır dışı etme kararı doğurabilir, itirazı uzman hukuki destek gerektirir.$$
WHERE code = 'G82';

UPDATE public.security_codes SET description_tr = $$Yabancı terörist savaşçı (YTS) olarak sınıflandırılan kişilere uygulanır. En ağır kodlardan biridir; uzun süreli, çoğu durumda süresiz giriş yasağı doğurabilir ve sıkı güvenlik tedbirleriyle birlikte uygulanır.$$
WHERE code = 'G89';

UPDATE public.security_codes SET title_tr = $$İdari güvenlik kaydı$$, description_tr = $$Yetkili makamlarca bildirilen bir güvenlik kaydı veya değerlendirmesi bulunduğunda uygulanan idari tahdit kodudur. Yayımlanmış resmî bir tanımı yoktur ve mutlaka bir suç işlendiği anlamına gelmez; gerçek nedenini öğrenmek için avukat aracılığıyla sorgulama önerilir.$$
WHERE code = 'G99';

-- ── أكواد Ç ──

UPDATE public.security_codes SET title_tr = $$Organ ve doku ticareti$$, description_tr = $$Organ veya doku ticaretine karışan yabancılara uygulanır. Ağır suç niteliği nedeniyle uzun süreli giriş yasağı doğurur.$$
WHERE code = 'Ç179';

UPDATE public.security_codes SET description_tr = $$Vize, ikamet veya çalışma izni süresini 3 ay ile 6 ay arasında ihlal eden yabancılara uygulanan bir aylık giriş yasağıdır (kademeli ihlal tablosuna göre).$$
WHERE code = 'Ç167';

-- ── أكواد N ──

UPDATE public.security_codes SET title_tr = $$Kaçak çalışma idari para cezası$$
WHERE code = 'N119';

UPDATE public.security_codes SET title_tr = $$Yasa dışı giriş idari para cezası$$
WHERE code = 'N135';

UPDATE public.security_codes SET description_tr = $$İnterpol aracılığıyla uluslararası bültenle aranan yabancılara uygulanır. Sınır kapılarında durdurma ve giriş yasağı doğurur; kaldırılması, uluslararası bültenin hukuki yollarla ele alınmasını gerektirir.$$
WHERE code = 'N99';

UPDATE public.security_codes SET description_tr = $$Mevcut bir giriş yasağını ihlal ederek ülkeye giren veya girmeye çalışan yabancılara uygulanan idari para cezasıdır.$$
WHERE code = 'N95';

-- N82: المصطلح الصحيح İstizan (لا İstihzan) — بالتركية والعربية معاً.
UPDATE public.security_codes SET title_tr = $$Ön izne bağlı giriş (İstizan)$$, description_tr = $$İstizan kodu: yabancının Türkiye'ye girişi, seyahatten önce yetkili makamlardan alınacak ön izne bağlıdır. Kalıcı bir yasak anlamına gelmez; her seyahat öncesinde Türk temsilciliklerine başvuru gerekir.$$
WHERE code = 'N82';

UPDATE public.security_codes SET title = $$دخول مرهون بإذن مسبق (İstizan)$$
WHERE code = 'N82';

-- ── V ──

UPDATE public.security_codes SET title_tr = $$Pasaportta şerh$$, description_tr = $$Adli bir işlem nedeniyle pasaportlarına şerh konulan Türk vatandaşlarına özgü bir koddur. Pasaport sahteciliğiyle ilgisi yoktur.$$
WHERE code = 'V146';

-- ── عائلة N (İzin) المُبقاة — مواءمة الجريمة مع العنوان بالتركية ──
-- (N42/N43/N58/N87 شروحها التركية متوافقة أصلاً — لا تغيير عليها)

UPDATE public.security_codes SET description_tr = $$Yasa dışı örgüt faaliyetleriyle bağlantılı güvenlik şerhi; yabancının Türkiye'ye girişinden önce yetkili makamlardan ön izin alınması gerekir.$$
WHERE code = 'N26';

UPDATE public.security_codes SET description_tr = $$Sahtecilik (evrakta sahtecilik) suçuyla bağlantılı güvenlik şerhi; yabancının Türkiye'ye girişinden önce yetkili makamlardan ön izin alınması gerekir.$$
WHERE code = 'N34';

UPDATE public.security_codes SET description_tr = $$Fuhşa aracılık suçuyla bağlantılı güvenlik şerhi; yabancının Türkiye'ye girişinden önce yetkili makamlardan ön izin alınması gerekir.$$
WHERE code = 'N48';

UPDATE public.security_codes SET description_tr = $$Tehdit suçuyla bağlantılı güvenlik şerhi; yabancının Türkiye'ye girişinden önce yetkili makamlardan ön izin alınması gerekir.$$
WHERE code = 'N64';

UPDATE public.security_codes SET description_tr = $$Hırsızlık suçuyla bağlantılı güvenlik şerhi; yabancının Türkiye'ye girişinden önce yetkili makamlardan ön izin alınması gerekir.$$
WHERE code = 'N65';

UPDATE public.security_codes SET description_tr = $$Gasp / yağma suçuyla bağlantılı güvenlik şerhi; yabancının Türkiye'ye girişinden önce yetkili makamlardan ön izin alınması gerekir.$$
WHERE code = 'N66';

UPDATE public.security_codes SET description_tr = $$Kamu sağlığı için risk oluşturan bulaşıcı hastalık taşıyıcılığıyla bağlantılı şerh; giriş öncesinde yetkili makamlardan ön izin alınması gerekir. Sağlık gerekçeli olup adli bir suçlama içermez.$$
WHERE code = 'N78';
