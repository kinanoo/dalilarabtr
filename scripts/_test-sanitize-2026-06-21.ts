import DOMPurify, { sanitizeHtmlContent } from '../src/lib/sanitize';

const cases: Array<{ name: string; input: string; expectContains?: string; expectNotContains?: string; useShim?: boolean }> = [
    { name: 'plain text passthrough', input: 'Hello world', expectContains: 'Hello world' },
    { name: 'safe HTML preserved', input: '<p>Hello <strong>world</strong></p>', expectContains: '<strong>world</strong>' },
    { name: 'strip <script>', input: '<p>safe</p><script>alert(1)</script>', expectNotContains: '<script>' },
    { name: 'strip onerror handler', input: '<img src=x onerror=alert(1)>', expectNotContains: 'onerror' },
    { name: 'keep style="text-align: center"', input: '<p style="text-align: center">x</p>', expectContains: 'text-align' },
    { name: 'keep TipTap link with rel', input: '<a href="https://example.com" target="_blank" rel="noopener noreferrer">x</a>', expectContains: 'rel="noopener noreferrer"' },
    { name: 'strip javascript: scheme', input: '<a href="javascript:alert(1)">x</a>', expectNotContains: 'javascript:' },
    { name: 'keep Arabic text', input: '<p>مرحبا بك في الموقع</p>', expectContains: 'مرحبا بك في الموقع' },
    { name: 'keep Arabic-slug link', input: '<a href="/article/مرحبا">x</a>', expectContains: 'مرحبا' },
    { name: 'allow class attribute', input: '<div class="prose-content"><h2>x</h2></div>', expectContains: 'class="prose-content"' },
    { name: 'DOMPurify shim API works', input: '<p>shim works</p>', expectContains: 'shim works', useShim: true },
    { name: 'real article body sample', input: '<h2>المستندات المطلوبة</h2><ul><li>جواز السفر</li><li>كملك (Kimlik)</li></ul><p style="text-align: right">اضغط <a href="https://example.com" target="_blank" rel="noopener noreferrer">هنا</a></p>', expectContains: 'جواز السفر' },
];

let pass = 0, fail = 0;
for (const c of cases) {
    const out = c.useShim ? DOMPurify.sanitize(c.input) : sanitizeHtmlContent(c.input);
    let ok = true;
    if (c.expectContains && !out.includes(c.expectContains)) ok = false;
    if (c.expectNotContains && out.includes(c.expectNotContains)) ok = false;
    if (ok) { pass++; console.log(`  PASS  ${c.name}`); }
    else { fail++; console.log(`  FAIL  ${c.name}\n        in:  ${c.input}\n        out: ${out}`); }
}
console.log(`\n${pass}/${pass+fail} passed`);
process.exit(fail === 0 ? 0 : 1);
