import { SITE_CONFIG } from '@/lib/config';
import { SERVICES_LIST } from '@/lib/constants';
import { supabase } from '@/lib/supabaseClient';
import { Briefcase } from 'lucide-react';
import type { Article } from '@/lib/types';

export type RemoteUpdateRow = {
  id: string;
  type: string;
  title: string;
  date: string; // YYYY-MM-DD
  content: string | null;
  active: boolean | null;
};

export type RuntimeUpdate = {
  id: string;
  type: string;
  title: string;
  date: string;
  content?: string | null;
};

export type RemoteArticleRow = {
  id: string; // slug
  title: string;
  category: string;
  lastUpdate: string;
  intro: string;
  details: string;
  documents: string[];
  steps: string[];
  tips: string[];
  fees: string;
  warning: string | null;
  source: string;
  active: boolean | null;
};

function asStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
  return [];
}

export function mapRemoteArticleToArticleData(row: RemoteArticleRow): Article {
  return {
    title: row.title,
    category: row.category,
    lastUpdate: row.lastUpdate,
    intro: row.intro,
    details: row.details,
    documents: asStringArray(row.documents),
    steps: asStringArray(row.steps),
    tips: asStringArray(row.tips),
    fees: row.fees,
    warning: row.warning ?? undefined,
    source: row.source,
  };
}

export type RemoteServiceRow = {
  id: string;
  title: string;
  desc: string;
  price: number | null;
  whatsapp: string | null;
  active: boolean | null;
};

export type RuntimeService = (typeof SERVICES_LIST)[number] & {
  price?: number | null;
  whatsapp?: string | null;
};

function normalizeWaPhone(phone: string) {
  // wa.me expects digits only (no +, spaces, etc.)
  return phone.replace(/\D/g, '');
}

function isDemoMode() {
  return process.env.NEXT_PUBLIC_ADMIN_DEMO === '1';
}

const DEMO_SERVICES_KEY = 'daleel_demo_services_v1';
const DEMO_SETTINGS_KEY = 'daleel_demo_settings_v1';
const DEMO_UPDATES_KEY = 'daleel_demo_updates_v1';
const DEMO_ARTICLES_KEY = 'daleel_demo_articles_v1';

export const DEMO_DATA_UPDATED_EVENT = 'daleel-demo-data-updated';

export function notifyDemoDataUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(DEMO_DATA_UPDATED_EVENT));
}

export function subscribeDemoDataUpdated(onUpdate: () => void) {
  if (typeof window === 'undefined') return () => { };

  const onCustom = () => onUpdate();
  const onStorage = (e: StorageEvent) => {
    if (e.key === DEMO_SERVICES_KEY || e.key === DEMO_SETTINGS_KEY) onUpdate();
  };

  window.addEventListener(DEMO_DATA_UPDATED_EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(DEMO_DATA_UPDATED_EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}

function seedDemoServices(): RemoteServiceRow[] {
  return SERVICES_LIST.map((s) => ({
    id: s.id,
    title: s.title,
    desc: s.desc,
    price: null,
    whatsapp: null,
    active: true,
  }));
}

function readDemoUpdates(): RemoteUpdateRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DEMO_UPDATES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RemoteUpdateRow[];
  } catch {
    return [];
  }
}

function readDemoArticles(): RemoteArticleRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DEMO_ARTICLES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RemoteArticleRow[];
  } catch {
    return [];
  }
}

export async function fetchRemoteArticles(): Promise<Array<{ id: string; article: Article }> | null> {
  if (!supabase) {
    if (!isDemoMode()) return null;
    const rows = readDemoArticles().filter((a) => a.active !== false);
    return rows.map((row) => ({ id: row.id, article: mapRemoteArticleToArticleData(row) }));
  }

  const { data, error } = await supabase
    .from('articles')
    .select('id,title,category,lastUpdate,intro,details,documents,steps,tips,fees,warning,source,active')
    .order('lastUpdate', { ascending: false });

  if (error) return null;
  const rows = (((data as RemoteArticleRow[]) ?? [])).filter((a) => a.active !== false);
  return rows.map((row) => ({ id: row.id, article: mapRemoteArticleToArticleData(row) }));
}

export function computeUpdatesVersion(updates: Array<{ id: string; date: string }> | null | undefined) {
  const versions = (updates || []).map((u) => {
    const date = (u.date || '0000-00-00').trim() || '0000-00-00';
    const id = String(u.id ?? '0');
    return `${date}-${id}`;
  });
  versions.sort();
  return versions.at(-1) || '0000-00-00-0';
}

export async function fetchRemoteUpdates(): Promise<RuntimeUpdate[] | null> {
  if (!supabase) return isDemoMode() ? readDemoUpdates().filter((u) => u.active !== false) : null;
  const { data, error } = await supabase
    .from('site_updates')
    .select('id,type,title,date,content,active')
    .order('date', { ascending: false });

  if (error) return null;
  const rows = ((data as RemoteUpdateRow[]) ?? []).filter((u) => u.active !== false);
  return rows.map((u) => ({ id: u.id, type: u.type, title: u.title, date: u.date, content: u.content }));
}

export async function fetchRemoteUpdatesVersion(): Promise<string | null> {
  const updates = await fetchRemoteUpdates();
  if (!updates) return null;
  return computeUpdatesVersion(updates.map((u) => ({ id: u.id, date: u.date })));
}

export async function fetchRemoteArticleById(id: string): Promise<RemoteArticleRow | null> {
  const safeId = (id || '').trim();
  if (!safeId) return null;

  if (!supabase) {
    if (!isDemoMode()) return null;
    const found = readDemoArticles().find((a) => a.id === safeId && a.active !== false);
    return found || null;
  }

  const { data, error } = await supabase
    .from('articles')
    .select('id,title,category,lastUpdate,intro,details,documents,steps,tips,fees,warning,source,active')
    .eq('id', safeId)
    .maybeSingle();

  if (error) return null;
  const row = (data as RemoteArticleRow | null) ?? null;
  if (!row || row.active === false) return null;
  return row;
}

export async function fetchRemoteArticleDataById(id: string): Promise<Article | null> {
  const row = await fetchRemoteArticleById(id);
  if (!row) return null;
  return mapRemoteArticleToArticleData(row);
}

function readDemoServices(): RemoteServiceRow[] {
  if (typeof window === 'undefined') return seedDemoServices();
  try {
    const raw = window.localStorage.getItem(DEMO_SERVICES_KEY);
    if (!raw) {
      const seeded = seedDemoServices();
      window.localStorage.setItem(DEMO_SERVICES_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('bad demo services');
    return parsed as RemoteServiceRow[];
  } catch {
    const seeded = seedDemoServices();
    try {
      window.localStorage.setItem(DEMO_SERVICES_KEY, JSON.stringify(seeded));
    } catch {
      // ignore
    }
    return seeded;
  }
}

function readDemoDefaultWhatsApp(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DEMO_SETTINGS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const value =
      parsed && typeof parsed === 'object' && 'default_whatsapp' in parsed
        ? (parsed as { default_whatsapp?: unknown }).default_whatsapp
        : undefined;
    if (!value || typeof value !== 'string') return null;
    return normalizeWaPhone(value) || null;
  } catch {
    return null;
  }
}

export async function fetchRemoteServices(): Promise<RemoteServiceRow[] | null> {
  if (!supabase) return isDemoMode() ? readDemoServices() : null;
  const { data, error } = await supabase
    .from('services')
    .select('id,title,desc,price,whatsapp,active')
    .order('title', { ascending: true });

  if (error) return null;
  return (data as RemoteServiceRow[]) ?? null;
}

export async function fetchDefaultWhatsApp(): Promise<string | null> {
  if (!supabase) return isDemoMode() ? readDemoDefaultWhatsApp() : null;
  const { data, error } = await supabase
    .from('site_settings')
    .select('default_whatsapp')
    .eq('id', 1)
    .maybeSingle();

  if (error) return null;
  const value = (data as { default_whatsapp?: unknown } | null)?.default_whatsapp;
  if (!value || typeof value !== 'string') return null;
  return normalizeWaPhone(value) || null;
}

export function mergeServices(remote: RemoteServiceRow[] | null): RuntimeService[] {
  if (!remote?.length) return SERVICES_LIST;

  const staticById = new Map(SERVICES_LIST.map((s) => [s.id, s] as const));
  const merged: RuntimeService[] = [];

  for (const row of remote) {
    if (row.active === false) continue;

    const base = staticById.get(row.id);
    if (base) {
      merged.push({
        ...base,
        title: row.title || base.title,
        desc: row.desc || base.desc,
        price: row.price ?? null,
        whatsapp: row.whatsapp ? normalizeWaPhone(row.whatsapp) : null,
      });
    } else {
      // New service: keep UI simple (default icon/color)
      merged.push({
        id: row.id,
        title: row.title,
        desc: row.desc,
        icon: Briefcase,
        color: 'bg-primary-700',
        price: row.price ?? null,
        whatsapp: row.whatsapp ? normalizeWaPhone(row.whatsapp) : null,
      } as RuntimeService);
    }
  }

  // If remote is partial, keep any remaining static services
  for (const s of SERVICES_LIST) {
    if (!merged.some((m) => m.id === s.id)) merged.push(s);
  }

  return merged;
}

export function getFallbackWhatsApp() {
  return normalizeWaPhone(SITE_CONFIG.whatsapp);
}
