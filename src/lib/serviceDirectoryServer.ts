import type { SupabaseClient } from '@supabase/supabase-js';
import {
    buildDirectoryFacets,
    buildPopularDirectorySearches,
    type DirectoryFacetRow,
    type DirectoryPopularSearch,
} from '@/lib/serviceDirectory';

export interface ServiceDirectoryFacetSummary {
    cityCounts: Record<string, number>;
    categoryCounts: Record<string, number>;
    extraCategories: string[];
    popularSearches: DirectoryPopularSearch[];
    directoryTotal: number;
}

/** Build facets only from providers that have an explicit WhatsApp number. */
export async function getServiceDirectoryFacetSummary(
    client: SupabaseClient,
): Promise<ServiceDirectoryFacetSummary> {
    const [rowsResult, totalResult] = await Promise.all([
        client
            .from('service_providers')
            .select('city, category')
            .eq('status', 'approved')
            .not('whatsapp', 'is', null)
            .neq('whatsapp', '')
            .limit(2000),
        client
            .from('service_providers')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'approved')
            .not('whatsapp', 'is', null)
            .neq('whatsapp', ''),
    ]);

    if (rowsResult.error) throw rowsResult.error;
    const rows = (rowsResult.data as DirectoryFacetRow[]) || [];
    return {
        ...buildDirectoryFacets(rows),
        popularSearches: buildPopularDirectorySearches(rows),
        directoryTotal: totalResult.count || rows.length,
    };
}
