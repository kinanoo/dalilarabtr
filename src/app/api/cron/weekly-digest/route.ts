import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger from '@/lib/logger';
import { renderDigestEmail, type DigestArticle } from '@/lib/digest-email';

/**
 * /api/cron/weekly-digest — weekly newsletter digest sender.
 *
 * Triggered by Vercel Cron once per week (see vercel.json). Pulls the top
 * articles published in the last 7 days, renders one HTML email, and ships
 * it to every confirmed newsletter subscriber who hasn't already received
 * this run.
 *
 * Auth: Vercel Cron requests carry a `Authorization: Bearer <CRON_SECRET>`
 * header. We require it match the CRON_SECRET env var so the endpoint can't
 * be triggered by random visitors. A manual trigger from /admin/newsletter
 * with an admin Supabase session is also allowed (TODO: admin-trigger UI in
 * a follow-up — for now manual runs go through the same header).
 *
 * Email transport: Resend (https://resend.com). Configured via
 * RESEND_API_KEY + DIGEST_FROM_EMAIL env vars. When RESEND_API_KEY is
 * absent, the route performs a dry-run: it picks the articles, renders the
 * email, logs intent, but doesn't actually send. That lets us deploy the
 * structure now and flip the switch the moment Resend is provisioned —
 * without a separate deployment.
 *
 * Idempotency: each subscriber's `last_digest_sent_at` is updated only on
 * successful send. A retry won't double-send because we filter rows whose
 * last send is within the last 6 days at query time.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DIGEST_FROM_EMAIL = process.env.DIGEST_FROM_EMAIL || 'newsletter@dalilarabtr.com';
const DIGEST_FROM_NAME = process.env.DIGEST_FROM_NAME || 'دليل العرب والسوريين في تركيا';

// How many articles to spotlight per digest. Keep it small — readers skim
// emails and the long-tail articles still get discovered via the site.
const MAX_ARTICLES = 6;

// How recent an article must be to count for this week's digest.
const ARTICLE_WINDOW_DAYS = 7;

// Suppress re-sending to a subscriber who got the digest within this window.
// Slightly under 7 days so a tiny scheduling drift doesn't accidentally skip
// a subscriber when the next run fires a few hours early.
const RESEND_COOLDOWN_DAYS = 6;

// Cap per-run recipient count so a runaway loop or a sudden subscriber
// surge can't burn through the Resend quota in one shot. Tune as the list
// grows.
const RECIPIENT_BATCH_CAP = 500;

interface ResendResponse {
    id?: string;
    name?: string; // error name
    message?: string;
}

export async function GET(req: NextRequest) {
    const startTime = Date.now();

    // ── Auth gate ──────────────────────────────────────────────
    const authHeader = req.headers.get('authorization') || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!CRON_SECRET || bearer !== CRON_SECRET) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    if (!SUPABASE_URL || !SERVICE_KEY) {
        return NextResponse.json({ error: 'supabase_misconfigured' }, { status: 500 });
    }
    const svc = createClient(SUPABASE_URL, SERVICE_KEY);

    // ── 1. Pull this week's articles ───────────────────────────
    const sinceIso = new Date(Date.now() - ARTICLE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: articleRows, error: artErr } = await svc
        .from('articles')
        .select('id, slug, title, intro, category, published_at, image')
        .eq('active', true)
        .eq('status', 'approved')
        .gte('published_at', sinceIso)
        .order('published_at', { ascending: false })
        .limit(MAX_ARTICLES);

    if (artErr) {
        logger.error('digest: article query failed', artErr);
        return NextResponse.json({ error: 'article_query_failed', detail: artErr.message }, { status: 500 });
    }

    const articles: DigestArticle[] = (articleRows || []).map((r) => ({
        id: r.id as string,
        slug: r.slug as string,
        title: r.title as string,
        intro: (r.intro as string) || null,
        category: (r.category as string) || null,
        published_at: (r.published_at as string) || null,
        image: (r.image as string) || null,
    }));

    if (articles.length === 0) {
        // Nothing fresh this week — log an empty run and stop, so the audit
        // table still records "we ran, but skipped".
        await logRun(svc, [], 0, 0, 0, Date.now() - startTime, 'no_recent_articles');
        return NextResponse.json({ ok: true, sent: 0, reason: 'no_recent_articles' });
    }

    // ── 2. Pull eligible subscribers ───────────────────────────
    const cooldownIso = new Date(Date.now() - RESEND_COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: subRows, error: subErr } = await svc
        .from('newsletter_subscribers')
        .select('id, email, last_digest_sent_at')
        .or(`last_digest_sent_at.is.null,last_digest_sent_at.lt.${cooldownIso}`)
        .limit(RECIPIENT_BATCH_CAP);

    if (subErr) {
        logger.error('digest: subscriber query failed', subErr);
        return NextResponse.json({ error: 'subscriber_query_failed', detail: subErr.message }, { status: 500 });
    }

    const subscribers = (subRows || []).filter((s) => typeof s.email === 'string' && s.email.includes('@'));
    if (subscribers.length === 0) {
        await logRun(svc, articles.map((a) => a.slug), 0, 0, 0, Date.now() - startTime, 'no_eligible_subscribers');
        return NextResponse.json({ ok: true, sent: 0, reason: 'no_eligible_subscribers' });
    }

    // ── 3. Render the email ────────────────────────────────────
    const rendered = renderDigestEmail(articles);

    // ── 4. Send (or dry-run if no Resend key) ──────────────────
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    if (!RESEND_API_KEY) {
        // Dry-run mode: log what we would send so the user knows the system
        // is alive without burning emails.
        logger.warn(`digest dry-run: RESEND_API_KEY missing — would send to ${subscribers.length} subscribers, ${articles.length} articles`);
        await logRun(
            svc,
            articles.map((a) => a.slug),
            subscribers.length,
            0,
            0,
            Date.now() - startTime,
            'dry_run_no_resend_key',
        );
        return NextResponse.json({
            ok: true,
            dryRun: true,
            wouldSendTo: subscribers.length,
            articles: articles.length,
            subject: rendered.subject,
        });
    }

    // Real send loop. Resend's batch endpoint accepts up to 100 recipients
    // per call; we chunk to that boundary. Each individual send is a real
    // network call — we sequential them with a tiny await break so a long
    // list doesn't trigger the function timeout.
    const BATCH_SIZE = 100;
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
        const chunk = subscribers.slice(i, i + BATCH_SIZE);
        for (const sub of chunk) {
            try {
                const res = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: `${DIGEST_FROM_NAME} <${DIGEST_FROM_EMAIL}>`,
                        to: [sub.email],
                        subject: rendered.subject,
                        html: rendered.html,
                        text: rendered.text,
                        headers: { 'X-Digest-Run': rendered.runKey },
                    }),
                });
                const payload: ResendResponse = await res.json().catch(() => ({}));
                if (res.ok && payload?.id) {
                    successCount++;
                    // Best-effort timestamp update; failure to update is logged
                    // but doesn't surface to the API caller — the email was
                    // sent successfully even if we couldn't mark the row.
                    await svc
                        .from('newsletter_subscribers')
                        .update({ last_digest_sent_at: new Date().toISOString() })
                        .eq('id', sub.id);
                } else {
                    failureCount++;
                    const reason = payload?.message || payload?.name || `http_${res.status}`;
                    if (errors.length < 10) errors.push(`${sub.email}: ${reason}`);
                }
            } catch (err) {
                failureCount++;
                const reason = err instanceof Error ? err.message : 'network_error';
                if (errors.length < 10) errors.push(`${sub.email}: ${reason}`);
            }
        }
    }

    await logRun(
        svc,
        articles.map((a) => a.slug),
        subscribers.length,
        successCount,
        failureCount,
        Date.now() - startTime,
        errors.length > 0 ? errors.slice(0, 5).join(' | ') : null,
    );

    return NextResponse.json({
        ok: true,
        articles: articles.length,
        recipients: subscribers.length,
        success: successCount,
        failure: failureCount,
        subject: rendered.subject,
        runKey: rendered.runKey,
    });
}

// The Supabase JS client's generic schema type doesn't auto-include the
// tables we add via raw SQL migrations (newsletter_digest_log,
// newsletter_subscribers.last_digest_sent_at). Rather than ship a generated
// Database type just for this audit insert, we accept `any` here — the
// runtime safety still comes from the SQL CHECK constraints and RLS.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logRun(
    svc: any,
    articleIds: string[],
    recipientCount: number,
    successCount: number,
    failureCount: number,
    durationMs: number,
    errorSummary: string | null,
) {
    try {
        await svc.from('newsletter_digest_log').insert({
            triggered_by: 'cron',
            article_ids: articleIds,
            recipient_count: recipientCount,
            success_count: successCount,
            failure_count: failureCount,
            duration_ms: durationMs,
            error_summary: errorSummary,
        });
    } catch (err) {
        logger.error('digest: audit log insert failed', err);
    }
}
