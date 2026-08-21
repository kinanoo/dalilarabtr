import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { computeUpdatesVersion } from '@/lib/remoteData';

export const revalidate = 300;

const EMPTY_SHELL = {
  footerMenus: { section1: [], section2: [] },
  tools: [],
  updatesVersion: null,
};

/**
 * Lightweight data used by the site-wide navigation and footer.
 *
 * Keeping these reads on the server prevents the full Supabase browser SDK
 * from being downloaded by every anonymous visitor just to render menus and
 * the "new updates" dot. The response is public and safe to cache at the edge.
 */
export async function GET() {
  if (!supabase) return NextResponse.json(EMPTY_SHELL);

  const [menusRes, toolsRes, updatesRes] = await Promise.all([
    supabase
      .from('site_menus')
      .select('id, label, href, icon, location, sort_order')
      .in('location', ['footer_section_1', 'footer_section_2'])
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('tools_registry')
      .select('key, name, route')
      .eq('is_active', true),
    supabase
      .from('updates')
      .select('id,date,active')
      .order('date', { ascending: false }),
  ]);

  const menus = menusRes.data || [];
  const activeUpdates = (updatesRes.data || []).filter((row) => row.active !== false);

  return NextResponse.json(
    {
      footerMenus: {
        section1: menus.filter((menu) => menu.location === 'footer_section_1'),
        section2: menus.filter((menu) => menu.location === 'footer_section_2'),
      },
      tools: toolsRes.data || [],
      updatesVersion: computeUpdatesVersion(
        activeUpdates.map((row) => ({ id: String(row.id), date: row.date || '' })),
      ),
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
      },
    },
  );
}
