import { supabase, getAnonClient } from '../supabaseClient';

// Reserved names that only the admin/system should use
const RESERVED_PATTERNS = [
    'الإدارة', 'الاداره', 'الادارة', 'إدارة', 'اداره', 'ادارة',
    'أدمن', 'ادمن', 'admin', 'administrator', 'moderator',
    'دليل العرب', 'دليلالعرب', 'dalil', 'dalilarab',
    'المشرف', 'مشرف', 'المدير', 'مدير',
    'الموقع', 'فريق الموقع', 'فريق الدعم',
    'الدعم الفني', 'خدمة العملاء',
];

export function isReservedName(name: string): boolean {
    if (!name) return false;
    const normalized = name.trim().toLowerCase().replace(/\s+/g, ' ');
    return RESERVED_PATTERNS.some(p =>
        normalized === p.toLowerCase() || normalized.includes(p.toLowerCase())
    );
}

export type Comment = {
    id: string;
    entity_type: string;
    entity_id: string;
    author_name: string;
    content: string;
    is_correction: boolean;
    is_official: boolean;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    parent_id?: string | null;
    user_id?: string | null;
    likes_count: number;
    replies?: Comment[];
};

function buildCommentTree(flat: Comment[]): Comment[] {
    const map = new Map<string, Comment>();
    const roots: Comment[] = [];

    for (const c of flat) {
        map.set(c.id, { ...c, replies: [] });
    }

    for (const c of flat) {
        const node = map.get(c.id)!;
        if (c.parent_id && map.has(c.parent_id)) {
            map.get(c.parent_id)!.replies!.push(node);
        } else {
            roots.push(node);
        }
    }

    return roots;
}

export async function fetchComments(entityType: string, entityId: string) {
    // Use plain anon client for public reads — avoids RLS user-specific policies
    // that may hide comments from authenticated users (admin)
    const sb = getAnonClient() || supabase;
    if (!sb) return { data: [], error: 'Supabase not initialized' };

    // Normalize: always decode so encoded and decoded IDs match
    const normalizedId = decodeURIComponent(entityId);

    const { data: flatComments, error } = await sb
        .from('comments')
        .select('id, entity_type, entity_id, author_name, content, is_correction, is_official, status, created_at, parent_id, user_id')
        .eq('entity_type', entityType)
        .eq('entity_id', normalizedId)
        .or('status.eq.approved,is_official.eq.true')
        .order('created_at', { ascending: true }); // ascending so tree order is correct

    if (error) return { data: [], error };
    if (!flatComments || flatComments.length === 0) return { data: [], error: null };

    // Batch-fetch like counts for all comments
    const commentIds = flatComments.map((c) => c.id);
    const { data: votes } = await sb
        .from('content_votes')
        .select('entity_id')
        .eq('entity_type', 'comment')
        .in('entity_id', commentIds)
        .eq('vote_type', 'up');

    const likesMap = new Map<string, number>();
    for (const v of votes || []) {
        likesMap.set(v.entity_id, (likesMap.get(v.entity_id) || 0) + 1);
    }

    const commentsWithLikes: Comment[] = flatComments.map((c) => ({
        ...c,
        likes_count: likesMap.get(c.id) || 0,
        replies: [],
    }));

    const tree = buildCommentTree(commentsWithLikes);
    tree.reverse(); // newest root comments first

    return { data: tree, error: null };
}

export async function postComment(payload: {
    entity_type: string;
    entity_id: string;
    author_name: string;
    content: string;
    email?: string;
    is_correction?: boolean;
    parent_id?: string;
    user_id?: string;
}) {
    if (!supabase) return { data: null, error: 'Supabase not initialized' };

    // Block reserved admin-like names
    if (isReservedName(payload.author_name)) {
        return { data: null, error: { message: 'هذا الاسم محجوز للإدارة. يرجى اختيار اسم آخر.' } };
    }

    // Destructure user_id out so it's not spread into insert when absent
    const { user_id, ...rest } = payload;
    // Normalize entity_id: always decode so IDs are stored consistently
    const normalizedId = decodeURIComponent(rest.entity_id);
    const insertObj: any = {
        ...rest,
        entity_id: normalizedId,
        page_slug: normalizedId, // backward compat
        status: 'approved',
    };
    // Only include user_id if provided (column may not exist yet)
    if (user_id) {
        insertObj.user_id = user_id;
    }

    const { data, error } = await supabase
        .from('comments')
        .insert([insertObj])
        .select()
        .single();

    // If insert failed and we included user_id, retry without it
    // (user_id column may not exist yet if migration hasn't been run)
    if (error && user_id) {
        delete insertObj.user_id;
        const { data: retryData, error: retryError } = await supabase
            .from('comments')
            .insert([insertObj])
            .select()
            .single();
        return { data: retryData, error: retryError };
    }

    return { data, error };
}

export async function updateComment(
    commentId: string,
    content: string
): Promise<{ success: boolean; error: any }> {
    try {
        const res = await fetch(`/api/comments`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: commentId, content }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'update_failed');
        }
        return { success: true, error: null };
    } catch (error) {
        console.error('Error updating comment:', error);
        return { success: false, error };
    }
}

export async function deleteComment(
    commentId: string
): Promise<{ success: boolean; error: any }> {
    try {
        const res = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'delete_failed');
        }
        return { success: true, error: null };
    } catch (error) {
        console.error('Error deleting comment:', error);
        return { success: false, error };
    }
}

export async function toggleCommentLike(commentId: string, visitorId?: string): Promise<{ liked: boolean; error?: any }> {
    if (!supabase) return { liked: false, error: 'Supabase not initialized' };

    // Check if already liked
    const { data: existing } = await supabase
        .from('content_votes')
        .select('id')
        .eq('entity_type', 'comment')
        .eq('entity_id', commentId)
        .eq('vote_type', 'up')
        .eq('visitor_id', visitorId || '')
        .maybeSingle();

    if (existing) {
        // Unlike — remove the vote
        const { error } = await supabase
            .from('content_votes')
            .delete()
            .eq('id', existing.id);
        if (error) return { liked: true, error };
        return { liked: false };
    }

    // Like — insert new vote
    const { error } = await supabase
        .from('content_votes')
        .insert([{
            entity_type: 'comment',
            entity_id: commentId,
            vote_type: 'up',
            visitor_id: visitorId || undefined,
        }]);

    if (error?.code === '23505') return { liked: true }; // already liked (race condition)
    if (error) return { liked: false, error };
    return { liked: true };
}

export async function voteContent(entityType: string, entityId: string, voteType: 'up' | 'down', feedback?: string, reason?: string, visitorId?: string) {
    if (!supabase) return { error: 'Supabase not initialized' };

    const { error } = await supabase
        .from('content_votes')
        .insert([{
            entity_type: entityType,
            entity_id: entityId,
            vote_type: voteType,
            feedback,
            reason,
            visitor_id: visitorId || undefined,
        }]);

    // Unique constraint violation = already voted
    if (error?.code === '23505') return { error: 'already_voted' };
    return { error };
}
