import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, isRateLimited } from '@/lib/rate-limit';
import {
  createModelsGallerySession,
  MODELS_GALLERY_COOKIE,
  MODELS_GALLERY_SESSION_SECONDS,
} from '@/lib/models/gallery-auth';

export const runtime = 'nodejs';

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== request.nextUrl.host) {
        return json({ error: 'طلب غير صالح.' }, 403);
      }
    } catch {
      return json({ error: 'طلب غير صالح.' }, 403);
    }
  }

  const expectedPassword = process.env.MODELS_GALLERY_PASSWORD?.trim() || '';
  if (!expectedPassword || !process.env.MODELS_GALLERY_SESSION_SECRET?.trim()) {
    return json({ error: 'المعرض غير متاح حالياً.' }, 503);
  }

  const ip = getClientIp(request);
  if (isRateLimited(`models-gallery:${ip}`, 5, 15 * 60_000)) {
    return json({ error: 'محاولات كثيرة. حاول مجدداً بعد 15 دقيقة.' }, 429);
  }

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === 'string' ? body.password.trim() : '';
  if (!password || password.length > 64 || !safeEqual(password, expectedPassword)) {
    return json({ error: 'كلمة السر غير صحيحة.' }, 401);
  }

  const session = createModelsGallerySession();
  if (!session) return json({ error: 'المعرض غير متاح حالياً.' }, 503);

  const response = json({ ok: true }, 200);
  response.cookies.set({
    name: MODELS_GALLERY_COOKIE,
    value: session,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/models',
    maxAge: MODELS_GALLERY_SESSION_SECONDS,
  });
  return response;
}
