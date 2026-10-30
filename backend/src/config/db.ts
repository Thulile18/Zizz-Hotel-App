import * as net from 'net';
import { Pool } from 'pg';
import { env } from './../config/env';

// Give each connection attempt 2s instead of Node's default 250ms
// (a round trip from South Africa to Neon in Virginia takes ~250–300ms)
net.setDefaultAutoSelectFamilyAttemptTimeout(2000);

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 80000,       // close unused connections after 30s
  connectionTimeoutMillis: 80000, // wait up to 15s for a new connection
  // :arrow_down: Stripped down to be 100% foolproof for Render
  ssl: { rejectUnauthorized: false }, 
});

pool.on('error', (err) => {
  console.error('Unexpected Postgres pool error:', err.message);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);