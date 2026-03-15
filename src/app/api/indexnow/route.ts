import { NextRequest, NextResponse } from 'next/server';

/**
 * IndexNow API Route
 * يُبلّغ محركات البحث (Bing, Yandex, Google عبر IndexNow) فوراً عند نشر محتوى جديد
 *
 * POST /api/indexnow
 * Body: { urls: string[] } أو { url: string }
 */

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarabtr.com').replace(/\/$/, '');

// IndexNow endpoints — submit to one, all participating engines get notified
const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow',
];

export async function POST(request: NextRequest) {
  // Basic admin auth check
  const authHeader = request.headers.get('authorization');
  const adminKey = process.env.ADMIN_API_KEY;

  if (adminKey && authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!INDEXNOW_KEY) {
    return NextResponse.json(
      { error: 'INDEXNOW_KEY environment variable not set' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const urls: string[] = body.urls || (body.url ? [body.url] : []);

    if (urls.length === 0) {
      return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });
    }

    // Ensure all URLs are absolute
    const absoluteUrls = urls.map(u =>
      u.startsWith('http') ? u : `${SITE_URL}${u.startsWith('/') ? u : `/${u}`}`
    );

    // Submit to IndexNow (one endpoint is enough — they share the data)
    const payload = {
      host: new URL(SITE_URL).hostname,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/api/indexnow/verify`,
      urlList: absoluteUrls,
    };

    const results = await Promise.allSettled(
      INDEXNOW_ENDPOINTS.map(endpoint =>
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(payload),
        }).then(async (res) => ({
          endpoint,
          status: res.status,
          ok: res.ok,
        }))
      )
    );

    const submitted = results
      .filter((r): r is PromiseFulfilledResult<{ endpoint: string; status: number; ok: boolean }> =>
        r.status === 'fulfilled'
      )
      .map(r => r.value);

    return NextResponse.json({
      success: true,
      urlsSubmitted: absoluteUrls.length,
      results: submitted,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

/**
 * GET /api/indexnow — health check + instructions
 */
export async function GET() {
  return NextResponse.json({
    service: 'IndexNow',
    configured: !!INDEXNOW_KEY,
    usage: 'POST /api/indexnow with { "urls": ["/article/my-article"] }',
  });
}
