import { supabase } from '../supabaseClient';

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
    if (!supabase) return { data: [], error: 'Supabase not initialized' };

    const { data: flatComments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .or('status.eq.approved,is_official.eq.true')
        .order('created_at', { ascending: true }); // ascending so tree order is correct

    if (error) return { data: [], error };
    if (!flatComments || flatComments.length === 0) return { data: [], error: null };

    // Batch-fetch like counts for all comments
    const commentIds = flatComments.map((c) => c.id);
    const { data: votes } = await supabase
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

    // Destructure user_id out so it's not spread into insert when absent
    const { user_id, ...rest } = payload;
    const insertObj: any = {
        ...rest,
        page_slug: payload.entity_id, // backward compat
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
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        const { error } = await supabase
            .from('comments')
            .update({ content })
            .eq('id', commentId);

        if (error) throw error;
        return { success: true, error: null };
    } catch (error) {
        console.error('Error updating comment:', error);
        return { success: false, error };
    }
}

export async function deleteComment(
    commentId: string
): Promise<{ success: boolean; error: any }> {
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId);

        if (error) throw error;
        return { success: true, error: null };
    } catch (error) {
        console.error('Error deleting comment:', error);
        return { success: false, error };
    }
}

export async function toggleCommentLike(commentId: string): Promise<{ liked: boolean; error?: any }> {
    if (!supabase) return { liked: false, error: 'Supabase not initialized' };

    const { error } = await supabase
        .from('content_votes')
        .insert([{
            entity_type: 'comment',
            entity_id: commentId,
            vote_type: 'up',
        }]);

    if (error) return { liked: false, error };
    return { liked: true };
}

export async function voteContent(entityType: string, entityId: string, voteType: 'up' | 'down', feedback?: string, reason?: string) {
    if (!supabase) return { error: 'Supabase not initialized' };

    const { error } = await supabase
        .from('content_votes')
        .insert([{
            entity_type: entityType,
            entity_id: entityId,
            vote_type: voteType,
            feedback,
            reason,
        }]);

    return { error };
}
