import { NextResponse } from 'next/server';

/**
 * GET /api/indexnow/verify
 * IndexNow key verification — returns the key as plain text
 * Configure your IndexNow key location as: https://dalilarabtr.com/api/indexnow/verify
 */
export async function GET() {
  const key = process.env.INDEXNOW_KEY || '';

  if (!key) {
    return new NextResponse('Not configured', { status: 404 });
  }

  return new NextResponse(key, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
