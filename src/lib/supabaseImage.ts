const SUPABASE_PUBLIC_OBJECT_PATH = '/storage/v1/object/public/';
const SUPABASE_RENDER_PATH = '/storage/v1/render/image/public/';
const SUPABASE_HOST = 'bcgwbffwzdlzlyjvlyhr.supabase.co';

type SupabaseImageOptions = {
    width: number;
    height?: number;
    quality?: number;
    resize?: 'cover' | 'contain' | 'fill';
};

export function getSupabaseImageUrl(source: string, options: SupabaseImageOptions): string {
    try {
        const url = new URL(source);
        if (url.protocol !== 'https:' || url.hostname !== SUPABASE_HOST || !url.pathname.startsWith(SUPABASE_PUBLIC_OBJECT_PATH)) {
            return source;
        }

        url.pathname = url.pathname.replace(SUPABASE_PUBLIC_OBJECT_PATH, SUPABASE_RENDER_PATH);
        url.search = '';
        url.searchParams.set('width', String(Math.max(1, Math.round(options.width))));
        url.searchParams.set('height', String(Math.max(1, Math.round(options.height ?? options.width))));
        url.searchParams.set('resize', options.resize ?? 'cover');
        url.searchParams.set('quality', String(Math.min(100, Math.max(20, options.quality ?? 72))));
        return url.toString();
    } catch {
        return source;
    }
}
