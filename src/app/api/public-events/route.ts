import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// NOTE: 'new_update' is intentionally EXCLUDED. The /updates feed already
// renders the `updates` table directly (as "manual" news cards), so emitting a
// parallel new_update auto-event made every update appear TWICE in the feed
// (once as the manual card, once as the auto "خبر" card). Updates are the only
// event type with a dedicated direct-render path, so they must not also come
// through public-events. The other types have no direct list → they belong here.
const PUBLIC_EVENT_TYPES = [
  'new_article', 'new_scenario', 'new_faq', 'new_code',
  'new_zone', 'new_service', 'new_tool', 'new_source',
];

// Map event_type → underlying table + visibility filter.
// Events whose entity fails this filter (e.g. service with status='pending',
// article with status='pending', inactive update) are dropped so the public
// "updates" feed never surfaces links that 404 on click.
type VisibilityRule = { table: string; column: string; value: string | boolean };
const VISIBILITY_RULES: Record<string, VisibilityRule> = {
  new_article:  { table: 'articles',             column: 'status',    value: 'approved' },
  new_service:  { table: 'service_providers',    column: 'status',    value: 'approved' },
  new_update:   { table: 'updates',              column: 'active',    value: true },
  new_scenario: { table: 'consultant_scenarios', column: 'is_active', value: true },
  // new_code, new_faq, new_zone, new_tool, new_source: no per-entity gate
  // (these tables don't carry a pending/inactive state for public-facing rows).
};

export async function GET() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ events: [] });
  }
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );

  // Fetch more than 50 raw events so we can still return ~50 after filtering.
  const { data: rawEvents, error } = await serviceClient
    .from('admin_activity_log')
    .select('id, event_type, title, detail, entity_id, created_at')
    .in('event_type', PUBLIC_EVENT_TYPES)
    .order('created_at', { ascending: false })
    .limit(150);

  if (error) {
    return NextResponse.json({ events: [] });
  }

  const events = rawEvents || [];

  // Group entity_ids by the rule that applies to their event_type so we can
  // batch-check visibility per table (single round-trip each).
  const idsByRuleKey: Record<string, string[]> = {};
  for (const ev of events) {
    const rule = VISIBILITY_RULES[ev.event_type];
    if (!rule || !ev.entity_id) continue;
    (idsByRuleKey[ev.event_type] ||= []).push(ev.entity_id);
  }

  // For each gated event_type, fetch the IDs that are actually visible.
  const visibleIdsByRuleKey: Record<string, Set<string>> = {};
  await Promise.all(
    Object.entries(idsByRuleKey).map(async ([eventType, ids]) => {
      const rule = VISIBILITY_RULES[eventType];
      if (!rule) return;
      const uniqueIds = Array.from(new Set(ids));
      const { data: rows } = await serviceClient
        .from(rule.table)
        .select('id')
        .in('id', uniqueIds)
        .eq(rule.column, rule.value);
      visibleIdsByRuleKey[eventType] = new Set((rows || []).map((r: { id: string }) => r.id));
    })
  );

  const filtered = events.filter((ev) => {
    const rule = VISIBILITY_RULES[ev.event_type];
    if (!rule) return true; // no gate — always show
    if (!ev.entity_id) return false; // gated event with no entity → not actionable
    return visibleIdsByRuleKey[ev.event_type]?.has(ev.entity_id) ?? false;
  });

  return NextResponse.json(
    { events: filtered.slice(0, 50) },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } }
  );
}
