
-- ==========================================
-- 🛠️ إصلاح التكرار وقيود البيانات (Dedup & Constraints Fix)
-- ==========================================

-- 1. تفريغ الجداول التي حدث فيها تكرار (لإعادة الترحيل بشكل نظيف)
truncate table site_menus;
truncate table service_categories;
truncate table tools_registry;

-- 2. إضافة قيود فريدة (Unique Constraints) لمنع التكرار مستقبلاً

-- جدول القوائم: لا يمكن تكرار نفس الرابط في نفس المكان (header/footer)
alter table site_menus drop constraint if exists site_menus_location_href_key;
alter table site_menus add constraint site_menus_location_href_key unique (location, href);

-- جدول التصنيفات: الـ slug يجب أن يكون فريداً
alter table service_categories drop constraint if exists service_categories_slug_key;
alter table service_categories add constraint service_categories_slug_key unique (slug);

-- جدول الأدوات: الـ key يجب أن يكون فريداً
alter table tools_registry drop constraint if exists tools_registry_key_key;
alter table tools_registry add constraint tools_registry_key_key unique (key);

-- 3. تأكيد الجاهزية
-- الآن عند تشغيل Migration، لن يحدث تكرار، وسيعمل Upsert بشكل صحيح.
