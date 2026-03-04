import { supabase } from '../supabaseClient';

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
};

// ============================================
// Auto-event config (admin_activity_log → notification)
// ============================================

const AUTO_EVENT_CONFIG: Record<string, { type: string; icon: string; href: (id: string) => string }> = {
    new_article:  { type: 'مقال جديد',    icon: '📄', href: (id) => `/article/${id}` },
    new_scenario: { type: 'سيناريو جديد', icon: '🧠', href: (id) => `/consultant?scenario=${id}` },
    new_faq:      { type: 'سؤال شائع',    icon: '❓', href: () => `/faq` },
    new_code:     { type: 'كود أمني',     icon: '🛡️', href: () => `/security-codes` },
    new_zone:     { type: 'منطقة جديدة',  icon: '📍', href: () => `/zones` },
    new_update:   { type: 'خبر',         icon: '📰', href: (id) => `/updates/${id}` },
    new_service:  { type: 'خدمة جديدة',   icon: '💼', href: (id) => `/services/${id}` },
    new_tool:     { type: 'أداة جديدة',   icon: '🔧', href: () => `/tools` },
    new_source:   { type: 'مصدر رسمي',   icon: '🔗', href: () => `/sources` },
};

const PUBLIC_EVENT_TYPES = Object.keys(AUTO_EVENT_CONFIG);

// ============================================
// localStorage-based read tracking
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

/** Mark all current notifications as seen (update timestamp to now) */
export function markAllAsSeen(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
}

// ============================================
// Fetch combined notifications
// ============================================

export async function fetchAllNotifications(limit = 30): Promise<Notification[]> {
    if (!supabase) return [];

    const lastSeen = getLastSeen();

    // Fetch both sources in parallel
    // admin_activity_log has admin-only RLS, so use public API for auto events
    const [manualResult, autoEventsRes] = await Promise.all([
        supabase
            .from('notifications')
            .select('id, type, title, message, link, icon, priority, created_at')
            .eq('is_active', true)
            .is('target_user_id', null)
            .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
            .order('created_at', { ascending: false })
            .limit(limit),
        fetch('/api/public-events').then(r => r.json()).catch(() => ({ events: [] })),
    ]);
    const autoResult = { data: autoEventsRes.events || [] };

    const items: Notification[] = [];

    // Manual notifications
    if (manualResult.data) {
        for (const n of manualResult.data) {
            items.push({
                id: n.id,
                title: n.title,
                message: n.message,
                link: n.link || undefined,
                icon: n.icon || '🔔',
                type: n.type,
                priority: n.priority,
                created_at: n.created_at,
                is_read: n.created_at <= lastSeen,
            });
        }
    }

    // Auto events from admin_activity_log
    if (autoResult.data) {
        for (const e of autoResult.data) {
            const cfg = AUTO_EVENT_CONFIG[e.event_type];
            if (!cfg) continue;
            items.push({
                id: `auto_${e.id}`,
                title: e.title || cfg.type,
                message: e.detail || '',
                link: cfg.href(e.entity_id || ''),
                icon: cfg.icon,
                type: cfg.type,
                created_at: e.created_at,
                is_read: e.created_at <= lastSeen,
            });
        }
    }

    // Sort by date desc and limit
    items.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return items.slice(0, limit);
}

// ============================================
// Create notification (used by admin panels)
// ============================================

export async function createNotification(payload: {
    type: string;
    title: string;
    message: string;
    link?: string;
    icon?: string;
    priority?: string;
    target_user_id?: string | null;
}): Promise<{ success: boolean; error: any }> {
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
        console.error('Error creating notification:', error);
        return { success: false, error };
    }
}
