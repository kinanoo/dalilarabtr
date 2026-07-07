import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/adminAuth';
import logger from '@/lib/logger';

/**
 * DELETE /api/admin/feedback?id=<uuid>
 *
 * Admin-only endpoint to delete a feedback/vote row. Auth + service-role client
 * come from the shared requireAdmin() gate (was ~40 lines of duplicated
 * boilerplate here). Now also logs delete failures server-side.
 */
export const runtime = 'nodejs';

export async function DELETE(request: NextRequest) {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const { error } = await gate.svc.from('content_votes').delete().eq('id', id);
    if (error) {
        logger.error('admin/feedback delete failed:', { id, error: error.message });
        return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
}
