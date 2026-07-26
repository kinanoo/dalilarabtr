/**
 * The acceptance test for «أين يقع؟»: type the question a real visitor types
 * into the site's actual search box, and check the right place comes back FIRST
 * with a working Google-Maps link.
 *
 * This drives the real component → real useGlobalSearch hook → real tokenizer,
 * synonyms and scorer → real search index. A unit test of the data table cannot
 * catch a ranking regression (a new synonym that makes every consulate in
 * İstanbul tie, say); this can.
 *
 * Supabase is mocked to null so only the local index is exercised — the remote
 * half needs a live database and is not what this test is about.
 */

import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import GlobalSearch from '@/components/GlobalSearch';

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

jest.mock('@/lib/supabaseClient', () => ({ supabase: null }));

/** The first result row's link + its Maps button, once the dropdown settles. */
async function firstResult(query: string) {
    render(<GlobalSearch />);
    // fireEvent.change (not per-keystroke typing): the hook debounces, so only
    // the final value matters and this keeps the test fast.
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: query } });

    const listbox = await waitFor(() => screen.getByRole('listbox'), { timeout: 3000 });
    const options = await waitFor(
        () => {
            const found = listbox.querySelectorAll('[role="option"]');
            if (found.length === 0) throw new Error('no results yet');
            return Array.from(found);
        },
        { timeout: 3000 }
    );

    const top = options[0] as HTMLAnchorElement;
    const row = top.parentElement as HTMLElement;
    const mapLink = row?.querySelector('a[href*="google.com/maps"]') as HTMLAnchorElement | null;
    return { href: top.getAttribute('href'), label: top.getAttribute('aria-label') || '', mapLink, row };
}

describe('global search → official places', () => {
    // The exact requests the feature was built for.
    const CASES: Array<[string, string]> = [
        ['القنصلية السورية في اسطنبول', '/places/syria-consulate-istanbul'],
        ['القنصلية السورية في عينتاب', '/places/syria-consulate-gaziantep'],
        ['القنصلية السورية في غازي عنتاب', '/places/syria-consulate-gaziantep'],
        ['القنصلية المصرية في اسطنبول', '/places/egypt-consulate-istanbul'],
        ['القنصلية السعودية في اسطنبول', '/places/saudi-consulate-istanbul'],
        ['ادارة الهجرة في اسطنبول', '/places/goc-istanbul'],
        // Dialect spelling + a filler word the tokenizer has to drop + the city
        // glued to a preposition (بإسطنبول / بعنتاب), which is how people write it.
        ['وين القنصليه السوريه باسطنبول', '/places/syria-consulate-istanbul'],
        ['وين القنصليه السوريه بعنتاب', '/places/syria-consulate-gaziantep'],
        ['ادارة الهجرة بغازي عنتاب', '/places/goc-gaziantep'],
        ['سفارة سوريا في انقرة', '/places/syria-embassy-ankara'],
        ['دائرة النفوس في بورصة', '/places/nufus-bursa'],
        ['الطابو في مرسين', '/places/tapu-mersin'],
    ];

    it.each(CASES)('«%s» → %s, first result', async (query, expectedHref) => {
        const { href } = await firstResult(query);
        expect(href).toBe(expectedHref);
    }, 20000);

    it('gives place results a one-tap Maps link aimed at the stored address', async () => {
        const { label, mapLink } = await firstResult('القنصلية السورية في اسطنبول');
        expect(label).toContain('موقع رسمي');
        expect(mapLink).not.toBeNull();
        // The stored address, not just the name — so the link lands on the
        // exact building instead of a list of similarly-named pins.
        expect(mapLink!.getAttribute('href')).toContain(encodeURIComponent('Maçka Cad.'));
        expect(mapLink!.getAttribute('target')).toBe('_blank');
    }, 20000);

    it('shows the address inside the result row', async () => {
        const { row } = await firstResult('القنصلية السورية في اسطنبول');
        expect(row.textContent).toContain('Teşvikiye');
    }, 20000);

    it('still ranks non-place queries normally (no place flooding)', async () => {
        const { href } = await firstResult('المناطق المحظورة');
        expect(href).toBe('/zones');
    }, 20000);
});
