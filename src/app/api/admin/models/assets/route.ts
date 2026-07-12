import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/adminAuth';
import logger from '@/lib/logger';

export const runtime = 'nodejs';

const ALLOWED = new Set(['title', 'caption', 'sort_order', 'is_active']);

export async function PATCH(request: Request) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const body = await request.json().catch(() => ({}));
    const id = typeof body?.id === 'string' ? body.id : '';
    const input = body?.data && typeof body.data === 'object' ? body.data as Record<string, unknown> : {};
    if (!id) return NextResponse.json({ error: 'id_required' }, { status: 400 });

    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (!ALLOWED.has(key)) continue;
      if (key === 'title' || key === 'caption') clean[key] = typeof value === 'string' ? value.trim().slice(0, 500) || null : null;
      else if (key === 'sort_order') clean[key] = Number.isFinite(Number(value)) ? Number(value) : 0;
      else if (key === 'is_active') clean[key] = value !== false;
    }

    const { data, error } = await gate.svc
      .from('model_assets')
      .update(clean)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ asset: data });
  } catch (err) {
    logger.error('admin/models/assets PATCH failed:', err);
    return NextResponse.json({ error: 'asset_update_failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id_required' }, { status: 400 });

    const { data: asset } = await gate.svc
      .from('model_assets')
      .select('storage_bucket, storage_path')
      .eq('id', id)
      .maybeSingle<{ storage_bucket: string; storage_path: string }>();

    if (asset?.storage_path) {
      await gate.svc.storage.from(asset.storage_bucket).remove([asset.storage_path]);
    }

    const { error } = await gate.svc.from('model_assets').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('admin/models/assets DELETE failed:', err);
    return NextResponse.json({ error: 'asset_delete_failed' }, { status: 500 });
  }
}

