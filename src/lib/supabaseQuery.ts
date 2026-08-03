import logger from '@/lib/logger';

type SupabaseErrorLike = {
  code?: string;
  details?: string;
  message?: string;
  name?: string;
  status?: number;
  statusCode?: number;
};

type SupabaseResultLike = {
  error?: unknown | null;
};

const TRANSIENT_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524]);

function errorLike(error: unknown): SupabaseErrorLike {
  if (!error || typeof error !== 'object') return {};
  return error as SupabaseErrorLike;
}

function errorText(error: unknown): string {
  const err = errorLike(error);
  return [err.name, err.code, err.message, err.details]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function errorStatus(error: unknown): number | null {
  const err = errorLike(error);
  const status = err.status ?? err.statusCode;
  return typeof status === 'number' ? status : null;
}

export function isSupabaseNoRowsError(error: unknown): boolean {
  const err = errorLike(error);
  const text = errorText(error);
  return err.code === 'PGRST116' && /(^|\D)0 rows(\D|$)|no rows/.test(text);
}

export function isTransientSupabaseError(error: unknown): boolean {
  if (!error || isSupabaseNoRowsError(error)) return false;

  const status = errorStatus(error);
  if (status !== null && TRANSIENT_STATUS_CODES.has(status)) return true;

  const text = errorText(error);
  return /timeout|timed out|fetch failed|network|econnreset|etimedout|temporar|gateway|service unavailable|connection|aborted|too many requests/.test(text);
}

function shortError(error: unknown): string {
  const err = errorLike(error);
  return err.code || err.name || err.message || 'unknown';
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retrySupabaseQuery<T extends SupabaseResultLike>(
  label: string,
  operation: () => PromiseLike<T> | Promise<T>,
  options: { attempts?: number; delayMs?: number } = {},
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const delayMs = options.delayMs ?? 150;
  let lastResult: T | undefined;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await Promise.resolve(operation());
      lastResult = result;

      if (!result.error || !isTransientSupabaseError(result.error) || attempt === attempts) {
        return result;
      }

      logger.warn(`${label}: transient Supabase error, retrying`, {
        attempt,
        error: shortError(result.error),
      });
    } catch (error) {
      if (!isTransientSupabaseError(error) || attempt === attempts) {
        throw error;
      }

      logger.warn(`${label}: transient Supabase exception, retrying`, {
        attempt,
        error: shortError(error),
      });
    }

    await wait(delayMs * attempt);
  }

  return lastResult as T;
}

export function throwSupabaseQueryError(label: string, error: unknown): never {
  logger.error(`${label}: Supabase query failed`, error);
  throw new Error(`${label} failed`);
}
