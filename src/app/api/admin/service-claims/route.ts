import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/api/adminAuth';
import logger from '@/lib/logger';

export const runtime = 'nodejs';

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.res;
  const { data, error } = await gate.svc
    .from('service_provider_claims')
    .select('id,provider_id,claimant_name,claimant_user_id,whatsapp,note,status,created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: 'read_failed' }, { status: 500 });

  const providerIds = [...new Set((data || []).map(row => row.provider_id))];
  const { data: providers } = providerIds.length
    ? await gate.svc.from('service_providers').select('id,name,slug').in('id', providerIds)
    : { data: [] as Array<{ id: string; name: string; slug: string | null }> };
  const names = new Map((providers || []).map(row => [String(row.id), row]));
  return NextResponse.json({ claims: (data || []).map(row => ({ ...row, provider: names.get(row.provider_id) || null })) });
}

export async function PATCH(request: Request) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;
    const body = await request.json().catch(() => ({}));
    const id = typeof body.id === 'string' ? body.id : '';
    const status = body.status === 'approved' ? 'approved' : body.status === 'rejected' ? 'rejected' : '';
    if (!id || !status) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

    const { data: claim, error: readError } = await gate.svc
      .from('service_provider_claims')
      .select('provider_id,claimant_user_id')
      .eq('id', id)
      .eq('status', 'pending')
      .single();
    if (readError || !claim) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    if (status === 'approved' && !claim.claimant_user_id) {
      return NextResponse.json({ error: 'claim_has_no_account' }, { status: 409 });
    }

    if (status === 'approved') {
      const { error: ownershipError } = await gate.svc.from('service_providers').update({
        verification_level: 'claimed',
        user_id: claim.claimant_user_id,
      }).eq('id', claim.provider_id);
      if (ownershipError) throw ownershipError;
    }

    const { error } = await gate.svc.from('service_provider_claims').update({
      status,
      reviewed_by: gate.userId,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw error;

    if (status === 'approved') {
      revalidatePath(`/services`);
      revalidatePath(`/dashboard`);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error('admin/service-claims failed:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
