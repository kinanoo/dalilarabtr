import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/api/adminAuth';
import { PRIVATE_MODELS_BUCKET } from '@/lib/models/server';
import { buildModelShareUrl, createModelShareToken, hashModelShareToken } from '@/lib/models/tokens';
import { hashModelPin, isUsableModelPin, normalizeModelPin } from '@/lib/models/pin';
import type { ModelAsset, ModelCollection, ModelLinkView, ModelShareLink } from '@/lib/models/types';
import logger from '@/lib/logger';

export const runtime = 'nodejs';

const LINK_SELECT = 'id, collection_id, token, link_kind, label, expires_at, revoked_at, max_views, view_count, last_viewed_at, created_at';

function cleanText(value: unknown, max = 500): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;
  return text.slice(0, max);
}

function cleanOneLine(value: unknown, max = 220): string | null {
  if (typeof value !== 'string') return null;
  const text = value.replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : null;
}

function clampDefaultLinkMinutes(value: unknown): number {
  const raw = Number(value);
  if (!Number.isFinite(raw)) return 60 * 24 * 30;
  return Math.max(5, Math.min(Math.round(raw), 60 * 24 * 30));
}

async function ensureMainModelLink(args: {
  svc: SupabaseClient;
  collectionId: string;
  userId: string;
  durationMinutes: number;
}) {
  const { data: existing, error: existingError } = await args.svc
    .from('model_share_links')
    .select(LINK_SELECT)
    .eq('collection_id', args.collectionId)
    .eq('link_kind', 'main')
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<ModelShareLink>();
  if (existingError) throw existingError;
  if (existing) return existing;

  const token = createModelShareToken();
  const tokenHash = await hashModelShareToken(token);
  const expiresAt = new Date(Date.now() + args.durationMinutes * 60_000).toISOString();
  const { data, error } = await args.svc
    .from('model_share_links')
    .insert({
      collection_id: args.collectionId,
      token,
      token_hash: tokenHash,
      link_kind: 'main',
      label: 'الرابط الرئيسي',
      expires_at: expiresAt,
      max_views: null,
      created_by: args.userId,
    })
    .select(LINK_SELECT)
    .single<ModelShareLink>();
  if (error) throw error;
  return data;
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
    const skipMainLink = body?.skip_main_link === true;

    const payload = {
      title,
      description: cleanOneLine(body?.description),
      watermark_text: typeof body?.watermark_text === 'string' ? body.watermark_text.trim().slice(0, 80) : '',
      pin_hint: cleanOneLine(body?.pin_hint, 120),
      default_link_minutes: clampDefaultLinkMinutes(body?.default_link_minutes),
      show_in_gallery: body?.show_in_gallery === true,
      gallery_order: Number.isFinite(Number(body?.gallery_order)) ? Number(body.gallery_order) : 0,
      is_active: body?.is_active !== false,
    };
    const collectionPin = normalizeModelPin(body?.collection_pin);
    const shouldClearPin = body?.clear_collection_pin === true;

    let data: ModelCollection | null = null;

    if (id) {
      const updatePayload: Record<string, unknown> = { ...payload };
      if (shouldClearPin) {
        updatePayload.access_pin_hash = null;
        updatePayload.pin_hint = null;
      } else if (collectionPin) {
        if (!isUsableModelPin(collectionPin)) {
          return NextResponse.json({ error: 'pin_too_short' }, { status: 400 });
        }
        updatePayload.access_pin_hash = await hashModelPin(collectionPin, id);
      }

      const res = await gate.svc
        .from('model_collections')
        .update(updatePayload)
        .eq('id', id)
        .select('*')
        .single<ModelCollection>();
      if (res.error) throw res.error;
      data = res.data;
    } else {
      const res = await gate.svc
        .from('model_collections')
        .insert({ ...payload, created_by: gate.userId })
        .select('*')
        .single<ModelCollection>();
      if (res.error) throw res.error;
      data = res.data;

      if (collectionPin) {
        if (!isUsableModelPin(collectionPin)) {
          return NextResponse.json({ error: 'pin_too_short' }, { status: 400 });
        }
        const pinRes = await gate.svc
          .from('model_collections')
          .update({ access_pin_hash: await hashModelPin(collectionPin, data.id) })
          .eq('id', data.id)
          .select('*')
          .single<ModelCollection>();
        if (pinRes.error) throw pinRes.error;
        data = pinRes.data;
      }
    }

    const mainLink = skipMainLink ? null : await ensureMainModelLink({
      svc: gate.svc,
      collectionId: data.id,
      userId: gate.userId,
      durationMinutes: data.default_link_minutes,
    });

    return NextResponse.json({
      collection: data,
      mainLink: mainLink ? {
        ...mainLink,
        url: mainLink.token ? buildModelShareUrl(mainLink.token) : null,
      } : null,
    });
  } catch (err) {
    logger.error('admin/models POST failed:', err);
    return NextResponse.json({ error: 'models_save_failed' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const body = await request.json().catch(() => ({}));
    if (body?.action !== 'set_all_active') {
      return NextResponse.json({ error: 'unsupported_action' }, { status: 400 });
    }

    const isActive = body?.is_active === true;
    const { data, error } = await gate.svc
      .from('model_collections')
      .update({ is_active: isActive })
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select('id')
      .returns<Array<{ id: string }>>();
    if (error) throw error;

    return NextResponse.json({ ok: true, count: data?.length || 0 });
  } catch (err) {
    logger.error('admin/models PATCH failed:', err);
    return NextResponse.json({ error: 'models_bulk_update_failed' }, { status: 500 });
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
