
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

// We need a direct connection string (postgres://...)
// Usually Supabase provides this in .env.local as DATABASE_URL or similar.
// If not found, we cannot proceed.
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
    console.error('Error: DATABASE_URL not found in .env.local');
    console.log('Please ensure your .env.local contains the connection string (e.g., postgres://postgres.xxxx:password@aws-0-eu-central-1.pooler.supabase.com:5432/postgres)');
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase in many environments
});

async function runSchemaUpdate() {
    try {
        const sqlPath = path.join(process.cwd(), '.gemini/antigravity/brain/216b5e27-5425-41da-ab55-931f73e27cab/alter_articles_add_missing_cols.sql');
        console.log(`Reading SQL from: ${sqlPath}`);

        if (!fs.existsSync(sqlPath)) {
            console.error('SQL file not found!');
            process.exit(1);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Connecting to database...');
        await client.connect();

        console.log('Executing SQL...');
        await client.query(sql);

        console.log('Schema updated successfully!');
    } catch (err) {
        console.error('Error updating schema:', err);
    } finally {
        await client.end();
    }
}

runSchemaUpdate();
