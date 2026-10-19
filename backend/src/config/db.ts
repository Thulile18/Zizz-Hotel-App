import { Pool } from 'pg';
import { env } from './env';

// A shared set of database connections: up to 10 at once, the rest wait their turn
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});