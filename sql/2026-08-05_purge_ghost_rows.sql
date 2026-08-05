-- ============================================================================
-- حذف الصفوف «الشبح» — لها تحويل 308 وما زالت في القاعدة (2026-08-05)
-- ============================================================================
-- كل دمج في تاريخ هذا المستودع أضاف تحويلاً في next.config.ts ونسي حذف الصفّ
-- من قاعدة البيانات. النتيجة صفحة تعيش حياتين: رابطها يقفز إلى الصفحة الباقية،
-- لكن صفّها يبقى فيظهر في صفحات التصنيف وفي خريطة الموقع وفي البحث الداخلي.
-- أي أنّنا نرسل جوجل إلى روابط نعرف أنّها ستُحوّل، ونعرض للقارئ بطاقات تقفز به
-- إلى مكان آخر.
--
-- هذه آخر ثلاثة. سبق حذف school-registration و family-reunion-documents
-- و family-reunion-application في دفعتَي 2026-08-05 السابقتين.
--
-- وأُضيف scripts/audit-ghost-rows.mjs في نفس الدفعة: يقارن مصادر التحويل في
-- next.config.ts بالصفوف الحيّة ويفشل إن وُجد شبح — كي لا يعود هذا الصنف من
-- الخطأ يتراكم بصمت بعد كل دمج.
--
-- آمن لإعادة التشغيل. شغّله مرّة واحدة في Supabase ← SQL Editor.
-- ============================================================================

DELETE FROM articles
WHERE slug IN (
  'family-reunion-conditions',   -- ← /article/family-reunion
  'kimlik-update-data',          -- ← /article/kimlik-data-update
  'turkish-citizenship-syrians'  -- ← /article/citizenship-syrians
);

-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — الأول صفر صفوف، والثاني صفر أيضاً (لا مقال بلا عنوان بحث)
SELECT slug FROM articles
WHERE slug IN ('family-reunion-conditions', 'kimlik-update-data', 'turkish-citizenship-syrians');

SELECT count(*) AS مقالات_بلا_عنوان_بحث
FROM articles
WHERE status = 'approved'
  AND (coalesce(trim(seo_title), '') = '' OR coalesce(trim(seo_description), '') = '');
