-- توحيد تصنيفات المقالات وإزالة القفزة الإضافية من الروابط الداخلية القديمة.
-- لا يتغير أي slug حي ولا تُحذف أي صفحة؛ التحويلات في next.config.ts تبقى
-- لحماية الروابط المنشورة خارج الموقع، بينما المحتوى الداخلي يشير مباشرةً
-- إلى الوجهة النهائية.

SET LOCAL session_replication_role = replica;

UPDATE public.articles
SET category = CASE category
  WHEN 'syrians'   THEN 'خدمات السوريين'
  WHEN 'visa'      THEN 'الفيزا والتأشيرات'
  WHEN 'residence' THEN 'أنواع الإقامات'
  WHEN 'kimlik'    THEN 'الكملك والحماية المؤقتة'
  WHEN 'work'      THEN 'العمل والاستثمار'
  WHEN 'housing'   THEN 'السكن والحياة'
  WHEN 'edevlet'   THEN 'خدمات e-Devlet'
  WHEN 'official'  THEN 'معاملات رسمية'
  WHEN 'education' THEN 'الدراسة والتعليم'
  WHEN 'traffic'   THEN 'المرور والسيارات'
  ELSE category
END
WHERE category IN (
  'syrians', 'visa', 'residence', 'kimlik', 'work',
  'housing', 'edevlet', 'official', 'education', 'traffic'
);

DO $direct_links$
DECLARE
  link_fix record;
BEGIN
  FOR link_fix IN
    SELECT * FROM (VALUES
      ('/article/highschool-denklik', '/article/high-school-equivalency-turkey-2026'),
      ('/article/yos-exam-guide', '/article/yks-vs-yos-placement-by-schooling-2026'),
      ('/article/student-residence', '/article/tourist-vs-student-residence-2025'),
      ('/article/auto-ehliyet-new-from-zero', '/article/theory-exam-arabic-2026'),
      ('/article/driver-theory-prep', '/article/theory-exam-arabic-2026'),
      ('/article/auto-ehliyet-conversion', '/article/license-conversion-arab-countries-2026'),
      ('/article/driving-license', '/article/license-conversion-arab-countries-2026'),
      ('/article/auto-license-suspension-points-alcohol', '/article/traffic-fines'),
      ('/article/kimlik-work-and-sgk', '/article/work-permit-turkey-2026'),
      ('/article/turkcell-yabanci-hat-kimlik-dogrulama-2026-06', '/article/gecici-koruma-hat-guncelleme-2026'),
      ('/article/exemption-work-permit-full-guide-2026-06', '/article/muafiyet-bilgi-formu-kimlik-work-permit-exemption-sgk-2026'),
      ('/article/school-registration', '/article/school-registration-turkey'),
      ('/article/tourist-residence', '/article/tourist-residence-renewal-turkey-2026'),
      ('/article/deportation-centers-rights', '/article/detention-center-rights')
    ) AS fixes(old_path, new_path)
  LOOP
    UPDATE public.articles
    SET details = replace(details, link_fix.old_path, link_fix.new_path)
    WHERE status = 'approved'
      AND position(link_fix.old_path IN details) > 0;
  END LOOP;
END
$direct_links$;

SET LOCAL session_replication_role = origin;

DO $verify$
DECLARE
  english_categories integer;
  stale_links integer;
BEGIN
  SELECT count(*) INTO english_categories
  FROM public.articles
  WHERE status = 'approved'
    AND category IN (
      'syrians', 'visa', 'residence', 'kimlik', 'work',
      'housing', 'edevlet', 'official', 'education', 'traffic'
    );

  SELECT count(*) INTO stale_links
  FROM public.articles a
  CROSS JOIN (VALUES
    ('/article/highschool-denklik'),
    ('/article/yos-exam-guide'),
    ('/article/student-residence'),
    ('/article/auto-ehliyet-new-from-zero'),
    ('/article/driver-theory-prep'),
    ('/article/auto-ehliyet-conversion'),
    ('/article/driving-license'),
    ('/article/auto-license-suspension-points-alcohol'),
    ('/article/kimlik-work-and-sgk'),
    ('/article/turkcell-yabanci-hat-kimlik-dogrulama-2026-06'),
    ('/article/exemption-work-permit-full-guide-2026-06'),
    ('/article/school-registration'),
    ('/article/tourist-residence'),
    ('/article/deportation-centers-rights')
  ) AS old_links(path)
  WHERE a.status = 'approved'
    AND position(old_links.path IN a.details) > 0;

  IF english_categories <> 0 THEN
    RAISE EXCEPTION 'taxonomy verification failed: % English categories remain', english_categories;
  END IF;
  IF stale_links <> 0 THEN
    RAISE EXCEPTION 'direct-link verification failed: % stale links remain', stale_links;
  END IF;
END
$verify$;

SELECT category, count(*) AS approved_articles
FROM public.articles
WHERE status = 'approved'
GROUP BY category
ORDER BY approved_articles DESC, category;
