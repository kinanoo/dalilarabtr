/**
 * Render a weekly digest email as HTML + plaintext from an article list.
 *
 * Kept in lib (not in the route) so the admin "send now" button and the
 * cron route can share the same renderer — and so a future preview page
 * can render the same template without spinning up an HTTP call.
 *
 * Design constraints:
 *   - Inline styles only. Email clients strip <style> blocks unpredictably,
 *     and our audience reads mostly in Gmail / Outlook web where inline is
 *     the safe baseline.
 *   - RTL set on the wrapper; client falls back to LTR rendering with
 *     Arabic text inside, which is still readable but slightly wrong on
 *     punctuation. Acceptable.
 *   - Body width capped at 600px — the Gmail mobile column standard.
 *   - No external assets except the article hero (already on Supabase
 *     storage + CDN). No tracking pixels.
 */

import { SITE_CONFIG } from '@/lib/config';

export interface DigestArticle {
    id: string;
    slug: string;
    title: string;
    intro: string | null;
    category: string | null;
    published_at: string | null;
    image: string | null;
}

export interface RenderedDigest {
    subject: string;
    html: string;
    text: string;
    /** Stable identifier for the batch — usable as audit primary key. */
    runKey: string;
}

const SITE_URL = SITE_CONFIG.siteUrl.replace(/\/$/, '');

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function truncate(s: string, n: number): string {
    if (!s) return '';
    const trimmed = s.trim();
    if (trimmed.length <= n) return trimmed;
    return trimmed.slice(0, n - 1).trim() + '…';
}

export function renderDigestEmail(articles: DigestArticle[]): RenderedDigest {
    const count = articles.length;
    const dateLabel = new Date().toLocaleDateString('ar-EG', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
    // runKey is a stable handle for the batch — used as audit row id and as
    // a value an unsubscribe link could carry. Deterministic from inputs so
    // the same run can be retried without producing duplicate audit rows.
    const runKey = `digest-${new Date().toISOString().slice(0, 10)}-${articles.length}`;

    const subject =
        count === 1
            ? `${articles[0].title}`
            : `${count} تحديثات جديدة هذا الأسبوع — دليل العرب والسوريين في تركيا`;

    const cards = articles
        .map((a) => {
            const link = `${SITE_URL}/article/${a.slug}`;
            const intro = truncate(stripTags(a.intro || ''), 220);
            const imageBlock = a.image
                ? `<img src="${escapeHtml(a.image)}" alt="" width="600" height="220" style="display:block;width:100%;max-width:600px;height:auto;border-radius:12px 12px 0 0;object-fit:cover;" />`
                : '';
            return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 16px 0;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
  <tr><td style="padding:0;">${imageBlock}</td></tr>
  <tr>
    <td style="padding:18px 20px;">
      ${a.category ? `<div style="font-size:11px;font-weight:700;color:#059669;text-transform:none;margin-bottom:6px;">${escapeHtml(a.category)}</div>` : ''}
      <a href="${escapeHtml(link)}" style="text-decoration:none;color:#0f172a;">
        <div style="font-size:17px;font-weight:800;line-height:1.45;color:#0f172a;">${escapeHtml(a.title)}</div>
      </a>
      ${intro ? `<p style="margin:8px 0 12px;font-size:14px;line-height:1.7;color:#475569;">${escapeHtml(intro)}</p>` : ''}
      <a href="${escapeHtml(link)}" style="display:inline-block;background:#059669;color:#ffffff;font-weight:700;font-size:13px;padding:8px 16px;border-radius:8px;text-decoration:none;">اقرأ التفاصيل ←</a>
    </td>
  </tr>
</table>`;
        })
        .join('\n');

    const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;text-align:right;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f1f5f9;">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="padding:20px 20px 8px;">
            <div style="font-size:12px;color:#64748b;">${escapeHtml(dateLabel)}</div>
            <div style="font-size:22px;font-weight:900;color:#0f172a;margin-top:4px;line-height:1.3;">
              ${count} تحديثات جديدة هذا الأسبوع
            </div>
            <div style="font-size:13px;color:#475569;margin-top:6px;line-height:1.6;">
              أبرز ما نشرنا في دليل العرب والسوريين في تركيا. اضغط أيّ بطاقة لقراءة المقال كاملاً.
            </div>
          </td>
        </tr>
        <tr><td style="padding:16px 0;">${cards}</td></tr>
        <tr>
          <td style="padding:20px;background:#0f172a;border-radius:12px;text-align:center;color:#cbd5e1;font-size:12px;line-height:1.7;">
            <div style="font-weight:700;color:#ffffff;margin-bottom:4px;">دليل العرب والسوريين في تركيا</div>
            <div><a href="${SITE_URL}" style="color:#34d399;text-decoration:none;">${SITE_URL.replace(/^https?:\/\//, '')}</a></div>
            <div style="margin-top:10px;font-size:11px;color:#94a3b8;">
              وصلك هذا البريد لأنّك مشترك في نشرتنا.<br>
              يمكنك إلغاء الاشتراك بأيّ وقت من
              <a href="${SITE_URL}/unsubscribe" style="color:#34d399;">هنا</a>.
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body></html>`;

    const text = articles
        .map((a) => `• ${a.title}\n  ${SITE_URL}/article/${a.slug}`)
        .join('\n\n')
        + `\n\n—\nدليل العرب والسوريين في تركيا\n${SITE_URL}`;

    return { subject, html, text, runKey };
}

// Very small HTML stripper for the intro field (which often contains <strong>
// and similar tags). Email clients render plain prose better than mixed HTML
// inside the card description.
function stripTags(s: string): string {
    return s.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
}
