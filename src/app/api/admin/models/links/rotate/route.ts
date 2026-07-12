import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/adminAuth';
import { buildModelShareUrl, createModelShareToken, hashModelShareToken } from '@/lib/models/tokens';
import type { ModelShareLink } from '@/lib/models/types';
import logger from '@/lib/logger';

export const runtime = 'nodejs';

const LINK_SELECT = 'id, collection_id, token, link_kind, label, expires_at, revoked_at, max_views, view_count, last_viewed_at, created_at';

function clampDurationMinutes(value: unknown): number {
  const raw = Number(value);
  if (!Number.isFinite(raw)) return 60 * 24;
  return Math.max(5, Math.min(Math.round(raw), 60 * 24 * 30));
}

export async function POST(request: Request) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const body = await request.json().catch(() => ({}));
    const durationMinutes = clampDurationMinutes(body?.durationMinutes);
    const collectionId = typeof body?.collectionId === 'string' ? body.collectionId : null;
    const rotateAll = body?.scope === 'all';

    let collectionIds: string[] = [];

    if (rotateAll) {
      const { data, error } = await gate.svc
        .from('model_collections')
        .select('id')
        .order('created_at', { ascending: false })
        .returns<Array<{ id: string }>>();
      if (error) throw error;
      collectionIds = (data || []).map((item) => item.id);
    } else if (collectionId) {
      const { data, error } = await gate.svc
        .from('model_collections')
        .select('id')
        .eq('id', collectionId)
        .maybeSingle<{ id: string }>();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: 'collection_not_found' }, { status: 404 });
      collectionIds = [data.id];
    }

    if (collectionIds.length === 0) {
      return NextResponse.json({ links: [] });
    }

    const revokedAt = new Date().toISOString();
    const { error: revokeError } = await gate.svc
      .from('model_share_links')
      .update({ revoked_at: revokedAt })
      .in('collection_id', collectionIds)
      .eq('link_kind', 'main')
      .is('revoked_at', null);
    if (revokeError) throw revokeError;

    const expiresAt = new Date(Date.now() + durationMinutes * 60_000).toISOString();
    const rows = await Promise.all(collectionIds.map(async (id) => {
      const token = createModelShareToken();
      return {
        collection_id: id,
        token,
        token_hash: await hashModelShareToken(token),
        link_kind: 'main' as const,
        label: 'الرابط الرئيسي',
        expires_at: expiresAt,
        max_views: null,
        created_by: gate.userId,
      };
    }));

    const { data: links, error: insertError } = await gate.svc
      .from('model_share_links')
      .insert(rows)
      .select(LINK_SELECT)
      .returns<ModelShareLink[]>();
    if (insertError) throw insertError;

    return NextResponse.json({
      links: (links || []).map((link) => ({
        ...link,
        url: link.token ? buildModelShareUrl(link.token) : null,
      })),
    });
  } catch (err) {
    logger.error('admin/models/links/rotate POST failed:', err);
    return NextResponse.json({ error: 'link_rotate_failed' }, { status: 500 });
  }
}
