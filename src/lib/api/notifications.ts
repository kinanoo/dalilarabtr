import { supabase } from '../supabaseClient';
import logger from '@/lib/logger';

// ============================================
// Types
// ============================================

export type Notification = {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    icon?: string;
    priority?: string;
    created_at: string;
    is_read: boolean;
    is_personal: boolean;
    group_count?: number;
};

// ============================================
// localStorage-based read tracking (global only)
// ============================================

const LAST_SEEN_KEY = 'daleel_notifications_last_seen';

/** Initialize on first visit — sets "last seen" to now so new visitors see 0 unread */
export function initLastSeen(): void {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(LAST_SEEN_KEY)) {
        localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
    }
}

/** Get the timestamp of when the user last opened the notification panel */
export function getLastSeen(): string {
    if (typeof window === 'undefined') return new Date().toISOString();
    return localStorage.getItem(LAST_SEEN_KEY) || new Date().toISOString();
}

/** Mark all global notifications as seen (update timestamp to now) */
export function markGlobalAsSeen(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
}

/** Mark a single global notification as seen (advance lastSeen to its created_at) */
export function markGlobalAsSeenUpTo(createdAt: string): void {
    if (typeof window === 'undefined') return;
    const current = getLastSeen();
    if (createdAt > current) {
        localStorage.setItem(LAST_SEEN_KEY, createdAt);
    }
}

// ============================================
// Database-based read tracking (personal only)
// ============================================

/** Mark all personal notifications as read in DB */
export async function markPersonalAsRead(userId: string): Promise<void> {
    if (!supabase) return;
    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('target_user_id', userId)
        .eq('is_read', false);
}

/** Mark a single personal notification as read in DB */
export async function markOneAsRead(notificationId: string): Promise<void> {
    if (!supabase) return;
    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('is_read', false);
}

// ============================================
// Fetch notifications (two separate queries)
// ============================================

export async function fetchAllNotifications(
    limit = 30,
    userId?: string | null,
): Promise<Notification[]> {
    if (!supabase) return [];

    const lastSeen = getLastSeen();
    const now = new Date().toISOString();

    // ── Query 1: Global notifications ──
    const globalQuery = supabase
        .from('notifications')
        .select('id, type, title, message, link, icon, priority, created_at, group_count')
        .is('target_user_id', null)
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('created_at', { ascending: false })
        .limit(15);

    // ── Query 2: Personal notifications (logged-in only) ──
    const personalQuery = userId
        ? supabase
              .from('notifications')
              .select('id, type, title, message, link, icon, priority, created_at, is_read, group_count')
              .eq('target_user_id', userId)
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(15)
        : null;

    const [globalResult, personalResult] = await Promise.all([
        globalQuery,
        personalQuery || Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
    ]);

    const items: Notification[] = [];

    // Global → is_read from localStorage timestamp
    if (globalResult.data) {
        for (const n of globalResult.data) {
            items.push({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                link: n.link || undefined,
                icon: n.icon || '🔔',
                priority: n.priority,
                created_at: n.created_at,
                is_read: n.created_at <= lastSeen,
                is_personal: false,
                group_count: n.group_count ?? 1,
            });
        }
    }

    // Personal → is_read from database column
    if (personalResult.data) {
        for (const n of personalResult.data) {
            items.push({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                link: n.link || undefined,
                icon: n.icon || '🔔',
                priority: n.priority,
                created_at: n.created_at,
                is_read: !!n.is_read,
                is_personal: true,
                group_count: n.group_count ?? 1,
            });
        }
    }

    // Sort by date desc, limit
    items.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return items.slice(0, limit);
}

// ============================================
// Create notification (used by frontend API calls)
// ============================================

export async function createNotification(payload: {
    type: string;
    title: string;
    message: string;
    link?: string;
    icon?: string;
    priority?: string;
    target_user_id?: string | null;
}): Promise<{ success: boolean; error: unknown }> {
    try {
        const res = await fetch('/api/notifications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const err = await res.json();
            return { success: false, error: err };
        }
        return { success: true, error: null };
    } catch (error) {
        logger.error('Error creating notification:', error);
        return { success: false, error };
    }
}
