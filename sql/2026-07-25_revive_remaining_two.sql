-- إحياء المقالين المتبقّيين — جاهز للتشغيل كما هو، لا شيء تحذفه أو تعدّله.
-- (مقال أورفا أُحيي بالفعل في الخطوة السابقة.)

UPDATE articles SET active = TRUE WHERE id = 'syria-turkey-visa-types-2026';
UPDATE articles SET active = TRUE WHERE id = 'goc-idaresi-updates-2026';

-- التحقّق: المفروض ألّا يظهر أي صف بعد الآن.
SELECT id, status, last_update FROM articles WHERE active = FALSE;
