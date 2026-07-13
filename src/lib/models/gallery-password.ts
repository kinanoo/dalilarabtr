import { createHmac, timingSafeEqual } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getModelsServiceClient } from '@/lib/models/server';
import logger from '@/lib/logger';

export const MODELS_GALLERY_SETTINGS_TABLE = 'models_gallery_settings';

type ModelsGallerySettingsRow = {
  password_digest: string;
  password_version: string;
  updated_at: string;
};

export type ModelsGalleryPasswordConfig = {
  passwordDigest: string;
  passwordVersion: string;
  source: 'database' | 'environment';
  updatedAt: string | null;
};

function gallerySecret() {
  return process.env.MODELS_GALLERY_SESSION_SECRET?.trim() || '';
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createModelsGalleryPasswordDigest(password: string): string | null {
  const secret = gallerySecret();
  if (!secret) return null;
  return createHmac('sha256', secret)
    .update(`models-gallery-password:${password.trim()}`)
    .digest('hex');
}

function legacyPasswordConfig(): ModelsGalleryPasswordConfig | null {
  const password = process.env.MODELS_GALLERY_PASSWORD?.trim() || '';
  const passwordDigest = password ? createModelsGalleryPasswordDigest(password) : null;
  if (!passwordDigest) return null;

  return {
    passwordDigest,
    passwordVersion: `legacy_${passwordDigest.slice(0, 24)}`,
    source: 'environment',
    updatedAt: null,
  };
}

function isMissingSettingsTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === '42P01'
    || error.code === 'PGRST205'
    || Boolean(error.message?.includes(`Could not find the table 'public.${MODELS_GALLERY_SETTINGS_TABLE}'`));
}

export async function getModelsGalleryPasswordConfig(
  serviceClient?: SupabaseClient | null,
): Promise<ModelsGalleryPasswordConfig | null> {
  const svc = serviceClient === undefined ? getModelsServiceClient() : serviceClient;
  if (!svc) return legacyPasswordConfig();

  const { data, error } = await svc
    .from(MODELS_GALLERY_SETTINGS_TABLE)
    .select('password_digest, password_version, updated_at')
    .eq('id', 1)
    .maybeSingle<ModelsGallerySettingsRow>();

  if (error) {
    if (isMissingSettingsTable(error)) return legacyPasswordConfig();
    logger.error('models gallery password settings read failed:', error);
    return null;
  }

  if (!data) return legacyPasswordConfig();
  if (!/^[a-f0-9]{64}$/.test(data.password_digest) || !data.password_version) return null;

  return {
    passwordDigest: data.password_digest,
    passwordVersion: data.password_version,
    source: 'database',
    updatedAt: data.updated_at,
  };
}

export async function verifyModelsGalleryPassword(password: string) {
  const config = await getModelsGalleryPasswordConfig();
  const candidateDigest = createModelsGalleryPasswordDigest(password);
  if (!config || !candidateDigest || !safeEqual(candidateDigest, config.passwordDigest)) return null;
  return config;
}
