import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/logger';


export type SearchResult = {
    id: string;
    type: string;
    title: string;
    subtitle?: string;
    data?: any; // Start undefined, fetch on demand or if returned
};

// Helper: Normalize Arabic string for flexible search (Hamza, Taa Marbuta, etc.)
// Replaces ambiguous characters with '_' (SQL wildcard for single char)
function normalizeForSearch(term: string): string {
    return term
        .replace(/[اأإآ]/g, '_')
        .replace(/[ةه]/g, '_')
        .replace(/[يى]/g, '_');
}

// ... (imports)
// Removed: import { CONSULTANT_SCENARIOS } from '@/lib/consultant-scenarios';

export async function searchAllTables(query: string): Promise<SearchResult[]> {
    if (!query || !supabase) return [];

    try {
        const sqlTerm = `%${normalizeForSearch(query)}%`;
        // Note: normalizeForSearch was defined earlier (replacing ambiguous with _)

        // Parallel Queries for ALL tables
        const [articles, services, faqs, codesResult, zones, sources, updates, suggestions, banners, menus, tools, scenarios] = await Promise.all([
            // ... (existing queries 1-11)
            // 1. Articles
            supabase.from('articles').select('id, title, details, intro').or(`title.ilike.${sqlTerm},details.ilike.${sqlTerm},intro.ilike.${sqlTerm}`).limit(5),
            // 2. Services
            supabase.from('service_providers').select('id, name, description, profession, phone').or(`name.ilike.${sqlTerm},description.ilike.${sqlTerm},profession.ilike.${sqlTerm}`).limit(5),
            // 3. FAQs
            supabase.from('faqs').select('id, question, answer').or(`question.ilike.${sqlTerm},answer.ilike.${sqlTerm}`).limit(5),
            // 4. Codes
            supabase.from('security_codes').select('code, title, description').or(`code.ilike.${sqlTerm},title.ilike.${sqlTerm},description.ilike.${sqlTerm}`).limit(5),
            // 5. Zones
            supabase.from('zones').select('id, city, district, neighborhood').or(`city.ilike.${sqlTerm},district.ilike.${sqlTerm},neighborhood.ilike.${sqlTerm}`).limit(5),
            // 6. Sources
            supabase.from('official_sources').select('id, name, category').or(`name.ilike.${sqlTerm},category.ilike.${sqlTerm}`).limit(5),
            // 7. Updates
            supabase.from('updates').select('id, title, content').or(`title.ilike.${sqlTerm},content.ilike.${sqlTerm}`).limit(5),
            // 8. Suggestions
            supabase.from('suggestions').select('id, name, message').or(`name.ilike.${sqlTerm},message.ilike.${sqlTerm}`).limit(5),
            // 9. Banners
            supabase.from('site_banners').select('id, content, link_text, type').or(`content.ilike.${sqlTerm},link_text.ilike.${sqlTerm}`).limit(5),
            // 10. Menus
            supabase.from('site_menus').select('id, label, href, location').or(`label.ilike.${sqlTerm},href.ilike.${sqlTerm},location.ilike.${sqlTerm}`).limit(5),
            // 11. Tools
            supabase.from('tools_registry').select('key, name, route').or(`name.ilike.${sqlTerm},key.ilike.${sqlTerm}`).limit(5),
            // 12. Scenarios (Now from DB)
            supabase.from('consultant_scenarios').select('id, title, description').or(`title.ilike.${sqlTerm},description.ilike.${sqlTerm}`).limit(5)
        ]);

        const results: SearchResult[] = [];

        // Helper to validate and push results
        const pushResult = (items: any[], type: string, titleKey: string, subtitleKey: string | ((i: any) => string), idKey: string = 'id') => {
            items?.forEach(item => {
                results.push({
                    id: item[idKey],
                    type,
                    title: item[titleKey] || 'بدون عنوان',
                    subtitle: typeof subtitleKey === 'function' ? subtitleKey(item) : (item[subtitleKey] || ''),
                    data: item
                });
            });
        };

        pushResult(articles.data || [], 'article', 'title', 'intro');
        pushResult(services.data || [], 'service', 'name', (i) => `${i.profession} | ${i.phone}`);
        pushResult(faqs.data || [], 'faq', 'question', 'answer');
        pushResult(codesResult.data || [], 'code', 'code', (i) => `${i.title} - ${i.description?.substring(0, 50)}`, 'code');
        pushResult(zones.data || [], 'zone', 'neighborhood', (i) => `${i.city} - ${i.district}`);
        pushResult(sources.data || [], 'source', 'name', 'category');
        pushResult(updates.data || [], 'update', 'title', (i) => i.content?.substring(0, 50));
        pushResult(suggestions.data || [], 'suggestion', 'name', (i) => i.message?.substring(0, 50));
        pushResult(banners.data || [], 'banner', 'content', 'type');
        pushResult(menus.data || [], 'menu', 'label', (i) => `${i.location} | ${i.href}`);
        pushResult(tools.data || [], 'tool', 'name', 'key', 'key');

        // 12. Push Scenarios
        pushResult(scenarios.data || [], 'scenario', 'title', (i) => i.description?.substring(0, 50)); // Uses 'description' not 'desc'

        return results;

    } catch (err) {
        logger.error("Client-Side Search Error:", err);
        return [];
    }
}

// Helper to fetch full item data when selected
export async function fetchItemDetails(id: string, type: string) {
    if (!id || !type || !supabase) return null;

    let table = '';
    switch (type) {
        case 'article': table = 'articles'; break;
        case 'service': table = 'service_providers'; break;
        case 'faq': table = 'faqs'; break;
        case 'code': table = 'security_codes'; break;
        case 'zone': table = 'zones'; break;
        case 'source': table = 'official_sources'; break;
        case 'tool': table = 'tools_registry'; break;
        case 'scenario': table = 'consultant_scenarios'; break;
        case 'menu': table = 'site_menus'; break;
        case 'update': table = 'updates'; break;
        case 'banner': table = 'site_banners'; break;
        case 'suggestion': table = 'suggestions'; break;
        case 'testimonial': table = 'site_testimonials'; break;
        default: return null;
    }

    let query = supabase.from(table).select('*');

    // Special handling for tables without standard 'id' column
    if (type === 'code') {
        query = query.eq('code', id);
    } else if (type === 'tool') {
        query = query.eq('key', id);
    } else {
        query = query.eq('id', id);
    }

    const { data, error } = await query.single();

    if (error) {
        logger.error(`Error fetching ${type} ${id}:`, error);
        return null;
    }
    return data;
}
