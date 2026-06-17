/**
 * Fix the gaziantep-zones-lift-2026-06-09 article: the run-on neighborhood
 * names in the "still-closed" list (Şahinbey + Nizip in particular) render
 * as one giant unbroken string because the HTML was authored as plain
 * comma-separated text without proper <li> wrapping.
 *
 * IMPORTANT: do NOT touch `last_update` — the user explicitly does not
 * want a "تم تحديث المقال" signal to fire on every fix. Keeping
 * last_update at 2026-06-09 means the homepage carousel + isRecentlyUpdated
 * badge stay where they were. Same goes for `created_at` and admin
 * activity log — we update `details` only.
 *
 * Source of truth: the official Gaziantep Nüfus chart (2026-06-09).
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

const ARTICLE_ID = 'gaziantep-zones-lift-2026-06-09';

// Still-closed list per district — from the official chart, ordered to
// match the article's narrative (smallest district to largest).
const STILL_CLOSED = {
    'İslahiye': ['FEVZİ ÇAKMAK MAHALLESİ'],
    'Nizip': [
        'HAFIZPAŞA MAHALLESİ',
        'FEVZİ PAŞA MAHALLESİ',
        'NAMIK KEMAL MAHALLESİ',
        'CUMHURİYET MAHALLESİ',
        'TAHTANI MAHALLESİ',
        'İSTASYON MAHALLESİ',
        'ŞAHİNBEY MAHALLESİ',
        'FEVKANİ MAHALLESİ',
        'SAHA MAHALLESİ',
        'ŞIHLAR MAHALLESİ',
        'PAZAR CAMİİ MAHALLESİ',
    ],
    'Nurdağı': ['ASLANLI MAHALLESİ'],
    'Şahinbey': [
        '25 ARALIK MAHALLESİ',
        'AKYOL MAHALLESİ',
        'ALAYBEY MAHALLESİ',
        'ALİBABA MAHALLESİ',
        'AYDINBABA MAHALLESİ',
        'BEKİRBEY MAHALLESİ',
        'BEY MAHALLESİ',
        'BEYDİLLİ MAHALLESİ',
        'BOYACI MAHALLESİ',
        'BOZOKLAR MAHALLESİ',
        'CABİ MAHALLESİ',
        'CENGİZ TOPEL MAHALLESİ',
        'CUMHURİYET MAHALLESİ',
        'DUMLUPINAR MAHALLESİ',
        'DÜZTEPE MAHALLESİ',
        'GÜMÜŞTEKİN MAHALLESİ',
        'HOŞGÖR MAHALLESİ',
        'KAHVELİPINAR MAHALLESİ',
        'KARAGÖZ MAHALLESİ',
        'KARAYILAN MAHALLESİ',
        'KEPENEK MAHALLESİ',
        'KIBRIS MAHALLESİ',
        'KILINÇOĞLU MAHALLESİ',
        'KOZLUCA MAHALLESİ',
        'KURBANBABA MAHALLESİ',
        'NURİPAZARBAŞI MAHALLESİ',
        'PERİLİKAYA MAHALLESİ',
        'SAÇAKLI MAHALLESİ',
        'SAVCILI MAHALLESİ',
        'SULTAN SELİM MAHALLESİ',
        'SUYABATMAZ MAHALLESİ',
        'ŞAHVELİ MAHALLESİ',
        'ŞENYURT MAHALLESİ',
        'TEKSTİLKENT MAHALLESİ',
        'TÜRKMENLER MAHALLESİ',
        'TÜRKTEPE MAHALLESİ',
        'YAVUZLAR MAHALLESİ',
        'YAZICIK MAHALLESİ',
        'YUKARIBAYIR MAHALLESİ',
        'ÇAMLICA MAHALLESİ',
        'ÜNALDI MAHALLESİ',
        'ÜÇOKLAR MAHALLESİ',
        'İNÖNÜ MAHALLESİ',
    ],
    'Şehitkamil': ['YAPRAK MAHALLESİ'],
};

function renderList(items: string[]): string {
    return items.map(n => `    <li>${n}</li>`).join('\n');
}

const DISTRICT_BLOCKS: Array<{ name: string; count: number; key: keyof typeof STILL_CLOSED; tag?: string }> = [
    { name: 'İslahiye',   count: 1,  key: 'İslahiye'   },
    { name: 'Nizip',      count: 11, key: 'Nizip'      },
    { name: 'Nurdağı',    count: 1,  key: 'Nurdağı'    },
    { name: 'Şahinbey',   count: 43, key: 'Şahinbey',  tag: ' (الأكبر)' },
    { name: 'Şehitkamil', count: 1,  key: 'Şehitkamil' },
];

function buildClosedListHtml(): string {
    return DISTRICT_BLOCKS.map(b => `
<h3 style="color:#7f1d1d;margin-top:18px;">🔴 ${b.name} — ${b.count} حي${b.tag || ''}</h3>
<ul style="line-height:2;color:#334155;padding-right:22px;list-style:disc;">
${renderList(STILL_CLOSED[b.key])}
</ul>`).join('\n');
}

async function main() {
    // Pull current details so we can splice — we only replace the section
    // between the "<h2>القائمة الرسمية" heading and the next major heading.
    const { data: row, error: fetchErr } = await supa
        .from('articles')
        .select('id, title, last_update, details')
        .eq('id', ARTICLE_ID)
        .single();

    if (fetchErr || !row) {
        console.error('Failed to fetch article:', fetchErr);
        process.exit(1);
    }

    console.log(`Loaded article: "${row.title}"`);
    console.log(`Current last_update: ${row.last_update}  (preserving — no notification)`);

    const details: string = row.details || '';
    const startMarker = '<h2>القائمة الرسمية';
    const endMarker = '<h2>ماذا يعني هذا';

    const startIdx = details.indexOf(startMarker);
    const endIdx = details.indexOf(endMarker);
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
        console.error('Could not locate the closed-list section markers in details.');
        console.error(`startMarker found: ${startIdx !== -1}  endMarker found: ${endIdx !== -1}`);
        process.exit(1);
    }

    const before = details.slice(0, startIdx);
    const after = details.slice(endIdx);

    const newSection = `<h2>القائمة الرسمية للأحياء المغلقة (57 حياً)</h2>
<p style="color:#475569;line-height:1.8;">القائمة المعتمدة من مديرية النفوس في غازي عنتاب — 57 حياً موزّعة على 5 قضاوات. ثلاث قضاوات (Araban, Karkamış, Oğuzeli) خرجت تماماً من قائمة الحظر.</p>
${buildClosedListHtml()}

<div style="background:#f1f5f9;border-right:4px solid #16a34a;padding:14px 18px;margin:20px 0;border-radius:8px;color:#0f172a;line-height:1.9;">
  <strong>كل الأحياء غير المُدرَجة أعلاه مفتوحة لتسجيل الأجانب.</strong>
  ثلاث قضاوات بأكملها — <strong>Araban</strong> (كانت 2)، <strong>Karkamış</strong> (كانت 8)، و<strong>Oğuzeli</strong> (كانت 11) — خرجت تماماً من قائمة الحظر.
</div>

`;

    const newDetails = before + newSection + after;

    // Sanity check: total length should change but not catastrophically.
    console.log(`details length: ${details.length} -> ${newDetails.length}`);

    // Update ONLY details. Do not touch last_update, created_at, status, etc.
    const { error: updateErr } = await supa
        .from('articles')
        .update({ details: newDetails })
        .eq('id', ARTICLE_ID);

    if (updateErr) {
        console.error('Update failed:', updateErr);
        process.exit(1);
    }

    console.log('\n✓ Article details updated.');
    console.log('✓ last_update preserved — no "تم تحديث المقال" signal fired.');

    // Trigger ISR revalidation so the new HTML appears immediately on
    // production without waiting for the 1-hour cache. The revalidate
    // endpoint just busts the Next.js cache for /article/[slug] — it does
    // NOT touch the article record or fire any user-facing notification.
    try {
        const url = `https://dalilarabtr.com/api/admin/revalidate?path=/article/${ARTICLE_ID}`;
        const res = await fetch(url, { method: 'POST' });
        if (res.ok) {
            console.log('✓ Production ISR cache busted — fix is live now.');
        } else {
            console.log(`(revalidate returned ${res.status} — fix will appear within 1 hour anyway)`);
        }
    } catch (e) {
        console.log('(revalidate fetch failed — fix will appear within 1 hour anyway):', String(e));
    }
}

main().catch(e => { console.error(e); process.exit(1); });
