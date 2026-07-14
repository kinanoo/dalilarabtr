/**
 * Browser-side helpers for the admin write API.
 *
 * Admin managers used to call supabase .insert/.update/.delete directly with
 * the anon key (RLS as the only gate). These helpers route every write through
 * /api/admin/write-record and /api/admin/delete-record, where requireAdmin()
 * verifies the cookie session + admin role server-side before touching the DB.
 *
 * The return shape mirrors supabase's `{ error }` so call sites keep their
 * `if (error) toast.error(error.message)` flow unchanged. `code` carries the
 * PostgREST error code through (NewsManager's missing-column fallback).
 */

export type AdminApiError = { message: string; code?: string };
export type AdminApiResult = { error: AdminApiError | null };

async function post(url: string, body: unknown): Promise<AdminApiResult> {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (res.ok) return { error: null };
        const json = await res.json().catch(() => ({} as { error?: string; code?: string }));
        return { error: { message: json.error || `HTTP ${res.status}`, code: json.code } };
    } catch (e) {
        return { error: { message: e instanceof Error ? e.message : 'network_error' } };
    }
}

type Row = Record<string, unknown>;

export function adminInsert(table: string, data: Row | Row[]): Promise<AdminApiResult> {
    return post('/api/admin/write-record', { table, op: 'insert', data });
}

export function adminUpdate(
    table: string,
    data: Row,
    value: string | number,
    field: string = 'id',
): Promise<AdminApiResult> {
    return post('/api/admin/write-record', { table, op: 'update', data, match: { field, value } });
}

export function adminUpsert(table: string, data: Row, onConflict?: string): Promise<AdminApiResult> {
    return post('/api/admin/write-record', { table, op: 'upsert', data, onConflict });
}

export function adminDelete(
    table: string,
    id: string | number,
    idField?: string,
): Promise<AdminApiResult> {
    return post('/api/admin/delete-record', { table, id, idField });
}
