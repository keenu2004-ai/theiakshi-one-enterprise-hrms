import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';

const { Pool } = pg;

export let dbPool: pg.Pool | null = null;

export async function initDatabase(): Promise<pg.Pool | null> {
  if (!config.databaseUrl) {
    console.warn('[DB] DATABASE_URL not specified in environment. Operating in persistent store mode.');
    return null;
  }

  try {
    console.log('[DB] Connecting to PostgreSQL database pool...');
    dbPool = new Pool({
      connectionString: config.databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
    });

    await dbPool.query('SELECT 1');
    console.log('[DB] PostgreSQL pool connected successfully!');

    // Initialize Schema if schema.sql exists
    try {
      const schemaPath = path.join(process.cwd(), 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
        await dbPool.query(schemaSql);
        console.log('[DB] Schema verified/synchronized.');
      }
    } catch (schemaErr: any) {
      console.warn('[DB] Schema DDL notice (permission or existing structure):', schemaErr.message || schemaErr);
    }

    return dbPool;
  } catch (err: any) {
    console.error('[DB] PostgreSQL pool initialization notice:', err.message || err);
    if (dbPool) {
      try { await dbPool.end(); } catch {}
      dbPool = null;
    }
    return null;
  }
}

export async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  if (dbPool) {
    try {
      const result = await dbPool.query(sql, params);
      return result.rows;
    } catch (err) {
      console.error('[DB Query Error]', err);
      throw err;
    }
  }
  return [];
}
