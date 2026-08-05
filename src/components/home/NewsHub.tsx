/**
 * NewsHub — server wrapper that feeds NewsAndUpdates.
 *
 * Merges the two formerly-separate homepage news rows into one source of
 * truth:
 *   1. Featured/breaking articles  (articles tagged خبر_رئيسي) — were the
 *      big FeaturedNewsHero carousel.
 *   2. Latest updates              (passed in from the page) — were the
 *      "آخر التحديثات" HomeUpdates carousel.
 *
 * Featured items are mapped first (and flagged so the card highlights
 * them), updates follow, and anything whose title already appears in the
 * featured set is dropped so the rail never shows the same story twice —
 * which is exactly the duplication the stacked layout suffered from.
 */

import { supabase, withTimeout } from '@/lib/supabaseClient';
import NewsAndUpdates, { type NewsItem } from './NewsAndUpdates';

const FEATURED_TAG = 'خبر_رئيسي';

const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

function formatArabicDate(isoDate?: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function normTitle(t?: string): string {
  return (t || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

type FeaturedRow = {
  id: string;
  slug?: string | null;
  title: string;
  intro?: string | null;
  category?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  image?: string | null;
};

export type UpdateInput = {
  id: string;
  title: string;
  type: string;
  date: string;
  sortDate?: string;
  sortTime?: string;
  image?: string;
  href?: string;
};

async function getFeatured(): Promise<FeaturedRow[]> {
  if (!supabase) return [];
  try {
    const result = await withTimeout(
      supabase
        .from('articles')
        // created_at is selected, not just ordered by: it is the fallback when
        // published_at is null. That was harmless while featured items were
        // pinned to the front regardless of date, but now that the list is
        // sorted an empty sortDate would sink a brand-new article to the end.
        .select('id, slug, title, intro, category, published_at, created_at, image')
        .contains('tags', [FEATURED_TAG])
        .eq('active', true)
        .eq('status', 'approved')
        .order('published_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(8),
      5000,
    );
    const rows = (result as { data?: FeaturedRow[] } | null)?.data;
    return rows || [];
  } catch {
    return [];
  }
}

export default async function NewsHub({ updates }: { updates: UpdateInput[] }) {
  const featured = await getFeatured();

  const featuredItems: NewsItem[] = featured.map((a) => ({
    id: a.id,
    title: a.title,
    intro: a.intro || undefined,
    type: a.category || 'خبر رئيسي',
    dateLabel: formatArabicDate(a.published_at || a.created_at || undefined),
    // Truncated to YYYY-MM-DD so it compares like-for-like against the
    // updates, whose dates carry no time at all.
    sortDate: (a.published_at || a.created_at || '').slice(0, 10),
    sortTime: a.created_at || '',
    href: `/article/${a.slug || a.id}`,
    image: a.image || undefined,
    featured: true,
    urgent: false,
  }));

  const seen = new Set(featuredItems.map((i) => normTitle(i.title)));

  const updateItems: NewsItem[] = (updates || [])
    .filter((u) => !seen.has(normTitle(u.title)))
    .map((u) => ({
      id: u.id,
      title: u.title,
      type: u.type,
      dateLabel: u.date,
      sortDate: u.sortDate || u.date || '',
      sortTime: u.sortTime || '',
      href: u.href || `/updates/${u.id}`,
      image: u.image,
      featured: false,
      urgent: u.type === 'عاجل' || u.type === 'هام',
    }));

  // Sort the COMBINED list by date. This used to be a plain concatenation,
  // which pinned every featured article ahead of every update no matter how
  // old it was: the owner published a news item on 2026-08-04 and found it at
  // slide 9 of 19, behind seven featured articles from late June and July,
  // because the featured query caps at 8. Being featured is a matter of
  // presentation — the card still gets its ring from `featured` — not a reason
  // to outrank newer news.
  //
  // Ordered by day first, then by clock time within that day. The day has to
  // lead because it is the editorial date the owner controls — published_at
  // and updates.date are DATE columns and can be set ahead of or behind when
  // the row was actually written. But those columns carry no time at all, so
  // sorting on the day alone left same-day items in whatever order the union
  // produced: every featured article ahead of every update from the same day,
  // whichever was really published first. created_at holds the real timestamp
  // and breaks that tie.
  const orderKey = (x: NewsItem) =>
    `${x.sortDate || ''}T${(x.sortTime || '').slice(11, 19) || '00:00:00'}`;
  const items = [...featuredItems, ...updateItems]
    .sort((a, b) => orderKey(b).localeCompare(orderKey(a)));
  if (items.length === 0) return null;

  return <NewsAndUpdates items={items} />;
}
