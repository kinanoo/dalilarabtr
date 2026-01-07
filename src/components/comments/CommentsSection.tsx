import { createClient } from '@supabase/supabase-js';
import CommentsClient from './CommentsClient';

// Server-side initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type Props = {
    pageSlug: string;
};

export default async function CommentsSection({ pageSlug }: Props) {
    // Fetch initial comments
    const { data: comments } = await supabase
        .from('comments')
        .select('*')
        .eq('page_slug', pageSlug)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(50); // Reasonable limit

    return (
        <section className="w-full font-cairo bg-transparent shadow-none border-none" id="comments-section">
            <CommentsClient
                pageSlug={pageSlug}
                initialComments={comments || []}
            />
        </section>
    );
}
