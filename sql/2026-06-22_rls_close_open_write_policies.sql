-- ============================================================================
-- 2026-06-22 — إغلاق سياسات RLS المفتوحة (ثغرات حيّة مؤكَّدة عبر pg_policies)
-- ============================================================================
-- خلفية: استعلام pg_policies على قاعدة الإنتاج كشف 4 سياسات كتابة مفتوحة فقط.
-- صميم المحتوى (articles, service_providers UPDATE/DELETE, comments, updates,
-- faqs, zones, security_codes, site_banners, news_ticker, site_settings ...)
-- محصور أصلاً بـ is_admin() — لم يظهر في الاستعلام، فلا يُمَسّ هنا.
--
-- is_admin() = EXISTS(member_profiles WHERE id=auth.uid() AND role='admin').
-- viewer/member لا يجتازها.
--
-- يُشغَّل في Supabase SQL Editor. لا يحذف أي بيانات — يعدّل سياسات فقط. معاملة واحدة.
-- ============================================================================

BEGIN;

-- ── 1) static_pages ─────────────────────────────────────────────────────────
-- قبل: "Public Full Access" FOR ALL TO public USING(true) → أي زائر يقرأ/يعدّل/يحذف.
-- بعد: العامة تقرأ فقط (الصفحات الثابتة محتوى عام)، والكتابة للأدمن فقط.
DROP POLICY IF EXISTS "Public Full Access"        ON public.static_pages;
DROP POLICY IF EXISTS static_pages_public_read    ON public.static_pages;
DROP POLICY IF EXISTS static_pages_admin_all      ON public.static_pages;
CREATE POLICY static_pages_public_read ON public.static_pages
    FOR SELECT USING (true);
CREATE POLICY static_pages_admin_all ON public.static_pages
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ── 2) suggestions ──────────────────────────────────────────────────────────
-- قبل: سياستان "... Full Access" FOR ALL TO public USING(true) → أي زائر يقرأ/يعدّل/يحذف
--       رسائل غيره. (الجدول يستقبل إرسالات عامة ويقرأها الأدمن فقط.)
-- بعد: العامة تُرسِل فقط (نُبقي سياسة الإدراج القائمة)، والقراءة/التعديل/الحذف للأدمن.
DROP POLICY IF EXISTS "Allow full access to suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "Public Full Access"               ON public.suggestions;
DROP POLICY IF EXISTS suggestions_admin_all              ON public.suggestions;
-- (تبقى كما هي: "Allow public insert to suggestions" — نموذج الإرسال العام)
CREATE POLICY suggestions_admin_all ON public.suggestions
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ── 3) member_profiles ──────────────────────────────────────────────────────
-- قبل: "insert_new_profile" FOR INSERT TO public WITH CHECK(true) → يستطيع مستخدم
--       جديد إدراج ملفه بـ role='admin' = تصعيد صلاحيات.
-- بعد: يُنشئ المستخدم ملفه هو فقط، وبدور غير-أدمن فقط. التسجيل الحقيقي يتم بمفتاح
--       service-role (يتجاوز RLS) فلا يتأثّر — هذا يمنع الإدراج العميل الخبيث فقط.
DROP POLICY IF EXISTS insert_new_profile ON public.member_profiles;
CREATE POLICY insert_own_member_profile ON public.member_profiles
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid() AND (role = 'member' OR role IS NULL));

-- ── 4) push_subscriptions ───────────────────────────────────────────────────
-- قبل: "user_manage_push" FOR ALL TO authenticated USING(true) → أي مسجّل يقرأ/يعدّل/
--       يحذف اشتراكات غيره.
-- بعد: كل مستخدم يدير اشتراكه هو فقط. الاشتراك العام (INSERT) يبقى عبر
--       "public_insert_push". الاشتراكات المجهولة/القديمة تنظّفها مهمة الخادم.
DROP POLICY IF EXISTS user_manage_push ON public.push_subscriptions;
CREATE POLICY push_manage_own ON public.push_subscriptions
    FOR ALL TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

COMMIT;

-- ============================================================================
-- بعد التشغيل: أعِد تشغيل استعلام التحقّق الحاسم — يجب أن يرجع صفر صفوف:
--   SELECT tablename, policyname, roles, cmd, qual, with_check
--   FROM pg_policies WHERE schemaname='public' AND cmd IN ('ALL','UPDATE','DELETE')
--     AND ('anon' = ANY(roles) OR qual='true' OR with_check='true'
--          OR qual ILIKE '%auth.role()%') ORDER BY tablename, cmd;
-- ============================================================================
