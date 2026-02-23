-- ============================================================
-- RLS Admin Policies — شغّل هذا الملف في Supabase SQL Editor
-- ============================================================
-- كيفية التشغيل:
--   Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- دالة مساعدة لفحص الدور (تُحسّن الأداء بدل sub-query متكررة)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM member_profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- دالة مساعدة: تُنشئ policies على جدول موجود فقط
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _apply_admin_rls(
    p_table text,
    p_public_read boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- تحقق من وجود الجدول أولاً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = p_table
  ) THEN
    RAISE NOTICE 'Table "%" does not exist — skipping.', p_table;
    RETURN;
  END IF;

  -- احذف القديم
  EXECUTE format('DROP POLICY IF EXISTS "public_read_%1$s"  ON %1$I', p_table);
  EXECUTE format('DROP POLICY IF EXISTS "admin_write_%1$s" ON %1$I', p_table);

  -- اقرأ عام إن طُلب
  IF p_public_read THEN
    EXECUTE format(
      'CREATE POLICY "public_read_%1$s" ON %1$I FOR SELECT USING (true)',
      p_table
    );
  END IF;

  -- كتابة كاملة للأدمن
  EXECUTE format(
    'CREATE POLICY "admin_write_%1$s" ON %1$I FOR ALL TO authenticated ' ||
    'USING (is_admin()) WITH CHECK (is_admin())',
    p_table
  );

  RAISE NOTICE 'RLS applied to table "%".', p_table;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- تطبيق RLS على الجداول (القراءة عامة + الكتابة للأدمن فقط)
-- ─────────────────────────────────────────────────────────────
SELECT _apply_admin_rls('consultant_scenarios');
SELECT _apply_admin_rls('service_providers');
SELECT _apply_admin_rls('articles');
SELECT _apply_admin_rls('updates');
SELECT _apply_admin_rls('faqs');
SELECT _apply_admin_rls('zones');
SELECT _apply_admin_rls('sources');          -- ستتجاهله إن لم يكن موجوداً
SELECT _apply_admin_rls('analyst_insights', false);  -- لا قراءة عامة
SELECT _apply_admin_rls('banners');
SELECT _apply_admin_rls('access_codes', false);

-- ─────────────────────────────────────────────────────────────
-- comments: الجمهور يكتب — الأدمن يدير الكل
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='comments') THEN
    RAISE NOTICE 'Table "comments" does not exist — skipping.'; RETURN;
  END IF;

  DROP POLICY IF EXISTS "public_insert_comments" ON comments;
  DROP POLICY IF EXISTS "public_read_comments"   ON comments;
  DROP POLICY IF EXISTS "admin_manage_comments"  ON comments;

  CREATE POLICY "public_read_comments"   ON comments FOR SELECT USING (true);
  CREATE POLICY "public_insert_comments" ON comments FOR INSERT WITH CHECK (true);
  CREATE POLICY "admin_manage_comments"  ON comments FOR ALL TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());
END $$;

-- ─────────────────────────────────────────────────────────────
-- service_reviews و review_replies
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='service_reviews') THEN
    DROP POLICY IF EXISTS "public_read_reviews"   ON service_reviews;
    DROP POLICY IF EXISTS "public_insert_reviews" ON service_reviews;
    DROP POLICY IF EXISTS "admin_manage_reviews"  ON service_reviews;

    CREATE POLICY "public_read_reviews"   ON service_reviews FOR SELECT USING (true);
    CREATE POLICY "public_insert_reviews" ON service_reviews FOR INSERT WITH CHECK (true);
    CREATE POLICY "admin_manage_reviews"  ON service_reviews FOR ALL TO authenticated
      USING (is_admin()) WITH CHECK (is_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='review_replies') THEN
    DROP POLICY IF EXISTS "public_read_replies"  ON review_replies;
    DROP POLICY IF EXISTS "admin_manage_replies" ON review_replies;

    CREATE POLICY "public_read_replies"  ON review_replies FOR SELECT USING (true);
    CREATE POLICY "admin_manage_replies" ON review_replies FOR ALL TO authenticated
      USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- content_votes
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='content_votes') THEN
    RAISE NOTICE 'Table "content_votes" does not exist — skipping.'; RETURN;
  END IF;

  DROP POLICY IF EXISTS "public_insert_votes" ON content_votes;
  DROP POLICY IF EXISTS "admin_manage_votes"  ON content_votes;

  CREATE POLICY "public_insert_votes" ON content_votes FOR INSERT WITH CHECK (true);
  CREATE POLICY "admin_manage_votes"  ON content_votes FOR ALL TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());
END $$;

-- ─────────────────────────────────────────────────────────────
-- member_profiles: كل مستخدم يرى/يعدّل ملفه — الأدمن يرى الجميع
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='member_profiles') THEN
    RAISE NOTICE 'Table "member_profiles" does not exist — skipping.'; RETURN;
  END IF;

  DROP POLICY IF EXISTS "member_own_profile"      ON member_profiles;
  DROP POLICY IF EXISTS "admin_read_all_profiles" ON member_profiles;

  CREATE POLICY "member_own_profile" ON member_profiles FOR ALL TO authenticated
    USING (id = auth.uid()) WITH CHECK (id = auth.uid());

  CREATE POLICY "admin_read_all_profiles" ON member_profiles FOR SELECT TO authenticated
    USING (is_admin());
END $$;

-- ─────────────────────────────────────────────────────────────
-- تنظيف الدوال المساعدة (اختياري — احذف السطر إن أردت الاحتفاظ بهن)
-- ─────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS _apply_admin_rls(text, boolean);

-- ─────────────────────────────────────────────────────────────
-- تحقق من النتيجة (شغّله بعد الانتهاء لمراجعة الـ policies)
-- ─────────────────────────────────────────────────────────────
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
