import 'dotenv/config';

export const env = {
  PORT: Number(process.env.PORT) || 3000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
  DATABASE_SSL: process.env.DATABASE_SSL || '',
};

//  Database Guardrail
if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Please add your Neon connection string to your environment config.');
}

//  Security Guardrail
if (!env.JWT_SECRET) {
  throw new Error('JWT_SECRET is missing. Add it to your environment config.');
}

if (env.JWT_SECRET.length < 32) {
  console.warn('Warning: JWT_SECRET is short. Use at least 32 random characters.');
}
