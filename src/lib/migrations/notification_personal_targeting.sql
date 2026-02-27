-- ===================================================================
-- إضافة استهداف شخصي للإشعارات
-- Run once in: Supabase Dashboard → SQL Editor
-- ===================================================================

-- 1. إضافة عمود target_user_id (NULL = إشعار عام، قيمة = إشعار شخصي)
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS target_user_id TEXT DEFAULT NULL;

-- 2. فهرس للبحث السريع عن الإشعارات الشخصية
CREATE INDEX IF NOT EXISTS idx_notifications_target_user
ON public.notifications(target_user_id)
WHERE target_user_id IS NOT NULL;

-- 3. تحديث دالة جلب الإشعارات غير المقروءة
CREATE OR REPLACE FUNCTION get_unread_notifications(p_user_identifier TEXT)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  message TEXT,
  link TEXT,
  icon TEXT,
  priority TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.type,
    n.title,
    n.message,
    n.link,
    n.icon,
    n.priority,
    n.created_at
  FROM public.notifications n
  LEFT JOIN public.notification_reads nr
    ON n.id = nr.notification_id AND nr.user_identifier = p_user_identifier
  WHERE n.is_active = true
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
    AND nr.id IS NULL
    AND (n.target_user_id IS NULL OR n.target_user_id = p_user_identifier)
  ORDER BY
    CASE n.priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END,
    n.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. تحديث دالة حساب عدد الإشعارات غير المقروءة
CREATE OR REPLACE FUNCTION get_unread_count(p_user_identifier TEXT)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM public.notifications n
  LEFT JOIN public.notification_reads nr
    ON n.id = nr.notification_id AND nr.user_identifier = p_user_identifier
  WHERE n.is_active = true
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
    AND nr.id IS NULL
    AND (n.target_user_id IS NULL OR n.target_user_id = p_user_identifier);

  RETURN unread_count;
END;
$$ LANGUAGE plpgsql;
