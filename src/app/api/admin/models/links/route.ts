import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/adminAuth';
import { buildModelShareUrl, createModelShareToken, hashModelShareToken } from '@/lib/models/tokens';
import type { ModelShareLink } from '@/lib/models/types';
import logger from '@/lib/logger';

export const runtime = 'nodejs';

function clampDurationMinutes(value: unknown): number {
  const raw = Number(value);
  if (!Number.isFinite(raw)) return 60;
  return Math.max(5, Math.min(Math.round(raw), 60 * 24 * 30));
}

function cleanLabel(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const label = value.trim();
  return label ? label.slice(0, 160) : null;
}

export async function POST(request: Request) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const body = await request.json().catch(() => ({}));
    const collectionId = typeof body?.collectionId === 'string' ? body.collectionId : '';
    if (!collectionId) return NextResponse.json({ error: 'collection_required' }, { status: 400 });

    const { data: collection } = await gate.svc
      .from('model_collections')
      .select('id')
      .eq('id', collectionId)
      .maybeSingle();
    if (!collection) return NextResponse.json({ error: 'collection_not_found' }, { status: 404 });

    const durationMinutes = clampDurationMinutes(body?.durationMinutes);
    const maxViews = Number.isFinite(Number(body?.maxViews)) && Number(body.maxViews) > 0
      ? Math.min(Math.round(Number(body.maxViews)), 100000)
      : null;
    const token = createModelShareToken();
    const tokenHash = await hashModelShareToken(token);
    const expiresAt = new Date(Date.now() + durationMinutes * 60_000).toISOString();

    const { data: link, error } = await gate.svc
      .from('model_share_links')
      .insert({
        collection_id: collectionId,
        token_hash: tokenHash,
        label: cleanLabel(body?.label),
        expires_at: expiresAt,
        max_views: maxViews,
        created_by: gate.userId,
      })
      .select('id, collection_id, label, expires_at, revoked_at, max_views, view_count, last_viewed_at, created_at')
      .single<ModelShareLink>();
    if (error) throw error;

    return NextResponse.json({
      token,
      url: buildModelShareUrl(token),
      link,
    });
  } catch (err) {
    logger.error('admin/models/links POST failed:', err);
    return NextResponse.json({ error: 'link_create_failed' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const body = await request.json().catch(() => ({}));
    const id = typeof body?.id === 'string' ? body.id : '';
    if (!id) return NextResponse.json({ error: 'id_required' }, { status: 400 });

    const { data, error } = await gate.svc
      .from('model_share_links')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, collection_id, label, expires_at, revoked_at, max_views, view_count, last_viewed_at, created_at')
      .single<ModelShareLink>();
    if (error) throw error;

    return NextResponse.json({ link: data });
  } catch (err) {
    logger.error('admin/models/links PATCH failed:', err);
    return NextResponse.json({ error: 'link_revoke_failed' }, { status: 500 });
  }
}

