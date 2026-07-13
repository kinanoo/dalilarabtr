import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/adminAuth';
import {
  createModelsGalleryPasswordDigest,
  MODELS_GALLERY_SETTINGS_TABLE,
} from '@/lib/models/gallery-password';
import logger from '@/lib/logger';

export const runtime = 'nodejs';

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function hasValidOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!hasValidOrigin(request)) return json({ error: 'طلب غير صالح.' }, 403);

    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const body = await request.json().catch(() => null);
    const password = typeof body?.password === 'string' ? body.password.trim() : '';
    if (password.length < 4 || password.length > 64) {
      return json({ error: 'كلمة السر يجب أن تكون بين 4 و64 حرفاً أو رقماً.' }, 400);
    }

    const passwordDigest = createModelsGalleryPasswordDigest(password);
    if (!passwordDigest) return json({ error: 'إعداد حماية المعرض غير مكتمل.' }, 503);

    const updatedAt = new Date().toISOString();
    const { error } = await gate.svc
      .from(MODELS_GALLERY_SETTINGS_TABLE)
      .upsert({
        id: 1,
        password_digest: passwordDigest,
        password_version: randomUUID(),
        updated_at: updatedAt,
        updated_by: gate.userId,
      }, { onConflict: 'id' });
    if (error) throw error;

    return json({ ok: true, updatedAt }, 200);
  } catch (error) {
    logger.error('admin/models/gallery-password PUT failed:', error);
    return json({ error: 'تعذر تغيير كلمة سر المعرض.' }, 500);
  }
}
