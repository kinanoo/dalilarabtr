
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
    console.error('Error: DATABASE_URL not found in .env.local');
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function runSchema() {
    try {
        const sqlPath = path.join(process.cwd(), '.gemini/antigravity/brain/216b5e27-5425-41da-ab55-931f73e27cab/ensure_zones_table.sql');
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

        console.log('Zones schema updated successfully!');
    } catch (err) {
        console.error('Error running schema update:', err);
    } finally {
        await client.end();
    }
}

runSchema();
