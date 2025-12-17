export type ExternalLinkPolicy = {
  allowedHostSuffixes: string[];
  allowedHosts: string[];
};

const DEFAULT_POLICY: ExternalLinkPolicy = {
  // "Official" in the strict sense: government domains.
  allowedHostSuffixes: ['.gov.tr', '.gov.sy'],
  allowedHosts: [],
};

function safeParseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function isAllowedOfficialUrl(url: string, policy: ExternalLinkPolicy = DEFAULT_POLICY): boolean {
  const parsed = safeParseUrl(url);
  if (!parsed) return false;

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;

  const host = parsed.hostname.toLowerCase();
  if (policy.allowedHosts.some((h) => host === h.toLowerCase())) return true;
  return policy.allowedHostSuffixes.some((suffix) => host.endsWith(suffix.toLowerCase()));
}

export function extractUrlsFromText(value: string): string[] {
  const matches = value.match(/https?:\/\/[^\s)\]}>'\"]+/g);
  if (!matches) return [];
  return Array.from(new Set(matches));
}

export function getOfficialSourceUrls(source: unknown): string[] {
  if (!source) return [];
  if (typeof source !== 'string') return [];

  // Support legacy multi-link values separated by newlines/spaces.
  const urls = extractUrlsFromText(source);
  return urls.filter((u) => isAllowedOfficialUrl(u));
}
