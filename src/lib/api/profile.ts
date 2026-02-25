import { getAuthClient } from '../supabaseClient';

// ============================================
// Types
// ============================================

export type MemberProfile = {
    id: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    city: string | null;
    role: string;
    created_at: string;
    updated_at: string | null;
};

export type ProfileUpdateData = {
    full_name?: string;
    avatar_url?: string;
    bio?: string;
    city?: string;
};

export type UserActivityStats = {
    reviews_count: number;
    comments_count: number;
    services_count: number;
    articles_count: number;
};

// ============================================
// جلب البروفايل
// ============================================

export async function getMyProfile(): Promise<{ data: MemberProfile | null; error: any }> {
    const sb = getAuthClient();
    if (!sb) return { data: null, error: 'Supabase not initialized' };

    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await sb
        .from('member_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return { data, error };
}

// ============================================
// تحديث البروفايل
// ============================================

export async function updateProfile(updates: ProfileUpdateData): Promise<{ success: boolean; error: any }> {
    const sb = getAuthClient();
    if (!sb) return { success: false, error: 'Supabase not initialized' };

    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await sb
        .from('member_profiles')
        .update(updates)
        .eq('id', user.id);

    if (error) return { success: false, error };
    return { success: true, error: null };
}

// ============================================
// إحصائيات النشاط
// ============================================

export async function getMyActivityStats(): Promise<{ data: UserActivityStats; error: any }> {
    const empty = { reviews_count: 0, comments_count: 0, services_count: 0, articles_count: 0 };
    const sb = getAuthClient();
    if (!sb) return { data: empty, error: 'Supabase not initialized' };

    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { data: empty, error: 'Not authenticated' };

    const [reviews, comments, services, articles] = await Promise.all([
        sb.from('service_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        sb.from('comments').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        sb.from('service_providers').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        sb.from('articles').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);

    return {
        data: {
            reviews_count: reviews.count || 0,
            comments_count: comments.count || 0,
            services_count: services.count || 0,
            articles_count: articles.count || 0,
        },
        error: null,
    };
}

// ============================================
// تقييماتي
// ============================================

export async function getMyReviews(): Promise<{ data: any[]; error: any }> {
    const sb = getAuthClient();
    if (!sb) return { data: [], error: 'Supabase not initialized' };

    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { data: [], error: 'Not authenticated' };

    const { data, error } = await sb
        .from('service_reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return { data: data || [], error };
}

// ============================================
// تعليقاتي
// ============================================

export async function getMyComments(): Promise<{ data: any[]; error: any }> {
    const sb = getAuthClient();
    if (!sb) return { data: [], error: 'Supabase not initialized' };

    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { data: [], error: 'Not authenticated' };

    const { data, error } = await sb
        .from('comments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return { data: data || [], error };
}

// ============================================
// خدماتي
// ============================================

export async function getMyServices(): Promise<{ data: any[]; error: any }> {
    const sb = getAuthClient();
    if (!sb) return { data: [], error: 'Supabase not initialized' };

    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { data: [], error: 'Not authenticated' };

    const { data, error } = await sb
        .from('service_providers')
        .select('id, name, profession, city, status, created_at, rating, review_count')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return { data: data || [], error };
}

// ============================================
// مقالاتي
// ============================================

export async function getMyArticles(): Promise<{ data: any[]; error: any }> {
    const sb = getAuthClient();
    if (!sb) return { data: [], error: 'Supabase not initialized' };

    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { data: [], error: 'Not authenticated' };

    const { data, error } = await sb
        .from('articles')
        .select('id, title, category, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return { data: data || [], error };
}
