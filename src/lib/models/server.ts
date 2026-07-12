import { createClient } from '@supabase/supabase-js';
import type { ModelAsset, ModelCollection, ModelLinkView, ModelShareLink } from '@/lib/models/types';
import { hashModelShareToken, normalizeModelToken } from '@/lib/models/tokens';

export const PRIVATE_MODELS_BUCKET = 'private-models';

export type ModelCollectionBundle = ModelCollection & {
  assets: ModelAsset[];
  links: ModelShareLink[];
};

export type PublicModelAsset = Pick<ModelAsset, 'id' | 'title' | 'caption' | 'sort_order'> & {
  signedUrl: string;
};

export type PublicModelBundle = {
  collection: Pick<ModelCollection, 'id' | 'title' | 'description' | 'watermark_text'>;
  link: Pick<ModelShareLink, 'id' | 'label' | 'expires_at' | 'view_count'>;
  assets: PublicModelAsset[];
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

export async function getPublicModelBundle(token: string): Promise<
  { ok: true; bundle: PublicModelBundle } | { ok: false; reason: PublicModelFailure }
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

  const signedAssets: PublicModelAsset[] = [];
  for (const asset of assets) {
    const { data } = await svc.storage
      .from(asset.storage_bucket || PRIVATE_MODELS_BUCKET)
      .createSignedUrl(asset.storage_path, signedUrlSeconds);
    if (!data?.signedUrl) continue;
    signedAssets.push({
      id: asset.id,
      title: asset.title,
      caption: asset.caption,
      sort_order: asset.sort_order,
      signedUrl: data.signedUrl,
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
