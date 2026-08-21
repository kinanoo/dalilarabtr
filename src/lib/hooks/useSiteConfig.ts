import useSWR from 'swr';

async function fetchSiteConfig() {
  const response = await fetch('/api/public-shell', { credentials: 'same-origin' });
  if (!response.ok) throw new Error('public shell request failed');
  return response.json();
}

export function useSiteConfig() {
  return useSWR('site-config', fetchSiteConfig, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000,
  });
}
