'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { isPrivateModelSharePath } from '@/lib/models/routes';

/**
 * SiteBackdrop — an optional faint photo behind page content.
 *
 * Fully admin-controlled from /admin/appearance: the image list (up to 12),
 * opacity, veil strength, and distribution mode all live in site_settings.backdrop
 * (JSONB) and are read here at runtime — no redeploy needed to change them.
 *
 * Decorative only: aria-hidden, pointer-events:none, z-0 (below the z-10 content
 * wrapper, above the opaque body bg) so the existing design/layout/text never
 * change — the photo only shows through the page's light gaps at a whisper.
 * Hidden on /admin. No admin images means no backdrop at all.
 */

export interface BackdropConfig {
  enabled: boolean;
  images: string[];
  opacity: number; // 0–30 (percent)
  veil: number;    // 0–60 (percent)
  mode: 'per-page' | 'shuffle' | 'single';
}

const DEFAULT_CFG: BackdropConfig = {
  enabled: false,
  images: [],
  opacity: 20,
  veil: 22,
  mode: 'per-page',
};

function hashSeg(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function SiteBackdrop() {
  const pathname = usePathname() || '/';
  const [cfg, setCfg] = useState<BackdropConfig | null>(null);
  const [shuffleSeed] = useState(() => Math.random());

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!supabase) {
        if (alive) setCfg(DEFAULT_CFG);
        return;
      }
      const { data } = await supabase.from('site_settings').select('backdrop').eq('id', 1).maybeSingle();
      const raw = (data as { backdrop?: unknown } | null)?.backdrop;
      const merged: BackdropConfig = {
        ...DEFAULT_CFG,
        ...(raw && typeof raw === 'object' ? (raw as Partial<BackdropConfig>) : {}),
      };
      if (alive) setCfg(merged);
    })();
    return () => { alive = false; };
  }, []);

  if (pathname.startsWith('/admin') || isPrivateModelSharePath(pathname)) return null;

  const c = cfg || DEFAULT_CFG;
  if (!c.enabled) return null;

  const images = (Array.isArray(c.images) ? c.images.filter(Boolean) : []).slice(0, 12);
  if (!images.length) return null;
  const list = images;

  let idx = 0;
  if (c.mode === 'shuffle') idx = Math.floor(shuffleSeed * list.length);
  else if (c.mode === 'single') idx = 0;
  else idx = pathname === '/' ? 0 : hashSeg(pathname.split('/')[1] || 'home') % list.length;
  const img = list[idx] || list[0];

  const op = Math.max(0, Math.min(30, Number(c.opacity) || 0)) / 100;
  const veil = Math.max(0, Math.min(60, Number(c.veil) || 0)) / 100;
  const style = {
    '--sb-op': op.toFixed(3),
    '--sb-op-dark': Math.min(0.42, op * 1.3).toFixed(3),
    '--sb-veil': veil.toFixed(3),
  } as React.CSSProperties;

  return (
    <div className="site-backdrop" aria-hidden="true" style={style}>
      <div className="sb-img" style={{ backgroundImage: `url(${img})` }} />
      <div className="sb-tint" />
      <div className="sb-veil" />
    </div>
  );
}
