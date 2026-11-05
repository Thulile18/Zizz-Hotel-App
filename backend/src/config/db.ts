import * as net from 'net';
import { Pool } from 'pg';
import { env } from './env';

// Node tries each address of the database server one after the other.
// The default wait per attempt (250 ms) is short for a server far away, so we allow 2 seconds.
net.setDefaultAutoSelectFamilyAttemptTimeout(2000);

// Hosted databases only accept encrypted connections. A PostgreSQL on your own computer does not.
// Setting DATABASE_SSL=true in the hosting settings switches encryption on.
// This encrypts the connection but does not check the server's certificate.
const useSsl = env.DATABASE_SSL === 'true';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,                        // at most 10 connections at once
  idleTimeoutMillis: 30000,       // close unused connections after 30 seconds
  connectionTimeoutMillis: 15000, // wait up to 15 seconds for a new connection
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected Postgres pool error:', err.message);
});

export const query = (text: string, params?: unknown[]) => pool.query(text, params);