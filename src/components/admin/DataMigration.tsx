'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    NAVIGATION,
    PRIMARY_NAV,
    CATEGORY_SLUGS,
    TOOLS_MENU
} from '@/lib/data';
import { Database, Upload, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function DataMigration() {
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    const migrateMenus = async () => {
        addLog('🚀 البدء بنقل القوائم (Menus)...');
        if (!supabase) return addLog('❌ خطأ: لم يتم الاتصال بقاعدة البيانات');

        // 1. Header Menus
        const headerMenus = PRIMARY_NAV.map((item, idx) => ({
            location: 'header',
            label: item.name,
            href: item.href,
            icon: (item as any).icon?.displayName || 'Circle', // Fallback
            sort_order: idx,
            is_active: true
        }));

        // 2. Footer/Sidebar Menus
        const footerMenus = NAVIGATION.map((item, idx) => ({
            location: 'footer',
            label: item.name,
            href: item.href,
            icon: (item as any).icon?.displayName || 'Circle',
            sort_order: idx,
            is_active: true
        }));

        const { error: err1 } = await supabase.from('site_menus').upsert([...headerMenus, ...footerMenus], { onConflict: 'location, href' as any }); // Simplistic conflict check might fail if no constraint, so we might just insert. 
        // Actually upsert requires a generic constraint. For now let's just insert and ignore dups or clear first.
        // Safe approach: Delete all first? Maybe too risky. Let's just Insert.

        // Better: Just insert.
        const { error } = await supabase.from('site_menus').insert([...headerMenus, ...footerMenus]);

        if (error) addLog(`❌ فشل نقل القوائم: ${error.message}`);
        else addLog(`✅ تم نقل ${headerMenus.length + footerMenus.length} عنصر قائمة بنجاح.`);
    };

    const migrateCategories = async () => {
        addLog('🚀 البدء بنقل التصنيفات (Categories)...');
        if (!supabase) return;

        const categories = Object.entries(CATEGORY_SLUGS).map(([slug, title], idx) => ({
            slug,
            title,
            description: `تصفح كافة خدمات ${title}`,
            is_featured: true,
            sort_order: idx,
            active: true
        }));

        const { error } = await supabase.from('service_categories').upsert(categories);

        if (error) addLog(`❌ فشل نقل التصنيفات: ${error.message}`);
        else addLog(`✅ تم نقل ${categories.length} تصنيف بنجاح.`);
    };

    const migrateTools = async () => {
        addLog('🚀 البدء بنقل الأدوات (Tools)...');
        if (!supabase) return;

        const tools = TOOLS_MENU.map((item) => ({
            key: item.href.split('/').pop() || item.href,
            name: item.name,
            route: item.href,
            is_active: true,
            settings: {}
        }));

        const { error } = await supabase.from('tools_registry').upsert(tools, { onConflict: 'key' });

        if (error) addLog(`❌ فشل نقل الأدوات: ${error.message}`);
        else addLog(`✅ تم نقل ${tools.length} أداة بنجاح.`);
    };

    const migrateArticles = async () => {
        addLog('🚀 البدء بنقل المقالات (Articles)...');
        if (!supabase) return;

        // Dynamic import to avoid server-side issues if any
        const { ARTICLES } = await import('@/lib/articles');
        const articlesList = Object.entries(ARTICLES).map(([slug, art]) => ({
            slug, // The key in the object is the slug/ID
            title: art.title,
            category: art.category,
            intro: art.intro,
            details: art.details,
            steps: art.steps,
            tips: art.tips,
            warning: art.warning,
            documents: art.documents,
            fees: art.fees,
            source: art.source,
            last_update: art.lastUpdate, // Map camelCase to snake_case
            seo_title: art.seoTitle,
            seo_description: art.seoDescription,
            seo_keywords: art.seoKeywords,
            image: (art as any).image // Fix TS error if type is missing
        }));

        // Batch insert (chunking might be needed if too large, but 50-100 is fine usually)
        // Articles list is large, so let's chunk it by 50
        const chunkSize = 50;
        let successCount = 0;

        for (let i = 0; i < articlesList.length; i += chunkSize) {
            const chunk = articlesList.slice(i, i + chunkSize);
            const { error } = await supabase.from('articles').upsert(chunk, { onConflict: 'slug' });
            if (error) {
                addLog(`❌ فشل نقل جزء من المقالات: ${error.message}`);
            } else {
                successCount += chunk.length;
            }
        }

        addLog(`✅ تم نقل/تحديث ${successCount} مقال بنجاح.`);
    };

    const migrateServiceProviders = async () => {
        addLog('🚀 البدء بنقل مقدمي الخدمات (Service Providers)...');
        if (!supabase) return;

        const { MOCK_PROVIDERS } = await import('@/lib/services-data');

        const providers = MOCK_PROVIDERS.map((p) => ({
            name: p.name,
            profession: p.profession,
            category: p.category,
            city: p.city,
            district: p.district,
            phone: p.phone,
            image: p.image,
            description: p.description,
            rating: p.rating,
            review_count: p.reviewCount,
            is_verified: p.isVerified,
            active: true
        }));

        const { error } = await supabase.from('service_providers').upsert(providers, { onConflict: 'phone' as any }); // Determine unique key, phone is good candidate usually

        if (error) addLog(`❌ فشل نقل الخدمات: ${error.message}`);
        else addLog(`✅ تم نقل ${providers.length} خدمة بنجاح.`);
    };

    const runFullMigration = async () => {
        setLoading(true);
        setLogs([]);
        try {
            await migrateMenus();
            await migrateCategories();
            await migrateTools();
            await migrateArticles();
            await migrateServiceProviders(); // Added
            addLog('🎉 تمت العملية بالكامل!');
        } catch (e: any) {
            console.error(e);
            addLog(`❌ حدث خطأ غير متوقع: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl border border-slate-800 font-mono text-sm" dir="ltr">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Database className="text-emerald-500" />
                System Data Migration
            </h3>

            <div className="mb-6 p-4 bg-slate-950 rounded-xl border border-dashed border-slate-800">
                <p className="mb-4 text-slate-400">
                    Current Static Data to Migrate:<br />
                    - {PRIMARY_NAV.length + NAVIGATION.length} Menu Items<br />
                    - {Object.keys(CATEGORY_SLUGS).length} Categories<br />
                    - {TOOLS_MENU.length} Tools<br />
                    - <strong>All Articles (Heavy Load)</strong>
                </p>
                <button
                    onClick={runFullMigration}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Upload size={18} />}
                    Start Full Migration (Including Articles)
                </button>
            </div>

            <div className="bg-black/50 p-4 rounded-xl h-48 overflow-y-auto border border-slate-800">
                {logs.length === 0 ? (
                    <span className="text-slate-600 italic">Waiting to start...</span>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className="mb-1 font-mono">
                            {log.startsWith('❌') ? <span className="text-red-400">{log}</span> :
                                log.startsWith('✅') ? <span className="text-emerald-400">{log}</span> :
                                    log.startsWith('🚀') ? <span className="text-blue-400 border-t border-slate-800 pt-2 mt-2 block">{log}</span> :
                                        <span className="text-slate-300">{log}</span>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
