
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
    const { data, error } = await supabase
        .from('zones')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching one row:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
    } else {
        console.log('Table is empty, cannot inspect columns easily via select. Assuming standard schema or use SQL query to finding columns.');
        // If empty, I will assume I need to create the table properly or it was created with minimalistic cols.
        // Let's try to insert a dummy row to see what fails or just use the migration script to CREATE TABLE IF NOT EXISTS with correct schema.
    }
}

checkSchema();
