/**
 * The reading palette is enforced at the sanitizer, not by hoping authors
 * behave: article bodies had drifted to 1,783 inline colour values in 72 hues.
 * These tests pin the contract — SHAPE survives, COLOUR does not — so a future
 * "let me just re-allow background-color" edit fails loudly instead of quietly
 * repainting every guide.
 */
import { sanitizeHtmlContent } from '@/lib/sanitize';

describe('sanitizeHtmlContent — colour discipline', () => {
    it('drops background / colour / border-colour from a typical callout box', () => {
        const out = sanitizeHtmlContent(
            '<div style="background:#ecfdf5;border:2px solid #10b981;padding:18px;' +
            'border-radius:12px;color:#065f46">مهم</div>'
        );
        expect(out).not.toMatch(/#ecfdf5|#10b981|#065f46/);
        expect(out).not.toMatch(/background\s*:/);
        expect(out).not.toMatch(/(^|[;"\s])color\s*:/);
        // shape survives so the site skin has something to dress
        expect(out).toMatch(/padding\s*:\s*18px/);
        expect(out).toMatch(/border-radius\s*:\s*12px/);
        expect(out).toContain('مهم');
    });

    it('keeps a side rule as width+style after stripping its hue', () => {
        const out = sanitizeHtmlContent(
            '<div style="border-right:4px solid #ea580c;padding:16px">تنبيه</div>'
        );
        expect(out).not.toMatch(/#ea580c/);
        expect(out).toMatch(/border-right\s*:\s*4px solid/);
    });

    it('strips rgb()/named colours from border shorthands too', () => {
        const out = sanitizeHtmlContent(
            '<p style="border-left:2px dashed rgb(220, 38, 38);padding:4px">x</p>' +
            '<p style="border:1px solid red;padding:4px">y</p>'
        );
        expect(out).not.toMatch(/rgb\(|red/);
        expect(out).toMatch(/border-left\s*:\s*2px dashed/);
        expect(out).toMatch(/border\s*:\s*1px solid/);
    });

    it('leaves layout and text semantics untouched', () => {
        const out = sanitizeHtmlContent(
            '<div style="display:flex;gap:8px;overflow-x:auto"><strong>نص</strong>' +
            '<a href="https://x.test" target="_blank">رابط</a></div>'
        );
        expect(out).toMatch(/display\s*:\s*flex/);
        expect(out).toMatch(/gap\s*:\s*8px/);
        expect(out).toContain('<strong>نص</strong>');
        expect(out).toContain('rel="noopener noreferrer"');
    });

    it('still blocks the dangerous style values it always blocked', () => {
        const out = sanitizeHtmlContent(
            '<div style="background-image:url(javascript:alert(1));padding:2px">x</div>' +
            '<script>alert(1)</script>'
        );
        expect(out).not.toMatch(/javascript:|url\(|<script/i);
    });
});
