-- ===================================================================
-- Fix: Update all triggers to fire on INSERT OR UPDATE (not just INSERT)
-- This ensures that upserted content also gets logged in admin_activity_log
-- Run in: Supabase Dashboard → SQL Editor
-- ===================================================================

-- A. Scenarios — fire on INSERT or UPDATE (only if title changed)
CREATE OR REPLACE FUNCTION log_new_scenario()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip if UPDATE didn't change the title (minor edit)
    IF TG_OP = 'UPDATE' AND OLD.title = NEW.title THEN
        RETURN NEW;
    END IF;

    -- For UPDATE, remove old log entry first to avoid duplicates
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM admin_activity_log
        WHERE entity_id = NEW.id::TEXT AND event_type = 'new_scenario';
    END IF;

    INSERT INTO admin_activity_log (event_type, title, detail, entity_id, entity_table)
    VALUES (
        'new_scenario',
        'سيناريو جديد: ' || COALESCE(NEW.title, 'بدون عنوان'),
        LEFT(COALESCE(NEW.description, ''), 100),
        NEW.id::TEXT,
        'consultant_scenarios'
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_scenario_log ON consultant_scenarios;
CREATE TRIGGER on_new_scenario_log
    AFTER INSERT OR UPDATE ON consultant_scenarios
    FOR EACH ROW EXECUTE FUNCTION log_new_scenario();

-- B. Articles
CREATE OR REPLACE FUNCTION log_new_article()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.title = NEW.title THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM admin_activity_log
        WHERE entity_id = NEW.id::TEXT AND event_type = 'new_article';
    END IF;
    INSERT INTO admin_activity_log (event_type, title, detail, entity_id, entity_table)
    VALUES (
        'new_article',
        'مقال جديد: ' || COALESCE(NEW.title, 'بدون عنوان'),
        COALESCE(NEW.category, ''),
        NEW.id::TEXT,
        'articles'
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_article_log ON articles;
CREATE TRIGGER on_new_article_log
    AFTER INSERT OR UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION log_new_article();

-- C. FAQs
CREATE OR REPLACE FUNCTION log_new_faq()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.question = NEW.question THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM admin_activity_log
        WHERE entity_id = NEW.id::TEXT AND event_type = 'new_faq';
    END IF;
    INSERT INTO admin_activity_log (event_type, title, detail, entity_id, entity_table)
    VALUES (
        'new_faq',
        'سؤال جديد: ' || LEFT(COALESCE(NEW.question, 'بدون سؤال'), 80),
        LEFT(COALESCE(NEW.answer, ''), 100),
        NEW.id::TEXT,
        'faqs'
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_faq_log ON faqs;
CREATE TRIGGER on_new_faq_log
    AFTER INSERT OR UPDATE ON faqs
    FOR EACH ROW EXECUTE FUNCTION log_new_faq();

-- D. Security codes
CREATE OR REPLACE FUNCTION log_new_code()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.title = NEW.title THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM admin_activity_log
        WHERE entity_id = NEW.code::TEXT AND event_type = 'new_code';
    END IF;
    INSERT INTO admin_activity_log (event_type, title, detail, entity_id, entity_table)
    VALUES (
        'new_code',
        'كود أمني: ' || COALESCE(NEW.code, '?') || ' — ' || COALESCE(NEW.title, ''),
        LEFT(COALESCE(NEW.description, ''), 100),
        NEW.code::TEXT,
        'security_codes'
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_code_log ON security_codes;
CREATE TRIGGER on_new_code_log
    AFTER INSERT OR UPDATE ON security_codes
    FOR EACH ROW EXECUTE FUNCTION log_new_code();

-- E. Restricted zones
CREATE OR REPLACE FUNCTION log_new_zone()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.district = NEW.district AND OLD.neighborhood = NEW.neighborhood THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM admin_activity_log
        WHERE entity_id = NEW.id::TEXT AND event_type = 'new_zone';
    END IF;
    INSERT INTO admin_activity_log (event_type, title, detail, entity_id, entity_table)
    VALUES (
        'new_zone',
        'منطقة محظورة: ' || COALESCE(NEW.district, '') || ' — ' || COALESCE(NEW.neighborhood, ''),
        COALESCE(NEW.city, ''),
        NEW.id::TEXT,
        'restricted_zones'
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_zone_log ON restricted_zones;
CREATE TRIGGER on_new_zone_log
    AFTER INSERT OR UPDATE ON restricted_zones
    FOR EACH ROW EXECUTE FUNCTION log_new_zone();

-- F. Updates/News
CREATE OR REPLACE FUNCTION log_new_update()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.title = NEW.title THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM admin_activity_log
        WHERE entity_id = NEW.id::TEXT AND event_type = 'new_update';
    END IF;
    INSERT INTO admin_activity_log (event_type, title, detail, entity_id, entity_table)
    VALUES (
        'new_update',
        'خبر: ' || COALESCE(NEW.title, 'بدون عنوان'),
        COALESCE(NEW.type, ''),
        NEW.id::TEXT,
        'updates'
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_update_log ON updates;
CREATE TRIGGER on_new_update_log
    AFTER INSERT OR UPDATE ON updates
    FOR EACH ROW EXECUTE FUNCTION log_new_update();

-- G. Tools
CREATE OR REPLACE FUNCTION log_new_tool()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.name = NEW.name THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM admin_activity_log
        WHERE entity_id = COALESCE(OLD.key, OLD.name, '')::TEXT AND event_type = 'new_tool';
    END IF;
    INSERT INTO admin_activity_log (event_type, title, detail, entity_id, entity_table)
    VALUES (
        'new_tool',
        'أداة جديدة: ' || COALESCE(NEW.name, 'بدون اسم'),
        COALESCE(NEW.route, ''),
        COALESCE(NEW.key, NEW.name, '')::TEXT,
        'tools_registry'
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_tool_log ON tools_registry;
CREATE TRIGGER on_new_tool_log
    AFTER INSERT OR UPDATE ON tools_registry
    FOR EACH ROW EXECUTE FUNCTION log_new_tool();

-- H. Official sources
CREATE OR REPLACE FUNCTION log_new_source()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.name = NEW.name THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM admin_activity_log
        WHERE entity_id = NEW.id::TEXT AND event_type = 'new_source';
    END IF;
    INSERT INTO admin_activity_log (event_type, title, detail, entity_id, entity_table)
    VALUES (
        'new_source',
        'مصدر رسمي: ' || COALESCE(NEW.name, 'بدون اسم'),
        COALESCE(NEW.description, ''),
        NEW.id::TEXT,
        'official_sources'
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_source_log ON official_sources;
CREATE TRIGGER on_new_source_log
    AFTER INSERT OR UPDATE ON official_sources
    FOR EACH ROW EXECUTE FUNCTION log_new_source();
