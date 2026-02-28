/**
 * Setup news_ticker table + seed initial data
 *
 * Run: npx tsx scripts/setup_news_ticker.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const seedData = [
    {
        text: 'تانجو أوزجان عدو الأجانب والسوريين يدخل السجن بتهمة التحريض على الكراهية',
        link: '/articles',
        is_active: true,
        priority: 1,
    },
    {
        text: 'الكود V-160 يعني عدم تثبيتك للنفوس — راجع شرح الأكواد الأمنية',
        link: '/codes/V160',
        is_active: true,
        priority: 2,
    },
    {
        text: 'تعرّف على غرامات المرور في تركيا 2026 وكيف تتجنبها',
        link: '/articles/traffic-penalties-turkey-2026',
        is_active: true,
        priority: 3,
    },
    {
        text: 'دليل شامل: كيف تحصل على الجنسية التركية عبر الاستثمار العقاري',
        link: '/articles',
        is_active: true,
        priority: 4,
    },
];

async function setup() {
    console.log('Setting up news_ticker table...');

    // Try to create table via RPC (may fail without service role key)
    // If fails, user must run SQL manually
    const createSQL = `
        CREATE TABLE IF NOT EXISTS public.news_ticker (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            text TEXT NOT NULL,
            link TEXT,
            is_active BOOLEAN DEFAULT true,
            priority INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT now()
        );

        ALTER TABLE public.news_ticker ENABLE ROW LEVEL SECURITY;

        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE tablename = 'news_ticker' AND policyname = 'Allow public read news_ticker'
            ) THEN
                CREATE POLICY "Allow public read news_ticker" ON public.news_ticker FOR SELECT USING (is_active = true);
            END IF;
        END
        $$;
    `;

    // Try RPC exec_sql first
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: createSQL });
    if (rpcError) {
        console.log('Could not create table via RPC (expected with anon key).');
        console.log('Please run this SQL in Supabase SQL Editor:\n');
        console.log(createSQL);
        console.log('\nAfter running the SQL, run this script again to seed data.\n');
    } else {
        console.log('Table created successfully via RPC.');
    }

    // Try to seed data regardless (will fail if table doesn't exist)
    console.log('\nSeeding initial data...');

    const { error: insertError } = await supabase
        .from('news_ticker')
        .upsert(seedData.map((item, i) => ({ ...item, id: undefined })));

    if (insertError) {
        console.log('Seed failed (table may not exist yet):', insertError.message);
        console.log('\nRun the SQL above first, then re-run this script.');
    } else {
        console.log(`Seeded ${seedData.length} ticker items successfully!`);
    }

    // Verify
    const { data, count } = await supabase
        .from('news_ticker')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

    if (data) {
        console.log(`\nActive ticker items: ${count}`);
        data.forEach(item => console.log(`  - ${item.text.substring(0, 50)}...`));
    }
}

setup();
