
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Simple env loader
const loadEnv = () => {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envVars: Record<string, string> = {};
        envFile.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, ''); // Remove quotes
            }
        });
        return envVars;
    } catch (e) {
        console.error("Error loading .env.local", e);
        return {};
    }
};

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log("🔍 Starting Deep Content Audit (Spot Check)...\n");

    // 1. Check Scenarios
    console.log("--- checking 'consultant_scenarios' ---");
    const scenarioIds = ['tourist-new', 'investor-citizen', 'company-setup']; // distinct types

    const { data: scenarios, error: sError } = await supabase
        .from('consultant_scenarios')
        .select('id, title, description, steps')
        .in('id', scenarioIds);

    if (sError) {
        console.error("❌ Error fetching scenarios:", sError);
    } else {
        scenarios.forEach(s => {
            console.log(`\n✅ Scenario Found: [${s.id}]`);
            console.log(`   Title: ${s.title}`);
            console.log(`   Description Length: ${s.description?.length} chars`);
            console.log(`   Steps Count: ${Array.isArray(s.steps) ? s.steps.length : 0}`);
            // Check specific fidelity content
            if (s.id === 'tourist-new' && s.description.includes('في 2025 القبول أصعب')) {
                console.log("   🌟 INTEGIRTY MATCH: Description starts with 2025 warning.");
            }
        });
    }

    // 2. Check Articles
    console.log("\n--- checking 'articles' ---");
    const articleId = 'turkish-embassy-beirut-family';
    const { data: article, error: aError } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single();

    if (aError) {
        console.error("❌ Error fetching article:", aError);
    } else {
        console.log(`\n✅ Article Found: [${article.id}]`);
        console.log(`   Title: ${article.title}`);
        console.log(`   Content Length: ${article.content?.length} chars`);
        if (article.content && article.content.includes('VFS Global')) {
            console.log("   🌟 INTEGIRTY MATCH: Content contains 'VFS Global'.");
        }
    }
}

verify();
