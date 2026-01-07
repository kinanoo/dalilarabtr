import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

// Initialize Supabase Client (Server-side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const revalidate = 60; // Revalidate every minute

// Generate Metadata
export async function generateMetadata(props: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const params = await props.params;
    const { data: page } = await supabase
        .from('static_pages')
        .select('title')
        .eq('slug', params.slug)
        .single();

    if (!page) {
        return {
            title: 'Page Not Found',
        };
    }

    return {
        title: page.title,
    };
}

// Generate Static Params for SSG (optional, but good for performance)
export async function generateStaticParams() {
    const { data: pages } = await supabase.from('static_pages').select('slug');
    return (pages || []).map((page) => ({
        slug: page.slug,
    }));
}

export default async function StaticPage(props: {
    params: Promise<{ slug: string }>;
}) {
    const params = await props.params;
    const { data: page, error } = await supabase
        .from('static_pages')
        .select('*')
        .eq('slug', params.slug)
        .single();

    if (error || !page) {
        notFound();
    }

    // Dangerous HTML rendering
    return (
        <div className="static-page-container min-h-screen bg-white text-slate-900 overflow-hidden">
            {/* We wrap it in a div but render raw HTML inside */}
            <div dangerouslySetInnerHTML={{ __html: page.content || '' }} />
        </div>
    );
}
