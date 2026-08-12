import { Pool } from 'pg';
import 'dotenv/config';

class DatabaseService {
  private db: Pool | null = null;
  private isInitialized = false;

  async getDb(): Promise<Pool> {
    if (!this.db) {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error('DATABASE_URL is not configured');
      }
      this.db = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: Number(process.env.DB_POOL_MAX || 5),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
    }
    if (!this.isInitialized) {
      await this.init();
    }
    return this.db;
  }

  private async init() {
    if (!this.db) return;
    this.isInitialized = true;
    console.log('[THEIAKSHI Backend] Initializing Neon PostgreSQL schema...');
    const { initializeSchema } = await import('./schema.js');
    await initializeSchema(this.db);
    if (process.env.SEED_DATABASE === 'true') {
      const { seedDatabase } = await import('./seed.js');
      await seedDatabase(this.db);
    }
    console.log('[THEIAKSHI Backend] Neon PostgreSQL initialized successfully.');
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[] }> {
    const db = await this.getDb();
    const result = await db.query(sql, params);
    return { rows: result.rows as T[] };
  }

  async exec(sql: string): Promise<void> {
    const db = await this.getDb();
    await db.query(sql);
  }
}

export const dbService = new DatabaseService();
export default dbService;
