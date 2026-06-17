/**
 * Publish: Gaziantep — full official list of OPEN neighborhoods.
 *
 * Complements the existing gaziantep-zones-lift-2026-06-09 article
 * (which lists the still-CLOSED 57). This new article lists the 106
 * neighborhoods that ARE open across all 8 districts, taken directly
 * from the official Nüfus chart shared by the user.
 *
 * Same publish path as the prior Gaziantep / İstanbul / Konya / Urfa
 * news items: direct Supabase service-role insert, status=approved,
 * tagged 'خبر_رئيسي' so it joins the homepage carousel.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.pulled'), override: true });

const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const TODAY = '2026-06-17';

const article = {
    id: 'gaziantep-open-neighborhoods-list-2026-06-17',
    slug: 'gaziantep-open-neighborhoods-list-2026-06-17',
    title: 'القائمة الرسمية الكاملة: 106 حي مفتوحاً لتسجيل العناوين في غازي عنتاب — كل قضاء على حدة',
    category: 'الإقامة والكيمليك',
    intro: 'أصدرت مديرية النفوس في ولاية غازي عنتاب القائمة الرسمية للأحياء المفتوحة أمام تسجيل عناوين الأجانب: <strong>106 حي</strong> موزّعة على <strong>8 قضاوات</strong>. في حال كان عنوانك ضمن هذه القائمة، يمكنك التقدّم لتسجيل العنوان أو تجديد الكملك أو نقل العنوان دون قيد إقليمي. تكمّل هذه القائمة الإعلان السابق بتاريخ 9 يونيو الذي رفع الحظر عن 106 حي من أصل 163.',
    details: `
<div style="background:linear-gradient(135deg,#dcfce7,#bbf7d0);border:2px solid #16a34a;padding:18px;margin:16px 0;border-radius:12px;">
  <p style="margin:0;font-weight:bold;color:#14532d;font-size:17px;">القائمة الرسمية باختصار:</p>
  <p style="margin:8px 0 0;color:#166534;line-height:1.8;">
    <strong>106 حي مفتوحاً</strong> لتسجيل العناوين موزّعة على <strong>8 قضاوات</strong>.
    ثلاث قضاوات بأكملها (<strong>Araban — Karkamış — Oğuzeli</strong>) مفتوحة بالكامل بلا قيد.
  </p>
</div>

<h2>توزيع الأحياء المفتوحة على القضاوات</h2>
<ul style="line-height:2;color:#334155;padding-right:22px;list-style:disc;">
  <li><strong>Şahinbey</strong> — 35 حياً</li>
  <li><strong>Şehitkamil</strong> — 24 حياً</li>
  <li><strong>İslahiye</strong> — 14 حياً</li>
  <li><strong>Oğuzeli</strong> — 11 حياً (كل القضاء)</li>
  <li><strong>Nizip</strong> — 10 أحياء</li>
  <li><strong>Karkamış</strong> — 8 أحياء (كل القضاء)</li>
  <li><strong>Araban</strong> — 2 حي (كل القضاء)</li>
  <li><strong>Nurdağı</strong> — 2 حي</li>
</ul>

<h2>القائمة التفصيلية لكل قضاء</h2>

<h3 style="color:#065f46;">Şahinbey — 35 حياً</h3>
<p style="color:#475569;line-height:1.9;">
ONUR · ŞEKEROĞLU · ETİLER · CEMAL GÜRSEL · TURAN EMEKSİZ · ALLEBEN · TÖRELİ · KONAK · YEŞİLPINAR · YEŞİLKENT · BEYAZLAR · BURÇ KARAKUYU · KÜÇÜKKIZILHİSAR · MALAZGİRT · BİNEVLER · KOZANLI · KARATARLA · BOSTANCI · TISLAKİ · SEFERPAŞA · SAKARYA · KANALICI · BARIŞ · ESENTEPE · AKDERE · GÜZELVADİ · VATAN · BEYBAHÇE · YAMAÇTEPE · KAVAKLIK · İSTİKLAL · DENİZ · BAHÇELİEVLER · ULAŞ · EYÜPOĞLU
</p>

<h3 style="color:#065f46;">Şehitkamil — 24 حياً</h3>
<p style="color:#475569;line-height:1.9;">
BAŞPINAR (ORGANİZE) OSB · ÇAKMAK · ÇAĞLAYAN · HUMANİZ · SACIR · ÇIKSORUT · KARŞIYAKA · MİTHATPAŞA · HASIRCIOĞLU · MÜNÜUFPAŞA · SAM · NURTEPE · AKTOPRAK SB · NESİMİ · İNCİLİKAYA · EYDİBABA · GÖZTEPE · DÜLÜKBABA · KARAOĞLAN · HÜRRİYET · SİNAN OSB · TAŞLICA · YUNUS EMRE · GİRNE
</p>

<h3 style="color:#065f46;">İslahiye — 14 حياً</h3>
<p style="color:#475569;line-height:1.9;">
ÖRTÜLÜ · CEVDETPAŞA · DEĞİRMENCİK · AYDINLIK · DERVİŞPAŞA · KIRIKÇALI · HACI ALİ ÖZTÜRK · HÜRRİYET · PINARBAŞI · ERENLER · BEYLER · ATATÜRK · YENİ
</p>

<h3 style="color:#065f46;">Oğuzeli — 11 حياً (كل القضاء)</h3>
<p style="color:#475569;line-height:1.9;">
ÇAVUŞBAŞI · KURTULUŞ · GÜLLÜK · AŞAĞI GÜNEYSE · ŞIH KÜÇÜKKARACAVİRAN · TAŞÇANAK · BULDUK · DEVEHÜYÜĞÜ · BEŞDELİ · OĞUZLAR · SUBAŞI
</p>

<h3 style="color:#065f46;">Nizip — 10 أحياء</h3>
<p style="color:#475569;line-height:1.9;">
ZEYTİNLİK · BELKİS · ATATÜRK · NAHİRTEPE · MİMAR SİNAN · BELKİS (MERKEZ) · İSTİKLAL · TURNALI · KIBRIS · YEŞİLEVLER
</p>

<h3 style="color:#065f46;">Karkamış — 8 أحياء (كل القضاء)</h3>
<p style="color:#475569;line-height:1.9;">
BEŞKILIÇ · KEPİRLER · ERENYOLU · YARIMCA · GÜRÇAY · LOJMANLAR · BALABAN · AKCAKÖY
</p>

<h3 style="color:#065f46;">Araban — 2 حي (كل القضاء)</h3>
<p style="color:#475569;line-height:1.9;">
MEHMET GÖKÇEK · DUMLUPINAR
</p>

<h3 style="color:#065f46;">Nurdağı — 2 حي</h3>
<p style="color:#475569;line-height:1.9;">
ESENYURT · GEDİKLİ
</p>

<div style="background:#f1f5f9;border-right:4px solid #16a34a;padding:14px 18px;margin:20px 0;border-radius:8px;color:#0f172a;line-height:1.9;">
  <strong>للتعرف على منطقتك بدقة:</strong>
  لمعرفة ما إذا كان عنوانك ضمن القائمة المفتوحة، ادخل صفحة المناطق المحظورة في الموقع:
  <a href="https://dalilarabtr.com/zones/Gaziantep" style="color:#15803d;font-weight:bold;text-decoration:underline;">/zones/Gaziantep</a>
  — تستطيع البحث باسم الحي مباشرة.
</div>

<h2>ماذا يعني هذا للسوريين والعرب في غازي عنتاب</h2>
<p style="color:#1e293b;line-height:1.9;">
بعد قرار 9 يونيو 2026، توزّع الحظر على 5 قضاوات فقط (Şahinbey, Şehitkamil, İslahiye, Nizip, Nurdağı) في 57 حياً فقط، فيما أصبحت ثلاث قضاوات بكاملها (Araban, Karkamış, Oğuzeli) خالية تماماً من قائمة الحظر. إن كان عنوانك ضمن هذه القائمة، يمكنك التقدّم لمديرية النفوس لاستكمال أي من المعاملات التالية دون رفض بسبب الحظر الإقليمي:
</p>
<ul style="line-height:2;color:#334155;padding-right:22px;list-style:disc;">
  <li>تسجيل عنوان جديد بعد الانتقال (Yerleşim Yeri Belgesi)</li>
  <li>تجديد الإقامة أو الكملك على العنوان الحالي</li>
  <li>توثيق عقد الإيجار للأغراض الرسمية والضريبية</li>
  <li>إصدار وثائق تتطلب عنواناً مسجلاً (e-Devlet، فواتير، اشتراكات)</li>
  <li>طلب لمّ شمل عائلي على العنوان المسجل</li>
</ul>
`,
    steps: [
        'تأكد من أن عنوانك يقع ضمن أحد الأحياء المذكورة في القائمة أعلاه',
        'اصطحب معك الكملك + فاتورة باسمك أو باسم صاحب البيت + عقد الإيجار الموثق',
        'توجّه لأقرب مديرية نفوس (Nüfus Müdürlüğü) في القضاء التابع له',
        'اطلب نموذج "تسجيل عنوان" (Yerleşim Yeri Bildirimi) من الموظف المختص',
        'عبّئ النموذج بدقة بالأحرف اللاتينية مطابقة للكملك',
        'سلّم الأوراق وانتظر إصدار وثيقة العنوان (Yerleşim Yeri Belgesi)',
    ],
    documents: [
        'الكملك الأصلي + نسخة',
        'فاتورة (كهرباء أو ماء أو غاز) باسمك أو باسم صاحب البيت',
        'عقد إيجار موثق من النوتر (إن كنت مستأجراً)',
        'طابو البيت (إن كان البيت ملكاً)',
        'نموذج تسجيل العنوان (يُسحب من مديرية النفوس)',
    ],
    tips: [
        'احتفظ بصور من القائمة الرسمية كدليل أمام أي موظف يرفض المعاملة بحجة الحظر',
        'لو لم تنجح المعاملة في مديرية النفوس، اطلب الرفض كتابياً مع ختم رسمي',
        'القائمة قد تتغيّر — راجع آخر تحديث في صفحة المناطق المحظورة على الموقع قبل أي معاملة',
        'عقد الإيجار يجب أن يكون موثقاً من النوتر — العقد العادي قد لا يُقبل',
        'لو عنوانك في حي مغلق، الحل الوحيد هو الانتقال إلى حي ضمن القائمة المفتوحة',
    ],
    fees: 'مجانية — لا توجد رسوم لتسجيل العنوان في مديرية النفوس',
    warning: 'هذه القائمة استرشادية ومستندة للإعلان الرسمي الصادر بتاريخ 9 يونيو 2026 عن مديرية النفوس في ولاية غازي عنتاب. القرارات الإدارية قد تتغيّر دون إشعار مسبق. راجع آخر التحديثات في صفحة المناطق المحظورة، أو اتصل بأقرب مديرية نفوس قبل التحرك بأي معاملة رسمية.',
    source: 'https://www.goc.gov.tr',
    tags: ['خبر_رئيسي', 'غازي_عنتاب', 'الإقامة_والكيمليك', 'معاملات_رسمية'],
    seo_title: '106 حي مفتوحاً للتسجيل في غازي عنتاب 2026 — القائمة الكاملة (8 قضاوات)',
    seo_description: 'مديرية النفوس في غازي عنتاب تنشر القائمة الرسمية للأحياء المفتوحة لتسجيل عناوين الأجانب: 106 حي موزّعة على 8 قضاوات. Şahinbey 35، Şehitkamil 24، İslahiye 14، Oğuzeli 11، Nizip 10، Karkamış 8، Araban 2، Nurdağı 2.',
    seo_keywords: [
        'غازي عنتاب',
        'الأحياء المفتوحة',
        'رفع الحظر',
        'تسجيل العناوين',
        'مديرية النفوس',
        'Şahinbey',
        'Şehitkamil',
        'نوفوس عنتاب',
        'أحياء مسموح بها',
        'كملك عنتاب',
    ],
    status: 'approved',
    active: true,
    last_update: TODAY,
    published_at: `${TODAY}T08:00:00+03:00`,
    created_at: `${TODAY}T08:00:00+03:00`,
};

async function main() {
    // Idempotent: upsert by id so re-running just overwrites.
    const { error } = await supa.from('articles').upsert(article);
    if (error) {
        console.error('Insert failed:', error);
        process.exit(1);
    }

    console.log('✓ Published article:');
    console.log(`  /article/${article.slug}`);
    console.log(`  title: ${article.title}`);
    console.log(`  tags: ${article.tags.join(', ')}`);
    console.log(`  featured: yes (خبر_رئيسي)`);
    console.log(`  last_update: ${article.last_update}`);

    // Bust ISR so the homepage carousel + article page show immediately.
    try {
        const r = await fetch(
            `https://dalilarabtr.com/api/admin/revalidate?path=/article/${article.slug}`,
            { method: 'POST' }
        );
        console.log(`\nRevalidate /article/${article.slug}: ${r.status}`);
        const r2 = await fetch(`https://dalilarabtr.com/api/admin/revalidate?path=/`, {
            method: 'POST',
        });
        console.log(`Revalidate /: ${r2.status}`);
    } catch (e) {
        console.log('Revalidate skipped:', String(e));
    }
}

main().catch(e => { console.error(e); process.exit(1); });
