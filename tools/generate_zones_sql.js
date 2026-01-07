const fs = require('fs');
const path = require('path');

// Paths
const INPUT_FILE = path.join(__dirname, '..', 'public', 'data', 'closed-areas.json');
const OUTPUT_FILE = path.join('C:\\Users\\Dopara\\.gemini\\antigravity\\brain\\216b5e27-5425-41da-ab55-931f73e27cab', 'migration_batch_8_zones.sql');

console.log(`Reading from: ${INPUT_FILE}`);

try {
    const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
    const data = JSON.parse(rawData);

    // Header
    let sql = `-- =============================================\n`;
    sql += `-- 🚀 MIGRATION: BATCH 8 (ZONES)\n`;
    sql += `-- Source: public/data/closed-areas.json\n`;
    sql += `-- Items: ${data.items.length}\n`;
    sql += `-- =============================================\n\n`;

    // 1. Create Table
    sql += `-- 1. Create Zones Table\n`;
    sql += `CREATE TABLE IF NOT EXISTS public.zones (\n`;
    sql += `    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,\n`;
    sql += `    city text NOT NULL,\n`;
    sql += `    district text NOT NULL,\n`;
    sql += `    neighborhood text NOT NULL,\n`;
    sql += `    status text DEFAULT 'closed',\n`;
    sql += `    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL\n`;
    sql += `);\n\n`;

    sql += `-- Enable RLS\n`;
    sql += `ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;\n`;
    sql += `DROP POLICY IF EXISTS "Public Zones Access" ON public.zones;\n`;
    sql += `CREATE POLICY "Public Zones Access" ON public.zones FOR SELECT USING (true);\n\n`;

    // 2. Insert Data
    sql += `-- 2. Insert Data\n`;
    sql += `INSERT INTO public.zones (city, district, neighborhood) VALUES\n`;

    const values = data.items.map(item => {
        // Escape single quotes in names
        const c = item.c.replace(/'/g, "''");
        const d = item.d.replace(/'/g, "''");
        const n = item.n.replace(/'/g, "''");
        return `('${c}', '${d}', '${n}')`;
    });

    sql += values.join(',\n');
    sql += `\nON CONFLICT DO NOTHING;\n`;

    fs.writeFileSync(OUTPUT_FILE, sql);
    console.log(`Successfully generated SQL with ${data.items.length} zones.`);
    console.log(`Saved to: ${OUTPUT_FILE}`);

} catch (err) {
    console.error('Error generating zones SQL:', err);
    process.exit(1);
}
