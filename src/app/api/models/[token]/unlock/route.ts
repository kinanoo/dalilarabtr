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

const PIN_ATTEMPT_LIMIT = 6;
const PIN_ATTEMPT_WINDOW_MS = 10 * 60 * 1000;

type PinAttemptState = {
  count: number;
  lockedUntil: number;
  updatedAt: number;
};

const pinAttempts = new Map<string, PinAttemptState>();

function cleanStalePinAttempts(now = Date.now()) {
  for (const [key, state] of pinAttempts) {
    if ((state.lockedUntil > 0 && state.lockedUntil <= now) || now - state.updatedAt > PIN_ATTEMPT_WINDOW_MS * 2) {
      pinAttempts.delete(key);
    }
  }
}

function getClientIp(request: Request) {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

function getPinAttemptKey(token: string, scopeId: string, request: Request) {
  return `${token}:${scopeId}:${getClientIp(request)}`;
}

function isPinAttemptLocked(key: string, now = Date.now()) {
  const state = pinAttempts.get(key);
  if (!state) return false;
  if (state.lockedUntil > now) return true;
  if (state.lockedUntil > 0) pinAttempts.delete(key);
  return false;
}

function registerFailedPinAttempt(key: string) {
  const now = Date.now();
  cleanStalePinAttempts(now);
  const current = pinAttempts.get(key);
  const isFresh = current && current.lockedUntil <= now && now - current.updatedAt <= PIN_ATTEMPT_WINDOW_MS;
  const count = isFresh ? current.count + 1 : 1;
  pinAttempts.set(key, {
    count,
    lockedUntil: count >= PIN_ATTEMPT_LIMIT ? now + PIN_ATTEMPT_WINDOW_MS : 0,
    updatedAt: now,
  });
}

function resetPinAttempts(key: string) {
  pinAttempts.delete(key);
}

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
      const attemptKey = getPinAttemptKey(token, scopeId, request);
      if (isPinAttemptLocked(attemptKey)) {
        return NextResponse.json({ error: 'too_many_pin_attempts' }, { status: 429 });
      }
      const valid = await verifyModelPin({ pin, scopeId, expectedHash });
      if (!valid) {
        registerFailedPinAttempt(attemptKey);
        return NextResponse.json({ error: 'invalid_pin' }, { status: 401 });
      }
      resetPinAttempts(attemptKey);

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

    const collectionAttemptKey = getPinAttemptKey(token, collection.id, request);
    if (isPinAttemptLocked(collectionAttemptKey)) {
      return NextResponse.json({ error: 'too_many_pin_attempts' }, { status: 429 });
    }

    const valid = await verifyModelPin({
      pin,
      scopeId: collection.id,
      expectedHash: collection.access_pin_hash,
    });
    if (!valid) {
      registerFailedPinAttempt(collectionAttemptKey);
      return NextResponse.json({ error: 'invalid_pin' }, { status: 401 });
    }
    resetPinAttempts(collectionAttemptKey);

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
