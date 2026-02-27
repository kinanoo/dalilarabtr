import { supabase } from '../supabaseClient';

// ============================================
// 📊 Types
// ============================================

export type Notification = {
    id: string;
    type: 'article' | 'law' | 'service' | 'update' | 'alert' | 'announcement' | 'reply' | 'review' | 'comment';
    title: string;
    message: string;
    link?: string;
    icon?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    target_audience?: string;
    target_user_id?: string | null;
    created_at: string;
    is_read?: boolean;
};

// ============================================
// 🔔 جلب الإشعارات غير المقروءة
// ============================================

export async function getUnreadNotifications(
    userIdentifier: string
): Promise<{ data: Notification[]; error: any }> {
    if (!supabase) {
        return { data: [], error: new Error('Supabase not initialized') };
    }

    try {
        const { data, error } = await supabase.rpc('get_unread_notifications', {
            p_user_identifier: userIdentifier,
        });

        if (error) throw error;
        return { data: data || [], error: null };
    } catch (error) {
        console.error('Error fetching unread notifications:', error);
        return { data: [], error };
    }
}

// ============================================
// 🔢 حساب عدد الإشعارات غير المقروءة
// ============================================

export async function getUnreadCount(
    userIdentifier: string
): Promise<{ count: number; error: any }> {
    if (!supabase) {
        return { count: 0, error: new Error('Supabase not initialized') };
    }

    try {
        const { data, error } = await supabase.rpc('get_unread_count', {
            p_user_identifier: userIdentifier,
        });

        if (error) throw error;
        return { count: data || 0, error: null };
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return { count: 0, error };
    }
}

// ============================================
// 📖 جلب كل الإشعارات (مقروءة وغير مقروءة)
// ============================================

export async function getAllNotifications(
    userIdentifier: string,
    limit: number = 20
): Promise<{ data: Notification[]; error: any }> {
    if (!supabase) {
        return { data: [], error: new Error('Supabase not initialized') };
    }

    try {
        // جلب الإشعارات
        const { data: notifications, error: notifError } = await supabase
            .from('notifications')
            .select('*')
            .eq('is_active', true)
            .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (notifError) throw notifError;

        // جلب سجلات القراءة
        const { data: reads, error: readsError } = await supabase
            .from('notification_reads')
            .select('notification_id')
            .eq('user_identifier', userIdentifier);

        if (readsError) throw readsError;

        // دمج البيانات
        const readIds = new Set(reads?.map((r) => r.notification_id) || []);
        const result = (notifications || []).map((n) => ({
            ...n,
            is_read: readIds.has(n.id),
        }));

        return { data: result, error: null };
    } catch (error) {
        console.error('Error fetching all notifications:', error);
        return { data: [], error };
    }
}

// ============================================
// ✅ تحديد إشعار كمقروء
// ============================================

export async function markAsRead(
    notificationId: string,
    userIdentifier: string
): Promise<{ success: boolean; error: any }> {
    if (!supabase) {
        return { success: false, error: new Error('Supabase not initialized') };
    }

    try {
        const { error } = await supabase.from('notification_reads').insert([
            {
                notification_id: notificationId,
                user_identifier: userIdentifier,
            },
        ]);

        if (error) {
            // إذا كان مقروءاً مسبقاً (unique constraint)
            if (error.code === '23505') {
                return { success: true, error: null };
            }
            throw error;
        }

        return { success: true, error: null };
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return { success: false, error };
    }
}

// ============================================
// ✅ تحديد كل الإشعارات كمقروءة
// ============================================

export async function markAllAsRead(
    userIdentifier: string
): Promise<{ success: boolean; error: any }> {
    if (!supabase) {
        return { success: false, error: new Error('Supabase not initialized') };
    }

    try {
        // جلب كل الإشعارات غير المقروءة
        const { data: unread } = await getUnreadNotifications(userIdentifier);

        if (!unread || unread.length === 0) {
            return { success: true, error: null };
        }

        // تحديدها كلها كمقروءة
        const reads = unread.map((n) => ({
            notification_id: n.id,
            user_identifier: userIdentifier,
        }));

        const { error } = await supabase.from('notification_reads').upsert(reads);

        if (error) throw error;
        return { success: true, error: null };
    } catch (error) {
        console.error('Error marking all as read:', error);
        return { success: false, error };
    }
}

// ============================================
// 🆔 الحصول على User Identifier
// ============================================

export function getUserIdentifier(): string {
    if (typeof window === 'undefined') return 'server';

    // أولاً: محاولة استخدام auth user ID (يُحفظ بواسطة NotificationBell عند التحميل)
    const authId = sessionStorage.getItem('notification_auth_id');
    if (authId) return authId;

    // ثانياً: localStorage ID للزوار المجهولين
    let userId = localStorage.getItem('user_notification_id');
    if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('user_notification_id', userId);
    }
    return userId;
}

// ============================================
// ➕ إنشاء إشعار جديد (عبر API route)
// ============================================

export async function createNotification(payload: {
    type: Notification['type'];
    title: string;
    message: string;
    link?: string;
    icon?: string;
    priority?: Notification['priority'];
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
