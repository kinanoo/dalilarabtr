require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.pulled', override: true });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Read the static file to extract IDs
const fs = require('fs');
const content = fs.readFileSync('./src/lib/consultant-scenarios.ts', 'utf-8');
const staticIds = [...content.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);

async function main() {
  const { data: dbRows } = await supabase.from('consultant_scenarios').select('id, title');
  const dbIds = dbRows.map(r => r.id);

  const staticSet = new Set(staticIds);
  const dbSet = new Set(dbIds);

  const allIds = new Set([...staticIds, ...dbIds]);

  console.log('=== Scenario Counts ===');
  console.log('Static file (consultant-scenarios.ts):', staticIds.length);
  console.log('Database (consultant_scenarios):', dbIds.length);
  console.log('Total unique (merged):', allIds.size);
  console.log('');

  const onlyStatic = staticIds.filter(id => !dbSet.has(id));
  const onlyDB = dbIds.filter(id => !staticSet.has(id));
  const overlap = dbIds.filter(id => staticSet.has(id));

  console.log('In BOTH (overlap):', overlap.length);
  console.log('Only in static file:', onlyStatic.length);
  if (onlyStatic.length > 0) {
    onlyStatic.forEach(id => console.log('  -', id));
  }
  console.log('Only in DB:', onlyDB.length);
  if (onlyDB.length > 0) {
    onlyDB.forEach(id => {
      const row = dbRows.find(r => r.id === id);
      console.log('  -', id, ':', row ? row.title : '');
    });
  }
}
main().catch(console.error);
