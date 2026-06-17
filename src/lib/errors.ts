/**
 * Pulls a human-readable message out of whatever `unknown` is thrown.
 *
 * Why this exists: the old pattern
 *
 *   err instanceof Error ? err.message : String(err)
 *
 * misses the case that bites every admin save flow: Supabase's
 * PostgrestError is a plain object, not an Error instance. The branch
 * falls through to `String(err)` which produces the useless
 * "[object Object]" toast. The admin then can't tell what failed
 * (RLS denial vs. unique-key violation vs. column-missing vs. anything
 * else) and is stuck.
 *
 * This helper handles the common error shapes:
 *   - Error instance (toast.message)
 *   - PostgrestError-like {message, details, hint, code}
 *   - Supabase auth errors {error_description}
 *   - Plain strings
 *   - Random objects (last-resort JSON.stringify)
 */
export function extractErrorMessage(err: unknown): string {
    if (!err) return 'خطأ غير معروف';
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    if (typeof err === 'object') {
        const e = err as {
            message?: string;
            details?: string;
            hint?: string;
            code?: string;
            error_description?: string;
        };
        // Stack the readable bits — code first because it lets the admin
        // copy-paste it into our triage docs / Postgres docs to look up
        // the meaning (23505 = unique violation, 42501 = permission denied,
        // PGRST116 = no rows, etc.).
        const parts: string[] = [];
        if (e.message) parts.push(e.message);
        if (e.details && e.details !== e.message) parts.push(e.details);
        if (e.hint) parts.push(`hint: ${e.hint}`);
        if (e.code) parts.push(`[${e.code}]`);
        if (parts.length) return parts.join(' — ');
        if (e.error_description) return e.error_description;
        try { return JSON.stringify(err); } catch { return 'خطأ غير قابل للقراءة'; }
    }
    return String(err);
}
