import SourcesClient from './SourcesClient';
import { supabase, withTimeout } from '@/lib/supabaseClient';
import { OFFICIAL_SOURCES } from '@/lib/constants';
import type { AdminSource } from '@/lib/types';
import logger from '@/lib/logger';

/**
 * /sources — official Turkish government links.
 *
 * The source list is fetched here on the server (static OFFICIAL_SOURCES +
 * the `official_sources` table) and handed to SourcesClient as initial props,
 * so crawlers and first paint see the full grid instead of a spinner.
 * SourcesClient keeps the admin refresh hook for live updates.
 */

export const revalidate = 600;

async function getInitialSources(): Promise<AdminSource[]> {
  const statics: AdminSource[] = OFFICIAL_SOURCES.map((s, i) => ({
    id: `source-${i}`,
    name: s.name,
    url: s.url,
    desc: s.desc,
    active: true,
    is_official: true,
  }));

  if (!supabase) return statics;

  try {
    const res = await withTimeout(
      supabase.from('official_sources').select('*')
    );
    if (!res || res.error) {
      if (res?.error) logger.error('sources initial fetch:', res.error);
      return statics;
    }
    const remote: AdminSource[] = (res.data || [])
      .filter((d: any) => d.active !== false)
      .map((d: any) => ({
        id: d.id,
        name: d.name,
        url: d.url,
        desc: d.description,
        active: true,
        is_official: d.is_official,
      }));
    return [...statics, ...remote];
  } catch (err) {
    logger.error('sources initial fetch unhandled:', err);
    return statics;
  }
}

export default async function SourcesPage() {
  const initialSources = await getInitialSources();
  return <SourcesClient initialSources={initialSources} />;
}
