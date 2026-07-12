import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/adminAuth';
import { PRIVATE_MODELS_BUCKET } from '@/lib/models/server';
import logger from '@/lib/logger';

export const runtime = 'nodejs';

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

function safeExt(fileName: string, mimeType: string): string {
  const fromName = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (fromName && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fromName)) return fromName;
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return 'jpg';
}

export async function POST(request: Request) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const form = await request.formData();
    const collectionId = String(form.get('collectionId') || '');
    const title = String(form.get('title') || '').trim().slice(0, 160) || null;
    const caption = String(form.get('caption') || '').trim().slice(0, 500) || null;
    const file = form.get('file');

    if (!collectionId) return NextResponse.json({ error: 'collection_required' }, { status: 400 });
    if (!(file instanceof File)) return NextResponse.json({ error: 'file_required' }, { status: 400 });
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'image_only' }, { status: 400 });
    if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: 'file_too_large' }, { status: 400 });

    const { data: collection } = await gate.svc
      .from('model_collections')
      .select('id')
      .eq('id', collectionId)
      .maybeSingle();
    if (!collection) return NextResponse.json({ error: 'collection_not_found' }, { status: 404 });

    const { count } = await gate.svc
      .from('model_assets')
      .select('id', { count: 'exact', head: true })
      .eq('collection_id', collectionId);

    const ext = safeExt(file.name, file.type);
    const path = `models/${collectionId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await gate.svc.storage
      .from(PRIVATE_MODELS_BUCKET)
      .upload(path, file, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { data: asset, error: insertError } = await gate.svc
      .from('model_assets')
      .insert({
        collection_id: collectionId,
        title,
        caption,
        storage_bucket: PRIVATE_MODELS_BUCKET,
        storage_path: path,
        mime_type: file.type,
        file_size: file.size,
        sort_order: count || 0,
        is_active: true,
      })
      .select('*')
      .single();
    if (insertError) throw insertError;

    return NextResponse.json({ asset });
  } catch (err) {
    logger.error('admin/models/upload failed:', err);
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
  }
}

