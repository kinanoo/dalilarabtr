import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import {
    DIRECTORY_MAX_PAGE_SIZE,
    DIRECTORY_PAGE_SIZE,
    categoryVariantsForDirectory,
    cityVariantsForDirectory,
    directorySearchVariants,
    sanitizeDirectorySearch,
} from '@/lib/serviceDirectory';
import { getServiceDirectoryFacetSummary } from '@/lib/serviceDirectoryServer';
import logger from '@/lib/logger';

export const runtime = 'nodejs';

const SELECT_FIELDS = [
    'id',
    'slug',
    'name',
    'profession',
    'category',
    'description',
    'city',
    'image',
    'phone',
    'whatsapp',
    'is_verified',
    'verification_level',
    'is_featured',
    'rating',
    'review_count',
    'status',
    'created_at',
].join(', ');

const asPositiveInteger = (value: string | null, fallback: number): number => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export async function GET(request: NextRequest) {
    if (!supabase) {
        return NextResponse.json({ error: 'تعذّر الاتصال بدليل الخدمات' }, { status: 503 });
    }

    const params = request.nextUrl.searchParams;
    const page = asPositiveInteger(params.get('page'), 1);
    const limit = Math.min(
        asPositiveInteger(params.get('limit'), DIRECTORY_PAGE_SIZE),
        DIRECTORY_MAX_PAGE_SIZE,
    );
    const city = params.get('city');
    const category = params.get('category');
    const search = sanitizeDirectorySearch(params.get('q'));
    const sort = params.get('sort') || 'recommended';
    const includeFacets = params.get('facets') === '1';
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
        let query = supabase
            .from('service_providers')
            .select(SELECT_FIELDS, { count: 'exact' })
            .eq('status', 'approved');

        const cityVariants = cityVariantsForDirectory(city);
        if (cityVariants.length > 0) query = query.in('city', cityVariants);

        const categoryVariants = categoryVariantsForDirectory(category);
        if (categoryVariants.length > 0) query = query.in('category', categoryVariants);

        if (search) {
            const fields = ['name', 'profession', 'description', 'category', 'city', 'district'];
            const clauses = directorySearchVariants(search).flatMap((variant) => {
                const needle = `%${variant.replace(/[%_]/g, '')}%`;
                return fields.map((field) => `${field}.ilike.${needle}`);
            });
            query = query.or(
                clauses.join(','),
            );
        }

        if (sort === 'rating') {
            query = query
                .order('rating', { ascending: false, nullsFirst: false })
                .order('review_count', { ascending: false });
        } else if (sort === 'newest') {
            query = query.order('created_at', { ascending: false });
        } else if (sort === 'name') {
            query = query.order('name', { ascending: true });
        } else {
            query = query
                .order('is_featured', { ascending: false })
                .order('is_verified', { ascending: false })
                .order('rating', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false });
        }

        query = query.order('id', { ascending: true });

        const directoryPromise = query.range(from, to);
        const facetsPromise = includeFacets
            ? getServiceDirectoryFacetSummary(supabase)
            : null;

        const [{ data, count, error }, facets] = await Promise.all([
            directoryPromise,
            facetsPromise,
        ]);
        if (error) throw error;

        const total = count || 0;
        return NextResponse.json(
            {
                rows: data || [],
                total,
                page,
                limit,
                pages: Math.max(1, Math.ceil(total / limit)),
                ...(facets ? { facets } : {}),
            },
            {
                headers: {
                    'Cache-Control': includeFacets
                        ? 'public, s-maxage=60, stale-while-revalidate=300'
                        : 'public, s-maxage=300, stale-while-revalidate=900',
                },
            },
        );
    } catch (error) {
        logger.error('services directory API failed:', error);
        return NextResponse.json(
            { error: 'تعذّر تحميل الخدمات الآن' },
            { status: 500 },
        );
    }
}
