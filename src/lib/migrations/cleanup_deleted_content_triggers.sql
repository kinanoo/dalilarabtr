-- ===================================================================
-- Cleanup Triggers — حذف سجل النشاط تلقائياً عند حذف المحتوى
-- يمنع ظهور روابط ميتة في "آخر التحديثات"
-- Run once in: Supabase Dashboard → SQL Editor
-- ===================================================================

-- 0. RLS: السماح بالحذف من admin_activity_log (للـ triggers)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'admin_activity_log' AND policyname = 'allow_delete_activity'
    ) THEN
        CREATE POLICY "allow_delete_activity" ON admin_activity_log
            FOR DELETE USING (true);
    END IF;
END $$;

-- ─── Generic cleanup function (للجداول التي تستخدم id) ─────────────
CREATE OR REPLACE FUNCTION cleanup_activity_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM admin_activity_log
    WHERE entity_table = TG_TABLE_NAME
      AND entity_id = OLD.id::TEXT;
    RETURN OLD;
EXCEPTION WHEN OTHERS THEN
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Special: security_codes (entity_id = code, not id) ────────────
CREATE OR REPLACE FUNCTION cleanup_code_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM admin_activity_log
    WHERE entity_table = 'security_codes'
      AND entity_id = OLD.code::TEXT;
    RETURN OLD;
EXCEPTION WHEN OTHERS THEN
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Special: tools_registry (entity_id = key or name) ─────────────
CREATE OR REPLACE FUNCTION cleanup_tool_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM admin_activity_log
    WHERE entity_table = 'tools_registry'
      AND entity_id IN (COALESCE(OLD.key, ''), COALESCE(OLD.name, ''));
    RETURN OLD;
EXCEPTION WHEN OTHERS THEN
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- CREATE DELETE TRIGGERS
-- ===================================================================

-- A. articles
DROP TRIGGER IF EXISTS on_delete_article_log ON articles;
CREATE TRIGGER on_delete_article_log
    AFTER DELETE ON articles
    FOR EACH ROW EXECUTE FUNCTION cleanup_activity_on_delete();

-- B. consultant_scenarios
DROP TRIGGER IF EXISTS on_delete_scenario_log ON consultant_scenarios;
CREATE TRIGGER on_delete_scenario_log
    AFTER DELETE ON consultant_scenarios
    FOR EACH ROW EXECUTE FUNCTION cleanup_activity_on_delete();

-- C. faqs
DROP TRIGGER IF EXISTS on_delete_faq_log ON faqs;
CREATE TRIGGER on_delete_faq_log
    AFTER DELETE ON faqs
    FOR EACH ROW EXECUTE FUNCTION cleanup_activity_on_delete();

-- D. security_codes (uses special function)
DROP TRIGGER IF EXISTS on_delete_code_log ON security_codes;
CREATE TRIGGER on_delete_code_log
    AFTER DELETE ON security_codes
    FOR EACH ROW EXECUTE FUNCTION cleanup_code_on_delete();

-- E. restricted_zones
DROP TRIGGER IF EXISTS on_delete_zone_log ON restricted_zones;
CREATE TRIGGER on_delete_zone_log
    AFTER DELETE ON restricted_zones
    FOR EACH ROW EXECUTE FUNCTION cleanup_activity_on_delete();

-- F. updates
DROP TRIGGER IF EXISTS on_delete_update_log ON updates;
CREATE TRIGGER on_delete_update_log
    AFTER DELETE ON updates
    FOR EACH ROW EXECUTE FUNCTION cleanup_activity_on_delete();

-- G. tools_registry (uses special function)
DROP TRIGGER IF EXISTS on_delete_tool_log ON tools_registry;
CREATE TRIGGER on_delete_tool_log
    AFTER DELETE ON tools_registry
    FOR EACH ROW EXECUTE FUNCTION cleanup_tool_on_delete();

-- H. official_sources
DROP TRIGGER IF EXISTS on_delete_source_log ON official_sources;
CREATE TRIGGER on_delete_source_log
    AFTER DELETE ON official_sources
    FOR EACH ROW EXECUTE FUNCTION cleanup_activity_on_delete();

-- I. service_providers
DROP TRIGGER IF EXISTS on_delete_service_log ON service_providers;
CREATE TRIGGER on_delete_service_log
    AFTER DELETE ON service_providers
    FOR EACH ROW EXECUTE FUNCTION cleanup_activity_on_delete();

-- ===================================================================
-- ONE-TIME CLEANUP: حذف السجلات اليتيمة الموجودة حالياً
-- (محتوى حُذف قبل تفعيل هذه الـ triggers)
-- ===================================================================

DELETE FROM admin_activity_log
WHERE entity_table = 'articles'
  AND entity_id IS NOT NULL
  AND entity_id NOT IN (SELECT id::TEXT FROM articles);

DELETE FROM admin_activity_log
WHERE entity_table = 'consultant_scenarios'
  AND entity_id IS NOT NULL
  AND entity_id NOT IN (SELECT id::TEXT FROM consultant_scenarios);

DELETE FROM admin_activity_log
WHERE entity_table = 'faqs'
  AND entity_id IS NOT NULL
  AND entity_id NOT IN (SELECT id::TEXT FROM faqs);

DELETE FROM admin_activity_log
WHERE entity_table = 'security_codes'
  AND entity_id IS NOT NULL
  AND entity_id NOT IN (SELECT code::TEXT FROM security_codes);

DELETE FROM admin_activity_log
WHERE entity_table = 'restricted_zones'
  AND entity_id IS NOT NULL
  AND entity_id NOT IN (SELECT id::TEXT FROM restricted_zones);

DELETE FROM admin_activity_log
WHERE entity_table = 'updates'
  AND entity_id IS NOT NULL
  AND entity_id NOT IN (SELECT id::TEXT FROM updates);

DELETE FROM admin_activity_log
WHERE entity_table = 'service_providers'
  AND entity_id IS NOT NULL
  AND entity_id NOT IN (SELECT id::TEXT FROM service_providers);
