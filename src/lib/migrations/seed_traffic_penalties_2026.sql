-- =============================================
-- مقال: عقوبات مرورية جديدة في تركيا 2026
-- شغّل هذا في Supabase SQL Editor (مرة واحدة)
-- =============================================

-- 1. إدراج المقال
INSERT INTO public.articles (id, slug, title, category, intro, details, steps, tips, warning, source, created_at)
VALUES (
    'عقوبات-مرورية-جديدة-تركيا-2026',
    'traffic-penalties-turkey-2026',
    'عقوبات مرورية جديدة تدخل حيّز التنفيذ في تركيا 2026',
    'المرور والسيارات',
    'بدأ تطبيق حزمة عقوبات مرورية جديدة في تركيا بهدف الحد من الفوضى المرورية وتعزيز السلامة على الطرقات. تشمل غرامات تصل إلى 280 ألف ليرة وسحب الرخصة وحجز المركبة.',
    '<h2 style="color:#dc2626;font-size:1.3em;margin-bottom:12px;">🔴 الملاحقة بقصد الاعتداء والنزول من المركبة</h2>
<ul style="margin-bottom:20px;line-height:2;">
<li>غرامة <strong>180,000 ليرة تركية</strong></li>
<li>سحب رخصة القيادة <strong>60 يومًا</strong></li>
<li>حجز المركبة <strong>30 يومًا</strong></li>
<li>فحص نفسي إلزامي لاستعادة الرخصة</li>
</ul>

<h2 style="color:#dc2626;font-size:1.3em;margin-bottom:12px;">🍺 القيادة تحت تأثير الكحول</h2>
<ul style="margin-bottom:20px;line-height:2;">
<li>المرة الأولى: <strong>25,000 ليرة</strong></li>
<li>المرة الثانية: <strong>50,000 ليرة</strong></li>
<li>الثالثة وما بعدها: <strong>150,000 ليرة</strong></li>
</ul>

<h2 style="color:#dc2626;font-size:1.3em;margin-bottom:12px;">💊 القيادة تحت تأثير المخدرات</h2>
<ul style="margin-bottom:20px;line-height:2;">
<li>غرامة <strong>150,000 ليرة</strong></li>
<li><strong>إلغاء رخصة القيادة نهائيًا</strong></li>
</ul>

<h2 style="color:#dc2626;font-size:1.3em;margin-bottom:12px;">❌ رفض الخضوع للفحص</h2>
<ul style="margin-bottom:20px;line-height:2;">
<li>غرامة <strong>150,000 ليرة</strong></li>
<li>سحب رخصة القيادة لمدة <strong>5 سنوات</strong></li>
</ul>

<h2 style="color:#dc2626;font-size:1.3em;margin-bottom:12px;">🚫 القيادة دون رخصة</h2>
<ul style="margin-bottom:20px;line-height:2;">
<li>بدون رخصة: <strong>40,000 ليرة</strong></li>
<li>برخصة مسحوبة أو ملغاة: <strong>200,000 ليرة</strong></li>
<li>تمكين شخص ملغاة رخصته من القيادة (بحق مالك المركبة): <strong>40,000 ليرة</strong></li>
</ul>

<h2 style="color:#dc2626;font-size:1.3em;margin-bottom:12px;">🏍️ الدرفت والحركات الاستعراضية (بما فيها الدراجات النارية)</h2>
<ul style="margin-bottom:20px;line-height:2;">
<li>غرامة <strong>46,000 ليرة</strong></li>
<li>سحب الرخصة <strong>60 يومًا</strong></li>
<li>حجز المركبة <strong>60 يومًا</strong></li>
<li>التكرار مرتين خلال 5 سنوات: <strong>إلغاء الرخصة</strong></li>
</ul>

<h2 style="color:#f59e0b;font-size:1.3em;margin-bottom:12px;">⚠️ مخالفات خطِرة</h2>
<ul style="margin-bottom:20px;line-height:2;">
<li>المناورة الخطرة بين المركبات (مقص): <strong>90,000 ليرة</strong></li>
<li>السير بعكس الاتجاه: <strong>90,000 ليرة</strong></li>
<li>إغلاق الطريق في مواكب الأعراس: <strong>90,000 ليرة</strong></li>
<li>القيادة على رصيف المشاة: <strong>5,000 ليرة</strong></li>
</ul>

<h2 style="color:#dc2626;font-size:1.3em;margin-bottom:12px;">🛑 عدم الامتثال لإشارة "توقف"</h2>
<ul style="margin-bottom:20px;line-height:2;">
<li>غرامة <strong>200,000 ليرة</strong></li>
<li>سحب الرخصة <strong>60 يومًا</strong></li>
<li>حجز المركبة <strong>60 يومًا</strong></li>
</ul>

<h2 style="color:#dc2626;font-size:1.3em;margin-bottom:12px;">🚥 تجاوز الإشارة الحمراء (خلال سنة واحدة)</h2>
<ul style="margin-bottom:20px;line-height:2;">
<li>المخالفة الثانية: <strong>10,000 ليرة</strong></li>
<li>الثالثة: <strong>15,000 ليرة</strong></li>
<li>الرابعة: <strong>20,000 ليرة</strong></li>
<li>الخامسة: <strong>30,000 ليرة</strong></li>
<li>السادسة: <strong>80,000 ليرة</strong></li>
<li>6 مخالفات خلال سنة: <strong>إلغاء الرخصة</strong></li>
<li>في حال التسبب بحادث: سحب الرخصة <strong>60 يومًا</strong></li>
</ul>

<h2 style="color:#3b82f6;font-size:1.3em;margin-bottom:12px;">📱 استخدام الهاتف أثناء القيادة</h2>
<ul style="margin-bottom:20px;line-height:2;">
<li>المرة الأولى: <strong>5,000 ليرة</strong></li>
<li>الثانية خلال سنة: <strong>10,000 ليرة</strong></li>
<li>الثالثة وما بعدها: <strong>20,000 ليرة</strong> + سحب الرخصة <strong>30 يومًا</strong></li>
</ul>

<h2 style="color:#3b82f6;font-size:1.3em;margin-bottom:12px;">🚘 مخالفات لوحات المركبات</h2>
<ul style="margin-bottom:20px;line-height:2;">
<li>لوحة غير مطابقة/ناقصة: <strong>4,000 ليرة</strong> ومنع السير حتى التصحيح</li>
<li>تعديل يمنع قراءة اللوحة: <strong>140,000 ليرة</strong> + حجز المركبة <strong>30 يومًا</strong></li>
<li>تغيير اللوحة أكثر من مرة خلال سنة: <strong>280,000 ليرة</strong> + حجز المركبة <strong>60 يومًا</strong></li>
<li>لوحة مزورة أو غير مسجلة: <strong>140,000 ليرة</strong> + سحب الرخصة <strong>30 يومًا</strong> + حجز المركبة</li>
</ul>

<h2 style="color:#f59e0b;font-size:1.3em;margin-bottom:12px;">⚡ مخالفات السرعة</h2>
<ul style="margin-bottom:20px;line-height:2;">
<li>داخل المدن: تبدأ من <strong>2,000 ليرة</strong> وتصل إلى <strong>30,000 ليرة</strong> مع سحب الرخصة حتى <strong>90 يومًا</strong></li>
<li>خارج المدن: تبدأ من <strong>2,000 ليرة</strong> وتصل إلى <strong>30,000 ليرة</strong></li>
</ul>

<div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:12px;padding:16px;margin-top:24px;">
<strong style="color:#92400e;">📌 ملاحظة هامة:</strong> هذه العقوبات سارية المفعول اعتبارًا من 28 فبراير 2026. الهدف منها الحد من الفوضى المرورية وتعزيز السلامة على الطرقات التركية.
</div>',
    ARRAY[
        'التزم بقواعد السير وحدود السرعة المحددة',
        'لا تستخدم الهاتف أثناء القيادة — الغرامة تتضاعف مع التكرار',
        'تأكد من أن رخصة قيادتك سارية المفعول',
        'لا تقم بحركات استعراضية (درفت) — العقوبة تشمل حجز المركبة',
        'احترم إشارات المرور — 6 مخالفات تجاوز للإشارة الحمراء خلال سنة = إلغاء الرخصة',
        'في حال تعرضك لمخالفة يمكنك دفعها عبر e-Devlet أو عبر PTT'
    ],
    ARRAY[
        'احتفظ بنسخة من رخصة القيادة في هاتفك عبر تطبيق e-Devlet',
        'يمكن الاستعلام عن المخالفات عبر بوابة e-Devlet (turkiye.gov.tr)',
        'الدفع المبكر للغرامة (خلال 15 يومًا) قد يمنحك خصمًا',
        'إذا كنت تحمل رخصة أجنبية تأكد من تحويلها لرخصة تركية خلال المهلة القانونية'
    ],
    'هذه المعلومات للأغراض التوعوية فقط. قد تتغير المبالغ والعقوبات. للتأكد من آخر التحديثات راجع الموقع الرسمي لمديرية المرور التركية.',
    'https://newturkpost.com/news/113123',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    title = EXCLUDED.title,
    intro = EXCLUDED.intro,
    details = EXCLUDED.details,
    steps = EXCLUDED.steps,
    tips = EXCLUDED.tips,
    warning = EXCLUDED.warning,
    source = EXCLUDED.source;

-- 2. إدراج تحديث في صفحة التحديثات
INSERT INTO public.updates (title, content, type, date, active, link, image)
VALUES (
    'عقوبات مرورية جديدة تدخل حيّز التنفيذ اليوم في تركيا 🚦',
    'بدأ تطبيق حزمة عقوبات مرورية جديدة في تركيا تشمل غرامات تصل إلى 280 ألف ليرة وسحب الرخصة وحجز المركبة. اطلع على التفاصيل الكاملة.',
    'هام',
    '2026-02-28',
    true,
    '/article/traffic-penalties-turkey-2026',
    NULL
);

-- 3. إشعار في جرس الإشعارات
INSERT INTO public.notifications (type, title, message, link, icon, priority, is_active)
VALUES (
    'alert',
    'عقوبات مرورية جديدة في تركيا 🚦',
    'بدأ تطبيق عقوبات مرورية جديدة تشمل غرامات تصل إلى 280 ألف ليرة. اطلع على التفاصيل.',
    '/article/traffic-penalties-turkey-2026',
    '🚦',
    'high',
    true
);
