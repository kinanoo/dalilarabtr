import { plainTextExcerpt, stripHtml } from '@/lib/stripHtml';

describe('stripHtml', () => {
    it('removes formatting tags from an Arabic news summary', () => {
        expect(stripHtml('<strong>\u062e\u0645\u0633\u0629</strong> \u0623\u062d\u064a\u0627\u0621')).toBe('\u062e\u0645\u0633\u0629 \u0623\u062d\u064a\u0627\u0621');
    });

    it('removes encoded and repeatedly encoded tags', () => {
        expect(stripHtml('&lt;strong&gt;\u062e\u0645\u0633\u0629&lt;/strong&gt;')).toBe('\u062e\u0645\u0633\u0629');
        expect(stripHtml('&amp;lt;em&amp;gt;safe&amp;lt;/em&amp;gt;')).toBe('safe');
    });

    it('decodes named, decimal, and hexadecimal entities', () => {
        expect(stripHtml('A&nbsp;&amp;&#32;&#x42;')).toBe('A & B');
    });

    it('keeps spacing between HTML blocks and removes hidden executable content', () => {
        expect(stripHtml('<p>first</p><p>second</p><script>alert(1)</script><style>.x{}</style>')).toBe('first second');
    });

    it('also removes leftover angle brackets from malformed input', () => {
        expect(stripHtml('before <strong after')).toBe('before strong after');
    });
});

describe('plainTextExcerpt', () => {
    it('truncates on a useful word boundary and includes the ellipsis in the limit', () => {
        const excerpt = plainTextExcerpt('\u062e\u0645\u0633\u0629 \u0623\u062d\u064a\u0627\u0621 \u0645\u0641\u062a\u0648\u062d\u0629 \u062f\u0627\u0626\u0645\u0627\u064b', 13);
        expect(excerpt).toBe('\u062e\u0645\u0633\u0629 \u0623\u062d\u064a\u0627\u0621\u2026');
        expect(Array.from(excerpt)).toHaveLength(11);
    });

    it('does not split UTF-16 surrogate pairs', () => {
        expect(plainTextExcerpt('\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00', 3)).toBe('\ud83d\ude00\ud83d\ude00\u2026');
    });
});
