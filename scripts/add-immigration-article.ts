import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const article = {
    id: 'immigration-offices-istanbul',
    slug: 'immigration-offices-istanbul',
    title: 'مواقع وأرقام إدارات الهجرة في إسطنبول - بيازيد وسلطان بيلي واسنيورت وتوزلا',
    category: 'الكملك والحماية المؤقتة',
    intro: 'الدليل الشامل لمواقع إدارات الهجرة الخمسة في إسطنبول: بيازيد (كوم كابي)، سلطان بيلي، اسنيورت، توزلا (للتحويل فقط)، وإدارة الهجرة العامة شارع وطن. مع مواقع الخرائط والأرقام.',
    details: `
<h2>مواقع إدارات الهجرة في إسطنبول</h2>

<p>أصبح هناك <strong>خمسة مراكز</strong> لإدارة الهجرة في إسطنبول. ثلاثة منها لتحديث البيانات (نفس النظام)، والرابع للتحويل فقط، والخامس لأصحاب الإقامات ومقابلات الجنسية.</p>

<hr/>

<h3>1. دائرة الهجرة بيازيد - كوم كابي (إسطنبول الأوروبية)</h3>
<p><strong>العنوان:</strong> Muhsine Hatun, Samsa Sk. 31-27, 34130 Fatih/İstanbul</p>
<p><a href="https://maps.app.goo.gl/rKWsuHJsv3uUYK9T8" target="_blank" rel="noopener noreferrer" style="color: #10b981; font-weight: bold; text-decoration: underline;">فتح الموقع على خرائط جوجل</a></p>

<hr/>

<h3>2. دائرة الهجرة سلطان بيلي (إسطنبول الآسيوية)</h3>
<p><strong>العنوان:</strong> Adil, Bosna Blv. 169-155, 34935 Sultanbeyli/İstanbul</p>
<p><a href="https://maps.app.goo.gl/x6sWQhtX72RSPpC2A" target="_blank" rel="noopener noreferrer" style="color: #10b981; font-weight: bold; text-decoration: underline;">فتح الموقع على خرائط جوجل</a></p>

<hr/>

<h3>3. إدارة الهجرة فرع اسنيورت (إسطنبول الأوروبية)</h3>
<p><strong>العنوان:</strong> جانب حديقة نجم الدين، اسنيورت</p>
<p><a href="https://maps.app.goo.gl/gFMBzSYLoEmPgbxt7" target="_blank" rel="noopener noreferrer" style="color: #10b981; font-weight: bold; text-decoration: underline;">فتح الموقع على خرائط جوجل</a></p>
<p><strong>ملاحظة:</strong> لا يوجد فرق بين فرع اسنيورت وبيازيد وسلطان بيلي — نفس النظام تماماً، تم إضافته لتخفيف الضغط والازدحام.</p>

<hr/>

<h3>4. مركز توزلا - للتحويل فقط (إسطنبول الآسيوية)</h3>
<p><strong>الخدمات:</strong> فقط كسر بصمة وتحويل لولاية أخرى (لمن لا يملك كملك).</p>
<p><a href="https://maps.app.goo.gl/kxnWof5PLBenaakXA" target="_blank" rel="noopener noreferrer" style="color: #10b981; font-weight: bold; text-decoration: underline;">فتح الموقع على خرائط جوجل</a></p>

<hr/>

<h3>5. إدارة الهجرة العامة - شارع وطن (لأصحاب الإقامات)</h3>
<p><strong>الخدمات:</strong> الإقامات السياحية + مقابلات الجنسية.</p>
<p><a href="https://goo.gl/maps/ETvavGLTCKjEuVEXA" target="_blank" rel="noopener noreferrer" style="color: #10b981; font-weight: bold; text-decoration: underline;">فتح الموقع على خرائط جوجل</a></p>

<hr/>

<h3>أرقام هواتف إدارة الهجرة في إسطنبول</h3>
<p>رقمان فقط — لا يوجد غيرهما:</p>
<ul>
<li><strong><a href="tel:02124994000" style="color: #10b981;">0212 499 40 00</a></strong></li>
<li><strong><a href="tel:02124994195" style="color: #10b981;">0212 499 41 95</a></strong></li>
</ul>
`.trim(),

    steps: [
        'حدد الفرع المناسب لك حسب منطقتك (أوروبي أو آسيوي)',
        'تحديث البيانات يكون حصراً بالولاية التي صدر منها الكملك',
        'للتحويل لولاية أخرى: فقط في سلطان بيلي (كسر بصمة وتحويل جديد)',
        'أصحاب الإقامات السياحية ومقابلات الجنسية: إدارة الهجرة العامة شارع وطن',
        'غرفة الحماية موجودة في كل إدارة هجرة'
    ],

    documents: [
        'الكملك أو وثيقة الحماية المؤقتة',
        'صورة بيومترية حديثة',
        'عقد إيجار مثبت (نوتر أو e-Devlet)',
        'جواز السفر أو وثيقة الهوية'
    ],

    tips: [
        'تحديث البيانات في بيازيد = سلطان بيلي = اسنيورت — لا يوجد أي فرق بينهم',
        'رابط تحديث البيانات واحد لكل الولايات، الاختلاف فقط في اختيار الولاية آخر الرابط',
        'كملكك من إسطنبول وأنت في غازي عنتاب؟ لازم تجي إسطنبول حصراً لتحديث البيانات',
        'إذا ما عندك كملك: الأفضل تبصم في ولاية وتستقر فيها بأسرع وقت',
        'أصحاب الكملك المبطل والعودة الطوعية: قدموا طلب استرحام لإدارة الهجرة والوالي وإدارة الهجرة العامة بأنقرة',
        'أصحاب كود المنع V87: افتح دعوة بالمحكمة الإدارية لإزالة الكود، ووكّل محامي مجاني من مكتب البارو',
        'ثبّت زواجك في تركيا إذا ما عندك إثبات زواج قديم من سوريا'
    ],

    warning: 'المعلومات الواردة استرشادية وقد تتغير. يرجى مراجعة إدارة الهجرة مباشرة للتأكد من آخر التحديثات.',

    active: true,
    status: 'approved',
    last_update: '2026-03-02',

    seo_title: 'مواقع إدارات الهجرة في إسطنبول 2026 - بيازيد كوم كابي سلطان بيلي اسنيورت توزلا',
    seo_description: 'الدليل الشامل لمواقع وأرقام إدارات الهجرة في إسطنبول: بيازيد كوم كابي، سلطان بيلي، اسنيورت، توزلا، إدارة الهجرة العامة شارع وطن. مع روابط خرائط جوجل وأرقام الهاتف.',
    seo_keywords: [
        'إدارة الهجرة إسطنبول',
        'بيازيد كوم كابي',
        'سلطان بيلي',
        'اسنيورت',
        'توزلا',
        'شعبة الأجانب إسطنبول',
        'تحديث البيانات كملك',
        'كسر بصمة',
        'شارع وطن',
        'أرقام إدارة الهجرة',
        'göç idaresi istanbul',
        'immigration offices istanbul'
    ]
};

async function main() {
    console.log('Inserting article:', article.title);

    const { data, error } = await supabase
        .from('articles')
        .upsert(article, { onConflict: 'id' })
        .select('id, title, slug');

    if (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }

    console.log('Article inserted successfully:', data);
}

main();
