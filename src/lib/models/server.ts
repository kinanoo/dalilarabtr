import { createClient } from '@supabase/supabase-js';
import type { ModelAsset, ModelCollection, ModelLinkView, ModelShareLink } from '@/lib/models/types';
import { hashModelShareToken, normalizeModelToken } from '@/lib/models/tokens';
import logger from '@/lib/logger';

export const PRIVATE_MODELS_BUCKET = 'private-models';

export type ModelCollectionBundle = ModelCollection & {
  assets: ModelAsset[];
  links: ModelShareLink[];
};

export type PublicModelAsset = Pick<ModelAsset, 'id' | 'title' | 'caption' | 'sort_order'> & {
  signedUrl: string | null;
  isLocked: boolean;
  lockScope: 'collection' | 'asset' | null;
  pinHint: string | null;
};

export type PublicModelBundle = {
  collection: Pick<ModelCollection, 'id' | 'title' | 'description' | 'watermark_text'> & {
    requiresPin: boolean;
    pinHint: string | null;
  };
  link: Pick<ModelShareLink, 'id' | 'label' | 'expires_at' | 'view_count'>;
  assets: PublicModelAsset[];
};

export type PublicGalleryAsset = Pick<ModelAsset, 'id' | 'title' | 'caption' | 'sort_order'> & {
  collectionId: string;
  collectionTitle: string;
  collectionDescription: string | null;
  imageUrl: string | null;
  isLocked: boolean;
  pinHint: string | null;
  createdAt: string;
};

export type PublicGalleryCollection = Pick<ModelCollection, 'id' | 'title' | 'description' | 'watermark_text' | 'gallery_order'> & {
  isLocked: boolean;
  assets: PublicGalleryAsset[];
};

export type PublicModelFailure = 'not_found' | 'expired' | 'revoked' | 'inactive' | 'empty' | 'view_limit';

export function getModelsServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getAnonVisitHashInput(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.MODELS_ANALYTICS_SALT || process.env.NEXT_PUBLIC_SITE_URL || 'dalilarabtr-models';
  return `${salt}:${ip}`;
}

export async function hashVisitIp(ip: string | null): Promise<string | null> {
  const input = getAnonVisitHashInput(ip);
  if (!input) return null;
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function isModelLinkCurrentlyValid(link: ModelShareLink): PublicModelFailure | null {
  if (link.revoked_at) return 'revoked';
  if (new Date(link.expires_at).getTime() <= Date.now()) return 'expired';
  if (link.max_views !== null && link.view_count >= link.max_views) return 'view_limit';
  return null;
}

export async function getPublicModelContext(token: string): Promise<
  {
    ok: true;
    svc: NonNullable<ReturnType<typeof getModelsServiceClient>>;
    link: ModelShareLink;
    collection: ModelCollection;
    assets: ModelAsset[];
    signedUrlSeconds: number;
  } | { ok: false; reason: PublicModelFailure }
> {
  const svc = getModelsServiceClient();
  if (!svc) return { ok: false, reason: 'not_found' };

  const cleanToken = normalizeModelToken(token);
  if (cleanToken.length < 20) return { ok: false, reason: 'not_found' };

  const tokenHash = await hashModelShareToken(cleanToken);
  const { data: link } = await svc
    .from('model_share_links')
    .select('*')
    .eq('token_hash', tokenHash)
    .maybeSingle<ModelShareLink>();

  if (!link) return { ok: false, reason: 'not_found' };

  const invalid = isModelLinkCurrentlyValid(link);
  if (invalid) return { ok: false, reason: invalid };

  const { data: collection } = await svc
    .from('model_collections')
    .select('*')
    .eq('id', link.collection_id)
    .maybeSingle<ModelCollection>();

  if (!collection || !collection.is_active) return { ok: false, reason: 'inactive' };

  const { data: assets } = await svc
    .from('model_assets')
    .select('*')
    .eq('collection_id', collection.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .returns<ModelAsset[]>();

  if (!assets || assets.length === 0) return { ok: false, reason: 'empty' };

  const remainingSeconds = Math.max(
    1,
    Math.floor((new Date(link.expires_at).getTime() - Date.now()) / 1000),
  );
  const signedUrlSeconds = Math.min(3600, remainingSeconds);

  return { ok: true, svc, link, collection, assets, signedUrlSeconds };
}

export async function createModelAssetSignedUrl(
  svc: NonNullable<ReturnType<typeof getModelsServiceClient>>,
  asset: ModelAsset,
  signedUrlSeconds: number,
): Promise<string | null> {
  const { data } = await svc.storage
    .from(asset.storage_bucket || PRIVATE_MODELS_BUCKET)
    .createSignedUrl(asset.storage_path, signedUrlSeconds);
  return data?.signedUrl || null;
}

export async function getPublicModelBundle(token: string): Promise<
  { ok: true; bundle: PublicModelBundle } | { ok: false; reason: PublicModelFailure }
> {
  const context = await getPublicModelContext(token);
  if (!context.ok) return context;

  const { svc, link, collection, assets, signedUrlSeconds } = context;
  const collectionRequiresPin = Boolean(collection.access_pin_hash);
  const signedAssets: PublicModelAsset[] = [];
  for (const asset of assets) {
    const assetRequiresPin = Boolean(asset.access_pin_hash);
    const isLocked = collectionRequiresPin || assetRequiresPin;
    const signedUrl = isLocked ? null : await createModelAssetSignedUrl(svc, asset, signedUrlSeconds);
    if (!isLocked && !signedUrl) continue;
    signedAssets.push({
      id: asset.id,
      title: asset.title,
      caption: asset.caption,
      sort_order: asset.sort_order,
      signedUrl,
      isLocked,
      lockScope: collectionRequiresPin ? 'collection' : assetRequiresPin ? 'asset' : null,
      pinHint: asset.pin_hint || collection.pin_hint,
    });
  }

  if (signedAssets.length === 0) return { ok: false, reason: 'empty' };

  return {
    ok: true,
    bundle: {
      collection: {
        id: collection.id,
        title: collection.title,
        description: collection.description,
        watermark_text: collection.watermark_text,
        requiresPin: collectionRequiresPin,
        pinHint: collection.pin_hint,
      },
      link: {
        id: link.id,
        label: link.label,
        expires_at: link.expires_at,
        view_count: link.view_count,
      },
      assets: signedAssets,
    },
  };
}

export async function getPublicModelsGallery(): Promise<PublicGalleryCollection[]> {
  try {
    const svc = getModelsServiceClient();
    if (!svc) return [];

    const { data: collections, error: collectionsError } = await svc
      .from('model_collections')
      .select('*')
      .eq('is_active', true)
      .eq('show_in_gallery', true)
      .order('gallery_order', { ascending: true })
      .order('created_at', { ascending: false })
      .returns<ModelCollection[]>();
    if (collectionsError) throw collectionsError;
    if (!collections || collections.length === 0) return [];

    const collectionIds = collections.map((collection) => collection.id);
    const { data: assets, error: assetsError } = await svc
      .from('model_assets')
      .select('*')
      .in('collection_id', collectionIds)
      .eq('is_active', true)
      .eq('show_in_gallery', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .returns<ModelAsset[]>();
    if (assetsError) throw assetsError;

    const signedUrlSeconds = 3600;
    const collectionsById = new Map(collections.map((collection) => [collection.id, collection]));
    const signedAssets = await Promise.all((assets || []).map(async (asset) => {
      const collection = collectionsById.get(asset.collection_id);
      if (!collection) return null;
      const isLocked = Boolean(collection.access_pin_hash || asset.access_pin_hash);
      const imageUrl = isLocked ? null : await createModelAssetSignedUrl(svc, asset, signedUrlSeconds);
      return {
        id: asset.id,
        title: asset.title,
        caption: asset.caption,
        sort_order: asset.sort_order,
        collectionId: collection.id,
        collectionTitle: collection.title,
        collectionDescription: collection.description,
        imageUrl,
        isLocked,
        pinHint: asset.pin_hint || collection.pin_hint,
        createdAt: asset.created_at,
      } satisfies PublicGalleryAsset;
    }));

    const assetsByCollection = new Map<string, PublicGalleryAsset[]>();
    for (const asset of signedAssets) {
      if (!asset) continue;
      const current = assetsByCollection.get(asset.collectionId) || [];
      current.push(asset);
      assetsByCollection.set(asset.collectionId, current);
    }

    return collections
      .map((collection) => ({
        id: collection.id,
        title: collection.title,
        description: collection.description,
        watermark_text: collection.watermark_text,
        gallery_order: collection.gallery_order,
        isLocked: Boolean(collection.access_pin_hash),
        assets: assetsByCollection.get(collection.id) || [],
      }))
      .filter((collection) => collection.assets.length > 0);
  } catch (err) {
    logger.error('getPublicModelsGallery failed:', err);
    return [];
  }
}

export async function recordModelLinkView(args: {
  linkId: string;
  ipHash: string | null;
  userAgent: string | null;
  referrer: string | null;
}) {
  try {
    const svc = getModelsServiceClient();
    if (!svc) return;

    await svc.from('model_link_views').insert({
      link_id: args.linkId,
      ip_hash: args.ipHash,
      user_agent: args.userAgent?.slice(0, 500) || null,
      referrer: args.referrer?.slice(0, 500) || null,
    } satisfies Partial<ModelLinkView>);

    const { error } = await svc.rpc('increment_model_link_view_count', { p_link_id: args.linkId });
    if (error) {
      const { data } = await svc
        .from('model_share_links')
        .select('view_count')
        .eq('id', args.linkId)
        .maybeSingle<{ view_count: number }>();
      await svc
        .from('model_share_links')
        .update({
          view_count: (data?.view_count || 0) + 1,
          last_viewed_at: new Date().toISOString(),
        })
        .eq('id', args.linkId);
    }
  } catch {
    // Analytics must never block a valid private gallery link.
  }
}
