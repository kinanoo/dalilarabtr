import useSWR from 'swr';
import { supabase } from '@/lib/supabaseClient';

async function fetchSiteConfig() {
  if (!supabase) return { footerMenus: { section1: [], section2: [] }, tools: [] };

  const [menusRes, toolsRes] = await Promise.all([
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
  ]);

  const menus = menusRes.data || [];

  return {
    footerMenus: {
      section1: menus.filter((m: any) => m.location === 'footer_section_1'),
      section2: menus.filter((m: any) => m.location === 'footer_section_2'),
    },
    tools: toolsRes.data || [],
  };
}

export function useSiteConfig() {
  return useSWR('site-config', fetchSiteConfig, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000,
  });
}
