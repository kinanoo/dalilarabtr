import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/adminAuth';
import { runNotifyPipeline } from '@/lib/notify/pipeline';
import logger from '@/lib/logger';

/**
 * Instant content notification — fired by the editor the moment an article or
 * update is published, so subscribers (bell + push + Telegram channel) hear
 * about it at once instead of waiting up to 30 min for the cron.
 *
 * It runs the SAME idempotent pipeline as /api/cron/notify: it scans the last
 * ~90 min of published content, de-dupes against what was already sent, and
 * fans out. So calling it right after an upsert picks up exactly the new item;
 * the later cron tick finds it already notified and no-ops. No double-post.
 *
 * Admin-gated (cookie session → role='admin'); takes no body — the pipeline
 * derives its content and canonical links straight from the DB, which is what
 * keeps the dedup key consistent across the instant and cron paths.
 *
 * Runtime: Node.js — required by requireAdmin + web-push.
 */
export const runtime = 'nodejs';

export async function POST() {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    try {
        const result = await runNotifyPipeline(gate.svc);
        return NextResponse.json(result);
    } catch (err) {
        logger.error('notify-now failed:', err);
        return NextResponse.json({ error: 'notify_failed' }, { status: 500 });
    }
}
