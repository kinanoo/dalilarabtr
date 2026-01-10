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
    parent_id?: string;
    replies?: Comment[]; // For nesting
};

export async function fetchComments(entityType: string, entityId: string) {
    if (!supabase) return { data: [], error: 'Supabase not initialized' };

    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .or('status.eq.approved,is_official.eq.true') // Show approved OR official replies
        .order('created_at', { ascending: false });

    if (error) return { data: [], error };

    // Arrange into threads (simple 1-level nesting for now if parent_id exists)
    // For now, we return flat list, UI can nest if needed.
    return { data: data as Comment[], error: null };
}

export async function postComment(payload: {
    entity_type: string;
    entity_id: string;
    author_name: string;
    content: string;
    email?: string;
    is_correction?: boolean;
    parent_id?: string;
}) {
    if (!supabase) return { error: 'Supabase not initialized' };

    const { data, error } = await supabase
        .from('comments')
        .insert([{
            ...payload,
            page_slug: payload.entity_id, // Backward compatibility for legacy schema
            status: 'approved' // Auto-approve by default as requested
        }])
        .select()
        .single();

    return { data, error };
}

export async function voteContent(entityType: string, entityId: string, voteType: 'up' | 'down', feedback?: string, reason?: string) {
    if (!supabase) return { error: 'Supabase not initialized' };

    // Simple ip check handled by DB unique constraint usually, or client side fingerprint.
    // Here we just insert. RLS/Unique constraint will fail if duplicate.
    const { error } = await supabase
        .from('content_votes')
        .insert([{
            entity_type: entityType,
            entity_id: entityId,
            vote_type: voteType,
            feedback,
            reason
        }]);

    return { error };
}
