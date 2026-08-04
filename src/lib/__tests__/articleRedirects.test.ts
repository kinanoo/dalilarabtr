import { ARTICLE_REDIRECTS, resolveArticleRedirect } from '@/lib/articleRedirects';

/**
 * These invariants are cheap to break by hand and expensive to notice in
 * production: a chain costs an extra hop and dilutes the signal Google
 * transfers, and a self-entry is an infinite redirect loop that takes the page
 * down entirely.
 */
describe('article redirects', () => {
    const keys = Object.keys(ARTICLE_REDIRECTS);
    const values = Object.values(ARTICLE_REDIRECTS);

    it('never redirects a slug to itself', () => {
        const loops = keys.filter((k) => ARTICLE_REDIRECTS[k] === k);
        expect(loops).toEqual([]);
    });

    it('never chains: no target is itself a redirect source', () => {
        const chained = values.filter((v) => keys.includes(v));
        expect(chained).toEqual([]);
    });

    it('has no empty keys or targets', () => {
        expect(keys.every((k) => k.trim().length > 0)).toBe(true);
        expect(values.every((v) => typeof v === 'string' && v.trim().length > 0)).toBe(true);
    });

    it('resolves a known merge and ignores an unknown slug', () => {
        if (keys.length > 0) {
            expect(resolveArticleRedirect(keys[0])).toBe(ARTICLE_REDIRECTS[keys[0]]);
        }
        expect(resolveArticleRedirect('a-slug-that-was-never-merged')).toBeNull();
    });
});
