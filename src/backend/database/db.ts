import { PGlite } from '@electric-sql/pglite';

class DatabaseService {
  private db: PGlite | null = null;
  private isInitialized = false;

  async getDb(): Promise<PGlite> {
    if (!this.db) {
      this.db = new PGlite();
    }
    if (!this.isInitialized) {
      await this.init();
    }
    return this.db;
  }

  private async init() {
    if (!this.db) return;
    this.isInitialized = true;
    console.log('[PostgreSQL PGlite Engine] Initializing database schema...');
    const { initializeSchema } = await import('./schema.js');
    await initializeSchema(this.db);
    const { seedDatabase } = await import('./seed.js');
    await seedDatabase(this.db);
    console.log('[PostgreSQL PGlite Engine] Database initialized & seeded successfully.');
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[] }> {
    const db = await this.getDb();
    const result = await db.query(sql, params);
    return { rows: (result.rows as T[]) || [] };
  }

  async exec(sql: string): Promise<void> {
    const db = await this.getDb();
    await db.exec(sql);
  }
}

export const dbService = new DatabaseService();
export default dbService;
