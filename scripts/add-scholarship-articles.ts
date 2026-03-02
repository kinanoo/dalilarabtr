import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.vercel' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── المقال 1: الدليل الشامل للمنح ───────────────────────────────
const article1 = {
    id: 'scholarship-turkey-overview',
    slug: 'scholarship-turkey-overview',
    title: 'المنح الدراسية في تركيا 2026 — الدليل الشامل لجميع الخيارات',
    category: 'الدراسة والتعليم',
    intro: 'دليل شامل لجميع المنح الدراسية المتاحة للطلاب العرب والأجانب في تركيا: منحة الحكومة التركية (Türkiye Bursları)، منح الجامعات الخاصة (سابانجي، بيلكنت، كوتش)، برنامج TÜBITAK للبحث العلمي، المنحة المشتركة YTB-IsDB، وبرنامج Erasmus+. مقارنة كاملة بين جميع المنح من حيث التمويل والشروط وطريقة التقديم.',
    details: `
<h2>لماذا الدراسة في تركيا؟</h2>

<p>تركيا أصبحت واحدة من أهم الوجهات الدراسية في العالم، حيث تضم أكثر من <strong>200 جامعة</strong> معترف بها دولياً، وتستقطب سنوياً أكثر من <strong>200,000 طالب دولي</strong>. تتميز تركيا بتكلفة معيشة معقولة مقارنة بأوروبا، ومجتمع عربي كبير يسهّل التأقلم، وبرامج منح سخية تغطي كل تكاليف الدراسة.</p>

<hr/>

<h2>أنواع المنح الدراسية المتاحة</h2>

<h3>1. منحة الحكومة التركية (Türkiye Bursları)</h3>
<p>أشهر وأكبر برنامج منح في تركيا، تموّله رئاسة الجمهورية عبر هيئة YTB. تغطي <strong>كل شيء</strong>: الرسوم الدراسية، السكن، الراتب الشهري، التأمين الصحي، تذاكر الطيران، وسنة كاملة لتعلم اللغة التركية (TOMER).</p>
<p><a href="/article/scholarship-turkiye-burslari" style="color: #10b981; font-weight: bold; text-decoration: underline;">📖 اقرأ الدليل الكامل للتقديم على منحة الحكومة التركية</a></p>

<h3>2. منح الجامعات التركية الخاصة</h3>
<p>جامعات مرموقة مثل <strong>سابانجي</strong> (إعفاء 100% من الرسوم)، <strong>بيلكنت</strong> (راتب شهري يصل إلى 1,500$)، و<strong>كوتش</strong> (صندوق منح بـ 15 مليون دولار سنوياً) تقدم منحاً سخية للطلاب الدوليين. المنافسة أقل من المنحة الحكومية والفرص أكبر.</p>
<p><a href="/article/scholarship-university-programs" style="color: #10b981; font-weight: bold; text-decoration: underline;">📖 اكتشف منح الجامعات وبرامج التمويل الأخرى</a></p>

<h3>3. برامج التمويل الدولية</h3>
<p>تشمل <strong>TÜBITAK 2215</strong> للبحث العلمي (ماجستير ودكتوراه)، <strong>المنحة المشتركة YTB-IsDB</strong> لمواطني الدول الإسلامية (تشمل جميع الدول العربية)، وبرنامج <strong>Erasmus+</strong> للتبادل الطلابي من جامعات شريكة.</p>

<h3>4. مؤسسة المعارف التركية (Türkiye Maarif Vakfı)</h3>
<p>تقدم منحاً لخريجي مدارس المعارف التركية المنتشرة في 67 دولة لمتابعة الدراسة الجامعية في تركيا.</p>

<hr/>

<h2>جدول مقارنة المنح الرئيسية</h2>

<table style="width:100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
<thead>
<tr style="background: #f0fdf4; border-bottom: 2px solid #10b981;">
<th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">المنحة</th>
<th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">التمويل</th>
<th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">المستوى</th>
<th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">الموعد</th>
<th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">المنافسة</th>
</tr>
</thead>
<tbody>
<tr style="border-bottom: 1px solid #e2e8f0;">
<td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Türkiye Bursları</strong></td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">كامل (راتب + سكن + تأمين + طيران)</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">بكالوريوس / ماجستير / دكتوراه</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">يناير - فبراير</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">عالية جداً (2-4%)</td>
</tr>
<tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
<td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>سابانجي</strong></td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">إعفاء 100% من الرسوم + سكن</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">بكالوريوس / ماجستير / دكتوراه</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">حسب الجامعة</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">متوسطة</td>
</tr>
<tr style="border-bottom: 1px solid #e2e8f0;">
<td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>بيلكنت</strong></td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">رسوم + راتب 1,500$/شهر + سكن</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">بكالوريوس / ماجستير / دكتوراه</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">حسب الجامعة</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">متوسطة-عالية</td>
</tr>
<tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
<td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>TÜBITAK 2215</strong></td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">راتب شهري + رسوم + تأمين</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">ماجستير / دكتوراه فقط</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">متغير</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">متوسطة</td>
</tr>
<tr style="border-bottom: 1px solid #e2e8f0;">
<td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>YTB-IsDB</strong></td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">كامل (مشابه لـ Türkiye Bursları)</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">بكالوريوس / ماجستير / دكتوراه</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">يناير - فبراير</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">متوسطة</td>
</tr>
<tr style="background: #f8fafc;">
<td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Erasmus+</strong></td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">راتب شهري + سفر (فصل واحد)</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">تبادل طلابي</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">عبر جامعتك</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">منخفضة</td>
</tr>
</tbody>
</table>

<hr/>

<h2>ملاحظة خاصة للطلاب السوريين</h2>

<p>الطلاب السوريون حاملو الكملك (الحماية المؤقتة) يتمتعون بميزة استثنائية: <strong>إعفاء كامل من الرسوم الدراسية في جميع الجامعات الحكومية التركية</strong> بدون حاجة لمنحة. هذا يعني أن التكلفة الوحيدة هي المعيشة والسكن. يمكن أيضاً التقديم على Türkiye Bursları للحصول على راتب شهري وسكن بالإضافة للإعفاء.</p>

<hr/>

<h2>كيف تختار المنحة المناسبة لك؟</h2>

<ul>
<li><strong>طالب ثانوية يريد بكالوريوس:</strong> قدّم على Türkiye Bursları + منح الجامعات الخاصة بالتوازي</li>
<li><strong>خريج جامعة يريد ماجستير:</strong> Türkiye Bursları + TÜBITAK 2215 + منح الجامعات</li>
<li><strong>باحث يريد دكتوراه:</strong> TÜBITAK 2215 هو الخيار الأفضل + Türkiye Bursları</li>
<li><strong>طالب من دولة إسلامية:</strong> المنحة المشتركة YTB-IsDB فرصة إضافية ممتازة</li>
<li><strong>طالب في جامعة شريكة:</strong> برنامج Erasmus+ (قدّم عبر جامعتك)</li>
</ul>

<p><a href="/article/scholarship-application-tips" style="color: #10b981; font-weight: bold; text-decoration: underline;">📖 اقرأ نصائح القبول وأسرار النجاح في المنحة التركية</a></p>
`,
    steps: [
        'حدد مستواك الدراسي (بكالوريوس، ماجستير، دكتوراه) والتخصص المطلوب',
        'راجع شروط كل منحة وتأكد من انطباقها عليك (العمر، المعدل، الجنسية)',
        'جهّز الأوراق الأساسية: الشهادات، كشف الدرجات، جواز السفر، صورة شخصية',
        'قدّم على أكثر من منحة في نفس الوقت لزيادة فرص القبول',
        'تابع نتائج التقديم وجهّز نفسك للمقابلة إن وُجدت',
    ],
    documents: [
        'جواز سفر ساري المفعول (أو وثيقة سفر للسوريين)',
        'الشهادة الدراسية الأخيرة مترجمة ومصدقة (أو شهادة الطالب للذين لم يتخرجوا بعد)',
        'كشف الدرجات (Transcript) مترجم ومصدق',
        'صورة شخصية بيومترية حديثة بخلفية بيضاء',
        'شهادة لغة إن وُجدت (TOMER، IELTS، TOEFL)',
    ],
    tips: [
        'التقديم على منحة الحكومة التركية مجاني بالكامل — لا تدفع لأي جهة تدّعي أنها تضمن القبول',
        'أكثر من 200,000 شخص يتقدمون سنوياً لمنحة Türkiye Bursları ونسبة القبول 2-4% — جهّز ملفاً قوياً',
        'منح الجامعات الخاصة (سابانجي، بيلكنت، كوتش) أقل شهرة لكن فرص القبول فيها أعلى',
        'قدّم على عدة منح في نفس الوقت — لا تعتمد على خيار واحد فقط',
        'الطلاب السوريون بالكملك يمكنهم الدراسة مجاناً في الجامعات الحكومية بدون منحة',
    ],
    fees: 'التقديم على جميع المنح مجاني — لا توجد رسوم تقديم. تكلفة ترجمة وتصديق الأوراق تقريباً 500-1,500 ليرة تركية.',
    warning: 'المعلومات الواردة محدّثة لعام 2026 وقد تتغير المواعيد والشروط. يرجى دائماً مراجعة الموقع الرسمي لكل منحة للتأكد من آخر التحديثات. لا تدفع أموالاً لأي جهة تدّعي ضمان القبول في المنح.',
    source: 'https://turkiyeburslari.gov.tr',
    last_update: '2026-03-03',
    active: true,
    seo_title: 'المنح الدراسية في تركيا 2026 — دليل شامل لجميع المنح المتاحة للعرب',
    seo_description: 'دليل شامل لجميع المنح الدراسية في تركيا 2026: منحة الحكومة التركية Türkiye Bursları، منح الجامعات سابانجي وبيلكنت وكوتش، TÜBITAK، المنحة المشتركة مع البنك الإسلامي، Erasmus+. مقارنة كاملة وشروط التقديم.',
    seo_keywords: ['منح دراسية تركيا 2026', 'المنح التركية', 'Türkiye Bursları', 'منحة الحكومة التركية', 'منح جامعات تركيا', 'TÜBITAK', 'دراسة في تركيا مجاناً', 'منح للعرب في تركيا', 'منح سابانجي', 'منح بيلكنت', 'scholarship Turkey'],
};

// ─── المقال 2: منحة الحكومة التركية بالتفصيل ──────────────────────
const article2 = {
    id: 'scholarship-turkiye-burslari',
    slug: 'scholarship-turkiye-burslari',
    title: 'منحة الحكومة التركية (Türkiye Bursları) 2026 — دليل التقديم الكامل',
    category: 'الدراسة والتعليم',
    intro: 'الدليل الأكثر تفصيلاً لمنحة الحكومة التركية Türkiye Bursları 2026: شروط الأهلية والعمر والمعدل، ما تغطيه المنحة (الراتب الشهري 4,500-9,000 ليرة، السكن، التأمين، تذاكر الطيران، سنة TOMER)، خطوات التقديم عبر الموقع الرسمي، المستندات المطلوبة، مراحل الاختيار، والجدول الزمني الكامل.',
    details: `
<h2>ما هي منحة Türkiye Bursları؟</h2>

<p>منحة الحكومة التركية (Türkiye Bursları) هي أكبر وأشهر برنامج منح دراسية في تركيا، تموّلها <strong>رئاسة الجمهورية التركية</strong> عبر هيئة الأتراك في الخارج والمجتمعات ذات الصلة (YTB). بدأ البرنامج عام 2012 وأصبح يستقطب أكثر من <strong>200,000 متقدم سنوياً من 170+ دولة</strong>.</p>

<p>المنحة مفتوحة لجميع الجنسيات (ما عدا المواطنين الأتراك) وتغطي جميع المراحل: بكالوريوس، ماجستير، دكتوراه، وبحث علمي.</p>

<hr/>

<h2>ماذا تغطي المنحة؟</h2>

<h3>الراتب الشهري</h3>
<table style="width:100%; border-collapse: collapse; margin: 15px 0;">
<tr style="background: #f0fdf4; border-bottom: 2px solid #10b981;">
<th style="padding: 10px; text-align: right; border: 1px solid #e2e8f0;">المرحلة</th>
<th style="padding: 10px; text-align: right; border: 1px solid #e2e8f0;">الراتب الشهري</th>
<th style="padding: 10px; text-align: right; border: 1px solid #e2e8f0;">منحة التفوق (ضعف الراتب)</th>
</tr>
<tr style="border-bottom: 1px solid #e2e8f0;">
<td style="padding: 10px; border: 1px solid #e2e8f0;">بكالوريوس</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>4,500 ليرة تركية</strong></td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">9,000 ليرة</td>
</tr>
<tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
<td style="padding: 10px; border: 1px solid #e2e8f0;">ماجستير</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>6,500 ليرة تركية</strong></td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">13,000 ليرة</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #e2e8f0;">دكتوراه</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>9,000 ليرة تركية</strong></td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">18,000 ليرة</td>
</tr>
</table>

<h3>الإعفاء الكامل من الرسوم الدراسية</h3>
<p>المنحة تغطي <strong>100% من الرسوم الدراسية</strong> في الجامعة التي يتم تعيينك فيها — لا تدفع أي شيء.</p>

<h3>السكن الجامعي المجاني</h3>
<p>سكن مجاني في مساكن KYK الحكومية طوال فترة الدراسة لطلاب البكالوريوس. طلاب الماجستير والدكتوراه يحصلون على <strong>بدل سكن شهري</strong>: 6,000 ليرة في إسطنبول وأنقرة، 5,000 ليرة في المدن الأخرى.</p>

<h3>التأمين الصحي الشامل</h3>
<p>تأمين صحي شامل يغطي العلاج في المستشفيات الحكومية والخاصة المتعاقدة طوال فترة المنحة.</p>

<h3>تذاكر الطيران</h3>
<p>تذكرة طيران ذهاب عند بداية المنحة، وتذكرة عودة عند انتهائها.</p>

<h3>سنة تحضيرية للغة التركية (TOMER)</h3>
<p>سنة كاملة مجانية لتعلم اللغة التركية في مراكز TOMER الجامعية قبل بدء الدراسة الأكاديمية. المستوى المطلوب: B2 كحد أدنى.</p>
<p><a href="/article/tomer-registration" style="color: #10b981; font-weight: bold; text-decoration: underline;">📖 اقرأ دليل التسجيل في TOMER</a></p>

<hr/>

<h2>شروط الأهلية</h2>

<table style="width:100%; border-collapse: collapse; margin: 15px 0;">
<tr style="background: #f0fdf4; border-bottom: 2px solid #10b981;">
<th style="padding: 10px; text-align: right; border: 1px solid #e2e8f0;">المرحلة</th>
<th style="padding: 10px; text-align: right; border: 1px solid #e2e8f0;">الحد الأقصى للعمر</th>
<th style="padding: 10px; text-align: right; border: 1px solid #e2e8f0;">الحد الأدنى للمعدل</th>
</tr>
<tr style="border-bottom: 1px solid #e2e8f0;">
<td style="padding: 10px; border: 1px solid #e2e8f0;">بكالوريوس</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>أقل من 21 سنة</strong></td>
<td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>70%</strong></td>
</tr>
<tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
<td style="padding: 10px; border: 1px solid #e2e8f0;">ماجستير</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>أقل من 30 سنة</strong></td>
<td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>75%</strong></td>
</tr>
<tr style="border-bottom: 1px solid #e2e8f0;">
<td style="padding: 10px; border: 1px solid #e2e8f0;">دكتوراه</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>أقل من 35 سنة</strong></td>
<td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>75%</strong></td>
</tr>
<tr style="background: #fef2f2;">
<td style="padding: 10px; border: 1px solid #e2e8f0;">تخصصات صحية (طب، صيدلة، أسنان)</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">حسب المرحلة</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;"><strong style="color: #dc2626;">90%</strong></td>
</tr>
</table>

<p><strong>شروط إضافية:</strong></p>
<ul>
<li>أن تكون مواطناً لأي دولة غير تركيا</li>
<li>ألا تكون مسجلاً حالياً في جامعة تركية بنفس المرحلة</li>
<li>أن تكون متخرجاً أو قادراً على التخرج قبل أغسطس 2026</li>
</ul>

<hr/>

<h2>الجدول الزمني لعام 2026</h2>

<ul>
<li><strong>10 يناير — 25 فبراير 2026:</strong> فترة التقديم (تم تمديد الموعد 5 أيام عن الموعد الأصلي)</li>
<li><strong>مارس — مايو 2026:</strong> التقييم الأولي ومراجعة الملفات</li>
<li><strong>مايو — أغسطس 2026:</strong> المقابلات (في أكثر من 100 دولة، حضورياً أو عبر الإنترنت)</li>
<li><strong>أغسطس — سبتمبر 2026:</strong> إعلان النتائج النهائية</li>
<li><strong>سبتمبر — أكتوبر 2026:</strong> الوصول إلى تركيا وبدء سنة TOMER</li>
</ul>

<hr/>

<h2>خطوات التقديم بالتفصيل</h2>

<p><strong>الخطوة 1:</strong> أنشئ حساباً على منصة التقديم: <a href="https://tbbs.turkiyeburslari.gov.tr" target="_blank" rel="noopener noreferrer" style="color: #10b981; font-weight: bold; text-decoration: underline;">tbbs.turkiyeburslari.gov.tr</a></p>

<p><strong>الخطوة 2:</strong> املأ البيانات الشخصية والعائلية والأكاديمية بدقة تامة</p>

<p><strong>الخطوة 3:</strong> اختر حتى <strong>12 تخصصاً وجامعة</strong> حسب الأولوية</p>

<p><strong>الخطوة 4:</strong> اكتب <strong>رسالة الدافع (Motivation Letter)</strong> — هذا أهم جزء في الطلب!</p>
<p><a href="/article/scholarship-application-tips" style="color: #10b981; font-weight: bold; text-decoration: underline;">📖 اقرأ كيف تكتب رسالة دافع قوية وتتجنب أخطاء الرفض</a></p>

<p><strong>الخطوة 5:</strong> ارفع المستندات المطلوبة بصيغة PDF واضحة</p>

<p><strong>الخطوة 6:</strong> راجع الطلب بالكامل وأرسله قبل الموعد النهائي</p>

<p>التقديم متاح بـ 8 لغات: التركية، الإنجليزية، <strong>العربية</strong>، الفرنسية، الفارسية، الروسية، البوسنية، الإسبانية.</p>

<hr/>

<h2>مراحل الاختيار</h2>

<h3>المرحلة 1: التقييم الأولي</h3>
<p>التحقق من استيفاء الشروط الأساسية: العمر، المعدل، المستندات المطلوبة.</p>

<h3>المرحلة 2: لجنة الخبراء</h3>
<p>تقييم شامل يشمل: المستوى الأكاديمي، رسالة الدافع، اتساق اختيارات التخصصات، النشاطات اللامنهجية، القيادة.</p>

<h3>المرحلة 3: المقابلة الشخصية</h3>
<p>مقابلة تُجرى في بلد المتقدم (أو عبر الإنترنت). لطلاب البكالوريوس: اختبار 30 سؤال (رياضيات، منطق) قبل المقابلة. المقابلة تشمل: التعريف بالنفس، لماذا تركيا، لماذا هذا التخصص، خطط المستقبل.</p>

<h3>المرحلة 4: القرار النهائي</h3>
<p>لجنة الاختيار تراجع نتائج المقابلات وتُصدر القائمة النهائية للمقبولين.</p>

<hr/>

<h2>نسبة القبول والمنافسة</h2>

<p>سنوياً يتقدم أكثر من <strong>200,000 شخص</strong> من 170+ دولة، ويُقبل حوالي <strong>4,000-5,000 طالب فقط</strong>. هذا يعني نسبة قبول <strong>2-4%</strong> تقريباً — المنافسة شديدة جداً.</p>

<p>لزيادة فرصك، اقرأ نصائحنا التفصيلية:</p>
<p><a href="/article/scholarship-application-tips" style="color: #10b981; font-weight: bold; text-decoration: underline;">📖 نصائح القبول — أسرار النجاح وأخطاء يجب تجنبها</a></p>

<p>ولا تعتمد على منحة واحدة — اطلع على البدائل:</p>
<p><a href="/article/scholarship-university-programs" style="color: #10b981; font-weight: bold; text-decoration: underline;">📖 منح الجامعات وبرامج التمويل الأخرى</a></p>
`,
    steps: [
        'أنشئ حساباً على موقع tbbs.turkiyeburslari.gov.tr قبل فتح التقديم',
        'جهّز جميع المستندات المطلوبة مترجمة ومصدقة قبل الموعد',
        'املأ البيانات الشخصية والأكاديمية بدقة تامة',
        'اكتب رسالة الدافع (Motivation Letter) بأسلوبك الشخصي — لا تنسخ من الإنترنت',
        'اختر حتى 12 تخصصاً وجامعة حسب الأولوية',
        'ارفع المستندات بصيغة PDF واضحة لا تتجاوز الحجم المسموح',
        'راجع الطلب بالكامل قبل الإرسال النهائي',
        'تابع بريدك الإلكتروني وحسابك على المنصة لنتائج التقييم والمقابلة',
    ],
    documents: [
        'جواز سفر ساري المفعول',
        'الشهادة الثانوية أو الجامعية (حسب المرحلة) مترجمة ومصدقة',
        'كشف الدرجات الأكاديمي (Transcript)',
        'صورة شخصية بيومترية حديثة',
        'رسالة الدافع (Motivation Letter) باللغة التركية أو الإنجليزية أو العربية',
        'خطابا توصية (اختياريان لكن مهمان جداً)',
        'شهادات إضافية: لغة، تطوع، نشاطات (إن وُجدت)',
    ],
    tips: [
        'التقديم يفتح من 10 يناير إلى 25 فبراير 2026 — لا تنتظر اللحظة الأخيرة',
        'رسالة الدافع هي أهم جزء في الطلب — اكتبها بنفسك وبأسلوب شخصي صادق',
        'اختر تخصصات وجامعات متنوعة (مزيج من جامعات قوية ومتوسطة) لزيادة فرصك',
        'التخصصات الصحية (طب، صيدلة، طب أسنان) تتطلب معدل 90% كحد أدنى',
        'المقابلة تكون باللغة التي اخترت الدراسة بها — تدرّب على التعريف بنفسك وأهدافك',
        'لا تدفع أموالاً لأي مكتب يدّعي تسهيل القبول — التقديم مجاني ومباشر',
    ],
    fees: 'التقديم مجاني بالكامل. المنحة تغطي كل شيء: الراتب الشهري 4,500-9,000 ليرة، الرسوم الدراسية، السكن، التأمين الصحي، تذاكر الطيران، وسنة TOMER.',
    warning: 'التقديم يكون حصرياً عبر الموقع الرسمي turkiyeburslari.gov.tr — أي موقع آخر يدّعي تقديم المنحة هو احتيال. نسبة القبول 2-4% فقط، لذا جهّز ملفاً مميزاً ولا تعتمد على منحة واحدة فقط.',
    source: 'https://turkiyeburslari.gov.tr',
    last_update: '2026-03-03',
    active: true,
    seo_title: 'منحة الحكومة التركية Türkiye Bursları 2026 — الشروط والتقديم والمواعيد',
    seo_description: 'دليل التقديم الكامل لمنحة الحكومة التركية 2026: الراتب الشهري 4500-9000 ليرة، سكن مجاني، تأمين صحي، تذاكر طيران، سنة TOMER. شروط الأهلية، المستندات المطلوبة، مراحل الاختيار، والجدول الزمني.',
    seo_keywords: ['منحة الحكومة التركية 2026', 'Türkiye Bursları 2026', 'التقديم على المنحة التركية', 'شروط المنحة التركية', 'راتب المنحة التركية', 'مواعيد المنحة التركية', 'YTB scholarship', 'Turkey government scholarship', 'منحة تركيا للعرب', 'مقابلة المنحة التركية'],
};

// ─── المقال 3: نصائح القبول والأخطاء الشائعة ──────────────────────
const article3 = {
    id: 'scholarship-application-tips',
    slug: 'scholarship-application-tips',
    title: 'نصائح القبول في المنحة التركية — أسرار النجاح وأخطاء يجب تجنبها',
    category: 'الدراسة والتعليم',
    intro: 'دليل عملي مبني على تجارب المقبولين في المنحة التركية: كيف تكتب رسالة الدافع المثالية، كيف تستعد للمقابلة، أخطاء شائعة تسبب الرفض الفوري (بما فيها كشف النسخ بالذكاء الاصطناعي)، وكيف تزيد فرصك في القبول حتى بمعدل متوسط.',
    details: `
<h2>لماذا يُرفض معظم المتقدمين؟</h2>

<p>من بين أكثر من <strong>200,000 متقدم سنوياً</strong>، يُقبل فقط 4,000-5,000 شخص (2-4%). الرفض ليس دائماً بسبب المعدل المنخفض — كثير من أصحاب المعدلات العالية يُرفضون بسبب <strong>ضعف رسالة الدافع</strong>، أو <strong>اختيارات غير متسقة</strong>، أو <strong>أخطاء بسيطة في الملف</strong>.</p>

<p>في المقابل، متقدمون بمعدلات متوسطة (70-80%) يُقبلون بفضل رسالة دافع قوية وملف شخصي متكامل.</p>

<hr/>

<h2>كتابة رسالة الدافع (Motivation Letter)</h2>

<p>رسالة الدافع هي <strong>أهم جزء في الطلب</strong> — اللجنة تقضي وقتاً أطول في قراءتها من مراجعة درجاتك.</p>

<h3>الهيكل المثالي لرسالة الدافع</h3>
<ul>
<li><strong>المقدمة (فقرة واحدة):</strong> من أنت؟ ما خلفيتك؟ جملة تلفت الانتباه</li>
<li><strong>خلفيتك الأكاديمية (فقرة):</strong> ما درست؟ ما أبرز إنجازاتك؟</li>
<li><strong>لماذا تركيا؟ (فقرة):</strong> أسباب محددة — ليس فقط "أحب تركيا"</li>
<li><strong>لماذا هذا التخصص؟ (فقرة):</strong> ما علاقته بأهدافك المهنية؟</li>
<li><strong>خطط المستقبل (فقرة):</strong> ماذا ستفعل بعد التخرج؟ كيف ستخدم مجتمعك؟</li>
<li><strong>الخاتمة (فقرة قصيرة):</strong> لماذا أنت المرشح المناسب؟</li>
</ul>
<p><strong>الطول المثالي:</strong> 3,000-5,000 حرف (صفحة إلى صفحة ونصف)</p>

<h3>ما يجب أن تتضمنه</h3>
<ul>
<li><strong>قصة شخصية حقيقية</strong> — حدث أو تجربة غيّرت مسارك</li>
<li><strong>أهداف محددة وواقعية</strong> — "أريد أن أصبح مهندس طاقة متجددة" أفضل من "أريد مساعدة بلدي"</li>
<li><strong>ربط بين التخصص وبلدك</strong> — كيف ستستخدم ما تتعلمه لخدمة مجتمعك؟</li>
<li><strong>معرفة بتركيا</strong> — أظهر أنك بحثت عن الجامعات والمدن والبرامج</li>
</ul>

<h3>أخطاء قاتلة في رسالة الدافع</h3>
<ul>
<li style="color: #dc2626;"><strong>نسخ نص جاهز من الإنترنت</strong> — يُكتشف فوراً ويعني رفضاً نهائياً</li>
<li style="color: #dc2626;"><strong>استخدام الذكاء الاصطناعي (ChatGPT/Bard)</strong> — اللجنة تستخدم أدوات كشف متطورة</li>
<li style="color: #dc2626;"><strong>عبارات عامة</strong> مثل "أحب تركيا" أو "أريد مستقبلاً أفضل" بدون تفاصيل</li>
<li style="color: #dc2626;"><strong>أخطاء إملائية ولغوية كثيرة</strong></li>
<li style="color: #dc2626;"><strong>رسالة قصيرة جداً (أقل من 1,000 حرف)</strong> أو طويلة جداً (أكثر من 7,000 حرف)</li>
</ul>

<hr/>

<h2>تحذير حاسم: كشف الانتحال والذكاء الاصطناعي</h2>

<p style="background: #fef2f2; border: 2px solid #fca5a5; border-radius: 12px; padding: 16px;">
<strong style="color: #dc2626;">⚠️ تحذير صارم:</strong> لجنة تقييم Türkiye Bursları تستخدم <strong>برامج متطورة لكشف الانتحال</strong> (Plagiarism Detection) و<strong>أدوات كشف النصوص المولّدة بالذكاء الاصطناعي</strong>. أي رسالة دافع منسوخة من الإنترنت أو مكتوبة بواسطة ChatGPT أو أي أداة مشابهة ستؤدي إلى <strong>رفض فوري</strong> وقد تمنعك من التقديم مستقبلاً.
</p>

<p><strong>القاعدة الذهبية:</strong> اكتب كل شيء بنفسك، بأسلوبك الشخصي، بصوتك الحقيقي. يمكنك طلب مراجعة من صديق أو أستاذ، لكن الكتابة يجب أن تكون بقلمك أنت.</p>

<hr/>

<h2>التحضير للمقابلة</h2>

<h3>أسئلة متكررة في المقابلة</h3>
<ul>
<li><strong>عرّف عن نفسك</strong> — تدرّب على تقديم نفسك في 2-3 دقائق</li>
<li><strong>لماذا اخترت تركيا؟</strong> — أسباب أكاديمية محددة، ليس سياحية</li>
<li><strong>لماذا هذا التخصص؟</strong> — اربطه بتجربتك وأهدافك</li>
<li><strong>أين ترى نفسك بعد 5 سنوات؟</strong> — خطة واقعية ومحددة</li>
<li><strong>ماذا تعرف عن تركيا؟</strong> — ثقافة، تاريخ، اقتصاد — أظهر أنك بحثت</li>
<li><strong>كيف ستخدم مجتمعك بعد التخرج؟</strong> — إجابة صادقة ومحددة</li>
</ul>

<h3>نصائح عملية للمقابلة</h3>
<ul>
<li>المقابلة تكون <strong>باللغة التي اخترت الدراسة بها</strong> — إذا اخترت تركي تحدث بالتركي</li>
<li>ارتدِ ملابس رسمية محترمة</li>
<li>للمقابلات عبر الإنترنت: تأكد من الكاميرا والميكروفون والإنترنت مسبقاً</li>
<li><strong>كن صادقاً</strong> — الصدق أهم من الإجابة المثالية</li>
<li>تدرّب مع صديق على الأسئلة بصوت عالٍ</li>
<li><strong>لا تحفظ نصاً جاهزاً</strong> — تحدث بطبيعتك مع نقاط أساسية تتذكرها</li>
</ul>

<hr/>

<h2>اختيار التخصصات والجامعات بذكاء</h2>

<p>يمكنك اختيار حتى <strong>12 تخصصاً وجامعة</strong>. نصائح ذكية:</p>

<ul>
<li><strong>وزّع بين مدن مختلفة:</strong> لا تضع كل الخيارات في إسطنبول — المنافسة أقل في مدن مثل أنقرة وبورصا وإزمير</li>
<li><strong>مزيج من القوي والمتوسط:</strong> ضع 4 جامعات قوية + 4 متوسطة + 4 أقل شهرة</li>
<li><strong>اتساق التخصصات:</strong> اختر تخصصات متقاربة — لا تضع طب وهندسة وأدب معاً</li>
<li><strong>تحقق من لغة التدريس:</strong> بعض البرامج بالتركي فقط وبعضها بالإنجليزي</li>
</ul>

<hr/>

<h2>تعزيز الملف الشخصي</h2>

<p>حتى لو معدلك متوسط، يمكنك تعزيز فرصك عبر:</p>
<ul>
<li><strong>التطوع والعمل المجتمعي:</strong> شهادات تطوع من منظمات معروفة (الهلال الأحمر، UNHCR، محلية)</li>
<li><strong>الشهادات الإضافية:</strong> لغات (TOMER، IELTS)، مهارات رقمية، دورات عبر الإنترنت (Coursera، edX)</li>
<li><strong>النشاطات اللامنهجية:</strong> رياضة، فن، مسابقات علمية، أندية</li>
<li><strong>خطابات توصية قوية:</strong> من أستاذ يعرفك أكاديمياً أو مدير عمل يعرف قدراتك</li>
</ul>

<p><a href="/article/scholarship-turkey-overview" style="color: #10b981; font-weight: bold; text-decoration: underline;">📖 العودة للدليل الشامل لجميع المنح</a></p>
<p><a href="/article/scholarship-turkiye-burslari" style="color: #10b981; font-weight: bold; text-decoration: underline;">📖 دليل التقديم الكامل لمنحة الحكومة التركية</a></p>
`,
    steps: [
        'ابدأ بكتابة مسودة رسالة الدافع قبل شهر على الأقل من الموعد النهائي',
        'اطلب من شخص تثق به مراجعة رسالتك لغوياً ومن حيث المضمون',
        'جهّز إجابات لأسئلة المقابلة الشائعة وتدرّب عليها بصوت عالٍ',
        'وزّع اختياراتك الـ 12 بين جامعات قوية ومتوسطة في مدن مختلفة',
        'أضف أي شهادات تطوع أو نشاطات لامنهجية لتعزيز ملفك',
    ],
    documents: [
        'مسودة رسالة الدافع (Motivation Letter) — 3,000-5,000 حرف',
        'خطابات توصية من أساتذة أو جهات عمل (1-2 خطاب)',
        'شهادات تطوع ونشاطات لامنهجية (إن وُجدت)',
        'شهادات لغة (TOMER، IELTS، TOEFL — إن وُجدت)',
        'سيرة ذاتية مختصرة (CV) — صفحة واحدة',
    ],
    tips: [
        'رسالة الدافع ليست سيرة ذاتية — اروِ قصة شخصية تُظهر شغفك وأهدافك الحقيقية',
        'تحذير صارم: لجنة التقييم تستخدم برامج كشف الانتحال والنصوص المولّدة بالذكاء الاصطناعي — أي نص منسوخ أو مولّد يعني رفضاً فورياً',
        'في المقابلة: الصدق أهم من الإجابة المثالية — لا تحفظ نصاً جاهزاً بل تحدث بطبيعتك',
        'لا تضع 12 جامعة في إسطنبول فقط — وزّع بين المدن لزيادة فرصك',
        'إذا معدلك متوسط (70-80%): ركّز على رسالة دافع قوية وخطابات توصية مميزة',
        'تابع صفحات المنحة على وسائل التواصل الاجتماعي للأسئلة الشائعة والتحديثات',
        'جهّز حاسوبك وكاميرتك واتصال الإنترنت قبل موعد المقابلة بأيام',
    ],
    fees: 'لا توجد أي رسوم — التقديم والمقابلة مجانيان. احذر من أي جهة تطلب مالاً مقابل "ضمان القبول" أو "تجهيز الملف".',
    warning: 'لجنة التقييم تستخدم أنظمة متطورة لكشف الانتحال (Plagiarism) والنصوص المولّدة بالذكاء الاصطناعي. أي انتحال أو استخدام ChatGPT في رسالة الدافع يؤدي لرفض فوري وقد يمنعك من التقديم مستقبلاً.',
    source: 'https://turkiyeburslari.gov.tr',
    last_update: '2026-03-03',
    active: true,
    seo_title: 'نصائح القبول في المنحة التركية 2026 — رسالة الدافع والمقابلة وأخطاء شائعة',
    seo_description: 'أسرار القبول في المنحة التركية: كيف تكتب رسالة الدافع المثالية، التحضير للمقابلة، أخطاء تسبب الرفض الفوري، تحذير من كشف الانتحال والذكاء الاصطناعي. نصائح عملية من تجارب المقبولين.',
    seo_keywords: ['نصائح المنحة التركية', 'رسالة الدافع المنحة التركية', 'مقابلة المنحة التركية', 'أسباب الرفض المنحة التركية', 'motivation letter Türkiye Bursları', 'كيف أُقبل في المنحة التركية', 'أخطاء التقديم على المنحة', 'نصائح المقبولين في المنحة'],
};

// ─── المقال 4: منح الجامعات وبرامج التمويل الأخرى ─────────────────
const article4 = {
    id: 'scholarship-university-programs',
    slug: 'scholarship-university-programs',
    title: 'منح الجامعات التركية وبرامج التمويل الأخرى — TÜBITAK وIsDB وErasmus+',
    category: 'الدراسة والتعليم',
    intro: 'دليل تفصيلي لبدائل منحة الحكومة التركية: منح الجامعات الخاصة الممولة بالكامل (سابانجي، بيلكنت، كوتش)، برنامج TÜBITAK 2215 للدراسات العليا والبحث العلمي، المنحة المشتركة YTB-IsDB لمواطني الدول الإسلامية (تشمل جميع الدول العربية)، برنامج Erasmus+ الوارد، ومؤسسة المعارف التركية.',
    details: `
<h2>لماذا تبحث عن بدائل؟</h2>

<p>منحة الحكومة التركية (Türkiye Bursları) ممتازة لكن نسبة القبول فيها <strong>2-4% فقط</strong>. لحسن الحظ، هناك عشرات البدائل الممولة بالكامل أو جزئياً — والمنافسة عليها أقل بكثير. القاعدة الذهبية: <strong>قدّم على عدة منح بالتوازي</strong>.</p>

<hr/>

<h2>منح الجامعات التركية الخاصة</h2>

<h3>جامعة سابانجي (Sabancı Üniversitesi)</h3>
<p>من أرقى الجامعات التركية، تقع في إسطنبول. كل متقدم دولي يُقيّم تلقائياً للمنحة عند التقديم — لا حاجة لطلب منفصل.</p>
<ul>
<li><strong>التمويل:</strong> إعفاء يصل حتى 100% من الرسوم الدراسية + سكن مجاني</li>
<li><strong>المراحل:</strong> بكالوريوس، ماجستير، دكتوراه</li>
<li><strong>اللغة:</strong> الإنجليزية</li>
<li><strong>القوة:</strong> هندسة، علوم اجتماعية، إدارة أعمال</li>
<li><a href="https://www.sabanciuniv.edu/en/scholarships" target="_blank" rel="noopener noreferrer" style="color: #10b981; font-weight: bold; text-decoration: underline;">الموقع الرسمي للمنح</a></li>
</ul>

<h3>جامعة بيلكنت (Bilkent Üniversitesi)</h3>
<p>أول جامعة خاصة غير ربحية في تركيا، تقع في أنقرة. من أسخى المنح في تركيا.</p>
<ul>
<li><strong>التمويل:</strong> إعفاء كامل من الرسوم + راتب شهري يصل إلى <strong>1,500 دولار</strong> + سكن</li>
<li><strong>الإضافات:</strong> حاسوب محمول، وجبات، دعم سفر</li>
<li><strong>المراحل:</strong> بكالوريوس، ماجستير، دكتوراه</li>
<li><strong>القبول التلقائي:</strong> كل متقدم يُقيّم للمنحة عند القبول</li>
<li><a href="https://w3.bilkent.edu.tr/international/scholarships-for-international-students/" target="_blank" rel="noopener noreferrer" style="color: #10b981; font-weight: bold; text-decoration: underline;">الموقع الرسمي للمنح</a></li>
</ul>

<h3>جامعة كوتش (Koç Üniversitesi)</h3>
<p>من أفضل 500 جامعة عالمياً، تقع في إسطنبول. تستثمر أكثر من <strong>15 مليون دولار سنوياً</strong> في المنح.</p>
<ul>
<li><strong>التمويل:</strong> إعفاء كامل أو جزئي + منحة معيشة</li>
<li><strong>الشرط:</strong> معدل 3.5/4.0 للبكالوريوس</li>
<li><strong>برنامج مشترك مع Türkiye Bursları:</strong> 5 منح بكالوريوس + 10 ماجستير</li>
<li><a href="https://international.ku.edu.tr/scholarships/turkish-scholarships-program-at-koc-university/" target="_blank" rel="noopener noreferrer" style="color: #10b981; font-weight: bold; text-decoration: underline;">الموقع الرسمي للمنح</a></li>
</ul>

<h3>جامعات أخرى تقدم منحاً</h3>
<ul>
<li><strong>جامعة أوزييغين (Özyeğin):</strong> منح جزئية للتميز الأكاديمي</li>
<li><strong>جامعة بهتشه شهير (Bahçeşehir):</strong> إعفاء 25-100% حسب المعدل</li>
<li><strong>جامعة إسطنبول بيلجي (İstanbul Bilgi):</strong> منح رياضية وأكاديمية</li>
<li><strong>الجامعات الحكومية:</strong> خصم 25% على الأقل إذا كان لديك أقارب مسجلون</li>
</ul>

<hr/>

<h2>برنامج TÜBITAK 2215 — للبحث العلمي</h2>

<p>برنامج مرموق يموّله المجلس التركي للبحث العلمي والتكنولوجيا (TÜBITAK). مخصص لطلاب <strong>الماجستير والدكتوراه</strong> الدوليين الراغبين في البحث العلمي.</p>

<ul>
<li><strong>التمويل:</strong> راتب شهري + إعفاء من الرسوم + تأمين صحي</li>
<li><strong>المدة:</strong> حتى سنتين (ماجستير) أو 4 سنوات (دكتوراه)</li>
<li><strong>العمر:</strong> أقل من 30 (ماجستير)، أقل من 35 (دكتوراه)</li>
<li><strong>المجالات:</strong> العلوم الطبيعية، الهندسة، العلوم الطبية، الزراعية، الاجتماعية</li>
<li><strong>كيف تتقدم:</strong> يجب أولاً الحصول على قبول في جامعة تركية، ثم التقديم على TÜBITAK</li>
<li><strong>نصيحة مهمة:</strong> تواصل مع أستاذ مشرف في الجامعة التركية قبل التقديم — رسالة منه تعزز فرصك بشكل كبير</li>
<li><a href="https://tubitak.gov.tr/en" target="_blank" rel="noopener noreferrer" style="color: #10b981; font-weight: bold; text-decoration: underline;">الموقع الرسمي لـ TÜBITAK</a></li>
</ul>

<hr/>

<h2>المنحة المشتركة YTB-IsDB</h2>

<p>منحة مشتركة بين هيئة YTB التركية و<strong>البنك الإسلامي للتنمية (IsDB)</strong>. مخصصة لمواطني <strong>الدول الأعضاء في البنك الإسلامي — وتشمل جميع الدول العربية</strong>.</p>

<ul>
<li><strong>التمويل:</strong> مشابه لـ Türkiye Bursları (راتب + سكن + تأمين + طيران + TOMER)</li>
<li><strong>المراحل:</strong> بكالوريوس، ماجستير، دكتوراه</li>
<li><strong>التقديم:</strong> عبر نفس منصة Türkiye Bursları (tbbs.turkiyeburslari.gov.tr)</li>
<li><strong>الفترة:</strong> 10 يناير — 25 فبراير 2026 (نفس موعد المنحة الحكومية)</li>
<li><strong>الميزة:</strong> فرصة إضافية لمواطني الدول الإسلامية — المنافسة أقل من المنحة الحكومية العامة</li>
<li><a href="https://www.isdb.org/scholarships" target="_blank" rel="noopener noreferrer" style="color: #10b981; font-weight: bold; text-decoration: underline;">الموقع الرسمي لمنح IsDB</a></li>
</ul>

<hr/>

<h2>برنامج Erasmus+ الوارد (Incoming)</h2>

<p>برنامج التبادل الطلابي الأوروبي. تركيا دولة شريكة في Erasmus+ ويشارك فيه أكثر من <strong>100 جامعة تركية</strong>.</p>

<ul>
<li><strong>التمويل:</strong> راتب شهري + تذاكر سفر (لفصل دراسي واحد أو سنة)</li>
<li><strong>من يتقدم:</strong> طلاب مسجلون في جامعة لديها اتفاقية Erasmus+ مع جامعة تركية</li>
<li><strong>كيف:</strong> قدّم عبر مكتب Erasmus+ في جامعتك الحالية — ليس مباشرة لتركيا</li>
<li><strong>في 2024:</strong> أكثر من 33,500 شخص سافروا إلى تركيا عبر Erasmus+</li>
<li><a href="https://erasmus-plus.ec.europa.eu/opportunities/possibilities-by-country/en_turkiye" target="_blank" rel="noopener noreferrer" style="color: #10b981; font-weight: bold; text-decoration: underline;">Erasmus+ في تركيا</a></li>
</ul>

<hr/>

<h2>مؤسسة المعارف التركية (Türkiye Maarif Vakfı)</h2>

<p>مؤسسة حكومية تدير مدارس تركية في <strong>67 دولة</strong>. تقدم منحاً لخريجي مدارسها لمتابعة الدراسة الجامعية في تركيا.</p>

<ul>
<li><strong>التمويل:</strong> رسوم + سكن + دعم معيشة</li>
<li><strong>الأهلية:</strong> خريجو مدارس المعارف التركية حول العالم</li>
<li><strong>مثال:</strong> 36 طالباً من مدارس المعارف في باكستان حصلوا على منح حكومية كاملة</li>
<li><a href="https://turkiyemaarif.org/" target="_blank" rel="noopener noreferrer" style="color: #10b981; font-weight: bold; text-decoration: underline;">الموقع الرسمي</a></li>
</ul>

<hr/>

<h2>برنامج المنح الفنية (Arts Scholarship Programme)</h2>

<p>برنامج متخصص لطلاب <strong>الفنون الموسيقية والجميلة والأدائية</strong>. يُقدم في جامعة أنقرة للموسيقى والفنون الجميلة وجامعة حجي بيرم ولي.</p>

<ul>
<li><strong>المراحل:</strong> بكالوريوس، ماجستير، دكتوراه</li>
<li><strong>التمويل:</strong> مشابه لـ Türkiye Bursları</li>
<li><strong>التخصصات:</strong> موسيقى، فنون تشكيلية، فنون أدائية</li>
</ul>

<hr/>

<h2>نصائح عامة للتقديم على منح الجامعات</h2>

<ul>
<li><strong>مواعيد مختلفة:</strong> كل جامعة لها مواعيد تقديم خاصة — لا تعتمد على موعد Türkiye Bursları</li>
<li><strong>قدّم مبكراً:</strong> بعض الجامعات تقبل على أساس "الأول يُقبل أولاً"</li>
<li><strong>لا تعارض:</strong> يمكنك التقديم على منح الجامعات ومنحة الحكومة في نفس الوقت</li>
<li><strong>تابع المواقع مباشرة:</strong> لا تعتمد على مجموعات فيسبوك — المعلومات قد تكون قديمة أو خاطئة</li>
</ul>

<p><a href="/article/scholarship-turkey-overview" style="color: #10b981; font-weight: bold; text-decoration: underline;">📖 العودة للدليل الشامل لجميع المنح</a></p>
<p><a href="/article/scholarship-application-tips" style="color: #10b981; font-weight: bold; text-decoration: underline;">📖 نصائح القبول وأسرار النجاح</a></p>
<p><a href="/article/student-residence" style="color: #10b981; font-weight: bold; text-decoration: underline;">📖 إقامة الطالب في تركيا</a></p>
`,
    steps: [
        'ابحث عن الجامعات التي تقدم منحاً في تخصصك عبر مواقعها الرسمية',
        'تحقق من مواعيد التقديم لكل جامعة — تختلف عن موعد المنحة الحكومية',
        'جهّز ملفاً أكاديمياً قوياً: معدل عالي + خطابات توصية + رسالة دافع',
        'للتقديم على TÜBITAK: تواصل مع أستاذ مشرف في الجامعة التركية أولاً',
        'قدّم على منح الجامعات بالتوازي مع منحة الحكومة — لا تعارض بينهما',
    ],
    documents: [
        'جواز سفر ساري المفعول',
        'الشهادات الأكاديمية مترجمة ومصدقة',
        'كشف الدرجات (Transcript)',
        'خطابات توصية أكاديمية (2-3 خطابات)',
        'رسالة الدافع أو بيان الغرض (Statement of Purpose)',
        'مقترح بحثي (لبرامج TÜBITAK والدكتوراه)',
        'شهادة لغة إنجليزية (IELTS 6.5+ أو TOEFL 80+) للبرامج الإنجليزية',
        'سيرة ذاتية أكاديمية (Academic CV)',
    ],
    tips: [
        'منح الجامعات الخاصة أقل شهرة بين العرب = منافسة أقل = فرصة أكبر',
        'جامعة بيلكنت تقدم راتباً شهرياً يصل إلى 1,500 دولار — من أسخى المنح في تركيا',
        'TÜBITAK 2215 ممتازة لطلاب الماجستير والدكتوراه الراغبين بالبحث العلمي',
        'المنحة المشتركة YTB-IsDB مخصصة لمواطني الدول الإسلامية — وتشمل جميع الدول العربية',
        'لبرنامج Erasmus+: تقدّم عبر جامعتك الحالية وليس مباشرة لتركيا',
        'بعض الجامعات تقدم إعفاءً جزئياً (50-75%) يمكن دمجه مع عمل بدوام جزئي',
        'تابع مواقع الجامعات مباشرة — لا تعتمد على مجموعات فيسبوك للمعلومات',
    ],
    fees: 'التقديم على منح الجامعات مجاني في الغالب. بعض الجامعات تطلب رسوم تقديم رمزية (50-100 دولار). منحة TÜBITAK تغطي راتباً شهرياً + إعفاء من الرسوم.',
    warning: 'مواعيد التقديم تختلف بين الجامعات وبرامج التمويل. تأكد من زيارة الموقع الرسمي لكل جهة. المعلومات محدّثة لعام 2026 وقد تتغير.',
    source: 'https://turkiyeburslari.gov.tr',
    last_update: '2026-03-03',
    active: true,
    seo_title: 'منح الجامعات التركية 2026 — سابانجي بيلكنت كوتش TÜBITAK IsDB Erasmus+',
    seo_description: 'دليل منح الجامعات التركية الخاصة وبرامج التمويل البديلة: سابانجي 100% إعفاء، بيلكنت 1500$/شهر، كوتش، TÜBITAK 2215 للبحث العلمي، المنحة المشتركة YTB-IsDB، Erasmus+ الوارد، مؤسسة المعارف التركية.',
    seo_keywords: ['منح جامعات تركيا 2026', 'منحة سابانجي', 'منحة بيلكنت', 'منحة كوتش', 'TÜBITAK 2215', 'منحة البنك الإسلامي تركيا', 'YTB IsDB scholarship', 'Erasmus+ Turkey', 'university scholarships Turkey', 'منح دراسية جامعات خاصة تركيا'],
};

// ─── تشغيل السكريبت ──────────────────────────────────────────────
const articles = [article1, article2, article3, article4];

async function main() {
    console.log('🎓 إدخال مقالات المنح الدراسية...\n');

    for (const article of articles) {
        console.log(`📝 ${article.title}`);
        const { data, error } = await supabase
            .from('articles')
            .upsert(article, { onConflict: 'id' })
            .select('id, title, slug');

        if (error) {
            console.error(`   ❌ خطأ: ${error.message}`);
        } else {
            console.log(`   ✅ نجح: /article/${data?.[0]?.slug || data?.[0]?.id}`);
        }
    }

    // تحقق نهائي
    const { data: verify } = await supabase
        .from('articles')
        .select('id, slug, title')
        .in('id', articles.map(a => a.id));
    console.log(`\n🔍 تحقق: ${verify?.length || 0}/4 مقالات موجودة في قاعدة البيانات`);
    verify?.forEach(v => console.log(`   ✓ /article/${v.slug}: ${v.title}`));
}

main();
