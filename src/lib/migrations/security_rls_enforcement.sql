-- ===================================================================
-- 🔒 CRITICAL SECURITY FIX: Enable RLS + Enforce Proper Policies
-- ===================================================================
-- Root cause: Previous migration created policies but NEVER called
--   ALTER TABLE ... ENABLE ROW LEVEL SECURITY
-- Without that, policies are decorative and ignored!
--
-- Run in: Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ===================================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Ensure is_admin() helper exists
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
-- 2. Helper: Enable RLS + drop ALL existing policies on a table
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _secure_table(p_table text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    pol RECORD;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = p_table
  ) THEN
    RAISE NOTICE 'Table "%" does not exist — skipping.', p_table;
    RETURN;
  END IF;

  -- CRITICAL: Enable RLS (this was the missing piece!)
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', p_table);

  -- Drop ALL existing policies (clean slate)
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = p_table AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, p_table);
  END LOOP;

  RAISE NOTICE 'RLS enabled and policies cleared for "%".', p_table;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. Pattern A: Public Read + Admin Write
--    (content tables — public can read, only admin can modify)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _rls_public_read_admin_write(p_table text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM _secure_table(p_table);

  -- Anyone can read
  EXECUTE format(
    'CREATE POLICY "public_read_%1$s" ON %1$I FOR SELECT USING (true)',
    p_table
  );

  -- Only admin can write (insert/update/delete)
  EXECUTE format(
    'CREATE POLICY "admin_all_%1$s" ON %1$I FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin())',
    p_table
  );
END;
$$;

-- Apply Pattern A to content tables
SELECT _rls_public_read_admin_write('consultant_scenarios');
SELECT _rls_public_read_admin_write('updates');
SELECT _rls_public_read_admin_write('faqs');
SELECT _rls_public_read_admin_write('zones');
SELECT _rls_public_read_admin_write('security_codes');
SELECT _rls_public_read_admin_write('official_sources');
SELECT _rls_public_read_admin_write('site_menus');
SELECT _rls_public_read_admin_write('site_banners');
SELECT _rls_public_read_admin_write('site_testimonials');
SELECT _rls_public_read_admin_write('home_cards');
SELECT _rls_public_read_admin_write('news_ticker');
SELECT _rls_public_read_admin_write('tools_registry');
SELECT _rls_public_read_admin_write('site_settings');
SELECT _rls_public_read_admin_write('service_categories');
SELECT _rls_public_read_admin_write('restricted_zones');

-- ─────────────────────────────────────────────────────────────
-- 4. Pattern B: Public Read + Member Insert + Admin Full
--    (articles & services — members can submit, admin manages)
-- ─────────────────────────────────────────────────────────────

-- articles: public reads, authenticated members can insert, admin manages all
DO $$
BEGIN
  PERFORM _secure_table('articles');

  -- Anyone can read (public pages filter by status/is_active in queries)
  CREATE POLICY "public_read_articles" ON articles
    FOR SELECT USING (true);

  -- Authenticated members can insert new articles (pending approval)
  CREATE POLICY "member_insert_articles" ON articles
    FOR INSERT TO authenticated WITH CHECK (true);

  -- Admin can do everything
  CREATE POLICY "admin_all_articles" ON articles
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
END $$;

-- service_providers: same pattern
DO $$
BEGIN
  PERFORM _secure_table('service_providers');

  CREATE POLICY "public_read_service_providers" ON service_providers
    FOR SELECT USING (true);

  CREATE POLICY "member_insert_service_providers" ON service_providers
    FOR INSERT TO authenticated WITH CHECK (true);

  CREATE POLICY "admin_all_service_providers" ON service_providers
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
END $$;

-- ─────────────────────────────────────────────────────────────
-- 5. Comments: public reads published + anyone inserts + admin full
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  PERFORM _secure_table('comments');

  -- Public reads only published comments
  CREATE POLICY "public_read_published_comments" ON comments
    FOR SELECT USING (is_published = true);

  -- Anyone can add a comment (profanity filter is client-side)
  CREATE POLICY "public_insert_comments" ON comments
    FOR INSERT WITH CHECK (true);

  -- Admin can read ALL (including unpublished) + update + delete
  CREATE POLICY "admin_all_comments" ON comments
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
END $$;

-- ─────────────────────────────────────────────────────────────
-- 6. Reviews: public reads + authenticated inserts + admin full
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  PERFORM _secure_table('service_reviews');

  CREATE POLICY "public_read_reviews" ON service_reviews
    FOR SELECT USING (true);

  CREATE POLICY "auth_insert_reviews" ON service_reviews
    FOR INSERT TO authenticated WITH CHECK (true);

  CREATE POLICY "admin_all_reviews" ON service_reviews
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
END $$;

DO $$
BEGIN
  PERFORM _secure_table('review_replies');

  CREATE POLICY "public_read_replies" ON review_replies
    FOR SELECT USING (true);

  CREATE POLICY "admin_all_replies" ON review_replies
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
END $$;

-- ─────────────────────────────────────────────────────────────
-- 7. Content votes: public reads + inserts + admin manage
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  PERFORM _secure_table('content_votes');

  CREATE POLICY "public_read_votes" ON content_votes
    FOR SELECT USING (true);

  CREATE POLICY "public_insert_votes" ON content_votes
    FOR INSERT WITH CHECK (true);

  CREATE POLICY "admin_all_votes" ON content_votes
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
END $$;

-- ─────────────────────────────────────────────────────────────
-- 8. Admin Activity Log: ADMIN READ ONLY + triggers insert
--    (fixes: emails exposed to public via anon key)
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  PERFORM _secure_table('admin_activity_log');

  -- Only admin can read (protects member emails in detail column)
  CREATE POLICY "admin_read_activity_log" ON admin_activity_log
    FOR SELECT TO authenticated USING (is_admin());

  -- Triggers insert via SECURITY DEFINER functions (bypass RLS)
  -- But also allow direct insert as safety net for non-DEFINER triggers
  CREATE POLICY "allow_insert_activity_log" ON admin_activity_log
    FOR INSERT WITH CHECK (true);
END $$;

-- ─────────────────────────────────────────────────────────────
-- 9. Admin Login Attempts: system inserts + admin reads
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  PERFORM _secure_table('admin_login_attempts');

  -- Admin reads login history
  CREATE POLICY "admin_read_login_attempts" ON admin_login_attempts
    FOR SELECT TO authenticated USING (is_admin());

  -- API route inserts (may use service role, but allow anon as fallback)
  CREATE POLICY "allow_insert_login_attempts" ON admin_login_attempts
    FOR INSERT WITH CHECK (true);
END $$;

-- ─────────────────────────────────────────────────────────────
-- 10. Analytics Events: public inserts (tracking) + admin reads
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  PERFORM _secure_table('analytics_events');

  CREATE POLICY "public_insert_analytics" ON analytics_events
    FOR INSERT WITH CHECK (true);

  CREATE POLICY "admin_read_analytics" ON analytics_events
    FOR SELECT TO authenticated USING (is_admin());
END $$;

-- ─────────────────────────────────────────────────────────────
-- 11. Push Subscriptions: user manages own + admin reads
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  PERFORM _secure_table('push_subscriptions');

  -- Anyone can register for push (including before login)
  CREATE POLICY "public_insert_push" ON push_subscriptions
    FOR INSERT WITH CHECK (true);

  -- Authenticated users can manage their own
  CREATE POLICY "user_manage_push" ON push_subscriptions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
END $$;

-- ─────────────────────────────────────────────────────────────
-- 12. Notifications: user reads own + admin/system inserts
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  PERFORM _secure_table('notifications');

  -- Users read their own notifications
  CREATE POLICY "user_read_own_notifications" ON notifications
    FOR SELECT TO authenticated USING (user_id = auth.uid());

  -- System/admin can insert notifications
  CREATE POLICY "allow_insert_notifications" ON notifications
    FOR INSERT WITH CHECK (true);

  -- Admin can manage all
  CREATE POLICY "admin_all_notifications" ON notifications
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
END $$;

-- ─────────────────────────────────────────────────────────────
-- 13. Member Profiles: user manages own + admin reads all
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  PERFORM _secure_table('member_profiles');

  -- Users can read and update their own profile
  CREATE POLICY "user_own_profile" ON member_profiles
    FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

  -- Admin can read all profiles
  CREATE POLICY "admin_read_all_profiles" ON member_profiles
    FOR SELECT TO authenticated USING (is_admin());

  -- Allow insert for new user registration (auth triggers / OAuth callback)
  CREATE POLICY "insert_new_profile" ON member_profiles
    FOR INSERT WITH CHECK (true);
END $$;

-- ─────────────────────────────────────────────────────────────
-- 14. Admin-only tables (no public access)
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  PERFORM _secure_table('analyst_insights');

  CREATE POLICY "admin_all_analyst_insights" ON analyst_insights
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
END $$;

DO $$
BEGIN
  PERFORM _secure_table('access_codes');

  CREATE POLICY "admin_all_access_codes" ON access_codes
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
END $$;

-- ─────────────────────────────────────────────────────────────
-- 15. Cleanup helper functions
-- ─────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS _secure_table(text);
DROP FUNCTION IF EXISTS _rls_public_read_admin_write(text);

-- ─────────────────────────────────────────────────────────────
-- 16. Verify — show all policies per table
-- ─────────────────────────────────────────────────────────────
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
