import 'dotenv/config';

export const env = {
  PORT: Number(process.env.PORT) || 3000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
};

// Stop at start-up if the signing secret is missing, instead of failing later
if (!env.JWT_SECRET) {
  throw new Error('JWT_SECRET is missing. Add it to backend/.env');
}
if (env.JWT_SECRET.length < 32) {
  console.warn('Warning: JWT_SECRET is short. Use at least 32 random characters.');
}