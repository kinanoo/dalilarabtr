import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/adminAuth';
import { decryptIntegrationSecret, fetchSearchConsoleRows, rankSearchOpportunities } from '@/lib/googleSearchConsole';
import logger from '@/lib/logger';

export const runtime = 'nodejs';

const iso = (date: Date) => date.toISOString().slice(0, 10);

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.res;
  try {
    // Search Console finalized data normally trails real time. Ending three
    // days ago keeps the weekly comparison stable instead of mixing partial days.
    const end = new Date();
    end.setUTCDate(end.getUTCDate() - 3);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 27);
    const { data: integration, error: integrationError } = await gate.svc
      .from('site_integrations')
      .select('encrypted_value')
      .eq('name', 'google_search_console_refresh_token')
      .maybeSingle();
    if (integrationError) throw integrationError;
    const storedToken = integration?.encrypted_value
      ? decryptIntegrationSecret(integration.encrypted_value)
      : null;
    const rows = await fetchSearchConsoleRows(iso(start), iso(end), storedToken);
    if (rows === null) {
      return NextResponse.json({
        configured: false,
        required: ['GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN أو بيانات حساب خدمة', 'صلاحية قراءة للموقع في Search Console'],
      });
    }
    const totals = rows.reduce<{ clicks: number; impressions: number }>((out, row) => ({
      clicks: out.clicks + Number(row.clicks || 0),
      impressions: out.impressions + Number(row.impressions || 0),
    }), { clicks: 0, impressions: 0 });
    return NextResponse.json({
      configured: true,
      period: { start: iso(start), end: iso(end) },
      totals,
      opportunities: rankSearchOpportunities(rows),
    });
  } catch (error) {
    logger.error('admin/search-console failed:', error);
    return NextResponse.json({ error: 'search_console_failed' }, { status: 502 });
  }
}
