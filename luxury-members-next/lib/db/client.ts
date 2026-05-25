import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  pool = new Pool({ connectionString, max: 10 });
  return pool;
}

export async function dbQuery<T = unknown>(text: string, params: unknown[] = []): Promise<T[]> {
  const p = getDbPool();
  const result = await p.query(text, params);
  return result.rows as T[];
}
