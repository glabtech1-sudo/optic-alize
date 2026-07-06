import pg from 'pg';
import fs from 'fs';
import path from 'path';

export async function runDatabaseMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('[DB MIGRATION] DATABASE_URL is not set. Skipping auto-migration.');
    return;
  }

  console.log('[DB MIGRATION] Connecting to PostgreSQL database to ensure tables exist...');
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('[DB MIGRATION] Connected successfully. Running setup queries...');

    // Read migration SQL
    const migrationFilePath = path.join(process.cwd(), 'supabase_migration.sql');
    if (fs.existsSync(migrationFilePath)) {
      const sqlContent = fs.readFileSync(migrationFilePath, 'utf8');
      
      // Execute all statements
      await client.query(sqlContent);
      console.log('[DB MIGRATION] All database tables and schemas ensured successfully in Supabase (real-time & agency-synchronized).');
    } else {
      console.warn('[DB MIGRATION] Migration file supabase_migration.sql not found.');
    }
  } catch (err: any) {
    console.error('[DB MIGRATION] Error executing database migration:', err?.message || err);
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
}
