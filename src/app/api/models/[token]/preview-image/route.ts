import { NextResponse } from 'next/server';
import { SITE_CONFIG } from '@/lib/config';
import { createModelAssetSignedUrl, getPublicModelContext } from '@/lib/models/server';
import logger from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ token: string }>;
};

function getRequestedAssetId(request: Request): string | null {
  const raw = new URL(request.url).searchParams.get('asset');
  if (!raw) return null;
  const clean = raw.trim().replace(/[^A-Za-z0-9-]/g, '');
  return clean || null;
}

function fallbackImage() {
  return NextResponse.redirect(`${SITE_CONFIG.siteUrl}/og-banner.jpg`, { status: 302 });
}

export async function GET(request: Request, { params }: Props) {
  try {
    const { token } = await params;
    const requestedAssetId = getRequestedAssetId(request);
    const context = await getPublicModelContext(token);
    if (!context.ok) return fallbackImage();

    const { collection, assets, svc, signedUrlSeconds } = context;
    if (collection.access_pin_hash) return fallbackImage();

    const asset = requestedAssetId
      ? assets.find((item) => item.id === requestedAssetId && !item.access_pin_hash)
      : assets.find((item) => !item.access_pin_hash);
    if (!asset) return fallbackImage();

    const signedUrl = await createModelAssetSignedUrl(svc, asset, signedUrlSeconds);
    if (!signedUrl) return fallbackImage();

    const image = await fetch(signedUrl, { cache: 'no-store' });
    if (!image.ok || !image.body) return fallbackImage();

    const headers = new Headers();
    headers.set('Content-Type', asset.mime_type || image.headers.get('content-type') || 'image/webp');
    headers.set('Cache-Control', 'no-store, max-age=0');
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('X-Robots-Tag', 'noindex, nofollow');

    const length = image.headers.get('content-length');
    if (length) headers.set('Content-Length', length);

    return new Response(image.body, { status: 200, headers });
  } catch (err) {
    logger.error('models/[token]/preview-image GET failed:', err);
    return fallbackImage();
  }
}
