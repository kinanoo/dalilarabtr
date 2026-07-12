import { NextResponse } from 'next/server';
import {
  createModelAssetSignedUrl,
  getPublicModelContext,
  type PublicModelAsset,
} from '@/lib/models/server';
import { verifyModelPin } from '@/lib/models/pin';
import logger from '@/lib/logger';

export const runtime = 'nodejs';

type Props = {
  params: Promise<{ token: string }>;
};

export async function POST(request: Request, { params }: Props) {
  try {
    const { token } = await params;
    const body = await request.json().catch(() => ({}));
    const assetId = typeof body?.assetId === 'string' ? body.assetId : null;
    const pin = body?.pin;

    const context = await getPublicModelContext(token);
    if (!context.ok) return NextResponse.json({ error: context.reason }, { status: 404 });

    const { svc, collection, assets, signedUrlSeconds } = context;

    if (assetId) {
      const asset = assets.find((item) => item.id === assetId);
      if (!asset) return NextResponse.json({ error: 'asset_not_found' }, { status: 404 });

      const expectedHash = asset.access_pin_hash || collection.access_pin_hash;
      const scopeId = asset.access_pin_hash ? asset.id : collection.id;
      const valid = await verifyModelPin({ pin, scopeId, expectedHash });
      if (!valid) return NextResponse.json({ error: 'invalid_pin' }, { status: 401 });

      const signedUrl = await createModelAssetSignedUrl(svc, asset, signedUrlSeconds);
      if (!signedUrl) return NextResponse.json({ error: 'asset_unavailable' }, { status: 404 });

      return NextResponse.json({
        asset: {
          id: asset.id,
          signedUrl,
          isLocked: false,
          lockScope: null,
        },
      });
    }

    const valid = await verifyModelPin({
      pin,
      scopeId: collection.id,
      expectedHash: collection.access_pin_hash,
    });
    if (!valid) return NextResponse.json({ error: 'invalid_pin' }, { status: 401 });

    const unlockedAssets: PublicModelAsset[] = [];
    for (const asset of assets) {
      const assetRequiresPin = Boolean(asset.access_pin_hash);
      const signedUrl = assetRequiresPin
        ? null
        : await createModelAssetSignedUrl(svc, asset, signedUrlSeconds);
      unlockedAssets.push({
        id: asset.id,
        title: asset.title,
        caption: asset.caption,
        sort_order: asset.sort_order,
        signedUrl,
        isLocked: assetRequiresPin,
        lockScope: assetRequiresPin ? 'asset' : null,
        pinHint: asset.pin_hint || null,
      });
    }

    return NextResponse.json({ assets: unlockedAssets });
  } catch (err) {
    logger.error('models/[token]/unlock POST failed:', err);
    return NextResponse.json({ error: 'unlock_failed' }, { status: 500 });
  }
}
