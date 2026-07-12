import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/adminAuth';
import { PRIVATE_MODELS_BUCKET } from '@/lib/models/server';
import { buildModelShareUrl } from '@/lib/models/tokens';
import type { ModelAsset, ModelCollection, ModelLinkView, ModelShareLink } from '@/lib/models/types';
import logger from '@/lib/logger';

export const runtime = 'nodejs';

function cleanText(value: unknown, max = 500): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;
  return text.slice(0, max);
}

export async function GET() {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const { data: collections, error } = await gate.svc
      .from('model_collections')
      .select('*')
      .order('created_at', { ascending: false })
      .returns<ModelCollection[]>();

    if (error) throw error;
    const collectionIds = (collections || []).map((item) => item.id);

    let assets: ModelAsset[] = [];
    let links: ModelShareLink[] = [];
    let views: ModelLinkView[] = [];

    if (collectionIds.length > 0) {
      const assetRes = await gate.svc
        .from('model_assets')
        .select('*')
        .in('collection_id', collectionIds)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
        .returns<ModelAsset[]>();
      if (assetRes.error) throw assetRes.error;
      assets = assetRes.data || [];

      const linkRes = await gate.svc
        .from('model_share_links')
        .select('id, collection_id, token, link_kind, label, expires_at, revoked_at, max_views, view_count, last_viewed_at, created_at')
        .in('collection_id', collectionIds)
        .order('created_at', { ascending: false })
        .returns<ModelShareLink[]>();
      if (linkRes.error) throw linkRes.error;
      links = linkRes.data || [];

      const linkIds = links.map((link) => link.id);
      if (linkIds.length > 0) {
        const viewRes = await gate.svc
          .from('model_link_views')
          .select('*')
          .in('link_id', linkIds)
          .order('viewed_at', { ascending: false })
          .limit(120)
          .returns<ModelLinkView[]>();
        if (viewRes.error) throw viewRes.error;
        views = viewRes.data || [];
      }
    }

    const assetsWithPreview = await Promise.all(assets.map(async (asset) => {
      const { data } = await gate.svc.storage
        .from(asset.storage_bucket || PRIVATE_MODELS_BUCKET)
        .createSignedUrl(asset.storage_path, 3600);
      return { ...asset, preview_url: data?.signedUrl || null };
    }));

    return NextResponse.json({
      collections: (collections || []).map((collection) => ({
        ...collection,
        assets: assetsWithPreview.filter((asset) => asset.collection_id === collection.id),
        links: links
          .filter((link) => link.collection_id === collection.id)
          .map((link) => ({
            ...link,
            url: link.token ? buildModelShareUrl(link.token) : null,
            views: views.filter((view) => view.link_id === link.id),
          })),
      })),
    });
  } catch (err) {
    logger.error('admin/models GET failed:', err);
    return NextResponse.json({ error: 'models_load_failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const body = await request.json().catch(() => ({}));
    const id = cleanText(body?.id, 80);
    const title = cleanText(body?.title, 160);
    if (!title) return NextResponse.json({ error: 'title_required' }, { status: 400 });

    const payload = {
      title,
      description: cleanText(body?.description, 1000),
      watermark_text: cleanText(body?.watermark_text, 80) || 'موديلس',
      is_active: body?.is_active !== false,
    };

    const query = id
      ? gate.svc.from('model_collections').update(payload).eq('id', id).select('*').single()
      : gate.svc.from('model_collections').insert({ ...payload, created_by: gate.userId }).select('*').single();

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ collection: data });
  } catch (err) {
    logger.error('admin/models POST failed:', err);
    return NextResponse.json({ error: 'models_save_failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id_required' }, { status: 400 });

    const { data: assets } = await gate.svc
      .from('model_assets')
      .select('storage_path')
      .eq('collection_id', id)
      .returns<Array<{ storage_path: string }>>();

    const paths = (assets || []).map((asset) => asset.storage_path).filter(Boolean);
    if (paths.length > 0) {
      await gate.svc.storage.from(PRIVATE_MODELS_BUCKET).remove(paths);
    }

    const { error } = await gate.svc.from('model_collections').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('admin/models DELETE failed:', err);
    return NextResponse.json({ error: 'models_delete_failed' }, { status: 500 });
  }
}
