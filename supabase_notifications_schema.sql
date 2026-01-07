-- ============================================
-- 🔔 نظام الإشعارات (Notifications System)
-- ============================================
-- تاريخ الإنشاء: 2025-12-27
-- الغرض: إشعارات داخل الموقع للتحديثات المهمة
-- ============================================

-- ============================================
-- 1. جدول الإشعارات
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- نوع الإشعار
  type TEXT NOT NULL, -- 'article', 'law', 'service', 'update', 'alert', 'announcement'
  
  -- المحتوى
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- رابط للمزيد من التفاصيل
  icon TEXT, -- اسم الأيقونة (emoji أو lucide icon name)
  
  -- الأولوية
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  
  -- الجمهور المستهدف
  target_audience TEXT DEFAULT 'all', -- 'all', 'syrians', 'tourists', 'students', etc
  
  -- صلاحية الإشعار
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- الحالة
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. جدول قراءة الإشعارات
-- ============================================
CREATE TABLE IF NOT EXISTS public.notification_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  
  -- معرّف المستخدم (IP أو session ID)
  user_identifier TEXT NOT NULL,
  
  -- وقت القراءة
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- منع التكرار
  UNIQUE(notification_id, user_identifier)
);

-- ============================================
-- 3. Indexes للأداء
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notifications_active ON public.notifications(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON public.notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON public.notification_reads(user_identifier);
CREATE INDEX IF NOT EXISTS idx_notification_reads_notif ON public.notification_reads(notification_id);

-- ============================================
-- 4. Trigger لتحديث updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_timestamp 
BEFORE UPDATE ON public.notifications
FOR EACH ROW 
EXECUTE FUNCTION update_notifications_updated_at();

-- ============================================
-- 5. Function للحصول على الإشعارات غير المقروءة
-- ============================================
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
    AND nr.id IS NULL -- غير مقروء
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

-- ============================================
-- 6. Function لحساب عدد الإشعارات غير المقروءة
-- ============================================
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
    AND nr.id IS NULL;
    
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Row Level Security (RLS)
-- ============================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- السماح بالقراءة للإشعارات النشطة وغير المنتهية
CREATE POLICY "Allow public read active notifications" 
ON public.notifications
FOR SELECT 
USING (
  is_active = true 
  AND (expires_at IS NULL OR expires_at > NOW())
);

-- السماح بقراءة جميع سجلات القراءة
CREATE POLICY "Allow public read notification reads" 
ON public.notification_reads
FOR SELECT 
USING (true);

-- السماح بتحديد كمقروء
CREATE POLICY "Allow public insert notification reads" 
ON public.notification_reads
FOR INSERT 
WITH CHECK (true);

-- ============================================
-- 8. إدراج إشعارات تجريبية (اختياري)
-- ============================================
INSERT INTO public.notifications (type, title, message, link, icon, priority) VALUES
  ('article', 'مقال جديد: تحديث قانون الإقامات', 'تم إضافة مقال شامل عن التحديثات الجديدة على قانون الإقامات لعام 2025', '/article/residence-law-2025', '📄', 'high'),
  ('alert', 'تنبيه: موعد تجديد الإقامات', 'تذكير: موعد تجديد الإقامات ينتهي في نهاية الشهر الحالي', '/residence', '⚠️', 'urgent'),
  ('service', 'خدمة جديدة: محامي مختص', 'تم إضافة محامي جديد مختص في قضايا التجنيس والجنسية التركية', '/services', '💼', 'medium');

-- ============================================
-- تم الانتهاء!
-- ============================================
