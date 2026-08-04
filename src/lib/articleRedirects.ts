/**
 * Permanent article redirects: merged slug → surviving slug.
 *
 * When two or three URLs answered the same question, they split the ranking
 * between them and none won. Consolidation folds the smaller pages into the
 * strongest one — but their URLs are indexed by Google, shared in Telegram and
 * WhatsApp, and linked from other articles. Deleting the rows without this map
 * would turn every one of those into a 404 and throw away the signals the merge
 * was meant to collect.
 *
 * The article route checks this map BEFORE looking the slug up, so an entry
 * here works even after the row is gone. Redirects are 308 (permanent), which
 * is what tells Google to transfer the old URL's authority to the target.
 *
 * Invariants, enforced by the test alongside this file:
 *  - no key may also be a value (no redirect chains)
 *  - no key may equal its value (no self-redirect loop)
 */
export const ARTICLE_REDIRECTS: Record<string, string> = {
    // filled in by the consolidation migration; see sql/2026-08-04_article_merge_*.sql
};

/** Resolve a slug to its redirect target, or null when it is not merged. */
export function resolveArticleRedirect(slug: string): string | null {
    const target = ARTICLE_REDIRECTS[slug];
    return target && target !== slug ? target : null;
}
