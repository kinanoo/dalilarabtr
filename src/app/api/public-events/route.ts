import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const PUBLIC_EVENT_TYPES = [
  'new_article', 'new_scenario', 'new_faq', 'new_code',
  'new_zone', 'new_update', 'new_service', 'new_tool', 'new_source',
];

export async function GET() {
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await serviceClient
    .from('admin_activity_log')
    .select('id, event_type, title, detail, entity_id, created_at')
    .in('event_type', PUBLIC_EVENT_TYPES)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ events: [] });
  }

  return NextResponse.json(
    { events: data || [] },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } }
  );
}
