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
    verifiedCount: number;
}

/**
 * Prefer a grouped database RPC so facet cost stays nearly constant as the
 * directory grows. The fallback keeps deployments compatible while the new
 * migration is being applied.
 */
export async function getServiceDirectoryFacetSummary(
    client: SupabaseClient,
): Promise<ServiceDirectoryFacetSummary> {
    const rpcResult = await client.rpc('get_service_directory_facets');
    if (!rpcResult.error && rpcResult.data) {
        const payload = rpcResult.data as {
            rows?: DirectoryFacetRow[];
            directoryTotal?: number;
            verifiedCount?: number;
        };
        const rows = Array.isArray(payload.rows) ? payload.rows : [];
        return {
            ...buildDirectoryFacets(rows),
            popularSearches: buildPopularDirectorySearches(rows),
            directoryTotal: Number(payload.directoryTotal) || 0,
            verifiedCount: Number(payload.verifiedCount) || 0,
        };
    }

    const [rowsResult, totalResult, verifiedResult] = await Promise.all([
        client
            .from('service_providers')
            .select('city, category')
            .eq('status', 'approved')
            .limit(2000),
        client
            .from('service_providers')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'approved'),
        client
            .from('service_providers')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'approved')
            .eq('is_verified', true),
    ]);

    if (rowsResult.error) throw rowsResult.error;
    const rows = (rowsResult.data as DirectoryFacetRow[]) || [];
    return {
        ...buildDirectoryFacets(rows),
        popularSearches: buildPopularDirectorySearches(rows),
        directoryTotal: totalResult.count || rows.length,
        verifiedCount: verifiedResult.count || 0,
    };
}
