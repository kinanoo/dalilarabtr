require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const { data, error } = await supabase.from('consultant_scenarios').select('id, title, category, subcategory, is_active');
  if (error) { console.log('ERROR:', error.message); return; }
  console.log('Total scenarios:', data.length);
  console.log('');

  // Group by category
  const groups = {};
  data.forEach(s => {
    const cat = s.category || 'NULL';
    const sub = s.subcategory || 'NULL';
    const key = cat + ' / ' + sub;
    if (!groups[key]) groups[key] = [];
    groups[key].push({ id: s.id, title: s.title, active: s.is_active });
  });

  Object.keys(groups).sort().forEach(key => {
    console.log('=== ' + key + ' (' + groups[key].length + ') ===');
    groups[key].forEach(s => console.log('  - [' + (s.active !== false ? 'ON' : 'OFF') + '] ' + s.id + ' : ' + s.title));
    console.log('');
  });
}
main().catch(console.error);
