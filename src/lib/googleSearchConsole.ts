import { createCipheriv, createDecipheriv, createHash, createSign, randomBytes } from 'node:crypto';

type SearchConsoleRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

const base64Url = (value: string | Buffer) => Buffer.from(value).toString('base64url');

async function serviceAccountToken(): Promise<string | null> {
  const email = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!email || !privateKey) return null;
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64Url(JSON.stringify({
    iss: email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claims}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${base64Url(signer.sign(privateKey))}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`google_token_${response.status}`);
  return (await response.json() as { access_token?: string }).access_token || null;
}

const integrationKey = () => createHash('sha256')
  .update(`${process.env.IP_HASH_SALT || ''}:${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`)
  .digest();

export function encryptIntegrationSecret(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', integrationKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(part => part.toString('base64url')).join('.');
}

export function decryptIntegrationSecret(value: string): string {
  const [iv, tag, encrypted] = value.split('.').map(part => Buffer.from(part, 'base64url'));
  if (!iv || !tag || !encrypted) throw new Error('invalid_integration_secret');
  const decipher = createDecipheriv('aes-256-gcm', integrationKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

async function refreshToken(storedToken?: string | null): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const token = storedToken || process.env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !token) return null;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: token,
      grant_type: 'refresh_token',
    }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`google_refresh_${response.status}`);
  return (await response.json() as { access_token?: string }).access_token || null;
}

export async function fetchSearchConsoleRows(startDate: string, endDate: string, storedRefreshToken?: string | null): Promise<SearchConsoleRow[] | null> {
  const accessToken = await refreshToken(storedRefreshToken) || await serviceAccountToken();
  if (!accessToken) return null;
  const site = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || 'sc-domain:dalilarabtr.com';
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ['query', 'page'],
      type: 'web',
      dataState: 'final',
      rowLimit: 25000,
    }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`search_console_${response.status}`);
  return (await response.json() as { rows?: SearchConsoleRow[] }).rows || [];
}

export function rankSearchOpportunities(rows: SearchConsoleRow[]) {
  return rows
    .map(row => {
      const query = row.keys?.[0] || '';
      const page = row.keys?.[1] || '';
      const impressions = Number(row.impressions || 0);
      const clicks = Number(row.clicks || 0);
      const ctr = Number(row.ctr || 0);
      const position = Number(row.position || 0);
      const reachable = position >= 3 && position <= 20;
      const score = reachable ? Math.round(impressions * Math.max(0.05, 1 - ctr) * (21 - position)) : 0;
      return { query, page, impressions, clicks, ctr, position, score };
    })
    .filter(row => row.query && row.page && row.impressions >= 20 && row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}
